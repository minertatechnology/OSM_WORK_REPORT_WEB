import axios from "axios";

/**
 * Public Report Service
 * จัดการ API calls สำหรับรายงานสาธารณะ (ไม่ต้อง login)
 */

const REPORT_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_SMART_OSM_URL ||
  "http://localhost:8000/api/v1"
).replace(/\/$/, "");

// Create a dedicated axios instance for public report API without error interceptors
const publicReportAxios = axios.create({
  baseURL: REPORT_BASE_URL,
});

/**
 * ดึงข้อมูลรายงาน อสม.1 สรุปตามสถานที่ (สำหรับต่างจังหวัด)
 * GET /report-osm1/summary/by-location
 * @param {Object} params - Filter parameters
 * @param {string} params.fiscal_year - ปีงบประมาณ (เช่น "2568")
 * @param {string} params.month - เดือน (1-12)
 * @param {string} params.zone_code - รหัสเขตสุขภาพ
 * @param {string} params.province_code - รหัสจังหวัด
 * @param {string} params.district_code - รหัสอำเภอ
 * @param {string} params.subdistrict_code - รหัสตำบล
 * @param {string} params.health_service_code - รหัสหน่วยบริการ
 * @returns {Promise} - Promise containing report data
 */
export const getPublicOsm1SummaryByLocation = async (params = {}) => {
  try {
    const searchParams = new URLSearchParams();

    // Map params to query parameters matching API expectation
    if (params.fiscal_year) {
      searchParams.append('fiscal_year', parseInt(params.fiscal_year));
    }
    if (params.month) {
      searchParams.append('report_month', parseInt(params.month));
    }
    if (params.province_code) {
      searchParams.append('province_id', params.province_code);
    }
    if (params.district_code) {
      searchParams.append('district_id', params.district_code);
    }
    if (params.subdistrict_code) {
      searchParams.append('subdistrict_id', params.subdistrict_code);
    }
    if (params.zone_code) {
      searchParams.append('health_area_id', params.zone_code);
    }
    if (params.health_service_code) {
      searchParams.append('health_service_id', params.health_service_code);
    }

    const queryString = searchParams.toString();
    const url = queryString
      ? `/report-osm1/summary/by-location?${queryString}`
      : `/report-osm1/summary/by-location`;

    const response = await publicReportAxios.get(url);

    return response.data;
  } catch (error) {
    // Silently handle 404 errors (no data found) - don't log or alert
    if (error.response?.status === 404) {
      return [];
    }
    // Log other errors but still return empty array to prevent UI errors
    console.error("Error fetching OSM1 summary by location:", error.response?.status, error.response?.data);
    return [];
  }
};

/**
 * ดึงข้อมูลรายงาน อสม.1 สรุปตามสถานที่ (สำหรับกรุงเทพมหานคร)
 * GET /report-osm1-bangkok/summary/by-location
 * @param {Object} params - Filter parameters
 * @param {string} params.fiscal_year - ปีงบประมาณ (เช่น "2569")
 * @param {string} params.month - เดือน (1-12)
 * @param {string} params.district_code - รหัสอำเภอ/เขต
 * @param {string} params.subdistrict_code - รหัสตำบล/แขวง
 * @returns {Promise} - Promise containing report data
 */
export const getPublicOsm1BangkokSummaryByLocation = async (params = {}) => {
  try {
    const searchParams = new URLSearchParams();

    // Map params to query parameters matching API expectation
    if (params.fiscal_year) {
      searchParams.append('fiscal_year', parseInt(params.fiscal_year));
    }
    if (params.month) {
      searchParams.append('report_month', parseInt(params.month));
    }
    if (params.province_code) {
      searchParams.append('province_id', params.province_code);
    }
    if (params.district_code) {
      searchParams.append('district_id', params.district_code);
    }
    if (params.subdistrict_code) {
      searchParams.append('subdistrict_id', params.subdistrict_code);
    }
    if (params.zone_code) {
      searchParams.append('health_area_id', params.zone_code);
    }
    if (params.health_service_code) {
      searchParams.append('health_service_id', params.health_service_code);
    }

    const queryString = searchParams.toString();
    const url = queryString
      ? `/report-osm1-bangkok/summary/by-location?${queryString}`
      : `/report-osm1-bangkok/summary/by-location`;

    const response = await publicReportAxios.get(url);

    return response.data;
  } catch (error) {
    // Silently handle 404 errors (no data found) - don't log or alert
    if (error.response?.status === 404) {
      return [];
    }
    // Log other errors but still return empty array to prevent UI errors
    console.error("Error fetching OSM1 Bangkok summary by location:", error.response?.status, error.response?.data);
    return [];
  }
};

/**
 * ดึงข้อมูลรายงานสาธารณะตามเงื่อนไขที่กรอง
 * @param {Object} params - Filter parameters
 * @param {string} params.fiscal_year - ปีงบประมาณ (เช่น "2568")
 * @param {string} params.month - เดือน (1-12)
 * @param {string} params.zone_code - รหัสเขตสุขภาพ
 * @param {string} params.province_code - รหัสจังหวัด
 * @param {string} params.district_code - รหัสอำเภอ
 * @param {string} params.subdistrict_code - รหัสตำบล
 * @param {string} params.health_service_code - รหัสหน่วยบริการ
 * @returns {Promise} - Promise containing report data
 */
export const getPublicReportData = async (params = {}) => {
  try {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, value);
      }
    });

    const queryString = searchParams.toString();
    const url = queryString
      ? `/reports/public/osm1-summary?${queryString}`
      : `/reports/public/osm1-summary`;

    const response = await publicReportAxios.get(url);

    return response.data;
  } catch (error) {
    console.error("Error fetching public report data:", error);
    throw error;
  }
};

/**
 * ดึงข้อมูลสรุปรายงาน อสม.1 สำหรับสาธารณะ
 * @param {Object} params - Filter parameters
 * @returns {Promise} - Promise containing summary data
 */
export const getPublicOsm1Summary = async (params = {}) => {
  try {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, value);
      }
    });

    const queryString = searchParams.toString();
    const url = queryString
      ? `/reports/public/osm1-summary?${queryString}`
      : `/reports/public/osm1-summary`;

    const response = await publicReportAxios.get(url);

    // รองรับหลายรูปแบบ response
    if (response.data?.data) {
      return response.data.data;
    } else if (response.data?.items) {
      return response.data.items;
    } else if (Array.isArray(response.data)) {
      return response.data;
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching OSM1 summary:", error);
    // Return empty array on error instead of throwing
    return [];
  }
};

export default {
  getPublicReportData,
  getPublicOsm1Summary,
  getPublicOsm1SummaryByLocation,
  getPublicOsm1BangkokSummaryByLocation,
};
