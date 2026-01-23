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
import { getCurrentFiscalYear } from "@utils/fiscalYearHelper";
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

const normalizeAreaFileName = (value, level) =>
  normalizeAreaKey(value, level);

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

  return normalized;
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

// คำนวณค่า HI (House Index) และ CI (Container Index) พร้อม S² (Variance)
// HI = (จำนวนบ้านที่สำรวจพบลูกน้ำยุงลาย / จำนวนบ้านที่สำรวจทั้งหมด) × 100
// CI = (จำนวนภาชนะขังน้ำที่พบลูกน้ำยุงลาย / จำนวนภาชนะขังน้ำที่สำรวจทั้งหมด) × 100
// S² = Variance (ความแปรปรวน)
//
// การแปลผล:
// HI > 10%: มีความเสี่ยงสูงที่จะเกิดการแพร่ระบาด
// HI < 1%: มีความเสี่ยงต่ำ
// CI = 0: ถือว่าปลอดภัย, CI สูง = มีแหล่งเพาะพันธุ์เยอะ
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
      containersSurveyed += total;
      containersWithLarvae += found;
      houseContainersSurveyed += total;
      houseContainersWithLarvae += found;
      if (found > 0) {
        houseHasLarvae = true;
      }
    });

    // นับภาชนะนอกบ้าน
    outsideContainers.forEach((container) => {
      const total = Number(container?.total) || 0;
      const found = Number(container?.found) || 0;
      containersSurveyed += total;
      containersWithLarvae += found;
      houseContainersSurveyed += total;
      houseContainersWithLarvae += found;
      if (found > 0) {
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
  const ci = containersSurveyed > 0 ? (containersWithLarvae / containersSurveyed) * 100 : 0;

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

  // ฟังก์ชัน hash string - ใช้ djb2 algorithm
  const hashString = (str) => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) + hash) ^ char;
    }
    return Math.abs(hash);
  };

  const mosquitoReportData = monthlyReportData;

  const mapContainer = useRef(null);

  // สร้างสีจาก HSL โดยใช้ hash โดยตรง
  const generateColor = (hash) => {
    const hue = hash % 360;
    const saturation = 55 + ((hash >> 8) % 30);
    const lightness = 40 + ((hash >> 16) % 20);
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

  const monthOptions = [
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
          filePath = `/split-provinces/${name}.kml`;
        } else if (level === "amphoe") {
          const englishProvinceName = getEnglishProvinceName(selectedProvince);
          const amphoeFileName = normalizeAreaFileName(name, "district");
          filePath = `/split-amphoe/${englishProvinceName}/${amphoeFileName}.kml`;
        } else if (level === "tambon") {
          const englishProvinceName = getEnglishProvinceName(selectedProvince);
          const districtFileName = normalizeAreaFileName(
            selectedDistrict,
            "district"
          );
          const tambonFileName = normalizeAreaFileName(name, "subdistrict");
          filePath = `/split-tambon/${englishProvinceName}/${districtFileName}/${tambonFileName}.kml`;
        } else {
          filePath = `/split-provinces/${name}.kml`;
        }

        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(
            `ไม่พบไฟล์: ${filePath} (Status: ${response.status})`
          );
        }

        const kmlText = await response.text();
        const parser = new DOMParser();
        const kmlDoc = parser.parseFromString(kmlText, "text/xml");

        const parserError = kmlDoc.querySelector("parsererror");
        if (parserError) {
          throw new Error(`XML parsing error: ${parserError.textContent}`);
        }

        const toGeoJSON = await import("@mapbox/togeojson");
        const geoJsonData = toGeoJSON.kml(kmlDoc);

        if (!geoJsonData || !geoJsonData.features) {
          throw new Error("ไม่พบ features ในไฟล์ KML");
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
              const filePath = `/split-amphoe/${englishProvinceName}/${amphoeFileName}.kml`;
              const response = await fetch(filePath);
              if (!response.ok) {
                console.warn(`ไม่พบไฟล์: ${filePath}`);
                return null;
              }

              const kmlText = await response.text();
              const parser = new DOMParser();
              const kmlDoc = parser.parseFromString(kmlText, "text/xml");
              const toGeoJSON = await import("@mapbox/togeojson");
              const geoJsonData = toGeoJSON.kml(kmlDoc);

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
              const filePath = `/split-tambon/${englishProvinceName}/${districtFileName}/${tambonFileName}.kml`;
              const response = await fetch(filePath);
              if (!response.ok) return null;

              const kmlText = await response.text();
              const parser = new DOMParser();
              const kmlDoc = parser.parseFromString(kmlText, "text/xml");

              const tj = await import("@mapbox/togeojson");
              const geoJsonData = tj.kml(kmlDoc);

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
        const filePath = `/split-tambon/${englishProvinceName}/${districtFileName}/${subdistrictFileName}.kml`;
        const response = await fetch(filePath);

        if (response.ok) {
          const kmlText = await response.text();
          const parser = new DOMParser();
          const kmlDoc = parser.parseFromString(kmlText, "text/xml");

          const tj = await import("@mapbox/togeojson");
          const geoJsonData = tj.kml(kmlDoc);

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
    setSelectedYearType("fiscal");
    setSelectedYear("");
    setSelectedMonth("");
    setSelectedWeek("");
    setSelectedHealthRegion("");
    setSelectedProvince("");
    setSelectedDistrict("");
    setSelectedSubdistrict("");
    setAvailableProvincesInRegion([]);
    setAvailableDistricts([]);
    setAvailableSubdistricts([]);
    setDistrictCodeByName({});

    clearAllLayers();

    if (map) {
      map.setView([13.7563, 100.5018], 6);
    }

    updateStatus("ค้นหาพื้นที่เพื่อเริ่มต้น", "info");
  }, [clearAllLayers, updateStatus, map]);

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
          setSelectedProvince("");
          setSelectedDistrict("");
          setSelectedSubdistrict("");
          setAvailableDistricts([]);
          setAvailableSubdistricts([]);
          setDistrictCodeByName({});
        }

        clearAllLayers();

        const loadPromises = provincesInRegion.map(async (provinceName) => {
          try {
            const filePath = `/split-provinces/${provinceName}.kml`;
            const response = await fetch(filePath);
            if (!response.ok) {
              console.warn(`ไม่พบไฟล์: ${filePath}`);
              return null;
            }

            const kmlText = await response.text();
            const parser = new DOMParser();
            const kmlDoc = parser.parseFromString(kmlText, "text/xml");
            const toGeoJSON = await import("@mapbox/togeojson");
            const geoJsonData = toGeoJSON.kml(kmlDoc);

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
    if (permissionLoading || !scope || !permissionUser) return;
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

    // Set province if locked
    if (isLocked('province') && permissionUser?.province_name) {
      setSelectedProvince(permissionUser.province_name);
    }

    // Set year to current fiscal year
    if (!selectedYear) {
      setSelectedYear(String(getCurrentFiscalYear()));
    }
  }, [permissionLoading, scope, getInitialFilters, permissionUser, isLocked, provinceCodeByName, selectedYear]);

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
    const BATCH_SIZE = 20; // Load 20 provinces at a time

    const loadAllProvinces = async () => {
      try {
        setIsLoading(true);
        clearAllLayers();

        updateStatus(`กำลังโหลดแผนที่ประเทศไทย (${availableProvinces.length} จังหวัด)...`, "info");

        const allFeatures = [];
        let loadedCount = 0;

        // Load provinces in batches
        for (let i = 0; i < availableProvinces.length; i += BATCH_SIZE) {
          if (!mounted) break;

          const batch = availableProvinces.slice(i, i + BATCH_SIZE);

          const loadPromises = batch.map(async (provinceName) => {
            try {
              const filePath = `/split-provinces/${provinceName}.kml`;
              const response = await fetch(filePath);
              if (!response.ok) {
                console.warn(`ไม่พบไฟล์: ${filePath}`);
                return null;
              }

              const kmlText = await response.text();
              const parser = new DOMParser();
              const kmlDoc = parser.parseFromString(kmlText, "text/xml");
              const toGeoJSON = await import("@mapbox/togeojson");
              const geoJsonData = toGeoJSON.kml(kmlDoc);

              if (geoJsonData && geoJsonData.features) {
                return geoJsonData.features;
              }
              return null;
            } catch (error) {
              console.error(`Error loading ${provinceName}:`, error);
              return null;
            }
          });

          const results = await Promise.all(loadPromises);
          const batchFeatures = results.filter((f) => f !== null).flat();

          allFeatures.push(...batchFeatures);
          loadedCount += batch.length;

          // Update progress
          updateStatus(
            `กำลังโหลดแผนที่: ${loadedCount}/${availableProvinces.length} จังหวัด...`,
            "info"
          );

          // Render current batch progressively (optional - shows map faster)
          if (batchFeatures.length > 0 && allFeatures.length > 0) {
            const combinedGeoJSON = {
              type: "FeatureCollection",
              features: [...allFeatures],
            };
            await loadAndDisplayKML(combinedGeoJSON, "province");
          }
        }

        if (mounted && allFeatures.length > 0) {
          updateStatus(
            `โหลดแผนที่ประเทศไทยสำเร็จ: ${availableProvinces.length} จังหวัด, ${allFeatures.length} features`,
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
        const { data } = await reportsAnalyticsService.getWeeklyMosquitoDetails({
          year: selectedYear || "0",
          month: selectedMonth || "0",
          week: selectedWeek || "0",
          signal: controller.signal,
        });
        setWeeklyDetails(data);
        setMonthlyReportData(normalizeMonthlyReportDataFromAnalytics(data));
        // คำนวณ HI/CI จากข้อมูลที่ได้
        setHiciData(calculateHICI(data));
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }
      }
    };

    fetchWeeklyDetails();

    return () => controller.abort();
  }, [selectedYear, selectedMonth, selectedWeek]);

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
                  <button className={styles.downloadBtn}>
                    <Download size={16} />
                  </button>
                </div>
                <div className={styles.reportDivider}></div>

                {/* Chart Card */}
                <div ref={chartCardRef} className={styles.chartCard}>
                  {displayData.length > 0 ? (
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
                              let offset = 25;
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

                      {/* Area List */}
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
                  <div className={styles.totalValue}>
                    {mosquitoReportData.total}
                  </div>
                  <div className={styles.totalLabel}>รวมทุกรายการ</div>
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
                        บ้านพบลูกน้ำ {hiciData.housesWithLarvae} / สำรวจ {hiciData.housesSurveyed}
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
                        ภาชนะพบลูกน้ำ {hiciData.containersWithLarvae} / สำรวจ {hiciData.containersSurveyed}
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
