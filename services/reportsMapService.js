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
   * @param {string} filters.province_code - รหัสจังหวัด
   * @param {string} filters.district_code - รหัสอำเภอ
   * @param {string} filters.subdistrict_code - รหัสตำบล
   * @param {string} filters.report_type - ประเภทรายงาน
   * @param {string} filters.start_date - วันที่เริ่มต้น (ISO format)
   * @param {string} filters.end_date - วันที่สิ้นสุด (ISO format)
   * @param {number} filters.limit - จำนวนรายงานสูงสุด
   * @returns {Promise<Object>} ข้อมูลรายงานทั้งหมด
   */
  async getReportsMapData(filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.province_code) params.append("province_code", filters.province_code);
      if (filters.district_code) params.append("district_code", filters.district_code);
      if (filters.subdistrict_code) params.append("subdistrict_code", filters.subdistrict_code);
      if (filters.report_type) params.append("report_type", filters.report_type);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);
      if (filters.limit) params.append("limit", filters.limit);

      const token = getAccessToken();
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.get(
        `${SMART_OSM_API_BASE_URL}/analytics/reports/map-data?${params.toString()}`,
        { headers }
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching reports map data:", error);
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
}

export default new ReportsMapService();
