import { useCallback, useState, useEffect } from 'react';
import axios from 'axios';
import { Users, PlusCircle, XCircle } from 'lucide-react';
import { API } from '../constants/api';

export default function Agents({ token, setToken }) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: ''
  });
  const [formMsg, setFormMsg] = useState({ type: '', text: '' });
  const [formLoading, setFormLoading] = useState(false);

  const fetchAgents = useCallback(async ({ showLoading = true } = {}) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.get(`${API}/api/agents`, authHeaders);
      setAgents(res.data);
    } catch (err) {
      console.error("Failed to fetch agents", err);
      if (err.response?.status === 401) {
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  }, [setToken, token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAgents({ showLoading: false });
  }, [fetchAgents]);

  const handleInputChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormMsg({ type: '', text: '' });
    try {
      const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.post(`${API}/api/agents/register`, formData, authHeaders);
      setFormMsg({ type: 'success', text: 'Agent employee ID stored. The agent can now sign in with it.' });
      setFormData({ employee_id: '' });
      fetchAgents();
      setTimeout(() => setShowForm(false), 2000);
    } catch (err) {
      let msg = "Failed to add agent.";
      if (err.response?.data?.detail) {
        msg = typeof err.response.data.detail === 'string' 
          ? err.response.data.detail 
          : JSON.stringify(err.response.data.detail);
      }
      setFormMsg({ type: 'error', text: msg });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Agents & Zones</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your delivery agents and their operational zones.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
        >
          {showForm ? <XCircle size={18} /> : <PlusCircle size={18} />}
          {showForm ? 'Cancel' : 'Add New Agent'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '24px', animation: 'fadeIn 0.3s' }}>
          <h3 style={{ marginBottom: '8px' }}>Add Agent by Employee ID</h3>
          <p style={{ marginTop: 0, marginBottom: '16px', color: 'var(--text-muted)' }}>Enter the employee ID here. It will be saved for agent login.</p>
          {formMsg.text && (
            <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '16px', background: formMsg.type === 'success' ? '#D1FAE5' : '#FEE2E2', color: formMsg.type === 'success' ? '#059669' : '#DC2626' }}>
              {formMsg.text}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
            <input type="text" name="employee_id" placeholder="Employee ID" value={formData.employee_id} onChange={handleInputChange} required style={inputStyle} />
            <button type="submit" disabled={formLoading} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
              {formLoading ? 'Saving...' : 'Save Employee ID'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Users size={20} color="var(--primary)" />
          <h3 style={{ margin: 0 }}>Registered Agents</h3>
        </div>
        
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading agents...</p>
        ) : agents.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No agents found. Add one above.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Employee ID</th>
                <th>City & Zone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.agent_id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{agent.user?.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{agent.user?.email}</div>
                  </td>
                  <td>{agent.employee_id}</td>
                  <td>
                    {agent.city}
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{agent.zone}</div>
                    {agent.latitude && agent.longitude ? (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        📍 {agent.latitude.toFixed(4)}, {agent.longitude.toFixed(4)}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                        📍 Location not shared
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${agent.online_status ? 'badge-delivered' : 'badge-pending'}`}>
                      {agent.online_status ? 'Online' : 'Offline'}
                    </span>
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

const inputStyle = {
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid var(--border-light)',
  fontSize: '0.95rem',
  outline: 'none',
  fontFamily: 'var(--font-family)'
};
