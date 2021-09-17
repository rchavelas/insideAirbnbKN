'use strict'
document.addEventListener('DOMContentLoaded', function() {
let k = 12;
document.getElementById("kVal").value = k;
// Define initial lat and long
let latitude = 19.359 // 19.409
let longitue = -99.259 // -99.174
document.getElementById("latitude").value = latitude;
document.getElementById("longitude").value = longitue;

// Auxiliary functions
//This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in km)
function getDistance(lat1, lon1, lat2, lon2) {
  var R = 6371; // km
  var dLat = toRad(lat2 - lat1);
  var dLon = toRad(lon2 - lon1);
  var lat1 = toRad(lat1);
  var lat2 = toRad(lat2);
  
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
  Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
}

// Converts numeric degrees to radians
function toRad(Value) {
  return Value * Math.PI / 180;
}

// Mean value
const average = arr => Number(arr.reduce( ( p, c ) => p + c, 0 ) / arr.length,2).toFixed(2);


// A) Initial mapping construction
// Get coordinates of all points
let listingsFilteredLatLonFull =  listingsFull.map(obj => [obj.latitude, obj.longitude])

// Leaflet implementation
let mapboxAttribution = 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'

// Create base layers
let grayscale = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
attribution: mapboxAttribution,
maxZoom: 19,
id: 'mapbox/light-v9',
tileSize: 512,
zoomOffset: -1,
accessToken: 'pk.eyJ1IjoicmNoYXZlbGFzbSIsImEiOiJja3RrMmF5dDIxaGtpMnB1ZWxxcTQ2aXkxIn0.4dbaehtKaqFGIMl1lhtTDg'
})

let  streets = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
attribution: mapboxAttribution,
maxZoom: 19,
id: 'mapbox/streets-v11',
tileSize: 512,
zoomOffset: -1,
accessToken: 'pk.eyJ1IjoicmNoYXZlbGFzbSIsImEiOiJja3RrMmF5dDIxaGtpMnB1ZWxxcTQ2aXkxIn0.4dbaehtKaqFGIMl1lhtTDg'
})

let  satelite = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
attribution: mapboxAttribution,
maxZoom: 19,
id: 'mapbox/satellite-streets-v11',
tileSize: 512,
zoomOffset: -1,
accessToken: 'pk.eyJ1IjoicmNoYXZlbGFzbSIsImEiOiJja3RrMmF5dDIxaGtpMnB1ZWxxcTQ2aXkxIn0.4dbaehtKaqFGIMl1lhtTDg'
})

// Create map object
let mymap = L.map('mapid',{layers: [streets]}).setView([latitude, longitue], 15);

// Plot all points
let pointArr = L.layerGroup();
for (let i = 0; i < listingsFilteredLatLonFull.length; i++) {
  let marker = L.circleMarker([listingsFilteredLatLonFull[i][0], listingsFilteredLatLonFull[i][1]],
    {radius: 5,stroke: false,fillOpacity: 0.40,fillColor:"#ff585d"}).addTo(pointArr);
  }
pointArr.addTo(mymap)

// Create Layer control
let baseMaps = {
"Grayscale": grayscale,
"Streets": streets,
"Satellite": satelite
};
let overlayMaps = {
"All listings": pointArr
};
L.control.layers(baseMaps, overlayMaps,{collapsed: false}).addTo(mymap);

// Create airbnb icon
let airbnbIcon = L.icon({
  iconUrl: 'icon/airbnb_twitter.png',
  iconSize:     [20, 20], // size of the icon
  iconAnchor:   [10, 10], // point of the icon which will correspond to marker's location
  popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
});

// B) condition-based mapping construction elements
// Create layer grouping
let inputArr = L.layerGroup();
inputArr.addTo(mymap)
// Main function

function plotKnn(){
  // Input 
  let latInput = document.getElementById("latitude").value;
  let lonInput = document.getElementById("longitude").value;
  let kInput = document.getElementById("kVal").value

  // Filter obs based on some criteria
  let listingsFiltered = [...listingsFull]//.filter((obs, index) => (index < 2000))

// Compute distance from target lan and long to every obsv
//getDistance(1,1,2,2)
let listingsFilteredDistance = 
listingsFiltered.map((obs, index) => {
  return {
    index: index,
    distance: getDistance(latInput, lonInput,obs.latitude, obs.longitude)};
  });
  
  // Get index of k nearest neighbors
  listingsFilteredDistance.sort(function(a,b){return a.distance - b.distance})
  let listingsFilteredDistanceIndex = listingsFilteredDistance.filter((obs, index) => (index < kInput)).map(obs => obs.index)
  
  // Get coordinates, price and URL (Pending) of k nearest neighbourgs
  let listingsFilteredLatLon =  listingsFiltered.filter((obj,index) => {
    return listingsFilteredDistanceIndex.includes(index)
  }).map(obj => [obj.latitude, obj.longitude, obj.price, obj.listing_url])
  console.table(listingsFilteredLatLon)
  
  // Compute prices and update dom elements
  let listingsFilteredLatLonPrices = listingsFilteredLatLon.map(elem=>elem[2])
  document.getElementById("avgtdTag").innerText = `$${average(listingsFilteredLatLonPrices)}`;
  document.getElementById("maxtdTag").innerText = `$${Math.max(...listingsFilteredLatLonPrices).toFixed(2)}`;
  document.getElementById("mintdTag").innerText = `$${Math.min(...listingsFilteredLatLonPrices).toFixed(2)}`;


  // Nice little trick to remove layer grouping elements from: https://jsfiddle.net/chk1/g2zcrhr1/
  inputArr.clearLayers()
  // Create marker
  let marker = L.marker([latInput, lonInput]).addTo(inputArr);
  marker.bindPopup(`<b>Latitude:</b> ${latInput} <br> <b>Longitude:</b> ${lonInput}
  <br>See location @ <a href=https://www.google.com.mx/maps/@${latInput},${lonInput},17z target="_blank">Google Maps</a>`).openPopup();
  // Plot k nearest neigbors
  for (let i = 0; i < listingsFilteredLatLon.length; i++) {
    marker = new L.Marker([listingsFilteredLatLon[i][0], listingsFilteredLatLon[i][1]],{opacity:1, icon: airbnbIcon})
    .bindPopup(`<b>Price:</b> $${listingsFilteredLatLon[i][2]} <br> Go to <a href=${listingsFilteredLatLon[i][3]} target="_blank"> Airbnb listing </a>`)
    .addTo(inputArr);
  }

  // Fly to selected location
  mymap.flyTo([latInput, lonInput])

  // Update labels on Materialize
  M.updateTextFields();
};

plotKnn()
mymap.flyTo([latitude, longitue], 17)

// Map event listeners
// Plot points on knn routine
document.getElementById("relocateButton").addEventListener("click", plotKnn);
// Get coordinates and run knn on map click
mymap.on('click', function(e){
  let coord = e.latlng;
  let lat = coord.lat;
  let lng = coord.lng;
  document.getElementById("latitude").value = lat.toFixed(3);
  document.getElementById("longitude").value = lng.toFixed(3);
  plotKnn()
  //console.log("You clicked the map at latitude: " + lat + " and longitude: " + lng);
  });
});
