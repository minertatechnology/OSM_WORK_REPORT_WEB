import { useState, useCallback } from "react";
import { HEALTHZONE_PROVINCES } from "../utils/healthzone-province-data";

const HEALTH_REGIONS = Object.fromEntries(
  HEALTHZONE_PROVINCES.map((z) => [z.zoneName, z.provinces])
);

export const useHealthRegions = () => {
  const [selectedHealthRegion, setSelectedHealthRegion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ข้อมูลเขตสุขภาพทั้ง 13 เขต — ใช้ตารางกลางชุดเดียวกับหน้าอื่น (เดิมฮาร์ดโค้ดแยกไว้และจับคู่จังหวัดผิดเขต)
  const healthRegions = HEALTH_REGIONS;

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