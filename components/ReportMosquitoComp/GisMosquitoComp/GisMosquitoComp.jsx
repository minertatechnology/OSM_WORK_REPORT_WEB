import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Download } from "lucide-react";
import { useKMLData } from "../../../composables/useKMLData.js";
import { useMapManager } from "../../../composables/useMapManager.js";
import { useHealthRegions } from "../../../composables/useHealthRegions.js";
import { useLoading } from "../../../context/LoadingProvider";
import { useUserPermission } from "@context/UserPermissionProvider";
import reportsAnalyticsService from "@services/reportsAnalyticsService";
import CustomSelect from "@services/customSelectService/customSelectService";
import {
  getProvinces,
  getDistricts,
  getSubdistricts,
} from "@services/lookupService";
import {
  getCurrentFiscalYear,
  isInFiscalYear,
  isInCalendarYear,
  isInMonth,
  isInWeekOfMonth,
} from "@utils/fiscalYearHelper";
import styles from "../../Reportosm1Comp/GisComp/GisComp.module.css";

const normalizeLookupValue = (value) => {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value).trim();
};

const getLookupName = (item) => {
  return normalizeLookupValue(item?.name_th || item?.name || item?.label);
};

const getLookupCode = (item) => {
  return normalizeLookupValue(item?.code ?? item?.id);
};

const normalizeLookupList = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .map((item) => {
      const name = getLookupName(item);
      const code = getLookupCode(item);
      if (!name) {
        return null;
      }
      return { name, code };
    })
    .filter(Boolean);
};

const buildCodeMap = (items) => {
  return items.reduce((acc, item) => {
    if (item.code) {
      acc[item.name] = item.code;
    }
    return acc;
  }, {});
};

const normalizeAreaName = (value) => {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value).trim();
};

// Special case mappings for problematic district names (KML filename mismatches)
// Empty for now - all files have been renamed to match lookup API names
const KML_NAME_MAPPINGS = {
  // Add more special cases here if needed for other districts/provinces
};

const normalizeAreaKey = (value, level) => {
  const name = normalizeAreaName(value);
  if (!name) {
    return "";
  }

  let normalized = name
    .replace(/^จังหวัด\s*/i, "")
    .replace(/^จ\.\s*/i, "")
    .replace(/^อำเภอ\s*/i, "")
    .replace(/^อ\.\s*/i, "")
    .replace(/^เขต\s*/i, "")
    .replace(/^ตำบล\s*/i, "")
    .replace(/^ต\.\s*/i, "")
    .replace(/^แขวง\s*/i, "")
    .trim();

  if (level === "province") {
    if (["กรุงเทพฯ", "กทม.", "กทม"].includes(normalized)) {
      normalized = "กรุงเทพมหานคร";
    }
  }

  // Apply KML name mappings for district and subdistrict levels
  // This must be done AFTER other normalization but BEFORE returning
  if (level === "district" || level === "subdistrict") {
    if (KML_NAME_MAPPINGS[normalized]) {
      normalized = KML_NAME_MAPPINGS[normalized];
    }
  }

  return normalized;
};

const normalizeAreaFileName = (value, level) => {
  // Just use normalizeAreaKey since mapping is now applied there
  return normalizeAreaKey(value, level);
};

const getReportProvinceName = (report) =>
  normalizeAreaName(
    report?.province_name_th ||
      report?.location_data?.region ||
      report?.location_data?.province
  );

const getReportDistrictName = (report) =>
  normalizeAreaName(
    report?.district_name_th ||
      report?.location_data?.city ||
      report?.location_data?.district
  );

const getReportSubdistrictName = (report) =>
  normalizeAreaName(
    report?.subdistrict_name_th ||
      report?.location_data?.district ||
      report?.location_data?.sublocality
  );

const getReportsFromWeeklyDetails = (data) => {
  const candidates = [
    data?.mosquito_larvae_reports,
    data?.report_mosquito_reports,
    data?.report_mosquito_larvae_reports,
    data?.report_larvae_reports,
    data?.mosquito_reports,
    data?.reports,
  ].filter(Array.isArray);

  for (const list of candidates) {
    if (list.length > 0) {
      return list;
    }
  }

  return [];
};

// ฟังก์ชันสร้างสีจากค่า HI
// HI < 1%: ปลอดภัย (สีเขียว)
// 1% <= HI < 10%: เฝ้าระวัง (สีเหลือง/ส้ม)
// HI >= 10%: มีความเสี่ยงสูง (สีแดง)
const getHIColor = (hi) => {
  if (hi < 1) {
    return { color: "#28a745", fillColor: "#28a745", fillOpacity: 0.3 }; // เขียว - ปลอดภัย
  } else if (hi < 10) {
    return { color: "#ffc107", fillColor: "#ffc107", fillOpacity: 0.4 }; // เหลือง - เฝ้าระวัง
  } else {
    return { color: "#dc3545", fillColor: "#dc3545", fillOpacity: 0.6 }; // แดง - เสี่ยงสูง
  }
};

// คำนวณค่า HI (House Index) แยกตามพื้นที่ (จังหวัด/อำเภอ/ตำบล)
// HI = (จำนวนบ้านที่สำรวจพบลูกน้ำยุงลาย / จำนวนบ้านที่สำรวจทั้งหมด) × 100
//
// การแปลผล:
// HI < 1%: มีความเสี่ยงต่ำ (ปลอดภัย)
// 1% <= HI < 10%: เฝ้าระวัง
// HI >= 10%: มีความเสี่ยงสูงที่จะเกิดการแพร่ระบาด
// undefined: ไม่มีข้อมูล (แสดงสีเทา)
const calculateHIByArea = (data, getAreaName, availableAreas = [], level = "province") => {
  const reports = getReportsFromWeeklyDetails(data);
  const hiMap = new Map();

  // Group reports by area
  const areaReports = new Map();

  reports.forEach((report) => {
    const name = getAreaName(report);
    if (!name) return;

    const normalizedName = normalizeAreaKey(name, level);

    if (!areaReports.has(normalizedName)) {
      areaReports.set(normalizedName, []);
    }
    areaReports.get(normalizedName).push(report);
  });

  // Calculate HI for each area
  areaReports.forEach((reportsInArea, areaName) => {
    let housesWithLarvae = 0;
    let housesSurveyed = reportsInArea.length;

    reportsInArea.forEach((report) => {
      const containerData = report?.containers || report?.notes || { inside: [], outside: [] };
      const insideContainers = Array.isArray(containerData.inside) ? containerData.inside : [];
      const outsideContainers = Array.isArray(containerData.outside) ? containerData.outside : [];

      let houseHasLarvae = false;

      // ตรวจสอบภาชนะในบ้าน
      insideContainers.forEach((container) => {
        const found = Number(container?.found) || 0;
        if (found > 0) {
          houseHasLarvae = true;
        }
      });

      // ตรวจสอบภาชนะนอกบ้าน
      outsideContainers.forEach((container) => {
        const found = Number(container?.found) || 0;
        if (found > 0) {
          houseHasLarvae = true;
        }
      });

      if (houseHasLarvae) {
        housesWithLarvae++;
      }
    });

    // คำนวณ HI = (จำนวนบ้านที่พบลูกน้ำ / จำนวนบ้านที่สำรวจ) × 100
    const hi = housesSurveyed > 0 ? (housesWithLarvae / housesSurveyed) * 100 : 0;
    hiMap.set(areaName, hi);
  });

  // ❌ ไม่เติมค่า HI = 0 สำหรับพื้นที่ที่ไม่มีข้อมูล
  // แต่เติมค่า undefined เพื่อให้แสดงสีเทาแทน
  // พื้นที่ที่มีข้อมูลจะมีค่า HI จริง, พื้นที่ที่ไม่มีข้อมูลจะเป็น undefined

  return Object.fromEntries(hiMap);
};

