let map;
let directionsService;
let directionsRenderer;
let coordinatesList = [];
let optimizedWaypoints = [];
let currentSegmentIndex = 0;
let cumulativeDistance = 0;
let cumulativeDuration = 0;
let distanceValues = [];
let durationValues = [];
let savedRoutes = [];
let upcCount = 0;
const fixedLatLng = { lat: 35.0830696689992, lng: -106.65265903204866 };
let previousLatLng = fixedLatLng;
let upcData = [];
let previousUPCs = [];
let enteredUPCs = new Set(); // Set to store unique UPCs

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: fixedLatLng,
        zoom: 12
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
}
