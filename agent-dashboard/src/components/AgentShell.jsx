import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AgentLayout from './AgentLayout';
import { API } from '../constants/api';
import useAgentProfile from '../hooks/useAgentProfile';
import { watchAgentPosition } from '../utils/geolocation';

export default function AgentShell({ token, setToken }) {
  const navigate = useNavigate();
  const { profile, loading, updateOnlineStatus } = useAgentProfile(token, setToken);
  const isOnline = Boolean(profile?.online_status);

  useEffect(() => {
    if (!token || !isOnline) {
      return undefined;
    }

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    let lastSync = 0;

    const stopWatching = watchAgentPosition(
      async ({ latitude, longitude }) => {
        const now = Date.now();
        if (now - lastSync < 30000) {
          return;
        }
        lastSync = now;

        try {
          await axios.put(
            `${API}/api/agents/status?status=true&latitude=${latitude}&longitude=${longitude}`,
            {},
            authHeaders,
          );
        } catch (err) {
          console.error('Failed to sync location', err);
        }
      },
      (error) => console.error('Location watch error', error),
    );

    return stopWatching;
  }, [token, isOnline]);

  const handleLogout = () => {
    sessionStorage.removeItem('agent_token');
    setToken(null);
    navigate('/login');
  };

  if (loading && !profile) {
    return (
      <div className="container flex-center" style={{ minHeight: '100vh', color: 'var(--text-muted)' }}>
        Loading agent session...
      </div>
    );
  }

  return (
    <AgentLayout profile={profile} isOnline={isOnline} updateOnlineStatus={updateOnlineStatus} onLogout={handleLogout}>
      <Outlet context={{ token, setToken, profile, isOnline, updateOnlineStatus }} />
    </AgentLayout>
  );
}
