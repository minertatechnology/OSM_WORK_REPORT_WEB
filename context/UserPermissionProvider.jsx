'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchCurrentUser } from '@services/authService/authService';
import {
  roleToLockLevel,
  isFieldLocked,
  getVisibilityByRole,
  readInfoFromCookie,
  setInfoCookie,
} from '@utils/access';

const UserPermissionContext = createContext(null);

export const useUserPermission = () => {
  const context = useContext(UserPermissionContext);
  if (!context) {
    throw new Error('useUserPermission must be used within UserPermissionProvider');
  }
  return context;
};

export default function UserPermissionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [scope, setScope] = useState({
    zone: '',
    province: '',
    district: '',
    subdistrict: '',
    unit: '',
  });
  const [lockLevel, setLockLevel] = useState('none');
  const [visibility, setVisibility] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to get from cookie first
        const cookieData = readInfoFromCookie();
        if (cookieData.roles.length > 0) {
          const primaryRole = cookieData.roles[0];
          const level = roleToLockLevel(primaryRole);
          const vis = getVisibilityByRole(primaryRole);

          setUser(cookieData.user);
          setRoles(cookieData.roles);
          setScope(cookieData.scope);
          setLockLevel(level);
          setVisibility(vis);
        }

        // Check if user is logged in (has token)
        const token = typeof document !== 'undefined'
          ? document.cookie.split(';').find(c => c.trim().startsWith('token='))
          : null;

        if (!token) {
          // User not logged in, skip API fetch
          setLoading(false);
          return;
        }

        // Fetch from API to ensure data is up-to-date
        const userData = await fetchCurrentUser();

        if (userData && userData.data) {
          const data = userData.data;
          const permissionScope = data.permission_scope;
          const userType = data.user_type; // "osm" or "officer"

          // Map permission_scope.level to role
          const levelToRole = {
            'country': 'กรม',
            'region': 'เขต',
            'area': 'เขต',
            'province': 'จังหวัด',
            'district': 'อำเภอ',
            'subdistrict': 'ตำบล',
            'village': 'รพสต.',
          };

          // ใช้ permission_scope.level สำหรับทั้ง OSM และ Officer
          const permissionLevel = permissionScope?.level || 'country';
          const role = levelToRole[permissionLevel] || 'สบส';
          const userRoles = [role];

          // Extract scope from permission_scope.codes
          // Fallback: ลองหาชื่อจากหลายที่ เพราะ API อาจคืนค่าในตำแหน่งต่างกัน
          const codes = permissionScope?.codes || {};
          const userScope = {
            zone: codes.health_area_id || '',
            province: codes.province_id || '',
            province_name_th: codes.province_name_th || data.province_name || data.province_name_th || '',
            district: codes.district_id || '',
            district_name_th: codes.district_name_th || data.district_name || data.district_name_th || '',
            subdistrict: codes.subdistrict_id || '',
            subdistrict_name_th: codes.subdistrict_name_th || data.subdistrict_name || data.subdistrict_name_th || '',
            unit: data.service_unit?.code || '',
          };

          const level = roleToLockLevel(role);
          const vis = getVisibilityByRole(role);

          setUser(data);
          setRoles(userRoles);
          setScope(userScope);
          setLockLevel(level);
          setVisibility(vis);

          // Update cookie
          setInfoCookie({ roles: userRoles, ...userScope }, data);
        }
      } catch (err) {
        console.error('Failed to load user permission data:', err);
        setError(err.message || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  /**
   * Check if a field is locked based on user permission
   * @param {string} field - Field name (zone, province, district, subdistrict, service)
   * @returns {boolean}
   */
  const isLocked = useCallback((field) => {
    // Special case: หน่วยบริการ lock เฉพาะเมื่อมี scope.unit
    // เพื่อให้ระดับตำบล (ไม่มี service_unit) เลือกได้
    // แต่ระดับ รพสต. (มี service_unit) ถูก lock
    if (field === 'service') {
      return scope.unit !== '' && scope.unit !== null && scope.unit !== undefined;
    }

    return isFieldLocked(lockLevel, field);
  }, [scope.unit, lockLevel]);

  /**
   * Get initial filter values based on user scope
   * @returns {Object} - { zone, province, province_name_th, district, district_name_th, subdistrict, subdistrict_name_th, service }
   */
  const getInitialFilters = useCallback(() => {
    // For country/department level users, return empty filters so they can choose any location
    const permissionLevel = user?.permission_scope?.level || 'country';
    if (permissionLevel === 'country') {
      return {
        zone: '',
        province: '',
        province_name_th: '',
        district: '',
        district_name_th: '',
        subdistrict: '',
        subdistrict_name_th: '',
        service: '',
      };
    }

    return {
      zone: scope.zone || '',
      province: scope.province || '',
      province_name_th: scope.province_name_th || '',
      district: scope.district || '',
      district_name_th: scope.district_name_th || '',
      subdistrict: scope.subdistrict || '',
      subdistrict_name_th: scope.subdistrict_name_th || '',
      service: scope.unit || '',
    };
  }, [scope, user]);

  /**
   * Check if user can clear/reset a specific filter
   * @param {string} field - Field name
   * @returns {boolean}
   */
  const canClearFilter = useCallback((field) => {
    return !isLocked(field);
  }, [isLocked]);

  /**
   * Check if user can change a specific filter
   * @param {string} field - Field name
   * @returns {boolean}
   */
  const canChangeFilter = useCallback((field) => {
    return !isLocked(field);
  }, [isLocked]);

  /**
   * Get permission level (country, region, province, district, subdistrict, village)
   * @returns {string}
   */
  const getPermissionLevel = useCallback(() => {
    return user?.permission_scope?.level || 'country';
  }, [user]);

  /**
   * Check if user has country/grand department permission
   * @returns {boolean}
   */
  const isCountryLevel = useCallback(() => {
    return getPermissionLevel() === 'country';
  }, [getPermissionLevel]);

  const value = {
    user,
    roles,
    scope,
    lockLevel,
    visibility,
    loading,
    error,
    isLocked,
    getInitialFilters,
    canClearFilter,
    canChangeFilter,
    getPermissionLevel,
    isCountryLevel,
  };

  return (
    <UserPermissionContext.Provider value={value}>
      {children}
    </UserPermissionContext.Provider>
  );
}
