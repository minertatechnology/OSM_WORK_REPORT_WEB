import axiosInstance from "./axiosInstance";
import axios from "axios";
import { getAuthToken } from "../utils/tokenHelper";

// สร้าง axios instance สำหรับ OSM API (เหมือนกับ oauth2Service.js)
const osmApi = axios.create({
  baseURL: "https://thaiphc2dev.minertatech.com/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// เพิ่ม interceptor สำหรับ token authentication
osmApi.interceptors.request.use(
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

/**
 * Lookup Service
 * จัดการ API calls สำหรับดึงข้อมูล จังหวัด อำเภอ ตำบล หน่วยบริการ
 */

// Cache storage
const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Helper function สำหรับ cache
 */
const withCache = async (key, fetchFn, ttl = CACHE_TTL) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }

  const data = await fetchFn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};

/**
 * ดึงรายการจังหวัด
 * @param {Object} params - Query parameters
 * @returns {Promise} - Promise containing provinces data
 */
export const getProvinces = async (params = {}) => {
  const { limit = 100, ...rest } = params;
  const cacheKey = `provinces_${JSON.stringify({ limit, ...rest })}`;

  return withCache(
    cacheKey,
    async () => {
      try {
        const response = await axiosInstance.get("/lookups/provinces", {
          params: { limit, ...rest },
        });

        // Parse response data - รองรับหลายรูปแบบ
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (response.data?.items && Array.isArray(response.data.items)) {
          return response.data.items;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          return response.data.data;
        } else if (response.data?.results && Array.isArray(response.data.results)) {
          return response.data.results;
        }

        console.warn("Provinces response is not an array:", response.data);
        return [];
      } catch (error) {
        console.error("Error fetching provinces:", error);
        return [];
      }
    },
    CACHE_TTL
  );
};

/**
 * ดึงรายการอำเภอตามรหัสจังหวัด
 * @param {string} provinceCode - รหัสจังหวัด
 * @returns {Promise} - Promise containing districts data
 */
export const getDistricts = async (provinceCode) => {
  if (!provinceCode) return [];

  const cacheKey = `districts_${provinceCode}`;

  return withCache(
    cacheKey,
    async () => {
      try {
        const response = await axiosInstance.get("/lookups/districts", {
          params: { province_code: provinceCode },
        });

        // Parse response data - รองรับหลายรูปแบบ
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (response.data?.items && Array.isArray(response.data.items)) {
          return response.data.items;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          return response.data.data;
        } else if (response.data?.results && Array.isArray(response.data.results)) {
          return response.data.results;
        }

        console.warn("Districts response is not an array:", response.data);
        return [];
      } catch (error) {
        console.error("Error fetching districts:", error);
        return [];
      }
    },
    CACHE_TTL
  );
};

/**
 * ดึงรายการตำบลตามรหัสอำเภอ
 * @param {string} districtCode - รหัสอำเภอ
 * @returns {Promise} - Promise containing subdistricts data
 */
export const getSubdistricts = async (districtCode) => {
  if (!districtCode) return [];

  const cacheKey = `subdistricts_${districtCode}`;

  return withCache(
    cacheKey,
    async () => {
      try {
        const response = await axiosInstance.get("/lookups/subdistricts", {
          params: { district_code: districtCode },
        });

        // Parse response data - รองรับหลายรูปแบบ
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (response.data?.items && Array.isArray(response.data.items)) {
          return response.data.items;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          return response.data.data;
        } else if (response.data?.results && Array.isArray(response.data.results)) {
          return response.data.results;
        }

        console.warn("Subdistricts response is not an array:", response.data);
        return [];
      } catch (error) {
        console.error("Error fetching subdistricts:", error);
        return [];
      }
    },
    CACHE_TTL
  );
};

/**
 * ดึงรายการเขตสุขภาพ
 * @param {Object} params - Query parameters
 * @returns {Promise} - Promise containing health areas data
 */
export const getHealthAreas = async (params = {}) => {
  const { limit = 100, ...rest } = params;
  const cacheKey = `health_areas_${JSON.stringify({ limit, ...rest })}`;

  return withCache(
    cacheKey,
    async () => {
      try {
        const response = await axiosInstance.get("/lookups/health-areas", {
          params: { limit, ...rest },
        });

        // Parse response data - รองรับหลายรูปแบบ
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (response.data?.items && Array.isArray(response.data.items)) {
          return response.data.items;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          return response.data.data;
        } else if (response.data?.results && Array.isArray(response.data.results)) {
          return response.data.results;
        }

        console.warn("Health areas response is not an array:", response.data);
        return [];
      } catch (error) {
        console.error("Error fetching health areas:", error);
        return [];
      }
    },
    CACHE_TTL
  );
};

/**
 * ดึงรายการหมู่บ้านตามรหัสตำบล
 * @param {string} subdistrictCode - รหัสตำบล
 * @returns {Promise} - Promise containing villages data
 */
export const getVillages = async (subdistrictCode) => {
  if (!subdistrictCode) return [];

  const cacheKey = `villages_${subdistrictCode}`;

  return withCache(
    cacheKey,
    async () => {
      try {
        const response = await axiosInstance.get("/lookups/villages", {
          params: { subdistrict_code: subdistrictCode },
        });

        // Parse response data - รองรับหลายรูปแบบ
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (response.data?.items && Array.isArray(response.data.items)) {
          return response.data.items;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          return response.data.data;
        } else if (response.data?.results && Array.isArray(response.data.results)) {
          return response.data.results;
        }

        console.warn("Villages response is not an array:", response.data);
        return [];
      } catch (error) {
        console.error("Error fetching villages:", error);
        return [];
      }
    },
    CACHE_TTL
  );
};

/**
 * ดึงรายการหน่วยบริการ
 * @param {Object} params - Filter parameters (province_code, district_code, subdistrict_code)
 * @returns {Promise} - Promise containing health services data
 */
export const getHealthServices = async (params = {}) => {
  try {
    const searchParams = new URLSearchParams();

    // ✅ เพิ่มการกรองหน่วยบริการไม่เอาเอกชน (exclude private health services)
    // หน่วยบริการเอกชนที่ต้องกรองออก:
    // - 7310dd94-0395-48cb-845b-803279a54f6c (คลินิกเอกชน)
    // - 96ca3348-49c2-4d89-903b-32939fd1c95c (โรงพยาบาลเอกชน)
    // - f464d614-c20e-4391-84a9-4c8edb7982a9 (หน่วยบริการเอกชนอื่นๆ)
    const excludedHealthServiceTypeIds = [
      "7310dd94-0395-48cb-845b-803279a54f6c",
      "96ca3348-49c2-4d89-903b-32939fd1c95c",
      "f464d614-c20e-4391-84a9-4c8edb7982a9",
    ];

    // เพิ่ม exclude parameters ลงใน searchParams
    excludedHealthServiceTypeIds.forEach((id) => {
      searchParams.append("health_service_type_ids_exclude", id);
    });

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((val) => {
          if (val !== undefined && val !== null && val !== "") {
            searchParams.append(key, val);
          }
        });
        return;
      }

      searchParams.append(key, value);
    });

    const queryString = searchParams.toString();
    const url = queryString
      ? `/lookups/health-services?${queryString}`
      : "/lookups/health-services";

    const response = await axiosInstance.get(url);

    // Parse response data - รองรับหลายรูปแบบ
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data?.items && Array.isArray(response.data.items)) {
      return response.data.items;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response.data?.results && Array.isArray(response.data.results)) {
      return response.data.results;
    }

    console.warn("Health services response is not an array:", response.data);
    return [];
  } catch (error) {
    console.error("Error fetching health services:", error);
    return [];
  }
};

