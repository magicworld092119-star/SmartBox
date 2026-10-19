import { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../constants/api';

export default function useAgentProfile(token, setToken) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    let ignore = false;
    const loadProfile = async () => {
      try {
        const res = await axios.get(`${API}/api/agents/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!ignore) {
          setProfile(res.data);
        }
      } catch (err) {
        if (!ignore && err.response?.status === 401) {
          setToken(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    if (token) {
      loadProfile();
    }

    return () => {
      ignore = true;
    };
  }, [token, setToken]);

  const updateOnlineStatus = async (online, latitude, longitude) => {
    let url = `${API}/api/agents/status?status=${online}`;
    if (latitude !== undefined && longitude !== undefined) {
      url += `&latitude=${latitude}&longitude=${longitude}`;
    }

    const res = await axios.put(url, {}, authHeaders);
    setProfile((prev) => prev ? {
      ...prev,
      online_status: res.data.online,
      latitude: res.data.latitude ?? prev.latitude,
      longitude: res.data.longitude ?? prev.longitude,
    } : null);
    return res.data;
  };

  return { profile, loading, updateOnlineStatus, setProfile };
}
