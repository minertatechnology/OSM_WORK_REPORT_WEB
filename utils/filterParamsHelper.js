/**
 * filterParamsHelper.js
 * Helper functions for building filter parameters that support both text and ID
 * Backend accepts both formats:
 * - Text: province=กรุงเทพมหานคร&district=เขตบางเขน
 * - ID: province_id=10&district_id=1005
 * - Or both together
 */

/**
 * Build filter params with both text (Thai name) and ID
 * @param {Object} options - Filter options
 * @param {string} options.zone - Zone code (e.g., "HA1", "HA13")
 * @param {string} options.province - Province code/ID
 * @param {string} options.district - District code/ID
 * @param {string} options.subdistrict - Subdistrict code/ID
 * @param {string} options.health_service_id - Health service ID
 * @param {Array} options.provinces - List of provinces from lookup
 * @param {Array} options.districts - List of districts from lookup
 * @param {Array} options.subdistricts - List of subdistricts from lookup
 * @param {string} options.lockLevel - Permission lock level (none, zone, province, district, subdistrict)
 * @param {Function} options.getInitialFilters - Function to get default locked filters
 * @returns {Object} Filter params with both text and ID
 */
export const buildFilterParams = ({
  zone = "",
  province = "",
  district = "",
  subdistrict = "",
  health_service_id = "",
  provinces = [],
  districts = [],
  subdistricts = [],
  lockLevel = "none",
  getInitialFilters = () => ({})
}) => {
  const params = {};

  // Get default locked filters
  const initialFilters = getInitialFilters();
  const defaultZone = initialFilters.zone || "";
  const defaultProvince = initialFilters.province || "";
  const defaultDistrict = initialFilters.district || "";
  const defaultSubdistrict = initialFilters.subdistrict || "";
  const defaultService = initialFilters.service || "";

  console.log("🔒 filterParamsHelper - initialFilters:", initialFilters);
  console.log("🔒 filterParamsHelper - user selection:", { zone, province, district, subdistrict, health_service_id });
  console.log("🔒 filterParamsHelper - lockLevel:", lockLevel);

  // ========== Zone Filter ==========
  // Zone uses health_region parameter (number only)
  if (zone !== "") {
    const zoneNumber = parseInt(String(zone).replace(/\D/g, ''));
    if (!isNaN(zoneNumber)) {
      params.health_region = zoneNumber;
      console.log("✅ Using zone:", zone, "→ health_region:", zoneNumber);
    }
  } else if (defaultZone && lockLevel !== 'none') {
    const zoneNumber = parseInt(String(defaultZone).replace(/\D/g, ''));
    if (!isNaN(zoneNumber)) {
      params.health_region = zoneNumber;
      console.log("🔒 Using locked zone:", defaultZone, "→ health_region:", zoneNumber);
    }
  }

  // ========== Province Filter ==========
  // Send both text (province) and ID (province_id)
  if (province && province !== defaultProvince) {
    const provData = provinces.find(p => String(p.code || p.id) === province);
    if (provData) {
      params.province = provData.name_th || provData.name;
      params.province_id = province;
      console.log("✅ Using user-selected province:", province, "name:", params.province, "id:", params.province_id);
    }
  } else if (defaultProvince && lockLevel !== 'none' && lockLevel !== 'zone') {
    const provData = provinces.find(p => String(p.code || p.id) === defaultProvince);
    if (provData) {
      params.province = provData.name_th || provData.name;
      params.province_id = defaultProvince;
      console.log("🔒 Using locked province:", defaultProvince, "name:", params.province, "id:", params.province_id);
    }
  }

  // ========== District Filter ==========
  // Send both text (district) and ID (district_id)
  if (district && district !== defaultDistrict) {
    const distData = districts.find(d => String(d.code || d.id) === district);
    if (distData) {
      params.district = distData.name_th || distData.name;
      params.district_id = district;
      console.log("✅ Using user-selected district:", district, "name:", params.district, "id:", params.district_id);
    }
  } else if (defaultDistrict && (lockLevel === 'district' || lockLevel === 'subdistrict')) {
    const distData = districts.find(d => String(d.code || d.id) === defaultDistrict);
    if (distData) {
      params.district = distData.name_th || distData.name;
      params.district_id = defaultDistrict;
      console.log("🔒 Using locked district:", defaultDistrict, "name:", params.district, "id:", params.district_id);
    }
  }

  // ========== Subdistrict Filter ==========
  // Send both text (subdistrict) and ID (subdistrict_id)
  if (subdistrict && subdistrict !== defaultSubdistrict) {
    const subdistData = subdistricts.find(s => String(s.code || s.id) === subdistrict);
    if (subdistData) {
      params.subdistrict = subdistData.name_th || subdistData.name;
      params.subdistrict_id = subdistrict;
      console.log("✅ Using user-selected subdistrict:", subdistrict, "name:", params.subdistrict, "id:", params.subdistrict_id);
    }
  } else if (defaultSubdistrict && lockLevel === 'subdistrict') {
    const subdistData = subdistricts.find(s => String(s.code || s.id) === defaultSubdistrict);
    if (subdistData) {
      params.subdistrict = subdistData.name_th || subdistData.name;
      params.subdistrict_id = defaultSubdistrict;
      console.log("🔒 Using locked subdistrict:", defaultSubdistrict, "name:", params.subdistrict, "id:", params.subdistrict_id);
    }
  }

  // ========== Health Service Filter ==========
  // Send health_service_id directly
  if (health_service_id && health_service_id !== defaultService) {
    params.health_service_id = health_service_id;
    console.log("✅ Using user-selected health_service_id:", health_service_id);
  } else if (defaultService) {
    params.health_service_id = defaultService;
    console.log("🔒 Using locked health_service_id:", defaultService);
  }

  console.log("📋 Final filterParams:", params);
  return params;
};

/**
 * Add date range filters to params
 * @param {Object} params - Existing params object
 * @param {string} year - Buddhist year (e.g., "2568")
 * @param {string} month - Month number (e.g., "01", "12")
 * @param {string} yearType - "fiscal" or "calendar"
 * @returns {Object} Params with date filters added
 */
export const addDateFilters = (params = {}, year = "", month = "", yearType = "calendar") => {
  const result = { ...params };

  if (year && month) {
    const buddhistYear = parseInt(year);
    const gregorianYear = buddhistYear - 543;
    const monthNum = parseInt(month);

    // For fiscal year, adjust the year if month is Oct-Dec (months 10-12)
    let adjustedYear = gregorianYear;
    if (yearType === "fiscal" && monthNum >= 10) {
      adjustedYear = gregorianYear - 1;
    }

    const startDate = new Date(adjustedYear, monthNum - 1, 1);
    const endDate = new Date(adjustedYear, monthNum, 0, 23, 59, 59);

    result.start_date = startDate.toISOString();
    result.end_date = endDate.toISOString();
  } else if (year) {
    const buddhistYear = parseInt(year);
    const gregorianYear = buddhistYear - 543;

    const startDate = new Date(gregorianYear, 0, 1);
    const endDate = new Date(gregorianYear, 11, 31, 23, 59, 59);

    result.start_date = startDate.toISOString();
    result.end_date = endDate.toISOString();
  }

  return result;
};

export default {
  buildFilterParams,
  addDateFilters
};
