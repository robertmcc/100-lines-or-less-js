dojo.require('esri.map');
dojo.require('esri.graphic');
dojo.require('esri.geometry');
dojo.require('esri.tasks.geometry');
var map, planeG, gameTickInterval, destP, destG, time, plane, kbrd=false;
var items=['trousers','sour pickles','ice axes','trombones','voodoo dolls'];
function init() {
require(['dojo/text!./places.json', 'dojo/text!./plane.json'],function (a,b) {
    capitals = JSON.parse(a);
    planeG = JSON.parse(b);
    map=new esri.Map('mapDiv',{basemap:'streets',center:[-100,50],zoom:3});
  });
}
function pickOne(array) {return array[Math.floor(Math.random()*array.length)]}
function start() {
  document.getElementById('start').disabled = true;
  document.getElementById('summary').className = 'invisible';
  time = 0;
  var from = capitals[Math.floor(Math.random() * capitals.length)];
  var dest = pickOne(capitals);
  document.getElementById('instructions').className = 'message';
  document.getElementById('what').innerHTML = pickOne(items);
  document.getElementById('where').innerHTML=dest.capital+', '+dest.country;
  destP = new esri.geometry.Point(dest.y, dest.x);
  destG = new esri.Graphic(destP, new esri.symbol.SimpleMarkerSymbol())
  map.graphics.add(destG);
  if (!plane) {
    plane = new esri.Graphic(planeG);
    map.graphics.add(plane);
    plane.cent = { x:-1663297.5653581168, y: 6448545.565071885};
    plane.rot = 1.57079633; // 12 o'clock due to how plane drew
    rotate(plane, 90);
  }
  window.onkeypress = function (e) {
    var c = e.charCode;
    if (c in {97:'a',122:'z',91:'['}) { rotate(plane, 10, true); }
    else if (c in {100:'d', 93:']', 120:'x'}) { rotate(plane, -10, true); }
  }
  gameTickInterval = window.setInterval(tick, 33);
}
function tick() {
  document.getElementById('userMessage').innerHTML=Math.floor((++time)/30.303);
  if (time % 50 === 0) { map.centerAt(new esri.geometry.Point([plane.cent.x,
      plane.cent.y], new esri.SpatialReference({ wkid:102100 }))); }
  if (time > 50 && !kbrd) {
    document.getElementById('help').className='help';
    kbrd = true;
  }
  move(plane, 2);
}
function move(feature, distance) {
  var g = feature.geometry;
  var change = {
    x: Math.cos(feature.rot) * distance * 50000,
    y: Math.sin(feature.rot) * distance * 50000
  }
  teleport(feature, change.x, change.y);
  if (feature.cent.x < -20037508.3417) { teleport(plane, 20037508.3417*2, 0); }
  if (feature.cent.y >  19999999) { teleport(plane, 0, -19999999*2); }
  if (feature.cent.x > 20037508.3417) { teleport(plane, -20037508.3417*2, 0); }
  if (feature.cent.y < -19999999) { teleport(plane, 0, 19999999*2); }
}
function teleport(plane, x, y) {
  var g = plane.geometry;
  for (var r in g.paths[0]) {
    g.paths[0][r][0] = g.paths[0][r][0] + x;
    g.paths[0][r][1] = g.paths[0][r][1] + y;
  }
  plane.cent = { x: plane.cent.x + x, y: plane.cent.y + y };
  plane.setGeometry(g);
  var planeExtent = new esri.geometry.Polyline(g.toJson()).getExtent();
  if (planeExtent.intersects(destP)) { stop(); }
}
function stop() {
  window.clearInterval(gameTickInterval);
  document.getElementById('start').disabled = false;
  document.getElementById('summary').className = 'summary';
  document.getElementById('result').innerHTML = Math.floor(time / 30.303);
  map.graphics.remove(destG);
  window.onkeypress = null;
}
var rotate = function (feature, angle, fromUser) {
  if (fromUser) {kbrd = true; }
  document.getElementById('help').className='invisible';
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