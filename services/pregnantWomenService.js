import apiSmartOsm from "./apiSmartOsm";

/**
 * Pregnant Women Evaluation Service
 * จัดการ API calls ทั้งหมดที่เกี่ยวกับการประเมินหญิงตั้งครรภ์
 */

/**
 * ดึงรายการหญิงตั้งครรภ์ทั้งหมด
 * @param {Object} params - Query parameters
 * @param {number} params.skip - จำนวนที่ข้าม (สำหรับ pagination)
 * @param {number} params.limit - จำนวนที่ต้องการดึง
 * @param {string} params.start_date - วันที่เริ่มต้น (ISO string)
 * @param {string} params.end_date - วันที่สิ้นสุด (ISO string)
 * @param {number} params.health_region - เขตสุขภาพ (ID)
 * @param {string} params.province - จังหวัด (ชื่อภาษาไทย)
 * @param {string} params.province_id - จังหวัด (ID)
 * @param {string} params.district - อำเภอ (ชื่อภาษาไทย)
 * @param {string} params.district_id - อำเภอ (ID)
 * @param {string} params.subdistrict - ตำบล (ชื่อภาษาไทย)
 * @param {string} params.subdistrict_id - ตำบล (ID)
 * @param {string} params.health_service_id - หน่วยบริการ (ID)
 * @returns {Promise<Array>} รายการหญิงตั้งครรภ์
 */
export const getAllPregnantWomenEvaluations = async ({
  skip = 0,
  limit = 100,
  start_date,
  end_date,
  health_region,
  province,
  province_id,
  district,
  district_id,
  subdistrict,
  subdistrict_id,
  health_service_id
} = {}) => {
  try {
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

    const response = await apiSmartOsm.get("/pregnant-women-evaluationsall", {
      params,
    });

    // Parse ข้อมูลจากหลายรูปแบบที่เป็นไปได้
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response.data?.results && Array.isArray(response.data.results)) {
      return response.data.results;
    }

    return [];
  } catch (error) {
    console.error("❌ Failed to fetch pregnant women evaluations:", error);
    throw error;
  }
};

/**
 * ดึงข้อมูลหญิงตั้งครรภ์รายบุคคล
 * @param {string} id - ID ของการประเมิน
 * @returns {Promise<Object>} ข้อมูลการประเมิน
 */
export const getPregnantWomenEvaluationById = async (id) => {
  try {
    const response = await apiSmartOsm.get(`/pregnant-women-evaluations/${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to fetch pregnant women evaluation ${id}:`, error);
    throw error;
  }
};

/**
 * รวมข้อมูลการประเมินตาม external_user_id (ผู้ประเมิน)
 * @param {Array} evaluations - รายการการประเมินทั้งหมด
 * @returns {Array} รายการผู้ประเมินพร้อมจำนวนการประเมิน
 */
export const aggregateByAssessor = (evaluations) => {
  if (!Array.isArray(evaluations) || evaluations.length === 0) {
    return [];
  }

  // Group by external_user_id
  const grouped = evaluations.reduce((acc, evaluation) => {
    const userId = evaluation.external_user_id;

    if (!userId) return acc;

    if (!acc[userId]) {
      acc[userId] = {
        external_user_id: userId,
        evaluations: [],
        count: 0,
        latest_date: evaluation.updated_at || evaluation.created_at || null,
        status: "submitted", // default status
      };
    }

    acc[userId].evaluations.push(evaluation);
    acc[userId].count++;

    // Update latest date (ใช้ updated_at เป็นหลัก)
    const currentDate = new Date(evaluation.updated_at || evaluation.created_at);
    const latestDate = new Date(acc[userId].latest_date);

    if (currentDate > latestDate) {
      acc[userId].latest_date = evaluation.updated_at || evaluation.created_at;
    }

    return acc;
  }, {});

  // Convert to array and sort by latest date (descending)
  return Object.values(grouped).sort((a, b) => {
    const dateA = new Date(a.latest_date);
    const dateB = new Date(b.latest_date);
    return dateB - dateA;
  });
};

/**
 * ดึงข้อมูลการประเมินทั้งหมดที่ถูกทำโดย external_user_id นี้
 * @param {string} externalUserId - external_user_id ของผู้ประเมิน
 * @returns {Promise<Array>} รายการการประเมินที่ผู้ประเมินคนนี้ทำ
 */
export const getEvaluationsByAssessor = async (externalUserId) => {
  try {
    const allEvaluations = await getAllPregnantWomenEvaluations({ skip: 0, limit: 1000 });

    // Filter by external_user_id
    const filtered = allEvaluations.filter(
      (evaluation) => evaluation.external_user_id === externalUserId
    );

    return filtered;
  } catch (error) {
    console.error(`❌ Failed to fetch evaluations by assessor ${externalUserId}:`, error);
    throw error;
  }
};

// Export default object สำหรับใช้งานแบบ namespace
export default {
  getAll: getAllPregnantWomenEvaluations,
  getById: getPregnantWomenEvaluationById,
  aggregateByAssessor,
  getByAssessor: getEvaluationsByAssessor,
};
