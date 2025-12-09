import axios from "axios";
import { getAccessToken } from "@utils/tokenStorage";
import { formatThaiDateShort } from "@utils/dateFormatter";

const MOSQUITO_API_BASE_URL = "http://192.168.1.134:8000/api/v1";

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
 * Fetch all mosquito larvae reports
 * @param {Object} params - Query parameters
 * @param {number} params.skip - Number of records to skip
 * @param {number} params.limit - Maximum number of records to return
 * @returns {Promise<Array>} Array of report data
 */
export const fetchMosquitoLarvaeReports = async ({ skip = 0, limit = 1000 } = {}) => {
  try {
    const token = getAccessToken();
    const headers = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.get(`${MOSQUITO_API_BASE_URL}/mosquito-larvae/reportsall`, {
      params: {
        skip,
        limit,
      },
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
        parsedNotes = JSON.parse(report.notes);
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
