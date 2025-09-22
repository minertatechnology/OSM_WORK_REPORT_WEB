import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Download } from "lucide-react";
import { useKMLData } from "../../../composables/useKMLData.js";
import { useMapManager } from "../../../composables/useMapManager.js";
import { useHealthRegions } from "../../../composables/useHealthRegions.js";
import CustomSelect from "./CustomSelect";
import styles from "./GisComp.module.css";

const GisComp = () => {
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

  // States for Health Regions
  const [selectedHealthRegion, setSelectedHealthRegion] = useState("");
  const [availableProvincesInRegion, setAvailableProvincesInRegion] = useState(
    []
  );

  // States for year and month selection
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  // Get province data based on selected health region
  const getProvinceData = () => {
    if (selectedHealthRegion && availableProvincesInRegion.length > 0) {
      // Special case for Bangkok - show districts instead of provinces
      if (selectedHealthRegion === "เขตสุขภาพที่ 13" && selectedProvince === "กรุงเทพมหานคร") {
        const bangkokDistricts = [
          "เขตพระนคร", "เขตดุสิต", "เขตหนองจอก", "เขตบางรัก", "เขตยานนาวา",
          "เขตบางโคล่ง", "เขตพระโขนง", "เขตวัฒนา", "เขตป่าทุ่ม", "เขตจตุจักร",
          "เขตบางซื่อ", "เขตลาดพร้าว", "เขตบางกะปิ", "เขตสะพานเพชร", "เขตดินแดง",
          "เขตมีนบุรี", "เขตบางขุนเทียน", "เขตภาษีเจริญ", "เขตบางนา", "เขตคลองสาน"
        ];
        return bangkokDistricts.map((district) => ({
          name: district,
          value: Math.floor(Math.random() * 100) + 20
        }));
      }

      return availableProvincesInRegion.map((province) => ({
        name: province,
        value: Math.floor(Math.random() * 100) + 20 // Mock random values
      }));
    }
    return []; // Empty when no health region selected
  };

  const provinceData = getProvinceData();

  const monthlyReportData = {
    total: 387,
    items: [
      "รายงานการเยี่ยมบ้าน",
      "รายงานกิจกรรมส่งเสริมสุขภาพ",
      "รายงานการป้องกันโรค",
      "รายงานการดูแลผู้สูงอายุ",
      "รายงานการดูแลเด็ก"
    ]
  };

  const mapContainer = useRef(null);

  // Composables
  const {
    getAvailableProvinces,
    getAmphoeListFromFolder,
    getTambonListFromFolder,
    // loadKMLData,
    getEnglishProvinceName,
  } = useKMLData();

  const {
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
        updateStatus(`กำลังโหลดข้อมูลอำเภอใน ${selectedProvince}...`, "info");

        const amphoeList = await getAmphoeListFromFolder(selectedProvince);
        setAvailableDistricts(amphoeList);

        if (amphoeList.length > 0) {
          updateStatus(
            `พบ ${amphoeList.length} อำเภอในจังหวัด ${selectedProvince}`,
            "success"
          );
        } else {
          updateStatus(
            `ไม่พบข้อมูลอำเภอในจังหวัด ${selectedProvince}`,
            "warning"
          );
        }

        await loadMapData("province", selectedProvince);
        // ไม่ต้องเรียก fitToFiltered() เพราะ loadMapData จัดการการซูมให้แล้ว
      } catch (error) {
        console.error("Error in onProvinceChange:", error);
        updateStatus(`ข้อผิดพลาดในการโหลดข้อมูล: ${error}`, "error");
      } finally {
        setIsLoadingDistricts(false);
      }
    } else {
      clearAllLayers();
      updateStatus("ค้นหาพื้นที่เพื่อเริ่มต้น", "info");
    }
  }, [selectedProvince, getAmphoeListFromFolder, updateStatus, loadMapData, clearAllLayers]);

  const onDistrictChange = useCallback(async () => {
    setSelectedSubdistrict("");
    setAvailableSubdistricts([]);

    if (selectedDistrict) {
      try {
        setIsLoadingSubdistricts(true);
        updateStatus(`กำลังโหลดข้อมูลตำบลใน ${selectedDistrict}...`, "info");

        const tambonList = await getTambonListFromFolder(
          selectedProvince,
          selectedDistrict
        );
        setAvailableSubdistricts(tambonList);

        if (tambonList.length > 0) {
          updateStatus(
            `พบ ${tambonList.length} ตำบลในอำเภอ ${selectedDistrict}`,
            "success"
          );
        } else {
          updateStatus(`ไม่พบข้อมูลตำบลในอำเภอ ${selectedDistrict}`, "warning");
        }

        await loadMapData("amphoe", selectedDistrict);
        // ไม่ต้องเรียก fitToFiltered() เพราะ loadMapData จัดการการซูมให้แล้ว
      } catch (error) {
        console.error("Error in onDistrictChange:", error);
        updateStatus(`ข้อผิดพลาดในการโหลดข้อมูล: ${error}`, "error");
      } finally {
        setIsLoadingSubdistricts(false);
      }
    } else if (selectedProvince) {
      await loadMapData("province", selectedProvince);
      setTimeout(() => {
        fitToFiltered();
      }, 300);
    }
  }, [selectedDistrict, selectedProvince, getTambonListFromFolder, updateStatus, loadMapData, fitToFiltered]);

  const onSubdistrictChange = useCallback(async () => {
    if (selectedSubdistrict) {
      try {
        await loadMapData("tambon", selectedSubdistrict);
        updateStatus(
          `โหลด polygon ตำบล ${selectedSubdistrict} สำเร็จ`,
          "success"
        );
        // ไม่ต้องเรียก fitToFiltered() เพราะ loadMapData จัดการการซูมให้แล้ว
      } catch (error) {
        console.error("Error in onSubdistrictChange:", error);
        updateStatus(`ข้อผิดพลาดในการโหลดข้อมูล: ${error}`, "error");
      }
    } else if (selectedDistrict) {
      await loadMapData("amphoe", selectedDistrict);
      // ไม่ต้องเรียก fitToFiltered() เพราะ loadMapData จัดการการซูมให้แล้ว
    } else if (selectedProvince) {
      await loadMapData("province", selectedProvince);
      // ไม่ต้องเรียก fitToFiltered() เพราะ loadMapData จัดการการซูมให้แล้ว
    }
  }, [selectedSubdistrict, selectedDistrict, selectedProvince, loadMapData, updateStatus]);


  const clearFilter = () => {
    setSelectedProvince("");
    setSelectedDistrict("");
    setSelectedSubdistrict("");
    setAvailableDistricts([]);
    setAvailableSubdistricts([]);
    clearAllLayers();
    updateStatus("ค้นหาพื้นที่เพื่อเริ่มต้น", "info");
  };


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
        // Import Leaflet CSS dynamically
        await import("leaflet/dist/leaflet.css");

        // Fix Leaflet default markers
        const L = await import("leaflet");
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-shadow.png",
        });

        // Wait a bit for DOM to be ready
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (mapContainer.current && isMounted) {
          await initializeMap(mapContainer.current);
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

  return (
    <div className={styles.gisComp}>
      <div className={styles.kmlMapViewer}>
        <div
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
                <div className={styles.chartCard}>
                  {provinceData.length > 0 ? (
                    <>
                      {/* Donut Chart */}
                      <div className={styles.donutChart}>
                        <div className={styles.donutContainer}>
                          <svg width="150" height="150" viewBox="0 0 42 42" className={styles.donut}>
                            <circle cx="21" cy="21" r="15.91549430918" fill="transparent" stroke="#f1f5f9" strokeWidth="3"></circle>
                            {(() => {
                              const total = provinceData.reduce((sum, item) => sum + item.value, 0);
                              const colors = ['#6E28B7', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'];
                              let offset = 25; // Start offset
                              return provinceData.map((province, index) => {
                                const percentage = (province.value / total) * 100;
                                const strokeDasharray = `${percentage} ${100 - percentage}`;
                                const color = colors[index % 5];
                                const currentOffset = offset;
                                offset = (offset - percentage) % 100;

                                return (
                                  <circle
                                    key={province.name}
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
                              {provinceData.reduce((sum, item) => sum + item.value, 0)}
                            </div>
                            <div className={styles.donutLabel}>รวม</div>
                          </div>
                        </div>
                      </div>

                      {/* Province List */}
                      <div className={styles.provinceList}>
                        {provinceData.map((province, index) => (
                          <div key={province.name} className={styles.provinceItem}>
                            <div className={styles.provinceName}>
                              <div className={`${styles.colorDot} ${styles[`color${(index % 5) + 1}`]}`}></div>
                              {province.name}
                            </div>
                            <div className={styles.provinceValue}>{province.value}</div>
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

        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingSpinner}>
              <div className={styles.spinner}></div>
              <div className={styles.loadingText}>กำลังโหลดข้อมูล...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GisComp;
