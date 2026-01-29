/** บทบาทที่อนุญาตให้เข้าได้ */
export const ALLOWED_ROLES = ["สบส", "เขต", "จังหวัด", "อำเภอ", "ตำบล", "รพสต"];

/** ลำดับฟิลด์ที่จะถูกล็อกตามระดับบทบาท */
export const ORDER = ["zone", "province", "district", "subdistrict", "service"];

/** แปลงบทบาท -> ระดับที่ต้องล็อกฟิลด์ */
export const roleToLockLevel = (role) => {
  switch (role) {
    case "สบส":   return "none";
    case "เขต":   return "zone";
    case "จังหวัด": return "province";
    case "อำเภอ":  return "district";
    case "ตำบล":   return "subdistrict";
    case "รพสต":  return "service";
    default:      return "deny";
  }
};

/** ล็อกฟิลด์ “ตั้งแต่ต้นจนถึงระดับบทบาท” (province => ล็อก zone+province, ฯลฯ) */
export const isFieldLocked = (lockLevel, field) => {
  if (!lockLevel || lockLevel === "none") return false;
  const roleIdx  = ORDER.indexOf(lockLevel);
  const fieldIdx = ORDER.indexOf(field);
  if (roleIdx < 0 || fieldIdx < 0) return false;
  return fieldIdx <= roleIdx;
};

/** การมองเห็นคอนโทรล/แผนที่ตามบทบาท */
const BASE_VIS = {
  showMap: true, showHealthZone: true, showProvince: true,
  showDistrict: true, showSubdistrict: true, showUnit: true,
};
export const getVisibilityByRole = (role = "") => {
  switch (role) {
    case "เขต":     return { ...BASE_VIS, showMap: false, showHealthZone: false };
    case "จังหวัด":  return { ...BASE_VIS, showMap: false, showHealthZone: false, showProvince: false };
    case "อำเภอ":   return { ...BASE_VIS, showMap: false, showHealthZone: false, showProvince: false, showDistrict: false };
    case "ตำบล":    return { ...BASE_VIS, showMap: false, showHealthZone: false, showProvince: false, showDistrict: false, showSubdistrict: false };
    case "รพสต":   return { ...BASE_VIS, showMap: false, showHealthZone: false, showProvince: false, showDistrict: false, showSubdistrict: false, showUnit: false };
    case "สบส":    return BASE_VIS;
    default:        return { ...BASE_VIS, showMap: false, showHealthZone: false, showProvince: false, showDistrict: false, showSubdistrict: false, showUnit: false };
  }
};

/** อ่าน cookie อย่างปลอดภัย (กัน SSR) */
export const getCookies = () => {
  if (typeof document === "undefined") return {};
  return document.cookie.split(";").reduce((acc, cookie) => {
    const [rawK, ...rest] = cookie.trim().split("=");
    const k = decodeURIComponent(rawK);
    const v = rest.join("=");
    if (k) acc[k] = v;
    return acc;
  }, {});
};

const normalizeRoles = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [raw]; }
    catch { return [raw]; }
  }
  return [];
};

/** อ่าน roles/scope/user จาก cookie `info` */
export const readInfoFromCookie = () => {
  try {
    const cookies = getCookies();
    const raw = cookies.info;
    if (!raw) return { roles: [], scope: {} };
    const parsed = JSON.parse(decodeURIComponent(raw));
    const roles = normalizeRoles(parsed.roles);
    const scope = {
      zone: parsed.zone || "",
      province: parsed.province || "",
      province_name_th: parsed.province_name_th || "",
      district: parsed.district || "",
      district_name_th: parsed.district_name_th || "",
      subdistrict: parsed.subdistrict || "",
      subdistrict_name_th: parsed.subdistrict_name_th || "",
      unit: parsed.unit || "",
    };
    return { roles, scope, user: parsed.user || null };
  } catch {
    return { roles: [], scope: {} };
  }
};

/** ตั้งค่า cookie `info` (ใช้หลัง login) */
export const setInfoCookie = (auth, user = {}, maxAgeSeconds = 60 * 60 * 8) => {
  if (typeof document === "undefined") return;
  const info = {
    roles: auth?.roles || [],
    zone: auth?.zone || "",
    province: auth?.province || "",
    province_name_th: auth?.province_name_th || "",
    district: auth?.district || "",
    district_name_th: auth?.district_name_th || "",
    subdistrict: auth?.subdistrict || "",
    subdistrict_name_th: auth?.subdistrict_name_th || "",
    unit: auth?.unit || "",
    user,
    issuedAt: new Date().toISOString(),
  };
  const encoded = encodeURIComponent(JSON.stringify(info));
  document.cookie = `info=${encoded}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
};

/** มีสิทธิ์เข้าหน้านี้ไหม */
export const hasAccess = (roles = []) =>
  (roles || []).some((r) => ALLOWED_ROLES.includes(r));

/** อัปไส้ filters ให้สอดคล้องกับ scope/lock level */
export const applyScopeToFilters = (filters, scope, lockLevel) => {
  const next = { ...filters };
  if (lockLevel === "zone" && scope.zone) next.healthZone = scope.zone;
  if (["province", "district", "subdistrict", "service"].includes(lockLevel) && scope.zone) next.healthZone = scope.zone;
  if (["province", "district", "subdistrict", "service"].includes(lockLevel) && scope.province) next.province = scope.province;
  if (["district", "subdistrict", "service"].includes(lockLevel) && scope.district) next.district = scope.district;
  if (["subdistrict", "service"].includes(lockLevel) && scope.subdistrict) next.subdistrict = scope.subdistrict;
  if (["service"].includes(lockLevel) && scope.unit) next.unit = scope.unit;
  return next;
};
