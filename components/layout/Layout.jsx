import React, { useState, useEffect } from "react";
import SideMenuComp from "@components/SideMenuComp/SideMenuComp";
import {
  Menu,
  Home,
  Users,
  Database,
  FileText,
  BarChart2,
  UserCheck,
  Activity,
  FileCheck,
  // ClipboardList,
  FileSearch,
  Bell,
  Gift,
} from "lucide-react";
import { useLoading } from "@context/LoadingProvider";
import { useSessionStorage } from "@hooks/useSessionStorage";
import { useIsClient } from "@hooks/useIsClient";
import { useUserPermission } from "@context/UserPermissionProvider";

const PRIMARY = "#6E28B7";

// Mapping sidebar menu name to nav icon
const MENU_ICON_MAP = {
  หน้าหลัก: <Home className="w-5 h-5" />,
  รายชื่อผู้ใช้งานแอปพลิเคชัน: <Users className="w-5 h-5" />,
  "ข้อมูล อสม. Thai Phc": <Database className="w-5 h-5" />,
  "รายงาน อสม.1": <FileText className="w-5 h-5" />,
  "รายงาน ลูกน้ำยุงลาย": <BarChart2 className="w-5 h-5" />,
  คัดกรองผู้สูงอายุในชุมชน: <UserCheck className="w-5 h-5" />,
  "คัดกรองโรคไม่ติดต่อเรื้อรัง NCDs": <Activity className="w-5 h-5" />,
  "การติดตามการได้รับยาเม็ดเสริมไอโอดีน": <FileCheck className="w-5 h-5" />,
  "จัดการคะแนนสะสม อสม.": <Gift className="w-5 h-5" />,
  "ผลตรวจสุขภาพ อสม.": <BarChart2 className="w-5 h-5" />,
  "รายงานผลตรวจ ATK": <FileSearch className="w-5 h-5" />,
  ประกาศข่าวสาร: <Bell className="w-5 h-5" />,
  กำหนดสิทธิ์การเข้าถึง: <Users className="w-5 h-5" />,
  "รายงานผลการรายงานผลการปฏิบัติงานของอสม.": <FileText className="w-5 h-5" />,
  // Submenu or fallback
  "ข้อมูลรายงาน อสม.1": <FileText className="w-5 h-5" />,
  "GIS รายงาน อสม.1": <FileText className="w-5 h-5" />,
  "ข้อมูลรายงาน ลูกน้ำยุงลาย": <BarChart2 className="w-5 h-5" />,
  "GIS รายงาน ลูกน้ำยุงลาย": <BarChart2 className="w-5 h-5" />,
  กำหนดการแลกของรางวัล: <Gift className="w-5 h-5" />,
  การขนส่งของรางวัล: <Gift className="w-5 h-5" />,
};

// Component สำหรับแสดง role และ location ตาม permission level
const UserPosition = React.memo(({ isMobile }) => {
  const { roles, user, loading } = useUserPermission();
  const isClient = useIsClient();

  // รอให้โหลดเสร็จและอยู่ที่ฝั่ง client
  if (!isClient || loading) {
    return null;
  }

  const role = roles?.[0] || "";
  if (!role) return null;

  // กำหนดชื่อสิทธิ (บรรทัดที่ 2)
  let roleName = "";
  // กำหนดพื้นที่ (บรรทัดที่ 3)
  let location = "";

  const serviceUnitName = user?.service_unit?.name_th || user?.service_unit?.name || "";

  if (role === "กรม") {
    roleName = "กรมสนับสนุนบริการสุขภาพ";
    // ไม่แสดงพื้นที่
  } else if (role === "เขต") {
    roleName = "เขตสนับสนุนบริการสุขภาพ";
    location = serviceUnitName || "";
  } else if (role === "จังหวัด") {
    roleName = "สำนักงานสาธารณสุขจังหวัด";
    location = serviceUnitName || "";
  } else if (role === "อำเภอ") {
    roleName = "สำนักงานสาธารณสุขอำเภอ";
    location = serviceUnitName || "";
  } else if (role === "ตำบล") {
    roleName = "หน่วยบริการสุขภาพ";
    location = serviceUnitName || "";
  } else if (role === "รพสต.") {
    roleName = "หน่วยบริการสุขภาพ";
    location = serviceUnitName || "";
  } else {
    roleName = role;
  }

  return (
    <>
      <div
        className={`${
          isMobile ? "text-[10px]" : "text-[11px]"
        } font-medium`}
        style={{ color: PRIMARY }}
      >
        {roleName}
      </div>
      {location && (
        <div
          className={`${
            isMobile ? "text-[9px]" : "text-[10px]"
          } text-gray-500`}
        >
          {location}
        </div>
      )}
    </>
  );
});
UserPosition.displayName = 'UserPosition';

