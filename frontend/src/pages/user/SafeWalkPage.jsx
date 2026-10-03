import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { safeWalkService } from '../../services/api';
import StartSafeWalkWizard from './StartSafeWalkWizard';
import CompanionManager from './CompanionManager';
import LoadingSpinner from '../../components/LoadingSpinner';
import { IconWalker, IconUsers } from '../../components/Icons';

const SafeWalkPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'companions' ? 'companions' : 'start';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Active Safe Walk check
  const [activeWalk, setActiveWalk] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkActiveWalk = async () => {
      try {
        const res = await safeWalkService.getActiveSafeWalk();
        if (res.success && res.data) {
          setActiveWalk(res.data);
        }
      } catch (err) {
        console.warn('Could not check active walk:', err);
      } finally {
        setLoading(false);
      }
    };

    checkActiveWalk();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  if (loading) {
    return <LoadingSpinner message="Checking Safe Walk status..." />;
  }

  return (
    <div className="safewalk-container">
      {/* Banner / Header */}
      <section className="safewalk-banner" aria-label="Safe Walk Header">
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: 'var(--radius-pill)', color: '#6ee7b7', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            <IconWalker size={14} /> Community Companion Network
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
            Safe Walk
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '0.98rem', maxWidth: '580px', marginTop: '0.45rem', lineHeight: 1.55 }}>
            Heading somewhere alone? Start a Safe Walk and notify an accepted community companion of your destination and expected arrival time.
          </p>
        </div>
      </section>

      {/* Active Journey Notification Bar (If session is active) */}
      {activeWalk && (
        <section
          style={{
            backgroundColor: '#ecfdf5',
            border: '1.5px solid #a7f3d0',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
          aria-label="Active Journey Alert"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span className="badge-safewalk-active">
              <span className="pulse-dot"></span> ACTIVE
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#065f46' }}>
                Safe Walk in Progress &rarr; {activeWalk.destination}
              </h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.86rem', color: '#047857' }}>
                Companion: <strong>{activeWalk.companion_name || activeWalk.companion_email}</strong>
              </p>
            </div>
          </div>

          <Link to="/safe-walk/active" className="btn btn-primary btn-sm" style={{ backgroundColor: '#059669', borderColor: '#059669', fontWeight: 700 }}>
            View Active Journey &rarr;
          </Link>
        </section>
      )}

      {/* Tab Navigation */}
      <nav className="safewalk-nav-tabs" aria-label="Safe Walk Navigation Tabs">
        <button
          type="button"
          className={`safewalk-tab-btn ${activeTab === 'start' ? 'active' : ''}`}
          onClick={() => handleTabChange('start')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
        >
          <IconWalker size={16} /> Start Safe Walk
        </button>
        <button
          type="button"
          className={`safewalk-tab-btn ${activeTab === 'companions' ? 'active' : ''}`}
          onClick={() => handleTabChange('companions')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
        >
          <IconUsers size={16} /> Community Companions
        </button>
      </nav>

      {/* Tab Content */}
      <main>
        {activeTab === 'start' ? (
          <StartSafeWalkWizard onSwitchToCompanions={() => handleTabChange('companions')} />
        ) : (
          <CompanionManager onSelectTab={handleTabChange} />
        )}
      </main>
    </div>
  );
};

export default SafeWalkPage;
