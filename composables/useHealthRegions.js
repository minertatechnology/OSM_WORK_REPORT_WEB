import { useState, useCallback } from "react";

export const useHealthRegions = () => {
  const [selectedHealthRegion, setSelectedHealthRegion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ข้อมูลเขตสุขภาพทั้ง 13 เขต
  const healthRegions = {
    "เขตสุขภาพที่ 1": [
      "เชียงใหม่",
      "ลำพูน",
      "ลำปาง",
      "แม่ฮ่องสอน"
    ],
    "เขตสุขภาพที่ 2": [
      "เชียงราย",
      "พะเยา",
      "แพร่",
      "น่าน",
      "อุตรดิตถ์"
    ],
    "เขตสุขภาพที่ 3": [
      "พิษณุโลก",
      "สุโขทัย",
      "เพชรบูรณ์",
      "พิจิตร",
      "กำแพงเพชร"
    ],
    "เขตสุขภาพที่ 4": [
      "นนทบุรี",
      "ปทุมธานี",
      "พระนครศรีอยุธยา",
      "สระบุรี",
      "ลพบุรี",
      "สิงห์บุรี",
      "อ่างทอง",
      "นครนายก"
    ],
    "เขตสุขภาพที่ 5": [
      "นครปฐม",
      "สมุทรสาคร",
      "สมุทรสงคราม",
      "ราชบุรี",
      "กาญจนบุรี",
      "สุพรรณบุรี"
    ],
    "เขตสุขภาพที่ 6": [
      "ชลบุรี",
      "ระยอง",
      "จันทบุรี",
      "ตราด",
      "ฉะเชิงเทรา",
      "ปราจีนบุรี",
      "สระแก้ว"
    ],
    "เขตสุขภาพที่ 7": [
      "ขอนแก่น",
      "ร้อยเอ็ด",
      "มหาสารคาม",
      "กาฬสินธุ์"
    ],
    "เขตสุขภาพที่ 8": [
      "อุดรธานี",
      "หนองบัวลำภู",
      "หนองคาย",
      "เลย",
      "บึงกาฬ"
    ],
    "เขตสุขภาพที่ 9": [
      "นครราชสีมา",
      "ชัยภูมิ",
      "บุรีรัมย์",
      "สุรินทร์"
    ],
    "เขตสุขภาพที่ 10": [
      "อุบลราชธานี",
      "ยโสธร",
      "ศรีสะเกษ",
      "อำนาจเจริญ",
      "มุกดาหาร"
    ],
    "เขตสุขภาพที่ 11": [
      "นครศรีธรรมราช",
      "สุราษฎร์ธานี",
      "ชุมพร",
      "ระนอง",
      "กระบี่",
      "พังงา",
      "ภูเก็ต"
    ],
    "เขตสุขภาพที่ 12": [
      "สงขลา",
      "สตูล",
      "ตรัง",
      "พัทลุง",
      "ปัตตานี",
      "ยะลา",
      "นราธิวาส"
    ],
    "เขตสุขภาพที่ 13": [
      "กรุงเทพมหานคร"
    ]
  };

  // ฟังก์ชันสำหรับดึงรายชื่อเขตสุขภาพทั้งหมด
  const getHealthRegionsList = useCallback(() => {
    return Object.keys(healthRegions);
  }, []);

  // ฟังก์ชันสำหรับดึงจังหวัดในเขตสุขภาพที่เลือก
  const getProvincesInRegion = useCallback((regionName) => {
    return healthRegions[regionName] || [];
  }, []);

  // ฟังก์ชันสำหรับหาเขตสุขภาพของจังหวัด
  const getHealthRegionByProvince = useCallback((provinceName) => {
    for (const [region, provinces] of Object.entries(healthRegions)) {
      if (provinces.includes(provinceName)) {
        return region;
      }
    }
    return null;
  }, []);

  // ฟังก์ชันสำหรับโหลดข้อมูลแผนที่ตามเขตสุขภาพ
  const loadHealthRegionData = useCallback(async (regionName) => {
    setIsLoading(true);
    try {
      const provinces = getProvincesInRegion(regionName);
      const regionData = {
        name: regionName,
        provinces: provinces,
        provinceCount: provinces.length
      };

      console.log(`โหลดข้อมูล ${regionName}:`, regionData);
      return regionData;
    } catch (error) {
      console.error("Error loading health region data:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [getProvincesInRegion]);

  // ฟังก์ชันสำหรับเลือกเขตสุขภาพ
  const selectHealthRegion = useCallback((regionName) => {
    setSelectedHealthRegion(regionName);
  }, []);

  // ฟังก์ชันสำหรับล้างการเลือก
  const clearHealthRegionSelection = useCallback(() => {
    setSelectedHealthRegion("");
  }, []);

  return {
    // State
    selectedHealthRegion,
    isLoading,
    healthRegions,

    // Methods
    getHealthRegionsList,
    getProvincesInRegion,
    getHealthRegionByProvince,
    loadHealthRegionData,
    selectHealthRegion,
    clearHealthRegionSelection,
  };
};