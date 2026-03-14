import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// City name → lat/lng lookup for major Indian cities
const CITY_COORDS = {
  'mumbai': [19.076, 72.8777],
  'delhi': [28.6139, 77.209],
  'new delhi': [28.6139, 77.209],
  'bangalore': [12.9716, 77.5946],
  'bengaluru': [12.9716, 77.5946],
  'kolkata': [22.5726, 88.3639],
  'chennai': [13.0827, 80.2707],
  'hyderabad': [17.385, 78.4867],
  'pune': [18.5204, 73.8567],
  'ahmedabad': [23.0225, 72.5714],
  'surat': [21.1702, 72.8311],
  'jaipur': [26.9124, 75.7873],
  'lucknow': [26.8467, 80.9462],
  'kanpur': [26.4499, 80.3319],
  'nagpur': [21.1458, 79.0882],
  'indore': [22.7196, 75.8577],
  'thane': [19.2183, 72.9781],
  'bhopal': [23.2599, 77.4126],
  'visakhapatnam': [17.6868, 83.2185],
  'patna': [25.6093, 85.1376],
  'vadodara': [22.3072, 73.1812],
  'ghaziabad': [28.6692, 77.4538],
  'ludhiana': [30.901, 75.8573],
  'agra': [27.1767, 78.0081],
  'nashik': [19.9975, 73.7898],
  'ranchi': [23.3441, 85.3096],
  'faridabad': [28.4089, 77.3178],
  'coimbatore': [11.0168, 76.9558],
  'rajkot': [22.3039, 70.8022],
  'chandigarh': [30.7333, 76.7794],
  'guwahati': [26.1445, 91.7362],
  'mysore': [12.2958, 76.6394],
  'mysuru': [12.2958, 76.6394],
  'noida': [28.5355, 77.391],
  'gurgaon': [28.4595, 77.0266],
  'gurugram': [28.4595, 77.0266],
  'kochi': [9.9312, 76.2673],
  'cochin': [9.9312, 76.2673],
  'thiruvananthapuram': [8.5241, 76.9366],
  'trivandrum': [8.5241, 76.9366],
  'dehradun': [30.3165, 78.0322],
  'jammu': [32.7266, 74.857],
  'amritsar': [31.634, 74.8723],
  'varanasi': [25.3176, 82.9739],
  'jodhpur': [26.2389, 73.0243],
  'raipur': [21.2514, 81.6296],
  'mangalore': [12.9141, 74.856],
  'mangaluru': [12.9141, 74.856],
  'madurai': [9.9252, 78.1198],
  'vijayawada': [16.5062, 80.6480],
  'udaipur': [24.5854, 73.7125],
  'shimla': [31.1048, 77.1734],
  'pondicherry': [11.9416, 79.8083],
  'puducherry': [11.9416, 79.8083],
  'bhubaneswar': [20.2961, 85.8245],
  'goa': [15.2993, 74.124],
  'panaji': [15.4909, 73.8278],
  'imphal': [24.817, 93.9368],
  'shillong': [25.5788, 91.8933],
  'aizawl': [23.7271, 92.7176],
  'kohima': [25.6751, 94.1086],
  'agartala': [23.8315, 91.2868],
  'itanagar': [27.0844, 93.6053],
  'gangtok': [27.3389, 88.6065],
  'dispur': [26.1408, 91.788],
  'india': [20.5937, 78.9629],
  'gujarat': [22.2587, 71.1924],
};

// Try to extract coordinates from a location string
function getCoords(location) {
  if (!location) return null;
  const lower = location.toLowerCase().trim();
  
  // Try direct match
  if (CITY_COORDS[lower]) return CITY_COORDS[lower];
  
  // Try each word/segment
  const parts = lower.split(/[,\s]+/);
  for (const part of parts) {
    const clean = part.trim();
    if (CITY_COORDS[clean]) return CITY_COORDS[clean];
  }
  
  // Try partial matching
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (lower.includes(city)) return coords;
  }
  
  return null;
}

// Custom red marker icon
function createMarkerIcon() {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 32px; height: 32px;
        background: linear-gradient(135deg, #f43f5e, #e11d48);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          color: white; font-weight: bold; font-size: 12px;
          font-family: 'Inter', sans-serif;
        ">📍</div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

const IndiaWarehouseMap = ({ warehouses = [] }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // If map already initialized, destroy it first
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Create map centered on India
    const map = L.map(mapRef.current, {
      center: [22.5, 79],
      zoom: 5,
      scrollWheelZoom: true,
      zoomControl: true,
      attributionControl: true,
    });

    mapInstanceRef.current = map;

    // Use a clean, modern tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    // Add markers for each warehouse
    const markers = [];
    const markerIcon = createMarkerIcon();

    warehouses.forEach((w) => {
      const coords = getCoords(w.location);
      if (!coords) return;

      const totalStock = w.stocks?.reduce((s, i) => s + i.quantity, 0) || 0;
      const productCount = w.stocks?.filter(s => s.quantity > 0).length || 0;

      const marker = L.marker(coords, { icon: markerIcon }).addTo(map);
      
      marker.bindPopup(`
        <div style="font-family: 'Inter', sans-serif; min-width: 180px; padding: 4px;">
          <h3 style="font-size: 15px; font-weight: 700; color: #1f2937; margin: 0 0 4px 0;">${w.name}</h3>
          <p style="font-size: 12px; color: #9ca3af; margin: 0 0 10px 0;">📍 ${w.location}</p>
          <div style="display: flex; gap: 16px; border-top: 1px solid #f3f4f6; padding-top: 8px;">
            <div>
              <p style="font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">Stock</p>
              <p style="font-size: 18px; font-weight: 800; color: #1f2937; margin: 2px 0 0 0;">${totalStock}</p>
            </div>
            <div>
              <p style="font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">Products</p>
              <p style="font-size: 18px; font-weight: 800; color: #1f2937; margin: 2px 0 0 0;">${productCount}</p>
            </div>
          </div>
        </div>
      `, {
        className: 'custom-popup',
        closeButton: true,
        maxWidth: 250,
      });

      markers.push(marker);
    });

    // Fit bounds to markers if we have any
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.3));
      // Don't zoom in too much
      if (map.getZoom() > 8) map.setZoom(8);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [warehouses]);

  const mappedCount = warehouses.filter(w => getCoords(w.location)).length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Warehouse Locations — India</h2>
          <p className="text-xs text-gray-400 mt-0.5">{mappedCount} of {warehouses.length} warehouses mapped</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 shadow-sm" />
          <span className="text-xs text-gray-500 font-medium">Warehouse Location</span>
        </div>
      </div>
      <div
        ref={mapRef}
        style={{ height: '460px', width: '100%', background: '#f0f4f8' }}
      />
    </div>
  );
};

export default IndiaWarehouseMap;
