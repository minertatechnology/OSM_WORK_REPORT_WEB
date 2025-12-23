import axios from "axios";
import { getAuthToken } from "../utils/tokenHelper";

/**
 * OAuth2 Service
 * จัดการ API calls สำหรับดึงข้อมูลผู้ใช้จาก Third-party OAuth2
 * API Base URL: https://thaiphc2dev.minertatech.com/api/v1
 */

// สร้าง axios instance สำหรับ OAuth2 API
const oauth2Api = axios.create({
  baseURL: "https://thaiphc2dev.minertatech.com/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// เพิ่ม interceptor สำหรับ token authentication
oauth2Api.interceptors.request.use(
  (config) => {
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

// Cache สำหรับเก็บข้อมูลผู้ใช้ที่ดึงมาแล้ว
const userCache = new Map();

/**
 * ดึงข้อมูลผู้ใช้จาก Third-party OAuth2 ด้วย external_user_id
 * @param {string} externalUserId - UUID ของผู้ใช้
 * @returns {Promise<Object>} ข้อมูลผู้ใช้
 */
export const getUserByExternalId = async (externalUserId) => {
  if (!externalUserId) {
    return {
      id: null,
      name: "ไม่ระบุผู้ประเมิน",
      email: null,
      external_user_id: null,
    };
  }

  // ตรวจสอบ cache ก่อน (ปิดการใช้งาน cache ชั่วคราวเพื่อ debug)
  // if (userCache.has(externalUserId)) {
  //   console.log(`📦 Cache hit for user: ${externalUserId}`);
  //   return userCache.get(externalUserId);
  // }

  // ล้าง cache เก่าออกก่อน
  if (userCache.has(externalUserId)) {
    // console.log(`🗑️ Clearing old cache for: ${externalUserId}`);
    userCache.delete(externalUserId);
  }

  try {
    // เรียก API: https://thaiphc2dev.minertatech.com/api/v1/osm/{external_user_id}
    // console.log(`👥 Fetching user from OAuth2: /osm/${externalUserId}`);
    const response = await oauth2Api.get(`/osm/${externalUserId}`);

    // console.log(`✅ OAuth2 RAW Response for ${externalUserId}:`, JSON.stringify(response.data, null, 2));

    // ตรวจสอบว่า response มีข้อมูลหรือไม่
    if (!response.data || !response.data.data) {
      throw new Error("No data in response");
    }

    // ข้อมูลจริงอยู่ใน response.data.data
    const apiData = response.data.data;

    // แปลงข้อมูลจาก API response
    // API จะส่งมาในรูปแบบ: prefix_name_th, first_name, last_name
    const prefix = apiData.prefix_name_th ?? apiData.prefix ?? "";
    const firstName = apiData.first_name ?? apiData.firstName ?? "";
    const lastName = apiData.last_name ?? apiData.lastName ?? "";

    // console.log(`🔍 API Data:`, apiData);
    // console.log(`🔍 Raw values:`, {
    //   prefix_name_th: apiData.prefix_name_th,
    //   first_name: apiData.first_name,
    //   last_name: apiData.last_name
    // });

    // console.log(`📋 Name parts:`, { prefix, firstName, lastName });

    const fullName = [prefix, firstName, lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    // console.log(`👤 Full name constructed: "${fullName}"`);

    // ถ้าไม่มีชื่อเลย ให้แสดง "ไม่ระบุชื่อ" แทน UUID
    const finalName = fullName || "ไม่ระบุชื่อ";

    const userData = {
      // เก็บข้อมูลดิบทั้งหมดก่อน
      ...apiData,
      // จากนั้น override ด้วยค่าที่เรา transform แล้ว
      id: apiData.id || externalUserId,
      name: finalName,
      prefix_name_th: apiData.prefix_name_th || prefix || null,
      first_name: apiData.first_name || firstName || null,
      last_name: apiData.last_name || lastName || null,
      email: apiData.email || null,
      external_user_id: externalUserId,
      profile_picture: apiData.profile_picture || apiData.avatar || null,
      department: apiData.department || null,
      role: apiData.role || null,
      phone: apiData.phone || null,
      position_level: "อสม.", // ข้อมูลจาก /osm
    };

    // เก็บใน cache
    userCache.set(externalUserId, userData);
    // console.log(`✅ User data fetched and cached: "${userData.name}"`);

    return userData;
  } catch (error) {
    // ถ้าไม่พบข้อมูลจาก /osm/{externalUserId} หรือ 403 Forbidden ให้ลองเรียก /officer/{externalUserId}
    if (error.response?.status === 404 || error.response?.status === 403) {
      try {
        // Silently try /officer endpoint as fallback
        const officerResponse = await oauth2Api.get(`/officer/${externalUserId}`);

        if (officerResponse.data && officerResponse.data.data) {
          const apiData = officerResponse.data.data;

          // แปลงข้อมูลจาก Officer API
          const prefix = apiData.prefix_name_th ?? apiData.prefix ?? "";
          const firstName = apiData.first_name ?? apiData.firstName ?? "";
          const lastName = apiData.last_name ?? apiData.lastName ?? "";

          const fullName = [prefix, firstName, lastName]
            .filter(Boolean)
            .join(" ")
            .trim();

          const finalName = fullName || "ไม่ระบุชื่อ";

          const userData = {
            ...apiData,
            id: apiData.id || externalUserId,
            name: finalName,
            prefix_name_th: apiData.prefix_name_th || prefix || null,
            first_name: apiData.first_name || firstName || null,
            last_name: apiData.last_name || lastName || null,
            email: apiData.email || null,
            external_user_id: externalUserId,
            profile_picture: apiData.profile_picture || apiData.avatar || null,
            department: apiData.department || null,
            role: apiData.role || null,
            phone: apiData.phone || null,
            position_level: "เจ้าหน้าที่", // ข้อมูลจาก /officer
          };

          // เก็บใน cache
          userCache.set(externalUserId, userData);

          return userData;
        }
      } catch (officerError) {
        // Silently fail - will return fallback data
      }
    }

    // Return fallback data ถ้าทั้ง 2 endpoints ล้มเหลว
    const fallbackData = {
      id: externalUserId,
      name: "ไม่ระบุชื่อ",
      email: null,
      external_user_id: externalUserId,
    };

    // เก็บ fallback ใน cache ด้วย
    userCache.set(externalUserId, fallbackData);

    return fallbackData;
  }
};

/**
 * ดึงข้อมูลผู้ใช้หลายคนพร้อมกัน
 * @param {Array<string>} externalUserIds - Array ของ UUID
 * @returns {Promise<Map>} Map ของ external_user_id -> user data
 */
export const getUsersBatch = async (externalUserIds) => {
  if (!Array.isArray(externalUserIds) || externalUserIds.length === 0) {
    return new Map();
  }

  const uniqueIds = [...new Set(externalUserIds)];
  const results = new Map();

  // ดึงข้อมูลทีละคน (หรือใช้ batch API ถ้ามี)
  await Promise.all(
    uniqueIds.map(async (userId) => {
      try {
        const userData = await getUserByExternalId(userId);
        results.set(userId, userData);
      } catch (error) {
        console.error(`Failed to fetch user ${userId}:`, error);
        results.set(userId, {
          id: userId,
          name: "ไม่ระบุชื่อ",
          email: null,
          external_user_id: userId,
        });
      }
    })
  );

  return results;
};

/**
 * ล้าง cache ข้อมูลผู้ใช้
 */
export const clearUserCache = () => {
  userCache.clear();
  console.log("🗑️ User cache cleared");
};

/**
 * ดึงข้อมูลผู้ใช้จาก cache (ไม่เรียก API)
 * @param {string} externalUserId - UUID ของผู้ใช้
 * @returns {Object|null} ข้อมูลผู้ใช้หรือ null ถ้าไม่มีใน cache
 */
export const getUserFromCache = (externalUserId) => {
  return userCache.get(externalUserId) || null;
};

export default {
  getById: getUserByExternalId,
  getBatch: getUsersBatch,
  clearCache: clearUserCache,
  getFromCache: getUserFromCache,
};
