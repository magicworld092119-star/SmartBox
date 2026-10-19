import { useState } from 'react';
import axios from 'axios';
import { API } from '../constants/api';

export default function Login({ setToken }) {
  const [email, setEmail] = useState('admin@smartbox.app');
  const [password, setPassword] = useState('admin12345');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await axios.post(`${API}/api/admin/login`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      setToken(response.data.access_token);
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
      <form className="card" onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '420px' }}>
        <h1 style={{ marginBottom: '8px' }}>Admin Sign In</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Manage SmartBox operations.</p>

        {error && (
          <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '16px', background: '#FEE2E2', color: '#DC2626' }}>
            {error}
          </div>
        )}

        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          required
          style={{ ...inputStyle, marginBottom: '12px' }}
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          required
          style={{ ...inputStyle, marginBottom: '20px' }}
        />
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid var(--border-light)',
  fontSize: '0.95rem',
  outline: 'none',
  fontFamily: 'var(--font-family)',
};

const buttonStyle = {
  width: '100%',
  background: 'var(--primary)',
  color: 'white',
  border: 'none',
  padding: '12px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 600,
};
