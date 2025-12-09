import React, { Suspense } from "react";
import { FullPageLoadingSpinner } from "@components/shared/LoadingSpinner";
import {
  LazyDashboardSobos,
  LazyDashboardZone,
  LazyDashboardProvince,
  LazyDashboardDistrict,
  LazyDashboardSubdistrict,
  LazyDashboardHospital
} from "@components/shared/LazyComponents";
import { useSessionStorage } from "@hooks/useSessionStorage";
import { useIsClient } from "@hooks/useIsClient";

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
  const [userInfo, , isLoaded] = useSessionStorage("userInfo", {});
  const isClient = useIsClient();

  // คำนวณ roleType จาก sessionStorage ที่โหลดแล้ว
  const roleType = React.useMemo(() => {
    if (!isClient || !isLoaded) return null;
    return getRoleType(userInfo?.auth);
  }, [isClient, isLoaded, userInfo]);

  if (!isClient || !roleType) {
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