/**
 * ดึงข้อมูล OSM ตามหน่วยบริการสุขภาพ
 * @param {string} healthServiceId - รหัสหน่วยบริการสุขภาพ (health_service_code)
 * @returns {Promise} - Promise containing OSM data
 */
export const getOsmByHealthService = async (healthServiceId) => {
  if (!healthServiceId) return [];

  try {
    const response = await axiosInstance.get("/lookups/osm-by-health-service", {
      params: {
        health_service_id: healthServiceId,
        limit: 200,
      },
    });

    // Parse response data - รองรับหลายรูปแบบ
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data?.items && Array.isArray(response.data.items)) {
      return response.data.items;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response.data?.results && Array.isArray(response.data.results)) {
      return response.data.results;
    }

    console.warn("OSM response is not array:", response.data);
    return [];
  } catch (error) {
    console.error("Error fetching OSM:", error.response?.status, error.response?.data);
    return [];
  }
};

/**
 * ดึงข้อมูล OSM ตาม ID
 * @param {string} osmId - รหัส OSM (id หรือ external_user_id)
 * @returns {Promise} - Promise containing OSM data object with fields:
 * - id, citizen_id, prefix_name_th, first_name, last_name, phone, email
 * - province_id, province_name_th, district_id, district_name_th
 * - subdistrict_id, subdistrict_name_th, health_service_id, health_service_name_th
 * - address_number, alley, street, village_no, village_name, postal_code
 * - และข้อมูลส่วนตัวอื่นๆ
 */
export const getOsmById = async (osmId) => {
  if (!osmId) return null;

  try {
    // ใช้ osmApi แทน axiosInstance เพื่อให้สอดคล้องกับ oauth2Service.js
    const response = await osmApi.get(`/osm/${osmId}`);

    // Parse response data - รองรับหลายรูปแบบ
    // ตรวจสอบว่า response มีข้อมูลหรือไม่
    if (!response.data || !response.data.data) {
      throw new Error("No data in response");
    }

    // ข้อมูลจริงอยู่ใน response.data.data (เหมือนกับ oauth2Service.js)
    return response.data.data;
  } catch (error) {
    // ไม่ log error 404
    if (error?.response?.status !== 404) {
      console.error(`Error fetching OSM by ID ${osmId}:`, error.response?.status, error.response?.data);
    }
    return null;
  }
};

/**
 * ดึงรายการตำแหน่ง/บทบาทเจ้าหน้าที่
 * @param {Object} params - Query parameters
 * @returns {Promise} - Promise containing positions data
 */
export const getPositions = async (params = {}) => {
  const { limit = 100, ...rest } = params;
  const cacheKey = `positions_${JSON.stringify({ limit, ...rest })}`;

  return withCache(
    cacheKey,
    async () => {
      try {
        const response = await axiosInstance.get("/lookups/positions", {
          params: { limit, ...rest },
        });

        // Parse response data - รองรับหลายรูปแบบ
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (response.data?.items && Array.isArray(response.data.items)) {
          return response.data.items;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          return response.data.data;
        } else if (response.data?.results && Array.isArray(response.data.results)) {
          return response.data.results;
        }

        console.warn("Positions response is not an array:", response.data);
        return [];
      } catch (error) {
        console.error("Error fetching positions:", error);
        return [];
      }
    },
    CACHE_TTL
  );
};

/**
 * ล้าง cache
 */
export const clearLookupCache = () => {
  cache.clear();
};

export default {
  getProvinces,
  getDistricts,
  getSubdistricts,
  getVillages,
  getHealthAreas,
  getHealthServices,
  getOsmByHealthService,
  getOsmById,
  getPositions,
  clearLookupCache,
};
