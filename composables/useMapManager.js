import { useState, useCallback, useRef, useEffect } from "react";
import { useHealthRegions } from "./useHealthRegions";

export const useMapManager = () => {
  const [allLayers, setAllLayers] = useState([]);
  const [loadedFiles, setLoadedFiles] = useState(0);
  const [currentLevel, setCurrentLevel] = useState("");
  const [loadStartTime, setLoadStartTime] = useState(0);
  const mapRef = useRef(null);
  const [ciByArea, setCiByArea] = useState({});
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

  // ฟังก์ชันสร้างสีจากค่า CI (3 สี)
  const getCIColor = useCallback((ci) => {
    if (ci <= 0) {
      return "#198754"; // 🟢 เขียวเข้ม - ปลอดภัย (CI ≤ 0)
    } else if (ci <= 10) {
      return "#f59e0b"; // 🟡 เหลืองเข้ม - เริ่มมี (0 < CI ≤ 10)
    } else {
      return "#dc2626"; // 🔴 แดงเข้ม - เสี่ยงสูง (CI > 10)
    }
  }, []);

  // กำหนดสีของ feature - รองรับทั้ง CI mode (Mosquito) และ color mode (OSM)
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

      // ใช้สีโดยตรจาก colorsByArea ถ้ามี (สำหรับ OSM - color mode)
      if (name && colorsByArea && Object.keys(colorsByArea).length > 0) {
        const color = colorsByArea[name];
        if (color !== undefined) {
          console.log("[getFeatureColor] Color mode - Match found:", name, "Color:", color);
          return color;
        }
      }

      // ใช้สีจากค่า CI ถ้ามีข้อมูล (สำหรับ Mosquito - CI mode)
      if (name && ciByArea && Object.keys(ciByArea).length > 0) {
        const ci = ciByArea[name];
        if (ci !== undefined) {
          console.log("[getFeatureColor] CI mode - Match found:", name, "CI:", ci, "Color:", getCIColor(ci));
          return getCIColor(ci);
        }
        // ถ้าไม่มีข้อมูล CI สำหรับพื้นที่นี้ ให้โปร่งใส
        console.log("[getFeatureColor] No CI for:", name, "| Available:", Object.keys(ciByArea));
        return "transparent";
      }

      // ถ้าไม่มีข้อมูลทั้ง CI และ color ให้โปร่งใส
      return "transparent";
    },
    [findPropertyValue, getCIColor, ciByArea, colorsByArea]
  );

  // กำหนดสไตล์ของ feature
  const getFeatureStyle = useCallback(
    (feature) => {
      const color = getFeatureColor(feature);
      const geometryType = feature.geometry.type;

      // ทุกสีให้โปร่งใส (semi-transparent) เหมือนกันหมด
      const isNoData = color === "transparent";
      const fillOpacity = isNoData ? 0 : 0.3; // โปร่งใส 30% สำหรับทุกพื้นที่ที่มีข้อมูล

      const baseStyle = {
        color: color,
        weight: 2,
        opacity: isNoData ? 0 : 0.8,
        fillOpacity: fillOpacity,
      };

      switch (geometryType) {
        case "Polygon":
        case "MultiPolygon":
          return {
            ...baseStyle,
            fillColor: color,
            fillOpacity: fillOpacity,
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
        });
      }

      // Hover effects
      layer.on("mouseover", (e) => {
        const layer = e.target;
        if (layer.setStyle) {
          layer.setStyle({
            weight: 4,
            opacity: 1,
            fillOpacity: 0.6,
          });
        }
      });

      layer.on("mouseout", (e) => {
        const layer = e.target;
        if (layer.setStyle) {
          layer.setStyle(getFeatureStyle(feature));
        }
      });
    },
    [createPopupContent, getFeatureStyle]
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
            style: (feature) => getFeatureStyle(feature),
            pointToLayer: (feature, latlng) =>
              createPointLayer(feature, latlng),
            onEachFeature: (feature, layer) =>
              bindFeatureInteractions(feature, layer),
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

    allLayers.forEach((layer) => {
      mapRef.current.removeLayer(layer);
    });
    setAllLayers([]);
    setLoadedFiles(0);
    setCurrentLevel("");
  }, [allLayers]);

  // โหลดและแสดงข้อมูล KML บนแผนที่
  const loadAndDisplayKML = useCallback(
    async (geoJsonData, level, updateStatus, ciData = null) => {
      if (!mapRef.current) return;

      // ตั้งค่า CI แยกตามพื้นที่ถ้ามี (อย่ารีเซ็ตเมื่อไม่มี ciData เพราะอาจมีค่าอยู่แล้ว)
      if (ciData) {
        setCiByArea(ciData);
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

  // อัปเดตสีของ layers ทั้งหมดเมื่อ ciByArea เปลี่ยน
  const updateLayerColors = useCallback(() => {
    if (!mapRef.current || allLayers.length === 0) return;

    console.log("[updateLayerColors] Updating", allLayers.length, "layers with ciByArea:", Object.keys(ciByArea));

    allLayers.forEach((layer) => {
      if (layer && layer.setStyle && layer.getLayers) {
        // layer เป็น FeatureGroup ที่มีหลาย features
        layer.getLayers().forEach((featureLayer) => {
          if (featureLayer && featureLayer.feature && featureLayer.setStyle) {
            const newStyle = getFeatureStyle(featureLayer.feature);
            featureLayer.setStyle(newStyle);
          }
        });
      }
    });
  }, [allLayers, getFeatureStyle, ciByArea]);

  // เมื่อ ciByArea เปลี่ยน ให้อัปเดตสีของ layers
  useEffect(() => {
    console.log("[useMapManager] ciByArea changed:", Object.keys(ciByArea).length, "keys | allLayers:", allLayers.length);
    if (allLayers.length > 0) {
      updateLayerColors();
    }
  }, [ciByArea, updateLayerColors, allLayers]);

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
    ciByArea,

    // Methods
    initializeMap,
    loadAndDisplayKML,
    clearAllLayers,
    fitToData,
    cleanup,
    updateResponsiveZoom,
    getResponsiveMinZoom,
    setCiByAreaData: setCiByArea,
    setColorsByAreaData: setColorsByArea,
    updateLayerColors,
  };
};
