dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("esri.map");
dojo.require("esri.layers.graphics");
dojo.require("esri.layers.FeatureLayer");
dojo.require("esri.dijit.Popup");
dojo.require("esri.dijit.OverviewMap");
var currentSlide = 0;
var map;
var featureLayer;
var weatherIconMap = [
		'storm', 'storm', 'storm', 'lightning', 'lightning', 'snow', 'hail', 'hail',
		'drizzle', 'drizzle', 'rain', 'rain', 'rain', 'snow', 'snow', 'snow', 'snow',
		'hail', 'hail', 'fog', 'fog', 'fog', 'fog', 'wind', 'wind', 'snowflake',
		'cloud', 'cloud_moon', 'cloud_sun', 'cloud_moon', 'cloud_sun', 'moon', 'sun',
		'moon', 'sun', 'hail', 'sun', 'lightning', 'lightning', 'lightning', 'rain',
		'snowflake', 'snowflake', 'snowflake', 'cloud', 'rain', 'snow', 'lightning'
	];
function init() {
	map = new esri.Map("map", {	basemap: "gray", center: [-28,40], zoom: 4 });
	dojo.connect(map, "onLoad", function(theMap) {
		var oviewMap = new esri.dijit.OverviewMap({ map: map, visible: true });
		oviewMap.startup(); });
	if (featureLayer) return;
    setStyle("progress", "progress");
	var infoTemplate = new esri.InfoTemplate();
	infoTemplate.setTitle("City Info");
	infoTemplate.setContent(getWindowContent);
    featureLayer = new esri.layers.FeatureLayer("http://services.arcgis.com/oKgs2tbjK6zwTdvi/arcgis/rest/services/Major_World_Cities/FeatureServer/0", {
        mode: esri.layers.FeatureLayer.MODE_SNAPSHOT, outFields: ["*"],
        opacity: .90, infoTemplate: infoTemplate });
    var symbol = createPictureSymbol("images/blue-dot-small.png", 0, 1, 12);
    featureLayer.renderer = new esri.renderer.SimpleRenderer(symbol);
    map.addLayer(featureLayer);
	map.infoWindow.resize(400, 275);
    dojo.connect(featureLayer,"onSelectionComplete", function (features) {
        var extent;
        for (var i = 0; i < features.length; i++) {
            if (!extent) extent = features[i]._extent;
            else extent.union(features[i]._extent);
        }
        if (extent) map.setExtent(extent);
        setStyle("progress", "progress hidden");				
    });
}
function createPictureSymbol(url, xOffset, yOffset, size) {
    return new esri.symbol.PictureMarkerSymbol({ "angle": 0, "xoffset": xOffset, "yoffset": yOffset, "type": "esriPMS",
        "url": url, "contentType": "image/png", "width":size, "height": size });
}
function setStyle(elementName, className) {
    var element = document.getElementById(elementName);
    if (element) element.className = className;
}
function getWindowContent(graphic) {
	var results;
	var q = "select * from geo.places where text='"+graphic.attributes.NAME + " " + graphic.attributes.COUNTRY+"'";
	var yql = "http://query.yahooapis.com/v1/public/yql?q="+encodeURIComponent(q)+"&format=json";
	var woeid, content;
	$.ajax({
	async: false, url: yql, dataType: "json",
	success: function(r) {
        if(r.query.count == 1){ woeid = r.query.results.place.woeid; }
		else if(r.query.count > 1){ woeid = r.query.results.place[0].woeid; }
		q = "select * from weather.forecast where woeid="+woeid+" and u='c'";
		yql = "http://query.yahooapis.com/v1/public/yql?q="+encodeURIComponent(q)+"&format=json";
		$.ajax({
		 async: false, url: yql, dataType: "json",
		 success: function(r) {
		    if (r.query.results.channel.item.title == 'City not found'){
				content = '<p>Information unavailable</p>'; }
			else{
				var item = r.query.results.channel.item.condition;
				content = '<div id="weather" class="loaded" ><ul id="scroller">' +
					'<li><img src="images/icons/'+ weatherIconMap[item.code] +'.png" /><p class="day">Now</p> <p class="cond">'+ item.text + ' <b>'+item.temp+'°C</b></p></li>';
			for (var i=0;i<2;i++){
			item = r.query.results.channel.item.forecast[i];
			content += '<li><img src="images/icons/'+ weatherIconMap[item.code] +'.png" /><p class="day">'+item.day+'</p> <p class="cond">'+ item.text + ' <b>'+item.low+'°C / '+item.high+'°C</b></p></li>';
			}
			content += '</ul><button onclick="showPrevSlide()" class="arrow previous">Prev</button>' +
        	'<button onclick="showNextSlide()" class="arrow next">Next</button></div>';
			}
		}});
    }});
	currentSlide = 0;
	return content;
}
function showPrevSlide() { showSlide(currentSlide-1); }
function showNextSlide() { showSlide(currentSlide+1); }
function showSlide(i){
	var weatherDiv = $('#weather');
	var scroller = $('#scroller');
	var items = scroller.find('li');
	if (i >= items.length || i < 0 || scroller.is(':animated')){ return false; }
	weatherDiv.removeClass('first last');
	if(i == 0){ weatherDiv.addClass('first'); }
	else if (i == items.length-1){ weatherDiv.addClass('last'); }
	scroller.animate({left:(-i*100)+'%'}, function(){ currentSlide = i; });
}
dojo.ready(init);