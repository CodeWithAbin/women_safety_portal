import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon paths in bundlers
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// Custom location picker pin icon
const createPickerPinIcon = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42">
      <defs>
        <filter id="shadow" x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.35"/>
        </filter>
      </defs>
      <path d="M16 0 C7.16 0 0 7.16 0 16 C0 26 16 42 16 42 C16 42 32 26 32 16 C32 7.16 24.84 0 16 0 Z" 
            fill="#dc2626" stroke="#991b1b" stroke-width="1.5" filter="url(#shadow)"/>
      <circle cx="16" cy="15" r="8" fill="#ffffff" />
      <circle cx="16" cy="15" r="4" fill="#dc2626" />
    </svg>
  `;

  return L.divIcon({
    className: 'custom-picker-marker',
    html: svg,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -38]
  });
};

const LocationPickerMap = ({
  latitude = null,
  longitude = null,
  onChange = () => {},
  defaultCenter = [9.9816, 76.2999],
  height = '300px'
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = latitude != null ? latitude : defaultCenter[0];
    const initialLon = longitude != null ? longitude : defaultCenter[1];

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: latitude != null ? 14 : 11,
      scrollWheelZoom: false,
      attributionControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Click handler to select coordinates
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      const cleanLat = parseFloat(lat.toFixed(6));
      const cleanLon = parseFloat(lng.toFixed(6));
      onChange({ latitude: cleanLat, longitude: cleanLon });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update or place marker when latitude/longitude changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (latitude != null && longitude != null) {
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      } else {
        const marker = L.marker([latitude, longitude], {
          icon: createPickerPinIcon(),
          draggable: true
        });

        // Allow dragging the pin as well for precision
        marker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          const cleanLat = parseFloat(lat.toFixed(6));
          const cleanLon = parseFloat(lng.toFixed(6));
          onChange({ latitude: cleanLat, longitude: cleanLon });
        });

        marker.addTo(map);
        markerRef.current = marker;
      }
      map.panTo([latitude, longitude], { animate: true });
    } else {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    }
  }, [latitude, longitude, onChange]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height,
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        border: '1px solid var(--border-medium)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default LocationPickerMap;
