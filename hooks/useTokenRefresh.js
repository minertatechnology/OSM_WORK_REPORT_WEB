import { useEffect } from "react";
import {
  startTokenRefresh,
  stopTokenRefresh,
} from "@services/authService/tokenRefreshUtil";
import { getAccessToken, getRefreshToken } from "@utils/tokenStorage";

/**
 * Custom hook to manage automatic token refresh
 * Usage: Add this to your main app component or layout
 */
export const useTokenRefresh = () => {
  useEffect(() => {
    // Check if user is logged in
    const token = getAccessToken();
    const refreshToken = getRefreshToken();

    if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
      // console.log("[useTokenRefresh] Checking tokens:", {
      //     hasAccessToken: !!token,
      //     hasRefreshToken: !!refreshToken,
      //     refreshTokenPreview: refreshToken ? refreshToken.substring(0, 20) + "..." : null,
      // });
    }

    if (token && refreshToken) {
      // Start auto refresh
      startTokenRefresh();
    } else if (token && !refreshToken) {
      //   console.warn(
      //     "[useTokenRefresh] ⚠️ Access token exists but NO refresh token! Token refresh will NOT work.",
      //   );
    }

    // Cleanup on unmount
    return () => {
      stopTokenRefresh();
    };
  }, []);
};

export default useTokenRefresh;
