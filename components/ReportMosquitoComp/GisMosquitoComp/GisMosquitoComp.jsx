import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Download } from "lucide-react";
import { useKMLData } from "../../../composables/useKMLData.js";
import { useMapManager } from "../../../composables/useMapManager.js";
import { useHealthRegions } from "../../../composables/useHealthRegions.js";
import { useLoading } from "../../../context/LoadingProvider";
import reportsAnalyticsService from "@services/reportsAnalyticsService";
import CustomSelect from "@services/customSelectService/customSelectService";
import {
  getProvinces,
  getDistricts,
  getSubdistricts,
} from "@services/lookupService";
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

  // States for Health Regions
  const [selectedHealthRegion, setSelectedHealthRegion] = useState("");
  const [availableProvincesInRegion, setAvailableProvincesInRegion] = useState(
    []
  );

  // States for year, month and week selection
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");

  const [weeklyDetails, setWeeklyDetails] = useState(null);
  const [displayData, setDisplayData] = useState([]);
  const [monthlyReportData, setMonthlyReportData] = useState({
    total: 0,
    items: [],
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
  } = useMapManager();

  const { getHealthRegionsList, getProvincesInRegion } = useHealthRegions();

  // Options data for CustomSelect components
  const currentBuddhistYear = new Date().getFullYear() + 543;
  const yearOptions = Array.from({ length: 15 }, (_, index) => {
    const year = currentBuddhistYear - index;
    return { value: String(year), label: String(year) };
  });

  const monthOptions = [
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
    { value: "1", label: "สัปดาห์ที่ 1 (1-7)" },
    { value: "2", label: "สัปดาห์ที่ 2 (8-14)" },
    { value: "3", label: "สัปดาห์ที่ 3 (15-21)" },
    { value: "4", label: "สัปดาห์ที่ 4 (22-28)" },
    { value: "5", label: "สัปดาห์ที่ 5 (29-31)" },
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
    if (!Array.isArray(reports) || reports.length === 0) {
      return [];
    }

    const filteredReports = reports.filter((report) => {
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

    const areaList = isLevelSubdistrict
      ? availableSubdistricts
      : isLevelDistrict
      ? availableDistricts
      : isLevelProvince
      ? availableProvincesInRegion
      : [];

    const getAreaName = isLevelSubdistrict
      ? getReportSubdistrictName
      : isLevelDistrict
      ? getReportDistrictName
      : getReportProvinceName;

    const areaKeyByName = new Map(
      areaList.map((name) => {
        const level = isLevelSubdistrict
          ? "subdistrict"
          : isLevelDistrict
          ? "district"
          : "province";
        const key =
          level === "province"
            ? normalizeAreaKeyWithThai(name, level)
            : normalizeAreaKey(name, level);
        return [key, name];
      })
    );

    const counts = new Map();
    filteredReports.forEach((report) => {
      const name = getAreaName(report);
      const level = isLevelSubdistrict
        ? "subdistrict"
        : isLevelDistrict
        ? "district"
        : "province";
      const key =
        level === "province"
          ? normalizeAreaKeyWithThai(name, level)
          : normalizeAreaKey(name, level);
      if (!key) {
        return;
      }
      const displayName = areaKeyByName.get(key) || name;
      counts.set(displayName, (counts.get(displayName) || 0) + 1);
    });

    const data = areaList.length
      ? areaList.map((name) => ({
          name,
          value: counts.get(name) || 0,
        }))
      : Array.from(counts.entries()).map(([name, value]) => ({
          name,
          value,
        }));

    return data.filter((item) => item.value > 0);
  }, [
    weeklyDetails,
    selectedProvince,
    selectedDistrict,
    selectedSubdistrict,
    selectedHealthRegion,
    availableSubdistricts,
    availableDistricts,
    availableProvincesInRegion,
    normalizeAreaKeyWithThai,
  ]);

  useEffect(() => {}, []);

  const updateStatus = useCallback((message, type = "info") => {
    console.log(`[${type.toUpperCase()}] ${message}`);
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
    setSelectedDistrict("");
    setSelectedSubdistrict("");
    setAvailableDistricts([]);
    setAvailableSubdistricts([]);
    setDistrictCodeByName({});

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
    setSelectedSubdistrict("");
    setAvailableSubdistricts([]);

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
        console.log("selectedHealthRegion type:", typeof selectedHealthRegion);
        console.log("selectedHealthRegion value:", selectedHealthRegion);
        updateStatus(`กำลังโหลดข้อมูล ${selectedHealthRegion}...`, "info");

        const provincesInRegion = getProvincesInRegion(selectedHealthRegion);
        setAvailableProvincesInRegion(provincesInRegion);

        setSelectedProvince("");
        setSelectedDistrict("");
        setSelectedSubdistrict("");
        setAvailableDistricts([]);
        setAvailableSubdistricts([]);
        setDistrictCodeByName({});

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

  useEffect(() => {
    if (!selectedYear || !selectedMonth || !selectedWeek) {
      setWeeklyDetails(null);
      setDisplayData([]);
      setMonthlyReportData({ total: 0, items: [] });
      return;
    }

    const controller = new AbortController();
    const requestUrl = reportsAnalyticsService.buildWeeklyMosquitoDetailsUrl(
      selectedYear,
      selectedMonth,
      selectedWeek
    );

    const fetchWeeklyDetails = async () => {
      try {
        const { data, status, url } =
          await reportsAnalyticsService.getWeeklyMosquitoDetails({
            year: selectedYear,
            month: selectedMonth,
            week: selectedWeek,
            signal: controller.signal,
          });
        setWeeklyDetails(data);
        setMonthlyReportData(normalizeMonthlyReportDataFromAnalytics(data));
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
    !selectedYear || !selectedMonth || !selectedWeek;

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
                      id="yearSelect"
                      label="ปี"
                      options={yearOptions}
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      placeholder="-- เลือกปี --"
                    />
                  </div>
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
                <div className={styles.formGroup}>
                  <CustomSelect
                    id="healthRegionSelect"
                    label="เขตสุขภาพ"
                    options={healthRegionOptions}
                    value={selectedHealthRegion}
                    onChange={(e) => setSelectedHealthRegion(e.target.value)}
                    placeholder="-- เลือกเขตสุขภาพ --"
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
                      selectedHealthRegion &&
                      availableProvincesInRegion.length === 0
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
                    disabled={!selectedProvince || isLoadingDistricts}
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
                    disabled={!selectedDistrict || isLoadingSubdistricts}
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

        <div ref={mapContainer} className={styles.mapContainer}>
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
    </div>
  );
};

export default GisMosquitoComp;
