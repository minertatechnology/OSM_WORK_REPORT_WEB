import axiosInstance from "./axiosInstance";

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
    console.log(`📦 Cache hit: ${key}`);
    return cached.data;
  }

  console.log(`🔄 Cache miss: ${key}, fetching...`);
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
 * ล้าง cache
 */
export const clearLookupCache = () => {
  cache.clear();
  console.log("🗑️ Lookup cache cleared");
};

export default {
  getProvinces,
  getDistricts,
  getSubdistricts,
  getVillages,
  getHealthAreas,
  getHealthServices,
  clearLookupCache,
};
