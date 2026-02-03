import axiosInstance from "../axiosInstance";

/**
 * Public Report Service
 * จัดการ API calls สำหรับรายงานสาธารณะ (ไม่ต้อง login)
 */

const REPORT_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_SMART_OSM_URL ||
  "http://localhost:8000/api/v1"
).replace(/\/$/, "");

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
      ? `${REPORT_BASE_URL}/reports/public/osm1-summary?${queryString}`
      : `${REPORT_BASE_URL}/reports/public/osm1-summary`;

    const response = await axiosInstance.get(url);

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
      ? `${REPORT_BASE_URL}/reports/public/osm1-summary?${queryString}`
      : `${REPORT_BASE_URL}/reports/public/osm1-summary`;

    const response = await axiosInstance.get(url);

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
};
