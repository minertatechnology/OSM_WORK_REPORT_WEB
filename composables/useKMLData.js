import { useState, useCallback } from "react";
import * as toGeoJSON from "@mapbox/togeojson";

export const useKMLData = () => {
  const [dataCache, setDataCache] = useState({
    amphoe: {},
    tambon: {},
    kmlData: {},
  });
  const [loadStartTime, setLoadStartTime] = useState(0);
  const [currentLevel, setCurrentLevel] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Configuration สำหรับไฟล์ที่แยกแล้ว
  const dataConfig = {
    folderPaths: {
      province: "/split-provinces/",
      amphoe: "/split-amphoe/",
      tambon: "/split-tambon/",
      amphoeByProvince: "/split-amphoe/",
    },
    propertyMappings: {
      amphoe: {
        name: [
          "ADM2_TH",
          "AMPHOE_T",
          "amp_name_t",
          "amphoe_name",
          "name",
          "Name",
          "NAME",
        ],
        nameEn: ["ADM2_EN", "AMPHOE_E", "amp_name_e", "amphoe_name_en"],
      },
      tambon: {
        name: [
          "ADM3_TH",
          "TAMBON_T",
          "tam_name_t",
          "tambon_name",
          "name",
          "Name",
          "NAME",
        ],
        nameEn: ["ADM3_EN", "TAMBON_E", "tam_name_e", "tambon_name_en"],
      },
    },
  };

  // Helper function สำหรับหาค่าจาก property mappings
  const findPropertyValue = useCallback((properties, possibleKeys) => {
    for (const key of possibleKeys) {
      if (properties[key] && properties[key].toString().trim()) {
        return properties[key].toString().trim();
      }
    }
    return null;
  }, []);

  // Mapping ระหว่างชื่อจังหวัดภาษาอังกฤษและภาษาไทย
  const provinceMapping = {
    กระบี่: "Krabi",
    กรุงเทพมหานคร: "Bangkok",
    กาญจนบุรี: "Kanchanaburi",
    กาฬสินธุ์: "Kalasin",
    กำแพงเพชร: "Kamphaeng Phet",
    ขอนแก่น: "Khon Kaen",
    จันทบุรี: "Chanthaburi",
    ฉะเชิงเทรา: "Chachoengsao",
    ชลบุรี: "Chon Buri",
    ชัยนาท: "Chai Nat",
    ชัยภูมิ: "Chaiyaphum",
    ชุมพร: "Chumphon",
    เชียงราย: "Chiang Rai",
    เชียงใหม่: "Chiang Mai",
    ตรัง: "Trang",
    ตราด: "Trat",
    ตาก: "Tak",
    นครนายก: "Nakhon Nayok",
    นครปฐม: "Nakhon Pathom",
    นครพนม: "Nakhon Phanom",
    นครราชสีมา: "Nakhon Ratchasima",
    นครศรีธรรมราช: "Nakhon Si Thammarat",
    นครสวรรค์: "Nakhon Sawan",
    นนทบุรี: "Nonthaburi",
    นราธิวาส: "Narathiwat",
    น่าน: "Nan",
    บึงกาฬ: "Bueng Kan",
    บุรีรัมย์: "Buri Ram",
    ปทุมธานี: "Pathum Thani",
    ประจวบคีรีขันธ์: "Prachuap Khiri Khan",
    ปราจีนบุรี: "Prachin Buri",
    ปัตตานี: "Pattani",
    พระนครศรีอยุธยา: "Phra Nakhon Si Ayutthaya",
    พะเยา: "Phayao",
    พังงา: "Phangnga",
    พัทลุง: "Phatthalung",
    พิจิตร: "Phichit",
    พิษณุโลก: "Phitsanulok",
    เพชรบุรี: "Phetchaburi",
    เพชรบูรณ์: "Phetchabun",
    แพร่: "Phrae",
    ภูเก็ต: "Phuket",
    มหาสารคาม: "Maha Sarakham",
    มุกดาหาร: "Mukdahan",
    แม่ฮ่องสอน: "Mae Hong Son",
    ยะลา: "Yala",
    ยโสธร: "Yasothon",
    ร้อยเอ็ด: "Roi Et",
    ระนอง: "Ranong",
    ระยอง: "Rayong",
    ราชบุรี: "Ratchaburi",
    ลพบุรี: "Lop Buri",
    ลำปาง: "Lampang",
    ลำพูน: "Lamphun",
    เลย: "Loei",
    ศรีสะเกษ: "Si Sa Ket",
    สกลนคร: "Sakon Nakhon",
    สงขลา: "Songkhla",
    สตูล: "Satun",
    สมุทรปราการ: "Samut Prakan",
    สมุทรสงคราม: "Samut Songkhram",
    สมุทรสาคร: "Samut Sakhon",
    สระบุรี: "Saraburi",
    สระแก้ว: "Sa Kaeo",
    สิงห์บุรี: "Sing Buri",
    สุโขทัย: "Sukhothai",
    สุพรรณบุรี: "Suphan Buri",
    สุราษฎร์ธานี: "Surat Thani",
    สุรินทร์: "Surin",
    หนองคาย: "Nong Khai",
    หนองบัวลำภู: "Nong Bua Lam Phu",
    อำนาจเจริญ: "Amnat Charoen",
    อุดรธานี: "Udon Thani",
    อุตรดิตถ์: "Uttaradit",
    อุทัยธานี: "Uthai Thani",
    อุบลราชธานี: "Ubon Ratchathani",
    อ่างทอง: "Ang Thong",
    เมืองพัทยา: "Pattaya",
  };

  // ฟังก์ชันแปลงชื่อจังหวัดจากไทยเป็นอังกฤษ
  const getEnglishProvinceName = useCallback((thaiName) => {
    return provinceMapping[thaiName] || thaiName;
  }, []);

  // ฟังก์ชันแปลงชื่อจังหวัดจากอังกฤษเป็นไทย
  const getThaiProvinceName = useCallback((englishName) => {
    const entry = Object.entries(provinceMapping).find(
      ([thai, english]) => english === englishName
    );
    return entry ? entry[0] : englishName;
  }, []);

  // ฟังก์ชันสำหรับดึงรายชื่ออำเภอจาก folder structure
  const getAmphoeListFromFolder = useCallback(
    async (provinceName) => {
      // ตรวจสอบ cache ก่อน
      const cacheKey = `folder_amphoe_${provinceName}`;
      if (dataCache.amphoe[cacheKey]) {
        return dataCache.amphoe[cacheKey];
      }
      try {
        // แปลงชื่อจังหวัดเป็นภาษาอังกฤษ
        const englishProvinceName = getEnglishProvinceName(provinceName);
        // ดึงชื่อไฟล์อำเภอจาก API
        const response = await fetch(
          `/api/list-files?dir=split-amphoe/${englishProvinceName}`
        );
        if (!response.ok) throw new Error("ไม่สามารถอ่านรายชื่ออำเภอได้");
        const files = await response.json();
        // เฉพาะไฟล์ .kml
        const amphoeList = files
          .filter((f) => f.endsWith(".kml"))
          .map((f) => f.replace(/\.kml$/, ""));
        setDataCache((prev) => ({
          ...prev,
          amphoe: { ...prev.amphoe, [cacheKey]: amphoeList },
        }));
        return amphoeList;
      } catch (err) {
        console.error("getAmphoeListFromFolder error", err);
        return [];
      }
    },
    [dataCache.amphoe, getEnglishProvinceName]
  );

  // ฟังก์ชันสำหรับดึงรายชื่อตำบลจาก folder structure
  const getTambonListFromFolder = useCallback(
    async (provinceName, amphoeName) => {
      // ตรวจสอบ cache ก่อน
      const cacheKey = `folder_tambon_${provinceName}_${amphoeName}`;
      if (dataCache.tambon[cacheKey]) {
        return dataCache.tambon[cacheKey];
      }
      try {
        const englishProvinceName = getEnglishProvinceName(provinceName);
        const response = await fetch(
          `/api/list-files?dir=split-tambon/${englishProvinceName}/${amphoeName}`
        );
        if (!response.ok) throw new Error("ไม่สามารถอ่านรายชื่อตำบลได้");
        const files = await response.json();
        const tambonList = files
          .filter((f) => f.endsWith(".kml"))
          .map((f) => f.replace(/\.kml$/, ""));
        setDataCache((prev) => ({
          ...prev,
          tambon: { ...prev.tambon, [cacheKey]: tambonList },
        }));
        return tambonList;
      } catch (err) {
        console.error("getTambonListFromFolder error", err);
        return [];
      }
    },
    [dataCache.tambon, getEnglishProvinceName]
  );

  const getAmphoeListFromKML = useCallback(
    async (provinceName) => {
      // ตรวจสอบ cache ก่อน
      if (dataCache.amphoe[provinceName]) {
        console.log(`ใช้ข้อมูลจาก cache สำหรับจังหวัด: ${provinceName}`);
        return dataCache.amphoe[provinceName];
      }

      try {
        const fileName = `${provinceName}.kml`;
        const filePath = `${dataConfig.folderPaths.amphoe}${fileName}`;

        console.log(`กำลังโหลดไฟล์อำเภอ: ${filePath}`);

        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(
            `ไม่พบไฟล์: ${fileName} (Status: ${response.status})`
          );
        }

        const kmlText = await response.text();
        const parser = new DOMParser();
        const kmlDoc = parser.parseFromString(kmlText, "text/xml");

        // ตรวจสอบ parsing error
        const parserError = kmlDoc.querySelector("parsererror");
        if (parserError) {
          throw new Error(`XML parsing error: ${parserError.textContent}`);
        }

        // แปลง KML เป็น GeoJSON
        const geoJson = toGeoJSON.kml(kmlDoc);

        if (!geoJson || !geoJson.features) {
          throw new Error("ไม่พบ features ในไฟล์ KML");
        }

        // ดึงรายชื่ออำเภอจาก features
        const amphoeSet = new Set();

        geoJson.features.forEach((feature, index) => {
          const props = feature.properties;

          // Debug: แสดง properties ของ feature แรก
          if (index === 0) {
            console.log("Properties ของ feature แรก:", props);
            console.log("Available property keys:", Object.keys(props));
          }

          // หาชื่ออำเภอจาก property mappings
          const amphoeName = findPropertyValue(
            props,
            dataConfig.propertyMappings.amphoe.name
          );

          if (amphoeName) {
            const cleanName = amphoeName.toString().trim();
            amphoeSet.add(cleanName);

            // Debug: แสดงชื่อที่พบ
            if (index < 5) {
              console.log(`Feature ${index}: พบชื่ออำเภอ "${cleanName}"`);
            }
          } else if (index < 5) {
            console.warn(`Feature ${index}: ไม่พบชื่ออำเภอใน properties`);
          }
        });

        // แปลง Set เป็น Array และเรียงลำดับ
        const amphoeList = Array.from(amphoeSet).sort();

        // เก็บใน cache
        setDataCache((prev) => ({
          ...prev,
          amphoe: { ...prev.amphoe, [provinceName]: amphoeList },
        }));

        console.log(
          `สำเร็จ! พบ ${amphoeList.length} อำเภอในจังหวัด ${provinceName}:`
        );
        console.log(amphoeList);

        return amphoeList;
      } catch (error) {
        console.error(`Error loading amphoe list for ${provinceName}:`, error);
        return [];
      }
    },
    [dataCache.amphoe, findPropertyValue]
  );

  // ฟังก์ชันสำหรับดึงรายชื่อตำบลจากไฟล์ KML
  const getTambonListFromKML = useCallback(
    async (amphoeName) => {
      // ตรวจสอบ cache ก่อน
      if (dataCache.tambon[amphoeName]) {
        console.log(`ใช้ข้อมูลจาก cache สำหรับอำเภอ: ${amphoeName}`);
        return dataCache.tambon[amphoeName];
      }

      try {
        const fileName = `${amphoeName}.kml`;
        const filePath = `${dataConfig.folderPaths.tambon}${fileName}`;

        console.log(`กำลังโหลดไฟล์ตำบล: ${filePath}`);

        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(
            `ไม่พบไฟล์: ${fileName} (Status: ${response.status})`
          );
        }

        const kmlText = await response.text();
        const parser = new DOMParser();
        const kmlDoc = parser.parseFromString(kmlText, "text/xml");

        // ตรวจสอบ parsing error
        const parserError = kmlDoc.querySelector("parsererror");
        if (parserError) {
          throw new Error(`XML parsing error: ${parserError.textContent}`);
        }

        // แปลง KML เป็น GeoJSON
        const geoJson = toGeoJSON.kml(kmlDoc);

        if (!geoJson || !geoJson.features) {
          throw new Error("ไม่พบ features ในไฟล์ KML");
        }

        // ดึงรายชื่อตำบลจาก features
        const tambonSet = new Set();

        geoJson.features.forEach((feature, index) => {
          const props = feature.properties;

          // Debug: แสดง properties ของ feature แรก
          if (index === 0) {
            console.log("Properties ของ feature แรก:", props);
            console.log("Available property keys:", Object.keys(props));
          }

          // หาชื่อตำบลจาก property mappings
          const tambonName = findPropertyValue(
            props,
            dataConfig.propertyMappings.tambon.name
          );

          if (tambonName) {
            const cleanName = tambonName.toString().trim();
            tambonSet.add(cleanName);

            // Debug: แสดงชื่อที่พบ
            if (index < 5) {
              console.log(`Feature ${index}: พบชื่อตำบล "${cleanName}"`);
            }
          } else if (index < 5) {
            console.warn(`Feature ${index}: ไม่พบชื่อตำบลใน properties`);
          }
        });

        // แปลง Set เป็น Array และเรียงลำดับ
        const tambonList = Array.from(tambonSet).sort();

        // เก็บใน cache
        setDataCache((prev) => ({
          ...prev,
          tambon: { ...prev.tambon, [amphoeName]: tambonList },
        }));

        console.log(
          `สำเร็จ! พบ ${tambonList.length} ตำบลในอำเภอ ${amphoeName}:`
        );
        console.log(tambonList);

        return tambonList;
      } catch (error) {
        console.error(`Error loading tambon list for ${amphoeName}:`, error);
        return [];
      }
    },
    [dataCache.tambon, findPropertyValue]
  );

  // ฟังก์ชันสำหรับโหลดข้อมูล KML
  const loadKMLData = useCallback(
    async (level, name) => {
      const cacheKey = `${level}_${name}`;

      // ตรวจสอบ cache ก่อน
      if (dataCache.kmlData[cacheKey]) {
        console.log(`ใช้ข้อมูล KML จาก cache สำหรับ: ${level} - ${name}`);
        return dataCache.kmlData[cacheKey];
      }

      try {
        const fileName = `${name}.kml`;
        const filePath = `${dataConfig.folderPaths[level]}${fileName}`;

        console.log(`กำลังโหลดไฟล์ KML: ${filePath}`);

        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(
            `ไม่พบไฟล์: ${fileName} (Status: ${response.status})`
          );
        }

        const kmlText = await response.text();
        const parser = new DOMParser();
        const kmlDoc = parser.parseFromString(kmlText, "text/xml");

        // ตรวจสอบ parsing error
        const parserError = kmlDoc.querySelector("parsererror");
        if (parserError) {
          throw new Error(`XML parsing error: ${parserError.textContent}`);
        }

        // แปลง KML เป็น GeoJSON
        const geoJson = toGeoJSON.kml(kmlDoc);

        if (!geoJson || !geoJson.features) {
          throw new Error("ไม่พบ features ในไฟล์ KML");
        }

        // เก็บใน cache
        setDataCache((prev) => ({
          ...prev,
          kmlData: { ...prev.kmlData, [cacheKey]: geoJson },
        }));

        console.log(
          `โหลด KML สำเร็จ: ${level} - ${name} (${geoJson.features.length} features)`
        );

        return geoJson;
      } catch (error) {
        console.error(`Error loading KML data for ${level} - ${name}:`, error);
        throw error;
      }
    },
    [dataCache.kmlData]
  );

  // ฟังก์ชันสำหรับดึงรายชื่อจังหวัดที่มีข้อมูล
  const getAvailableProvinces = useCallback(async () => {
    return [
      "กระบี่",
      "กรุงเทพมหานคร",
      "กาญจนบุรี",
      "กาฬสินธุ์",
      "กำแพงเพชร",
      "ขอนแก่น",
      "จันทบุรี",
      "ฉะเชิงเทรา",
      "ชลบุรี",
      "ชัยนาท",
      "ชัยภูมิ",
      "ชุมพร",
      "เชียงราย",
      "เชียงใหม่",
      "ตรัง",
      "ตราด",
      "ตาก",
      "นครนายก",
      "นครปฐม",
      "นครพนม",
      "นครราชสีมา",
      "นครศรีธรรมราช",
      "นครสวรรค์",
      "นนทบุรี",
      "นราธิวาส",
      "น่าน",
      "บึงกาฬ",
      "บุรีรัมย์",
      "ปทุมธานี",
      "ประจวบคีรีขันธ์",
      "ปราจีนบุรี",
      "ปัตตานี",
      "พระนครศรีอยุธยา",
      "พะเยา",
      "พังงา",
      "พัทลุง",
      "พิจิตร",
      "พิษณุโลก",
      "เพชรบุรี",
      "เพชรบูรณ์",
      "แพร่",
      "ภูเก็ต",
      "มหาสารคาม",
      "มุกดาหาร",
      "แม่ฮ่องสอน",
      "ยะลา",
      "ยโสธร",
      "ร้อยเอ็ด",
      "ระนอง",
      "ระยอง",
      "ราชบุรี",
      "ลพบุรี",
      "ลำปาง",
      "ลำพูน",
      "เลย",
      "ศรีสะเกษ",
      "สกลนคร",
      "สงขลา",
      "สตูล",
      "สมุทรปราการ",
      "สมุทรสงคราม",
      "สมุทรสาคร",
      "สระบุรี",
      "สระแก้ว",
      "สิงห์บุรี",
      "สุโขทัย",
      "สุพรรณบุรี",
      "สุราษฎร์ธานี",
      "สุรินทร์",
      "หนองคาย",
      "หนองบัวลำภู",
      "อำนาจเจริญ",
      "อุดรธานี",
      "อุตรดิตถ์",
      "อุทัยธานี",
      "อุบลราชธานี",
      "อ่างทอง",
      "เมืองพัทยา",
    ];
  }, []);

  // ฟังก์ชันสำหรับล้าง cache
  const clearDataCache = useCallback(
    (type = "all") => {
      if (type === "all") {
        setDataCache({
          amphoe: {},
          tambon: {},
          kmlData: {},
        });
        console.log("ล้าง cache ทั้งหมดแล้ว");
      } else if (dataCache[type]) {
        setDataCache((prev) => ({
          ...prev,
          [type]: {},
        }));
        console.log(`ล้าง ${type} cache แล้ว`);
      }
    },
    [dataCache]
  );

  return {
    // State
    dataCache,
    loadStartTime,
    currentLevel,
    isLoading,

    // Methods
    getAmphoeListFromKML,
    getTambonListFromKML,
    getAmphoeListFromFolder,
    getTambonListFromFolder,
    loadKMLData,
    getAvailableProvinces,
    clearDataCache,
    findPropertyValue,
    getEnglishProvinceName,
    getThaiProvinceName,
  };
};
