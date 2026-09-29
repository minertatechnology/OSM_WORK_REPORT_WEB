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
 * ดึงผลตรวจสุขภาพแบบแบ่งหน้า (filter + pagination ทำที่ server)
 * @param {Object} params - page, page_size, include_total, start_date, end_date,
 *   province_id, province_ids, district_id, subdistrict_id, health_service_id, service_area_codes
 * @returns {Promise<{items: Array, total: number|null, page: number, page_size: number, total_pages: number|null}>}
 * @throws เมื่อเรียก API ไม่สำเร็จ (ให้หน้าจอแสดง error แทนการแสดงว่าไม่มีข้อมูล)
 */
export const getHealthRecordsAdminPage = async (params = {}) => {
  const response = await apiSmartOsm.get("/health-records-admin", { params });
  return response.data;
};

/**
 * นับจำนวนผลตรวจสุขภาพตาม filter เดียวกับ getHealthRecordsAdminPage
 * @returns {Promise<{total_records: number, unique_users: number}>}
 */
export const getHealthRecordsAdminSummary = async (params = {}) => {
  const response = await apiSmartOsm.get("/health-records-admin/summary", { params });
  return response.data;
};

/**
 * ดึงทุกหน้าตาม filter (ใช้สำหรับ export) - หยุดเมื่อครบหรือถึง maxRows
 * @param {Object} params - filter เดียวกับ getHealthRecordsAdminPage
 * @param {number} maxRows - จำนวนสูงสุดที่ดึง
 * @param {(loaded: number) => void} onProgress
 * @returns {Promise<Array>}
 */
export const getAllHealthRecordsAdmin = async (params = {}, maxRows = 20000, onProgress) => {
  const pageSize = 1000;
  const all = [];
  for (let page = 1; all.length < maxRows; page++) {
    const data = await getHealthRecordsAdminPage({
      ...params,
      page,
      page_size: pageSize,
      include_total: false,
    });
    const items = data?.items || [];
    all.push(...items);
    onProgress?.(all.length);
    if (items.length < pageSize) break;
  }
  return all.slice(0, maxRows);
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
  getHealthRecordsAdminPage,
  getHealthRecordsAdminSummary,
  getAllHealthRecordsAdmin,
  getHealthRecordsByYearMonth,
};
