import axios from "axios";
import { getAccessToken } from "@utils/tokenStorage";

const SMART_OSM_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_SMART_OSM_URL || "http://172.23.192.1:8000/api/v1";

/**
 * Service สำหรับดึงข้อมูลรายงานทั้งหมดพร้อม latitude/longitude
 */
class ReportsMapService {
  /**
   * ดึงข้อมูลรายงานทั้งหมดสำหรับแสดงบนแผนที่
   * @param {Object} filters - ตัวกรอง
   * @param {string} filters.report_type - ประเภทรายงาน
   * @param {string} filters.start_date - วันที่เริ่มต้น (ISO format)
   * @param {string} filters.end_date - วันที่สิ้นสุด (ISO format)
   * @param {number} filters.limit - จำนวนรายงานสูงสุด
   * @returns {Promise<Object>} ข้อมูลรายงานทั้งหมด
   */
  async getReportsMapData(filters = {}) {
    try {
      const params = new URLSearchParams();

      // ส่งเฉพาะ filters ที่ backend รองรับ
      if (filters.report_type) params.append("report_type", filters.report_type);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);
      if (filters.limit) params.append("limit", filters.limit);
      // Permission-based filters (สำหรับ filter ตามสิทธิ์ user)
      if (filters.health_region) params.append("health_region", filters.health_region);
      if (filters.province_code) params.append("province_code", filters.province_code);
      if (filters.district_code) params.append("district_code", filters.district_code);
      if (filters.subdistrict_code) params.append("subdistrict_code", filters.subdistrict_code);

      const token = getAccessToken();
      console.log("🔑 Token for map-data:", token ? `${token.substring(0, 20)}...` : "NO TOKEN");

      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const url = `${SMART_OSM_API_BASE_URL}/analytics/reports/map-data?${params.toString()}`;
      console.log("🌐 Fetching map-data from:", url);

      const response = await axios.get(url, { headers });

      console.log("✅ Map-data response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching reports map data:", error);
      console.error("❌ Error response:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลรายงานตามประเภท
   * @param {string} reportType - ประเภทรายงาน
   * @param {Object} filters - ตัวกรองเพิ่มเติม
   * @returns {Promise<Object>} ข้อมูลรายงานตามประเภท
   */
  async getReportsByType(reportType, filters = {}) {
    return this.getReportsMapData({
      ...filters,
      report_type: reportType,
    });
  }

  /**
   * ดึงข้อมูลรายงานตามจังหวัด
   * @param {string} provinceCode - รหัสจังหวัด
   * @param {Object} filters - ตัวกรองเพิ่มเติม
   * @returns {Promise<Object>} ข้อมูลรายงานในจังหวัด
   */
  async getReportsByProvince(provinceCode, filters = {}) {
    return this.getReportsMapData({
      ...filters,
      province_code: provinceCode,
    });
  }

  /**
   * ดึงข้อมูลรายงานตามช่วงเวลา
   * @param {string} startDate - วันที่เริ่มต้น (ISO format)
   * @param {string} endDate - วันที่สิ้นสุด (ISO format)
   * @param {Object} filters - ตัวกรองเพิ่มเติม
   * @returns {Promise<Object>} ข้อมูลรายงานในช่วงเวลา
   */
  async getReportsByDateRange(startDate, endDate, filters = {}) {
    return this.getReportsMapData({
      ...filters,
      start_date: startDate,
      end_date: endDate,
    });
  }

  /**
   * ดึงข้อมูลสรุปรายงานแยกตามจังหวัด พร้อม location_data
   * @param {Object} filters - ตัวกรอง
   * @param {string} filters.report_type - ประเภทรายงาน
   * @param {string} filters.start_date - วันที่เริ่มต้น (ISO format)
   * @param {string} filters.end_date - วันที่สิ้นสุด (ISO format)
   * @returns {Promise<Object>} ข้อมูลสรุปรายงานแยกตามจังหวัด
   */
  async getProvinceSummary(filters = {}) {
    try {
      const params = new URLSearchParams();

      // ส่งเฉพาะ filters ที่ backend รองรับ (report_type, start_date, end_date)
      // การ filter ตาม จังหวัด/อำเภอ/ตำบล จะทำฝั่ง frontend
      if (filters.report_type) params.append("report_type", filters.report_type);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);

      // เพิ่มพารามิเตอร์ show_unique_users (default: true)
      params.append("show_unique_users", filters.show_unique_users !== false ? "true" : "false");

      const token = getAccessToken();
      console.log("🔑 Token for province-summary:", token ? `${token.substring(0, 20)}...` : "NO TOKEN");

      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const url = `${SMART_OSM_API_BASE_URL}/analytics/reports/province-summary?${params.toString()}`;
      console.log("🌐 Fetching province-summary from:", url);

      const response = await axios.get(url, { headers });

      console.log("✅ Province-summary response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching province summary:", error);
      console.error("❌ Error response:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลสรุปแบบ Dynamic ตามระดับ (province/district/subdistrict)
   * @param {Object} filters - ตัวกรอง
   * @param {string} filters.level - ระดับ (province/district/subdistrict) ถ้าไม่ระบุจะ auto-detect
   * @param {string} filters.province_code - กรองตามจังหวัด (สำหรับ level=district)
   * @param {string} filters.district_code - กรองตามอำเภอ (สำหรับ level=subdistrict)
   * @param {number} filters.health_region - เขตสุขภาพ (1-13)
   * @param {string} filters.report_type - ประเภทรายงาน
   * @param {string} filters.start_date - วันที่เริ่มต้น (ISO format)
   * @param {string} filters.end_date - วันที่สิ้นสุด (ISO format)
   * @returns {Promise<Object>} ข้อมูลสรุป dynamic
   */
  async getGeoSummary(filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.level) params.append("level", filters.level);
      if (filters.province_code) params.append("province_code", filters.province_code);
      if (filters.district_code) params.append("district_code", filters.district_code);
      if (filters.health_region) params.append("health_region", filters.health_region);
      if (filters.report_type) params.append("report_type", filters.report_type);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);
      if (filters.limit) params.append("limit", filters.limit);
      params.append("show_unique_users", filters.show_unique_users !== false ? "true" : "false");

      const token = getAccessToken();
      console.log("🔑 Token for geo-summary:", token ? `${token.substring(0, 20)}...` : "NO TOKEN");

      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const url = `${SMART_OSM_API_BASE_URL}/analytics/reports/geo-summary?${params.toString()}`;
      console.log("🌐 Fetching geo-summary from:", url);

      const response = await axios.get(url, { headers });

      console.log("✅ Geo-summary response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching geo summary:", error);
      console.error("❌ Error response:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);
      throw error;
    }
  }
}

export default new ReportsMapService();
