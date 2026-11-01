export const lightMapStyles = [
  {
    featureType: "all",
    elementType: "geometry",
    stylers: [{ color: "#eaeff2" }]
  },
  {
    featureType: "all",
    elementType: "labels.text.fill",
    stylers: [{ color: "#334155" }]
  },
  {
    featureType: "all",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#ffffff" }, { weight: 2 }]
  },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#cbd5e1" }]
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748b" }]
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#0f172a" }, { weight: "bold" }]
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#e2e8f0" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "poi.attraction",
    elementType: "all",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "poi.business",
    elementType: "all",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "poi.place_of_worship",
    elementType: "all",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "poi.government",
    elementType: "all",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "poi.medical",
    elementType: "all",
    stylers: [{ visibility: "on" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#cfe8d5" }]
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#166534" }]
  },
  {
    featureType: "poi.school",
    elementType: "all",
    stylers: [{ visibility: "on" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#cbd5e1" }]
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#475569" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#fed7aa" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#fdba74" }]
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7c2d12" }]
  },
  {
    featureType: "transit",
    elementType: "all",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "transit.station",
    elementType: "all",
    stylers: [{ visibility: "on" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#9ec5e8" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#475569" }]
  }
];

export const darkMapStyles = lightMapStyles;

export const isPhoneView = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768 || window.matchMedia("(max-width: 767px)").matches;
};

export const getResponsiveMapStyles = (): any[] => {
  return lightMapStyles;
};

// Default export alias for backwards compatibility
export const mapStyles = lightMapStyles;
