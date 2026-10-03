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

// Custom Walker Live Marker Icon
const createWalkerLiveIcon = (isWalker) => {
  const color = isWalker ? '#2563eb' : '#059669';
  const pulseColor = isWalker ? 'rgba(37, 99, 235, 0.4)' : 'rgba(5, 150, 105, 0.4)';

  const svg = `
    <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background-color: ${pulseColor}; animation: pulse-radar 2s infinite ease-out;"></div>
      <div style="position: relative; z-index: 2; width: 32px; height: 32px; border-radius: 50%; background-color: ${color}; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 16px;">
        🚶
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'safewalk-live-marker',
    html: svg,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22]
  });
};

const SafeWalkMap = ({
  latitude = null,
  longitude = null,
  walkerName = 'Walker',
  destination = '',
  lastUpdated = null,
  isWalker = false,
  status = 'ACTIVE',
  height = '340px'
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const hasCoords = latitude != null && longitude != null && !isNaN(latitude) && !isNaN(longitude);

  // Initialize or re-center Leaflet Map
  useEffect(() => {
    if (!hasCoords || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: 15,
        scrollWheelZoom: false,
        attributionControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      mapInstanceRef.current = map;

      const handleResize = () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      };
      window.addEventListener('resize', handleResize);
    } else {
      mapInstanceRef.current.setView([latitude, longitude], mapInstanceRef.current.getZoom());
    }

    return () => {
      // Clean up map when component unmounts
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [hasCoords]);

  // Update marker position and popup content
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !hasCoords) return;

    const popupHtml = `
      <div style="font-family: var(--font-family); padding: 4px;">
        <div style="font-weight: 800; color: var(--primary-navy); font-size: 0.95rem; margin-bottom: 3px;">
          ${isWalker ? '📍 Your Current Location' : `📍 ${walkerName}'s Location`}
        </div>
        <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 4px;">
          Heading to: <strong style="color: var(--text-main);">${destination || 'Destination'}</strong>
        </div>
        ${lastUpdated ? `<div style="font-size: 0.75rem; color: #059669; font-weight: 600;">Updated: ${lastUpdated}</div>` : ''}
      </div>
    `;

    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
      markerRef.current.setPopupContent(popupHtml);
    } else {
      const marker = L.marker([latitude, longitude], {
        icon: createWalkerLiveIcon(isWalker)
      }).addTo(map);

      marker.bindPopup(popupHtml);
      markerRef.current = marker;
    }

    map.panTo([latitude, longitude], { animate: true });
  }, [latitude, longitude, hasCoords, walkerName, destination, lastUpdated, isWalker]);

  if (!hasCoords) {
    return (
      <div
        style={{
          height,
          backgroundColor: '#f8fafc',
          border: '1.5px dashed var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '0.65rem' }}>🧭</div>
        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
          Waiting for live location...
        </h4>
        <p style={{ margin: '0.35rem 0 0', fontSize: '0.86rem', maxWidth: '380px', lineHeight: 1.5 }}>
          {isWalker
            ? 'Capturing your device location. Please ensure location permissions are granted.'
            : `${walkerName}'s device has not shared location coordinates yet. The map will update automatically.`}
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-medium)', boxShadow: var_shadow_sm() }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating Info Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(4px)',
          padding: '0.45rem 0.75rem',
          borderRadius: 'var(--radius-sm)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          fontSize: '0.82rem',
          border: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          maxWidth: 'calc(100% - 24px)',
          flexWrap: 'wrap'
        }}
      >
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', flexShrink: 0 }}></span>
        <span style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>
          {isWalker ? 'Your Live Location' : `${walkerName}'s Location`}
        </span>
        {lastUpdated && (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            ({lastUpdated})
          </span>
        )}
      </div>
    </div>
  );
};

function var_shadow_sm() {
  return '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.04)';
}

export default SafeWalkMap;
