import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Package, Search, Filter } from 'lucide-react';
import { API } from '../constants/api';

export default function Orders({ token, setToken }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchOrders = useCallback(async ({ showLoading = false } = {}) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.get(`${API}/api/orders`, authHeaders);
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch orders', err);
      if (err.response?.status === 401) {
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  }, [setToken, token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders({ showLoading: false });
    const interval = setInterval(() => fetchOrders({ showLoading: false }), 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = filter === 'all' || o.status === filter;
    const q = search.toLowerCase();
    const matchesSearch =
      String(o.order_id).includes(q) ||
      (o.merchant_shop_name && o.merchant_shop_name.toLowerCase().includes(q)) ||
      (o.provider && o.provider.toLowerCase().includes(q)) ||
      (o.agent_name && o.agent_name.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  const statusBadgeClass = (status) => {
    const map = {
      pending: 'badge-pending',
      assigned: 'badge-assigned',
      accepted: 'badge-assigned',
      out_for_delivery: 'badge-assigned',
      delivered: 'badge-delivered',
      installed: 'badge-delivered',
      cancelled: 'badge-pending',
    };
    return map[status] || 'badge-pending';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Manage Orders</h1>
          <p style={{ color: 'var(--text-muted)' }}>Track, inspect, and audit device dispatch orders.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by order ID, merchant, provider, or agent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '8px', border: '1px solid var(--border-light)', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} color="var(--text-muted)" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'white', outline: 'none' }}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="accepted">Accepted</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="installed">Installed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Package size={20} color="var(--primary)" />
          <h3 style={{ margin: 0 }}>Orders ({filteredOrders.length})</h3>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading orders...</p>
        ) : filteredOrders.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No orders matching your criteria.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Merchant & Shop</th>
                <th>Device & Provider</th>
                <th>Delivery Address</th>
                <th>Status</th>
                <th>Assigned Agent</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.order_id}>
                  <td>
                    <strong>#{order.order_id}</strong>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{order.merchant_shop_name || order.shop_name || `Merchant #${order.merchant_id}`}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{order.merchant_name || '—'} ({order.phone || '—'})</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{order.device_type}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{order.provider}</div>
                  </td>
                  <td style={{ maxWidth: '240px', fontSize: '0.85rem' }}>
                    {order.address || 'Location on record'}
                  </td>
                  <td>
                    <span className={`badge ${statusBadgeClass(order.status)}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>{order.agent_name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {new Date(order.created_at).toLocaleDateString()}
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