const calculateHICI = (data) => {
  const reports = getReportsFromWeeklyDetails(data);
  const summary = data?.summary || {};

  if (!Array.isArray(reports) || reports.length === 0) {
    return {
      hi: 0, ci: 0,
      housesSurveyed: 0, housesWithLarvae: 0,
      containersSurveyed: 0, containersWithLarvae: 0
    };
  }

  // ใช้ข้อมูลจาก summary ถ้ามี (เพราะ summary มีข้อมูลบ้านที่ไม่พบลูกน้ำด้วย)
  const housesWithLarvaeFromSummary = Number(summary.mosquito_larvae_found) || 0;
  const housesNotFoundFromSummary = Number(summary.mosquito_larvae_not_found) || 0;
  const housesSurveyedFromSummary = housesWithLarvaeFromSummary + housesNotFoundFromSummary;

  // จำนวนบ้านที่สำรวจ - ใช้จาก summary ถ้ามี, ถ้าไม่มีใช้จาก reports
  const housesSurveyed = housesSurveyedFromSummary > 0 ? housesSurveyedFromSummary : reports.length;

  let housesWithLarvae = 0;
  let containersSurveyed = 0;
  let containersWithLarvae = 0;

  reports.forEach((report) => {
    // ข้ามรายงานที่ไม่มีข้อมูล containers
    if (!report?.containers && !report?.notes) {
      return;
    }

    // รองรับทั้ง containers และ notes (โครงสร้างเดิม)
    const containerData = report?.containers || report?.notes || { inside: [], outside: [] };
    const insideContainers = Array.isArray(containerData.inside) ? containerData.inside : [];
    const outsideContainers = Array.isArray(containerData.outside) ? containerData.outside : [];

    let houseHasLarvae = false;
    let houseContainersSurveyed = 0;
    let houseContainersWithLarvae = 0;

    // นับภาชนะในบ้าน (จานรอง, แจกัน, ถังน้ำ, ฯลฯ)
    insideContainers.forEach((container) => {
      const total = Number(container?.total) || 0;
      const found = Number(container?.found) || 0;
      // ตรวจสอบความถูกต้องของข้อมูล (found ไม่ควรเกิน total)
      const validFound = Math.min(found, total);
      containersSurveyed += total;
      containersWithLarvae += validFound;
      houseContainersSurveyed += total;
      houseContainersWithLarvae += validFound;
      if (validFound > 0) {
        houseHasLarvae = true;
      }
    });

    // นับภาชนะนอกบ้าน
    outsideContainers.forEach((container) => {
      const total = Number(container?.total) || 0;
      const found = Number(container?.found) || 0;
      // ตรวจสอบความถูกต้องของข้อมูล (found ไม่ควรเกิน total)
      const validFound = Math.min(found, total);
      containersSurveyed += total;
      containersWithLarvae += validFound;
      houseContainersSurveyed += total;
      houseContainersWithLarvae += validFound;
      if (validFound > 0) {
        houseHasLarvae = true;
      }
    });

    if (houseHasLarvae) {
      housesWithLarvae++;
    }
  });

  // ใช้ค่าบ้านพบลูกน้ำจาก summary ถ้ามี (เพราะ summary มีข้อมูลครบทั้งพบและไม่พบ)
  // ถ้าไม่มี summary ให้นับจาก reports (แต่จะได้เฉพาะบ้านที่มี report)
  const finalHousesWithLarvae = housesWithLarvaeFromSummary > 0 ? housesWithLarvaeFromSummary : housesWithLarvae;

  // คำนวณ HI = (จำนวนบ้านที่พบลูกน้ำ / จำนวนบ้านที่สำรวจ) × 100
  // ตัวอย่าง: สำรวจ 100 หลังบ้าน พบลูกน้ำยุงลาย 15 หลัง จะได้ HI = (15/100) × 100 = 15%
  const hi = housesSurveyed > 0 ? (finalHousesWithLarvae / housesSurveyed) * 100 : 0;

  // คำนวณ CI = (จำนวนภาชนะที่พบลูกน้ำ / จำนวนภาชนะที่สำรวจ) × 100
  // ตัวอย่าง: สำรวจ 200 ภาชนะ พบว่ามี 20 ภาชนะที่มีลูกน้ำ จะได้ CI = (20/200) × 100 = 10%

  // ตรวจสอบไม่ให้ CI เกิน 100% (เพื่อป้องกันข้อมูลผิดปกติ)
  let ci = containersSurveyed > 0 ? (containersWithLarvae / containersSurveyed) * 100 : 0;
  if (ci > 100) {
    console.warn('CI เกิน 100% อาจมีข้อมูลผิดปกติ:', {
      containersSurveyed,
      containersWithLarvae,
      ci,
      reports: reports.length
    });
    ci = Math.min(ci, 100); // จำกัดไม่ให้เกิน 100%
  }

  return {
    hi: Math.round(hi * 100) / 100, // ปัดเศษ 2 ตำแหน่ง
    ci: Math.round(ci * 100) / 100,
    housesSurveyed,
    housesWithLarvae: finalHousesWithLarvae,
    containersSurveyed,
    containersWithLarvae,
  };
};

const normalizeMonthlyReportDataFromAnalytics = (data) => {
  if (!data) {
    return { total: 0, items: [] };
  }

  if (typeof data?.total === "number" && Array.isArray(data?.items)) {
    return { total: data.total, items: data.items };
  }

  if (
    typeof data?.summary?.total === "number" &&
    Array.isArray(data?.summary?.items)
  ) {
    return { total: data.summary.total, items: data.summary.items };
  }

  if (
    typeof data?.monthly?.total === "number" &&
    Array.isArray(data?.monthly?.items)
  ) {
    return { total: data.monthly.total, items: data.monthly.items };
  }

  if (typeof data?.total_reports === "number") {
    return { total: data.total_reports, items: [] };
  }

  return { total: 0, items: [] };
};

