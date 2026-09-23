import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { placeService } from '../../services/api';
import StateDistrictSelector from '../../components/StateDistrictSelector';
import PlaceCard from '../../components/PlaceCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import AlertBanner from '../../components/AlertBanner';

const BrowsePlacesPage = () => {
  const { user } = useAuth();
  const [state, setState] = useState(user?.state || 'Kerala');
  const [district, setDistrict] = useState(user?.district || 'Ernakulam');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPlaces = async (selectedState, selectedDistrict) => {
    setLoading(true);
    setError('');
    try {
      const res = await placeService.getAcceptedPlaces(selectedState, selectedDistrict);
      if (res.success) {
        setPlaces(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch hazardous places.');
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces(state, district);
  }, [state, district]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Browse Hazardous Places</h1>
        <p className="page-subtitle">
          Explore verified unsafe and hazardous areas filtered by State and District.
        </p>
      </div>

      {/* Cascading Filter Controls */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.75rem' }}>
        <StateDistrictSelector
          selectedState={state}
          selectedDistrict={district}
          onStateChange={(st) => setState(st)}
          onDistrictChange={(dt) => setDistrict(dt)}
          allowAllOption={true}
          allStateText="All States"
          allDistrictText="All Districts"
          stateLabel="Filter by State"
          districtLabel="Filter by District"
        />
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {loading ? (
        <LoadingSpinner message="Searching for hazardous places in selected area..." />
      ) : places.length === 0 ? (
        <EmptyState
          icon="🛡️"
          title="No Hazardous Places Reported"
          message={`No verified hazardous places found for ${district ? `${district}, ` : ''}${state || 'the selected location'}.`}
        />
      ) : (
        <>
          <div style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Showing <strong>{places.length}</strong> verified hazardous place{places.length > 1 ? 's' : ''}:
          </div>
          <div className="grid-cards">
            {places.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BrowsePlacesPage;
