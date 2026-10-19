import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Clock, MapPin, Navigation, Package, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { API } from '../constants/api';
import useAuthHeaders from '../hooks/useAuthHeaders';

export default function Dashboard() {
  const { token, setToken } = useOutletContext();
  const navigate = useNavigate();
  const authHeaders = useAuthHeaders(token);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${API}/api/agents/orders`, authHeaders);
        setOrders(res.data);
      } catch (err) {
        console.error('Failed to fetch orders', err);
        if (err.response?.status === 401) {
          setToken(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 20000);
    return () => clearInterval(interval);
  }, [authHeaders, setToken]);

  // Filter orders from the last 24 hours
  const RECENT_THRESHOLD = 24 * 60 * 60 * 1000;
  const recentOrders = orders.filter(
    (order) => new Date() - new Date(order.created_at) < RECENT_THRESHOLD
  );

  const activeOrders = recentOrders.filter(
    (o) => o.status !== 'installed' && o.status !== 'delivered' && o.status !== 'cancelled'
  );
  
  const completedOrders = recentOrders.filter(
    (o) => o.status === 'installed' || o.status === 'delivered' || o.status === 'cancelled'
  );

  const renderOrderCard = (order) => (
    <div key={order.order_id} className="glass-panel animate-fade-in" style={{ padding: '20px' }}>
      <div className="flex-between" style={{ marginBottom: '16px' }}>
        <span className={`badge badge-${order.status}`}>{order.status.replace(/_/g, ' ')}</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>#{order.order_id}</span>
      </div>

      <h3 style={{ fontSize: '1.2rem' }}>
        {order.shop_name || order.merchant?.shop_name || `Order #${order.order_id}`}
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
        <MapPin size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
        {order.address || order.merchant?.address || 'Address not available'}
      </p>

      <div style={{ background: 'var(--bg-surface-elevated)', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Package size={16} color="var(--primary)" />
          <span style={{ fontWeight: 500 }}>{order.device_type}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          <CheckCircle size={14} />
          <span>Provider: {order.provider}</span>
        </div>
      </div>

      <button
        className="btn btn-primary"
        style={{ width: '100%' }}
        onClick={() => navigate(`/orders/${order.order_id}`)}
      >
        <Navigation size={18} /> View Order Details
      </button>
    </div>
  );

  return (
    <main className="container" style={{ marginTop: '32px' }}>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <h2>Agent Dashboard</h2>
      </div>

      {loading ? (
        <div className="glass-panel flex-center" style={{ flexDirection: 'column', padding: '48px 24px', color: 'var(--text-muted)' }}>
          <Clock size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3>Loading your orders...</h3>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '32px' }}>
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Active Assignments</h3>
              <span className="badge badge-assigned">{activeOrders.length} Pending</span>
            </div>
            
            {activeOrders.length > 0 ? (
              <div className="grid-cards">
                {activeOrders.map(renderOrderCard)}
              </div>
            ) : (
              <div className="glass-panel flex-center" style={{ flexDirection: 'column', padding: '32px 16px', color: 'var(--text-muted)' }}>
                <Clock size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <h4>No Active Orders</h4>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>Stay online to receive new assignments.</p>
              </div>
            )}
          </div>

          <div>
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Completed (Last 24h)</h3>
              <span className="badge badge-installed">{completedOrders.length} Done</span>
            </div>

            {completedOrders.length > 0 ? (
              <div className="grid-cards" style={{ opacity: 0.8 }}>
                {completedOrders.map(renderOrderCard)}
              </div>
            ) : (
              <div className="glass-panel flex-center" style={{ padding: '24px', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>No completed orders in the last 24 hours.</p>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
