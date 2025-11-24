import { useState, useCallback, useRef, useEffect } from "react";
import { useHealthRegions } from "./useHealthRegions";

export const useMapManager = () => {
  const [allLayers, setAllLayers] = useState([]);
  const [loadedFiles, setLoadedFiles] = useState(0);
  const [currentLevel, setCurrentLevel] = useState("");
  const [loadStartTime, setLoadStartTime] = useState(0);
  const mapRef = useRef(null);

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

  // Configuration
  const config = {
    colors: PROVINCE_COLORS, // ใช้สีที่หลากหลายสำหรับแต่ละจังหวัด
    defaultCenter: [13.7563, 100.5018],
    defaultZoom: 6,
  };

  // เริ่มต้นแผนที่
  const initializeMap = useCallback(async (mapContainer) => {
    if (!mapContainer) return;
    if (typeof window === "undefined") return; // Guard for SSR

    // ตรวจสอบว่าแผนที่ถูกสร้างแล้วหรือยัง
    if (mapRef.current) {
      console.log("Map already initialized, cleaning up first");
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Import Leaflet dynamically
    const L = await import("leaflet");

    // ตั้งค่า Leaflet icons ก่อน
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });

    mapRef.current = L.map(mapContainer, {
      center: config.defaultCenter,
      zoom: config.defaultZoom,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapRef.current);

    // Force map to render properly
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 100);
  }, []);

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

  // กำหนดสีของ feature - แต่ละพื้นที่ใช้สีที่แตกต่างกันชัดเจน
  // ใช้ hash จากชื่อเพื่อให้สีตรงกับ chart
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

      if (name) {
        // ใช้ hash จากชื่อพื้นที่เพื่อสร้างสีที่ไม่ซ้ำกัน
        const hash = hashString(name);
        return generateColor(hash);
      }

      // ถ้าไม่เจอชื่อ ใช้สีเทา
      return "#E5E5E5";
    },
    [findPropertyValue, hashString, generateColor]
  );

  // กำหนดสไตล์ของ feature
  const getFeatureStyle = useCallback(
    (feature) => {
      const color = getFeatureColor(feature);
      const geometryType = feature.geometry.type;

      const baseStyle = {
        color: color,
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.4,
      };

      switch (geometryType) {
        case "Polygon":
        case "MultiPolygon":
          return { ...baseStyle, fillColor: color, fillOpacity: 0.3 };
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
      return L.circleMarker(latlng, {
        radius: 8,
        fillColor: color,
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
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

  // ปรับมุมมองแผนที่ให้เหมาะสมกับข้อมูล
  const fitToData = useCallback(() => {
    if (!mapRef.current || allLayers.length === 0) {
      console.warn("ไม่มีข้อมูลให้แสดง");
      return;
    }

    const group = L.featureGroup(allLayers);
    mapRef.current.fitBounds(group.getBounds(), { padding: [20, 20] });
  }, [allLayers]);

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
    async (geoJsonData, level, updateStatus) => {
      if (!mapRef.current) return;

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
        if (newLayers && newLayers.length > 0) {
          const group = L.featureGroup(newLayers);
          mapRef.current.fitBounds(group.getBounds(), { padding: [20, 20] });
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

  return {
    // State
    map: mapRef.current,
    allLayers,
    loadedFiles,
    currentLevel,
    loadStartTime,

    // Methods
    initializeMap,
    loadAndDisplayKML,
    clearAllLayers,
    fitToData,
    cleanup,
  };
};
