import { Platform } from 'react-native';

const memoryStore = new Map();

export function readStorage(key, fallback) {
  if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
    try {
      const value = sessionStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }
  return memoryStore.has(key) ? memoryStore.get(key) : fallback;
}

export function writeStorage(key, value) {
  if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // private mode / quota
    }
  }
  memoryStore.set(key, value);
}

export function clearStorage(key) {
  if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
  memoryStore.delete(key);
}
