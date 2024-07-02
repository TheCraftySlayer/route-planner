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

            // For each route segment, display summary information
            for (let i = 0; i < route.legs.length; i++) {
                const routeSegment = i + 1;
                summaryPanel.innerHTML += '<b>Route Segment: ' + routeSegment + '</b><br>';
                summaryPanel.innerHTML += route.legs[i].start_address + ' to ';
                summaryPanel.innerHTML += route.legs[i].end_address + '<br>';
                summaryPanel.innerHTML += route.legs[i].distance.text + '<br><br>';
            }

            // Calculate and display the total distance and duration
            const routeStats = document.getElementById('routeStats');
            const totalDistance = route.legs.reduce((sum, leg) => sum + leg.distance.value, 0);
            const totalDuration = route.legs.reduce((sum, leg) => sum + leg.duration.value, 0);
            routeStats.innerHTML = `Total Distance: ${(totalDistance / 1000).toFixed(2)} km<br>Total Duration: ${(totalDuration / 60).toFixed(2)} mins`;

            // Enable the export and send email buttons
            document.getElementById('exportRoutes').disabled = false;
            document.getElementById('sendEmail').disabled = false;
        } else {
            console.error('Directions request failed due to ' + status);
            alert('Failed to optimize the route. Please try again.');
        }
    });
}

function exportRoutesToCSV(routes) {
    const csvContent = "data:text/csv;charset=utf-8,"
        + routes.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "routes.csv");
    document.body.appendChild(link); // Required for FF

    link.click();
}
