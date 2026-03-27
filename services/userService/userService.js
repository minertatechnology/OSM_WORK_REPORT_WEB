// User Service for API calls
import apiSmartOsm from '../apiSmartOsm';

export const getUsersList = async ({
  page = 1,
  per_page = 10,
  keyword = '',
  is_active = null,
  province_code = '',
  district_code = '',
  subdistrict_code = '',
  health_service_code = '',
  health_area_id = '',  // ✅ เพิ่ม health_area_id (zone) filter
  province_codes = '',  // ✅ เพิ่ม province_codes สำหรับ zone filtering (comma-separated)
  token // ไม่ต้องใช้แล้ว เพราะ apiSmartOsm จัดการให้
}) => {
  try {
    const params = {
      page,
      per_page,
    };

    if (keyword) params.keyword = keyword;
    if (is_active !== null) params.is_active = is_active;
    if (province_code) params.province_code = province_code;
    if (district_code) params.district_code = district_code;
    if (subdistrict_code) params.subdistrict_code = subdistrict_code;
    if (health_service_code) params.health_service_code = health_service_code;
    if (health_area_id) params.health_area_id = health_area_id;  // ✅ เพิ่ม health_area_id
    if (province_codes) params.province_codes = province_codes;  // ✅ เพิ่ม province_codes

    const response = await apiSmartOsm.get('/auth/users', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};
