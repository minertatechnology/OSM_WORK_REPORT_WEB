import axios from "axios";
import { getAuthToken } from "../utils/tokenHelper";

/**
 * OAuth2 Service
 * จัดการ API calls สำหรับดึงข้อมูลผู้ใช้จาก Third-party OAuth2
 * API Base URL: https://api-thaiphc.hss.moph.go.th/api/v1
 */

// สร้าง axios instance สำหรับ OAuth2 API
const oauth2Api = axios.create({
  baseURL: "https://api-thaiphc.hss.moph.go.th/api/v1",
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

  // ล้าง cache เก่าออกก่อน
  if (userCache.has(externalUserId)) {
    userCache.delete(externalUserId);
  }

  try {
    // เรียก API: https://api-thaiphc.hss.moph.go.th/api/v1/osm/{external_user_id}
    const response = await oauth2Api.get(`/osm/${externalUserId}`);

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

    const fullName = [prefix, firstName, lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

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
 * ดึงข้อมูล OSM หลายคนพร้อมกันด้วย batch API
 * @param {Array<string>} ids - Array ของ UUID
 * @returns {Promise<Object>} Object ที่มี external_user_id -> user data
 */
export const getOSMsBatch = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return {};
  }

  try {
    // Filter เฉพาะ UUID ที่ถูกต้อง (32-36 ตัวอักษร)
    // UUID pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 chars) หรือ 32 chars (ไม่มี -)
    const validIds = ids.filter(id => {
      if (!id || typeof id !== 'string') return false;
      // ตัด - ออกแล้วต้องเป็น 32 ตัวอักษร (hex digits)
      const cleaned = id.replace(/-/g, '');
      return cleaned.length === 32 && /^[0-9a-f]{32}$/i.test(cleaned);
    });

    // Log ถ้ามี ids ที่ถูก filter ออก
    if (validIds.length < ids.length) {
      const invalidIds = ids.filter(id => !validIds.includes(id));
      console.warn("⚠️ Filtering out invalid UUIDs:", invalidIds);
    }

    if (validIds.length === 0) {
      console.warn("⚠️ No valid UUIDs to send to /osm/batch");
      return {};
    }

    // ยิง POST /osm/batch พร้อม body { ids: [...] }
    const response = await oauth2Api.post('/osm/batch', { ids: validIds });

    // API จะส่งข้อมูลกลับมาเป็น array ใน response.data.data
    if (!response.data || !response.data.data) {
      throw new Error("No data in batch response");
    }

    const usersArray = response.data.data;

    // แปลง array เป็น object โดยใช้ external_user_id (หรือ id) เป็น key
    const usersMap = {};
    usersArray.forEach((apiData) => {
      const userId = apiData.id || apiData.external_user_id;

      const prefix = apiData.prefix_name_th ?? apiData.prefix ?? "";
      const firstName = apiData.first_name ?? apiData.firstName ?? "";
      const lastName = apiData.last_name ?? apiData.lastName ?? "";

      const fullName = [prefix, firstName, lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

      const finalName = fullName || "ไม่ระบุชื่อ";

      usersMap[userId] = {
        ...apiData,
        id: apiData.id || userId,
        name: finalName,
        prefix_name_th: apiData.prefix_name_th || prefix || null,
        first_name: apiData.first_name || firstName || null,
        last_name: apiData.last_name || lastName || null,
        email: apiData.email || null,
        external_user_id: userId,
        profile_picture: apiData.profile_picture || apiData.avatar || null,
        position_level: "อสม.", // ข้อมูลจาก /osm
      };

      // เก็บใน cache ด้วย
      userCache.set(userId, usersMap[userId]);
    });

    return usersMap;
  } catch (error) {
    console.error("Error fetching OSMs batch:", error);
    // ถ้า batch API ล้มเหลว ให้ return empty object
    return {};
  }
};

/**
 * ดึงข้อมูล Officer หลายคนพร้อมกันด้วย batch API
 * @param {Array<string>} ids - Array ของ UUID
 * @returns {Promise<Object>} Object ที่มี external_user_id -> user data
 */
export const getOfficersBatch = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return {};
  }

  try {
    // Filter เฉพาะ UUID ที่ถูกต้อง (32-36 ตัวอักษร)
    // UUID pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 chars) หรือ 32 chars (ไม่มี -)
    const validIds = ids.filter(id => {
      if (!id || typeof id !== 'string') return false;
      // ตัด - ออกแล้วต้องเป็น 32 ตัวอักษร (hex digits)
      const cleaned = id.replace(/-/g, '');
      return cleaned.length === 32 && /^[0-9a-f]{32}$/i.test(cleaned);
    });

    // Log ถ้ามี ids ที่ถูก filter ออก
    if (validIds.length < ids.length) {
      const invalidIds = ids.filter(id => !validIds.includes(id));
      console.warn("⚠️ Filtering out invalid UUIDs:", invalidIds);
    }

    if (validIds.length === 0) {
      console.warn("⚠️ No valid UUIDs to send to /officer/batch");
      return {};
    }

    // ยิง POST /officer/batch พร้อม body { ids: [...] }
    const response = await oauth2Api.post('/officer/batch', { ids: validIds });

    // API จะส่งข้อมูลกลับมาเป็น array ใน response.data.data
    if (!response.data || !response.data.data) {
      throw new Error("No data in batch response");
    }

    const usersArray = response.data.data;

    // แปลง array เป็น object โดยใช้ external_user_id (หรือ id) เป็น key
    const usersMap = {};
    usersArray.forEach((apiData) => {
      const userId = apiData.id || apiData.external_user_id;

      const prefix = apiData.prefix_name_th ?? apiData.prefix ?? "";
      const firstName = apiData.first_name ?? apiData.firstName ?? "";
      const lastName = apiData.last_name ?? apiData.lastName ?? "";

      const fullName = [prefix, firstName, lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

      const finalName = fullName || "ไม่ระบุชื่อ";

      usersMap[userId] = {
        ...apiData,
        id: apiData.id || userId,
        name: finalName,
        prefix_name_th: apiData.prefix_name_th || prefix || null,
        first_name: apiData.first_name || firstName || null,
        last_name: apiData.last_name || lastName || null,
        email: apiData.email || null,
        external_user_id: userId,
        profile_picture: apiData.profile_picture || apiData.avatar || null,
        position_level: "เจ้าหน้าที่", // ข้อมูลจาก /officer
      };

      // เก็บใน cache ด้วย
      userCache.set(userId, usersMap[userId]);
    });

    return usersMap;
  } catch (error) {
    console.error("Error fetching Officers batch:", error);
    // ถ้า batch API ล้มเหลว ให้ return empty object
    return {};
  }
};

/**
 * ดึงข้อมูลผู้ใช้หลายคนพร้อมกัน (ใช้ batch API)
 * @param {Array<string>} externalUserIds - Array ของ UUID
 * @returns {Promise<Object>} Object ที่มี external_user_id -> user data
 */
export const getUsersBatch = async (externalUserIds) => {
  if (!Array.isArray(externalUserIds) || externalUserIds.length === 0) {
    return {};
  }

  const uniqueIds = [...new Set(externalUserIds)];

  try {
    // 1. ลองยิง /osm/batch ก่อน
    const osmResults = await getOSMsBatch(uniqueIds);

    // 2. หา ids ที่ยังไม่ได้ข้อมูล (เพื่อไปลอง /officer/batch)
    const missingIds = uniqueIds.filter(id => !osmResults[id]);

    let officerResults = {};
    if (missingIds.length > 0) {
      // 3. ลองยิง /officer/batch สำหรับ ids ที่เหลือ
      officerResults = await getOfficersBatch(missingIds);
    }

    // 4. รวมผลลัพธ์จากทั้ง 2 endpoints
    return { ...osmResults, ...officerResults };
  } catch (error) {
    console.error("Error in getUsersBatch:", error);
    // ถ้า batch API ล้มเหลวทั้งหมด ให้ return empty object
    return {};
  }
};

/**
 * ล้าง cache ข้อมูลผู้ใช้
 */
export const clearUserCache = () => {
  userCache.clear();
};

/**
 * ดึงข้อมูลผู้ใช้จาก cache (ไม่เรียก API)
 * @param {string} externalUserId - UUID ของผู้ใช้
 * @returns {Object|null} ข้อมูลผู้ใช้หรือ null ถ้าไม่มีใน cache
 */
export const getUserFromCache = (externalUserId) => {
  return userCache.get(externalUserId) || null;
};

/**
 * ดึงรายการเจ้าหน้าที่แบบแบ่งหน้า
 * @param {Object} params - Query parameters
 * @param {number} params.page - หน้าที่ต้องการ (default: 1)
 * @param {number} params.limit - จำนวนต่อหน้า (default: 20)
 * @param {string} params.order_by - ฟิลด์ที่ใช้เรียง (default: created_at)
 * @param {string} params.sort_dir - ทิศทางการเรียง (asc/desc, default: desc)
 * @param {string} params.search - คำค้นหา (optional)
 * @returns {Promise<Object>} { items: [...], total: number, page: number, limit: number, totalPages: number }
 */
export const getOfficersList = async (params = {}) => {
  const {
    page = 1,
    limit = 100,
    order_by = "created_at",
    sort_dir = "desc",
    search = "",
  } = params;

  try {
    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      order_by,
      sort_dir,
    });

    if (search) {
      queryParams.append("search", search);
    }

    const response = await oauth2Api.get(`/officer?${queryParams.toString()}`);

    // API ส่งข้อมูลมาใน response.data โดยตรง (ไม่ได้อยู่ใน response.data.data)
    if (!response.data) {
      return { items: [], total: 0, page, limit, totalPages: 0, pagination: { total: 0, pages: 0 } };
    }

    const data = response.data;
    const items = data.items || [];
    // API ส่ง pagination object ที่มี total และ pages
    const pagination = data.pagination || {};
    const total = pagination.total || data.total || 0;
    const pages = pagination.pages || data.total_pages || data.pages || Math.ceil(total / limit);

    return {
      items,
      total,
      page: pagination.page || data.page || page,
      limit: pagination.limit || data.limit || limit,
      totalPages: pages,
      pagination: {
        total,
        pages: pages,
        page: pagination.page || data.page || page,
        limit: pagination.limit || data.limit || limit,
      },
    };
  } catch (error) {
    console.error("Error fetching officers list:", error);
    return { items: [], total: 0, page, limit, totalPages: 0, pagination: { total: 0, pages: 0 } };
  }
};

export default {
  getById: getUserByExternalId,
  getBatch: getUsersBatch,
  getOSMsBatch: getOSMsBatch,
  getOfficersBatch: getOfficersBatch,
  getOfficersList: getOfficersList,
  clearCache: clearUserCache,
  getFromCache: getUserFromCache,
};
