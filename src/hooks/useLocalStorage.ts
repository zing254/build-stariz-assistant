import { useCallback, useEffect, useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') return initialValue;
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((previous) => typeof value === 'function' ? (value as (prev: T) => T)(previous) : value);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // Storage can be unavailable in private browsing or when quota is full.
    }
  }, [key, storedValue]);

  useEffect(() => {
    const sync = (event: Event) => {
      if ((event as StorageEvent).key && (event as StorageEvent).key !== key) return;
      try {
        const raw = window.localStorage.getItem(key);
        if (raw !== null) setStoredValue(JSON.parse(raw));
      } catch {
        // Keep the last valid in-memory value.
      }
    };
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('storage', sync);
    };
  }, [key]);

  return [storedValue, setValue];
}
