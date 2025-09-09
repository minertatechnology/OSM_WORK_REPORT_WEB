import { useState, useEffect } from "react";

// Custom hook for sessionStorage with logging
const useStore = (key) => {
  const [value, setValue] = useState(() => {
    try {
      const item = sessionStorage.getItem(key);
      console.log(`[useStore] Initial read for key "${key}":`, item);
      return item ? JSON.parse(item) : null;
    } catch (err) {
      console.error(`[useStore] Error parsing item for key "${key}":`, err);
      return null;
    }
  });

  useEffect(() => {
    // Listen for changes to sessionStorage (from other tabs)
    const onStorageChange = (event) => {
      if (event.storageArea === sessionStorage && event.key === key) {
        console.log(
          `[useStore] Storage event for key "${key}":`,
          event.newValue
        );
        setValue(event.newValue ? JSON.parse(event.newValue) : null);
      }
    };
    window.addEventListener("storage", onStorageChange);
    return () => window.removeEventListener("storage", onStorageChange);
  }, [key]);

  // Setter with logging
  const setStoreValue = (newValue) => {
    setValue(newValue);
    try {
      sessionStorage.setItem(key, JSON.stringify(newValue));
      console.log(`[useStore] Set key "${key}":`, newValue);
    } catch (err) {
      console.error(`[useStore] Error setting item for key "${key}":`, err);
    }
  };

  // Remover with logging
  const removeStoreValue = () => {
    setValue(null);
    sessionStorage.removeItem(key);
    console.log(`[useStore] Removed key "${key}" from sessionStorage`);
  };

  return [value, setStoreValue, removeStoreValue];
};

export default useStore;
