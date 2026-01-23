import apiSmartOsm from "./apiSmartOsm";

/**
 * Health Record Service
 * จัดการ API calls สำหรับดึงข้อมูลผลตรวจสุขภาพ อสม.
 */

/**
 * ดึงรายการผลตรวจสุขภาพทั้งหมด
 * @param {Object} params - Query parameters (skip, limit)
 * @returns {Promise} - Promise containing health records data
 */
export const getHealthRecords = async (params = {}) => {
  try {
    const { skip = 0, limit = 100, ...rest } = params;

    const response = await apiSmartOsm.get("/health-recordsall", {
      params: { skip, limit, ...rest },
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

    console.warn("Health records response is not an array:", response.data);
    return [];
  } catch (error) {
    console.error("Error fetching health records:", error);
    return [];
  }
};

/**
 * ดึงรายการผลตรวจสุขภาพตามปีและเดือน (พ.ศ.)
 * @param {number} buddhistYear - ปี พ.ศ. (เช่น 2568)
 * @param {number} month - เดือน 1-12 (optional)
 * @returns {Promise} - Promise containing filtered health records
 */
export const getHealthRecordsByYearMonth = async (buddhistYear, month = null) => {
  try {
    const allRecords = await getHealthRecords({ limit: 1000 });

    // แปลงปี พ.ศ. เป็น ค.ศ.
    const gregorianYear = buddhistYear - 543;

    const filtered = allRecords.filter((record) => {
      if (!record.updated_at) return false;

      const date = new Date(record.updated_at);
      const recordYear = date.getFullYear();
      const recordMonth = date.getMonth() + 1; // 0-indexed to 1-indexed

      if (recordYear !== gregorianYear) return false;
      if (month && recordMonth !== month) return false;

      return true;
    });

    return filtered;
  } catch (error) {
    console.error("Error filtering health records:", error);
    return [];
  }
};

export default {
  getHealthRecords,
  getHealthRecordsByYearMonth,
};
