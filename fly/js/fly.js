dojo.require('esri.map');
dojo.require('esri.graphic');
dojo.require('esri.geometry');
dojo.require('esri.tasks.geometry');
var map, planeG, gameTickInterval, destP, destG, time, plane;
var items = ['trousers', 'sour pickles', 'ice axes', 'trombones', 'voodoo dolls'];
function init() {
  require(['dojo/text!./places.json', 'dojo/text!./plane.json'], function (a, b) {
    capitals = JSON.parse(a);
    planeG = JSON.parse(b);
    map = new esri.Map('mapDiv', {basemap: 'streets',center: [-100, 50],
      zoom: 3 });
  });
}
function pickOne(array) {return array[Math.floor(Math.random()*array.length)]}
function start() {
  document.getElementById('start').disabled = true;
  time = 0;
  var from = capitals[Math.floor(Math.random() * capitals.length)];
  var dest = pickOne(capitals);
  document.getElementById('instructions').className = 'message';
  document.getElementById('what').innerHTML = pickOne(items);
  document.getElementById('where').innerHTML = dest.capital + ', ' + dest.country;
  destP = new esri.geometry.Point(dest.y, dest.x);
  destG = new esri.Graphic(destP, new esri.symbol.SimpleMarkerSymbol())
  map.graphics.add(destG);
  if (!plane) {
    plane = new esri.Graphic(planeG);
    map.graphics.add(plane);
    plane.cent = { x:-1663297.5653581168, y: 6448545.565071885};
    plane.rot = 1.57079633; // 12 o'clock
  }
  gameTickInterval = window.setInterval(tick, 33);
  document.onkeypress = function (e) {
    var c = e.charCode;
    if (c === 97) rotate(plane, 10);
    else if (c === 100) rotate(plane, -10);
  }
}
function tick() {
  document.getElementById('userMessage').innerHTML = (++time);
  if (time % 50 === 0) map.centerAt(new esri.geometry.Point([plane.cent.x, plane.cent.y], new esri.SpatialReference({ wkid:102100 })));
  move(plane, 2);
}
function move(feature, distance) {
  var g = feature.geometry;
  var change = {
    x: Math.cos(feature.rot) * distance * 5,
    y: Math.sin(feature.rot) * distance * 5
  }
  for (var r in g.paths[0]) {
    var p = g.paths[0][r];
    p[0] = p[0] + change.x * 10000;
    p[1] = p[1] + change.y * 10000;
  }
  feature.cent = {
    x: feature.cent.x + change.x * 10000,
    y: feature.cent.y + change.y * 10000
  };
  feature.setGeometry(g);
  var planeExtent = new esri.geometry.Polyline(g.toJson()).getExtent();
  console.log('plane ext=', planeExtent, 'point',destP);
  if (planeExtent.intersects(destP)) stop();
}
function stop() {
  window.clearInterval(gameTickInterval);
  document.getElementById('start').disabled = false;
  map.graphics.remove(destG);
  document.onkeypress = null;
}
var rotate = function (feature, angle) {
  var newGeom = feature.geometry;
  var a = angle * Math.PI / 180;
  feature.rot += a;
  var c = feature.cent;
  for (var rIndex in newGeom.paths[0]) {
    var p = newGeom.paths[0][rIndex];
    var xR = c.x + Math.cos(a) * (p[0] - c.x) - Math.sin(a) * (p[1] - c.y);
    var yR = c.y + Math.sin(a) * (p[0] - c.x) + Math.cos(a) * (p[1] - c.y);
    p[0] = xR;
    p[1] = yR;
  }
  feature.setGeometry(newGeom);
}
dojo.ready(init);