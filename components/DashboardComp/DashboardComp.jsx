import React, { useState, useEffect, lazy, Suspense } from "react";

// Dynamic imports - โหลดแค่ตอนใช้งานจริง
const DashboardSobos = lazy(() => import("./DashboardSobos/DashboardSobos"));
const DashboardZone = lazy(() => import("./DashboardZone/DashboardZone"));
const DashboardProvince = lazy(() => import("./DashboardProvince/DashboardProvince"));
const DashboardDistrict = lazy(() => import("./DashboardDistrict/DashboardDistrict"));
const DashboardSubdistrict = lazy(() => import("./DashboardSubdistrict/DashboardSubdistrict"));
const DashboardHospital = lazy(() => import("./DashboardHospital/DashboardHospital"));

// Loading component
const DashboardLoading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">กำลังโหลด...</p>
    </div>
  </div>
);

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
    return <DashboardLoading />;
  }

  // Wrap ด้วย Suspense เพื่อแสดง loading ขณะ lazy load
  const renderDashboard = () => {
    switch (roleType) {
      case "sobos":
        return <DashboardSobos />;
      case "zone":
        return <DashboardZone />;
      case "province":
        return <DashboardProvince />;
      case "district":
        return <DashboardDistrict />;
      case "subdistrict":
        return <DashboardSubdistrict />;
      case "hospital":
        return <DashboardHospital />;
      default:
        return <DashboardSobos />;
    }
  };

  return (
    <Suspense fallback={<DashboardLoading />}>
      {renderDashboard()}
    </Suspense>
  );
};

export default DashboardComp;
