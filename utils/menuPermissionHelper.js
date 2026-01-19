/**
 * Menu Permission Helper
 * ตรวจสอบสิทธิ์การเข้าถึงเมนูตาม scope level
 */

// Scope hierarchy (from highest to lowest)
// เลขน้อย = ระดับสูงกว่า = เข้าถึงได้มากกว่า
const SCOPE_HIERARCHY = {
  "country": 1,
  "area": 2,
  "region": 2,
  "province": 3,
  "district": 4,
  "subdistrict": 5,
  "village": 6
};

/**
 * เช็คว่า user สามารถเข้าถึงเมนูได้หรือไม่ ตาม scope level
 * @param {string} userScopeLevel - scope level ของ user (จาก permission_scope.level)
 * @param {string} menuScopeLevel - scope level ของเมนู (จาก menu.scope_level)
 * @returns {boolean} - true ถ้าเข้าถึงได้, false ถ้าไม่ได้
 */
export function canAccessMenu(userScopeLevel, menuScopeLevel) {
  // ถ้าเมนูไม่มี scope restriction ให้เข้าถึงได้ทันที
  if (!menuScopeLevel) return true;

  // ถ้า user ไม่มี scope level ไม่ให้เข้าถึง
  if (!userScopeLevel) return false;

  const userLevel = SCOPE_HIERARCHY[userScopeLevel];
  const menuLevel = SCOPE_HIERARCHY[menuScopeLevel];

  // ถ้าไม่พบ level ใน hierarchy ให้เข้าถึงได้ (default allow)
  if (userLevel === undefined || menuLevel === undefined) return true;

  // ระดับ user ต้องน้อยกว่าหรือเท่ากับระดับเมนู ถึงจะเห็นได้
  // เช่น: user level 1 (country) เห็น menu level 3 (province) ได้
  //        user level 3 (province) ไม่เห็น menu level 1 (country)
  return userLevel <= menuLevel;
}

/**
 * กรองเมนูตาม scope level ของ user
 * @param {Array} menus - รายการเมนูทั้งหมด
 * @param {string} userScopeLevel - scope level ของ user
 * @returns {Array} - เมนูที่ user สามารถเข้าถึงได้
 */
export function filterMenusByScope(menus, userScopeLevel) {
  if (!menus || menus.length === 0) return [];
  if (!userScopeLevel) return [];

  const filterMenu = (menuList) => {
    return menuList
      .filter(menu => canAccessMenu(userScopeLevel, menu.scope_level))
      .map(menu => ({
        ...menu,
        children: menu.children ? filterMenu(menu.children) : []
      }))
      .filter(menu => {
        // ถ้าเป็น parent menu ให้เช็คว่ามี children ที่เข้าถึงได้อย่างน้อย 1 อัน
        if (menu.children && menu.children.length > 0) {
          return true;
        }
        // ถ้าไม่ใช่ parent menu ให้เช็คว่าเข้าถึงได้
        return canAccessMenu(userScopeLevel, menu.scope_level);
      });
  };

  return filterMenu(menus);
}

/**
 * ดึง scope level name ภาษาไทย
 * @param {string} level - scope level code
 * @returns {string} - ชื่อภาษาไทย
 */
export function getScopeLevelName(level) {
  const names = {
    "country": "ระดับประเทศ",
    "area": "ระดับเขตสุขภาพ",
    "region": "ระดับเขต",
    "province": "ระดับจังหวัด",
    "district": "ระดับอำเภอ",
    "subdistrict": "ระดับตำบล",
    "village": "ระดับหมู่บ้าน"
  };
  return names[level] || level;
}
