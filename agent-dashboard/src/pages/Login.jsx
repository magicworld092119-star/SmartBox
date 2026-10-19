import { useState } from 'react';
import { LogIn, Box, MapPin } from 'lucide-react';
import axios from 'axios';
import { API } from '../constants/api';
import { requestCurrentPosition } from '../utils/geolocation';

export default function Login({ setToken }) {
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let lat = null;
      let lon = null;
      try {
        const pos = await requestCurrentPosition();
        lat = pos.latitude;
        lon = pos.longitude;
      } catch (locErr) {
        console.warn('Geolocation unavailable or denied during login:', locErr);
      }

      const response = await axios.post(`${API}/api/agents/login`, {
        employee_id: employeeId,
      });

      const token = response.data.access_token;

      let statusUrl = `${API}/api/agents/status?status=true`;
      if (lat != null && lon != null) {
        statusUrl += `&latitude=${lat}&longitude=${lon}`;
      }

      try {
        await axios.put(
          statusUrl,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } catch (statusErr) {
        console.warn('Failed to update online status on login:', statusErr);
      }

      setToken(token);
    } catch (err) {
      let errorMsg = 'Invalid credentials or backend is down.';
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMsg = err.response.data.detail.map(d => d.msg).join(', ');
        } else {
          errorMsg = err.response.data.detail;
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex-center" style={{ minHeight: '100vh' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', background: 'var(--primary-glow)', color: 'var(--primary)', marginBottom: '16px' }}>
            <Box size={32} />
          </div>
          <h2>Agent Portal</h2>
          <p style={{ color: 'var(--text-muted)' }}>Sign in to manage your dispatch tasks</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(245, 124, 0, 0.12)', border: '1px solid rgba(245, 124, 0, 0.25)', marginBottom: '20px' }}>
          <MapPin size={18} style={{ marginTop: '2px', color: 'var(--primary)', flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Location access is required to sign in. You will be set online automatically so dispatch can assign nearby orders.
          </p>
        </div>

        {error && (
          <div style={{ background: 'var(--danger)', color: 'white', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group" style={{ marginBottom: '24px' }}>
            <label className="input-label">Employee ID</label>
            <input
              type="text"
              className="input-field"
              placeholder="AGENT001"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Requesting location & signing in...' : (
              <>
                <LogIn size={20} />
                Sign In with Location
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
