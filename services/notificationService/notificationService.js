import axios from "axios";
import { getAccessToken } from "@utils/tokenStorage";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_SMART_OSM_URL;

/**
 * Notification Service
 * ใช้สำหรับเรียก API ของระบบ Notifications
 */

/**
 * ดึงรายการ notifications ทั้งหมด
 * @param {Object} params - Query parameters
 * @param {number} params.skip - Number of records to skip (pagination)
 * @param {number} params.limit - Maximum number of records to return
 * @param {boolean} params.is_active - Filter by active status
 * @param {string} params.type - Filter by type (info, warning, alert, success, system)
 * @param {string} params.target_level - Filter by target level
 * @returns {Promise<Object>} { total, notifications }
 */
export const fetchNotifications = async ({
  skip = 0,
  limit = 100,
  is_active = null,
  type = null,
  target_level = null,
} = {}) => {
  try {
    const token = getAccessToken();
    const headers = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const params = { skip, limit };
    if (is_active !== null) params.is_active = is_active;
    if (type) params.type = type;
    if (target_level) params.target_level = target_level;

    const response = await axios.get(`${API_BASE_URL}/notifications`, {
      params,
      headers,
    });

    return response.data;
  } catch (error) {
    console.error("[Notification] Failed to fetch notifications:", error);
    throw error;
  }
};

/**
 * ดึงข้อมูล notification ตาม ID
 * @param {string} id - Notification ID
 * @returns {Promise<Object>} Notification data
 */
export const fetchNotificationById = async (id) => {
  try {
    const token = getAccessToken();
    const headers = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.get(`${API_BASE_URL}/notifications/${id}`, {
      headers,
    });

    return response.data;
  } catch (error) {
    console.error("[Notification] Failed to fetch notification by ID:", error);
    throw error;
  }
};

/**
 * สร้าง notification ใหม่
 * @param {Object} data - Notification data
 * @returns {Promise<Object>} Created notification
 */
export const createNotification = async (data) => {
  try {
    const token = getAccessToken();
    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.post(
      `${API_BASE_URL}/notifications`,
      data,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error("[Notification] Failed to create notification:", error);
    throw error;
  }
};

/**
 * แก้ไข notification
 * @param {string} id - Notification ID
 * @param {Object} data - Updated data
 * @returns {Promise<Object>} Updated notification
 */
export const updateNotification = async (id, data) => {
  try {
    const token = getAccessToken();
    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.put(
      `${API_BASE_URL}/notifications/${id}`,
      data,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error("[Notification] Failed to update notification:", error);
    throw error;
  }
};

/**
 * ลบ notification
 * @param {string} id - Notification ID
 * @returns {Promise<void>}
 */
export const deleteNotification = async (id) => {
  try {
    const token = getAccessToken();
    const headers = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    await axios.delete(`${API_BASE_URL}/notifications/${id}`, {
      headers,
    });
  } catch (error) {
    console.error("[Notification] Failed to delete notification:", error);
    throw error;
  }
};

/**
 * Toggle notification active status
 * @param {string} id - Notification ID
 * @returns {Promise<Object>} Updated notification
 */
export const toggleNotificationActive = async (id) => {
  try {
    const token = getAccessToken();
    const headers = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.patch(
      `${API_BASE_URL}/notifications/${id}/toggle-active`,
      {},
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error("[Notification] Failed to toggle active:", error);
    throw error;
  }
};

/**
 * Toggle notification pinned status
 * @param {string} id - Notification ID
 * @returns {Promise<Object>} Updated notification
 */
export const toggleNotificationPin = async (id) => {
  try {
    const token = getAccessToken();
    const headers = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.patch(
      `${API_BASE_URL}/notifications/${id}/toggle-pin`,
      {},
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error("[Notification] Failed to toggle pin:", error);
    throw error;
  }
};

/**
 * Transform API notification data to component format
 * @param {Array} apiData - Raw API notifications
 * @returns {Array} Transformed notifications
 */
export const transformNotificationData = (apiData) => {
  if (!Array.isArray(apiData)) {
    return [];
  }

  return apiData.map((notification) => ({
    id: notification.id,
    date: notification.date || formatDate(notification.created_at),
    time: notification.time || formatTime(notification.created_at),
    title: notification.title,
    message: notification.message,
    type: notification.type,
    target_level: notification.target_level,
    target_location: notification.target_location,
    category: notification.category,
    icon: notification.icon,
    image: notification.image,
    link: notification.link,
    is_active: notification.is_active,
    is_pinned: notification.is_pinned,
    priority: notification.priority,
    scheduled_at: notification.scheduled_at,
    expires_at: notification.expires_at,
    author_name: notification.author_name,
    author_role: notification.author_role,
    external_user_id: notification.external_user_id,
    created_at: notification.created_at,
    updated_at: notification.updated_at,
    // For backward compatibility with old NewsComp format
    detail: notification.message,
  }));
};

/**
 * Format date to Thai format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted Thai date
 */
const formatDate = (dateString) => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear() + 543;

    const thaiMonths = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
      "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
      "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];

    return `${day} ${thaiMonths[month]} ${year}`;
  } catch (error) {
    console.error("[Notification] Failed to format date:", error);
    return dateString;
  }
};

/**
 * Format time to Thai format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted time
 */
const formatTime = (dateString) => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes} น.`;
  } catch (error) {
    console.error("[Notification] Failed to format time:", error);
    return "";
  }
};

export default {
  fetchNotifications,
  fetchNotificationById,
  createNotification,
  updateNotification,
  deleteNotification,
  toggleNotificationActive,
  toggleNotificationPin,
  transformNotificationData,
};
