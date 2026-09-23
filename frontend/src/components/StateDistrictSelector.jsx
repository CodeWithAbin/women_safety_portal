import React from 'react';
import { STATES_LIST, getDistrictsForState } from '../utils/locationData';

const StateDistrictSelector = ({
  selectedState = '',
  selectedDistrict = '',
  onStateChange,
  onDistrictChange,
  required = false,
  disabled = false,
  stateLabel = 'State',
  districtLabel = 'District',
  allowAllOption = false,
  allStateText = 'All States',
  allDistrictText = 'All Districts'
}) => {
  const districtOptions = getDistrictsForState(selectedState);

  const handleStateSelect = (e) => {
    const newState = e.target.value;
    onStateChange(newState);
    onDistrictChange(''); // Clear district when state changes
  };

  const handleDistrictSelect = (e) => {
    onDistrictChange(e.target.value);
  };

  return (
    <div className="grid-2col" style={{ marginBottom: '1.25rem' }}>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">
          {stateLabel} {required && <span className="required">*</span>}
        </label>
        <select
          className="form-control"
          value={selectedState}
          onChange={handleStateSelect}
          required={required}
          disabled={disabled}
        >
          {allowAllOption ? (
            <option value="">{allStateText}</option>
          ) : (
            <option value="" disabled>-- Select State --</option>
          )}
          {STATES_LIST.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">
          {districtLabel} {required && <span className="required">*</span>}
        </label>
        <select
          className="form-control"
          value={selectedDistrict}
          onChange={handleDistrictSelect}
          required={required}
          disabled={disabled || (!selectedState && !allowAllOption)}
        >
          {allowAllOption ? (
            <option value="">{allDistrictText}</option>
          ) : (
            <option value="" disabled>
              {selectedState ? '-- Select District --' : '-- Select State First --'}
            </option>
          )}
          {districtOptions.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default StateDistrictSelector;
