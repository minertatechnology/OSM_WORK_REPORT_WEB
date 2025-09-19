import { useState, useMemo, useCallback } from 'react';

// ข้อมูลจังหวัดตัวอย่าง (ในการใช้งานจริงควรดึงจาก API หรือฐานข้อมูล)
const provinces = [
  { id: 1, name: 'กรุงเทพมหานคร', code: '10' },
  { id: 2, name: 'เชียงใหม่', code: '50' },
  { id: 3, name: 'เชียงราย', code: '57' },
  { id: 4, name: 'นครปฐม', code: '73' },
  { id: 5, name: 'นนทบุรี', code: '12' },
  { id: 6, name: 'ปทุมธานี', code: '13' },
  { id: 7, name: 'สมุทรปราการ', code: '11' },
  { id: 8, name: 'ภูเก็ต', code: '83' },
  { id: 9, name: 'สงขลา', code: '90' },
  { id: 10, name: 'ขอนแก่น', code: '40' }
];

// ข้อมูลอำเภอตัวอย่าง
const districts = [
  // กรุงเทพมหานคร
  { id: 1, name: 'พระนคร', provinceId: 1, code: '1001' },
  { id: 2, name: 'ดุสิต', provinceId: 1, code: '1002' },
  { id: 3, name: 'หนองจอก', provinceId: 1, code: '1003' },
  { id: 4, name: 'บางรัก', provinceId: 1, code: '1004' },
  { id: 5, name: 'บางเขน', provinceId: 1, code: '1005' },
  
  // เชียงใหม่
  { id: 6, name: 'เมืองเชียงใหม่', provinceId: 2, code: '5001' },
  { id: 7, name: 'จอมทอง', provinceId: 2, code: '5002' },
  { id: 8, name: 'แม่ริม', provinceId: 2, code: '5003' },
  { id: 9, name: 'สะเมิง', provinceId: 2, code: '5004' },
  
  // เชียงราย
  { id: 10, name: 'เมืองเชียงราย', provinceId: 3, code: '5701' },
  { id: 11, name: 'แม่สาย', provinceId: 3, code: '5702' },
  
  // นครปฐม
  { id: 12, name: 'เมืองนครปฐม', provinceId: 4, code: '7301' },
  { id: 13, name: 'กำแพงแสน', provinceId: 4, code: '7302' },
  
  // นนทบุรี
  { id: 14, name: 'เมืองนนทบุรี', provinceId: 5, code: '1201' },
  { id: 15, name: 'บางใหญ่', provinceId: 5, code: '1202' },
  
  // ปทุมธานี
  { id: 16, name: 'เมืองปทุมธานี', provinceId: 6, code: '1301' },
  { id: 17, name: 'คลองหลวง', provinceId: 6, code: '1302' }
];

// ข้อมูลตำบลตัวอย่าง
const subdistricts = [
  // พระนคร
  { id: 1, name: 'พระบรมมหาราชวัง', districtId: 1, code: '100101', zipCode: '10200' },
  { id: 2, name: 'วัดราชบพิธ', districtId: 1, code: '100102', zipCode: '10200' },
  { id: 3, name: 'สำราญราษฎร์', districtId: 1, code: '100103', zipCode: '10200' },
  
  // ดุสิต
  { id: 4, name: 'ดุสิต', districtId: 2, code: '100201', zipCode: '10300' },
  { id: 5, name: 'วชิรพยาบาล', districtId: 2, code: '100202', zipCode: '10300' },
  
  // เมืองเชียงใหม่
  { id: 6, name: 'ศรีภูมิ', districtId: 6, code: '500101', zipCode: '50200' },
  { id: 7, name: 'พระสิงห์', districtId: 6, code: '500102', zipCode: '50200' },
  { id: 8, name: 'หายยา', districtId: 6, code: '500103', zipCode: '50100' },
  
  // เมืองเชียงราย
  { id: 9, name: 'ในเวียง', districtId: 10, code: '570101', zipCode: '57000' },
  { id: 10, name: 'เวียง', districtId: 10, code: '570102', zipCode: '57000' }
];

export const useThaiAddresses = () => {
  const [selectedProvinceId, setSelectedProvinceId] = useState(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState(null);
  const [selectedSubdistrictId, setSelectedSubdistrictId] = useState(null);

  // Get all provinces
  const getProvinces = useCallback(() => provinces, []);

  // Get districts by province ID
  const getDistricts = useMemo(() => {
    if (!selectedProvinceId) return [];
    return districts.filter(district => district.provinceId === selectedProvinceId);
  }, [selectedProvinceId]);

  // Get subdistricts by district ID
  const getSubdistricts = useMemo(() => {
    if (!selectedDistrictId) return [];
    return subdistricts.filter(subdistrict => subdistrict.districtId === selectedDistrictId);
  }, [selectedDistrictId]);

  // Get selected province
  const selectedProvince = useMemo(() => {
    if (!selectedProvinceId) return null;
    return provinces.find(province => province.id === selectedProvinceId) || null;
  }, [selectedProvinceId]);

  // Get selected district
  const selectedDistrict = useMemo(() => {
    if (!selectedDistrictId) return null;
    return districts.find(district => district.id === selectedDistrictId) || null;
  }, [selectedDistrictId]);

  // Get selected subdistrict
  const selectedSubdistrict = useMemo(() => {
    if (!selectedSubdistrictId) return null;
    return subdistricts.find(subdistrict => subdistrict.id === selectedSubdistrictId) || null;
  }, [selectedSubdistrictId]);

  // Reset dependent dropdowns when parent changes
  const selectProvince = useCallback((provinceId) => {
    setSelectedProvinceId(provinceId);
    setSelectedDistrictId(null);
    setSelectedSubdistrictId(null);
  }, []);

  const selectDistrict = useCallback((districtId) => {
    setSelectedDistrictId(districtId);
    setSelectedSubdistrictId(null);
  }, []);

  const selectSubdistrict = useCallback((subdistrictId) => {
    setSelectedSubdistrictId(subdistrictId);
  }, []);

  // Get complete address string
  const completeAddress = useMemo(() => {
    const parts = [];
    if (selectedSubdistrict) parts.push(`ตำบล${selectedSubdistrict.name}`);
    if (selectedDistrict) parts.push(`อำเภอ${selectedDistrict.name}`);
    if (selectedProvince) parts.push(`จังหวัด${selectedProvince.name}`);
    return parts.join(' ');
  }, [selectedSubdistrict, selectedDistrict, selectedProvince]);

  return {
    // State
    selectedProvinceId,
    selectedDistrictId,
    selectedSubdistrictId,

    // Computed
    provinces: getProvinces(),
    districts: getDistricts,
    subdistricts: getSubdistricts,
    selectedProvince,
    selectedDistrict,
    selectedSubdistrict,
    completeAddress,

    // Methods
    selectProvince,
    selectDistrict,
    selectSubdistrict
  };
};