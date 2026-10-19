import { useMemo } from 'react';

export default function useAuthHeaders(token) {
  return useMemo(() => ({
    headers: { Authorization: `Bearer ${token}` },
  }), [token]);
}
