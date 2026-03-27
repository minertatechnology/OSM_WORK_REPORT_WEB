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
 * @param {Object} options - { onFilterChange, defaultYear, defaultYearType, defaultMonth, includeWeek }
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

  const { defaultYear = '', defaultYearType = 'fiscal', defaultMonth = '', includeWeek = false } = options;

  const [yearType, setYearType] = useState(defaultYearType);
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);
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

  // Load provinces - runs on mount AND when zone changes
  // ✅ IMPORTANT: Also loads when permission data is ready (for locked provinces)
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        // ✅ Special case: If province is locked, load ALL provinces
        // This handles cases where the user's province is not in their assigned health area
        const isProvinceLocked = isLocked('province');

        console.log('📍 [usePermissionFilters] Loading provinces:', {
          zone,
          isProvinceLocked,
          lockLevel,
        });

        if (!zone) {
          // ไม่ได้เลือกเขต - โหลดจังหวัดทั้งหมด
          console.log('📍 Loading ALL provinces (no zone selected)');
          const data = await getProvinces({ limit: 100 });
          console.log('📍 Loaded provinces:', data?.length, 'first 3:', data?.slice(0, 3));
          setProvinces(data || []);
        } else if (isProvinceLocked) {
          // ✅ Province is locked - load ALL provinces (don't filter by zone)
          // This ensures the locked province is always available
          console.log('📍 Loading ALL provinces (province is locked)');
          const data = await getProvinces({ limit: 100 });
          console.log('📍 Loaded provinces:', data?.length, 'first 3:', data?.slice(0, 3));
          setProvinces(data || []);
        } else {
          // เลือกเขตแล้วและ province ไม่ได้ lock - ใช้ข้อมูลจาก HEALTHZONE_PROVINCES
          console.log('📍 Loading provinces filtered by zone:', zone);
          const zoneNumber = parseInt(String(zone).replace(/\D/g, ''));

          const zoneData = HEALTHZONE_PROVINCES.find(z => z.zone === zoneNumber);

          if (zoneData && zoneData.provinces) {
            const provinceNamesInZone = zoneData.provinces.map(p => p.trim());

            const allProvinces = await getProvinces({ limit: 100 });
            const filteredProvinces = allProvinces.filter(p =>
              provinceNamesInZone.includes(p.name_th?.trim())
            );
            console.log('📍 Filtered provinces by zone:', filteredProvinces?.length);
            setProvinces(filteredProvinces);
          } else {
            setProvinces([]);
          }
        }
      } catch (error) {
        console.error('Failed to load provinces:', error);
        setProvinces([]);
      }
    };
    loadProvinces();
  }, [zone, healthAreas, isLocked, lockLevel]);

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

  // ✅ Initialize ALL locked values based on permission level
  // This effect handles the cascading initialization of location filters
  useEffect(() => {
    if (permissionLoading || !scope) return;

    // ⚠️ ถ้าเป็นสิทธิ์สูงสุด (สบส) ไม่ต้อง set ค่าเริ่มต้น ให้เลือกเอง
    if (lockLevel === 'none') {
      setInitialValuesSet(true);
      return;
    }

    const initialFilters = getInitialFilters();

    console.log('🔐 [usePermissionFilters] Initializing filters:', {
      lockLevel,
      initialFilters,
      hasProvinces: provinces.length,
      hasDistricts: districts.length,
      hasSubdistricts: subdistricts.length,
      currentZone: zone,
      currentProvince: province,
      currentDistrict: district,
    });

    // ✅ Zone: Always set for non-country levels (if not already set)
    if (initialFilters.zone && !zone) {
      console.log('🔐 Setting zone:', initialFilters.zone);
      setZone(initialFilters.zone);
    }

    // ✅ Province: Set for province/district/subdistrict/service levels
    // Only after provinces are loaded AND province is locked AND not already set
    if (['province', 'district', 'subdistrict', 'service'].includes(lockLevel)) {
      console.log('🔐 Province check:', {
        hasInitialProvince: !!initialFilters.province,
        provincesLoaded: provinces.length,
        currentProvince: province,
        initialProvince: initialFilters.province,
        initialProvinceName: initialFilters.province_name_th,
      });

      if (initialFilters.province && provinces.length > 0 && !province) {
        console.log('🔐 Attempting to match province. Initial province:', initialFilters.province);
        console.log('🔐 Sample provinces data:', provinces.slice(0, 3).map(p => ({
          code: p.code,
          id: p.id,
          name_th: p.name_th,
        })));

        // Try to find matching province by code or id
        const matchingProvince = provinces.find(p => {
          const provinceCode = String(p.code || p.id || p.province_code || '');
          const targetCode = String(initialFilters.province);
          console.log('🔐 Comparing:', provinceCode, '===', targetCode, '?', provinceCode === targetCode);
          return provinceCode === targetCode;
        });

        if (matchingProvince) {
          const provinceCode = String(matchingProvince.code || matchingProvince.id || matchingProvince.province_code);
          console.log('🔐 ✅ Setting province:', provinceCode, 'from match:', matchingProvince);
          setProvince(provinceCode);
        } else {
          // If not found by code, try to match by name
          console.log('🔐 Province not found by code, trying name match...');
          const nameMatch = provinces.find(p =>
            p.name_th === initialFilters.province_name_th ||
            p.name === initialFilters.province_name_th
          );
          if (nameMatch) {
            const provinceCode = String(nameMatch.code || nameMatch.id || nameMatch.province_code);
            console.log('🔐 ✅ Setting province by name:', provinceCode, 'from match:', nameMatch);
            setProvince(provinceCode);
          } else {
            console.warn('🔐 ❌ Province not found in loaded data:', {
              searchCode: initialFilters.province,
              searchName: initialFilters.province_name_th,
              availableProvinces: provinces.slice(0, 5),
            });
          }
        }
      } else if (!initialFilters.province) {
        console.warn('🔐 ⚠️ No initial province in filters');
      } else if (provinces.length === 0) {
        console.warn('🔐 ⚠️ Provinces not loaded yet (length = 0)');
      } else if (province) {
        console.log('🔐 Province already set:', province);
      }
    }

    // ✅ District: Set for district/subdistrict/service levels
    // Only after districts are loaded AND district is locked AND not already set
    if (['district', 'subdistrict', 'service'].includes(lockLevel)) {
      if (initialFilters.district && districts.length > 0 && !district) {
        // Try to find matching district by code or id
        const matchingDistrict = districts.find(d =>
          String(d.code || d.id || d.district_code) === String(initialFilters.district)
        );

        if (matchingDistrict) {
          const districtCode = String(matchingDistrict.code || matchingDistrict.id || matchingDistrict.district_code);
          console.log('🔐 Setting district:', districtCode, 'from match:', matchingDistrict);
          setDistrict(districtCode);
        } else {
          // If not found by code, try to match by name
          const nameMatch = districts.find(d =>
            d.name_th === initialFilters.district_name_th ||
            d.name === initialFilters.district_name_th
          );
          if (nameMatch) {
            const districtCode = String(nameMatch.code || nameMatch.id || nameMatch.district_code);
            console.log('🔐 Setting district by name:', districtCode, 'from match:', nameMatch);
            setDistrict(districtCode);
          } else {
            console.warn('🔐 District not found in loaded data:', {
              searchCode: initialFilters.district,
              searchName: initialFilters.district_name_th,
              availableDistricts: districts.slice(0, 5),
            });
          }
        }
      }
    }

    // ✅ Subdistrict: Set for subdistrict/service levels
    if (['subdistrict', 'service'].includes(lockLevel)) {
      if (initialFilters.subdistrict && subdistricts.length > 0 && !subdistrict) {
        const matchingSubdistrict = subdistricts.find(s =>
          String(s.code || s.id || s.subdistrict_code) === String(initialFilters.subdistrict)
        );

        if (matchingSubdistrict) {
          const subdistrictCode = String(matchingSubdistrict.code || matchingSubdistrict.id || matchingSubdistrict.subdistrict_code);
          console.log('🔐 Setting subdistrict:', subdistrictCode);
          setSubdistrict(subdistrictCode);
        } else {
          const nameMatch = subdistricts.find(s =>
            s.name_th === initialFilters.subdistrict_name_th ||
            s.name === initialFilters.subdistrict_name_th
          );
          if (nameMatch) {
            const subdistrictCode = String(nameMatch.code || nameMatch.id || nameMatch.subdistrict_code);
            console.log('🔐 Setting subdistrict by name:', subdistrictCode);
            setSubdistrict(subdistrictCode);
          }
        }
      }
    }

    // ✅ Service: Set for service level only
    if (lockLevel === 'service') {
      if (initialFilters.service && !service && !initialValuesSet) {
        console.log('🔐 Setting service:', initialFilters.service);
        setService(initialFilters.service);
      }
    }

    // Mark initialization as complete once all locked values are set
    const allLockedValuesSet = (() => {
      if (lockLevel === 'zone') return zone !== '';
      if (lockLevel === 'province') return zone !== '' && province !== '';
      if (lockLevel === 'district') return zone !== '' && province !== '' && district !== '';
      if (lockLevel === 'subdistrict') return zone !== '' && province !== '' && district !== '' && subdistrict !== '';
      if (lockLevel === 'service') return zone !== '' && province !== '' && district !== '' && subdistrict !== '' && service !== '';
      return true;
    })();

    if (allLockedValuesSet) {
      console.log('🔐 All locked values set for level:', lockLevel);
      setInitialValuesSet(true);
    }
  }, [permissionLoading, scope, lockLevel, getInitialFilters, provinces, districts, subdistricts, zone, province, district, subdistrict, service, initialValuesSet]);

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
   * Reset year/month to current values from options
   */
  const handleReset = useCallback(() => {
    setYearType(defaultYearType);
    setYear(defaultYear);
    setMonth(defaultMonth);
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
  }, [defaultYearType, defaultYear, defaultMonth, canClearFilter, isLocked, getInitialFilters]);

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

    // ✅ Filter initialization state - use this to wait before making API calls
    initialValuesSet,
    filtersReady: !permissionLoading && initialValuesSet,
  };
};

export default usePermissionFilters;
