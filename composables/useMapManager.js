import { useState, useCallback, useRef, useEffect } from "react";

export const useMapManager = () => {
  const [allLayers, setAllLayers] = useState([]);
  const [loadedFiles, setLoadedFiles] = useState(0);
  const [currentLevel, setCurrentLevel] = useState("");
  const [loadStartTime, setLoadStartTime] = useState(0);
  const mapRef = useRef(null);

  // Configuration
  const config = {
    colors: [
      "#ff7800",
      "#00ff78",
      "#7800ff",
      "#ff0078",
      "#78ff00",
      "#0078ff",
      "#ff7878",
      "#78ff78",
      "#7878ff",
      "#ffff78",
      "#ff78ff",
      "#78ffff",
    ],
    defaultCenter: [13.7563, 100.5018],
    defaultZoom: 6,
  };

  // เริ่มต้นแผนที่
  const initializeMap = useCallback((mapContainer) => {
    if (!mapContainer) return;

    // ตรวจสอบว่าแผนที่ถูกสร้างแล้วหรือยัง
    if (mapRef.current) {
      console.log("Map already initialized, cleaning up first");
      mapRef.current.remove();
      mapRef.current = null;
    }

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

  // ฟังก์ชันสำหรับสร้าง hash จาก string
  const hashString = useCallback((str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }, []);

  // กำหนดสีของ feature
  const getFeatureColor = useCallback(
    (feature) => {
      const properties = feature.properties || {};

      // ใช้ชื่อจาก properties เพื่อกำหนดสี
      const name = findPropertyValue(properties, [
        "name",
        "Name",
        "NAME",
        "ADM2_TH",
        "ADM3_TH",
        "AMPHOE_T",
        "TAMBON_T",
      ]);
      const hash = hashString(name || "default");
      const colorIndex = hash % config.colors.length;

      return config.colors[colorIndex];
    },
    [findPropertyValue, hashString]
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
