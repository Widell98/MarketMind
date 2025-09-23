import { useCallback, useEffect, useRef, useState } from 'react';

const isClient = typeof window !== 'undefined';

const resolveValue = <T,>(value: T | (() => T)): T =>
  value instanceof Function ? value() : value;

export function useLocalStorage<T>(key: string, initialValue: T | (() => T)) {
  const initialValueRef = useRef(initialValue);
  initialValueRef.current = initialValue;

  const getInitialValue = useCallback((): T => {
    return resolveValue(initialValueRef.current);
  }, []);

  const readStoredValue = useCallback((): T => {
    if (!isClient) {
      return getInitialValue();
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        return JSON.parse(item) as T;
      }
    } catch (error) {
      console.warn(`Unable to read localStorage key "${key}":`, error);
    }

    return getInitialValue();
  }, [getInitialValue, key]);

  const skipNextPersist = useRef(false);

  const [storedValue, setStoredValue] = useState<T>(() => readStoredValue());

  const setValue = useCallback(
    (value: T | ((previous: T) => T)) => {
      setStoredValue(prev => {
        const resolved = value instanceof Function ? value(prev) : value;
        return resolved;
      });
    },
    []
  );

  useEffect(() => {
    if (!isClient) return;
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Unable to set localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const reset = useCallback(() => {
    const defaultValue = getInitialValue();
    skipNextPersist.current = true;
    setStoredValue(defaultValue);

    if (!isClient) return;

    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Unable to remove localStorage key "${key}":`, error);
    }
  }, [getInitialValue, key]);

  return [storedValue, setValue, reset] as const;
}
