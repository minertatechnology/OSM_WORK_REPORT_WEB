import { useState, useEffect, useCallback } from 'react';
import { useUserPermission } from '@context/UserPermissionProvider';
import {
  getHealthAreas,
  getProvinces,
  getDistricts,
  getSubdistricts,
  getHealthServices,
} from '@services/lookupService';

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
  const [service, setService] = useState('');
  const [keyword, setKeyword] = useState('');

  // Location data
  const [healthAreas, setHealthAreas] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);
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
        if (!zone) {
          const data = await getProvinces({ limit: 100 });
          setProvinces(data || []);
        } else {
          const selectedHealthArea = healthAreas.find(h => h.code === zone);
          if (selectedHealthArea && selectedHealthArea.provinces) {
            setProvinces(selectedHealthArea.provinces);
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
  }, [zone, healthAreas]);

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

  // Initialize filters based on user scope
  useEffect(() => {
    if (!permissionLoading && scope) {
      // ⚠️ ถ้าเป็นสิทธิ์สูงสุด (สบส) ไม่ต้อง set ค่าเริ่มต้น ให้เลือกเอง
      if (lockLevel === 'none') {
        return;
      }

      const initialFilters = getInitialFilters();

      // Set initial values from scope (locked values) สำหรับสิทธิ์อื่นๆ
      if (initialFilters.zone) setZone(initialFilters.zone);
      if (initialFilters.province) setProvince(initialFilters.province);
      if (initialFilters.district) setDistrict(initialFilters.district);
      if (initialFilters.subdistrict) setSubdistrict(initialFilters.subdistrict);
      if (initialFilters.service) setService(initialFilters.service);
    }
  }, [permissionLoading, scope, lockLevel, getInitialFilters]);

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
        service,
        keyword,
      });
    }
  }, [yearType, year, month, week, zone, province, district, subdistrict, service, keyword]);

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
      // Reset dependent filter
      if (canChangeFilter('service')) setService('');
    }
  }, [canChangeFilter]);

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
    handleServiceChange,

    // Location data
    healthAreas,
    provinces,
    districts,
    subdistricts,
    healthServices,

    // Utilities
    handleReset,
    isLocked,
    canClearFilter,
    canChangeFilter,

    // Permission data
    scope,
    permissionLoading,
  };
};

export default usePermissionFilters;
