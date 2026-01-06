import axios from "axios";
import { getAuthToken, debugTokens } from "../utils/tokenHelper";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "@utils/tokenStorage";

// Export debugTokens เพื่อให้เรียกใช้ได้จาก window
if (typeof window !== "undefined") {
  window.debugTokens = debugTokens;
}

// เชื่อมต่อตรงกับ Smart OSM API
const apiSmartOsm = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_SMART_OSM_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 วินาที
});

// Track if token refresh is in progress
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Function to refresh the token
const handleTokenRefresh = async () => {
  try {
    const refreshToken = getRefreshToken();
    const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;

    if (!refreshToken || !clientId) {
      if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
        console.warn("[apiSmartOsm] No refresh token or client ID available");
      }
      clearTokens();
      if (typeof window !== "undefined" && window.location.pathname !== "/") {
        window.location.href = "/";
      }
      throw new Error("No refresh token available");
    }

    // เรียก API refresh token โดยใช้ base URL หลัก (ไม่ใช่ Smart OSM)
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/token/refresh`,
      {
        client_id: clientId,
        refresh_token: refreshToken,
      }
    );

    const { access_token, refresh_token: newRefreshToken } = response.data;

    setTokens({
      accessToken: access_token,
      refreshToken: newRefreshToken ?? refreshToken,
    });

    if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
      console.log("[apiSmartOsm] Token refreshed successfully");
    }

    return access_token;
  } catch (error) {
    if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
      console.error("[apiSmartOsm] Token refresh failed:", error);
    }
    throw error;
  }
};

const refreshAccessToken = async () => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const newToken = await handleTokenRefresh();
    processQueue(null, newToken);
    return newToken;
  } catch (error) {
    processQueue(error, null);
    throw error;
  } finally {
    isRefreshing = false;
  }
};

apiSmartOsm.interceptors.request.use(
  (config) => {
    // จัดการ Content-Type
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    // ดึง token จาก helper function
    const token = getAuthToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiSmartOsm.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors (token invalid or expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiSmartOsm(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        clearTokens();

        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/"
        ) {
          window.location.href = "/";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiSmartOsm;
