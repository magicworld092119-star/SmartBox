import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Store, MapPin, User } from 'lucide-react';
import { API } from '../constants/api';

export default function Merchants({ token, setToken }) {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMerchants = useCallback(async ({ showLoading = false } = {}) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.get(`${API}/api/merchants`, authHeaders);
      setMerchants(res.data);
    } catch (err) {
      console.error('Failed to fetch merchants', err);
      if (err.response?.status === 401) {
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  }, [setToken, token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMerchants({ showLoading: false });
  }, [fetchMerchants]);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ marginBottom: '8px' }}>Registered Merchants</h1>
        <p style={{ color: 'var(--text-muted)' }}>List of merchants utilizing SmartBox payment devices.</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Store size={20} color="var(--primary)" />
          <h3 style={{ margin: 0 }}>Merchants Directory ({merchants.length})</h3>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading merchants...</p>
        ) : merchants.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No merchants found.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Merchant ID</th>
                <th>Shop Name</th>
                <th>Contact Name & Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Coordinates</th>
              </tr>
            </thead>
            <tbody>
              {merchants.map((m) => (
                <tr key={m.merchant_id}>
                  <td><strong>#{m.merchant_id}</strong></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{m.shop_name}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} color="var(--text-muted)" />
                      <span>{m.user?.name || 'Merchant'}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {m.user?.email || '—'}
                    </div>
                  </td>
                  <td>{m.user?.phone || '—'}</td>
                  <td style={{ maxWidth: '280px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                      <MapPin size={14} style={{ marginTop: '2px', flexShrink: 0, color: 'var(--text-muted)' }} />
                      <span>{m.address}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {m.latitude != null && m.longitude != null ? (
                      `📍 ${m.latitude.toFixed(4)}, ${m.longitude.toFixed(4)}`
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
