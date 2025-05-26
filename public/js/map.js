

 
 console.log(mapToken);
 
 if (!Array.isArray(coordinates)) {
    coordinates = JSON.parse(coordinates);
}
	mapboxgl.accessToken = mapToken;
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v12',
        
        center: coordinates, //[lng ,lat]
        zoom: 9,
    });
   
    
    console.log("Coordinates:", coordinates);
    const marker = new mapboxgl.Marker({color: "red"})
        .setLngLat(coordinates)
        .setPopup(new mapboxgl.Popup({ offset: 25}).setHTML("<h6>Your Location</h6>"))
        .addTo(map);
 