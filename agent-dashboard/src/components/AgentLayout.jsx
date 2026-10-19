import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Package, User } from 'lucide-react';
import { requestCurrentPosition } from '../utils/geolocation';

export default function AgentLayout({ profile, isOnline, updateOnlineStatus, onLogout, children }) {
  const location = useLocation();
  const [updating, setUpdating] = useState(false);
  const agentName = profile?.user?.name || 'Agent';

  const handleToggleOnline = async () => {
    setUpdating(true);
    try {
      if (!isOnline) {
        let lat = profile?.latitude ?? 12.9716;
        let lon = profile?.longitude ?? 77.5946;
        try {
          const pos = await requestCurrentPosition();
          lat = pos.latitude;
          lon = pos.longitude;
        } catch {
          // Location reading optional on toggle
        }
        await updateOnlineStatus(true, lat, lon);
      } else {
        await updateOnlineStatus(false);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const navLinkStyle = (path) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '10px',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 500,
    color: location.pathname === path || (path === '/' && location.pathname.startsWith('/orders'))
      ? 'white'
      : 'var(--text-muted)',
    background: location.pathname === path || (path === '/' && location.pathname.startsWith('/orders'))
      ? 'var(--primary)'
      : 'transparent',
  });

  return (
    <div style={{ paddingBottom: '60px' }}>
      <header className="glass-panel" style={{ borderRadius: '0 0 24px 24px', padding: '20px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="container flex-between" style={{ gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} color="white" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{agentName}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <label style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px' }}>
                  <input
                    type="checkbox"
                    checked={isOnline}
                    onChange={handleToggleOnline}
                    disabled={updating}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{ position: 'absolute', cursor: updating ? 'wait' : 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isOnline ? 'var(--success)' : 'var(--bg-surface-elevated)', transition: '.4s', borderRadius: '34px' }}>
                    <span style={{ position: 'absolute', height: '14px', width: '14px', left: '3px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%', transform: isOnline ? 'translateX(16px)' : 'translateX(0)' }} />
                  </span>
                </label>
                <p style={{ margin: 0, fontSize: '0.8rem', color: isOnline ? 'var(--success)' : 'var(--text-muted)' }}>
                  {isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <nav style={{ display: 'flex', gap: '8px' }}>
              <Link to="/" style={navLinkStyle('/')}>
                <Package size={16} /> Orders
              </Link>
              <Link to="/profile" style={navLinkStyle('/profile')}>
                <User size={16} /> Profile
              </Link>
            </nav>
            <button onClick={onLogout} className="btn btn-outline" style={{ padding: '8px' }} aria-label="Sign out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
