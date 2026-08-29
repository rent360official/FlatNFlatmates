export const mapStyles = [
  {
    featureType: "all",
    elementType: "geometry",
    stylers: [{ color: "#f5f5f5" }]
  },
  {
    featureType: "all",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }]
  },
  {
    featureType: "all",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#f5f5f5" }]
  },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#e0e0e0" }]
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }]
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text",
    stylers: [{ visibility: "off" }]
  },
  {
    // Hide tourist attractions (temples, dam walls, resorts, historical parks)
    featureType: "poi.attraction",
    elementType: "all",
    stylers: [{ visibility: "off" }]
  },
  {
    // Hide businesses (shops, hotels)
    featureType: "poi.business",
    elementType: "all",
    stylers: [{ visibility: "off" }]
  },
  {
    // Hide place of worship (temples, churches)
    featureType: "poi.place_of_worship",
    elementType: "all",
    stylers: [{ visibility: "off" }]
  },
  {
    // Hide government offices
    featureType: "poi.government",
    elementType: "all",
    stylers: [{ visibility: "off" }]
  },
  {
    // Keep medical/hospitals visible
    featureType: "poi.medical",
    elementType: "all",
    stylers: [{ visibility: "on" }]
  },
  {
    // Keep parks visible
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }]
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }]
  },
  {
    // Keep schools/colleges visible
    featureType: "poi.school",
    elementType: "all",
    stylers: [{ visibility: "on" }]
  },
  {
    // Mute/neutral roads
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#e3e3e3" }]
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }]
  },
  {
    // Mute transit overall
    featureType: "transit",
    elementType: "all",
    stylers: [{ visibility: "off" }]
  },
  {
    // Keep transit stations visible
    featureType: "transit.station",
    elementType: "all",
    stylers: [{ visibility: "on" }]
  },
  {
    // Water bodies - soft muted blue
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#cbdff2" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }]
  }
];
