let coordinatesList = [];
let optimizedWaypoints = [];
let currentSegmentIndex = 0;
let cumulativeDistance = 0;
let cumulativeDuration = 0;
let distanceValues = [];
let durationValues = [];
let savedRoutes = [];
let upcCount = 0;
let fixedLatLng = null;
let previousLatLng = null;
let upcData = [];
let previousUPCs = [];
let enteredUPCs = new Set();

function initMap() {
    // Initialization code moved here
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
}

document.querySelectorAll('.garage-button').forEach(button => {
    button.addEventListener('click', function() {
        const lat = parseFloat(button.getAttribute('data-lat'));
        const lng = parseFloat(button.getAttribute('data-lng'));
        fixedLatLng = { lat, lng };
        previousLatLng = fixedLatLng;
        map.setCenter(fixedLatLng);
    });
});
