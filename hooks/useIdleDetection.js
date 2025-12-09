import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { forceRefreshNow, stopTokenRefresh } from "@services/authService/tokenRefreshUtil";
import { getAccessToken, clearTokens } from "@utils/tokenStorage";

const decodeBase64Url = (input) => {
    if (!input) {
        return null;
    }

    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");

    try {
        if (typeof window !== "undefined" && typeof window.atob === "function") {
            return window.atob(normalized);
        }

        if (typeof Buffer !== "undefined") {
            return Buffer.from(normalized, "base64").toString("utf-8");
        }
    } catch (error) {
        console.warn("[SessionExpiry] Failed to decode base64", error);
    }

    return null;
};

const decodeJwtPayload = (token) => {
    if (!token) {
        return null;
    }

    const segments = token.split(".");
    if (segments.length < 2) {
        return null;
    }

    const payload = decodeBase64Url(segments[1]);
    if (!payload) {
        return null;
    }

    try {
        return JSON.parse(payload);
    } catch (error) {
        console.warn("[SessionExpiry] Failed to parse JWT payload", error);
        return null;
    }
};

const getTokenExpiration = (token) => {
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) {
        return null;
    }

    const exp = Number(payload.exp);
    if (Number.isNaN(exp)) {
        return null;
    }

    return exp * 1000;
};

const getTimeOffset = () => {
    if (typeof window !== "undefined" && typeof window.SERVER_TIME_OFFSET_MS === "number") {
        return window.SERVER_TIME_OFFSET_MS;
    }
    return 0;
};

const DEFAULT_CHECK_INTERVAL = 1000;
const DEFAULT_REFRESH_THRESHOLD = 120 * 1000; // เพิ่มเป็น 2 นาทีก่อนหมดอายุ
const MIN_REFRESH_SPACING = 5 * 1000;
const ACTIVITY_GRACE_PERIOD = 5 * 60 * 1000; // เพิ่มเป็น 5 นาที - ถ้าผู้ใช้มีกิจกรรมภายใน 5 นาทีที่แล้ว
const ACTIVITY_EVENTS = ["pointerdown", "pointermove", "keydown", "touchstart"];

export const useIdleDetection = ({
    checkInterval = DEFAULT_CHECK_INTERVAL,
    refreshThreshold = DEFAULT_REFRESH_THRESHOLD,
} = {}) => {
    const router = useRouter();
    const isLoggingOutRef = useRef(false);
    const lastRefreshAttemptRef = useRef(0);
    const lastActivityRef = useRef(Date.now());

    const forceLogout = useCallback(() => {
        if (isLoggingOutRef.current) {
            return;
        }

        isLoggingOutRef.current = true;
        stopTokenRefresh();
        clearTokens();

        if (typeof window !== "undefined") {
            window.location.href = "/";
        } else if (router.pathname !== "/") {
            router.push("/");
        }
    }, [router]);

    const recordActivity = useCallback(() => {
        if (typeof document !== "undefined") {
            const isVisible = document.visibilityState === "visible";
            const hasFocus = document.hasFocus();
            if (!isVisible || !hasFocus) {
                return;
            }
        }
        lastActivityRef.current = Date.now();
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") {
            return undefined;
        }

        const handleVisibility = () => {
            if (!document.hidden) {
                recordActivity();
            }
        };

        ACTIVITY_EVENTS.forEach((event) =>
            window.addEventListener(event, recordActivity, { passive: true })
        );
        document.addEventListener("visibilitychange", handleVisibility);
        window.addEventListener("focus", recordActivity);

        return () => {
            ACTIVITY_EVENTS.forEach((event) =>
                window.removeEventListener(event, recordActivity)
            );
            document.removeEventListener("visibilitychange", handleVisibility);
            window.removeEventListener("focus", recordActivity);
        };
    }, [recordActivity]);

    useEffect(() => {
        if (router.pathname === "/") {
            return undefined;
        }

        const evaluateSession = async () => {
            const token = getAccessToken();
            if (!token) {
                forceLogout();
                return;
            }

            const expirationTime = getTokenExpiration(token);
            if (!expirationTime) {
                return;
            }

            const nowWithOffset = Date.now() + getTimeOffset();
            const remaining = expirationTime - nowWithOffset;

            if (remaining <= 0) {
                forceLogout();
                return;
            }

            // ลดข้อกำหนดในการ refresh - ไม่จำเป็นต้องมี focus แค่ต้องเป็น visible page
            const shouldRefresh =
                remaining <= refreshThreshold &&
                document.visibilityState === "visible";

            if (shouldRefresh) {
                const now = Date.now();
                const sinceLastRefresh = now - lastRefreshAttemptRef.current;
                const sinceLastActivity = now - lastActivityRef.current;

                // รีเฟรช token ถ้า:
                // 1. ไม่ได้รีเฟรชมานานกว่า 5 วินาที
                // 2. มีกิจกรรมภายใน 5 นาที หรือ เหลือเวลาน้อยกว่า 30 วินาที (force refresh)
                if (
                    sinceLastRefresh >= MIN_REFRESH_SPACING &&
                    (sinceLastActivity <= ACTIVITY_GRACE_PERIOD || remaining <= 30 * 1000)
                ) {
                    lastRefreshAttemptRef.current = now;

                    if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
                        console.log(`[SessionExpiry] Attempting refresh - ${Math.floor(remaining / 1000)}s remaining`);
                    }

                    try {
                        const refreshSuccess = await forceRefreshNow();

                        if (refreshSuccess === false) {
                            // ไม่มี refresh token - ต้อง logout
                            if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
                                console.warn("[SessionExpiry] No refresh token available - logging out");
                            }
                            forceLogout();
                            return;
                        }

                        if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
                            console.log("[SessionExpiry] Token refreshed successfully");
                        }
                    } catch (error) {
                        console.error("[SessionExpiry] Silent refresh failed", error);

                        // ถ้าเหลือเวลามากกว่า 10 วินาที ให้ลองใหม่ในรอบถัดไป
                        if (remaining > 10 * 1000) {
                            if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
                                console.log("[SessionExpiry] Will retry refresh in next interval");
                            }
                            return;
                        }

                        // ถ้าเหลือเวลาน้อยกว่า 10 วินาที ต้อง logout
                        forceLogout();
                    }
                }
            }
        };

        const interval = setInterval(evaluateSession, checkInterval);
        return () => clearInterval(interval);
    }, [checkInterval, forceLogout, refreshThreshold, router.pathname]);

    return {
        isWarningOpen: false,
        countdown: 0,
        handleStayLoggedIn: () => { },
        handleLogout: forceLogout,
    };
};

export default useIdleDetection;
