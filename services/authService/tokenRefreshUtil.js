import { refreshToken } from "./authService";
import {
    getRefreshToken,
    getAccessToken,
    setTokens,
    clearTokens,
} from "@utils/tokenStorage";
import idleDetector from "@utils/idleDetector";

let isPaused = false;
let autoRefreshInterval = null;

// ระยะเวลาตรวจสอบ (5 นาที)
const AUTO_REFRESH_CHECK_INTERVAL = 5 * 60 * 1000;

// ระยะเวลา idle สูงสุดก่อน logout (10 นาที)
const MAX_IDLE_BEFORE_LOGOUT = 10 * 60 * 1000;

/**
 * ตรวจสอบและ refresh token อัตโนมัติ
 */
const autoRefreshCheck = async () => {
    if (isPaused) {
        if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
            console.log("[Auto Refresh] Skipped - refresh is paused");
        }
        return;
    }

    const currentAccessToken = getAccessToken();
    const currentRefreshToken = getRefreshToken();

    // ถ้าไม่มี token ไม่ต้องทำอะไร
    if (!currentAccessToken || !currentRefreshToken) {
        if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
            console.log("[Auto Refresh] Skipped - no tokens");
        }
        return;
    }

    // ตรวจสอบเวลา idle
    const idleDuration = idleDetector?.getIdleDuration() || 0;
    const idleMinutes = Math.floor(idleDuration / 60000);

    if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
        console.log(`[Auto Refresh] Checking... idle for ${idleMinutes} minutes`);
    }

    // ถ้า idle นานเกินไป (10 นาที) → logout
    if (idleDuration >= MAX_IDLE_BEFORE_LOGOUT) {
        if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
            console.log("[Auto Refresh] User idle too long - logging out");
        }

        clearTokens();
        stopAutoRefresh();

        if (typeof window !== "undefined" && window.location.pathname !== "/") {
            alert(`Session หมดอายุ\n\nคุณไม่ได้ใช้งานระบบเป็นเวลา ${idleMinutes} นาที\nกรุณาเข้าสู่ระบบใหม่`);
            window.location.href = "/";
        }
        return;
    }

    // ถ้ายังไม่ idle หรือ idle น้อยกว่า 10 นาที → refresh token
    if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
        console.log("[Auto Refresh] Refreshing token...");
    }

    try {
        const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;

        const response = await refreshToken({
            client_id: clientId,
            refresh_token: currentRefreshToken,
        });

        setTokens({
            accessToken: response.access_token,
            refreshToken: response.refresh_token ?? currentRefreshToken,
        });

        if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
            console.log("[Auto Refresh] Token refreshed successfully");
        }
    } catch (error) {
        console.error("[Auto Refresh] Failed to refresh token:", error);
        // ถ้า refresh ไม่สำเร็จ ให้ลอง refresh อีกครั้งในรอบถัดไป
    }
};

/**
 * เริ่มระบบ auto refresh token
 */
export const startAutoRefresh = () => {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }

    // เริ่มตรวจสอบทุก 5 นาที
    autoRefreshInterval = setInterval(autoRefreshCheck, AUTO_REFRESH_CHECK_INTERVAL);

    if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
        console.log(`[Auto Refresh] Started - checking every ${AUTO_REFRESH_CHECK_INTERVAL / 60000} minutes`);
    }

    // รัน check ครั้งแรกหลังจาก 1 นาที (ไม่ต้องรัน
    setTimeout(autoRefreshCheck, 60000);
};

/**
 * หยุดระบบ auto refresh token
 */
export const stopAutoRefresh = () => {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }

    if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
        console.log("[Auto Refresh] Stopped");
    }
};

/**
 * Start token refresh guard (kept for backward compatibility).
 * With on-demand refresh, this simply clears the paused flag.
 */
export const startTokenRefresh = () => {
    isPaused = false;
    startAutoRefresh();

    if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
        console.log("[Token Refresh] On-demand mode enabled with auto-refresh");
    }
};

/**
 * Stop automatic refresh attempts.
 */
export const stopTokenRefresh = () => {
    isPaused = true;
    stopAutoRefresh();

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
    const currentRefreshToken = getRefreshToken();
    const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;

    // ถ้าไม่มี token หรือ client ID ไม่ต้อง throw error - แค่ return false
    if (!currentRefreshToken || !clientId) {
        if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
            console.log("[Force Refresh] Skipped - no refresh token or client ID");
        }
        return false;
    }

    try {
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
        return false;
    }
};
