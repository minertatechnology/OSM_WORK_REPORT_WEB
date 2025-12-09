import { useEffect } from "react";
import { startTokenRefresh, stopTokenRefresh } from "@services/authService/tokenRefreshUtil";
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

        if (token && refreshToken) {
            // Start auto refresh
            startTokenRefresh();
        }

        // Cleanup on unmount
        return () => {
            stopTokenRefresh();
        };
    }, []);
};

export default useTokenRefresh;
