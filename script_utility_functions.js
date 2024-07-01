function validateCoordinates(lat, lng) {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function optimizeRoute() {
    const waypoints = coordinatesList.slice(1, -1).map(coord => ({
        location: coord,
        stopover: true
    }));

    console.log('Waypoints:', waypoints); // Debug: Output waypoints

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

                        generateFullRoute();
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
                handleDirectionsError(status);
            }
        }
    );
}

function generateFullRoute() {
    const waypoints = optimizedWaypoints.slice(1, -1).map(coord => ({
        location: coord,
        stopover: true
    }));

    directionsService.route(
        {
            origin: optimizedWaypoints[0],
            destination: optimizedWaypoints[optimizedWaypoints.length - 1],
            waypoints: waypoints,
            travelMode: google.maps.TravelMode.DRIVING
        },
        (response, status) => {
            console.log("Full route response:", response);
            if (status === 'OK') {
                directionsRenderer.setDirections(response);
                
                const route = response.routes[0];
                const summaryPanel = document.getElementById('routeLinks');
                const statsPanel = document.getElementById('routeStats');
                summaryPanel.innerHTML = '';
                
                route.legs.forEach((leg, index) => {
                    const segmentRouteLink = createSegmentRouteLink(leg.start_location, leg.end_location);
                    summaryPanel.innerHTML += `<a href="${segmentRouteLink}" target="_blank">Segment ${index + 1} Route Link</a><br><br>`;
                    saveCurrentRoute(leg.start_location, leg.end_location, leg.distance.text, leg.duration.text, segmentRouteLink);
                });
                
                const totalDistanceMiles = (route.legs.reduce((acc, leg) => acc + leg.distance.value, 0) / 1609.34).toFixed(2);
                const totalDurationHours = (route.legs.reduce((acc, leg) => acc + leg.duration.value, 0) / 3600).toFixed(2);
                statsPanel.innerHTML = `<b>Total Distance:</b> ${totalDistanceMiles} miles<br>`;
                statsPanel.innerHTML += `<b>Total Duration:</b> ${totalDurationHours} hours<br>`;
                
                document.getElementById('resetRoute').disabled = false;
                document.getElementById('exportRoutes').disabled = false;
            } else {
                console.error('Full route request failed due to:', status);
                alert('Full route request failed due to ' + status);
                handleDirectionsError(status);
            }
        }
    );
}

function handleDirectionsError(status) {
    switch (status) {
        case 'NOT_FOUND':
            alert('One of the locations specified in the request\'s origin, destination, or waypoints could not be geocoded.');
            break;
        case 'ZERO_RESULTS':
            alert('No route could be found between the origin and destination.');
            break;
        case 'MAX_WAYPOINTS_EXCEEDED':
            alert('Too many waypoints were provided in the request.');
            break;
        case 'INVALID_REQUEST':
            alert('The provided request was invalid.');
            break;
        case 'OVER_QUERY_LIMIT':
            alert('The service has received too many requests from your application within the allowed time period.');
            break;
        case 'REQUEST_DENIED':
            alert('The service denied the use of the Directions service by your application.');
            break;
        case 'UNKNOWN_ERROR':
            alert('A directions request could not be processed due to a server error. Please try again.');
            break;
        default:
            alert('An unknown error occurred.');
            break;
    }
}

function saveCurrentRoute(origin, destination, distance, duration, link) {
    const routeDetails = {
        origin: `${origin.lat()},${origin.lng()}`,
        destination: `${destination.lat()},${destination.lng()}`,
        distance: distance,
        duration: duration,
        link: link
    };
    savedRoutes.push(routeDetails);
}

function createSegmentRouteLink(origin, destination) {
    const originStr = `${origin.lat()},${origin.lng()}`;
    const destinationStr = `${destination.lat()},${destination.lng()}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destinationStr}`;
}

function exportRoutesToCSV(routes) {
    const headers = ['Origin', 'Destination', 'Distance', 'Duration', 'Link'];
    const csvContent = [
        headers.join(','),
        ...routes.map(route => [route.origin, route.destination, route.distance, route.duration, route.link].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'routes.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
