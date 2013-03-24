dojo.require('esri.map');
dojo.require("esri.graphic");
dojo.require("esri.geometry");
dojo.require("esri.tasks.geometry");

var map, planeGeometry, gameTickInterval, directionPoint, directionGraphics, time, plane;

var items = ['trousers','pickles', 'diamonds'];
var init = function () {
   require( [ 'dojo/text!./places.json', 'dojo/text!./plane.json'], 
    function( capitalsData, planeData ) {
    capitals = JSON.parse( capitalsData );
    planeGeometry = JSON.parse(planeData);//console.log(data);
    var options = {
        basemap: 'streets',
        center: [-100, 50],
        zoom: 3
    };
    map = new esri.Map('mapDiv', options);
}
   );}
var start = function () {
   time = 0;
    var from = capitals[Math.floor(Math.random() * capitals.length)];
    var direction = capitals[Math.floor(Math.random() * capitals.length)];
    document.getElementById("where").innerHTML = direction.capital+', '+ direction.country;
    directionPoint = new esri.geometry.Point(direction.y, direction.x);
    directionGraphics = new esri.Graphic(directionPoint, new esri.symbol.SimpleMarkerSymbol())
    map.graphics.add(directionGraphics);
    
    if (!plane) {
    plane = new esri.Graphic(planeGeometry);
    map.graphics.add(plane);
    plane.cent = _getCent(plane);
    plane.rot = 1.57079633; // 90 deg
    }
    gameTickInterval = window.setInterval(tick, 33);

    document.onkeypress = function(e) {
       var c = e.charCode;
       if (c === 97) {
          rotate(plane, 10);
      }
       else if (c=== 100) {
          rotate(plane, -10);
      }
   }
}
var tick = function () {
    document.getElementById("userMessage").innerHTML = (++time);
    move(plane, 2);
}
var move = function (feature, distance) {
    var newGeom = feature.geometry;
    var symb = feature.symbol
    var change = {
       x: Math.cos(feature.rot) * distance * 5,
       y: Math.sin(feature.rot) * distance * 5
   }
    for (var r in newGeom.paths[0]) {
        var ring = newGeom.paths[0][r];
        ring[0] = ring[0] + change.x * 10000;
        ring[1] = ring[1] + change.y * 10000;
    }
    feature.cent = {x : feature.cent.x + change.x * 10000, y: feature.cent.y + change.y * 10000};
    var j = newGeom.toJson();
    var pol = new esri.geometry.Polyline(j);
    var planeExtent =  pol.getExtent();
    feature.setGeometry(newGeom);
    if (planeExtent.intersects(directionPoint)) {
       stop();
    
   };
}
var stop = function() {
   window.clearInterval(gameTickInterval);
   map.graphics.remove(directionGraphics);
      document.onkeypress = null;
}
var _getCent = function(geom) {
   return  {
        x: geom._extent.xmin + Math.abs(geom._extent.xmax - geom._extent.xmin) / 2,
        y: geom._extent.ymin + Math.abs(geom._extent.ymax - geom._extent.ymin) / 2,
    }
}
var rotate = function (feature, angle) {
    var newGeom = feature.geometry;
    angle = angle * Math.PI / 180;
    feature.rot += angle;
    var center = feature.cent;
    for (var r in newGeom.paths[0]) {
        var ring = newGeom.paths[0][r];
        var xRot = center.x + Math.cos(angle) * (ring[0] - center.x) - Math.sin(angle) * (ring[1] - center.y)
        var yRot = center.y + Math.sin(angle) * (ring[0] - center.x) + Math.cos(angle) * (ring[1] - center.y);
        ring[0] = xRot;
        ring[1] = yRot;
    }
    feature.setGeometry(newGeom);
}
dojo.ready(init);