import { useOutletContext } from 'react-router-dom';
import {
  Briefcase,
  Mail,
  MapPin,
  Phone,
  Radio,
  User,
} from 'lucide-react';

export default function Profile() {
  const { profile } = useOutletContext();
  // Toggle moved to AgentLayout (navigation header)

  if (!profile) {
    return (
      <main className="container" style={{ marginTop: '32px', color: 'var(--text-muted)' }}>
        Loading profile...
      </main>
    );
  }

  const locationLabel = profile.latitude && profile.longitude
    ? `${profile.latitude.toFixed(5)}, ${profile.longitude.toFixed(5)}`
    : 'Not shared yet';

  return (
    <main className="container" style={{ marginTop: '32px' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={28} color="white" />
          </div>
          <div>
            <h2 style={{ margin: 0 }}>{profile.user?.name}</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>{profile.employee_id}</p>
          </div>
        </div>

        <div className="detail-grid">
          <ProfileField icon={Mail} label="Email" value={profile.user?.email || '—'} />
          <ProfileField icon={Phone} label="Phone" value={profile.user?.phone || '—'} />
          <ProfileField icon={Briefcase} label="City" value={profile.city} />
          <ProfileField icon={Radio} label="Zone" value={profile.zone} />
          <ProfileField icon={MapPin} label="Current location" value={locationLabel} />
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ marginBottom: '8px' }}>Availability</h3>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
          Use the toggle in the top navigation bar to change your online status and receive nearby delivery assignments.
        </p>
      </div>
    </main>
  );
}

function ProfileField({ icon: Icon, label, value }) {
  return (
    <div className="detail-item">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '6px' }}>
        <Icon size={15} />
        {label}
      </div>
      <p style={{ margin: 0, fontWeight: 500, wordBreak: 'break-word' }}>{value}</p>
    </div>
  );
}
