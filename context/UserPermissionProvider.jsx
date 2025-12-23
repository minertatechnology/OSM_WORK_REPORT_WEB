'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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

        console.log('🔑 Token Check:', {
          hasDocument: typeof document !== 'undefined',
          token: token ? 'Found' : 'Not found',
        });

        if (!token) {
          // User not logged in, skip API fetch
          console.log('❌ No token found, skipping API fetch');
          setLoading(false);
          return;
        }

        console.log('✅ Token found, fetching user data...');

        // Fetch from API to ensure data is up-to-date
        const userData = await fetchCurrentUser();

        console.log('🔍 Raw API Response from /auth/me:', userData);

        if (userData && userData.data) {
          const data = userData.data;
          const permissionScope = data.permission_scope;
          const userType = data.user_type; // "osm" or "officer"

          console.log('📋 Parsed Data:', {
            userType,
            permissionScope,
            serviceUnit: data.service_unit,
          });

          // Map permission_scope.level to role
          const levelToRole = {
            'country': 'สบส',
            'region': 'เขต',
            'area': 'เขต',
            'province': 'จังหวัด',
            'district': 'อำเภอ',
            'subdistrict': 'ตำบล',
            'village': 'รพสต',
          };

          // ใช้ permission_scope.level สำหรับทั้ง OSM และ Officer
          const permissionLevel = permissionScope?.level || 'country';
          const role = levelToRole[permissionLevel] || 'สบส';
          const userRoles = [role];

          // Extract scope from permission_scope.codes
          const codes = permissionScope?.codes || {};
          const userScope = {
            zone: codes.health_area_id || '',
            province: codes.province_id || '',
            district: codes.district_id || '',
            subdistrict: codes.subdistrict_id || '',
            unit: data.service_unit?.code || '',
          };

          const level = roleToLockLevel(role);
          const vis = getVisibilityByRole(role);

          console.log('👤 User Permission Debug:', {
            userType,
            permissionLevel,
            role,
            level,
            scope: userScope,
          });

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
  const isLocked = (field) => {
    // Special case: หน่วยบริการ lock เฉพาะเมื่อมี scope.unit
    // เพื่อให้ระดับตำบล (ไม่มี service_unit) เลือกได้
    // แต่ระดับ รพสต. (มี service_unit) ถูก lock
    if (field === 'service') {
      return scope.unit !== '' && scope.unit !== null && scope.unit !== undefined;
    }

    return isFieldLocked(lockLevel, field);
  };

  /**
   * Get initial filter values based on user scope
   * @returns {Object} - { zone, province, district, subdistrict, service }
   */
  const getInitialFilters = () => {
    return {
      zone: scope.zone || '',
      province: scope.province || '',
      district: scope.district || '',
      subdistrict: scope.subdistrict || '',
      service: scope.unit || '',
    };
  };

  /**
   * Check if user can clear/reset a specific filter
   * @param {string} field - Field name
   * @returns {boolean}
   */
  const canClearFilter = (field) => {
    return !isLocked(field);
  };

  /**
   * Check if user can change a specific filter
   * @param {string} field - Field name
   * @returns {boolean}
   */
  const canChangeFilter = (field) => {
    return !isLocked(field);
  };

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
  };

  return (
    <UserPermissionContext.Provider value={value}>
      {children}
    </UserPermissionContext.Provider>
  );
}
