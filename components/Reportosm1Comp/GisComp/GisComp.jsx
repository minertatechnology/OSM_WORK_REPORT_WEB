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
} from "@utils/fiscalYearHelper";
import styles from "./GisComp.module.css";

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

const normalizeMonthlyReportDataFromAnalytics = (data) => {
  if (!data) {
    return { total: 0, items: [] };
  }

  // กรณีที่เรา set total เองจาก filteredReports.length
  if (typeof data?.total === "number" && Array.isArray(data?.report_osm1_reports)) {
    return { total: data.total, items: [] };
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

  // กรณี API ส่ง total_reports มาตรงๆ (เหมือน GisMosquitoComp)
  if (typeof data?.total_reports === "number") {
    return { total: data.total_reports, items: [] };
  }

  // กรณี API ส่งเป็น array ของ reports - นับจำนวน
  if (Array.isArray(data?.reports)) {
    return { total: data.reports.length, items: [] };
  }

  // กรณี API ส่งเป็น array โดยตรง
  if (Array.isArray(data)) {
    return { total: data.length, items: [] };
  }

  return { total: 0, items: [] };
};

const GisComp = () => {
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
  const provinceInitializedRef = useRef(false);
  const districtInitializedRef = useRef(false);
  const subdistrictInitializedRef = useRef(false);
  const isInitializingFromPermissionRef = useRef(false);

  // States for Health Regions
  const [selectedHealthRegion, setSelectedHealthRegion] = useState("");
  const [availableProvincesInRegion, setAvailableProvincesInRegion] = useState(
    []
  );

  // States for year and month selection
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
  const [isDataLoading, setIsDataLoading] = useState(false);

  const mapContainer = useRef(null);

  // ฟังก์ชัน hash string - ใช้ djb2 algorithm (เหมือนกับใน useMapManager)
  function hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) + hash) ^ char;
    }
    return Math.abs(hash);
  }

  // สร้างสีจาก HSL โดยใช้ hash โดยตรง (เหมือนกับใน useMapManager)
  const generateColor = (hash) => {
    const hue = hash % 360;
    const saturation = 55 + ((hash >> 8) % 30); // 55-85%
    const lightness = 40 + ((hash >> 16) % 20); // 40-60%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // ฟังก์ชันหาสีจากชื่อพื้นที่
  const getProvinceColor = (name) => {
    const hash = hashString(name);
    return generateColor(hash);
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
    setColorsByAreaData,
  } = useMapManager();

  const {
    getHealthRegionsList,
    getProvincesInRegion /*, loadHealthRegionData */,
  } = useHealthRegions();

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

  // Convert arrays to options format for CustomSelect
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
    const reports = weeklyDetails?.report_osm1_reports;
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
      let displayName = null;
      for (const [areaKey, areaName] of areaKeyByName) {
        if (key === areaKey) {
          displayName = areaName;
          break;
        }
      }
      // ถ้าไม่ match กับ area ไหนเลย ให้ข้าม (ไม่นับ)
      if (!displayName) {
        return;
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

  useEffect(() => {
    // เมื่อเลือกจังหวัด อำเภอ หรือ ตำบล และข้อมูลโหลดแล้ว ให้ซูมอัตโนมัติ
    // ลบ auto-zoom เพื่อป้องกันซูมซ้ำหรือ race condition
    // ซูมจะถูกเรียกในแต่ละ handler หลังโหลดข้อมูลเท่านั้น
  }, []);

  // Methods
  const updateStatus = useCallback((message, type = "info") => {
    // Status update logged for debugging
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

  // KML Map Viewer handlers
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

          // ล้าง layers เดิม
          clearAllLayers();

          // โหลด GeoJSON ของทุกอำเภอในจังหวัด
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
            // รวม features ทั้งหมด
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
          // ล้าง layers เดิม
          clearAllLayers();

          // โหลด KML ของทุกตำบลในอำเภอ
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
            // รวม features ทั้งหมด และเพิ่มชื่อตำบลใน properties
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

        // โหลด GeoJSON ของตำบลที่เลือก
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

          // เพิ่มชื่อตำบลใน properties เพื่อให้สีถูกต้อง
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
      // ถ้ายกเลิกการเลือกตำบล ให้โหลดตำบลทั้งหมดในอำเภอใหม่
      // trigger onDistrictChange
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
    // ถ้า zone ถูก lock ให้เก็บ availableProvincesInRegion ไว้ เพื่อให้ dropdown จังหวัดใช้งานได้
    if (!isLocked('zone')) {
      setAvailableProvincesInRegion([]);
    }
    if (!isLocked('province')) {
      setAvailableDistricts([]);
    }
    if (!isLocked('district')) {
      setAvailableSubdistricts([]);
    }

    setDistrictCodeByName({});

    // ล้าง layers บนแผนที่
    clearAllLayers();

    // ซูมกลับไปที่ตำแหน่งเริ่มต้น (ประเทศไทย)
    if (map) {
      map.setView([13.7563, 100.5018], 6); // ตำแหน่งกลางประเทศไทย, zoom level 6
    }

    updateStatus("ค้นหาพื้นที่เพื่อเริ่มต้น", "info");
  }, [clearAllLayers, updateStatus, map, isLocked, getInitialFilters]);

  // Health Region handlers
  const onHealthRegionSelection = useCallback(async () => {
    if (selectedHealthRegion) {
      try {
        setIsLoading(true);
        updateStatus(`กำลังโหลดข้อมูล ${selectedHealthRegion}...`, "info");

        const provincesInRegion = getProvincesInRegion(selectedHealthRegion);
        setAvailableProvincesInRegion(provincesInRegion);

        // Don't reset selections if initializing from permission
        const isInitializing = isInitializingFromPermissionRef.current;
        if (!isInitializing) {
          // Clear other selections
          setSelectedProvince("");
          setSelectedDistrict("");
          setSelectedSubdistrict("");
          setAvailableDistricts([]);
          setAvailableSubdistricts([]);
          setDistrictCodeByName({});
        }

        clearAllLayers();

        // โหลดข้อมูล GeoJSON ของทุกจังหวัดในเขตสุขภาพ
        const loadPromises = provincesInRegion.map(async (provinceName) => {
          try {
            const filePath = `/geojson-provinces/${provinceName}.json`;
            const response = await fetch(filePath);
            if (!response.ok) {
              console.warn(`ไม่พบไฟล์: ${filePath}`);
              return null;
            }

            const geoJsonData = await response.json();

            if (geoJsonData && geoJsonData.features) {
              return { provinceName, geoJsonData };
            }
            return null;
          } catch (error) {
            console.error(`Error loading ${provinceName}:`, error);
            return null;
          }
        });

        const results = await Promise.all(loadPromises);
        const validResults = results.filter((result) => result !== null);

        if (validResults.length > 0) {
          // รวม features ทั้งหมด
          const allFeatures = validResults.flatMap(
            (result) => result.geoJsonData.features
          );
          const combinedGeoJSON = {
            type: "FeatureCollection",
            features: allFeatures,
          };

          const result = await loadAndDisplayKML(
            combinedGeoJSON,
            "healthRegion"
          );

          if (result) {
            updateStatus(
              `โหลด ${selectedHealthRegion} สำเร็จ: ${validResults.length} จังหวัด, ${result.featureCount} features (${result.loadTime}s)`,
              "success"
            );
          }
        } else {
          updateStatus(`ไม่พบข้อมูลสำหรับ ${selectedHealthRegion}`, "warning");
        }

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
      } finally {
        setIsLoading(false);
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
    loadAndDisplayKML,
  ]);

  // Initialize map only once
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

        // Load available provinces
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

    const initialFilters = getInitialFilters();

    // ตรวจสอบว่า scope มีข้อมูลที่จำเป็นสำหรับ locked fields หรือยัง
    // ถ้ายังไม่มี ให้รอรอบถัดไป (อย่า set permissionInitializedRef.current = true)
    if (isLocked('zone') && !initialFilters.zone) return;
    if (isLocked('province') && !initialFilters.province_name_th && !permissionUser?.province_name && !permissionUser?.province_name_th) return;

    const needsDistrictInit = isLocked('district');
    const needsSubdistrictInit = isLocked('subdistrict');

    // Set flag to prevent reset during initialization
    if (needsDistrictInit || needsSubdistrictInit) {
      isInitializingFromPermissionRef.current = true;
    }

    permissionInitializedRef.current = true;

    // Set health region (zone) if locked
    if (isLocked('zone') && initialFilters.zone) {
      const zoneNumber = parseInt(String(initialFilters.zone).replace(/\D/g, ''));
      if (zoneNumber) {
        setSelectedHealthRegion(`เขตสุขภาพที่ ${zoneNumber}`);
      }
    }

    // Set year to current fiscal year
    if (!selectedYear) {
      setSelectedYear(String(getCurrentFiscalYear()));
    }
  }, [permissionLoading, scope, getInitialFilters, isLocked, provinceCodeByName, selectedYear, permissionUser]);

  // Province initialization - wait for provinces in region to load then set from permission
  useEffect(() => {
    if (permissionLoading || !permissionUser) return;
    if (provinceInitializedRef.current) return;
    if (!isLocked('province')) return;
    // ต้องรอให้ availableProvincesInRegion ถูกโหลดก่อน (กรณีที่ zone ถูก lock)
    if (isLocked('zone') && availableProvincesInRegion.length === 0) return;
    // หรือรอให้ availableProvinces ถูกโหลด (กรณีที่ zone ไม่ถูก lock)
    if (!isLocked('zone') && availableProvinces.length === 0) return;

    const provinceName = permissionUser?.province_name ||
                         permissionUser?.province_name_th ||
                         getInitialFilters().province_name_th;
    if (provinceName) {
      // หา province ในรายการที่มี
      const provinceList = isLocked('zone') ? availableProvincesInRegion : availableProvinces;
      const matchedProvince = provinceList.find(p => {
        const normalizedAvailable = p.replace(/^จังหวัด/, '').trim();
        const normalizedTarget = provinceName.replace(/^จังหวัด/, '').trim();
        return normalizedAvailable === normalizedTarget || p === provinceName;
      });

      if (matchedProvince) {
        provinceInitializedRef.current = true;
        setSelectedProvince(matchedProvince);
      } else if (provinceList.includes(provinceName)) {
        // ถ้าชื่อตรงกันทุกประการ
        provinceInitializedRef.current = true;
        setSelectedProvince(provinceName);
      }
    }
  }, [permissionLoading, permissionUser, availableProvincesInRegion, availableProvinces, isLocked, getInitialFilters]);

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

  // Handle province change for map viewer
  useEffect(() => {
    if (selectedProvince) {
      onProvinceChange();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvince]);

  // Handle district change for map viewer
  useEffect(() => {
    if (selectedDistrict) {
      onDistrictChange();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrict]);

  // Handle subdistrict change for map viewer
  useEffect(() => {
    if (selectedSubdistrict) {
      onSubdistrictChange();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubdistrict]);

  // Handle health region change
  useEffect(() => {
    onHealthRegionSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableProvinces, selectedHealthRegion, selectedProvince, selectedDistrict, selectedSubdistrict]);

  // Log filter selections for debugging
  // Fetch weekly analytics details for the selected period
  useEffect(() => {
    // อนุญาตให้ fetch ข้อมูลได้เมื่อเลือกอย่างน้อย 1 ตัวเลือก (ปี, เดือน, หรือสัปดาห์)
    if (!selectedYear && !selectedMonth && !selectedWeek) {
      setWeeklyDetails(null);
      setDisplayData([]);
      setMonthlyReportData({ total: 0, items: [] });
      return;
    }

    // ถ้าไม่ได้เลือกปีเลย (ไม่ใช่ "0" และไม่ใช่ค่าปีอื่น) ให้ return
    if (!selectedYear) {
      setWeeklyDetails(null);
      setDisplayData([]);
      setMonthlyReportData({ total: 0, items: [] });
      return;
    }

    const controller = new AbortController();

    const fetchWeeklyDetails = async () => {
      try {
        setIsDataLoading(true);
        // ดึงข้อมูลทั้งหมด (ส่ง 0 เพื่อไม่ให้ server filter)
        const { data } = await reportsAnalyticsService.getWeeklyOsm1Details({
          year: "0",
          month: "0",
          week: "0",
          signal: controller.signal,
        });

        // ดึง reports จาก response
        const reports = data?.report_osm1_reports || [];

        // กรองข้อมูล client-side เหมือน GisMosquitoComp
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
            const weekOfMonth = Math.ceil(new Date(reportDate).getDate() / 7);
            if (weekOfMonth !== parseInt(selectedWeek)) return false;
          }

          return true;
        });

        // สร้าง data object ใหม่จาก reports ที่กรองแล้ว และอัพเดท total ให้ตรงกับจำนวนที่กรอง
        const filteredData = {
          ...data,
          report_osm1_reports: filteredReports,
          total: filteredReports.length  // อัพเดท total ให้ตรงกับจำนวน reports ที่กรองแล้ว
        };

        setWeeklyDetails(filteredData);
        setMonthlyReportData(normalizeMonthlyReportDataFromAnalytics(filteredData));
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

  // Calculate CI by area for OSM reports and pass to useMapManager
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

    // Get available areas
    let availableAreas = [];
    if (isLevelSubdistrict) {
      availableAreas = availableSubdistricts;
    } else if (isLevelDistrict) {
      availableAreas = availableDistricts;
    } else if (isLevelProvince || isLevelAll) {
      availableAreas = availableProvinces;
    }

    // นับจำนวน reports ตาม area ก่อน
    const reports = weeklyDetails?.report_osm1_reports || [];
    const getAreaName = isLevelSubdistrict
      ? getReportSubdistrictName
      : isLevelDistrict
      ? getReportDistrictName
      : getReportProvinceName;

    const counts = new Map();
    reports.forEach((report) => {
      const name = getAreaName(report);
      const key = level === "province"
        ? normalizeAreaKeyWithThai(name, level)
        : normalizeAreaKey(name, level);
      if (key) {
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    });

    // Calculate color data - สีเทาสำหรับพื้นที่ที่ไม่มีข้อมูล
    const colorsMap = new Map();
    const GRAY_COLOR = "#9CA3AF"; // สีเทา

    if (Array.isArray(availableAreas)) {
      availableAreas.forEach((areaName) => {
        const normalizedAreaName = level === "province"
          ? normalizeAreaKeyWithThai(areaName, level)
          : normalizeAreaKey(areaName, level);

        // ถ้าไม่มีข้อมูล (count = 0) ให้เป็นสีเทา
        const hasData = counts.get(normalizedAreaName) > 0;
        const color = hasData ? getProvinceColor(areaName) : GRAY_COLOR;
        colorsMap.set(normalizedAreaName, color);
      });
    }

    const colorsData = Object.fromEntries(colorsMap);
    setColorsByAreaData(colorsData); // Update useMapManager state for map colors (triggers updateLayerColors via useEffect)
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

  useEffect(() => {
    setDisplayData(buildDisplayDataFromReports());
  }, [buildDisplayDataFromReports]);

  // ป้องกัน wheel event ไม่ให้ซูมแผนที่เมื่อ scroll บน control panel และ chart card
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
              <h3>แผนภาพรายงาน อสม.1</h3>
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
                              let offset = 25; // Start offset
                              return displayData.map((item) => {
                                const percentage = (item.value / total) * 100;
                                const strokeDasharray = `${percentage} ${
                                  100 - percentage
                                }`;
                                const color = getProvinceColor(item.name);
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

                      {/* Area List (Province or Amphoe) */}
                      <div className={styles.provinceList}>
                        {displayData.map((item) => (
                          <div key={item.name} className={styles.provinceItem}>
                            <div className={styles.provinceName}>
                              <div
                                className={styles.colorDot}
                                style={{
                                  backgroundColor: getProvinceColor(item.name),
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
                      {monthlyReportData.total}
                    </div>
                    <div className={styles.totalLabel}>รวมทุกรายการ</div>
                  </>
                )}
              </div>

              <div className={styles.reportItems}>
                {monthlyReportData.items.map((item, index) => (
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

export default GisComp;
