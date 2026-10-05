import React, { useState, useEffect, useMemo } from 'react';
import { adminService } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import AlertBanner from '../../components/AlertBanner';
import ConfirmModal from '../../components/ConfirmModal';
import {
  IconShield,
  IconFileText,
  IconPhone,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCheckCircle,
  IconX,
  IconSearch,
  IconSliders,
  IconRefresh
} from '../../components/Icons';

const TIP_CATEGORIES = [
  'General Safety',
  'Travel Safety',
  'Online Safety',
  'Night Safety',
  'Public Places',
  'Personal Safety',
  'Emergency Preparedness',
  'Other'
];

const CONTACT_CATEGORIES = [
  'Emergency Service',
  'Police',
  'Medical',
  'Fire & Rescue',
  "Women's Support",
  'Helpline',
  'Other'
];

const ManageSafetyInfoPage = () => {
  const [activeTab, setActiveTab] = useState('tips'); // 'tips' | 'contacts'
  const [tips, setTips] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Tip Modal State
  const [showTipModal, setShowTipModal] = useState(false);
  const [editingTip, setEditingTip] = useState(null);
  const [tipForm, setTipForm] = useState({
    title: '',
    category: 'General Safety',
    customCategory: '',
    content: '',
    display_order: 0,
    is_active: true
  });

  // Contact Modal State
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    category: 'Emergency Service',
    customCategory: '',
    phone: '',
    description: '',
    additional_info: '',
    display_order: 0,
    is_active: true
  });

  // Delete / Deactivate State
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'tip' | 'contact', item: Object }
  const [modalLoading, setModalLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [tipsRes, contactsRes] = await Promise.all([
        adminService.getSafetyTips(),
        adminService.getEmergencyContacts()
      ]);

      if (tipsRes.success) setTips(tipsRes.data || []);
      if (contactsRes.success) setContacts(contactsRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch safety information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered lists
  const filteredTips = useMemo(() => {
    if (!searchQuery.trim()) return tips;
    const q = searchQuery.trim().toLowerCase();
    return tips.filter((t) =>
      t.title?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q) ||
      t.content?.toLowerCase().includes(q)
    );
  }, [tips, searchQuery]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.trim().toLowerCase();
    return contacts.filter((c) =>
      c.name?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    );
  }, [contacts, searchQuery]);

  // Handle Tip Form Actions
  const handleOpenAddTip = () => {
    setEditingTip(null);
    setTipForm({
      title: '',
      category: 'General Safety',
      customCategory: '',
      content: '',
      display_order: 0,
      is_active: true
    });
    setShowTipModal(true);
  };

  const handleOpenEditTip = (tip) => {
    setEditingTip(tip);
    const isPreset = TIP_CATEGORIES.includes(tip.category);
    setTipForm({
      title: tip.title || '',
      category: isPreset ? tip.category : 'Other',
      customCategory: isPreset ? '' : (tip.category || ''),
      content: tip.content || '',
      display_order: tip.display_order != null ? tip.display_order : 0,
      is_active: tip.is_active === true || tip.is_active === 1 || tip.is_active === 'true'
    });
    setShowTipModal(true);
  };

  const handleSaveTip = async (e) => {
    e.preventDefault();
    if (!tipForm.title.trim() || !tipForm.content.trim()) {
      setError('Please fill in all required fields (Title and Content).');
      return;
    }

    const finalCategory = tipForm.category === 'Other' && tipForm.customCategory.trim()
      ? tipForm.customCategory.trim()
      : tipForm.category;

    if (!finalCategory) {
      setError('Category is required.');
      return;
    }

    setModalLoading(true);
    setError('');
    setFeedback('');

    const payload = {
      title: tipForm.title.trim(),
      category: finalCategory,
      content: tipForm.content.trim(),
      display_order: Number(tipForm.display_order) || 0,
      is_active: Boolean(tipForm.is_active)
    };

    try {
      if (editingTip) {
        const res = await adminService.updateSafetyTip(editingTip.id, payload);
        if (res.success) {
          setTips((prev) => prev.map((t) => (t.id === editingTip.id ? res.data : t)));
          setFeedback('Safety tip updated successfully.');
          setShowTipModal(false);
        }
      } else {
        const res = await adminService.createSafetyTip(payload);
        if (res.success) {
          setTips((prev) => [res.data, ...prev]);
          setFeedback('Safety tip created and published successfully.');
          setShowTipModal(false);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save safety tip.');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Contact Form Actions
  const handleOpenAddContact = () => {
    setEditingContact(null);
    setContactForm({
      name: '',
      category: 'Emergency Service',
      customCategory: '',
      phone: '',
      description: '',
      additional_info: '',
      display_order: 0,
      is_active: true
    });
    setShowContactModal(true);
  };

  const handleOpenEditContact = (contact) => {
    setEditingContact(contact);
    const isPreset = CONTACT_CATEGORIES.includes(contact.category);
    setContactForm({
      name: contact.name || '',
      category: isPreset ? contact.category : 'Other',
      customCategory: isPreset ? '' : (contact.category || ''),
      phone: contact.phone || '',
      description: contact.description || '',
      additional_info: contact.additional_info || '',
      display_order: contact.display_order != null ? contact.display_order : 0,
      is_active: contact.is_active === true || contact.is_active === 1 || contact.is_active === 'true'
    });
    setShowContactModal(true);
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.phone.trim()) {
      setError('Please provide contact name and phone number.');
      return;
    }

    const finalCategory = contactForm.category === 'Other' && contactForm.customCategory.trim()
      ? contactForm.customCategory.trim()
      : contactForm.category;

    if (!finalCategory) {
      setError('Category is required.');
      return;
    }

    setModalLoading(true);
    setError('');
    setFeedback('');

    const payload = {
      name: contactForm.name.trim(),
      category: finalCategory,
      phone: contactForm.phone.trim(),
      description: contactForm.description.trim(),
      additional_info: contactForm.additional_info.trim(),
      display_order: Number(contactForm.display_order) || 0,
      is_active: Boolean(contactForm.is_active)
    };

    try {
      if (editingContact) {
        const res = await adminService.updateEmergencyContact(editingContact.id, payload);
        if (res.success) {
          setContacts((prev) => prev.map((c) => (c.id === editingContact.id ? res.data : c)));
          setFeedback('Emergency contact updated successfully.');
          setShowContactModal(false);
        }
      } else {
        const res = await adminService.createEmergencyContact(payload);
        if (res.success) {
          setContacts((prev) => [res.data, ...prev]);
          setFeedback('Emergency contact created successfully.');
          setShowContactModal(false);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save emergency contact.');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Delete / Deactivate Confirmation
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setModalLoading(true);
    setError('');
    setFeedback('');

    try {
      if (deleteTarget.type === 'tip') {
        const res = await adminService.deleteSafetyTip(deleteTarget.item.id);
        if (res.success) {
          // Update item state to inactive
          setTips((prev) =>
            prev.map((t) => (t.id === deleteTarget.item.id ? { ...t, is_active: false } : t))
          );
          setFeedback('Safety tip deactivated.');
        }
      } else if (deleteTarget.type === 'contact') {
        const res = await adminService.deleteEmergencyContact(deleteTarget.item.id);
        if (res.success) {
          setContacts((prev) =>
            prev.map((c) => (c.id === deleteTarget.item.id ? { ...c, is_active: false } : c))
          );
          setFeedback('Emergency contact deactivated.');
        }
      }
      setDeleteTarget(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to deactivate entry.');
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading safety information management..." />;
  }

  return (
    <div className="manage-safety-info-page" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.65rem', backgroundColor: '#ede9fe', color: '#6d28d9', borderRadius: 'var(--radius-pill)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          <IconShield size={14} /> Administrative Management
        </div>
        <h1 className="page-title">Manage Safety Information</h1>
        <p className="page-subtitle">
          Publish, update, and manage safety tips and emergency contact information for citizens.
        </p>
      </div>

      {feedback && <AlertBanner type="success" message={feedback} onDismiss={() => setFeedback('')} />}
      {error && <AlertBanner type="error" message={error} onDismiss={() => setError('')} />}

      {/* Primary Action Tabs & Actions Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('tips'); setSearchQuery(''); }}
            className={`btn btn-sm ${activeTab === 'tips' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', fontSize: '0.88rem' }}
          >
            <IconFileText size={16} /> Safety Tips ({tips.length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('contacts'); setSearchQuery(''); }}
            className={`btn btn-sm ${activeTab === 'contacts' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', fontSize: '0.88rem' }}
          >
            <IconPhone size={16} /> Emergency Contacts ({contacts.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search bar */}
          <div style={{ position: 'relative', width: '220px' }}>
            <div style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', pointerEvents: 'none' }}>
              <IconSearch size={14} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'tips' ? 'Filter tips...' : 'Filter contacts...'}
              className="form-control"
              style={{ paddingLeft: '2rem', paddingRight: searchQuery ? '2rem' : '0.75rem', height: '34px', fontSize: '0.84rem' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear filter"
                style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
              >
                <IconX size={13} />
              </button>
            )}
          </div>

          {/* Add Buttons */}
          {activeTab === 'tips' ? (
            <button
              type="button"
              onClick={handleOpenAddTip}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem' }}
            >
              <IconPlus size={15} /> Add Safety Tip
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenAddContact}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem' }}
            >
              <IconPlus size={15} /> Add Emergency Contact
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          TAB 1: Safety Tips Management
          ========================================================================= */}
      {activeTab === 'tips' && (
        <section aria-label="Safety Tips Management">
          {tips.length === 0 ? (
            <EmptyState
              title="No safety tips have been added yet."
              message="Create and publish your first guidance tip to educate citizens on personal, travel, and public safety."
              icon={<IconFileText size={36} color="var(--text-muted)" />}
              actionText="+ Add Safety Tip"
              onAction={handleOpenAddTip}
            />
          ) : filteredTips.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: '#ffffff' }}>
              <p style={{ margin: 0 }}>No safety tips match "{searchQuery}".</p>
            </div>
          ) : (
            <div className="table-responsive" style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--primary-navy)' }}>Title & Content</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--primary-navy)' }}>Category</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: 'var(--primary-navy)' }}>Order</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: 'var(--primary-navy)' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--primary-navy)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTips.map((tip) => {
                    const isActive = tip.is_active === true || tip.is_active === 1 || tip.is_active === 'true';
                    return (
                      <tr key={tip.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: isActive ? 1 : 0.65 }}>
                        <td style={{ padding: '1rem', verticalAlign: 'top', maxWidth: '380px' }}>
                          <strong style={{ color: 'var(--primary-navy)', display: 'block', marginBottom: '0.25rem', fontSize: '0.92rem' }}>
                            {tip.title}
                          </strong>
                          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: '1.4', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {tip.content}
                          </p>
                        </td>
                        <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                          <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                            {tip.category}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', verticalAlign: 'middle', fontWeight: 600 }}>
                          {tip.display_order || 0}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', verticalAlign: 'middle' }}>
                          {isActive ? (
                            <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>Active</span>
                          ) : (
                            <span className="badge" style={{ backgroundColor: '#e2e8f0', color: '#475569', fontSize: '0.75rem' }}>Inactive</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', verticalAlign: 'middle' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditTip(tip)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.3rem 0.55rem', fontSize: '0.78rem' }}
                              title="Edit Tip"
                            >
                              <IconEdit size={13} /> Edit
                            </button>
                            {isActive && (
                              <button
                                type="button"
                                onClick={() => setDeleteTarget({ type: 'tip', item: tip })}
                                className="btn btn-danger btn-sm"
                                style={{ padding: '0.3rem 0.55rem', fontSize: '0.78rem' }}
                                title="Deactivate Tip"
                              >
                                <IconTrash size={13} /> Deactivate
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
        </section>
      )}

      {/* =========================================================================
          TAB 2: Emergency Contacts Management
          ========================================================================= */}
      {activeTab === 'contacts' && (
        <section aria-label="Emergency Contacts Management">
          {contacts.length === 0 ? (
            <EmptyState
              title="No emergency contacts have been added yet."
              message="Add official emergency helplines, police hotlines, and medical assistance numbers for users."
              icon={<IconPhone size={36} color="var(--text-muted)" />}
              actionText="+ Add Emergency Contact"
              onAction={handleOpenAddContact}
            />
          ) : filteredContacts.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: '#ffffff' }}>
              <p style={{ margin: 0 }}>No emergency contacts match "{searchQuery}".</p>
            </div>
          ) : (
            <div className="table-responsive" style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--primary-navy)' }}>Name & Details</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--primary-navy)' }}>Category</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--primary-navy)' }}>Phone</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: 'var(--primary-navy)' }}>Order</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: 'var(--primary-navy)' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--primary-navy)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact) => {
                    const isActive = contact.is_active === true || contact.is_active === 1 || contact.is_active === 'true';
                    return (
                      <tr key={contact.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: isActive ? 1 : 0.65 }}>
                        <td style={{ padding: '1rem', verticalAlign: 'top', maxWidth: '320px' }}>
                          <strong style={{ color: 'var(--primary-navy)', display: 'block', marginBottom: '0.2rem', fontSize: '0.92rem' }}>
                            {contact.name}
                          </strong>
                          {contact.description && (
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: '1.4' }}>
                              {contact.description}
                            </p>
                          )}
                        </td>
                        <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                          <span className="badge badge-hazard-high" style={{ fontSize: '0.75rem' }}>
                            {contact.category}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                          <strong style={{ color: 'var(--primary-navy)', fontSize: '0.95rem' }}>{contact.phone}</strong>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', verticalAlign: 'middle', fontWeight: 600 }}>
                          {contact.display_order || 0}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', verticalAlign: 'middle' }}>
                          {isActive ? (
                            <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>Active</span>
                          ) : (
                            <span className="badge" style={{ backgroundColor: '#e2e8f0', color: '#475569', fontSize: '0.75rem' }}>Inactive</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', verticalAlign: 'middle' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditContact(contact)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.3rem 0.55rem', fontSize: '0.78rem' }}
                              title="Edit Contact"
                            >
                              <IconEdit size={13} /> Edit
                            </button>
                            {isActive && (
                              <button
                                type="button"
                                onClick={() => setDeleteTarget({ type: 'contact', item: contact })}
                                className="btn btn-danger btn-sm"
                                style={{ padding: '0.3rem 0.55rem', fontSize: '0.78rem' }}
                                title="Deactivate Contact"
                              >
                                <IconTrash size={13} /> Deactivate
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
        </section>
      )}

      {/* =========================================================================
          MODAL 1: Add / Edit Safety Tip
          ========================================================================= */}
      {showTipModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-container" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingTip ? 'Edit Safety Tip' : 'Add New Safety Tip'}
              </h3>
              <button className="modal-close" onClick={() => setShowTipModal(false)} aria-label="Close modal">
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveTip}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Title */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="tip-title">
                    Tip Title <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    id="tip-title"
                    type="text"
                    required
                    placeholder="e.g., Safe Public Transit Navigation"
                    className="form-control"
                    value={tipForm.title}
                    onChange={(e) => setTipForm({ ...tipForm, title: e.target.value })}
                  />
                </div>

                {/* Category */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="tip-category">
                    Category <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    id="tip-category"
                    className="form-control"
                    value={tipForm.category}
                    onChange={(e) => setTipForm({ ...tipForm, category: e.target.value })}
                  >
                    {TIP_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Custom Category Input if 'Other' */}
                {tipForm.category === 'Other' && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="tip-custom-category">
                      Specify Category <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      id="tip-custom-category"
                      type="text"
                      required
                      placeholder="e.g. Workplace Safety"
                      className="form-control"
                      value={tipForm.customCategory}
                      onChange={(e) => setTipForm({ ...tipForm, customCategory: e.target.value })}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="tip-content">
                    Guidance & Instructions <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <textarea
                    id="tip-content"
                    required
                    rows={4}
                    placeholder="Enter the detailed safety advice or step-by-step guidance..."
                    className="form-control"
                    value={tipForm.content}
                    onChange={(e) => setTipForm({ ...tipForm, content: e.target.value })}
                  />
                </div>

                {/* Display Order & Active status row */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label" htmlFor="tip-order">
                      Display Order
                    </label>
                    <input
                      id="tip-order"
                      type="number"
                      min="0"
                      className="form-control"
                      value={tipForm.display_order}
                      onChange={(e) => setTipForm({ ...tipForm, display_order: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                    <input
                      id="tip-active"
                      type="checkbox"
                      checked={tipForm.is_active}
                      onChange={(e) => setTipForm({ ...tipForm, is_active: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="tip-active" style={{ fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', margin: 0 }}>
                      Active (Published)
                    </label>
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTipModal(false)} disabled={modalLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                  {modalLoading ? 'Saving...' : editingTip ? 'Save Changes' : 'Publish Tip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: Add / Edit Emergency Contact
          ========================================================================= */}
      {showContactModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-container" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingContact ? 'Edit Emergency Contact' : 'Add New Emergency Contact'}
              </h3>
              <button className="modal-close" onClick={() => setShowContactModal(false)} aria-label="Close modal">
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveContact}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Name */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="contact-name">
                    Service / Authority Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    placeholder="e.g. National Emergency Response"
                    className="form-control"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  />
                </div>

                {/* Phone & Category Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="contact-phone">
                      Phone Number <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      id="contact-phone"
                      type="text"
                      required
                      placeholder="e.g. 112 or 1091"
                      className="form-control"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="contact-category">
                      Category <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <select
                      id="contact-category"
                      className="form-control"
                      value={contactForm.category}
                      onChange={(e) => setContactForm({ ...contactForm, category: e.target.value })}
                    >
                      {CONTACT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Custom Category Input if 'Other' */}
                {contactForm.category === 'Other' && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="contact-custom-category">
                      Specify Category <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      id="contact-custom-category"
                      type="text"
                      required
                      placeholder="e.g. Mental Health Support"
                      className="form-control"
                      value={contactForm.customCategory}
                      onChange={(e) => setContactForm({ ...contactForm, customCategory: e.target.value })}
                    />
                  </div>
                )}

                {/* Description */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="contact-desc">
                    Description
                  </label>
                  <textarea
                    id="contact-desc"
                    rows={2}
                    placeholder="Brief description of the service..."
                    className="form-control"
                    value={contactForm.description}
                    onChange={(e) => setContactForm({ ...contactForm, description: e.target.value })}
                  />
                </div>

                {/* Additional Info */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="contact-info">
                    Additional Information / Hours
                  </label>
                  <input
                    id="contact-info"
                    type="text"
                    placeholder="e.g. 24/7 Toll-Free, Multilingual"
                    className="form-control"
                    value={contactForm.additional_info}
                    onChange={(e) => setContactForm({ ...contactForm, additional_info: e.target.value })}
                  />
                </div>

                {/* Display Order & Active status row */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label" htmlFor="contact-order">
                      Display Order
                    </label>
                    <input
                      id="contact-order"
                      type="number"
                      min="0"
                      className="form-control"
                      value={contactForm.display_order}
                      onChange={(e) => setContactForm({ ...contactForm, display_order: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                    <input
                      id="contact-active"
                      type="checkbox"
                      checked={contactForm.is_active}
                      onChange={(e) => setContactForm({ ...contactForm, is_active: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="contact-active" style={{ fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', margin: 0 }}>
                      Active (Published)
                    </label>
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowContactModal(false)} disabled={modalLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                  {modalLoading ? 'Saving...' : editingContact ? 'Save Changes' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deactivation */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={deleteTarget?.type === 'tip' ? 'Deactivate Safety Tip' : 'Deactivate Emergency Contact'}
        message={
          deleteTarget?.type === 'tip'
            ? `Are you sure you want to deactivate "${deleteTarget?.item?.title}"? It will no longer be visible to citizens.`
            : `Are you sure you want to deactivate "${deleteTarget?.item?.name}" (${deleteTarget?.item?.phone})? It will no longer be visible to citizens.`
        }
        confirmText="Deactivate"
        cancelText="Cancel"
        isDestructive={true}
        loading={modalLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

    </div>
  );
};

export default ManageSafetyInfoPage;
