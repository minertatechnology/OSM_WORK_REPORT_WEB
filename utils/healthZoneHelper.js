import { PROVINCE_TO_HEALTHZONE, HEALTHZONE_PROVINCES } from "./healthzone-province-data";

/**
 * คำนวณชื่อเขตสุขภาพจากชื่อจังหวัด
 * ใช้กรณีที่ข้อมูลจาก OAuth2 batch ไม่มี health_area_name_th
 *
 * @param {string} provinceNameTh - ชื่อจังหวัดภาษาไทย (เช่น "สุรินทร์", "กรุงเทพมหานคร")
 * @returns {string|null} ชื่อเขตสุขภาพ (เช่น "เขตสุขภาพที่ 9") หรือ null ถ้าหาไม่เจอ
 */
export function getHealthAreaNameFromProvince(provinceNameTh) {
  if (!provinceNameTh || typeof provinceNameTh !== "string") {
    return null;
  }

  // ตัดช่องว่างซ้ายขวา
  const cleanProvince = provinceNameTh.trim();

  // หาเลขเขตสุขภาพจากชื่อจังหวัด
  const zoneNumber = PROVINCE_TO_HEALTHZONE[cleanProvince];

  if (!zoneNumber) {
    console.warn(`⚠️ Province "${cleanProvince}" not found in health zone mapping`);
    return null;
  }

  // หาชื่อเขตสุขภาพ
  const zoneObj = HEALTHZONE_PROVINCES.find((z) => z.zone === zoneNumber);

  return zoneObj?.zoneName || null;
}

/**
 * คำนวณรหัสเขตสุขภาพจากชื่อจังหวัด
 *
 * @param {string} provinceNameTh - ชื่อจังหวัดภาษาไทย
 * @returns {number|null} เลขเขตสุขภาพ (1-13) หรือ null ถ้าหาไม่เจอ
 */
export function getHealthAreaCodeFromProvince(provinceNameTh) {
  if (!provinceNameTh || typeof provinceNameTh !== "string") {
    return null;
  }

  const cleanProvince = provinceNameTh.trim();
  return PROVINCE_TO_HEALTHZONE[cleanProvince] || null;
}

/**
 * ดึงข้อมูลเขตสุขภาพทั้งหมด (zone และ zoneName) จากชื่อจังหวัด
 *
 * @param {string} provinceNameTh - ชื่อจังหวัดภาษาไทย
 * @returns {{zone: number, zoneName: string}|null} ข้อมูลเขตสุขภาพ หรือ null ถ้าหาไม่เจอ
 */
export function getHealthAreaInfoFromProvince(provinceNameTh) {
  if (!provinceNameTh || typeof provinceNameTh !== "string") {
    return null;
  }

  const cleanProvince = provinceNameTh.trim();
  const zoneNumber = PROVINCE_TO_HEALTHZONE[cleanProvince];

  if (!zoneNumber) {
    return null;
  }

  const zoneObj = HEALTHZONE_PROVINCES.find((z) => z.zone === zoneNumber);

  return zoneObj ? { zone: zoneObj.zone, zoneName: zoneObj.zoneName } : null;
}

/**
 * ฟังก์ชันสำหรับดึง health_area_name_th ที่ถูกต้อง
 * จะคืนค่าจาก oauthData.health_area_name_th ก่อน
 * ถ้าไม่มี จะคำนวณจาก province_name_th
 *
 * @param {Object} oauthData - ข้อมูลจาก OAuth2 batch API
 * @returns {string|null} ชื่อเขตสุขภาพ หรือ "-" ถ้าหาไม่เจอ
 */
export function getHealthAreaNameWithFallback(oauthData) {
  // 1. ลองใช้ค่าจาก oauthData ก่อน (ถ้ามี)
  if (oauthData?.health_area_name_th) {
    return oauthData.health_area_name_th;
  }

  // 2. ถ้าไม่มี ให้คำนวณจาก province_name_th
  if (oauthData?.province_name_th) {
    const calculatedZone = getHealthAreaNameFromProvince(oauthData.province_name_th);
    if (calculatedZone) {
      return calculatedZone;
    }
  }

  // 3. ถ้าหาไม่เจอ คืนค่า null
  return null;
}

export default {
  getHealthAreaNameFromProvince,
  getHealthAreaCodeFromProvince,
  getHealthAreaInfoFromProvince,
  getHealthAreaNameWithFallback,
};
