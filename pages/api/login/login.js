import axios from "axios";
import Cookies from "js-cookie";

/**
 * Decode JWT token (without verification - client side only)
 */
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
};

export const loginUser = async ({ username, password, client_id, user_type, scope }) => {
  try {
    // เรียก API โดยตรงแบบเดียวกับ DASHBOARD_SMART_OSM_WEB
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login/json`,
      {
        username,
        password,
        client_id,
        user_type,
        scope
      }
    );

    const data = response.data;

    // บันทึก access_token ใน cookie
    if (data.access_token) {
      const maxAge = data.expires_in || 3600; // default 1 hour
      Cookies.set("token", data.access_token, {
        path: "/",
        expires: maxAge / 86400, // convert seconds to days
        sameSite: 'lax'
      });

      // Decode JWT เพื่อดึงข้อมูล
      const decoded = decodeJWT(data.access_token);
      if (decoded) {
        const userInfo = {
          sub: decoded.sub,
          user_type: decoded.ut,
          client_id: decoded.cid,
          scope: decoded.scope,
        };
        if (typeof window !== "undefined") {
          localStorage.setItem("user_info", JSON.stringify(userInfo));
        }
      }
    }

    // บันทึก refresh_token
    if (data.refresh_token && typeof window !== "undefined") {
      localStorage.setItem("refresh_token", data.refresh_token);
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * ดึงข้อมูลผู้ใช้จาก /auth/me
 */
export const fetchUserInfo = async () => {
  try {
    // ดึง token จาก cookie
    const token = Cookies.get("token");

    // เรียก API โดยตรงแบบเดียวกับ DASHBOARD_SMART_OSM_WEB
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // API response: { success: true, data: { name, position_name_th, ... } }
    // ดึงเฉพาะ data ออกมา
    const userInfo = response.data?.data || response.data;

    // บันทึกข้อมูลผู้ใช้ลง localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("user_info", JSON.stringify({
        ...userInfo,
        fetchedAt: Date.now(),
      }));
    }

    return userInfo;
  } catch (error) {
    console.error("Failed to fetch user info:", error);
    throw error;
  }
};

/**
 * ดึงข้อมูลผู้ใช้จาก localStorage (ถ้ามี) หรือเรียก API ใหม่
 */
export const getUserInfo = async () => {
  if (typeof window === "undefined") return null;

  try {
    const cached = localStorage.getItem("user_info");
    if (cached) {
      const userInfo = JSON.parse(cached);
      const age = Date.now() - (userInfo.fetchedAt || 0);
      // ถ้าไม่เกิน 5 นาที ใช้ cache
      if (age < 5 * 60 * 1000) {
        return userInfo;
      }
    }
  } catch (e) {
    console.warn("Failed to read cached user info:", e);
  }

  // ถ้าไม่มี cache หรือหมดอายุ ให้ fetch ใหม่
  return await fetchUserInfo();
};
