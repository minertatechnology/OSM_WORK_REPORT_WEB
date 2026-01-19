import apiSmartOsm from "./apiSmartOsm";

/**
 * Menu Permission Service
 * จัดการ API calls สำหรับเมนูและสิทธิ์การเข้าถึง
 */

// Cache storage
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Helper function สำหรับ cache
 */
const withCache = async (key, fetchFn, ttl = CACHE_TTL) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    console.log(`📦 Cache hit: ${key}`);
    return cached.data;
  }

  console.log(`🔄 Cache miss: ${key}, fetching...`);
  const data = await fetchFn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};

/**
 * ดึงโครงสร้างเมนูทั้งหมด
 * @param {Object} params - Query parameters
 * @returns {Promise} - Promise containing menu structure
 */
export const getMenuStructure = async (params = {}) => {
  const { include_inactive = false, ...rest } = params;

  try {
    const response = await apiSmartOsm.get("/workreport-menus/menus/structure", {
      params: { include_inactive, ...rest },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching menu structure:", error);
    throw error;
  }
};

/**
 * ดึงเมนูตาม code
 * @param {string} menuCode - รหัสเมนู
 * @returns {Promise} - Promise containing menu data
 */
export const getMenuByCode = async (menuCode) => {
  if (!menuCode) {
    throw new Error("Menu code is required");
  }

  try {
    const response = await apiSmartOsm.get(`/workreport-menus/menus/${menuCode}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching menu ${menuCode}:`, error);
    throw error;
  }
};

/**
 * ดึงสิทธิ์เมนูของผู้ใช้ปัจจุบัน
 * @returns {Promise} - Promise containing user's menu permissions
 */
export const getMyMenuPermissions = async () => {
  const cacheKey = "my_menu_permissions";

  return withCache(
    cacheKey,
    async () => {
      try {
        const response = await apiSmartOsm.get("/workreport-menus/menus/my-permissions");
        return response.data;
      } catch (error) {
        console.error("Error fetching my menu permissions:", error);
        throw error;
      }
    },
    CACHE_TTL
  );
};

/**
 * ดึงเมนูที่ผู้ใช้สามารถเข้าถึงได้ (can_view = true)
 * ใช้สำหรับสร้าง navigation menu
 * @returns {Promise} - Promise containing accessible menus
 */
export const getAccessibleMenus = async () => {
  const cacheKey = "accessible_menus";

  return withCache(
    cacheKey,
    async () => {
      try {
        const response = await apiSmartOsm.get("/workreport-menus/menus/accessible");
        return response.data;
      } catch (error) {
        console.error("Error fetching accessible menus:", error);
        throw error;
      }
    },
    CACHE_TTL
  );
};

/**
 * ดึงสิทธิ์เมนูของผู้ใช้ที่ระบุ (สำหรับ admin)
 * @param {string} userId - User ID
 * @returns {Promise} - Promise containing user's menu permissions
 */
export const getUserMenuPermissions = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const response = await apiSmartOsm.get(`/workreport-menus/menus/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching permissions for user ${userId}:`, error);
    throw error;
  }
};

/**
 * ตั้งค่าสิทธิ์เมนูให้ผู้ใช้ (bulk update)
 * @param {Object} data - Permission data
 * @param {string} data.user_id - User ID
 * @param {Object} data.permissions - Dictionary of menu_code: permissions
 * @returns {Promise} - Promise containing update result
 */
export const setUserPermissions = async (data) => {
  if (!data.user_id || !data.permissions) {
    throw new Error("user_id and permissions are required");
  }

  try {
    const response = await apiSmartOsm.post("/workreport-menus/menus/user-permissions", data);

    // Clear cache after update
    cache.delete("accessible_menus");
    cache.delete(`user_permissions_${data.user_id}`);

    return response.data;
  } catch (error) {
    console.error("Error setting user permissions:", error);
    throw error;
  }
};

