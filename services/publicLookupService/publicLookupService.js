import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// Create a separate axios instance for public API calls (no auth required)
const publicAxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

/**
 * Public Lookup Service
 * จัดการ API calls สำหรับดึงข้อมูล จังหวัด อำเภอ ตำบล หน่วยบริการ สำหรับหน้าสาธารณะ
 */

/**
 * ดึงรายการจังหวัด
 * @param {Object} params - Query parameters
 * @returns {Promise} - Promise containing provinces data
 */
export const getPublicProvinces = async (params = {}) => {
  try {
    const { limit = 100, ...rest } = params;
    const response = await publicAxiosInstance.get("/lookups/provinces", {
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
};

/**
 * ดึงรายการอำเภอตามรหัสจังหวัด
 * @param {string} provinceCode - รหัสจังหวัด
 * @returns {Promise} - Promise containing districts data
 */
export const getPublicDistricts = async (provinceCode) => {
  if (!provinceCode) return [];

  try {
    const response = await publicAxiosInstance.get("/lookups/districts", {
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
};

/**
 * ดึงรายการตำบลตามรหัสอำเภอ
 * @param {string} districtCode - รหัสอำเภอ
 * @returns {Promise} - Promise containing subdistricts data
 */
export const getPublicSubdistricts = async (districtCode) => {
  if (!districtCode) return [];

  try {
    const response = await publicAxiosInstance.get("/lookups/subdistricts", {
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
};

/**
 * ดึงรายการเขตสุขภาพ
 * @param {Object} params - Query parameters
 * @returns {Promise} - Promise containing health areas data
 */
export const getPublicHealthAreas = async (params = {}) => {
  try {
    const { limit = 100, ...rest } = params;
    const response = await publicAxiosInstance.get("/lookups/health-areas", {
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
};

/**
 * ดึงรายการหน่วยบริการ
 * @param {Object} params - Filter parameters (province_code, district_code, subdistrict_code)
 * @returns {Promise} - Promise containing health services data
 */
export const getPublicHealthServices = async (params = {}) => {
  try {
    const searchParams = new URLSearchParams();

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

    const response = await publicAxiosInstance.get(url);

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

export default {
  getPublicProvinces,
  getPublicDistricts,
  getPublicSubdistricts,
  getPublicHealthAreas,
  getPublicHealthServices,
};
