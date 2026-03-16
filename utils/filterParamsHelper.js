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

  // ========== Zone Filter ==========
  // Zone uses health_region parameter (number only)
  if (zone !== "") {
    const zoneNumber = parseInt(String(zone).replace(/\D/g, ''));
    if (!isNaN(zoneNumber)) {
      params.health_region = zoneNumber;
    }
  } else if (defaultZone && lockLevel !== 'none') {
    const zoneNumber = parseInt(String(defaultZone).replace(/\D/g, ''));
    if (!isNaN(zoneNumber)) {
      params.health_region = zoneNumber;
    }
  }

  // ========== Province Filter ==========
  // Send both text (province) and ID (province_id)
  if (province && province !== defaultProvince) {
    const provData = provinces.find(p => String(p.code || p.id) === province);
    if (provData) {
      params.province = provData.name_th || provData.name;
      params.province_id = province;
    }
  } else if (defaultProvince && lockLevel !== 'none' && lockLevel !== 'zone') {
    const provData = provinces.find(p => String(p.code || p.id) === defaultProvince);
    if (provData) {
      params.province = provData.name_th || provData.name;
      params.province_id = defaultProvince;
    }
  }

  // ========== District Filter ==========
  // Send both text (district) and ID (district_id)
  if (district && district !== defaultDistrict) {
    const distData = districts.find(d => String(d.code || d.id) === district);
    if (distData) {
      params.district = distData.name_th || distData.name;
      params.district_id = district;
    }
  } else if (defaultDistrict && (lockLevel === 'district' || lockLevel === 'subdistrict')) {
    const distData = districts.find(d => String(d.code || d.id) === defaultDistrict);
    if (distData) {
      params.district = distData.name_th || distData.name;
      params.district_id = defaultDistrict;
    }
  }

  // ========== Subdistrict Filter ==========
  // Send both text (subdistrict) and ID (subdistrict_id)
  if (subdistrict && subdistrict !== defaultSubdistrict) {
    const subdistData = subdistricts.find(s => String(s.code || s.id) === subdistrict);
    if (subdistData) {
      params.subdistrict = subdistData.name_th || subdistData.name;
      params.subdistrict_id = subdistrict;
    }
  } else if (defaultSubdistrict && lockLevel === 'subdistrict') {
    const subdistData = subdistricts.find(s => String(s.code || s.id) === defaultSubdistrict);
    if (subdistData) {
      params.subdistrict = subdistData.name_th || subdistData.name;
      params.subdistrict_id = defaultSubdistrict;
    }
  }

  // ========== Health Service Filter ==========
  // Send health_service_id directly
  if (health_service_id && health_service_id !== defaultService) {
    params.health_service_id = health_service_id;
  } else if (defaultService) {
    params.health_service_id = defaultService;
  }

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

    // For fiscal year:
    // - Fiscal year 2569 = Oct 2025 - Sep 2026 (ends in Buddhist year 2569)
    // - Months Oct-Dec (10-12) belong to Gregorian year = gregorianYear - 1
    // - Months Jan-Sep (1-9) belong to Gregorian year = gregorianYear
    let adjustedYear = gregorianYear;
    if (yearType === "fiscal") {
      if (monthNum >= 10) {
        // Oct-Dec: use gregorianYear - 1
        adjustedYear = gregorianYear - 1;
      } else {
        // Jan-Sep: use gregorianYear as-is
        adjustedYear = gregorianYear;
      }
    }

    const startDate = new Date(adjustedYear, monthNum - 1, 1);
    const endDate = new Date(adjustedYear, monthNum, 0, 23, 59, 59);

    result.start_date = startDate.toISOString();
    result.end_date = endDate.toISOString();
  } else if (year) {
    const buddhistYear = parseInt(year);
    const gregorianYear = buddhistYear - 543;

    if (yearType === "fiscal") {
      // Fiscal year: Oct 1 of previous Gregorian year to Sep 30 of current Gregorian year
      // Fiscal year 2569 = Oct 1, 2025 to Sep 30, 2026 (ends in Buddhist year 2569)
      const startDate = new Date(gregorianYear - 1, 9, 1); // Oct 1 of previous year
      const endDate = new Date(gregorianYear, 8, 30, 23, 59, 59); // Sep 30 of current year

      result.start_date = startDate.toISOString();
      result.end_date = endDate.toISOString();
    } else {
      // Calendar year: Jan 1 to Dec 31
      const startDate = new Date(gregorianYear, 0, 1);
      const endDate = new Date(gregorianYear, 11, 31, 23, 59, 59);

      result.start_date = startDate.toISOString();
      result.end_date = endDate.toISOString();
    }
  }

  return result;
};

export default {
  buildFilterParams,
  addDateFilters
};