/**
 * ลบสิทธิ์เมนูทั้งหมดของผู้ใช้ (reset to default)
 * @param {string} userId - User ID
 * @returns {Promise} - Promise containing delete result
 */
export const deleteUserPermissions = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const response = await apiSmartOsm.delete(`/workreport-menus/menus/user/${userId}`);

    // Clear cache after delete
    cache.delete("accessible_menus");
    cache.delete(`user_permissions_${userId}`);

    return response.data;
  } catch (error) {
    console.error(`Error deleting permissions for user ${userId}:`, error);
    throw error;
  }
};

/**
 * สร้างเมนูใหม่ (admin only)
 * @param {Object} menuData - Menu data
 * @returns {Promise} - Promise containing created menu
 */
export const createMenu = async (menuData) => {
  if (!menuData.code || !menuData.name_th) {
    throw new Error("code and name_th are required");
  }

  try {
    const response = await apiSmartOsm.post("/workreport-menus/menus", menuData);

    // Clear cache after create
    clearMenuCache();

    return response.data;
  } catch (error) {
    console.error("Error creating menu:", error);
    throw error;
  }
};

/**
 * อัพเดทเมนู (admin only)
 * @param {string} menuId - Menu ID
 * @param {Object} menuData - Menu data to update
 * @returns {Promise} - Promise containing updated menu
 */
export const updateMenu = async (menuId, menuData) => {
  if (!menuId) {
    throw new Error("Menu ID is required");
  }

  try {
    const response = await apiSmartOsm.put(`/workreport-menus/menus/${menuId}`, menuData);

    // Clear cache after update
    clearMenuCache();

    return response.data;
  } catch (error) {
    console.error(`Error updating menu ${menuId}:`, error);
    throw error;
  }
};

/**
 * ลบเมนู (admin only)
 * @param {string} menuId - Menu ID
 * @returns {Promise} - Promise containing delete result
 */
export const deleteMenu = async (menuId) => {
  if (!menuId) {
    throw new Error("Menu ID is required");
  }

  try {
    const response = await apiSmartOsm.delete(`/workreport-menus/menus/${menuId}`);

    // Clear cache after delete
    clearMenuCache();

    return response.data;
  } catch (error) {
    console.error(`Error deleting menu ${menuId}:`, error);
    throw error;
  }
};

/**
 * ล้าง cache ทั้งหมด
 */
export const clearMenuCache = () => {
  cache.clear();
  console.log("🗑️ Menu permission cache cleared");
};

/**
 * ดึงรายการ scope levels ทั้งหมด
 * @returns {Promise} - Promise containing scope levels
 */
export const getScopeLevels = async () => {
  const cacheKey = "scope_levels";

  return withCache(
    cacheKey,
    async () => {
      try {
        const response = await apiSmartOsm.get("/workreport-menus/menus/scope-levels");
        return response.data;
      } catch (error) {
        console.error("Error fetching scope levels:", error);
        throw error;
      }
    },
    CACHE_TTL * 2 // Cache longer (20 minutes)
  );
};

/**
 * อัพเดท scope_level ของเมนู
 * @param {string} menuId - Menu ID
 * @param {string} scopeLevel - Scope level to set
 * @returns {Promise} - Promise containing updated menu
 */
export const updateMenuScope = async (menuId, scopeLevel) => {
  if (!menuId) {
    throw new Error("Menu ID is required");
  }

  try {
    const response = await apiSmartOsm.put(`/workreport-menus/menus/${menuId}`, {
      scope_level: scopeLevel
    });

    // Clear cache after update
    clearMenuCache();

    return response.data;
  } catch (error) {
    console.error(`Error updating scope for menu ${menuId}:`, error);
    throw error;
  }
};

export default {
  getMenuStructure,
  getMenuByCode,
  getMyMenuPermissions,
  getAccessibleMenus,
  getUserMenuPermissions,
  setUserPermissions,
  deleteUserPermissions,
  createMenu,
  updateMenu,
  deleteMenu,
  clearMenuCache,
  getScopeLevels,
  updateMenuScope,
};
