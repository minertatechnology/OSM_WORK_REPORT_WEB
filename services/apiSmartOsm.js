import axios from "axios";
import { getAuthToken, debugTokens } from "../utils/tokenHelper";

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
      console.log("🔑 Token attached:", token.substring(0, 20) + "...");
    } else {
      console.error("❌ No authentication token found! API call will likely fail.");
      console.error("💡 Tip: Run debugTokens() in console to see all token locations");
    }

    console.log("🚀 Smart OSM API Request:", {
      method: config.method?.toUpperCase(),
      url: config.baseURL + config.url,
      params: config.params,
      hasAuth: !!config.headers.Authorization,
    });

    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

apiSmartOsm.interceptors.response.use(
  (response) => {
    console.log("✅ Smart OSM API Response:", {
      status: response.status,
      url: response.config.url,
      dataLength: Array.isArray(response.data) ? response.data.length : "N/A",
    });
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    console.error("❌ Smart OSM API Error:", {
      status,
      message,
      url: error.config?.url,
    });

    // จัดการ 401 Unauthorized และ 403 Forbidden
    if (status === 401 || status === 403) {
      console.error("🚫 Authentication Error!");
      console.error("💡 Solution:");
      console.error("   1. Login to the system first");
      console.error("   2. Make sure your token is valid");
      console.error("   3. Run: debugTokens() to check token status");

      const token = getAuthToken();
      if (!token) {
        console.error("❌ No token found anywhere!");
      } else {
        console.error("❌ Token found but invalid or expired!");
        console.error("🔑 Token preview:", token.substring(0, 30) + "...");
      }
    }

    return Promise.reject(error);
  }
);

export default apiSmartOsm;