const Navbar = React.memo(({
  onToggleSidebar,
  isMobile,
  userName,
  navTitle,
  // navIcon,
}) => {

  return (
    <div
      className={`${
        isMobile ? "h-11" : "h-14"
      } bg-white border-b border-gray-200 flex items-center justify-between px-3 lg:px-6`}
    >
      {/* Left: ICON + DYNAMIC TITLE */}
      <div className="flex items-center gap-2 lg:gap-3 min-w-0">
        {isMobile && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-md hover:bg-gray-100 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-purple-200"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-4 h-4 text-[#4a2d70]" />
          </button>
        )}

        <span
          className={`font-medium ${
            isMobile ? "text-[13px]" : "text-[14px]"
          } tracking-[0.2px]`}
          style={{ color: PRIMARY }}
        >
          {navTitle || "หน้าแรก"}
        </span>
      </div>

      {/* Right: User Info */}
      <div className="flex items-center">
        <div className="text-right leading-tight select-none">
          <div
            className={`font-semibold ${
              isMobile ? "text-[11px]" : "text-[13px]"
            } text-[#1a1230] tracking-[0.2px]`}
          >
            {userName}
          </div>
          <UserPosition isMobile={isMobile} />
        </div>
      </div>
    </div>
  );
});
Navbar.displayName = 'Navbar';

const Layout = ({ children }) => {
  // ใช้ lazy initialization เพื่อหลีกเลี่ยง hydration mismatch
  const [isMobile, setIsMobile] = useState(() => false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => false);
  const [isMounted, setIsMounted] = useState(false);
  const { setLoading } = useLoading();
  const [userInfo, , isUserLoaded] = useSessionStorage("userInfo", {});
  const isClient = useIsClient();

  // state for nav title/icon
  const [navInfo, setNavInfo] = useState({
    title: "หน้าแรก",
    icon: null,
  });

  // Mark component as mounted
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Setup responsive behavior only after mount
  useEffect(() => {
    if (!isMounted) return;

    const checkIfMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, [isMounted]);

  // คำนวณ user info จาก sessionStorage ที่โหลดแล้ว
  const user = React.useMemo(() => {
    if (!isClient || !isUserLoaded) {
      return {
        name: "",
        province: "",
        role: "",
      };
    }

    // ชื่อ
    let name = userInfo?.user?.name || "ไม่ทราบชื่อ";

    // ตำแหน่ง - เอาจาก position_name_th
    let role = userInfo?.user?.position_name_th || "";

    // province (แสดงจังหวัดถ้ามี, fallback เป็นเขต, ตำบล, รพสต.)
    let province =
      userInfo?.user?.province_name ||
      userInfo?.auth?.province ||
      userInfo?.auth?.zone ||
      userInfo?.auth?.district ||
      userInfo?.auth?.subdistrict ||
      userInfo?.auth?.unit ||
      "";
    if (province && !province.startsWith("จังหวัด") && role === "จังหวัด") {
      province = `จังหวัด ${province}`;
    }
    if (!province) province = "-";

    return {
      name,
      province,
      role,
    };
  }, [isClient, isUserLoaded, userInfo]);

  // รับ callback จาก SideMenuComp
  const handleMenuClick = (menuName) => {
    setLoading(true);
    // ถ้า menuName เป็น string
    setNavInfo({
      title: menuName || "หน้าแรก",
      icon: MENU_ICON_MAP[menuName] || null,
    });
    if (isMobile) setIsSidebarOpen(false);
    setTimeout(() => setLoading(false), 700);
  };

  const toggleSidebar = () => setIsSidebarOpen((o) => !o);

  return (
    <div className="flex h-screen relative" suppressHydrationWarning>
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        className={`
          ${isMobile ? "fixed" : "relative"}
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          ${isMobile ? "z-50" : "z-auto"}
          transition-transform duration-300 ease-out
          lg:translate-x-0
        `}
        suppressHydrationWarning
      >
        <SideMenuComp
          onMenuClick={handleMenuClick}
          onClose={() => setIsSidebarOpen(false)}
          isMobile={isMobile}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <Navbar
          onToggleSidebar={toggleSidebar}
          isMobile={isMobile}
          userName={user.name}
          userProvince={user.province}
          userRole={user.role}
          navTitle={navInfo.title}
          navIcon={navInfo.icon}
        />
        <main className="flex-1 p-3 lg:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
