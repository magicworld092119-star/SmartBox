import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  MapPin,
  Navigation,
  Package,
  Store,
  User,
  Phone,
} from 'lucide-react';
import axios from 'axios';
import { API } from '../constants/api';
import useAuthHeaders from '../hooks/useAuthHeaders';
import { formatStatus } from '../utils/format';
import { calculateDistanceKm, formatDistance } from '../utils/distance';
import { requestCurrentPosition } from '../utils/geolocation';

const ORDER_STEPS = ['pending', 'assigned', 'accepted', 'out_for_delivery', 'delivered', 'installed'];

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { token, setToken, profile } = useOutletContext();
  const authHeaders = useAuthHeaders(token);
  const [order, setOrder] = useState(null);
  const [agentLocation, setAgentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const listRes = await axios.get(`${API}/api/agents/orders`, authHeaders);
        const matched = listRes.data.find((item) => String(item.order_id) === String(orderId));
        if (matched) {
          setOrder(matched);
          return;
        }

        const detailRes = await axios.get(`${API}/api/orders/${orderId}`, authHeaders);
        setOrder(detailRes.data);
      } catch (err) {
        console.error('Failed to fetch order', err);
        if (err.response?.status === 401) {
          setToken(null);
        } else {
          setError(err.response?.data?.detail || 'Unable to load order details.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [authHeaders, orderId, setToken]);

  useEffect(() => {
    const loadAgentLocation = async () => {
      if (profile?.latitude != null && profile?.longitude != null) {
        setAgentLocation({
          latitude: profile.latitude,
          longitude: profile.longitude,
        });
      }

      try {
        const position = await requestCurrentPosition();
        setAgentLocation(position);
      } catch (err) {
        console.error('Unable to refresh agent location', err);
      }
    };

    loadAgentLocation();
  }, [profile?.latitude, profile?.longitude]);

  const merchantLat = order?.latitude ?? order?.merchant?.latitude;
  const merchantLon = order?.longitude ?? order?.merchant?.longitude;
  const distanceKm = agentLocation && merchantLat != null && merchantLon != null
    ? calculateDistanceKm(agentLocation.latitude, agentLocation.longitude, merchantLat, merchantLon)
    : null;
  const distanceLabel = formatDistance(distanceKm);

  const openDirections = () => {
    const address = order?.address || order?.merchant?.address;
    const hasMerchantCoords = merchantLat != null && merchantLon != null;
    const hasAgentCoords = agentLocation?.latitude != null && agentLocation?.longitude != null;

    if (!address && !hasMerchantCoords) {
      return;
    }

    const params = new URLSearchParams({ api: '1' });

    if (hasAgentCoords) {
      params.set('origin', `${agentLocation.latitude},${agentLocation.longitude}`);
    }

    if (hasMerchantCoords) {
      params.set('destination', `${merchantLat},${merchantLon}`);
    } else if (address) {
      params.set('destination', address);
    }

    window.open(`https://www.google.com/maps/dir/?${params.toString()}`, '_blank', 'noopener,noreferrer');
  };

  const getNextStatusAction = () => {
    if (!order) return null;
    switch (order.status) {
      case 'assigned':
        return { status: 'accepted', label: 'Accept Order', icon: CheckCircle };
      case 'accepted':
        return { status: 'out_for_delivery', label: 'Start Delivery', icon: Navigation };
      case 'out_for_delivery':
        return { status: 'delivered', label: 'Mark as Delivered', icon: Package };
      case 'delivered':
        return { status: 'installed', label: 'Mark as Installed & Complete', icon: CheckCircle };
      default:
        return null;
    }
  };

  const handleUpdateStatus = async (nextStatus) => {
    setUpdatingStatus(true);
    setStatusMsg('');
    try {
      const res = await axios.patch(
        `${API}/api/agents/orders/${orderId}/status`,
        { status: nextStatus },
        authHeaders,
      );
      setOrder(res.data);
      setStatusMsg(`Status updated to "${formatStatus(nextStatus)}"`);
    } catch (err) {
      console.error('Failed to update status', err);
      alert(err.response?.data?.detail || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const nextAction = getNextStatusAction();
  const currentStepIndex = order ? Math.max(0, ORDER_STEPS.indexOf(order.status)) : 0;
  const createdAt = order?.created_at ? new Date(order.created_at).toLocaleString() : '—';

  if (loading) {
    return (
      <main className="container" style={{ marginTop: '32px', color: 'var(--text-muted)' }}>
        <div className="glass-panel flex-center" style={{ padding: '48px 24px' }}>
          <Clock size={40} style={{ marginRight: '12px', opacity: 0.6 }} />
          Loading order details...
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="container" style={{ marginTop: '32px' }}>
        <button className="btn btn-outline" onClick={() => navigate('/')} style={{ marginBottom: '20px' }}>
          <ArrowLeft size={18} /> Back to orders
        </button>
        <div className="glass-panel" style={{ padding: '32px', color: 'var(--text-muted)' }}>
          {error || 'Order not found.'}
        </div>
      </main>
    );
  }

  return (
    <main className="container" style={{ marginTop: '32px' }}>
      <button className="btn btn-outline" onClick={() => navigate('/')} style={{ marginBottom: '20px' }}>
        <ArrowLeft size={18} /> Back to orders
      </button>

      <div className="glass-panel animate-fade-in" style={{ padding: '24px', marginBottom: '24px' }}>
        <div className="flex-between" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Order #{order.order_id}</p>
            <h2 style={{ margin: 0 }}>{order.shop_name || order.merchant?.shop_name || 'Merchant order'}</h2>
          </div>
          <span className={`badge badge-${order.status}`}>{formatStatus(order.status)}</span>
        </div>

        <div className="detail-grid">
          <DetailItem icon={Store} label="Merchant" value={order.shop_name || order.merchant?.shop_name || 'Not available'} />
          <DetailItem icon={User} label="Contact" value={order.merchant_name || 'Not available'} />
          <DetailItem icon={Phone} label="Phone" value={order.phone || 'Not available'} />
          <DetailItem icon={Package} label="Device" value={order.device_type} />
          <DetailItem icon={CheckCircle} label="Provider" value={order.provider} />
          <DetailItem icon={Calendar} label="Created" value={createdAt} />
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '12px' }}>Order Status & Actions</h3>
        {nextAction ? (
          <div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.95rem' }}>
              Current stage is <strong style={{ color: 'var(--text-primary)' }}>{formatStatus(order.status)}</strong>. Advance the order when ready:
            </p>
            <button
              className="btn btn-primary"
              onClick={() => handleUpdateStatus(nextAction.status)}
              disabled={updatingStatus}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '1rem', fontWeight: 600 }}
            >
              <nextAction.icon size={18} />
              {updatingStatus ? 'Updating status...' : nextAction.label}
            </button>
          </div>
        ) : order.status === 'installed' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--success)', fontWeight: 600, fontSize: '1.05rem' }}>
            <CheckCircle size={22} />
            <span>Order completed & device installed successfully!</span>
          </div>
        ) : order.status === 'cancelled' ? (
          <div style={{ color: 'var(--danger)', fontWeight: 500 }}>This order has been cancelled.</div>
        ) : (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>No further actions required.</p>
        )}
        {statusMsg && (
          <p style={{ color: 'var(--success)', marginTop: '14px', marginBottom: 0, fontSize: '0.9rem', fontWeight: 600 }}>
            ✓ {statusMsg}
          </p>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={18} /> Delivery location
        </h3>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>
          {order.address || order.merchant?.address || 'Address not available'}
        </p>

        {distanceLabel ? (
          <div className="distance-banner">
            <Navigation size={20} />
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>{distanceLabel} away</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Straight-line distance from your current location
              </p>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
            Distance unavailable — enable location access or ensure the merchant location was captured during booking.
          </p>
        )}

        <button
          className="btn btn-primary"
          onClick={openDirections}
          disabled={!(order.address || order.merchant?.address) && (merchantLat == null || merchantLon == null)}
        >
          <ExternalLink size={18} /> Open in Google Maps
          {distanceLabel ? ` (${distanceLabel})` : ''}
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Order progress</h3>
        <div className="timeline">
          {ORDER_STEPS.map((step, index) => {
            const done = index <= currentStepIndex;
            return (
              <div key={step} className="timeline-row">
                <div className={`timeline-dot ${done ? 'timeline-dot-done' : ''}`} />
                <div>
                  <p className={`timeline-title ${done ? 'timeline-title-done' : ''}`}>{formatStatus(step)}</p>
                  <p className="timeline-meta">{done ? 'Updated' : 'Pending'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="detail-item">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '6px' }}>
        <Icon size={15} />
        {label}
      </div>
      <p style={{ margin: 0, fontWeight: 500 }}>{value}</p>
    </div>
  );
}