const GisMosquitoComp = () => {
  const { setLoading } = useLoading();

  // Permission hook
  const {
    user: permissionUser,
    scope,
    isLocked,
    getInitialFilters,
    loading: permissionLoading,
  } = useUserPermission();

  // States for KmlMapViewer
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSubdistrict, setSelectedSubdistrict] = useState("");
  const [availableProvinces, setAvailableProvinces] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableSubdistricts, setAvailableSubdistricts] = useState([]);
  const [provinceCodeByName, setProvinceCodeByName] = useState({});
  const [districtCodeByName, setDistrictCodeByName] = useState({});
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingSubdistricts, setIsLoadingSubdistricts] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Refs for preventing wheel zoom on map
  const controlPanelRef = useRef(null);
  const chartCardRef = useRef(null);

  // Refs for permission initialization tracking
  const permissionInitializedRef = useRef(false);
  const districtInitializedRef = useRef(false);
  const subdistrictInitializedRef = useRef(false);
  const isInitializingFromPermissionRef = useRef(false);

  // States for Health Regions
  const [selectedHealthRegion, setSelectedHealthRegion] = useState("");
  const [availableProvincesInRegion, setAvailableProvincesInRegion] = useState(
    []
  );

  // States for year, month and week selection
  const [selectedYearType, setSelectedYearType] = useState("fiscal"); // fiscal = ปีงบประมาณ, calendar = รายปี
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");

  const [weeklyDetails, setWeeklyDetails] = useState(null);
  const [displayData, setDisplayData] = useState([]);
  const [monthlyReportData, setMonthlyReportData] = useState({
    total: 0,
    items: [],
  });
  const [hiciData, setHiciData] = useState({
    hi: 0,
    ci: 0,
    housesSurveyed: 0,
    housesWithLarvae: 0,
    containersSurveyed: 0,
    containersWithLarvae: 0,
  });
  const [isDataLoading, setIsDataLoading] = useState(false);

  const mosquitoReportData = monthlyReportData;

  // State for storing HI values by area
  const [hiByArea, setHiByArea] = useState({});

  const mapContainer = useRef(null);

  // ฟังก์ชันกำหนดสีจากค่า HI สำหรับแสดงใน Donut Chart และ Area List
  const getHIColorForDisplay = (areaName) => {
    // Determine current level based on selection state
    const isLevelSubdistrict = selectedDistrict && availableSubdistricts.length > 0;
    const isLevelDistrict = !isLevelSubdistrict && selectedProvince && availableDistricts.length > 0;
    const level = isLevelSubdistrict
      ? "subdistrict"
      : isLevelDistrict
      ? "district"
      : "province";

    // Normalize area name to match the keys in hiByArea
    const normalizedKey = level === "province"
      ? normalizeAreaKeyWithThai(areaName, level)
      : normalizeAreaKey(areaName, level);

    const hi = hiByArea?.[normalizedKey];
    if (hi === undefined) {
      return "#9CA3AF"; // สีเทา - ไม่มีข้อมูล
    }
    if (hi < 1) {
      return "#198754"; // 🟢 เขียวเข้ม - ปลอดภัย (HI < 1%)
    } else if (hi < 10) {
      return "#f59e0b"; // 🟡 เหลืองเข้ม - เฝ้าระวัง (1% <= HI < 10%)
    } else {
      return "#dc2626"; // 🔴 แดงเข้ม - เสี่ยงสูง (HI >= 10%)
    }
  };

  // Composables
  const { getEnglishProvinceName, getThaiProvinceName } = useKMLData();

  const normalizeAreaKeyWithThai = useCallback(
    (value, level) => {
      const normalized = normalizeAreaKey(value, level);
      if (level !== "province") {
        return normalized;
      }
      const thaiName = getThaiProvinceName(normalized);
      return normalizeAreaKey(thaiName, level);
    },
    [getThaiProvinceName]
  );

  const {
    map,
    initializeMap,
    loadAndDisplayKML,
    clearAllLayers,
    fitToData,
    cleanup,
    updateResponsiveZoom,
    setHiByAreaData,
  } = useMapManager();

  const { getHealthRegionsList, getProvincesInRegion } = useHealthRegions();

  // Options data for CustomSelect components
  const yearTypeOptions = [
    { value: "fiscal", label: "ปีงบประมาณ" },
    { value: "calendar", label: "รายปี" },
  ];

  const currentBuddhistYear = new Date().getFullYear() + 543;
  const yearOptions = [
    { value: "0", label: "ทุกปี" },
    ...Array.from({ length: 15 }, (_, index) => {
      const year = currentBuddhistYear - index;
      // แสดงผลเป็น ปีงบประมาณ (เช่น 2568) หรือ รายปี (เช่น 2568)
      const label = selectedYearType === "fiscal"
        ? ` ${year}`
        : ` ${year}`;
      return { value: String(year), label };
    })
  ];

  // เดือน options สำหรับปีปฏิทิน (เริ่มต้นที่มกราคม)
  const calendarMonths = [
    { value: "0", label: "ทุกเดือน" },
    { value: "01", label: "มกราคม" },
    { value: "02", label: "กุมภาพันธ์" },
    { value: "03", label: "มีนาคม" },
    { value: "04", label: "เมษายน" },
    { value: "05", label: "พฤษภาคม" },
    { value: "06", label: "มิถุนายน" },
    { value: "07", label: "กรกฎาคม" },
    { value: "08", label: "สิงหาคม" },
    { value: "09", label: "กันยายน" },
    { value: "10", label: "ตุลาคม" },
    { value: "11", label: "พฤศจิกายน" },
    { value: "12", label: "ธันวาคม" },
  ];

  // เดือน options สำหรับปีงบประมาณ (เริ่มต้นที่ตุลาคม)
  const fiscalMonths = [
    { value: "0", label: "ทุกเดือน" },
    { value: "10", label: "ตุลาคม" },
    { value: "11", label: "พฤศจิกายน" },
    { value: "12", label: "ธันวาคม" },
    { value: "01", label: "มกราคม" },
    { value: "02", label: "กุมภาพันธ์" },
    { value: "03", label: "มีนาคม" },
    { value: "04", label: "เมษายน" },
    { value: "05", label: "พฤษภาคม" },
    { value: "06", label: "มิถุนายน" },
    { value: "07", label: "กรกฎาคม" },
    { value: "08", label: "สิงหาคม" },
    { value: "09", label: "กันยายน" },
  ];

  // เลือกรายการเดือนตามประเภทปี
  const monthOptions = selectedYearType === "fiscal" ? fiscalMonths : calendarMonths;

  const weekOptions = [
    { value: "0", label: "ทุกสัปดาห์" },
    { value: "1", label: "สัปดาห์ที่ 1 (1-7)" },
    { value: "2", label: "สัปดาห์ที่ 2 (8-14)" },
    { value: "3", label: "สัปดาห์ที่ 3 (15-21)" },
    { value: "4", label: "สัปดาห์ที่ 4 (22-31)" },
  ];

  const healthRegionOptions = getHealthRegionsList().map((region) => ({
    value: region,
    label: region,
  }));

  const provinceOptions = (
    selectedHealthRegion ? availableProvincesInRegion : availableProvinces
  ).map((province) => ({
    value: province,
    label: province,
  }));

  const districtOptions = availableDistricts.map((district) => ({
    value: district,
    label: district,
  }));

  const subdistrictOptions = availableSubdistricts.map((subdistrict) => ({
    value: subdistrict,
    label: subdistrict,
  }));

  const buildDisplayDataFromReports = useCallback(() => {
    const reports = getReportsFromWeeklyDetails(weeklyDetails);
    // Don't return early - we want to show all areas with 0 values even if no reports

    const filteredReports = (reports || []).filter((report) => {
      const provinceKey = normalizeAreaKeyWithThai(
        getReportProvinceName(report),
        "province"
      );
      const districtKey = normalizeAreaKey(
        getReportDistrictName(report),
        "district"
      );
      const subdistrictKey = normalizeAreaKey(
        getReportSubdistrictName(report),
        "subdistrict"
      );

      if (
        selectedProvince &&
        provinceKey !== normalizeAreaKeyWithThai(selectedProvince, "province")
      ) {
        return false;
      }
      if (
        selectedDistrict &&
        districtKey !== normalizeAreaKey(selectedDistrict, "district")
      ) {
        return false;
      }
      if (
        selectedSubdistrict &&
        subdistrictKey !== normalizeAreaKey(selectedSubdistrict, "subdistrict")
      ) {
        return false;
      }
      return true;
    });

    const isLevelSubdistrict =
      selectedDistrict && availableSubdistricts.length > 0;
    const isLevelDistrict =
      !isLevelSubdistrict && selectedProvince && availableDistricts.length > 0;
    const isLevelProvince =
      !isLevelSubdistrict &&
      !isLevelDistrict &&
      selectedHealthRegion &&
      availableProvincesInRegion.length > 0;

    // Use availableProvinces when no area filters are applied (show all provinces)
    const areaList = isLevelSubdistrict
      ? availableSubdistricts
      : isLevelDistrict
      ? availableDistricts
      : isLevelProvince
      ? availableProvincesInRegion
      : availableProvinces;

    const getAreaName = isLevelSubdistrict
      ? getReportSubdistrictName
      : isLevelDistrict
      ? getReportDistrictName
      : getReportProvinceName;

    const level = isLevelSubdistrict
      ? "subdistrict"
      : isLevelDistrict
      ? "district"
      : "province";

    // Build a map of normalized key to display name
    const areaKeyByName = new Map(
      areaList.map((name) => {
        const key =
          level === "province"
            ? normalizeAreaKeyWithThai(name, level)
            : normalizeAreaKey(name, level);
        return [key, name];
      })
    );

    // Count reports by area
    const counts = new Map();
    filteredReports.forEach((report) => {
      const name = getAreaName(report);
      const key =
        level === "province"
          ? normalizeAreaKeyWithThai(name, level)
          : normalizeAreaKey(name, level);
      if (!key) {
        return;
      }
      // Find matching display name from areaList (case-insensitive match via normalized key)
      let displayName = name;
      for (const [areaKey, areaName] of areaKeyByName) {
        if (key === areaKey) {
          displayName = areaName;
          break;
        }
      }
      counts.set(displayName, (counts.get(displayName) || 0) + 1);
    });

    // Map all areas in areaList to display data (show 0 for areas with no reports)
    const data = areaList.map((name) => ({
      name,
      value: counts.get(name) || 0,
    }));

    return data; // Don't filter - show all areas including those with 0 value
  }, [
    weeklyDetails,
    selectedProvince,
    selectedDistrict,
    selectedSubdistrict,
    selectedHealthRegion,
    availableSubdistricts,
    availableDistricts,
    availableProvincesInRegion,
    availableProvinces,
    normalizeAreaKeyWithThai,
  ]);

  useEffect(() => {}, []);

  const updateStatus = useCallback((message, type = "info") => {
    // Status update: ${type.toUpperCase()} - ${message}
  }, []);

  const toggleControlPanel = () => {
    setIsCollapsed(!isCollapsed);
  };

  const loadMapData = useCallback(
    async (level, name) => {
      try {
        setIsLoading(true);
        updateStatus(`กำลังโหลด ${level} - ${name}...`, "info");

        let filePath = "";

        if (level === "province") {
          filePath = `/geojson-provinces/${name}.json`;
        } else if (level === "amphoe") {
          const englishProvinceName = getEnglishProvinceName(selectedProvince);
          const amphoeFileName = normalizeAreaFileName(name, "district");
          filePath = `/geojson-amphoe/${englishProvinceName}/${amphoeFileName}.json`;
        } else if (level === "tambon") {
          const englishProvinceName = getEnglishProvinceName(selectedProvince);
          const districtFileName = normalizeAreaFileName(
            selectedDistrict,
            "district"
          );
          const tambonFileName = normalizeAreaFileName(name, "subdistrict");
          filePath = `/geojson-tambon/${englishProvinceName}/${districtFileName}/${tambonFileName}.json`;
        } else {
          filePath = `/geojson-provinces/${name}.json`;
        }

        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(
            `ไม่พบไฟล์: ${filePath} (Status: ${response.status})`
          );
        }

        // Directly parse JSON (GeoJSON format)
        const geoJsonData = await response.json();

        if (!geoJsonData || !geoJsonData.features) {
          throw new Error("ไม่พบ features ในไฟล์ GeoJSON");
        }

        const result = await loadAndDisplayKML(geoJsonData, level);

        if (result) {
          const levelText =
            level === "province"
              ? "จังหวัด"
              : level === "amphoe"
              ? "อำเภอ"
              : "ตำบล";
          updateStatus(
            `โหลด ${levelText} ${name} สำเร็จ: ${result.featureCount} features (${result.loadTime}s)`,
            "success"
          );
        }
      } catch (error) {
        console.error("Error loading map data:", error);
        updateStatus(`ข้อผิดพลาดในการโหลด: ${error}`, "error");
      } finally {
        setIsLoading(false);
      }
    },
    [
      selectedProvince,
      selectedDistrict,
      updateStatus,
      loadAndDisplayKML,
      getEnglishProvinceName,
    ]
  );

  const fitToFiltered = useCallback(() => {
    fitToData();
  }, [fitToData]);

  const onProvinceChange = useCallback(async () => {
    // Don't reset values if initializing from permission
    const isInitializing = isInitializingFromPermissionRef.current;
    if (!isInitializing) {
      setSelectedDistrict("");
      setSelectedSubdistrict("");
      setAvailableDistricts([]);
      setAvailableSubdistricts([]);
      setDistrictCodeByName({});
    }

    if (selectedProvince) {
      try {
        setIsLoadingDistricts(true);
        setIsLoading(true);
        updateStatus(`กำลังโหลดข้อมูลอำเภอใน ${selectedProvince}...`, "info");

        const provinceCode = provinceCodeByName[selectedProvince];
        if (!provinceCode) {
          updateStatus(
            `ไม่พบรหัสจังหวัดสำหรับ ${selectedProvince}`,
            "warning"
          );
          return;
        }

        const districtData = await getDistricts(provinceCode);
        const normalizedDistricts = normalizeLookupList(districtData);
        const districtNames = normalizedDistricts.map((item) => item.name);
        setAvailableDistricts(districtNames);
        setDistrictCodeByName(buildCodeMap(normalizedDistricts));

        if (districtNames.length > 0) {
          updateStatus(
            `พบ ${districtNames.length} อำเภอในจังหวัด ${selectedProvince}, กำลังโหลดแผนที่...`,
            "info"
          );

          clearAllLayers();

          const englishProvinceName = getEnglishProvinceName(selectedProvince);
          const loadPromises = districtNames.map(async (amphoeName) => {
            try {
              const amphoeFileName = normalizeAreaFileName(
                amphoeName,
                "district"
              );
              const filePath = `/geojson-amphoe/${englishProvinceName}/${amphoeFileName}.json`;
              const response = await fetch(filePath);
              if (!response.ok) {
                console.warn(`ไม่พบไฟล์: ${filePath}`);
                return null;
              }

              const geoJsonData = await response.json();

              if (geoJsonData && geoJsonData.features) {
                return { amphoeName, geoJsonData };
              }
              return null;
            } catch (error) {
              console.error(`Error loading ${amphoeName}:`, error);
              return null;
            }
          });

          const results = await Promise.all(loadPromises);
          const validResults = results.filter((result) => result !== null);

          if (validResults.length > 0) {
            const allFeatures = validResults.flatMap(
              (result) => result.geoJsonData.features
            );
            const combinedGeoJSON = {
              type: "FeatureCollection",
              features: allFeatures,
            };

            const result = await loadAndDisplayKML(combinedGeoJSON, "amphoe");

            if (result) {
              updateStatus(
                `โหลดแผนที่ ${selectedProvince} สำเร็จ: ${validResults.length} อำเภอ, ${result.featureCount} features`,
                "success"
              );
            }
          } else {
            updateStatus(
              `ไม่พบข้อมูลแผนที่สำหรับ ${selectedProvince}`,
              "warning"
            );
          }
        } else {
          updateStatus(
            `ไม่พบข้อมูลอำเภอในจังหวัด ${selectedProvince}`,
            "warning"
          );
        }
      } catch (error) {
        console.error("Error in onProvinceChange:", error);
        updateStatus(`ข้อผิดพลาดในการโหลดข้อมูล: ${error}`, "error");
      } finally {
        setIsLoadingDistricts(false);
        setIsLoading(false);
      }
    } else {
      clearAllLayers();
      updateStatus("ค้นหาพื้นที่เพื่อเริ่มต้น", "info");
    }
  }, [
    selectedProvince,
    provinceCodeByName,
    getEnglishProvinceName,
    updateStatus,
    loadAndDisplayKML,
    clearAllLayers,
  ]);

  const onDistrictChange = useCallback(async () => {
    // Don't reset values if initializing from permission
    const isInitializing = isInitializingFromPermissionRef.current;
    if (!isInitializing) {
      setSelectedSubdistrict("");
      setAvailableSubdistricts([]);
    }

    if (selectedDistrict) {
      try {
        setIsLoadingSubdistricts(true);
        setIsLoading(true);
        updateStatus(`กำลังโหลดข้อมูลตำบลใน ${selectedDistrict}...`, "info");

        const districtCode = districtCodeByName[selectedDistrict];
        if (!districtCode) {
          updateStatus(
            `ไม่พบรหัสอำเภอสำหรับ ${selectedDistrict}`,
            "warning"
          );
          return;
        }

        const subdistrictData = await getSubdistricts(districtCode);
        const normalizedSubdistricts = normalizeLookupList(subdistrictData);
        const subdistrictNames = normalizedSubdistricts.map((item) => item.name);
        setAvailableSubdistricts(subdistrictNames);

        if (subdistrictNames.length > 0) {
          clearAllLayers();

          const englishProvinceName = getEnglishProvinceName(selectedProvince);
          const districtFileName = normalizeAreaFileName(
            selectedDistrict,
            "district"
          );
          const loadPromises = subdistrictNames.map(async (tambonName) => {
            try {
              const tambonFileName = normalizeAreaFileName(
                tambonName,
                "subdistrict"
              );
              const filePath = `/geojson-tambon/${englishProvinceName}/${districtFileName}/${tambonFileName}.json`;
              const response = await fetch(filePath);
              if (!response.ok) return null;

              const geoJsonData = await response.json();

              return { tambonName, geoJsonData };
            } catch (error) {
              console.warn(`ไม่สามารถโหลด ${tambonName}:`, error);
              return null;
            }
          });

          const results = await Promise.all(loadPromises);
          const validResults = results.filter((result) => result !== null);

          if (validResults.length > 0) {
            const allFeatures = validResults.flatMap((result) =>
              result.geoJsonData.features.map((feature) => ({
                ...feature,
                properties: {
                  ...feature.properties,
                  name: result.tambonName,
                  TAMBON_T: result.tambonName,
                },
              }))
            );
            const combinedGeoJSON = {
              type: "FeatureCollection",
              features: allFeatures,
            };

            const loadResult = await loadAndDisplayKML(
              combinedGeoJSON,
              "tambon"
            );
            updateStatus(
              `โหลดแผนที่ ${selectedDistrict} สำเร็จ: ${validResults.length} ตำบล, ${loadResult.featureCount} features`,
              "success"
            );
          } else {
            updateStatus(
              `ไม่พบข้อมูลแผนที่สำหรับ ${selectedDistrict}`,
              "warning"
            );
          }
        } else {
          updateStatus(`ไม่พบข้อมูลตำบลในอำเภอ ${selectedDistrict}`, "warning");
        }
      } catch (error) {
        console.error("Error in onDistrictChange:", error);
        updateStatus(`ข้อผิดพลาดในการโหลดข้อมูล: ${error}`, "error");
      } finally {
        setIsLoadingSubdistricts(false);
        setIsLoading(false);
      }
    } else if (selectedProvince) {
      await loadMapData("province", selectedProvince);
      setTimeout(() => {
        fitToFiltered();
      }, 300);
    }
  }, [
    selectedDistrict,
    selectedProvince,
    districtCodeByName,
    getEnglishProvinceName,
    updateStatus,
    loadMapData,
    fitToFiltered,
    clearAllLayers,
    loadAndDisplayKML,
  ]);

  const onSubdistrictChange = useCallback(async () => {
    if (selectedSubdistrict) {
      try {
        setIsLoading(true);
        clearAllLayers();

        const englishProvinceName = getEnglishProvinceName(selectedProvince);
        const districtFileName = normalizeAreaFileName(
          selectedDistrict,
          "district"
        );
        const subdistrictFileName = normalizeAreaFileName(
          selectedSubdistrict,
          "subdistrict"
        );
        const filePath = `/geojson-tambon/${englishProvinceName}/${districtFileName}/${subdistrictFileName}.json`;
        const response = await fetch(filePath);

        if (response.ok) {
          const geoJsonData = await response.json();

          const featuresWithName = geoJsonData.features.map((feature) => ({
            ...feature,
            properties: {
              ...feature.properties,
              name: selectedSubdistrict,
              TAMBON_T: selectedSubdistrict,
            },
          }));

          const combinedGeoJSON = {
            type: "FeatureCollection",
            features: featuresWithName,
          };

          await loadAndDisplayKML(combinedGeoJSON, "tambon");
          updateStatus(
            `โหลด polygon ตำบล ${selectedSubdistrict} สำเร็จ`,
            "success"
          );
        } else {
          updateStatus(
            `ไม่พบข้อมูลแผนที่สำหรับตำบล ${selectedSubdistrict}`,
            "warning"
          );
        }
      } catch (error) {
        console.error("Error in onSubdistrictChange:", error);
        updateStatus(`ข้อผิดพลาดในการโหลดข้อมูล: ${error}`, "error");
      } finally {
        setIsLoading(false);
      }
    } else if (selectedDistrict) {
    } else if (selectedProvince) {
      await loadMapData("province", selectedProvince);
    }
  }, [
    selectedSubdistrict,
    selectedDistrict,
    selectedProvince,
    loadMapData,
    updateStatus,
    getEnglishProvinceName,
    clearAllLayers,
    loadAndDisplayKML,
  ]);

  const clearFilter = useCallback(() => {
    const initialFilters = getInitialFilters();

    // ล้างการเลือกทั้งหมด แต่ preserve locked values
    setSelectedYearType("fiscal");
    setSelectedYear("");
    setSelectedMonth("");
    setSelectedWeek("");

    // ✅ Restore locked values after clearing
    // Zone (เขตสุขภาพ)
    if (isLocked('zone') && initialFilters.zone) {
      const zoneNumber = parseInt(String(initialFilters.zone).replace(/\D/g, ''));
      if (zoneNumber) {
        setSelectedHealthRegion(`เขตสุขภาพที่ ${zoneNumber}`);
      } else {
        setSelectedHealthRegion("");
      }
    } else {
      setSelectedHealthRegion("");
    }

    // Province (จังหวัด)
    if (isLocked('province') && initialFilters.province_name_th) {
      setSelectedProvince(initialFilters.province_name_th);
    } else {
      setSelectedProvince("");
    }

    // District (อำเภอ)
    if (isLocked('district') && initialFilters.district_name_th) {
      setSelectedDistrict(initialFilters.district_name_th);
    } else {
      setSelectedDistrict("");
    }

    // Subdistrict (ตำบล)
    if (isLocked('subdistrict') && initialFilters.subdistrict_name_th) {
      setSelectedSubdistrict(initialFilters.subdistrict_name_th);
    } else {
      setSelectedSubdistrict("");
    }

    // Clear available lists for unlocked values
    if (!isLocked('province')) {
      setAvailableProvincesInRegion([]);
    }
    if (!isLocked('district')) {
      setAvailableDistricts([]);
    }
    if (!isLocked('subdistrict')) {
      setAvailableSubdistricts([]);
    }

    setDistrictCodeByName({});

    clearAllLayers();

    if (map) {
      map.setView([13.7563, 100.5018], 6);
    }

    updateStatus("ค้นหาพื้นที่เพื่อเริ่มต้น", "info");
  }, [clearAllLayers, updateStatus, map, isLocked, getInitialFilters]);

  const onHealthRegionSelection = useCallback(async () => {
    if (selectedHealthRegion) {
      try {
        const provincesInRegion = getProvincesInRegion(selectedHealthRegion);
        setAvailableProvincesInRegion(provincesInRegion);

        // Don't reset selections if initializing from permission
        const isInitializing = isInitializingFromPermissionRef.current;
        if (!isInitializing) {
          setSelectedProvince("");
          setSelectedDistrict("");
          setSelectedSubdistrict("");
          setAvailableDistricts([]);
          setAvailableSubdistricts([]);
          setDistrictCodeByName({});
        }

        // Clear old layers when health region changes
        clearAllLayers();

        // Note: Actual map loading is handled by the useEffect at line 1510
        // which loads provinces when availableProvincesInRegion changes

        if (
          selectedHealthRegion === "เขตสุขภาพที่ 13" &&
          provincesInRegion.includes("กรุงเทพมหานคร")
        ) {
          setSelectedProvince("กรุงเทพมหานคร");
        }
      } catch (error) {
        console.error("Error in onHealthRegionSelection:", error);
        updateStatus(
          `ข้อผิดพลาดในการโหลด ${selectedHealthRegion}: ${error}`,
          "error"
        );
      }
    } else {
      setAvailableProvincesInRegion([]);
      setSelectedProvince("");
      setSelectedDistrict("");
      setSelectedSubdistrict("");
      setAvailableDistricts([]);
      setAvailableSubdistricts([]);
      setDistrictCodeByName({});
      clearAllLayers();
      updateStatus("ค้นหาพื้นที่เพื่อเริ่มต้น", "info");
    }
  }, [
    selectedHealthRegion,
    getProvincesInRegion,
    clearAllLayers,
    updateStatus,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let isMounted = true;

    const initializeComponent = async () => {
      try {
        setLoading(true);

        // Load Leaflet CSS and library in parallel
        const [_, L] = await Promise.all([
          import("leaflet/dist/leaflet.css"),
          import("leaflet"),
        ]);

        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-shadow.png",
        });

        if (mapContainer.current && isMounted) {
          await initializeMap(mapContainer.current, L);
        }

        if (isMounted) {
          const provincesData = await getProvinces({ limit: 100 });
          const normalized = normalizeLookupList(provincesData);
          setAvailableProvinces(normalized.map((item) => item.name));
          setProvinceCodeByName(buildCodeMap(normalized));
          updateStatus("แผนที่พร้อมใช้งาน - ค้นหาพื้นที่เพื่อเริ่มต้น", "info");
        }
      } catch (error) {
        console.error("Error initializing component:", error);
        if (isMounted) {
          updateStatus("ข้อผิดพลาดในการเริ่มต้นระบบ", "error");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeComponent();

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [initializeMap, cleanup, updateStatus]);

  // Handle window resize - update responsive zoom levels
  useEffect(() => {
    if (!map) return;

    // Initial update
    updateResponsiveZoom();

    // Add resize listener with debounce
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        updateResponsiveZoom();
      }, 200);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [map, updateResponsiveZoom]);

  // Permission initialization - auto-fill filters based on user's permission scope
  useEffect(() => {
    if (permissionLoading || !scope) return;
    if (permissionInitializedRef.current) return;
    // Wait for provinces to be loaded
    if (Object.keys(provinceCodeByName).length === 0) return;

    const needsDistrictInit = isLocked('district');
    const needsSubdistrictInit = isLocked('subdistrict');

    // Set flag to prevent reset during initialization
    if (needsDistrictInit || needsSubdistrictInit) {
      isInitializingFromPermissionRef.current = true;
    }

    permissionInitializedRef.current = true;

    const initialFilters = getInitialFilters();

    // Set health region (zone) if locked
    if (isLocked('zone') && initialFilters.zone) {
      const zoneNumber = parseInt(String(initialFilters.zone).replace(/\D/g, ''));
      if (zoneNumber) {
        setSelectedHealthRegion(`เขตสุขภาพที่ ${zoneNumber}`);
      }
    }

    // Set province if locked - use initialFilters.province_name_th
    if (isLocked('province') && initialFilters.province_name_th) {
      setSelectedProvince(initialFilters.province_name_th);
    }

    // Set year to current fiscal year
    if (!selectedYear) {
      setSelectedYear(String(getCurrentFiscalYear()));
    }
  }, [permissionLoading, scope, getInitialFilters, isLocked, provinceCodeByName, selectedYear]);

  // District initialization - wait for districts to load then set from permission
  useEffect(() => {
    if (permissionLoading || !permissionUser) return;
    if (districtInitializedRef.current) return;
    if (!isLocked('district')) return;
    if (availableDistricts.length === 0) return;

    const districtName = permissionUser?.district_name;
    if (districtName) {
      // Try to find the district in available districts
      const matchedDistrict = availableDistricts.find(d => {
        const normalizedAvailable = d.replace(/^เขต|^อำเภอ/, '').trim();
        const normalizedTarget = districtName.replace(/^เขต|^อำเภอ/, '').trim();
        return normalizedAvailable === normalizedTarget || d === districtName;
      });

      if (matchedDistrict) {
        districtInitializedRef.current = true;
        setSelectedDistrict(matchedDistrict);
      }
    }
  }, [permissionLoading, permissionUser, availableDistricts, isLocked]);

  // Subdistrict initialization - wait for subdistricts to load then set from permission
  useEffect(() => {
    if (permissionLoading || !permissionUser) return;
    if (subdistrictInitializedRef.current) return;
    if (!isLocked('subdistrict')) return;
    if (availableSubdistricts.length === 0) return;

    const subdistrictName = permissionUser?.subdistrict_name;
    if (subdistrictName) {
      // Try to find the subdistrict in available subdistricts
      const matchedSubdistrict = availableSubdistricts.find(s => {
        const normalizedAvailable = s.replace(/^แขวง|^ตำบล/, '').trim();
        const normalizedTarget = subdistrictName.replace(/^แขวง|^ตำบล/, '').trim();
        return normalizedAvailable === normalizedTarget || s === subdistrictName;
      });

      if (matchedSubdistrict) {
        subdistrictInitializedRef.current = true;

        // Turn off init flag after subdistrict is set
        setTimeout(() => {
          isInitializingFromPermissionRef.current = false;
        }, 500);

        setSelectedSubdistrict(matchedSubdistrict);
      }
    }
  }, [permissionLoading, permissionUser, availableSubdistricts, isLocked]);

  useEffect(() => {
    if (selectedProvince) {
      onProvinceChange();
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedDistrict) {
      onDistrictChange();
    }
  }, [selectedDistrict]);

  useEffect(() => {
    if (selectedSubdistrict) {
      onSubdistrictChange();
    }
  }, [selectedSubdistrict]);

  useEffect(() => {
    onHealthRegionSelection();
  }, [selectedHealthRegion]);

  // Load all provinces of Thailand when no area filters are selected
  useEffect(() => {
    // Only load when provinces are available and no area filters are active
    if (availableProvinces.length === 0) return;
    if (selectedHealthRegion || selectedProvince || selectedDistrict || selectedSubdistrict) return;

    let mounted = true;

    const loadAllProvinces = async () => {
      try {
        setIsLoading(true);
        clearAllLayers();

        updateStatus(`กำลังโหลดแผนที่ประเทศไทย...`, "info");

        // Load combined GeoJSON file (single request instead of 77)
        const response = await fetch('/geojson-thailand-provinces.json');
        if (!response.ok) {
          throw new Error('Failed to load map data');
        }

        const geoJsonData = await response.json();

        if (!mounted) return;

        // Render map
        if (geoJsonData && geoJsonData.features && geoJsonData.features.length > 0) {
          await loadAndDisplayKML(geoJsonData, "province");

          updateStatus(
            `โหลดแผนที่ประเทศไทยสำเร็จ: ${geoJsonData.features.length} จังหวัด`,
            "success"
          );
        }
      } catch (error) {
        console.error("Error loading all provinces:", error);
        if (mounted) {
          updateStatus(`ข้อผิดพลาดในการโหลดแผนที่: ${error}`, "error");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadAllProvinces();

    return () => {
      mounted = false;
    };
  }, [availableProvinces, selectedHealthRegion, selectedProvince, selectedDistrict, selectedSubdistrict]);

  // Load only provinces in the selected health region
  useEffect(() => {
    // Only load when health region is selected and provinces in region are available
    if (!selectedHealthRegion || availableProvincesInRegion.length === 0) return;

    // Don't load if deeper filters are active (province/district/subdistrict)
    if (selectedProvince || selectedDistrict || selectedSubdistrict) return;

    let mounted = true;

    const loadProvincesInRegion = async () => {
      try {
        setIsLoading(true);
        clearAllLayers();

        updateStatus(`กำลังโหลดแผนที่${selectedHealthRegion}...`, "info");

        // Load combined GeoJSON file and filter by province names
        const response = await fetch('/geojson-thailand-provinces.json');
        if (!response.ok) {
          throw new Error('Failed to load map data');
        }

        const geoJsonData = await response.json();

        if (!mounted) return;

        // Filter features to only include provinces in the selected health region
        const regionProvinceSet = new Set(
          availableProvincesInRegion.map(name => normalizeAreaKey(name, "province"))
        );

        const filteredFeatures = geoJsonData.features.filter(feature => {
          const provinceName = feature.properties?.province_name ||
                               feature.properties?.name ||
                               feature.properties?.PROV_NAMT ||
                               feature.properties?.PROVINCE;
          if (!provinceName) return false;
          return regionProvinceSet.has(normalizeAreaKey(provinceName, "province"));
        });

        if (filteredFeatures.length > 0) {
          const filteredGeoJSON = {
            type: "FeatureCollection",
            features: filteredFeatures,
          };
          await loadAndDisplayKML(filteredGeoJSON, "province");

          updateStatus(
            `โหลดแผนที่${selectedHealthRegion}สำเร็จ: ${filteredFeatures.length} จังหวัด`,
            "success"
          );

          // Fit map to the loaded region's provinces
          setTimeout(() => {
            fitToData();
          }, 500);
        }
      } catch (error) {
        console.error("Error loading provinces in region:", error);
        if (mounted) {
          updateStatus(`ข้อผิดพลาดในการโหลดแผนที่: ${error}`, "error");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadProvincesInRegion();

    return () => {
      mounted = false;
    };
  }, [selectedHealthRegion, availableProvincesInRegion, selectedProvince, selectedDistrict, selectedSubdistrict]);

  useEffect(() => {
    // อนุญาตให้ fetch ข้อมูลได้เมื่อเลือกอย่างน้อย 1 ตัวเลือก (ปี, เดือน, หรือสัปดาห์)
    if (!selectedYear && !selectedMonth && !selectedWeek) {
      setWeeklyDetails(null);
      setDisplayData([]);
      setMonthlyReportData({ total: 0, items: [] });
      setHiciData({
        hi: 0,
        ci: 0,
        housesSurveyed: 0,
        housesWithLarvae: 0,
        containersSurveyed: 0,
        containersWithLarvae: 0,
      });
      return;
    }

    // ถ้าไม่ได้เลือกปีเลย (ไม่ใช่ "0" และไม่ใช่ค่าปีอื่น) ให้ return
    if (!selectedYear) {
      setWeeklyDetails(null);
      setDisplayData([]);
      setMonthlyReportData({ total: 0, items: [] });
      setHiciData({
        hi: 0,
        ci: 0,
        housesSurveyed: 0,
        housesWithLarvae: 0,
        containersSurveyed: 0,
        containersWithLarvae: 0,
      });
      return;
    }

    const controller = new AbortController();

    const fetchWeeklyDetails = async () => {
      try {
        setIsDataLoading(true);
        // ดึงข้อมูลทั้งหมด (ส่ง 0 เพื่อไม่ให้ server filter)
        const { data } = await reportsAnalyticsService.getWeeklyMosquitoDetails({
          year: "0",
          month: "0",
          week: "0",
          signal: controller.signal,
        });

        // กรองข้อมูล client-side เหมือน ReportMosquitoCompDataComp.jsx
        const reports = getReportsFromWeeklyDetails(data);
        const filteredReports = reports.filter((report) => {
          const reportDate = new Date(report.created_at);

          // กรองตามปี (ปีงบประมาณ หรือ รายปี)
          if (selectedYear && selectedYear !== "0") {
            const yearNum = parseInt(selectedYear);
            const matchesYear = selectedYearType === "fiscal"
              ? isInFiscalYear(reportDate, yearNum)
              : isInCalendarYear(reportDate, yearNum);

            if (!matchesYear) return false;
          }

          // กรองตามเดือน
          if (selectedMonth && selectedMonth !== "0") {
            if (!isInMonth(reportDate, selectedMonth)) return false;
          }

          // กรองตามสัปดาห์ (ต้องมีการเลือกเดือนก่อน)
          if (selectedWeek && selectedWeek !== "0" && selectedMonth && selectedMonth !== "0") {
            if (!isInWeekOfMonth(reportDate, selectedWeek)) return false;
          }

          return true;
        });

        // สร้าง data object ใหม่จาก reports ที่กรองแล้ว
        const filteredData = {
          ...data,
          mosquito_larvae_reports: filteredReports
        };

        setWeeklyDetails(filteredData);
        setMonthlyReportData(normalizeMonthlyReportDataFromAnalytics(filteredData));
        // คำนวณ HI/CI จากข้อมูลที่กรองแล้ว
        setHiciData(calculateHICI(filteredData));
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchWeeklyDetails();

    return () => controller.abort();
  }, [selectedYear, selectedMonth, selectedWeek, selectedYearType]);

  useEffect(() => {
    setDisplayData(buildDisplayDataFromReports());
  }, [buildDisplayDataFromReports]);

  useEffect(() => {
    const controlPanel = controlPanelRef.current;
    const chartCard = chartCardRef.current;

    const disableMapZoom = () => {
      if (map) {
        map.scrollWheelZoom.disable();
      }
    };

    const enableMapZoom = () => {
      if (map) {
        map.scrollWheelZoom.enable();
      }
    };

    if (controlPanel) {
      controlPanel.addEventListener("mouseenter", disableMapZoom);
      controlPanel.addEventListener("mouseleave", enableMapZoom);
    }
    if (chartCard) {
      chartCard.addEventListener("mouseenter", disableMapZoom);
      chartCard.addEventListener("mouseleave", enableMapZoom);
    }

    return () => {
      if (controlPanel) {
        controlPanel.removeEventListener("mouseenter", disableMapZoom);
        controlPanel.removeEventListener("mouseleave", enableMapZoom);
      }
      if (chartCard) {
        chartCard.removeEventListener("mouseenter", disableMapZoom);
        chartCard.removeEventListener("mouseleave", enableMapZoom);
      }
    };
  }, [map]);

  // Calculate HI by area and pass to useMapManager
  useEffect(() => {
    if (!weeklyDetails) {
      return;
    }

    // Determine current level
    const isLevelSubdistrict = selectedDistrict && availableSubdistricts.length > 0;
    const isLevelDistrict = !isLevelSubdistrict && selectedProvince && availableDistricts.length > 0;
    const isLevelProvince = !isLevelSubdistrict && !isLevelDistrict && selectedHealthRegion && availableProvincesInRegion.length > 0;
    const isLevelAll = !isLevelSubdistrict && !isLevelDistrict && !isLevelProvince;

    const level = isLevelSubdistrict
      ? "subdistrict"
      : isLevelDistrict
      ? "district"
      : "province";

    let getAreaName = getReportProvinceName;

    if (isLevelSubdistrict) {
      getAreaName = getReportSubdistrictName;
    } else if (isLevelDistrict) {
      getAreaName = getReportDistrictName;
    } else if (isLevelProvince || isLevelAll) {
      getAreaName = getReportProvinceName;
    }

    // Calculate HI by area - ส่ง availableAreas ด้วยเพื่อเติมค่า HI = 0 สำหรับที่ไม่มีข้อมูล
    let availableAreas = [];
    if (isLevelSubdistrict) {
      availableAreas = availableSubdistricts;
    } else if (isLevelDistrict) {
      availableAreas = availableDistricts;
    } else if (isLevelProvince) {
      // เลือก health region - ใช้จังหวัดในเขตนั้นๆ
      availableAreas = availableProvincesInRegion;
    } else if (isLevelAll) {
      // ไม่ได้เลือก health region - ใช้ทุกจังหวัด
      availableAreas = availableProvinces;
    }

    const hiData = calculateHIByArea(weeklyDetails, getAreaName, availableAreas, level);
    console.log("[HI Data] Level:", level, "| Areas with HI:", Object.keys(hiData).filter(k => hiData[k] > 0), "| hiData:", hiData);
    setHiByArea(hiData); // Update local state for Donut Chart and Area List
    setHiByAreaData(hiData); // Update useMapManager state for map colors (triggers updateLayerColors via useEffect)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    weeklyDetails,
    selectedProvince,
    selectedDistrict,
    selectedSubdistrict,
    selectedHealthRegion,
    availableSubdistricts,
    availableDistricts,
    availableProvincesInRegion,
    availableProvinces,
  ]);

  const shouldPromptForPeriod =
    !selectedYear && !selectedMonth && !selectedWeek;

  return (
    <div className={styles.gisComp}>
      <div className={styles.kmlMapViewer}>
        <div
          ref={controlPanelRef}
          className={`${styles.controlPanel} ${
            isCollapsed ? styles.collapsed : ""
          }`}
        >
          <div className={styles.controlPanelContent}>
            <h3>
              <span style={{ fontSize: "100%" }}>
                เครื่องมือแสดงชั้นข้อมูล{" "}
              </span>
              <button className={styles.toggleBtn} onClick={toggleControlPanel}>
                {isCollapsed ? "▼" : "▲"}
              </button>
            </h3>
            {!isCollapsed && (
              <div className={styles.section}>
                <div className={styles.dateSelector}>
                  <div className={styles.formGroup}>
                    <CustomSelect
                      id="yearTypeSelect"
                      label="ประเภทปี"
                      options={yearTypeOptions}
                      value={selectedYearType}
                      onChange={(e) => setSelectedYearType(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <CustomSelect
                      id="yearSelect"
                      label="ปี"
                      options={yearOptions}
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      placeholder="-- เลือกปี --"
                    />
                  </div>
                </div>
                <div className={styles.dateSelector}>
                  <div className={styles.formGroup}>
                    <CustomSelect
                      id="monthSelect"
                      label="เดือน"
                      options={monthOptions}
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      placeholder="-- เลือกเดือน --"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <CustomSelect
                      id="weekSelect"
                      label="สัปดาห์"
                      options={weekOptions}
                      value={selectedWeek}
                      onChange={(e) => setSelectedWeek(e.target.value)}
                      placeholder="-- เลือกสัปดาห์ --"
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <CustomSelect
                    id="healthRegionSelect"
                    label="เขตสุขภาพ"
                    options={healthRegionOptions}
                    value={selectedHealthRegion}
                    onChange={(e) => setSelectedHealthRegion(e.target.value)}
                    placeholder="-- เลือกเขตสุขภาพ --"
                    disabled={isLocked("zone")}
                  />
                </div>
                <div className={styles.formGroup}>
                  <CustomSelect
                    id="provinceSelect"
                    label="จังหวัด"
                    options={provinceOptions}
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    disabled={
                      isLocked("province") ||
                      (selectedHealthRegion &&
                      availableProvincesInRegion.length === 0)
                    }
                    placeholder="-- เลือกจังหวัด --"
                  />
                </div>
                <div className={styles.formGroup}>
                  <CustomSelect
                    id="districtSelect"
                    label="อำเภอ/เขต"
                    options={districtOptions}
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    disabled={isLocked("district") || !selectedProvince || isLoadingDistricts}
                    placeholder={
                      isLoadingDistricts
                        ? "กำลังโหลดข้อมูลอำเภอ..."
                        : "-- เลือกอำเภอ/เขต --"
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <CustomSelect
                    id="subdistrictSelect"
                    label="ตำบล/แขวง"
                    options={subdistrictOptions}
                    value={selectedSubdistrict}
                    onChange={(e) => setSelectedSubdistrict(e.target.value)}
                    disabled={isLocked("subdistrict") || !selectedDistrict || isLoadingSubdistricts}
                    placeholder={
                      isLoadingSubdistricts
                        ? "กำลังโหลดข้อมูลตำบล..."
                        : "-- เลือกตำบล --"
                    }
                  />
                </div>
              </div>
            )}
            {!isCollapsed && (
              <div className={styles.section}>
                <div className={styles.filterButtons}>
                  <button onClick={clearFilter} className={styles.btnSecondary}>
                    <X size={16} style={{ marginRight: "8px" }} />
                    ล้างการค้นหา
                  </button>
                  <button onClick={fitToFiltered} className={styles.btnPrimary}>
                    <Search size={16} style={{ marginRight: "8px" }} />
                    ค้นหาพื้นที่
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div ref={mapContainer} className={styles.mapContainer}></div>

        {/* Right Panel - Report Dashboard */}
        <div className={styles.rightPanel}>
            {/* Single Report Card */}
            <div className={styles.reportCard}>
              <div className={styles.reportHeader}>
                <h3>แผนภาพรายงาน ลูกน้ำยุงลาย</h3>
              </div>
              <div className={styles.reportDivider}></div>

              {/* Spatial Chart Section */}
              <div className={styles.chartSection}>
                <div className={styles.chartTitleRow}>
                  <div className={styles.chartTitle}>แผนภาพเชิงพื้นที่</div>
                  {/* <button className={styles.downloadBtn}>
                    <Download size={16} />
                  </button> */}
                </div>
                <div className={styles.reportDivider}></div>

                {/* Chart Card */}
                <div ref={chartCardRef} className={styles.chartCard}>
                  {isDataLoading ? (
                    <>
                      {/* Skeleton Donut Chart */}
                      <div className={styles.donutChart}>
                        <div className={styles.donutContainer} style={{ position: 'relative' }}>
                          <div className={`${styles.skeleton} ${styles.skeletonDonut}`}></div>
                          <div className={styles.skeletonDonutCenter}></div>
                        </div>
                      </div>

                      {/* Skeleton Province List */}
                      <div className={styles.provinceList}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className={styles.skeletonItem}>
                            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                              <div className={`${styles.skeleton} ${styles.skeletonDot}`}></div>
                              <div className={`${styles.skeleton} ${styles.skeletonText}`}></div>
                            </div>
                            <div className={`${styles.skeleton} ${styles.skeletonValue}`}></div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : displayData.length > 0 ? (
                    <>
                      {/* Donut Chart */}
                      <div className={styles.donutChart}>
                        <div className={styles.donutContainer}>
                          <svg
                            width="150"
                            height="150"
                            viewBox="0 0 42 42"
                            className={styles.donut}
                          >
                            <circle
                              cx="21"
                              cy="21"
                              r="15.91549430918"
                              fill="transparent"
                              stroke="#f1f5f9"
                              strokeWidth="3"
                            ></circle>
                            {(() => {
                              const total = displayData.reduce(
                                (sum, item) => sum + item.value,
                                0
                              );
                              // Skip rendering if total is 0 to avoid NaN
                              if (total === 0) return null;

                              let offset = 25;
                              return displayData.map((item) => {
                                const percentage = (item.value / total) * 100;
                                const strokeDasharray = `${percentage} ${
                                  100 - percentage
                                }`;
                                const color = getHIColorForDisplay(item.name);
                                const currentOffset = offset;
                                offset = (offset - percentage) % 100;

                                return (
                                  <circle
                                    key={item.name}
                                    cx="21"
                                    cy="21"
                                    r="15.91549430918"
                                    fill="transparent"
                                    stroke={color}
                                    strokeWidth="3"
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={currentOffset}
                                    className={styles.donutSegment}
                                  />
                                );
                              });
                            })()}
                          </svg>
                          <div className={styles.donutCenter}>
                            <div className={styles.donutValue}>
                              {displayData.reduce(
                                (sum, item) => sum + item.value,
                                0
                              )}
                            </div>
                            <div className={styles.donutLabel}>รวม</div>
                          </div>
                        </div>
                      </div>

                      {/* Area List */}
                      <div className={styles.provinceList}>
                        {displayData.map((item) => (
                          <div key={item.name} className={styles.provinceItem}>
                            <div className={styles.provinceName}>
                              <div
                                className={styles.colorDot}
                                style={{
                                  backgroundColor: getHIColorForDisplay(item.name),
                                }}
                              ></div>
                              {item.name}
                            </div>
                            <div className={styles.provinceValue}>
                              {item.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className={styles.emptyMessage}>
                      {shouldPromptForPeriod
                        ? "กรุณาเลือกช่วงเวลาเพื่อแสดงข้อมูล"
                        : "ไม่พบข้อมูลรายงาน"}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.reportDivider}></div>

              {/* Monthly Report Section */}
              <div className={styles.monthlyReportSection}>
                <div className={styles.sectionTitle}>
                  กราฟสรุปผลรายงานรายเดือน
                </div>

                <div className={styles.totalSection}>
                  {isDataLoading ? (
                    <>
                      <div className={`${styles.skeleton} ${styles.skeletonTotal}`}></div>
                      <div className={`${styles.skeleton} ${styles.skeletonLabel}`}></div>
                    </>
                  ) : (
                    <>
                      <div className={styles.totalValue}>
                        {mosquitoReportData.total}
                      </div>
                      <div className={styles.totalLabel}>รวมทุกรายการ</div>
                    </>
                  )}
                </div>

                {/* HI/CI Section */}
                <div style={{
                  marginTop: "16px",
                  padding: "12px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  border: "1px solid #e9ecef"
                }}>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginBottom: "12px"
                  }}>
                    {/* HI Box */}
                    <div style={{
                      backgroundColor: "#fff",
                      padding: "12px",
                      borderRadius: "8px",
                      textAlign: "center",
                      border: "1px solid #dee2e6"
                    }}>
                      <div style={{
                        fontSize: "24px",
                        fontWeight: "bold",
                        color: hiciData.hi > 10 ? "#dc3545" : hiciData.hi >= 1 ? "#ffc107" : "#28a745"
                      }}>
                        {hiciData.hi.toFixed(2)}%
                      </div>
                      <div style={{ fontSize: "12px", color: "#6c757d", fontWeight: "500" }}>
                        HI (House Index)
                      </div>
                      <div style={{ fontSize: "10px", color: "#adb5bd", marginTop: "4px" }}>
                        พบลูกน้ำ {hiciData.housesWithLarvae} หลัง / สำรวจ {hiciData.housesSurveyed} หลัง
                      </div>
                    </div>

                    {/* CI Box */}
                    <div style={{
                      backgroundColor: "#fff",
                      padding: "12px",
                      borderRadius: "8px",
                      textAlign: "center",
                      border: "1px solid #dee2e6"
                    }}>
                      <div style={{
                        fontSize: "24px",
                        fontWeight: "bold",
                        color: hiciData.ci > 10 ? "#dc3545" : hiciData.ci > 0 ? "#ffc107" : "#28a745"
                      }}>
                        {hiciData.ci.toFixed(2)}%
                      </div>
                      <div style={{ fontSize: "12px", color: "#6c757d", fontWeight: "500" }}>
                        CI (Container Index)
                      </div>
                      <div style={{ fontSize: "10px", color: "#adb5bd", marginTop: "4px" }}>
                        พบลูกน้ำ {hiciData.containersWithLarvae} ภาชนะ / สำรวจ {hiciData.containersSurveyed} ภาชนะ
                      </div>
                    </div>
                  </div>

                  <div style={{
                    fontSize: "11px",
                    color: "#495057",
                    borderTop: "1px solid #e9ecef",
                    paddingTop: "10px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px"
                  }}>
                    <div>
                      <div style={{ fontWeight: "600", marginBottom: "4px", color: "#333" }}>HI:</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <span><span style={{ color: "#28a745" }}>●</span> {"<"}1% ปลอดภัย</span>
                        <span><span style={{ color: "#ffc107" }}>●</span> 1-10% เฝ้าระวัง</span>
                        <span><span style={{ color: "#dc3545" }}>●</span> {">"}10% เสี่ยงสูง</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: "600", marginBottom: "4px", color: "#333" }}>CI:</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <span><span style={{ color: "#28a745" }}>●</span> 0% ปลอดภัย</span>
                        <span><span style={{ color: "#ffc107" }}>●</span> {">"}0% มีแหล่งเพาะพันธุ์</span>
                        <span><span style={{ color: "#dc3545" }}>●</span> {">"}10% เยอะ</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.reportItems}>
                  {mosquitoReportData.items.map((item, index) => (
                    <div key={index} className={styles.reportItem}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GisMosquitoComp;
