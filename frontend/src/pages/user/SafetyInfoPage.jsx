import React, { useState, useEffect, useMemo } from 'react';
import { safetyInfoService } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import AlertBanner from '../../components/AlertBanner';
import {
  IconPhone,
  IconShield,
  IconFileText,
  IconSearch,
  IconX,
  IconInfo,
  IconSparkles,
  IconClock
} from '../../components/Icons';

const SafetyInfoPage = () => {
  const [tips, setTips] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tipCategoryFilter, setTipCategoryFilter] = useState('All');
  const [tipSearch, setTipSearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'emergency' | 'tips'

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [tipsRes, contactsRes] = await Promise.all([
        safetyInfoService.getTips(),
        safetyInfoService.getEmergencyContacts()
      ]);

      if (tipsRes.success) {
        setTips(tipsRes.data || []);
      }
      if (contactsRes.success) {
        setContacts(contactsRes.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load safety information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Unique categories for safety tips
  const tipCategories = useMemo(() => {
    const cats = new Set(['All']);
    tips.forEach((t) => {
      if (t.category && t.category.trim()) {
        cats.add(t.category.trim());
      }
    });
    return Array.from(cats);
  }, [tips]);

  // Filtered tips
  const filteredTips = useMemo(() => {
    return tips.filter((tip) => {
      if (tipCategoryFilter !== 'All' && tip.category?.toLowerCase() !== tipCategoryFilter.toLowerCase()) {
        return false;
      }
      if (tipSearch.trim()) {
        const query = tipSearch.trim().toLowerCase();
        const matchTitle = tip.title?.toLowerCase().includes(query);
        const matchContent = tip.content?.toLowerCase().includes(query);
        const matchCategory = tip.category?.toLowerCase().includes(query);
        if (!matchTitle && !matchContent && !matchCategory) return false;
      }
      return true;
    });
  }, [tips, tipCategoryFilter, tipSearch]);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    if (!contactSearch.trim()) return contacts;
    const query = contactSearch.trim().toLowerCase();
    return contacts.filter((c) => {
      const matchName = c.name?.toLowerCase().includes(query);
      const matchPhone = c.phone?.toLowerCase().includes(query);
      const matchCategory = c.category?.toLowerCase().includes(query);
      const matchDesc = c.description?.toLowerCase().includes(query);
      const matchAdd = c.additional_info?.toLowerCase().includes(query);
      return matchName || matchPhone || matchCategory || matchDesc || matchAdd;
    });
  }, [contacts, contactSearch]);

  if (loading) {
    return <LoadingSpinner message="Loading safety guidance and emergency contact details..." />;
  }

  return (
    <div className="safety-info-page" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.65rem', backgroundColor: '#e0f2fe', color: '#0284c7', borderRadius: 'var(--radius-pill)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          <IconShield size={14} /> Official Directory & Guidance
        </div>
        <h1 className="page-title">Safety Tips & Emergency Information</h1>
        <p className="page-subtitle">
          Useful safety guidance and emergency contact information managed by the portal administrators.
        </p>
      </div>

      {error && <AlertBanner type="error" message={error} onDismiss={() => setError('')} />}

      {/* Navigation Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', fontSize: '0.88rem' }}
        >
          <IconSparkles size={15} /> All Information ({contacts.length + tips.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('emergency')}
          className={`btn btn-sm ${activeTab === 'emergency' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', fontSize: '0.88rem' }}
        >
          <IconPhone size={15} /> Emergency Contacts ({contacts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tips')}
          className={`btn btn-sm ${activeTab === 'tips' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', fontSize: '0.88rem' }}
        >
          <IconFileText size={15} /> Safety Tips ({tips.length})
        </button>
      </div>

      {/* =========================================================================
          SECTION 1: Emergency Contacts
          ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'emergency') && (
        <section aria-label="Emergency Contacts Section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconPhone size={20} color="#dc2626" /> Emergency Helplines & Contacts
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                Verified emergency numbers and helpline resources for immediate assistance.
              </p>
            </div>

            {contacts.length > 3 && (
              <div style={{ position: 'relative', width: '100%', maxWidth: '260px' }}>
                <div style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', pointerEvents: 'none' }}>
                  <IconSearch size={14} />
                </div>
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Filter contacts..."
                  className="form-control"
                  style={{ paddingLeft: '2rem', paddingRight: contactSearch ? '2rem' : '0.75rem', height: '34px', fontSize: '0.84rem' }}
                />
                {contactSearch && (
                  <button
                    type="button"
                    onClick={() => setContactSearch('')}
                    aria-label="Clear filter"
                    style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                  >
                    <IconX size={13} />
                  </button>
                )}
              </div>
            )}
          </div>

          {contacts.length === 0 ? (
            <EmptyState
              title="No emergency information available yet."
              message="Portal administrators have not published emergency contacts yet. Please check back soon."
              icon={<IconPhone size={36} color="var(--text-muted)" />}
            />
          ) : filteredContacts.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: '#ffffff' }}>
              <p style={{ margin: 0 }}>No emergency contacts match your search "{contactSearch}".</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="card"
                  style={{
                    padding: '1.35rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderLeft: '4px solid #ef4444',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                  }}
                >
                  <div>
                    {/* Category badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className="badge badge-hazard-high" style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {contact.category}
                      </span>
                    </div>

                    {/* Name */}
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-navy)', marginBottom: '0.35rem' }}>
                      {contact.name}
                    </h3>

                    {/* Description */}
                    {contact.description && (
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-color)', marginBottom: '0.65rem', lineHeight: '1.45' }}>
                        {contact.description}
                      </p>
                    )}

                    {/* Additional Info */}
                    {contact.additional_info && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.35rem',
                        padding: '0.45rem 0.65rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        marginBottom: '1rem'
                      }}>
                        <IconInfo size={13} color="var(--primary-blue)" style={{ marginTop: '2px' }} />
                        <span>{contact.additional_info}</span>
                      </div>
                    )}
                  </div>

                  {/* Phone & Call CTA */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid #f1f5f9',
                    marginTop: '0.5rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block' }}>
                        Helpline Number
                      </span>
                      <strong style={{ fontSize: '1.15rem', color: 'var(--primary-navy)', letterSpacing: '0.02em' }}>
                        {contact.phone}
                      </strong>
                    </div>

                    <a
                      href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                      className="btn btn-primary btn-sm"
                      style={{
                        backgroundColor: '#dc2626',
                        borderColor: '#b91c1c',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.45rem 0.85rem',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      <IconPhone size={14} /> Call Now
                    </a>
                  </div>

                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          SECTION 2: Safety Tips
          ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'tips') && (
        <section aria-label="Safety Tips Section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconFileText size={20} color="var(--primary-blue)" /> Safety Guidance & Best Practices
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                Practical advice and preventive measures to stay secure in public and online spaces.
              </p>
            </div>

            {/* Tip Search */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
              <div style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', pointerEvents: 'none' }}>
                <IconSearch size={14} />
              </div>
              <input
                type="text"
                value={tipSearch}
                onChange={(e) => setTipSearch(e.target.value)}
                placeholder="Search safety tips..."
                className="form-control"
                style={{ paddingLeft: '2rem', paddingRight: tipSearch ? '2rem' : '0.75rem', height: '34px', fontSize: '0.84rem' }}
              />
              {tipSearch && (
                <button
                  type="button"
                  onClick={() => setTipSearch('')}
                  aria-label="Clear tip search"
                  style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                >
                  <IconX size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          {tipCategories.length > 2 && (
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {tipCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setTipCategoryFilter(cat)}
                  className={`btn btn-sm ${tipCategoryFilter === cat ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {tips.length === 0 ? (
            <EmptyState
              title="No safety tips available yet."
              message="Portal administrators have not published safety guidance tips yet. Please check back soon."
              icon={<IconFileText size={36} color="var(--text-muted)" />}
            />
          ) : filteredTips.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: '#ffffff' }}>
              <p style={{ margin: 0 }}>No safety tips match your filter criteria.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {filteredTips.map((tip) => (
                <div
                  key={tip.id}
                  className="card"
                  style={{
                    padding: '1.35rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderTop: '3px solid var(--primary-blue)',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className="badge badge-info" style={{ fontSize: '0.76rem', fontWeight: 700 }}>
                      {tip.category}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--primary-navy)', marginBottom: '0.5rem', lineHeight: '1.35' }}>
                    {tip.title}
                  </h3>

                  <div style={{ fontSize: '0.9rem', color: 'var(--text-color)', lineHeight: '1.55', whiteSpace: 'pre-line' }}>
                    {tip.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

    </div>
  );
};

export default SafetyInfoPage;
