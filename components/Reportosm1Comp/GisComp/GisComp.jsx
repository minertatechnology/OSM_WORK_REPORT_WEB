import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Download } from "lucide-react";
import { useKMLData } from "../../../composables/useKMLData.js";
import { useMapManager } from "../../../composables/useMapManager.js";
import { useHealthRegions } from "../../../composables/useHealthRegions.js";
import { useLoading } from "../../../context/LoadingProvider";
import CustomSelect from "./CustomSelect";
import styles from "./GisComp.module.css";

const GisComp = () => {
  const { setLoading } = useLoading();
  // States for KmlMapViewer
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSubdistrict, setSelectedSubdistrict] = useState("");
  const [availableProvinces, setAvailableProvinces] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableSubdistricts, setAvailableSubdistricts] = useState([]);
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

  // States for year and month selection
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  // Get display data based on selection (tambon, amphoe or province)
  const getDisplayData = () => {
    // ถ้าเลือกอำเภอแล้ว (รวมถึงเมื่อเลือกตำบลด้วย) ให้แสดงข้อมูลตำบลทั้งหมด
    if (selectedDistrict && availableSubdistricts.length > 0) {
      return availableSubdistricts.map((tambon) => ({
        name: tambon,
        value: Math.floor(Math.random() * 100) + 20 // Mock random values
      }));
    }

    // ถ้าเลือกจังหวัดแล้ว ให้แสดงข้อมูลอำเภอ
    if (selectedProvince && availableDistricts.length > 0) {
      return availableDistricts.map((amphoe) => ({
        name: amphoe,
        value: Math.floor(Math.random() * 100) + 20 // Mock random values
      }));
    }

    // ถ้ายังไม่ได้เลือกจังหวัด แต่เลือกเขตสุขภาพแล้ว ให้แสดงจังหวัด
    if (selectedHealthRegion && availableProvincesInRegion.length > 0) {
      return availableProvincesInRegion.map((province) => ({
        name: province,
        value: Math.floor(Math.random() * 100) + 20 // Mock random values
      }));
    }

    return []; // Empty when no selection
  };

  const displayData = getDisplayData();

  const monthlyReportData = {
    total: 387,
    items: []
  };

  const mapContainer = useRef(null);

  // ฟังก์ชัน hash string - ใช้ djb2 algorithm (เหมือนกับใน useMapManager)
  const hashString = (str) => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) + hash) ^ char;
    }
    return Math.abs(hash);
  };

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
  const {
    getAvailableProvinces,
    getAmphoeListFromFolder,
    getTambonListFromFolder,
    // loadKMLData,
    getEnglishProvinceName,
  } = useKMLData();

  const {
    map,
    initializeMap,
    loadAndDisplayKML,
    clearAllLayers,
    fitToData,
    cleanup,
    // currentLevel,
  } = useMapManager();

  const { getHealthRegionsList, getProvincesInRegion /*, loadHealthRegionData */ } =
    useHealthRegions();

  // Options data for CustomSelect components
  const yearOptions = [
    { value: "2567", label: "2567" },
    { value: "2566", label: "2566" },
    { value: "2565", label: "2565" },
    { value: "2564", label: "2564" },
    { value: "2563", label: "2563" },
  ];

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

  useEffect(() => {
    // เมื่อเลือกจังหวัด อำเภอ หรือ ตำบล และข้อมูลโหลดแล้ว ให้ซูมอัตโนมัติ
    // ลบ auto-zoom เพื่อป้องกันซูมซ้ำหรือ race condition
    // ซูมจะถูกเรียกในแต่ละ handler หลังโหลดข้อมูลเท่านั้น
  }, []);

  // Methods
  const updateStatus = useCallback((message, type = "info") => {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }, []);

  const toggleControlPanel = () => {
    setIsCollapsed(!isCollapsed);
  };

  const loadMapData = useCallback(async (level, name) => {
    try {
      setIsLoading(true);
      updateStatus(`กำลังโหลด ${level} - ${name}...`, "info");

      let filePath = "";

      if (level === "province") {
        filePath = `/split-provinces/${name}.kml`;
      } else if (level === "amphoe") {
        const englishProvinceName = getEnglishProvinceName(selectedProvince);
        filePath = `/split-amphoe/${englishProvinceName}/${name}.kml`;
      } else if (level === "tambon") {
        const englishProvinceName = getEnglishProvinceName(selectedProvince);
        filePath = `/split-tambon/${englishProvinceName}/${selectedDistrict}/${name}.kml`;
      } else {
        filePath = `/split-provinces/${name}.kml`;
      }

      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`ไม่พบไฟล์: ${filePath} (Status: ${response.status})`);
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
        // ไม่ต้องเรียก fitToData() ที่นี่ เพราะ loadAndDisplayKML จัดการการซูมให้แล้ว
      }
    } catch (error) {
      console.error("Error loading map data:", error);
      updateStatus(`ข้อผิดพลาดในการโหลด: ${error}`, "error");
    } finally {
      setIsLoading(false);
    }
  }, [selectedProvince, selectedDistrict, updateStatus, loadAndDisplayKML, getEnglishProvinceName]);

  const fitToFiltered = useCallback(() => {
    fitToData();
  }, [fitToData]);

  // KML Map Viewer handlers
  const onProvinceChange = useCallback(async () => {
    setSelectedDistrict("");
    setSelectedSubdistrict("");
    setAvailableDistricts([]);
    setAvailableSubdistricts([]);

    if (selectedProvince) {
      try {
        setIsLoadingDistricts(true);
        setIsLoading(true);
        updateStatus(`กำลังโหลดข้อมูลอำเภอใน ${selectedProvince}...`, "info");

        const amphoeList = await getAmphoeListFromFolder(selectedProvince);
        setAvailableDistricts(amphoeList);

        if (amphoeList.length > 0) {
          updateStatus(
            `พบ ${amphoeList.length} อำเภอในจังหวัด ${selectedProvince}, กำลังโหลดแผนที่...`,
            "info"
          );

          // ล้าง layers เดิม
          clearAllLayers();

          // โหลด KML ของทุกอำเภอในจังหวัด
          const englishProvinceName = getEnglishProvinceName(selectedProvince);
          const loadPromises = amphoeList.map(async (amphoeName) => {
            try {
              const filePath = `/split-amphoe/${englishProvinceName}/${amphoeName}.kml`;
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
            updateStatus(`ไม่พบข้อมูลแผนที่สำหรับ ${selectedProvince}`, "warning");
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
  }, [selectedProvince, getAmphoeListFromFolder, getEnglishProvinceName, updateStatus, loadAndDisplayKML, clearAllLayers]);

  const onDistrictChange = useCallback(async () => {
    setSelectedSubdistrict("");
    setAvailableSubdistricts([]);

    if (selectedDistrict) {
      try {
        setIsLoadingSubdistricts(true);
        setIsLoading(true);
        updateStatus(`กำลังโหลดข้อมูลตำบลใน ${selectedDistrict}...`, "info");

        const tambonList = await getTambonListFromFolder(
          selectedProvince,
          selectedDistrict
        );
        setAvailableSubdistricts(tambonList);

        if (tambonList.length > 0) {
          // ล้าง layers เดิม
          clearAllLayers();

          // โหลด KML ของทุกตำบลในอำเภอ
          const englishProvinceName = getEnglishProvinceName(selectedProvince);
          const loadPromises = tambonList.map(async (tambonName) => {
            try {
              const filePath = `/split-tambon/${englishProvinceName}/${selectedDistrict}/${tambonName}.kml`;
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

            const loadResult = await loadAndDisplayKML(combinedGeoJSON, "tambon");
            updateStatus(
              `โหลดแผนที่ ${selectedDistrict} สำเร็จ: ${validResults.length} ตำบล, ${loadResult.featureCount} features`,
              "success"
            );
          } else {
            updateStatus(`ไม่พบข้อมูลแผนที่สำหรับ ${selectedDistrict}`, "warning");
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
  }, [selectedDistrict, selectedProvince, getTambonListFromFolder, getEnglishProvinceName, updateStatus, loadMapData, fitToFiltered, clearAllLayers, loadAndDisplayKML]);

  const onSubdistrictChange = useCallback(async () => {
    if (selectedSubdistrict) {
      try {
        setIsLoading(true);
        clearAllLayers();

        // โหลด KML ของตำบลที่เลือก
        const englishProvinceName = getEnglishProvinceName(selectedProvince);
        const filePath = `/split-tambon/${englishProvinceName}/${selectedDistrict}/${selectedSubdistrict}.kml`;
        const response = await fetch(filePath);

        if (response.ok) {
          const kmlText = await response.text();
          const parser = new DOMParser();
          const kmlDoc = parser.parseFromString(kmlText, "text/xml");

          const tj = await import("@mapbox/togeojson");
          const geoJsonData = tj.kml(kmlDoc);

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
          updateStatus(`ไม่พบข้อมูลแผนที่สำหรับตำบล ${selectedSubdistrict}`, "warning");
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
  }, [selectedSubdistrict, selectedDistrict, selectedProvince, loadMapData, updateStatus, getEnglishProvinceName, clearAllLayers, loadAndDisplayKML]);


  const clearFilter = useCallback(() => {
    // ล้างการเลือกทั้งหมด
    setSelectedHealthRegion("");
    setSelectedProvince("");
    setSelectedDistrict("");
    setSelectedSubdistrict("");
    setAvailableProvincesInRegion([]);
    setAvailableDistricts([]);
    setAvailableSubdistricts([]);

    // ล้าง layers บนแผนที่
    clearAllLayers();

    // ซูมกลับไปที่ตำแหน่งเริ่มต้น (ประเทศไทย)
    if (map) {
      map.setView([13.7563, 100.5018], 6); // ตำแหน่งกลางประเทศไทย, zoom level 6
    }

    updateStatus("ค้นหาพื้นที่เพื่อเริ่มต้น", "info");
  }, [clearAllLayers, updateStatus, map]);


  // Health Region handlers
  const onHealthRegionSelection = useCallback(async () => {
    if (selectedHealthRegion) {
      try {
        setIsLoading(true);
        updateStatus(`กำลังโหลดข้อมูล ${selectedHealthRegion}...`, "info");

        const provincesInRegion = getProvincesInRegion(selectedHealthRegion);
        setAvailableProvincesInRegion(provincesInRegion);

        // Clear other selections
        setSelectedProvince("");
        setSelectedDistrict("");
        setSelectedSubdistrict("");
        setAvailableDistricts([]);
        setAvailableSubdistricts([]);

        clearAllLayers();

        // โหลดข้อมูล KML ของทุกจังหวัดในเขตสุขภาพ
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
      clearAllLayers();
      updateStatus("ค้นหาพื้นที่เพื่อเริ่มต้น", "info");
    }
  }, [selectedHealthRegion, getProvincesInRegion, clearAllLayers, updateStatus, loadAndDisplayKML]);

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
          import("leaflet")
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
          const provinces = await getAvailableProvinces();
          setAvailableProvinces(provinces);
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
  }, [initializeMap, getAvailableProvinces, cleanup, updateStatus]);

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
      controlPanel.addEventListener('mouseenter', disableMapZoom);
      controlPanel.addEventListener('mouseleave', enableMapZoom);
    }
    if (chartCard) {
      chartCard.addEventListener('mouseenter', disableMapZoom);
      chartCard.addEventListener('mouseleave', enableMapZoom);
    }

    return () => {
      if (controlPanel) {
        controlPanel.removeEventListener('mouseenter', disableMapZoom);
        controlPanel.removeEventListener('mouseleave', enableMapZoom);
      }
      if (chartCard) {
        chartCard.removeEventListener('mouseenter', disableMapZoom);
        chartCard.removeEventListener('mouseleave', enableMapZoom);
      }
    };
  }, [map]);

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
              <button
                className={styles.toggleBtn}
                onClick={toggleControlPanel}
              >
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
                      onChange={setSelectedYear}
                      placeholder="-- เลือกปี --"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <CustomSelect
                      id="monthSelect"
                      label="เดือน"
                      options={monthOptions}
                      value={selectedMonth}
                      onChange={setSelectedMonth}
                      placeholder="-- เลือกเดือน --"
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <CustomSelect
                    id="healthRegionSelect"
                    label="เขตสุขภาพ"
                    options={healthRegionOptions}
                    value={selectedHealthRegion}
                    onChange={setSelectedHealthRegion}
                    placeholder="-- เลือกเขตสุขภาพ --"
                  />
                </div>
                <div className={styles.formGroup}>
                  <CustomSelect
                    id="provinceSelect"
                    label="จังหวัด"
                    options={provinceOptions}
                    value={selectedProvince}
                    onChange={setSelectedProvince}
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
                    onChange={setSelectedDistrict}
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
                    onChange={setSelectedSubdistrict}
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
                <h3>แผนภาพรายงาน อสม.1</h3>
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
                <div
                  ref={chartCardRef}
                  className={styles.chartCard}
                >
                  {displayData.length > 0 ? (
                    <>
                      {/* Donut Chart */}
                      <div className={styles.donutChart}>
                        <div className={styles.donutContainer}>
                          <svg width="150" height="150" viewBox="0 0 42 42" className={styles.donut}>
                            <circle cx="21" cy="21" r="15.91549430918" fill="transparent" stroke="#f1f5f9" strokeWidth="3"></circle>
                            {(() => {
                              const total = displayData.reduce((sum, item) => sum + item.value, 0);
                              let offset = 25; // Start offset
                              return displayData.map((item) => {
                                const percentage = (item.value / total) * 100;
                                const strokeDasharray = `${percentage} ${100 - percentage}`;
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
                              {displayData.reduce((sum, item) => sum + item.value, 0)}
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
                                style={{ backgroundColor: getProvinceColor(item.name) }}
                              ></div>
                              {item.name}
                            </div>
                            <div className={styles.provinceValue}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className={styles.emptyMessage}>
                      กรุณาเลือกเขตสุขภาพเพื่อแสดงข้อมูล
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.reportDivider}></div>

              {/* Monthly Report Section */}
              <div className={styles.monthlyReportSection}>
                <div className={styles.sectionTitle}>กราฟสรุปผลรายงานรายเดือน</div>

                <div className={styles.totalSection}>
                  <div className={styles.totalValue}>{monthlyReportData.total}</div>
                  <div className={styles.totalLabel}>รวมทุกรายการ</div>
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
    </div>
  );
};

export default GisComp;
