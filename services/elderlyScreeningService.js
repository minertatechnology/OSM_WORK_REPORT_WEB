import apiSmartOsm from "./apiSmartOsm";

/**
 * Elderly Screening Service
 * จัดการ API calls ทั้งหมดที่เกี่ยวกับการคัดกรองผู้สูงอายุ
 */

/**
 * ดึงรายการผู้สูงอายุทั้งหมด
 * @param {Object} params - Query parameters
 * @param {number} params.skip - จำนวนที่ข้าม (สำหรับ pagination)
 * @param {number} params.limit - จำนวนที่ต้องการดึง
 * @returns {Promise<Array>} รายการผู้สูงอายุ
 */
export const getAllElderlyScreenings = async ({ skip = 0, limit = 100 } = {}) => {
  try {
    const response = await apiSmartOsm.get("/elderly-screeningsall", {
      params: { skip, limit },
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
    console.error("❌ Failed to fetch elderly screenings:", error);
    throw error;
  }
};

/**
 * ดึงข้อมูลผู้สูงอายุรายบุคคล
 * @param {string} id - ID ของผู้สูงอายุ
 * @returns {Promise<Object>} ข้อมูลผู้สูงอายุ
 */
export const getElderlyScreeningById = async (id) => {
  try {
    const response = await apiSmartOsm.get(`/elderly-screenings/${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to fetch elderly screening ${id}:`, error);
    throw error;
  }
};

/**
 * สร้างข้อมูลการคัดกรองผู้สูงอายุใหม่
 * @param {Object} data - ข้อมูลการคัดกรอง
 * @returns {Promise<Object>} ข้อมูลที่สร้างเสร็จ
 */
export const createElderlyScreening = async (data) => {
  try {
    const response = await apiSmartOsm.post("/elderly-screeningsall", data);
    return response.data;
  } catch (error) {
    console.error("❌ Failed to create elderly screening:", error);
    throw error;
  }
};

/**
 * อัพเดทข้อมูลการคัดกรองผู้สูงอายุ
 * @param {string} id - ID ของผู้สูงอายุ
 * @param {Object} data - ข้อมูลที่ต้องการอัพเดท
 * @returns {Promise<Object>} ข้อมูลที่อัพเดทแล้ว
 */
export const updateElderlyScreening = async (id, data) => {
  try {
    const response = await apiSmartOsm.put(`/elderly-screeningsall/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to update elderly screening ${id}:`, error);
    throw error;
  }
};

/**
 * ลบข้อมูลการคัดกรองผู้สูงอายุ
 * @param {string} id - ID ของผู้สูงอายุ
 * @returns {Promise<Object>} ผลลัพธ์การลบ
 */
export const deleteElderlyScreening = async (id) => {
  try {
    const response = await apiSmartOsm.delete(`/elderly-screeningsall/${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to delete elderly screening ${id}:`, error);
    throw error;
  }
};

/**
 * ค้นหาผู้สูงอายุด้วยเงื่อนไขต่างๆ
 * @param {Object} filters - เงื่อนไขการค้นหา
 * @param {string} filters.year - ปี
 * @param {string} filters.month - เดือน
 * @param {string} filters.zone - เขตสุขภาพ
 * @param {string} filters.province - จังหวัด
 * @param {string} filters.district - อำเภอ
 * @param {string} filters.subdistrict - ตำบล
 * @param {string} filters.keyword - คำค้นหา
 * @returns {Promise<Array>} รายการผู้สูงอายุที่ค้นหาได้
 */
export const searchElderlyScreenings = async (filters = {}) => {
  try {
    const response = await apiSmartOsm.get("/elderly-screeningsall/search", {
      params: filters,
    });

    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    return [];
  } catch (error) {
    console.error("❌ Failed to search elderly screenings:", error);
    throw error;
  }
};

/**
 * Export ข้อมูลเป็น CSV/Excel
 * @param {Object} params - Query parameters
 * @returns {Promise<Blob>} ไฟล์ export
 */
export const exportElderlyScreenings = async (params = {}) => {
  try {
    const response = await apiSmartOsm.get("/elderly-screeningsall/export", {
      params,
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.error("❌ Failed to export elderly screenings:", error);
    throw error;
  }
};

/**
 * รวมข้อมูลผู้สูงอายุตาม external_user_id (ผู้ประเมิน)
 * @param {Array} screenings - รายการผู้สูงอายุทั้งหมด
 * @returns {Array} รายการผู้ประเมินพร้อมจำนวนผู้สูงอายุที่ประเมิน
 */
export const aggregateByAssessor = (screenings) => {
  if (!Array.isArray(screenings) || screenings.length === 0) {
    return [];
  }

  // Group by external_user_id
  const grouped = screenings.reduce((acc, screening) => {
    const userId = screening.external_user_id;

    if (!userId) return acc;

    if (!acc[userId]) {
      acc[userId] = {
        external_user_id: userId,
        screenings: [],
        count: 0,
        latest_date: screening.created_at || screening.date || null,
      };
    }

    acc[userId].screenings.push(screening);
    acc[userId].count++;

    // Update latest date
    const currentDate = new Date(screening.created_at || screening.date);
    const latestDate = new Date(acc[userId].latest_date);

    if (currentDate > latestDate) {
      acc[userId].latest_date = screening.created_at || screening.date;
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
 * ดึงข้อมูลผู้สูงอายุทั้งหมดที่ถูกประเมินโดย external_user_id นี้
 * @param {string} externalUserId - external_user_id ของผู้ประเมิน
 * @returns {Promise<Array>} รายการผู้สูงอายุที่ผู้ประเมินคนนี้ทำการประเมิน
 */
export const getElderlyByAssessor = async (externalUserId) => {
  try {
    const allScreenings = await getAllElderlyScreenings({ skip: 0, limit: 1000 });

    // Filter by external_user_id
    const filtered = allScreenings.filter(
      (screening) => screening.external_user_id === externalUserId
    );

    return filtered;
  } catch (error) {
    console.error(`❌ Failed to fetch elderly by assessor ${externalUserId}:`, error);
    throw error;
  }
};

// Export default object สำหรับใช้งานแบบ namespace
export default {
  getAll: getAllElderlyScreenings,
  getById: getElderlyScreeningById,
  create: createElderlyScreening,
  update: updateElderlyScreening,
  delete: deleteElderlyScreening,
  search: searchElderlyScreenings,
  export: exportElderlyScreenings,
  aggregateByAssessor,
  getByAssessor: getElderlyByAssessor,
};
