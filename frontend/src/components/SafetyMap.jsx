import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

// Helper to create custom SVG map pins with color styling
const createCustomPinIcon = (isResolved, rating) => {
  const bgColor = isResolved ? '#10b981' : rating >= 4.0 ? '#ef4444' : rating >= 3.0 ? '#f59e0b' : '#3b82f6';
  const strokeColor = isResolved ? '#047857' : rating >= 4.0 ? '#b91c1c' : rating >= 3.0 ? '#d97706' : '#1d4ed8';

  const innerSymbol = isResolved
    ? `<path d="M12 15l3 3 5-6" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<circle cx="16" cy="15" r="4.5" fill="${strokeColor}"/>`;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42">
      <defs>
        <filter id="shadow" x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.35"/>
        </filter>
      </defs>
      <path d="M16 0 C7.16 0 0 7.16 0 16 C0 26 16 42 16 42 C16 42 32 26 32 16 C32 7.16 24.84 0 16 0 Z" 
            fill="${bgColor}" stroke="${strokeColor}" stroke-width="1.5" filter="url(#shadow)"/>
      <circle cx="16" cy="15" r="9" fill="#ffffff" />
      ${innerSymbol}
    </svg>
  `;

  return L.divIcon({
    className: 'custom-map-marker',
    html: svg,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -38]
  });
};

// User Location Blue Pulsing Marker
const createUserLocationIcon = () => {
  const html = `
    <div style="position: relative; width: 22px; height: 22px;">
      <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background-color: rgba(3, 105, 161, 0.3); animation: pulse 2s infinite;"></div>
      <div style="position: absolute; top: 4px; left: 4px; width: 14px; height: 14px; border-radius: 50%; background-color: #0284c7; border: 2.5px solid #ffffff; box-shadow: 0 0 5px rgba(0,0,0,0.4);"></div>
    </div>
  `;

  return L.divIcon({
    className: 'user-location-marker',
    html,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12]
  });
};

const SafetyMap = ({
  places = [],
  selectedPlaceId = null,
  userLocation = null,
  onMarkerClick = () => {},
  radiusKm = null,
  mapHeight = '420px',
  showDetailsButton = true
}) => {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const userMarkerRef = useRef(null);
  const userCircleRef = useRef(null);
  const markerMapRef = useRef(new Map());

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = userLocation?.latitude || 9.9816;
    const initialLon = userLocation?.longitude || 76.2999;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: 12,
      scrollWheelZoom: false,
      attributionControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const markersGroup = L.featureGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Intercept click on popup links for smooth React Router navigation
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const handlePopupClick = (e) => {
      const link = e.target.closest('a[data-place-link]');
      if (link) {
        e.preventDefault();
        const targetPath = link.getAttribute('href');
        if (targetPath) {
          navigate(targetPath);
        }
      }
    };

    container.addEventListener('click', handlePopupClick);
    return () => {
      container.removeEventListener('click', handlePopupClick);
    };
  }, [navigate]);

  // Update Places Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();
    markerMapRef.current.clear();

    const validPlaces = places.filter((p) => p.latitude != null && p.longitude != null);
    const bounds = [];

    validPlaces.forEach((place) => {
      const isResolved = place.resolved === true || place.resolved === 1 || place.resolved === 'true';
      const rating = place.community_rating != null ? Number(place.community_rating) : Number(place.rating || 3);
      const icon = createCustomPinIcon(isResolved, rating);

      const marker = L.marker([place.latitude, place.longitude], { icon });

      const resolvedDate = place.resolved_at
        ? new Date(place.resolved_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : null;

      const popupHtml = `
        <div style="font-family: inherit; font-size: 0.88rem; max-width: 240px; padding: 4px;">
          <div style="font-weight: 700; font-size: 0.95rem; color: #0f172a; margin-bottom: 0.25rem; line-height: 1.3;">
            ${place.name}
          </div>
          <div style="color: #64748b; font-size: 0.8rem; margin-bottom: 0.4rem;">
            ${place.district}, ${place.state}
          </div>
          <div style="display: flex; align-items: center; gap: 0.35rem; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.4rem;">
            <span>Safety Rating:</span>
            <strong style="color: #0f172a;">${rating.toFixed(1)} / 5 ★</strong>
            <span style="color: #94a3b8; font-size: 0.76rem;">(${place.rating_count || 1})</span>
          </div>
          ${
            isResolved
              ? `<div style="display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.2rem 0.5rem; background-color: #d1fae5; color: #065f46; border-radius: 9999px; font-size: 0.76rem; font-weight: 700; margin-bottom: 0.4rem;">
                  RESOLVED ${resolvedDate ? `• ${resolvedDate}` : ''}
                </div>`
              : ''
          }
          ${
            place.distance_km != null
              ? `<div style="font-size: 0.8rem; font-weight: 700; color: #0284c7; margin-bottom: 0.4rem;">
                  ${place.distance_km} km away
                </div>`
              : ''
          }
          ${
            showDetailsButton
              ? `<div style="margin-top: 0.5rem; padding-top: 0.45rem; border-top: 1px solid #e2e8f0;">
                  <a href="/places/${place.id}" data-place-link="true" style="display: block; text-align: center; background-color: #0284c7; color: #ffffff; padding: 0.4rem 0.75rem; border-radius: 6px; font-size: 0.82rem; font-weight: 700; text-decoration: none;">
                    View Details &rarr;
                  </a>
                </div>`
              : ''
          }
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        onMarkerClick(place);
      });

      markersGroup.addLayer(marker);
      markerMapRef.current.set(place.id, marker);
      bounds.push([place.latitude, place.longitude]);
    });

    if (userLocation?.latitude && userLocation?.longitude) {
      bounds.push([userLocation.latitude, userLocation.longitude]);
    }

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 13);
    }
  }, [places, userLocation, showDetailsButton]);

  // Update User Location Marker and Radius Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
    if (userCircleRef.current) {
      map.removeLayer(userCircleRef.current);
      userCircleRef.current = null;
    }

    if (userLocation?.latitude && userLocation?.longitude) {
      const userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
        icon: createUserLocationIcon(),
        zIndexOffset: 1000
      }).bindPopup(`
        <div style="font-weight: 700; font-size: 0.88rem; color: #0284c7; padding: 2px;">
          Your Current Location
        </div>
      `);

      userMarker.addTo(map);
      userMarkerRef.current = userMarker;

      if (radiusKm) {
        const radiusMeters = radiusKm * 1000;
        const circle = L.circle([userLocation.latitude, userLocation.longitude], {
          radius: radiusMeters,
          color: '#0284c7',
          weight: 1.5,
          dashArray: '4, 6',
          fillColor: '#38bdf8',
          fillOpacity: 0.08
        }).addTo(map);
        userCircleRef.current = circle;
      }
    }
  }, [userLocation, radiusKm]);

  // Open Marker Popup when selectedPlaceId changes
  useEffect(() => {
    if (!selectedPlaceId) return;
    const marker = markerMapRef.current.get(selectedPlaceId);
    if (marker && mapInstanceRef.current) {
      mapInstanceRef.current.panTo(marker.getLatLng(), { animate: true });
      marker.openPopup();
    }
  }, [selectedPlaceId]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: mapHeight,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border-medium)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default SafetyMap;
