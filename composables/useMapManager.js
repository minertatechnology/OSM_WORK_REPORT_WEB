import { useState, useCallback, useRef, useEffect } from "react";
import { useHealthRegions } from "./useHealthRegions";

export const useMapManager = () => {
  const [allLayers, setAllLayers] = useState([]);
  const [loadedFiles, setLoadedFiles] = useState(0);
  const [currentLevel, setCurrentLevel] = useState("");
  const [loadStartTime, setLoadStartTime] = useState(0);
  const mapRef = useRef(null);
  const [hiByArea, setHiByArea] = useState({});
  const [colorsByArea, setColorsByArea] = useState({}); // สำหรับ OSM - เก็บสีโดยตรงจาก hash

  // Import health regions hook
  const { getHealthRegionByProvince } = useHealthRegions();

  // สีที่แตกต่างกันชัดเจน - ไม่มีสีซ้ำ และ contrast สูง
  const PROVINCE_COLORS = [
    "#E53935", "#1E88E5", "#43A047", "#FB8C00", "#8E24AA",
    "#00ACC1", "#FFB300", "#5E35B1", "#D81B60", "#00897B",
    "#F4511E", "#3949AB", "#7CB342", "#C0CA33", "#6D4C41",
    "#039BE5", "#C62828", "#2E7D32", "#F57C00", "#7B1FA2",
    "#0097A7", "#FFA000", "#512DA8", "#AD1457", "#00796B",
    "#EF6C00", "#303F9F", "#689F38", "#9E9D24", "#5D4037",
    "#0288D1", "#B71C1C", "#1B5E20", "#E65100", "#6A1B9A",
    "#00838F", "#FF8F00", "#4527A0", "#880E4F", "#004D40",
    "#D84315", "#283593", "#558B2F", "#827717", "#4E342E",
    "#0277BD", "#C92A2A", "#2E7D32", "#EF6C00", "#8E24AA",
    "#006064", "#FFB300", "#5E35B1", "#C2185B", "#00695C",
    "#F4511E", "#1565C0", "#33691E", "#9E9D24", "#3E2723",
  ];

  // Get responsive minZoom based on screen size - เพิ่ม zoom สำหรับหน้าจอเล็กมาก
  const getResponsiveMinZoom = useCallback(() => {
    if (typeof window === "undefined") return 7;
    const screenWidth = window.innerWidth;
    // Very small screens (mobile portrait) need much higher zoom
    if (screenWidth < 400) return 10; // Very small mobile
    if (screenWidth < 480) return 9; // Small mobile
    if (screenWidth < 768) return 8; // Mobile
    if (screenWidth < 1024) return 7; // Tablet
    return 6; // Desktop
  }, []);

  // Get responsive center based on screen size - จัดศูนย์กลางแผนที่ตามหน้าจอ
  const getResponsiveCenter = useCallback(() => {
    if (typeof window === "undefined") return [13.7563, 100.5018];
    const screenWidth = window.innerWidth;
    // For mobile portrait, adjust center slightly north for better Thailand view
    if (screenWidth < 480) return [14.5, 101.0]; // Shift center for mobile portrait
    return [13.7563, 100.5018]; // Default center
  }, []);

  // Get responsive default zoom
  const getResponsiveDefaultZoom = useCallback(() => {
    if (typeof window === "undefined") return 7;
    const screenWidth = window.innerWidth;
    if (screenWidth < 400) return 10;
    if (screenWidth < 480) return 9;
    if (screenWidth < 768) return 8;
    if (screenWidth < 1024) return 7;
    return 6;
  }, []);

  // Configuration
  const config = {
    colors: PROVINCE_COLORS, // ใช้สีที่หลากหลายสำหรับแต่ละจังหวัด
    get defaultCenter() {
      return getResponsiveCenter();
    },
    get defaultZoom() {
      return getResponsiveDefaultZoom();
    },
    get minZoom() {
      return getResponsiveMinZoom();
    },
  };

  // เริ่มต้นแผนที่
  const initializeMap = useCallback(async (mapContainer, L = null) => {
    if (!mapContainer) return;
    if (typeof window === "undefined") return; // Guard for SSR

    // ตรวจสอบว่าแผนที่ถูกสร้างแล้วหรือยัง
    if (mapRef.current) {
      console.log("Map already initialized, cleaning up first");
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Import Leaflet dynamically ถ้ายังไม่ได้ส่งเข้ามา
    if (!L) {
      L = await import("leaflet");
    }

    // Get responsive values at initialization time
    const defaultCenter = getResponsiveCenter();
    const defaultZoom = getResponsiveDefaultZoom();
    const minZoom = getResponsiveMinZoom();

    mapRef.current = L.map(mapContainer, {
      center: defaultCenter,
      zoom: defaultZoom,
      minZoom: minZoom, // ป้องกันการซูมออกเกินระดับที่กำหนด
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapRef.current);

    // Force map to render properly
    if (mapRef.current) {
      mapRef.current.invalidateSize();
    }
  }, [getResponsiveCenter, getResponsiveDefaultZoom, getResponsiveMinZoom]);

  // ฟังก์ชันสำหรับหาค่าจาก properties
  const findPropertyValue = useCallback((properties, possibleKeys) => {
    for (const key of possibleKeys) {
      if (properties[key] !== undefined && properties[key] !== null) {
        const value = properties[key].toString().trim();
        if (value) {
          return value;
        }
      }
    }

    return null;
  }, []);

  // ฟังก์ชันสำหรับสร้าง hash จาก string - ใช้ djb2 algorithm ที่กระจายตัวดี
  const hashString = useCallback((str) => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) + hash) ^ char;
    }
    return Math.abs(hash);
  }, []);

  // สร้างสีจาก HSL โดยใช้ hash โดยตรงเพื่อกระจายสี
  const generateColor = useCallback((hash) => {
    // ใช้ส่วนต่างๆ ของ hash เพื่อกำหนด hue, saturation, lightness
    const hue = hash % 360;
    const saturation = 55 + ((hash >> 8) % 30); // 55-85%
    const lightness = 40 + ((hash >> 16) % 20); // 40-60%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }, []);

  // ฟังก์ชันสร้างสีจากค่า HI (3 สี)
  const getHIColor = useCallback((hi) => {
    if (hi < 1) {
      return "#198754"; // 🟢 เขียวเข้ม - ปลอดภัย (HI < 1%)
    } else if (hi < 10) {
      return "#f59e0b"; // 🟡 เหลืองเข้ม - เฝ้าระวัง (1% <= HI < 10%)
    } else {
      return "#dc2626"; // 🔴 แดงเข้ม - เสี่ยงสูง (HI >= 10%)
    }
  }, []);

  // Mapping table for KML filename -> display name mismatches
  // Some KML files use shortened names while lookup API returns full names
  const KML_NAME_MAPPINGS = {
    "ป้อมปราบศัตรูพ่าย": "ป้อมปราบศัตรูพ่า",
    // Add more mappings as needed for other districts/provinces
  };

  // Normalize ชื่อพื้นที่ให้ตรงกับ hiByArea keys (เหมือน calculateHIByArea)
  // ลองทุกระดับเพื่อให้ match ได้ไม่ว่าจะเป็น province/amphoe/tambon
  const normalizeAreaNameForMatch = useCallback((name) => {
    if (!name) return "";

    // เอาคำนำหน้าทั้งหมดออก ไม่ว่าจะระดับไหน
    let normalized = String(name).trim()
      .replace(/^จังหวัด\s*/i, "")
      .replace(/^จ\.\s*/i, "")
      .replace(/^อำเภอ\s*/i, "")
      .replace(/^อ\.\s*/i, "")
      .replace(/^เขต\s*/i, "")
      .replace(/^ตำบล\s*/i, "")
      .replace(/^ต\.\s*/i, "")
      .replace(/^แขวง\s*/i, "")
      .replace(/\s+/g, " ")  // ลดช่องว่างหลายช่องให้เหลือช่องเดียว
      .trim();

    // แปลงชื่อพิเศษ
    if (["กรุงเทพฯ", "กทม.", "กทม"].includes(normalized)) {
      normalized = "กรุงเทพมหานคร";
    }

    // Apply KML name mappings for reverse lookup
    // If the name is a full name that doesn't match KML files, map to short name
    if (KML_NAME_MAPPINGS[normalized]) {
      normalized = KML_NAME_MAPPINGS[normalized];
    }

    // ลบช่องว่างที่อาจเกิดจากการ replace
    normalized = normalized.trim();

    return normalized;
  }, []);

  // กำหนดสีของ feature - รองรับทั้ง HI mode (Mosquito) และ color mode (OSM)
  const getFeatureColor = useCallback(
    (feature) => {
      const properties = feature.properties || {};

      // หาชื่อพื้นที่จาก properties
      const name = findPropertyValue(properties, [
        "name",
        "Name",
        "NAME",
        "ADM2_TH",
        "ADM3_TH",
        "AMPHOE_T",
        "TAMBON_T",
        "ADM1_TH",
        "prov_name_t",
      ]);

      if (!name) {
        return "transparent";
      }

      // ใช้สีโดยตรจาก colorsByArea ถ้ามี (สำหรับ OSM - color mode)
      // ถ้ามี colorsByArea แสดงว่าอยู่ใน OSM mode ซึ่งทุกพื้นที่ต้องมีสี
      if (colorsByArea && Object.keys(colorsByArea).length > 0) {
        // ลอง match ด้วยชื่อเดิมก่อน
        let color = colorsByArea[name];

        // ถ้าไม่เจอ ให้ลอง normalize ชื่อแล้ว match อีกครั้ง
        if (color === undefined) {
          const normalizedName = normalizeAreaNameForMatch(name);
          color = colorsByArea[normalizedName];
        }

        if (color !== undefined) {
          return color;
        }
        // ใน OSM mode ถ้าไม่เจอ match ให้คืน special value เพื่อบอกว่าไม่ต้องแสดง
        return null;
      }

      // ใช้สีจากค่า HI ถ้ามีข้อมูล (สำหรับ Mosquito - HI mode)
      if (hiByArea && Object.keys(hiByArea).length > 0) {
        // ลอง match ด้วยชื่อเดิมก่อน
        let hi = hiByArea[name];

        // ถ้าไม่เจอ ให้ลอง normalize ชื่อแล้ว match อีกครั้ง
        if (hi === undefined) {
          const normalizedName = normalizeAreaNameForMatch(name);
          hi = hiByArea[normalizedName];
        }

        if (hi !== undefined) {
          return getHIColor(hi);
        }
        // ถ้าไม่มีข้อมูล HI สำหรับพื้นที่นี้ ให้โปร่งใส
        return "transparent";
      }

      // ถ้าไม่มีข้อมูลทั้ง HI และ color ให้โปร่งใส
      return "transparent";
    },
    [findPropertyValue, getHIColor, hiByArea, colorsByArea, normalizeAreaNameForMatch]
  );

  // กำหนดสไตล์ของ feature
  const getFeatureStyle = useCallback(
    (feature) => {
      const color = getFeatureColor(feature);
      const geometryType = feature.geometry.type;

      // null หมายถึง OSM mode ที่ไม่มีสีกำหนด -> โปร่งใสไม่ต้องแสดง
      if (color === null) {
        return {
          color: "transparent",
          fillColor: "transparent",
          weight: 0,
          opacity: 0,
          fillOpacity: 0,
        };
      }

      // "transparent" หมายถึง HI mode ที่ไม่มีข้อมูล -> ใช้สีเขียว (ปลอดภัย HI < 1%)
      const isNoData = color === "transparent";
      const actualColor = isNoData ? "#198754" : color; // สีเขียว = ปลอดภัย
      const actualFillColor = isNoData ? "#198754" : color;

      const baseStyle = {
        color: actualColor,
        weight: 2,
        opacity: 0.8, // ให้ขอบชัดเสมอ
        fillOpacity: 0.3, // ให้ทุก polygon มี fillOpacity เท่ากัน 30%
      };

      switch (geometryType) {
        case "Polygon":
        case "MultiPolygon":
          return {
            ...baseStyle,
            fillColor: actualFillColor,
            fillOpacity: 0.3, // โปร่งใส 30% เหมือนกันหมด
          };
        case "LineString":
        case "MultiLineString":
          return { ...baseStyle, weight: 3, fillOpacity: 0 };
        default:
          return baseStyle;
      }
    },
    [getFeatureColor]
  );

  // สร้าง point layer
  const createPointLayer = useCallback(
    (feature, latlng) => {
      const color = getFeatureColor(feature);
      const isNoData = color === "transparent";
      return L.circleMarker(latlng, {
        radius: 8,
        fillColor: color,
        color: color,
        weight: 1,
        opacity: isNoData ? 0 : 0.8,
        fillOpacity: isNoData ? 0 : 0.3, // โปร่งใส 30%
      });
    },
    [getFeatureColor]
  );

  // Escape HTML characters
  const escapeHtml = useCallback((text) => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }, []);

  // สร้างเนื้อหา popup
  const createPopupContent = useCallback(
    (feature) => {
      const props = feature.properties || {};
      let content = '<div class="popup-content">';

      // หาชื่อจาก properties ต่างๆ
      const name = findPropertyValue(props, [
        "ADM2_TH",
        "ADM3_TH",
        "AMPHOE_T",
        "TAMBON_T",
        "amp_name_t",
        "tam_name_t",
        "name",
        "Name",
        "NAME",
      ]);

      // ถ้าไม่เจอชื่อ ให้ลองหา property แรกที่มีค่า
      const displayName =
        name || findPropertyValue(props, Object.keys(props)) || "ไม่ระบุชื่อ";

      content += `<h4>${escapeHtml(displayName)}</h4>`;

      // แสดงประเภทตามระดับปัจจุบัน
      const levelText =
        currentLevel === "province"
          ? "จังหวัด"
          : currentLevel === "amphoe"
          ? "อำเภอ"
          : currentLevel === "tambon"
          ? "ตำบล"
          : "พื้นที่";
      content += `<div><strong>ประเภท:</strong> ${levelText}</div>`;

      // แสดง properties ที่สำคัญ
      const importantProps = [
        "ADM1_TH",
        "ADM2_TH",
        "ADM3_TH",
        "AMPHOE_T",
        "TAMBON_T",
        "amp_name_t",
        "tam_name_t",
        "ADM1_PCODE",
        "ADM2_PCODE",
        "ADM3_PCODE",
      ];
      for (const prop of importantProps) {
        if (props[prop] && props[prop].toString().trim()) {
          content += `<div><strong>${prop}:</strong> ${escapeHtml(
            props[prop].toString()
          )}</div>`;
        }
      }

      if (props.description) {
        content += `<div class="description"><strong>รายละเอียด:</strong><br>${escapeHtml(
          props.description
        )}</div>`;
      }

      // Debug: แสดงทุก properties
      content += "<details><summary> All Properties</summary>";
      for (const [key, value] of Object.entries(props)) {
        if (value) {
          content += `<div><small>${key}: ${escapeHtml(
            value.toString()
          )}</small></div>`;
        }
      }
      content += "</details>";

      content += "</div>";
      return content;
    },
    [findPropertyValue, escapeHtml, currentLevel]
  );

  // ผูก interactions กับ feature
  const bindFeatureInteractions = useCallback(
    (feature, layer) => {
      const popupContent = createPopupContent(feature);

      if ("bindPopup" in layer) {
        layer.bindPopup(popupContent, {
          maxWidth: 300,
          className: "custom-popup",
          closeButton: true, // แสดงปุ่มปิด popup
        });
      }

      // เก็บ feature reference ไว้ใน layer เพื่อใช้ตอน mouseout
      layer.feature = feature;

      // เก็บสีไว้ใน layer เพื่อใช้เมื่อ mouseout (ป้องกันปัญหา stale closure)
      layer.originalColor = getFeatureColor(feature);

      // Hover effects - เฉพาะ highlight polygon ไม่เปิด popup
      layer.on("mouseover", (e) => {
        const layer = e.target;
        if (layer.setStyle) {
          const hoverStyle = {
            weight: 4,
            opacity: 1,
            fillOpacity: 0.6,
          };
          // ใช้ setStyle โดยตรง
          layer.setStyle(hoverStyle);
        }
      });

      layer.on("mouseout", (e) => {
        const layer = e.target;
        if (layer.setStyle && layer.feature) {
          // ใช้สีที่เก็บไว้ตอนสร้าง layer แทนการคำนวณใหม่
          const color = layer.originalColor;

          const props = layer.feature.properties || {};
          const name = props.name || props.Name || props.NAME || props.ADM2_TH || props.ADM3_TH || "Unknown";

          // null หมายถึง OSM mode ที่ไม่มีสีกำหนด -> โปร่งใสไม่ต้องแสดง
          if (color === null) {
            layer.setStyle({
              color: "transparent",
              fillColor: "transparent",
              weight: 0,
              opacity: 0,
              fillOpacity: 0,
            });
            return;
          }

          const isNoData = color === "transparent";
          const actualColor = isNoData ? "#198754" : color;

          const originalStyle = {
            color: actualColor,
            fillColor: actualColor,
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3,
          };
          layer.setStyle(originalStyle);
        }
      });

      // Click to open/close popup - Leaflet จะจัดการอัตโนมัติ
      // ไม่ต้องเขียน click handler เพิ่ม เพราะ bindPopup ทำงานอัตโนมัติเมื่อคลิก
    },
    [createPopupContent, getFeatureColor]
  );

  // สร้าง layers บนแผนที่
  const createMapLayers = useCallback(
    (features) => {
      if (!mapRef.current) return [];

      if (!Array.isArray(features)) {
        console.warn(
          "Features is not a valid array, cannot create map layers.",
          features
        );
        setAllLayers([]);
        return [];
      }

      const newLayers = [];

      features.forEach((feature, index) => {
        try {
          const layer = L.geoJSON(feature, {
            style: getFeatureStyle,
            pointToLayer: (feature, latlng) =>
              createPointLayer(feature, latlng),
            onEachFeature: (feature, layer) => {
              bindFeatureInteractions(feature, layer);
              // ตั้งค่า zIndex ให้แต่ละ layer มีค่าตามลำดับ
              // เพื่อป้องกันการทับซ้อนที่ไม่ต้องการ
              if (layer.setStyle) {
                layer.setStyle({ zIndex: index });
              }
            },
          });

          newLayers.push(layer);
          layer.addTo(mapRef.current);
        } catch (error) {
          console.error(`Error creating layer for feature ${index}:`, error);
        }
      });

      setAllLayers(newLayers);
      return newLayers;
    },
    [getFeatureStyle, createPointLayer, bindFeatureInteractions]
  );

  // ปรับมุมมองแผนที่ให้เหมาะสมกับข้อมูล โดยไม่ให้ซูมเกิน minZoom
  const fitToData = useCallback(() => {
    if (!mapRef.current || allLayers.length === 0) {
      console.warn("ไม่มีข้อมูลให้แสดง");
      return;
    }

    const group = L.featureGroup(allLayers);
    const minZoom = getResponsiveMinZoom();
    mapRef.current.fitBounds(group.getBounds(), {
      padding: [20, 20],
      maxZoom: mapRef.current.getMaxZoom(),
    });

    // Prevent zooming out beyond minZoom (fitBounds can go below minZoom)
    setTimeout(() => {
      if (mapRef.current && mapRef.current.getZoom() < minZoom) {
        mapRef.current.setZoom(minZoom);
      }
    }, 100);
  }, [allLayers, getResponsiveMinZoom]);

  // ล้าง layers ทั้งหมด
  const clearAllLayers = useCallback(() => {
    if (!mapRef.current) return;

    // ใช้ eachLayer จาก Leaflet เพื่อลบ layer ทั้งหมดที่อยู่บนแผนที่
    mapRef.current.eachLayer((layer) => {
      // ไม่ลบ tile layer (base map)
      if (!(layer instanceof L.TileLayer)) {
        mapRef.current.removeLayer(layer);
      }
    });

    setAllLayers([]);
    setLoadedFiles(0);
    setCurrentLevel("");
  }, []);

  // โหลดและแสดงข้อมูล KML บนแผนที่
  const loadAndDisplayKML = useCallback(
    async (geoJsonData, level, updateStatus, hiData = null) => {
      if (!mapRef.current) return;

      // ตั้งค่า HI แยกตามพื้นที่ถ้ามี (อย่ารีเซ็ตเมื่อไม่มี hiData เพราะอาจมีค่าอยู่แล้ว)
      if (hiData) {
        setHiByArea(hiData);
      }

      setLoadStartTime(Date.now());
      setCurrentLevel(level);

      try {
        // ล้าง layers เดิม
        clearAllLayers();

        // Robust check for geoJsonData
        let isValid = geoJsonData && Array.isArray(geoJsonData.features);
        if (!isValid) {
          let reason = "";
          if (!geoJsonData) {
            reason = "geoJsonData is undefined or null.";
          } else if (!("features" in geoJsonData)) {
            reason = "geoJsonData does not have a 'features' property.";
          } else if (!Array.isArray(geoJsonData.features)) {
            reason = "geoJsonData.features is not an array.";
          }
          const loadTime = ((Date.now() - loadStartTime) / 1000).toFixed(2);
          const msg = `ไม่พบข้อมูลหรือข้อมูลไม่ถูกต้องสำหรับ ${level} (${loadTime}s)\n${reason}`;
          console.warn(msg);
          if (typeof updateStatus === "function") {
            updateStatus(msg, "warning");
          }
          setLoadedFiles(0);
          return {
            featureCount: 0,
            loadTime: parseFloat(loadTime),
          };
        }

        // สร้าง layers บนแผนที่
        const newLayers = createMapLayers(geoJsonData.features);

        // อัพเดทสถิติ
        setLoadedFiles(1);

        // ปรับมุมมองแผนที่ให้เหมาะสม - ใช้ layers ที่สร้างใหม่
        // โดยไม่ให้ซูมเกิน minZoom เพื่อป้องกันการทับซ้อน
        if (newLayers && newLayers.length > 0) {
          const group = L.featureGroup(newLayers);
          const minZoom = getResponsiveMinZoom();
          mapRef.current.fitBounds(group.getBounds(), {
            padding: [20, 20],
            maxZoom: mapRef.current.getMaxZoom(),
          });

          // Prevent zooming out beyond minZoom (fitBounds can go below minZoom)
          setTimeout(() => {
            if (mapRef.current && mapRef.current.getZoom() < minZoom) {
              mapRef.current.setZoom(minZoom);
            }
          }, 100);
        }

        const loadTime = ((Date.now() - loadStartTime) / 1000).toFixed(2);
        const msg = `โหลด ${level} สำเร็จ: ${geoJsonData.features.length} features (${loadTime}s)`;

        if (typeof updateStatus === "function") {
          updateStatus(msg, "success");
        }

        return {
          featureCount: geoJsonData.features.length,
          loadTime: parseFloat(loadTime),
        };
      } catch (error) {
        console.error("Error loading and displaying KML:", error);
        if (typeof updateStatus === "function") {
          updateStatus("เกิดข้อผิดพลาดในการโหลดข้อมูลแผนที่", "error");
        }
        throw error;
      }
    },
    [clearAllLayers, createMapLayers, fitToData, loadStartTime]
  );

  // ล้างแผนที่เมื่อ component ถูก unmount
  const cleanup = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
  }, []);

  // อัปเดตสีของ layers ทั้งหมดเมื่อ hiByArea หรือ colorsByArea เปลี่ยน
  const updateLayerColors = useCallback(() => {
    if (!mapRef.current || allLayers.length === 0) return;

    allLayers.forEach((layer) => {
      // ตรวจสอบว่า layer ยังอยู่บนแผนที่หรือไม่
      if (!layer || !mapRef.current.hasLayer(layer)) {
        return;
      }

      if (layer.setStyle && layer.getLayers) {
        // layer เป็น FeatureGroup ที่มีหลาย features
        layer.getLayers().forEach((featureLayer) => {
          if (featureLayer && featureLayer.feature && featureLayer.setStyle) {
            // คำนวณสีใหม่โดยตรงจาก feature และค่าปัจจุบัน
            const color = getFeatureColor(featureLayer.feature);

            // อัปเดต originalColor ไว้ใน layer ด้วย เพื่อใช้เมื่อ mouseout
            featureLayer.originalColor = color;

            // null หมายถึง OSM mode ที่ไม่มีสีกำหนด -> โปร่งใสไม่ต้องแสดง
            if (color === null) {
              featureLayer.setStyle({
                color: "transparent",
                fillColor: "transparent",
                weight: 0,
                opacity: 0,
                fillOpacity: 0,
              });
              return;
            }

            const isNoData = color === "transparent";
            const actualColor = isNoData ? "#198754" : color;

            const newStyle = {
              color: actualColor,
              fillColor: actualColor,
              weight: 2,
              opacity: 0.8,
              fillOpacity: 0.3,
            };

            featureLayer.setStyle(newStyle);
          }
        });
      }
    });
  }, [allLayers, getFeatureColor, hiByArea, colorsByArea]);

  // เมื่อ hiByArea หรือ colorsByArea เปลี่ยน ให้อัปเดตสีของ layers
  useEffect(() => {
    if (allLayers.length > 0) {
      updateLayerColors();
    }
  }, [hiByArea, colorsByArea, updateLayerColors, allLayers]);

  // อัพเดท minZoom เมื่อขนาดหน้าจอเปลี่ยน (สำหรับ responsive)
  const updateResponsiveZoom = useCallback(() => {
    if (!mapRef.current) return;
    const minZoom = getResponsiveMinZoom();
    const recommendedZoom = getResponsiveDefaultZoom();
    const recommendedCenter = getResponsiveCenter();
    const currentZoom = mapRef.current.getZoom();

    // ตั้งค่า minZoom ใหม่
    mapRef.current.setMinZoom(minZoom);

    // ถ้า zoom ปัจจุบันต่ำกว่า minZoom ให้ปรับให้ตรงกับ recommended zoom
    if (currentZoom < minZoom) {
      mapRef.current.setView(recommendedCenter, recommendedZoom, { animate: false });
    }
  }, [getResponsiveMinZoom, getResponsiveDefaultZoom, getResponsiveCenter]);

  return {
    // State
    map: mapRef.current,
    allLayers,
    loadedFiles,
    currentLevel,
    loadStartTime,
    hiByArea,

    // Methods
    initializeMap,
    loadAndDisplayKML,
    clearAllLayers,
    fitToData,
    cleanup,
    updateResponsiveZoom,
    getResponsiveMinZoom,
    setHiByAreaData: setHiByArea,
    setColorsByAreaData: setColorsByArea,
    updateLayerColors,
  };
};
