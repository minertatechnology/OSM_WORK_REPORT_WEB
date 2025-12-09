import { useEffect, useState } from 'react';

/**
 * Hook for safely accessing sessionStorage with SSR support
 * Prevents hydration errors by handling server/client differences
 *
 * @param {string} key - The sessionStorage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {[any, Function, boolean]} - [value, setValue, isLoaded]
 */
export const useSessionStorage = (key, defaultValue = null) => {
  const [value, setValue] = useState(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const item = sessionStorage.getItem(key);
      if (item !== null) {
        setValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error);
    }
    setIsLoaded(true);
  }, [key]);

  const setStorageValue = (newValue) => {
    try {
      setValue(newValue);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(key, JSON.stringify(newValue));
      }
    } catch (error) {
      console.error(`Error setting sessionStorage key "${key}":`, error);
    }
  };

  return [value, setStorageValue, isLoaded];
};
