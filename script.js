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
const fixedLatLng = { lat: 35.08311798408951, lng: -106.65268048650623 };
let upcData = [];

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: fixedLatLng,
        zoom: 12
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
}

document.getElementById('coordinatesFile').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);
        upcData = json;
        alert('File loaded successfully.');
    };

    reader.readAsArrayBuffer(file);
});

document.getElementById('generateRoute').addEventListener('click', function() {
    const upcInput = document.getElementById('upcInput').value.trim();
    const coordinate = upcData.find(row => row.UPC === upcInput);

    if (!coordinate) {
        alert('UPC not found.');
        return;
    }

    const x = coordinate.X;
    const y = coordinate.Y;
    const newCoordinate = { lat: parseFloat(y), lng: parseFloat(x) };

    coordinatesList = [fixedLatLng, newCoordinate, fixedLatLng];

    currentSegmentIndex = 0;
    cumulativeDistance = 0;
    cumulativeDuration = 0;
    distanceValues = [];
    durationValues = [];
    document.getElementById('generateRoute').disabled = false;
    document.getElementById('viewPreviousSegment').disabled = true;
    document.getElementById('routeLinks').innerHTML = '';
    document.getElementById('routeStats').innerHTML = '';

    if (typeof google !== 'undefined' && google.maps && google.maps.DirectionsService) {
        optimizeRoute();
    } else {
        alert('Google Maps API is not loaded.');
    }
});

document.getElementById('viewPreviousSegment').addEventListener('click', function() {
    if (currentSegmentIndex > 1) {
        currentSegmentIndex -= 2; // Move back two steps to get the previous segment
        generateNextSegment(true); // true indicates moving back
    }
});

function optimizeRoute() {
    const waypoints = coordinatesList.slice(1, -1).map(coord => ({
        location: coord,
        stopover: true
    }));

    directionsService.route(
        {
            origin: fixedLatLng,
            destination: fixedLatLng,
            waypoints: waypoints,
            optimizeWaypoints: true,
            travelMode: google.maps.TravelMode.DRIVING
        },
        (response, status) => {
            console.log("Directions response:", response);
            if (status === 'OK') {
                if (response && response.routes && response.routes.length > 0) {
                    const route = response.routes[0];
                    if (route && route.waypoint_order) {
                        console.log("Optimized route:", route);

                        const waypointOrder = route.waypoint_order;
                        optimizedWaypoints = [fixedLatLng, ...waypointOrder.map(i => coordinatesList[i + 1]), fixedLatLng];

                        generateNextSegment();
                    } else {
                        console.error('No waypoint_order found in route:', route);
                        alert('No waypoint_order found. Please check the coordinates and try again.');
                    }
                } else {
                    console.error('No routes found in response:', response);
                    alert('No routes found. Please check the coordinates and try again.');
                }
            } else {
                console.error('Directions request failed due to:', status);
                alert('Directions request failed due to ' + status);
            }
        }
    );
}

function generateNextSegment(isBack = false) {
    if (currentSegmentIndex >= optimizedWaypoints.length - 1) {
        document.getElementById('routeStats').innerHTML = `<b>Route Complete!</b>`;
        document.getElementById('generateRoute').disabled = true; // Disable button
        document.getElementById('viewPreviousSegment').disabled = true; // Disable button
        return;
    }

    const origin = optimizedWaypoints[currentSegmentIndex];
    const destination = optimizedWaypoints[currentSegmentIndex + 1];
    currentSegmentIndex++;

    directionsService.route(
        {
            origin: origin,
            destination: destination,
            travelMode: google.maps.TravelMode.DRIVING
        },
        (response, status) => {
            console.log("Segment response:", response);
            if (status === 'OK') {
                directionsRenderer.setDirections(response);

                const route = response.routes[0];
                const summaryPanel = document.getElementById('routeLinks');
                const statsPanel = document.getElementById('routeStats');
                summaryPanel.innerHTML = '';

                const segmentRouteLink = createSegmentRouteLink(origin, destination);
                summaryPanel.innerHTML += `<a href="${segmentRouteLink}" target="_blank">Segment Route Link</a><br><br>`;

                const leg = route.legs[0];
                if (isBack) {
                    cumulativeDistance -= distanceValues.pop();
                    cumulativeDuration -= durationValues.pop();
                } else {
                    distanceValues.push(leg.distance.value);
                    durationValues.push(leg.duration.value);
                    cumulativeDistance += leg.distance.value;
                    cumulativeDuration += leg.duration.value;
                }
                statsPanel.innerHTML = `<div class="route-info"><b>Current Segment:</b><br>`;
                statsPanel.innerHTML += `${leg.start_address} to ${leg.end_address}<br>`;
                statsPanel.innerHTML += `${leg.distance.text} - ${leg.duration.text}<br></div>`;

                const totalDistanceMiles = (cumulativeDistance / 1609.34).toFixed(2);
                const totalDurationHours = (cumulativeDuration / 3600).toFixed(2);
                statsPanel.innerHTML += `<b>Total Distance:</b> ${totalDistanceMiles} miles<br>`;
                statsPanel.innerHTML += `<b>Total Duration:</b> ${totalDurationHours} hours<br>`;

                // Enable the "View Previous Segment" button if there is a previous segment
                document.getElementById('viewPreviousSegment').disabled = currentSegmentIndex <= 1;
            } else {
                console.error('Directions request failed due to:', status);
                alert('Directions request failed due to ' + status);
            }
        }
    );
}

function createSegmentRouteLink(origin, destination) {
    const originStr = `${origin.lat},${origin.lng}`;
    const destinationStr = `${destination.lat},${destination.lng}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destinationStr}`;
}
