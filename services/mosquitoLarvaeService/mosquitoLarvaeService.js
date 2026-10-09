import axios from "axios";
import { getAccessToken } from "@utils/tokenStorage";
import { formatThaiDateShort } from "@utils/dateFormatter";

const MOSQUITO_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_SMART_OSM_URL;

/**
 * Fetch all mosquito larvae household reports
 * @param {Object} params - Query parameters
 * @param {number} params.skip - Number of records to skip
 * @param {number} params.limit - Maximum number of records to return
 * @returns {Promise<Array>} Array of household report data
 */
export const fetchMosquitoLarvaeHouseholds = async ({ skip = 0, limit = 1000 } = {}) => {
  try {
    const token = getAccessToken();
    const headers = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.get(`${MOSQUITO_API_BASE_URL}/mosquito-larvae/householdsall`, {
      params: {
        skip,
        limit,
      },
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("[MosquitoLarvae] Failed to fetch households:", error);
    throw error;
  }
};

/**
 * สรุปรายงานลูกน้ำรายผู้รับผิดชอบ (อสม.) — API นับครบใน SQL (ไม่จำกัด 1,000 รายงานเหมือน /reportsall)
 * @returns {Promise<{items: Array, total: number, truncated: boolean}>}
 */
export const fetchMosquitoOsmSummary = async ({
  health_region,
  province_id,
  district_id,
  subdistrict_id,
  health_service_id,
  offset,
} = {}) => {
  const token = getAccessToken();
  const params = {};
  if (offset) params.offset = offset;
  if (health_region) params.health_region = health_region;
  if (province_id) params.province_id = province_id;
  if (district_id) params.district_id = district_id;
  if (subdistrict_id) params.subdistrict_id = subdistrict_id;
  if (health_service_id) params.health_service_id = health_service_id;

  const response = await axios.get(`${MOSQUITO_API_BASE_URL}/mosquito-larvae/admin/osm-summary`, {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    timeout: 120000,
  });
  if (!response.data || !Array.isArray(response.data.items)) {
    throw new Error("osm-summary: unexpected response");
  }
  return response.data;
};

/**
 * Fetch all mosquito larvae reports
 * @param {Object} params - Query parameters
 * @param {number} params.skip - Number of records to skip
 * @param {number} params.limit - Maximum number of records to return
 * @param {string} params.start_date - Start date (ISO string)
 * @param {string} params.end_date - End date (ISO string)
 * @param {number} params.health_region - Health region ID
 * @param {string} params.province - Province name (Thai)
 * @param {string} params.province_id - Province ID
 * @param {string} params.district - District name (Thai)
 * @param {string} params.district_id - District ID
 * @param {string} params.subdistrict - Subdistrict name (Thai)
 * @param {string} params.subdistrict_id - Subdistrict ID
 * @param {string} params.health_service_id - Health service ID
 * @returns {Promise<Array>} Array of report data
 */
export const fetchMosquitoLarvaeReports = async ({
  skip = 0,
  limit = 1000,
  start_date,
  end_date,
  health_region,
  province,
  province_id,
  district,
  district_id,
  subdistrict,
  subdistrict_id,
  health_service_id,
  month,
  year,
  week_number,
  external_user_id
} = {}) => {
  try {
    const token = getAccessToken();
    const headers = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const params = { skip, limit };

    // Add date filters if provided
    if (start_date) params.start_date = start_date;
    if (end_date) params.end_date = end_date;

    // Add location filters (both text and ID supported)
    if (health_region) params.health_region = health_region;
    if (province) params.province = province;
    if (province_id) params.province_id = province_id;
    if (district) params.district = district;
    if (district_id) params.district_id = district_id;
    if (subdistrict) params.subdistrict = subdistrict;
    if (subdistrict_id) params.subdistrict_id = subdistrict_id;
    if (health_service_id) params.health_service_id = health_service_id;
    if (external_user_id) params.external_user_id = external_user_id;

    // Add time filters
    if (month) params.month = parseInt(month);
    if (year) params.year = parseInt(year);
    if (week_number) params.week_number = parseInt(week_number);

    console.log("📡 [MosquitoLarvae] API Request params:", params);

    const response = await axios.get(`${MOSQUITO_API_BASE_URL}/mosquito-larvae/reportsall`, {
      params,
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("[MosquitoLarvae] Failed to fetch reports:", error);
    throw error;
  }
};

/**
 * Transform API response to component data structure
 * @param {Array} apiData - Raw API response data
 * @returns {Array} Transformed data for display
 */
export const transformHouseholdData = (apiData) => {
  if (!Array.isArray(apiData)) {
    return [];
  }

  return apiData.map((household) => ({
    id: household.id,
    name: household.address || `บ้านเลขที่ ${household.house_number} หมู่ ${household.village_number}`,
    houseNumber: household.house_number,
    villageNumber: household.village_number,
    address: household.address,
    residents: household.number_of_residents,
    latitude: household.latitude,
    longitude: household.longitude,
    totalReports: household.total_reports,
    date: formatThaiDateShort(household.last_report_date), // แปลงเป็นวันที่ไทย
    larvaeeFreeCount: household.larvae_free_count,
    // For display in table
    amount: household.total_reports || 0,
  }));
};

/**
 * Transform report data structure
 * @param {Array} reports - Raw report data from API
 * @returns {Array} Transformed report data
 */
export const transformReportData = (reports) => {
  if (!Array.isArray(reports)) {
    return [];
  }

  return reports.map((report) => {
    let parsedNotes = { week: report.week_number, inside: [], outside: [] };

    try {
      if (report.notes) {
        // ตรวจสอบก่อนว่าเป็น JSON string ที่ถูกต้อง (ขึ้นต้นด้วย { หรือ [)
        const trimmedNotes = report.notes.trim();
        if ((trimmedNotes.startsWith('{') && trimmedNotes.endsWith('}')) ||
            (trimmedNotes.startsWith('[') && trimmedNotes.endsWith(']'))) {
          parsedNotes = JSON.parse(report.notes);
        } else {
          // ถ้าไม่ใช่ JSON format ให้ใช้ค่าเริ่มต้น
          console.warn("[MosquitoLarvae] Notes is not valid JSON, using default:", trimmedNotes);
        }
      }
    } catch (error) {
      console.error("[MosquitoLarvae] Failed to parse notes:", error);
    }

    return {
      id: report.id,
      householdId: report.household_id,
      reportDate: report.report_date,
      weekNumber: report.week_number,
      month: report.month,
      year: report.year,
      drinkingWaterContainers: report.drinking_water_containers,
      drinkingWaterLarvaeFound: report.drinking_water_larvae_found,
      useWaterContainers: report.use_water_containers,
      useWaterLarvaeFound: report.use_water_larvae_found,
      vaseContainers: report.vase_containers,
      vaseLarvaeFound: report.vase_larvae_found,
      otherContainers: report.other_containers,
      otherLarvaeFound: report.other_larvae_found,
      totalContainers: report.total_containers,
      totalLarvaeFound: report.total_larvae_found,
      larvaeFree: report.larvae_free,
      latitude: report.latitude,
      longitude: report.longitude,
      notes: parsedNotes,
      household: report.household,
      createdAt: report.created_at,
      updatedAt: report.updated_at,
    };
  });
};
