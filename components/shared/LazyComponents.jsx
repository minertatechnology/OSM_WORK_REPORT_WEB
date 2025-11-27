import { lazy } from "react";

// ============================================
// HEAVY LIBRARIES - Lazy Load เพื่อลด bundle size
// ============================================

// Highcharts Components
export const LazyHighcharts = lazy(() =>
  import("highcharts-react-official").then(module => ({
    default: module.default
  }))
);

// Leaflet Map Components (ใช้ใน GIS)
export const LazyLeafletMap = lazy(() =>
  import("../Reportosm1Comp/GisComp/GisComp").catch(() =>
    import("../ReportMosquitoComp/GisMosquitoComp/GisMosquitoComp")
  )
);

// PDF Export Components
export const LazyPDFExporter = lazy(() =>
  import("jspdf").then(module => ({
    default: module.default
  }))
);

// Chart Components
export const LazyRechartsLineChart = lazy(() =>
  import("recharts").then(module => ({
    default: module.LineChart
  }))
);

export const LazyRechartsBarChart = lazy(() =>
  import("recharts").then(module => ({
    default: module.BarChart
  }))
);

export const LazyRechartsPieChart = lazy(() =>
  import("recharts").then(module => ({
    default: module.PieChart
  }))
);

// ============================================
// PAGE COMPONENTS - Lazy Load ทั้งหมด
// ============================================

// Dashboard Components
export const LazyDashboardSobos = lazy(() =>
  import("../DashboardComp/DashboardSobos/DashboardSobos")
);

export const LazyDashboardZone = lazy(() =>
  import("../DashboardComp/DashboardZone/DashboardZone")
);

export const LazyDashboardProvince = lazy(() =>
  import("../DashboardComp/DashboardProvince/DashboardProvince")
);

export const LazyDashboardDistrict = lazy(() =>
  import("../DashboardComp/DashboardDistrict/DashboardDistrict")
);

export const LazyDashboardSubdistrict = lazy(() =>
  import("../DashboardComp/DashboardSubdistrict/DashboardSubdistrict")
);

export const LazyDashboardHospital = lazy(() =>
  import("../DashboardComp/DashboardHospital/DashboardHospital")
);

// Report Components
export const LazyReportOsm1Comp = lazy(() =>
  import("../Reportosm1Comp/Reportosm1Comp")
);

export const LazyReportOsm1DataComp = lazy(() =>
  import("../Reportosm1Comp/Reportosm1DataComp/Reportosm1DataComp")
);

export const LazyReportOsm1DetailComp = lazy(() =>
  import("../Reportosm1Comp/Reportosm1CompDetailComp/Reportosm1CompDetailComp")
);

export const LazyReportMosquitoComp = lazy(() =>
  import("../ReportMosquitoComp/ReportMosquitoComp")
);

export const LazyReportMosquitoDataComp = lazy(() =>
  import("../ReportMosquitoComp/ReportMosquitoCompDataComp/ReportMosquitoCompDataComp")
);

export const LazyReportMosquitoDetailComp = lazy(() =>
  import("../ReportMosquitoComp/ReportMosquitoCompDetailComp/ReportMosquitoCompDetailComp")
);

// GIS Components
export const LazyGisOsm1Comp = lazy(() =>
  import("../Reportosm1Comp/GisComp/GisComp")
);

export const LazyGisMosquitoComp = lazy(() =>
  import("../ReportMosquitoComp/GisMosquitoComp/GisMosquitoComp")
);

// Health Screening Components
export const LazyElderlyScreeningComp = lazy(() =>
  import("../ElderlyScreeningComp/ElderlyScreeningComp")
);

export const LazyElderlyScreeningDetail = lazy(() =>
  import("../ElderlyScreeningComp/ElderlyScreeningDetail/ElderlyScreeningDetail")
);

export const LazyNcdsScreeningComp = lazy(() =>
  import("../NcdsScreeningComp/NcdsScreeningComp")
);

export const LazyNcdsScreeningDetail = lazy(() =>
  import("../NcdsScreeningComp/NcdsScreeningDetail/NcdsScreeningDetail")
);

export const LazyPregnantReportComp = lazy(() =>
  import("../PregnantReportComp/PregnantReportComp")
);

export const LazyPregnantReportDetail = lazy(() =>
  import("../PregnantReportComp/PregnantReportDetail/PregnantReportDetail")
);

// Other Main Components
export const LazyOsmThaiPHCComp = lazy(() =>
  import("../OsmThaiPHCComp/OsmThaiPHCComp")
);

export const LazyOsmHealthComp = lazy(() =>
  import("../OsmHealthComp/OsmHealthComp")
);

export const LazyOsmPointsComp = lazy(() =>
  import("../OsmPointsComp/OsmPointsComp")
);

export const LazyRedeemComp = lazy(() =>
  import("../OsmPointsComp/RedeemComp/RedeemComp")
);

export const LazyShippingComp = lazy(() =>
  import("../OsmPointsComp/ShippingComp/ShippingComp")
);

export const LazySmartOsmComp = lazy(() =>
  import("../SmartOsmComp/SmartOsmComp")
);

export const LazyNewsComp = lazy(() =>
  import("../NewsComp/NewsComp")
);

export const LazyThreeDocComp = lazy(() =>
  import("../ThreeDocComp/ThreeDocComp")
);

export const LazyAccessControlComp = lazy(() =>
  import("../AccessControlComp/AccessControlComp")
);

export const LazyAccessControlEditComp = lazy(() =>
  import("../AccessControlComp/edit/ManageAccess")
);

export const LazyUserListComp = lazy(() =>
  import("../UserListComp/UserListComp")
);

export const LazyAtkReportComp = lazy(() =>
  import("../DashboardComp/DashboardDistrict/AtkReportComp/AtkReportComp")
);
