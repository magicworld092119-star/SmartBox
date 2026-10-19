import { useState, useEffect } from 'react';
import { Package, Users, Activity, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { API } from '../constants/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          axios.get(`${API}/api/dashboard/stats`),
          axios.get(`${API}/api/orders`),
        ]);
        setStats(statsRes.data);
        const allOrders = ordersRes.data;
        setOrders(allOrders.slice(0, 10));

        // Build chart data: count orders per day of the week from real data
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const counts = Array(7).fill(0);
        allOrders.forEach(o => {
          const d = new Date(o.created_at).getDay();
          counts[d]++;
        });
        setChartData(days.map((name, i) => ({ name, orders: counts[i] })));
      } catch (err) {
        console.error('Dashboard fetch error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
    const interval = setInterval(fetchAll, 15000); // auto-refresh every 15s
    return () => clearInterval(interval);
  }, []);

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
      <h1 style={{ marginBottom: '8px' }}>Dashboard Overview</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
        Monitor platform activity and dispatch metrics in real time.
      </p>

      {/* Metrics */}
      <div className="grid-metrics">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
            <Package size={20} /> Total Orders Today
          </div>
          <div className="stat-value">
            {loading ? '—' : stats?.total_orders_today ?? 0}
          </div>
        </div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--warning)', fontWeight: 500 }}>
            <Activity size={20} /> Pending Dispatches
          </div>
          <div className="stat-value">
            {loading ? '—' : stats?.pending_dispatches ?? 0}
          </div>
        </div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--success)', fontWeight: 500 }}>
            <CheckCircle size={20} /> Completed Installations
          </div>
          <div className="stat-value">
            {loading ? '—' : stats?.completed_installations ?? 0}
          </div>
        </div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--primary)', fontWeight: 500 }}>
            <Users size={20} /> Active Agents
          </div>
          <div className="stat-value">
            {loading ? '—' : stats?.active_agents ?? 0}
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* Chart */}
        <div className="card">
          <h3 style={{ marginBottom: '24px' }}>Order Volume (by Day of Week)</h3>
          <div style={{ width: '100%', height: '300px' }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                  <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="orders" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                {loading ? 'Loading chart...' : 'No order data yet'}
              </div>
            )}
          </div>
        </div>

        {/* Live Orders Table */}
        <div className="card">
          <h3 style={{ marginBottom: '24px' }}>Live Order Stream</h3>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading orders...</p>
          ) : orders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No orders yet. Place an order from the merchant app.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Merchant</th>
                  <th>Status</th>
                  <th>Agent</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.order_id}>
                    <td>#{order.order_id}</td>
                    <td>{order.merchant_shop_name || `Merchant #${order.merchant_id}`}</td>
                    <td>
                      <span className={`badge ${statusBadgeClass(order.status)}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>{order.agent_name || 'Unassigned'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
