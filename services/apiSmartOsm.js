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
  (error) => {
    // Silently handle errors - let the calling code decide how to handle
    return Promise.reject(error);
  }
);

export default apiSmartOsm;
