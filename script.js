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
let previousLatLng = fixedLatLng;
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
        console.log(upcData); // Debug: Output the loaded data
        alert('File loaded successfully.');
    };

    reader.readAsArrayBuffer(file);
});

document.getElementById('generateRoute').addEventListener('click', function() {
    const upcInput = document.getElementById('upcInput').value.trim();
    const coordinate = upcData.find(row => row.UPC == upcInput); // Use == to compare numbers and strings

    if (!coordinate) {
        alert('UPC not found.');
        return;
    }

    const x = parseFloat(coordinate.X_Coord);
    const y = parseFloat(coordinate.Y_Coord);

    if (!validateCoordinates(y, x)) {
        alert('Invalid coordinates.');
        return;
    }

    const newCoordinate = { lat: y, lng: x };
    console.log(newCoordinate); // Debug: Output the new coordinate

    // Change the starting location to the previously used coordinates
    coordinatesList = [previousLatLng, newCoordinate, fixedLatLng];
    previousLatLng = newCoordinate;

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

function validateCoordinates(lat, lng) {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function optimizeRoute() {
    const waypoints = coordinatesList.slice(1, -1).map(coord => ({
        location: coord,
        stopover: true
    }));

    console.log(waypoints); // Debug: Output waypoints

    directionsService.route(
        {
            origin: coordinatesList[0],
            destination: coordinatesList[coordinatesList.length - 1],
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
                        optimizedWaypoints = [coordinatesList[0], ...waypointOrder.map(i => coordinatesList[i + 1]), coordinatesList[coordinatesList.length - 1]];

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
