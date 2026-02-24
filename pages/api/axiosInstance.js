import axios from "axios";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "@utils/tokenStorage";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Track if token refresh is in progress
let isRefreshing = false;
let failedQueue = [];

const TOKEN_REFRESH_THRESHOLD_MS =
  Number(process.env.NEXT_PUBLIC_TOKEN_REFRESH_THRESHOLD_SECONDS || 60) * 1000;

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
    if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
      console.warn(
        "[axiosInstance] Failed to decode base64 token payload",
        error,
      );
    }
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
    if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
      console.warn("[axiosInstance] Failed to parse JWT payload", error);
    }
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

const getTokenRemainingMs = (token) => {
  const expirationTime = getTokenExpiration(token);
  if (!expirationTime) {
    return null;
  }

  const clientNow = Date.now();
  const serverOffset =
    typeof window !== "undefined" &&
    typeof window.SERVER_TIME_OFFSET_MS === "number"
      ? window.SERVER_TIME_OFFSET_MS
      : 0;

  const effectiveNow = clientNow + serverOffset;
  return expirationTime - effectiveNow;
};

const shouldRefreshToken = (token) => {
  const remaining = getTokenRemainingMs(token);
  if (typeof remaining !== "number") {
    return false;
  }
  return remaining <= TOKEN_REFRESH_THRESHOLD_MS;
};

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
      throw new Error("Missing refresh token or client ID");
    }

    const response = await axiosInstance.post("/auth/token/refresh", {
      client_id: clientId,
      refresh_token: refreshToken,
    });

    const { access_token, refresh_token: newRefreshToken } = response.data;

    setTokens({
      accessToken: access_token,
      refreshToken: newRefreshToken ?? refreshToken,
    });

    return access_token;
  } catch (error) {
    if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
      console.error("Token refresh failed:", error);
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

// Request Interceptor
const isFormDataPayload = (value) => {
  if (typeof FormData === "undefined" || !value) {
    return false;
  }
  return value instanceof FormData;
};

axiosInstance.interceptors.request.use(
  async (config) => {
    config.headers = config.headers || {};

    if (isFormDataPayload(config.data)) {
      delete config.headers["Content-Type"];
      delete config.headers?.common?.["Content-Type"];
    } else if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }

    const isAuthEndpoint =
      config.url?.includes("/auth/login") ||
      config.url?.includes("/auth/token/refresh");

    if (isAuthEndpoint) {
      return config;
    }

    const token = getAccessToken();
    if (token) {
      let activeToken = token;
      const needsRefresh = shouldRefreshToken(token);

      if (needsRefresh) {
        try {
          activeToken = await refreshAccessToken();
        } catch (refreshError) {
          if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
            console.error(
              "[Token Refresh] Pre-flight refresh failed",
              refreshError,
            );
          }
          activeToken = token;
        }
      }

      config.headers.Authorization = `Bearer ${activeToken}`;

      if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
        const preview = `${String(activeToken).slice(0, 12)}...`;
        // console.log(
        //   "[axiosInstance][auth]",
        //   config.method?.toUpperCase(),
        //   config.url,
        //   {
        //     hasAuthHeader: Boolean(config.headers.Authorization),
        //     tokenPreview: preview,
        //   }
        // );
      }
    } else if (
      process.env.NEXT_PUBLIC_DEBUG_MODE === "true" &&
      !isAuthEndpoint
    ) {
      // console.warn(
      //   `[axiosInstance][request] ${config.method?.toUpperCase()} ${
      //     config.url
      //   } - No token found`,
      // );
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
      // console.log(
      //   "[axiosInstance][response]",
      //   response.config.method?.toUpperCase(),
      //   response.config.url,
      //   response.status,
      //   response.data,
      // );
    }
    return response;
  },
  async (error) => {
    if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
      // console.error(
      //   "[axiosInstance][error]",
      //   error?.config?.method?.toUpperCase(),
      //   error?.config?.url,
      //   error?.response?.status,
      //   error?.response?.data,
      // );
    }
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors (token invalid or expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh for login and refresh token endpoints
      if (
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/token/refresh")
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();

        if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
          console.log("[Token Refresh] Successfully refreshed token");
        }

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
          console.error("Token refresh failed");
        }

        // Refresh failed - redirect to login
        clearTokens();

        if (typeof window !== "undefined" && window.location.pathname !== "/") {
          window.location.href = "/";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
