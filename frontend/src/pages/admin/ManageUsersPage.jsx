import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import StateDistrictSelector from '../../components/StateDistrictSelector';
import ConfirmModal from '../../components/ConfirmModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import AlertBanner from '../../components/AlertBanner';

const ManageUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [filterState, setFilterState] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal states
  const [editUser, setEditUser] = useState(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Edit form state
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    state: '',
    district: '',
    phone: ''
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers(filterState, filterDistrict);
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filterState, filterDistrict]);

  const handleOpenEdit = (user) => {
    setUserForm({
      name: user.name,
      email: user.email,
      state: user.state,
      district: user.district,
      phone: user.phone || ''
    });
    setEditUser(user);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setError('');

    try {
      const res = await adminService.updateUser(editUser.id, userForm);
      if (res.success) {
        setSuccessMsg('User details updated successfully.');
        setEditUser(null);
        fetchUsers();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update user.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTargetUser) return;
    setModalLoading(true);
    setError('');

    try {
      const res = await adminService.deleteUser(deleteTargetUser.id);
      if (res.success) {
        setSuccessMsg(res.message || 'User deleted successfully.');
        setDeleteTargetUser(null);
        fetchUsers();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete user.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Manage Registered Users</h1>
        <p className="page-subtitle">
          View registered citizens, update details, or remove inactive accounts.
        </p>
      </div>

      {successMsg && <AlertBanner type="success" message={successMsg} onDismiss={() => setSuccessMsg('')} />}
      {error && <AlertBanner type="error" message={error} onDismiss={() => setError('')} />}

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.75rem' }}>
        <StateDistrictSelector
          selectedState={filterState}
          selectedDistrict={filterDistrict}
          onStateChange={(st) => setFilterState(st)}
          onDistrictChange={(dt) => setFilterDistrict(dt)}
          allowAllOption={true}
          allStateText="All States"
          allDistrictText="All Districts"
          stateLabel="Filter Users by State"
          districtLabel="Filter Users by District"
        />
      </div>

      {loading ? (
        <LoadingSpinner message="Loading user directory..." />
      ) : users.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No Users Found"
          message="No registered users match the current location filter."
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Location</th>
                <th>Phone</th>
                <th>Registered On</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isAdminAccount = u.role === 'admin';
                const formattedDate = new Date(u.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });

                return (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.name}</strong>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${isAdminAccount ? 'badge-admin' : 'badge-info'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.district}, {u.state}
                    </td>
                    <td>{u.phone || '—'}</td>
                    <td>{formattedDate}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(u)}
                        >
                          Edit
                        </button>
                        {!isAdminAccount && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeleteTargetUser(u)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">Edit User Details</h3>
              <button className="modal-close" onClick={() => setEditUser(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address <span className="required">*</span></label>
                  <input
                    type="email"
                    className="form-control"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    required
                  />
                </div>
                <StateDistrictSelector
                  selectedState={userForm.state}
                  selectedDistrict={userForm.district}
                  onStateChange={(st) => setUserForm({ ...userForm, state: st })}
                  onDistrictChange={(dt) => setUserForm({ ...userForm, district: dt })}
                  required={true}
                />
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditUser(null)} disabled={modalLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                  {modalLoading ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetUser}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete user "${deleteTargetUser?.name}" (${deleteTargetUser?.email})? Their submitted hazardous places will remain preserved.`}
        confirmText="Delete User"
        isDestructive={true}
        loading={modalLoading}
        onConfirm={handleDeleteUser}
        onCancel={() => setDeleteTargetUser(null)}
      />
    </div>
  );
};

export default ManageUsersPage;
