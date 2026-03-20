import apiSmartOsm from "./apiSmartOsm";

/**
 * Analytics Service
 * จัดการ API calls สำหรับ Analytics และ Unique Users
 */

/**
 * ดึงจำนวน Unique Users ตามเงื่อนไข
 * @param {Object} params - Query parameters
 * @param {string} params.menu_type - ประเภทเมนู (pregnant_women, elderly_screening, ncds, health_record, count_carbs, mosquito_larvae, report_osm1)
 * @param {number} params.health_region - เขตสุขภาพ (1-13)
 * @param {string} params.province_name - ชื่อจังหวัด
 * @param {string} params.district_name - ชื่ออำเภอ/เขต
 * @param {string} params.subdistrict_name - ชื่อตำบล/แขวง
 * @param {number} params.year - ปี พ.ศ.
 * @param {number} params.month - เดือน (1-12)
 * @param {string} params.start_date - วันที่เริ่มต้น
 * @param {string} params.end_date - วันที่สิ้นสุด
 * @returns {Promise<Object>} ข้อมูล unique users
 */
export const getUniqueUsersCount = async ({
  menu_type,
  health_region,
  province_name,
  district_name,
  subdistrict_name,
  year,
  month,
  start_date,
  end_date,
} = {}) => {
  try {
    const params = {};

    if (menu_type) params.menu_type = menu_type;
    if (health_region) params.health_region = health_region;
    if (province_name) params.province_name = province_name;
    if (district_name) params.district_name = district_name;
    if (subdistrict_name) params.subdistrict_name = subdistrict_name;
    if (year) params.year = year;
    if (month) params.month = month;
    if (start_date) params.start_date = start_date;
    if (end_date) params.end_date = end_date;

    const response = await apiSmartOsm.get("/analytics/unique-users", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching unique users count:", error);
    throw error;
  }
};

/**
 * ดึงข้อมูล Dashboard Summary รวมทั้ง Unique Users
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} ข้อมูล dashboard summary
 */
export const getDashboardSummary = async ({
  health_region,
  province_name,
  district_name,
  subdistrict_name,
  health_station,
  year,
  month,
  fiscal_year,
  start_date,
  end_date,
} = {}) => {
  try {
    const params = {};

    if (health_region) params.health_region = health_region;
    if (province_name) params.province_name = province_name;
    if (district_name) params.district_name = district_name;
    if (subdistrict_name) params.subdistrict_name = subdistrict_name;
    if (health_station) params.health_station = health_station;
    if (year) params.year = year;
    if (month) params.month = month;
    if (fiscal_year) params.fiscal_year = fiscal_year;
    if (start_date) params.start_date = start_date;
    if (end_date) params.end_date = end_date;

    const response = await apiSmartOsm.get("/analytics/dashboard/summary", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    throw error;
  }
};

export default {
  getUniqueUsersCount,
  getDashboardSummary,
};
