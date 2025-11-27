import React, { useState, useEffect, Suspense } from "react";
import { FullPageLoadingSpinner } from "@components/shared/LoadingSpinner";
import {
  LazyDashboardSobos,
  LazyDashboardZone,
  LazyDashboardProvince,
  LazyDashboardDistrict,
  LazyDashboardSubdistrict,
  LazyDashboardHospital
} from "@components/shared/LazyComponents";

const getRoleType = (auth) => {
  if (!auth || !auth.roles || !auth.roles.length) return "sobos";
  const role = auth.roles[0];
  if (role === "สบส.") return "sobos";
  if (role === "เขต") return "zone";
  if (role === "จังหวัด") return "province";
  if (role === "อำเภอ") return "district";
  if (role === "ตำบล") return "subdistrict";
  if (role === "รพสต.") return "hospital";
  return "sobos";
};

const DashboardComp = () => {
  const [roleType, setRoleType] = useState(null);

  useEffect(() => {
    // Only run on client
    try {
      const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
      setRoleType(getRoleType(userInfo?.auth));
    } catch {
      setRoleType("sobos");
    }
  }, []);

  if (!roleType) {
    return <FullPageLoadingSpinner message="กำลังตรวจสอบสิทธิ์..." />;
  }

  // Wrap ด้วย Suspense เพื่อแสดง loading ขณะ lazy load
  const renderDashboard = () => {
    switch (roleType) {
      case "sobos":
        return <LazyDashboardSobos />;
      case "zone":
        return <LazyDashboardZone />;
      case "province":
        return <LazyDashboardProvince />;
      case "district":
        return <LazyDashboardDistrict />;
      case "subdistrict":
        return <LazyDashboardSubdistrict />;
      case "hospital":
        return <LazyDashboardHospital />;
      default:
        return <LazyDashboardSobos />;
    }
  };

  return (
    <Suspense fallback={<FullPageLoadingSpinner message="กำลังโหลด Dashboard..." />}>
      {renderDashboard()}
    </Suspense>
  );
};

export default DashboardComp;
