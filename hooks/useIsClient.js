import { useEffect, useState } from 'react';

/**
 * Hook to check if code is running on client-side
 * Prevents hydration errors by ensuring consistent SSR/CSR rendering
 *
 * @returns {boolean} - true if running on client, false during SSR
 */
export const useIsClient = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
};
