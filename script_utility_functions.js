let directionsService;
let directionsRenderer;

function optimizeRoute() {
    if (!directionsService || !directionsRenderer) {
        alert('Google Maps API is not fully initialized.');
        return;
    }

    const waypoints = coordinatesList.slice(1, -1).map(coord => ({
        location: new google.maps.LatLng(coord.lat, coord.lng),
        stopover: true
    }));

    const request = {
        origin: coordinatesList[0],
        destination: coordinatesList[coordinatesList.length - 1],
        waypoints: waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, (response, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(response);

            const route = response.routes[0];
            const summaryPanel = document.getElementById('routeLinks');
            summaryPanel.innerHTML = '';

            for (let i = 0; i < route.legs.length; i++) {
                const routeSegment = i + 1;
                summaryPanel.innerHTML += '<b>Route Segment: ' + routeSegment + '</b><br>';
                summaryPanel.innerHTML += route.legs[i].start_address + ' to ';
                summaryPanel.innerHTML += route.legs[i].end_address + '<br>';
                summaryPanel.innerHTML += route.legs[i].distance.text + '<br><br>';
            }
        } else {
            console.error('Directions request failed due to ' + status);
            alert('Failed to optimize the route. Please try again.');
        }
    });
}
