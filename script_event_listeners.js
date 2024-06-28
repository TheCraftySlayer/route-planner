document.getElementById('coordinatesFile').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);
        upcData = json;
        console.log('Loaded UPC data:', upcData); // Debug: Output the loaded data
        alert('File loaded successfully.');
    };

    reader.readAsArrayBuffer(file);
});

document.getElementById('generateRoute').addEventListener('click', function() {
    const upcInput = document.getElementById('upcInput').value.trim();
    const upcList = upcInput.split(/[\s,]+/); // Split by commas or whitespace
    let validUPCs = [];

    upcList.forEach(upc => {
        const coordinate = upcData.find(row => row.UPC == upc); // Use == to compare numbers and strings
        if (coordinate) {
            const x = parseFloat(coordinate.X_Coord);
            const y = parseFloat(coordinate.Y_Coord);

            if (validateCoordinates(y, x)) {
                validUPCs.push({ upc, lat: y, lng: x });
                enteredUPCs.add(upc); // Add to the set of unique UPCs
            } else {
                console.warn(`Invalid coordinates for UPC: ${upc} - X: ${x}, Y: ${y}`);
            }
        } else {
            console.warn(`UPC not found: ${upc}`);
        }
    });

    console.log('Valid UPCs:', validUPCs);

    if (validUPCs.length === 0) {
        alert('No valid UPCs found.');
        return;
    }

    coordinatesList = [fixedLatLng, ...validUPCs.map(c => ({ lat: c.lat, lng: c.lng })), fixedLatLng];
    previousLatLng = { lat: validUPCs[validUPCs.length - 1].lat, lng: validUPCs[validUPCs.length - 1].lng };

    currentSegmentIndex = 0;
    cumulativeDistance = 0;
    cumulativeDuration = 0;
    distanceValues = [];
    durationValues = [];
    document.getElementById('generateRoute').disabled = false;
    document.getElementById('resetRoute').disabled = true;
    document.getElementById('routeLinks').innerHTML = '';
    document.getElementById('routeStats').innerHTML = '';
    previousUPCs.push(...validUPCs.map(c => c.upc)); // Store the entered UPCs
    document.getElementById('upcCountDisplay').innerText = `UPC Count: ${enteredUPCs.size}`;

    if (typeof google !== 'undefined' && google.maps && google.maps.DirectionsService) {
        optimizeRoute();
    } else {
        alert('Google Maps API is not loaded.');
    }
});

document.getElementById('resetRoute').addEventListener('click', function() {
    // Reset all necessary variables
    coordinatesList = [];
    optimizedWaypoints = [];
    currentSegmentIndex = 0;
    cumulativeDistance = 0;
    cumulativeDuration = 0;
    distanceValues = [];
    durationValues = [];
    savedRoutes = [];
    upcCount = 0;
    previousLatLng = fixedLatLng;
    previousUPCs = [];
    enteredUPCs = new Set();
    
    // Clear the input fields and display elements
    document.getElementById('upcInput').value = '';
    document.getElementById('routeLinks').innerHTML = '';
    document.getElementById('routeStats').innerHTML = '';
    document.getElementById('upcCountDisplay').innerText = 'UPC Count: 0';
    
    // Reset the map view
    directionsRenderer.set('directions', null);
    
    // Disable the reset button
    document.getElementById('resetRoute').disabled = true;
    document.getElementById('exportRoutes').disabled = true;
});

document.getElementById('exportRoutes').addEventListener('click', function() {
    exportRoutesToCSV(savedRoutes);
});
