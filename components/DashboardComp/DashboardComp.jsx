import React, { useState, useEffect } from "react";
import DashboardSobos from "./DashboardSobos/DashboardSobos";
import DashboardZone from "./DashboardZone/DashboardZone";
import DashboardProvince from "./DashboardProvince/DashboardProvince";
import DashboardDistrict from "./DashboardDistrict/DashboardDistrict";
import DashboardSubdistrict from "./DashboardSubdistrict/DashboardSubdistrict";
import DashboardHospital from "./DashboardHospital/DashboardHospital";

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
    return <div />;
  }

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

export default DashboardComp;
