import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUserPermission } from '@context/UserPermissionProvider';
import {
  getHealthAreas,
  getProvinces,
  getDistricts,
  getSubdistricts,
  getVillages,
  getHealthServices,
} from '@services/lookupService';
import { HEALTHZONE_PROVINCES } from '@utils/healthzone-province-data';

/**
 * Hook สำหรับจัดการ filters ที่มี permission control
 * @param {Object} options - { onFilterChange, defaultYear, defaultYearType, includeWeek }
 * @returns {Object}
 */
export const usePermissionFilters = (options = {}) => {
  const {
    scope,
    lockLevel,
    isLocked,
    canClearFilter,
    canChangeFilter,
    getInitialFilters,
    loading: permissionLoading,
  } = useUserPermission();

  const { defaultYear = '', defaultYearType = 'fiscal', includeWeek = false } = options;

  const [yearType, setYearType] = useState(defaultYearType);
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState('');
  const [week, setWeek] = useState('');
  const [zone, setZone] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [subdistrict, setSubdistrict] = useState('');
  const [village, setVillage] = useState('');
  const [service, setService] = useState('');
  const [keyword, setKeyword] = useState('');

  // ✅ Track whether initial locked values have been set (prevents reset on province change)
  const [initialValuesSet, setInitialValuesSet] = useState(false);

  // Location data
  const [healthAreas, setHealthAreas] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [healthServices, setHealthServices] = useState([]);

  // Load health areas
  useEffect(() => {
    const loadHealthAreas = async () => {
      try {
        const data = await getHealthAreas({ limit: 100 });
        const sortedData = (data || []).sort((a, b) => {
          const numA = parseInt(a.code.replace('HA', ''));
          const numB = parseInt(b.code.replace('HA', ''));
          return numA - numB;
        });
        setHealthAreas(sortedData);
      } catch (error) {
        console.error('Failed to load health areas:', error);
        setHealthAreas([]);
      }
    };
    loadHealthAreas();
  }, []);

  // Load provinces when zone changes
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        // ✅ Special case: If province is locked, load ALL provinces
        // This handles cases where the user's province is not in their assigned health area
        // (e.g., API data inconsistency: health_area_id doesn't match province_id)
        const isProvinceLocked = isLocked('province');

        if (!zone) {
          // ไม่ได้เลือกเขต - โหลดจังหวัดทั้งหมด
          console.log('📍 Loading all provinces (no zone selected)');
          const data = await getProvinces({ limit: 100 });
          setProvinces(data || []);
          console.log('📍 Loaded provinces:', data?.length, 'items');
        } else if (isProvinceLocked) {
          // ✅ Province is locked - load ALL provinces (don't filter by zone)
          // This ensures the locked province is always available
          console.log('📍 Province is locked, loading ALL provinces (no zone filter)');
          const data = await getProvinces({ limit: 100 });
          setProvinces(data || []);
          console.log('📍 Loaded all provinces (province locked):', data?.length, 'items');
        } else {
          // เลือกเขตแล้วและ province ไม่ได้ lock - ใช้ข้อมูลจาก HEALTHZONE_PROVINCES
          // แปลง zone code (เช่น "HA1", "HA12") เป็นเลขเขต (1, 12)
          const zoneNumber = parseInt(String(zone).replace(/\D/g, ''));
          console.log('📍 Zone selected, loading provinces for zone:', zone, 'zoneNumber:', zoneNumber);

          // หาข้อมูลเขตจาก HEALTHZONE_PROVINCES
          const zoneData = HEALTHZONE_PROVINCES.find(z => z.zone === zoneNumber);

          if (zoneData && zoneData.provinces) {
            // ดึงชื่อจังหวัดที่อยู่ในเขตนี้
            const provinceNamesInZone = zoneData.provinces.map(p => p.trim());
            console.log('📍 Province names in zone:', provinceNamesInZone);

            // โหลดจังหวัดทั้งหมด แล้วกรองเอาเฉพาะที่อยู่ในเขต
            const allProvinces = await getProvinces({ limit: 100 });
            const filteredProvinces = allProvinces.filter(p =>
              provinceNamesInZone.includes(p.name_th?.trim())
            );
            setProvinces(filteredProvinces);
            console.log('📍 Filtered provinces:', filteredProvinces?.length, 'items');
          } else {
            console.warn('📍 No zone data found for zone:', zone);
            setProvinces([]);
          }
        }
      } catch (error) {
        console.error('Failed to load provinces:', error);
        setProvinces([]);
      }
    };
    loadProvinces();
  }, [zone, healthAreas, isLocked]);

  // Load districts when province changes
  useEffect(() => {
    const loadDistricts = async () => {
      if (!province) {
        setDistricts([]);
        return;
      }
      try {
        const data = await getDistricts(province);
        setDistricts(data || []);
      } catch (error) {
        console.error('Failed to load districts:', error);
        setDistricts([]);
      }
    };
    loadDistricts();
  }, [province]);

  // Load subdistricts when district changes
  useEffect(() => {
    const loadSubdistricts = async () => {
      if (!district) {
        setSubdistricts([]);
        return;
      }
      try {
        const data = await getSubdistricts(district);
        setSubdistricts(data || []);
      } catch (error) {
        console.error('Failed to load subdistricts:', error);
        setSubdistricts([]);
      }
    };
    loadSubdistricts();
  }, [district]);

  // Load villages when subdistrict changes
  useEffect(() => {
    const loadVillages = async () => {
      if (!subdistrict) {
        setVillages([]);
        return;
      }
      try {
        const data = await getVillages(subdistrict);
        setVillages(data || []);
      } catch (error) {
        console.error('Failed to load villages:', error);
        setVillages([]);
      }
    };
    loadVillages();
  }, [subdistrict]);

  // Load health services when province/district/subdistrict changes
  useEffect(() => {
    const loadHealthServices = async () => {
      if (!province) {
        setHealthServices([]);
        return;
      }
      try {
        const params = {
          province_code: province,
          ...(district && { district_code: district }),
          ...(subdistrict && { subdistrict_code: subdistrict }),
        };
        const data = await getHealthServices(params);
        setHealthServices(data || []);
      } catch (error) {
        console.error('Failed to load health services:', error);
        setHealthServices([]);
      }
    };
    loadHealthServices();
  }, [province, district, subdistrict]);

  // ✅ Initialize zone first (triggers loading of provinces)
  useEffect(() => {
    if (!permissionLoading && scope) {
      // ⚠️ ถ้าเป็นสิทธิ์สูงสุด (สบส) ไม่ต้อง set ค่าเริ่มต้น ให้เลือกเอง
      if (lockLevel === 'none') {
        console.log('🔓 Lock level is none - not setting initial values');
        return;
      }

      const initialFilters = getInitialFilters();
      console.log('🔒 Initial filters:', initialFilters);
      console.log('🔒 Lock level:', lockLevel);

      // Set zone first - this will trigger the provinces loading effect
      if (initialFilters.zone) {
        console.log('🔒 Setting locked zone:', initialFilters.zone);
        setZone(initialFilters.zone);
      }
    }
  }, [permissionLoading, scope, lockLevel, getInitialFilters]);

  // ✅ Initialize province/district/subdistrict AFTER location data is loaded
  // This ensures the dropdown can find the correct option to display
  useEffect(() => {
    if (!permissionLoading && scope) {
      if (lockLevel === 'none' || lockLevel === 'zone') {
        setInitialValuesSet(true);
        return;
      }

      const initialFilters = getInitialFilters();

      // ✅ Set locked values only when needed:
      // 1. First time (!initialValuesSet)
      // 2. After zone change (when the value is empty)
      const shouldSetProvince = initialFilters.province &&
        provinces.length > 0 &&
        !province;

      const shouldSetDistrict = initialFilters.district &&
        districts.length > 0 &&
        !district;

      const shouldSetSubdistrict = initialFilters.subdistrict &&
        subdistricts.length > 0 &&
        !subdistrict;

      // Set province after provinces are loaded
      if (shouldSetProvince) {
        console.log('🔒 Setting locked province:', initialFilters.province, initialFilters.province_name_th);
        console.log('📋 Available provinces:', provinces.map(p => ({ code: p.code, id: p.id, name: p.name_th })));

        // Try to find matching province by code or id
        const matchingProvince = provinces.find(p =>
          String(p.code || p.id) === String(initialFilters.province) ||
          String(p.code || p.id) === String(initialFilters.province_id)
        );

        if (matchingProvince) {
          const provinceCode = String(matchingProvince.code || matchingProvince.id);
          console.log('✅ Found province by code/id:', matchingProvince);
          setProvince(provinceCode);
        } else {
          // If not found, try to match by name
          const nameMatch = provinces.find(p =>
            p.name_th === initialFilters.province_name_th ||
            p.name === initialFilters.province_name_th
          );
          if (nameMatch) {
            console.log('✅ Found province by name:', nameMatch);
            setProvince(String(nameMatch.code || nameMatch.id));
          } else {
            console.warn('❌ Could not find province:', initialFilters);
          }
        }
      }

      // Set district after districts are loaded
      if (shouldSetDistrict) {
        console.log('🔒 Setting locked district:', initialFilters.district);
        setDistrict(initialFilters.district);
      }

      // Set subdistrict after subdistricts are loaded
      if (shouldSetSubdistrict) {
        console.log('🔒 Setting locked subdistrict:', initialFilters.subdistrict);
        setSubdistrict(initialFilters.subdistrict);
      }

      // Set service independently (only set once, not dependent on location loading)
      if (initialFilters.service && !initialValuesSet) {
        console.log('🔒 Setting locked service:', initialFilters.service);
        setService(initialFilters.service);
      }

      // ✅ Mark that initial values have been set
      setInitialValuesSet(true);
    }
  }, [permissionLoading, scope, lockLevel, getInitialFilters, provinces, districts, subdistricts, initialValuesSet, province, district, subdistrict]);

  // Notify parent of filter changes
  useEffect(() => {
    if (options.onFilterChange) {
      options.onFilterChange({
        yearType,
        year,
        month,
        week,
        zone,
        province,
        district,
        subdistrict,
        village,
        service,
        keyword,
      });
    }
  }, [yearType, year, month, week, zone, province, district, subdistrict, village, service, keyword]);

  /**
   * Handle zone change - only if not locked
   */
  const handleZoneChange = useCallback((value) => {
    if (canChangeFilter('zone')) {
      setZone(value);
      // Reset dependent filters
      if (canChangeFilter('province')) setProvince('');
      if (canChangeFilter('district')) setDistrict('');
      if (canChangeFilter('subdistrict')) setSubdistrict('');
      if (canChangeFilter('service')) setService('');
    }
  }, [canChangeFilter]);

  /**
   * Handle province change - only if not locked
   */
  const handleProvinceChange = useCallback((value) => {
    if (canChangeFilter('province')) {
      setProvince(value);
      // Reset dependent filters
      if (canChangeFilter('district')) setDistrict('');
      if (canChangeFilter('subdistrict')) setSubdistrict('');
      if (canChangeFilter('service')) setService('');
    }
  }, [canChangeFilter]);

  /**
   * Handle district change - only if not locked
   */
  const handleDistrictChange = useCallback((value) => {
    if (canChangeFilter('district')) {
      setDistrict(value);
      // Reset dependent filters
      if (canChangeFilter('subdistrict')) setSubdistrict('');
      if (canChangeFilter('service')) setService('');
    }
  }, [canChangeFilter]);

  /**
   * Handle subdistrict change - only if not locked
   */
  const handleSubdistrictChange = useCallback((value) => {
    if (canChangeFilter('subdistrict')) {
      setSubdistrict(value);
      // Reset dependent filters
      setVillage('');
      if (canChangeFilter('service')) setService('');
    }
  }, [canChangeFilter]);

  /**
   * Handle village change
   */
  const handleVillageChange = useCallback((value) => {
    setVillage(value);
  }, []);

  /**
   * Handle service change - only if not locked
   */
  const handleServiceChange = useCallback((value) => {
    if (canChangeFilter('service')) {
      setService(value);
    }
  }, [canChangeFilter]);

  /**
   * Reset all filters - respecting locked fields
   */
  const handleReset = useCallback((defaultYear = '', defaultYearType = 'fiscal') => {
    setYearType(defaultYearType);
    setYear(defaultYear);
    setMonth('');
    setWeek('');
    setKeyword('');
    setVillage('');

    // Only reset unlocked location filters
    if (canClearFilter('zone')) setZone('');
    if (canClearFilter('province')) setProvince('');
    if (canClearFilter('district')) setDistrict('');
    if (canClearFilter('subdistrict')) setSubdistrict('');
    if (canClearFilter('service')) setService('');

    // Restore locked values from scope
    const initialFilters = getInitialFilters();
    if (isLocked('zone') && initialFilters.zone) setZone(initialFilters.zone);
    if (isLocked('province') && initialFilters.province) setProvince(initialFilters.province);
    if (isLocked('district') && initialFilters.district) setDistrict(initialFilters.district);
    if (isLocked('subdistrict') && initialFilters.subdistrict) setSubdistrict(initialFilters.subdistrict);
    if (isLocked('service') && initialFilters.service) setService(initialFilters.service);
  }, [canClearFilter, isLocked, getInitialFilters]);

  /**
   * ✅ ตรวจสอบว่าควร disable dropdown หรือไม่ (cascading logic)
   * - อำเภอ disable ถ้าไม่ได้เลือกจังหวัด
   * - ตำบล disable ถ้าไม่ได้เลือกอำเภอ
   * - หน่วยบริการ disable ถ้าไม่ได้เลือกตำบล
   */
  const isDistrictDisabled = useMemo(() => {
    // ถ้าไม่ได้เลือกจังหวัด หรือจังหวัดถูก lock แต่ไม่มีค่า
    if (!province || (isLocked('province') && province === '')) {
      return true;
    }
    return false;
  }, [province, isLocked]);

  const isSubdistrictDisabled = useMemo(() => {
    // ถ้าไม่ได้เลือกอำเภอ หรืออำเภอถูก lock แต่ไม่มีค่า
    if (!district || (isLocked('district') && district === '')) {
      return true;
    }
    return false;
  }, [district, isLocked]);

  const isServiceDisabled = useMemo(() => {
    // ถ้าไม่ได้เลือกตำบล หรือตำบลถูก lock แต่ไม่มีค่า
    if (!subdistrict || (isLocked('subdistrict') && subdistrict === '')) {
      return true;
    }
    return false;
  }, [subdistrict, isLocked]);

  return {
    // States
    yearType,
    year,
    month,
    week,
    zone,
    province,
    district,
    subdistrict,
    village,
    service,
    keyword,

    // Setters (basic - no permission check)
    setYearType,
    setYear,
    setMonth,
    setWeek,
    setKeyword,

    // Permission-aware setters
    handleZoneChange,
    handleProvinceChange,
    handleDistrictChange,
    handleSubdistrictChange,
    handleVillageChange,
    handleServiceChange,

    // Location data
    healthAreas,
    provinces,
    districts,
    subdistricts,
    villages,
    healthServices,

    // Utilities
    handleReset,
    isLocked,
    canClearFilter,
    canChangeFilter,

    // ✅ Cascading disable states
    isDistrictDisabled,
    isSubdistrictDisabled,
    isServiceDisabled,

    // Permission data
    scope,
    permissionLoading,
  };
};

export default usePermissionFilters;
