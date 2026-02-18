import { refreshToken } from "./authService";
import { getRefreshToken, setTokens, clearTokens } from "@utils/tokenStorage";

let isPaused = false;

/**
 * Start token refresh guard (kept for backward compatibility).
 * With on-demand refresh, this simply clears the paused flag.
 */
export const startTokenRefresh = () => {
  isPaused = false;

  if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
    // console.log("[Token Refresh] On-demand mode enabled");
  }
};

/**
 * Stop automatic refresh attempts.
 */
export const stopTokenRefresh = () => {
  isPaused = true;

  if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
    console.log("[Token Refresh] Disabled");
  }
};

/**
 * Returns whether refresh operations are allowed.
 */
export const isRefreshRunning = () => {
  return !isPaused;
};

/**
 * Pause token refresh (used when user is idle and sees warning modal).
 */
export const pauseTokenRefresh = () => {
  isPaused = true;

  if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
    console.log("[Token Refresh] Paused (idle)");
  }
};

/**
 * Resume token refresh once the user becomes active again.
 */
export const resumeTokenRefresh = () => {
  isPaused = false;

  if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
    console.log("[Token Refresh] Resumed");
  }
};

/**
 * Force refresh token immediately (when user clicks "Stay Logged In").
 */
export const forceRefreshNow = async () => {
  try {
    const currentRefreshToken = getRefreshToken();
    const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;

    if (!currentRefreshToken || !clientId) {
      throw new Error("Missing refresh token or client ID");
    }

    if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
      console.log("[Force Refresh] Refreshing token immediately...");
    }

    const response = await refreshToken({
      client_id: clientId,
      refresh_token: currentRefreshToken,
    });

    setTokens({
      accessToken: response.access_token,
      refreshToken: response.refresh_token ?? currentRefreshToken,
    });

    resumeTokenRefresh();

    return true;
  } catch (error) {
    console.error("[Force Refresh] Failed to refresh token:", error);

    // ✅ ถ้า refresh token ได้ 401 แปลว่า session หมดอายุทั้งหมด
    // ให้ clear tokens และ redirect ไปหน้า login ทันที
    if (error.response?.status === 401) {
      clearTokens();
      if (typeof window !== "undefined" && window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }

    return false;
  }
};
