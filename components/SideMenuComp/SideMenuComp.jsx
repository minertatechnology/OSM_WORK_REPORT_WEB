"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import {
  LogOut,
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
  ChevronDown,
  FileSpreadsheet,
} from "lucide-react";
import { getMenuStructure, getUserMenuPermissions } from "@services/menuPermissionService";
import { filterMenusByScope } from "@utils/menuPermissionHelper";
import alertService from "@services/alertService/alertService";
import { useSessionStorage } from "@hooks/useSessionStorage";
import { useIsClient } from "@hooks/useIsClient";

/**
 * roleType: "sobos" | "zone" | "province" | "district" | "subdistrict" | "hospital"
 * - สบส. = sobos
 * - เขต = zone
 * - จังหวัด = province
 * - อำเภอ = district
 * - ตำบล = subdistrict
 * - รพสต. = hospital
 */
// const PRIMARY = "#6E28B7";

// Icon mapping from API icon names to Lucide React components
const ICON_MAP = {
  Home: <Home className="w-5 h-5" />,
  Users: <Users className="w-5 h-5" />,
  Database: <Database className="w-5 h-5" />,
  FileText: <FileText className="w-5 h-5" />,
  BarChart2: <BarChart2 className="w-5 h-5" />,
  UserCheck: <UserCheck className="w-5 h-5" />,
  Activity: <Activity className="w-5 h-5" />,
  FileCheck: <FileCheck className="w-5 h-5" />,
  FileSearch: <FileSearch className="w-5 h-5" />,
  Bell: <Bell className="w-5 h-5" />,
  Gift: <Gift className="w-5 h-5" />,
  FileSpreadsheet: <FileSpreadsheet className="w-5 h-5" />,
};

// Helper to get icon component from API icon name or return default
const getIconComponent = (iconName) => {
  if (typeof iconName === 'object' && iconName !== null) {
    // Already a React component (from static MENU_MAP)
    return iconName;
  }
  return ICON_MAP[iconName] || <FileText className="w-5 h-5" />;
};

// Submenus (for fallback/static menu only)
const REPORT_OSM1_SUBMENU = [
  { name: "ข้อมูลรายงาน อสม.1", url: "/report-osm1/data" },
  { name: "GIS รายงาน อสม.1", url: "/report-osm1/gis" },
];
const REPORT_MOSQUITO_SUBMENU = [
  { name: "ข้อมูลรายงาน ลูกน้ำยุงลาย", url: "/report-mosquito/data" },
  { name: "GIS รายงาน ลูกน้ำยุงลาย", url: "/report-mosquito/gis" },
];
const OSM_POINTS_SUBMENU = [
  { name: "กำหนดการแลกของรางวัล", url: "/osm-points/redeem" },
  { name: "การขนส่งของรางวัล", url: "/osm-points/shipping" },
];

// Main menu per role
const MENU_MAP = {
  sobos: [
    { name: "หน้าหลัก", url: "/home", icon: <Home className="w-5 h-5" /> },
    {
      name: "รายชื่อผู้ใช้งานแอปพลิเคชัน",
      url: "/user-list",
      icon: <Users className="w-5 h-5" />,
    },
    // {
    //   name: "ข้อมูล อสม. Thai Phc",
    //   url: "/osm-thaiphc",
    //   icon: <Database className="w-5 h-5" />,
    // },
    {
      name: "รายงาน อสม.1",
      url: "/report-osm1",
      icon: <FileText className="w-5 h-5" />,
      hasSub: true,
    },
    {
      name: "รายงาน ลูกน้ำยุงลาย",
      url: "/report-mosquito",
      icon: <BarChart2 className="w-5 h-5" />,
      hasSub: true,
    },
    {
      name: "ผลตรวจสุขภาพ อสม.",
      url: "/osm-health",
      icon: <BarChart2 className="w-5 h-5" />,
    },
    {
      name: "คัดกรองผู้สูงอายุในชุมชน",
      url: "/elderly-screening",
      icon: <UserCheck className="w-5 h-5" />,
    },
    {
      name: "คัดกรองโรคไม่ติดต่อเรื้อรัง NCDs",
      url: "/ncds-screening",
      icon: <Activity className="w-5 h-5" />,
    },
    {
      name: "รายงานประเมินหญิงตั้งครรภ์",
      url: "/pregnant-report",
      icon: <FileCheck className="w-5 h-5" />,
    },
    {
      name: "รายงานผลการรายงานผลการปฏิบัติงานของอสม.",
      url: "/public-report",
      icon: <FileSpreadsheet className="w-5 h-5" />,
    },
    // {
    //   name: "จัดการคะแนนสะสม อสม.",
    //   url: "/osm-points",
    //   icon: <Gift className="w-5 h-5" />,
    //   hasSub: true,
    // },
    
    // {
    //   name: "รายงานผลตรวจ ATK",
    //   url: "/atk-report",
    //   icon: <FileSearch className="w-5 h-5" />,
    // },
    { name: "ประกาศข่าวสาร", url: "/news", icon: <Bell className="w-5 h-5" /> },
    {
      name: "กำหนดสิทธิ์การเข้าถึง",
      url: "/access-control",
      icon: <Users className="w-5 h-5" />,
    },
  ],
  zone: [
    { name: "หน้าหลัก", url: "/home", icon: <Home className="w-5 h-5" /> },
    {
      name: "รายชื่อผู้ใช้งานแอปพลิเคชัน",
      url: "/user-list",
      icon: <Users className="w-5 h-5" />,
    },
    // {
    //   name: "ข้อมูล อสม. Thai Phc",
    //   url: "/osm-thaiphc",
    //   icon: <Database className="w-5 h-5" />,
    // },
    {
      name: "รายงาน อสม.1",
      url: "/report-osm1",
      icon: <FileText className="w-5 h-5" />,
      hasSub: true,
    },
    {
      name: "รายงาน ลูกน้ำยุงลาย",
      url: "/report-mosquito",
      icon: <BarChart2 className="w-5 h-5" />,
      hasSub: true,
    },
    {
      name: "ผลตรวจสุขภาพ อสม.",
      url: "/osm-health",
      icon: <BarChart2 className="w-5 h-5" />,
    },
    {
      name: "คัดกรองผู้สูงอายุในชุมชน",
      url: "/elderly-screening",
      icon: <UserCheck className="w-5 h-5" />,
    },
    {
      name: "คัดกรองโรคไม่ติดต่อเรื้อรัง NCDs",
      url: "/ncds-screening",
      icon: <Activity className="w-5 h-5" />,
    },
    {
      name: "รายงานประเมินหญิงตั้งครรภ์",
      url: "/pregnant-report",
      icon: <FileCheck className="w-5 h-5" />,
    },
    {
      name: "รายงานผลการรายงานผลการปฏิบัติงานของอสม.",
      url: "/public-report",
      icon: <FileSpreadsheet className="w-5 h-5" />,
    },
    // {
    //   name: "จัดการคะแนนสะสม อสม.",
    //   url: "/osm-points",
    //   icon: <Gift className="w-5 h-5" />,
    //   hasSub: false,
    // },
    // {
    //   name: "รายงานผลตรวจ ATK",
    //   url: "/atk-report",
    //   icon: <FileSearch className="w-5 h-5" />,
    // },
    { name: "ประกาศข่าวสาร", url: "/news", icon: <Bell className="w-5 h-5" /> },
  ],
  province: [
    { name: "หน้าหลัก", url: "/home", icon: <Home className="w-5 h-5" /> },
    {
      name: "รายชื่อผู้ใช้งานแอปพลิเคชัน",
      url: "/user-list",
      icon: <Users className="w-5 h-5" />,
    },
    // {
    //   name: "ข้อมูล อสม. Thai Phc",
    //   url: "/osm-thaiphc",
    //   icon: <Database className="w-5 h-5" />,
    // },
    {
      name: "รายงาน อสม.1",
      url: "/report-osm1",
      icon: <FileText className="w-5 h-5" />,
      hasSub: true,
    },
    {
      name: "รายงาน ลูกน้ำยุงลาย",
      url: "/report-mosquito",
      icon: <BarChart2 className="w-5 h-5" />,
      hasSub: true,
    },
    {
      name: "ผลตรวจสุขภาพ อสม.",
      url: "/osm-health",
      icon: <BarChart2 className="w-5 h-5" />,
    },
    {
      name: "คัดกรองผู้สูงอายุในชุมชน",
      url: "/elderly-screening",
      icon: <UserCheck className="w-5 h-5" />,
    },
    {
      name: "คัดกรองโรคไม่ติดต่อเรื้อรัง NCDs",
      url: "/ncds-screening",
      icon: <Activity className="w-5 h-5" />,
    },
    {
      name: "รายงานประเมินหญิงตั้งครรภ์",
      url: "/pregnant-report",
      icon: <FileCheck className="w-5 h-5" />,
    },
    {
      name: "รายงานผลการรายงานผลการปฏิบัติงานของอสม.",
      url: "/public-report",
      icon: <FileSpreadsheet className="w-5 h-5" />,
    },
    // {
    //   name: "จัดการคะแนนสะสม อสม.",
    //   url: "/osm-points",
    //   icon: <Gift className="w-5 h-5" />,
    //   hasSub: false,
    // },
    // {
    //   name: "รายงานผลตรวจ ATK",
    //   url: "/atk-report",
    //   icon: <FileSearch className="w-5 h-5" />,
    // },
    { name: "ประกาศข่าวสาร", url: "/news", icon: <Bell className="w-5 h-5" /> },
  ],
  district: [
    { name: "หน้าหลัก", url: "/home", icon: <Home className="w-5 h-5" /> },
    {
      name: "รายชื่อผู้ใช้งานแอปพลิเคชัน",
      url: "/user-list",
      icon: <Users className="w-5 h-5" />,
    },
    // {
    //   name: "ข้อมูล อสม. Thai Phc",
    //   url: "/osm-thaiphc",
    //   icon: <Database className="w-5 h-5" />,
    // },
    {
      name: "รายงาน อสม.1",
      url: "/report-osm1",
      icon: <FileText className="w-5 h-5" />,
      hasSub: false,
    },
    {
      name: "รายงาน ลูกน้ำยุงลาย",
      url: "/report-mosquito",
      icon: <BarChart2 className="w-5 h-5" />,
      hasSub: false,
    },
    {
      name: "ผลตรวจสุขภาพ อสม.",
      url: "/osm-health",
      icon: <BarChart2 className="w-5 h-5" />,
    },
    {
      name: "คัดกรองผู้สูงอายุในชุมชน",
      url: "/elderly-screening",
      icon: <UserCheck className="w-5 h-5" />,
    },
    {
      name: "คัดกรองโรคไม่ติดต่อเรื้อรัง NCDs",
      url: "/ncds-screening",
      icon: <Activity className="w-5 h-5" />,
    },
    {
      name: "รายงานประเมินหญิงตั้งครรภ์",
      url: "/pregnant-report",
      icon: <FileCheck className="w-5 h-5" />,
    },
    {
      name: "รายงานผลการรายงานผลการปฏิบัติงานของอสม.",
      url: "/public-report",
      icon: <FileSpreadsheet className="w-5 h-5" />,
    },
    // {
    //   name: "จัดการคะแนนสะสม อสม.",
    //   url: "/osm-points",
    //   icon: <Gift className="w-5 h-5" />,
    //   hasSub: false,
    // },
    // {
    //   name: "รายงานผลตรวจ ATK",
    //   url: "/atk-report",
    //   icon: <FileSearch className="w-5 h-5" />,
    // },
    { name: "ประกาศข่าวสาร", url: "/news", icon: <Bell className="w-5 h-5" /> },
  ],
  subdistrict: [
    { name: "หน้าหลัก", url: "/home", icon: <Home className="w-5 h-5" /> },
    {
      name: "รายชื่อผู้ใช้งานแอปพลิเคชัน",
      url: "/user-list",
      icon: <Users className="w-5 h-5" />,
    },
    // {
    //   name: "ข้อมูล อสม. Thai Phc",
    //   url: "/osm-thaiphc",
    //   icon: <Database className="w-5 h-5" />,
    // },
    {
      name: "รายงาน อสม.1",
      url: "/report-osm1",
      icon: <FileText className="w-5 h-5" />,
      hasSub: false,
    },
    {
      name: "รายงาน ลูกน้ำยุงลาย",
      url: "/report-mosquito",
      icon: <BarChart2 className="w-5 h-5" />,
      hasSub: false,
    },
    {
      name: "ผลตรวจสุขภาพ อสม.",
      url: "/osm-health",
      icon: <BarChart2 className="w-5 h-5" />,
    },
    {
      name: "คัดกรองผู้สูงอายุในชุมชน",
      url: "/elderly-screening",
      icon: <UserCheck className="w-5 h-5" />,
    },
    {
      name: "คัดกรองโรคไม่ติดต่อเรื้อรัง NCDs",
      url: "/ncds-screening",
      icon: <Activity className="w-5 h-5" />,
    },
    {
      name: "รายงานประเมินหญิงตั้งครรภ์",
      url: "/pregnant-report",
      icon: <FileCheck className="w-5 h-5" />,
    },
    {
      name: "รายงานผลการรายงานผลการปฏิบัติงานของอสม.",
      url: "/public-report",
      icon: <FileSpreadsheet className="w-5 h-5" />,
    },
    // {
    //   name: "จัดการคะแนนสะสม อสม.",
    //   url: "/osm-points",
    //   icon: <Gift className="w-5 h-5" />,
    //   hasSub: false,
    // },
    // {
    //   name: "รายงานผลตรวจ ATK",
    //   url: "/atk-report",
    //   icon: <FileSearch className="w-5 h-5" />,
    // },
    { name: "ประกาศข่าวสาร", url: "/news", icon: <Bell className="w-5 h-5" /> },
  ],
  hospital: [
    { name: "หน้าหลัก", url: "/home", icon: <Home className="w-5 h-5" /> },
    {
      name: "รายชื่อผู้ใช้งานแอปพลิเคชัน",
      url: "/user-list",
      icon: <Users className="w-5 h-5" />,
    },
    // {
    //   name: "ข้อมูล อสม. Thai Phc",
    //   url: "/osm-thaiphc",
    //   icon: <Database className="w-5 h-5" />,
    // },
    {
      name: "รายงาน อสม.1",
      url: "/report-osm1",
      icon: <FileText className="w-5 h-5" />,
      hasSub: false,
    },
    {
      name: "รายงาน ลูกน้ำยุงลาย",
      url: "/report-mosquito",
      icon: <BarChart2 className="w-5 h-5" />,
      hasSub: false,
    },
    {
      name: "ผลตรวจสุขภาพ อสม.",
      url: "/osm-health",
      icon: <BarChart2 className="w-5 h-5" />,
    },
    {
      name: "คัดกรองผู้สูงอายุในชุมชน",
      url: "/elderly-screening",
      icon: <UserCheck className="w-5 h-5" />,
    },
    {
      name: "คัดกรองโรคไม่ติดต่อเรื้อรัง NCDs",
      url: "/ncds-screening",
      icon: <Activity className="w-5 h-5" />,
    },
    {
      name: "รายงานประเมินหญิงตั้งครรภ์",
      url: "/pregnant-report",
      icon: <FileCheck className="w-5 h-5" />,
    },
    {
      name: "รายงานผลการรายงานผลการปฏิบัติงานของอสม.",
      url: "/public-report",
      icon: <FileSpreadsheet className="w-5 h-5" />,
    },
    // {
    //   name: "จัดการคะแนนสะสม อสม.",
    //   url: "/osm-points",
    //   icon: <Gift className="w-5 h-5" />,
    //   hasSub: false,
    // },
    // {
    //   name: "รายงานผลตรวจ ATK",
    //   url: "/atk-report",
    //   icon: <FileSearch className="w-5 h-5" />,
    // },
    { name: "ประกาศข่าวสาร", url: "/news", icon: <Bell className="w-5 h-5" /> },
  ],
};

function getRoleType(auth) {
  if (!auth || !auth.roles || !auth.roles.length) return "sobos";
  const role = auth.roles[0];
  if (role === "สบส.") return "sobos";
  if (role === "เขต") return "zone";
  if (role === "จังหวัด") return "province";
  if (role === "อำเภอ") return "district";
  if (role === "ตำบล") return "subdistrict";
  if (role === "รพสต.") return "hospital";
  return "sobos";
}

const SideMenuComp = ({ onMenuClick = () => {}, onClose, isMobile }) => {
  const router = useRouter();
  const [userInfo, , isLoaded] = useSessionStorage("userInfo", {});
  const isClient = useIsClient();
  const [osm1Open, setOsm1Open] = useState(false); // submenu state (for static fallback)
  const [mosquitoOpen, setMosquitoOpen] = useState(false);
  const [pointsOpen, setPointsOpen] = useState(false);

  // State สำหรับเมนูจาก API
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);

  // State สำหรับเปิด/ปิด submenu จาก API (use Map to support dynamic menus)
  const [openSubmenus, setOpenSubmenus] = useState(new Map());

  // คำนวณ roleType จาก sessionStorage ที่โหลดแล้ว
  const roleType = React.useMemo(() => {
    if (!isClient || !isLoaded) return null;
    return getRoleType(userInfo?.auth);
  }, [isClient, isLoaded, userInfo]);

  // ดึง user's scope level จาก permission_scope
  const userScopeLevel = React.useMemo(() => {
    if (!isClient || !isLoaded) return null;
    return userInfo?.user?.permission_scope?.level || null;
  }, [isClient, isLoaded, userInfo]);

  // ดึง user's position code สำหรับเช็ค permissions
  const userPositionCode = React.useMemo(() => {
    if (!isClient || !isLoaded) return null;

    const user = userInfo?.user;
    const scopeLevel = user?.permission_scope?.level;
    const scopeLevelField = user?.permission_scope?.scope_level; // ลองดู field อื่นด้วย

    // Map จาก scope_level (จาก /lookups/positions) → position_code (จาก database)
    const scopeLevelToCodeMap = {
      "country": "DHS",     // สนับสนุนบริการสุขภาพ (DHS)
      "area": "HA",         // เขตสุขภาพ (HA)
      "subdistrict": "SHP", // รพ.สต. (SHP) - ตาม data จริง
      "province": "PPO",    // จังหวัด (PPO) - ตาม data จริง
      "district": "DPO",    // อำเภอ (DPO) - ตาม data จริง
      "village": "VIL",     // หมู่บ้าน
    };

    // ลองดูแต่ละขั้นตอน
    const step1 = user?.position_code;
    const step2 = user?.role_code;
    const step3 = scopeLevelField ? scopeLevelToCodeMap[scopeLevelField] : null;
    const step4 = scopeLevel ? scopeLevelToCodeMap[scopeLevel] : null;

    const code = step1 || step2 || step3 || step4 || null;

    return code;
  }, [isClient, isLoaded, userInfo]);

  // ดึงเมนูจาก API + permissions จาก backend ตาม role ของ user
  useEffect(() => {
    if (!isClient || !isLoaded) return;

    const fetchMenus = async () => {
      try {
        setMenuLoading(true);

        // ดึง permissions จาก backend ตาม role ของ user ที่ login
        let userPermissions = {};
        try {
          if (userPositionCode) {
            const permissionsData = await getUserMenuPermissions(userPositionCode);

            if (permissionsData.menus && permissionsData.menus.length > 0) {
              permissionsData.menus.forEach(menu => {
                userPermissions[menu.code] = menu.can_view;
              });
            } else {
              console.warn(`No menus found in permissions data for ${userPositionCode}`);
            }
          } else {
            console.warn("No userPositionCode found, skipping permissions fetch");
          }
        } catch (e) {
          console.error(`Failed to fetch permissions for ${userPositionCode}:`, e);
        }

        // ใช้ static menu ตาม roleType
        const staticMenus = roleType ? MENU_MAP[roleType] || MENU_MAP.sobos : [];

        // กรองเมนูตาม permissions (can_view)
        const menusWithPermissions = staticMenus.filter(menu => {
          // ถ้าไม่มี permissions ให้แสดงทั้งหมด (fallback)
          if (Object.keys(userPermissions).length === 0) return true;

          // หา menu code จาก menu name (map กันชั่วคราว)
          const menuCodeMap = {
            "หน้าหลัก": "dashboard",
            "รายชื่อผู้ใช้งานแอปพลิเคชัน": "users",
            "รายงาน อสม.1": "osm1",
            "รายงาน ลูกน้ำยุงลาย": "mosquito",
            "ผลตรวจสุขภาพ อสม.": "health",
            "คัดกรองผู้สูงอายุในชุมชน": "elderly",
            "คัดกรองโรคไม่ติดต่อเรื้อรัง NCDs": "ncds",
            "รายงานประเมินหญิงตั้งครรภ์": "pregnant",
            "ประกาศข่าวสาร": "news",
            "กำหนดสิทธิ์การเข้าถึง": "access_control",
            "จัดการคะแนนสะสม อสม.": "osm-points",
            "รายงานผลตรวจ ATK": "atk-report",
          };

          const menuCode = menuCodeMap[menu.name];
          if (!menuCode) return true; // ไม่รู้จัก menu code ให้แสดง

          // เช็ค can_view
          const canView = userPermissions[menuCode];
          return canView === true; // ต้องเป็น true เท่านั้นถึงแสดง
        });

        // กรองเมนูตาม scope level ของ user (จาก permission_scope.level)
        const filteredMenus = userScopeLevel
          ? filterMenusByScope(menusWithPermissions, userScopeLevel)
          : menusWithPermissions;

        setMenuItems(filteredMenus);

      } catch (error) {
        console.error("Failed to fetch menus:", error);
        // Fallback to static menu
        const fallbackMenu = roleType ? MENU_MAP[roleType] || MENU_MAP.sobos : [];
        setMenuItems(fallbackMenu);
      } finally {
        setMenuLoading(false);
      }
    };

    fetchMenus();
  }, [isClient, isLoaded, userScopeLevel, roleType, userPositionCode]);

  const isActive = (url) => router.pathname === url;

  const go = (item) => {
    if (item.url) {
      router.push(item.url);
      onMenuClick(item.name);
    }
    if (isMobile && onClose) onClose();
  };

  const handleLogoClick = () => {
    router.push("/home");
    onMenuClick("หน้าหลัก");
    if (isMobile && onClose) onClose();
  };

  const handleLogout = () => {
    alertService.confirm("คุณต้องการออกจากระบบใช่ไหม?", "").then((result) => {
      if (result.isConfirmed) {
        sessionStorage.removeItem("userInfo");
        router.push("/");
      }
    });
  };

  // Toggle submenu state for API menus
  const toggleSubmenu = (menuCode) => {
    setOpenSubmenus((prev) => {
      const newMap = new Map(prev);
      newMap.set(menuCode, !newMap.get(menuCode));
      return newMap;
    });
  };

  // Check if menu has children (API menus)
  const hasChildren = (item) => {
    return item.children && item.children.length > 0;
  };

  // Render menu item (supports both API and static menu structures)
  const renderMenuItem = (item) => {
    const isApiMenu = !!item.code; // API menus have 'code' field
    const hasSub = isApiMenu ? hasChildren(item) : item.hasSub;
    const icon = isApiMenu ? getIconComponent(item.icon_name) : item.icon;
    const active = isActive(item.url);
    const isSubOpen = isApiMenu ? openSubmenus.get(item.code) : false;

    // For static menus, use existing submenu logic
    if (!isApiMenu && hasSub) {
      // Existing static submenu handling...
      if (
        item.name === "รายงาน อสม.1" &&
        (roleType === "sobos" ||
          roleType === "zone" ||
          roleType === "province")
      ) {
        const subActive =
          isActive(item.url) ||
          REPORT_OSM1_SUBMENU.some((sub) => isActive(sub.url));
        return (
          <li key={item.url}>
            <button
              type="button"
              className={`
                group w-full flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium
                transition-all duration-200 will-change-transform
                ${
                  subActive
                    ? "bg-white text-purple-800 shadow-sm ring-1 ring-white/60"
                    : "text-[rgba(64,40,97,0.85)] hover:text-purple-800 hover:bg-white/65"
                }
                ${subActive ? "translate-y-0" : "hover:-translate-y-[1px]"}
              `}
              style={
                subActive
                  ? { boxShadow: "0 2px 6px -2px rgba(110,40,183,0.25)" }
                  : {}
              }
              onClick={() => setOsm1Open((o) => !o)}
            >
              <span className="flex items-center justify-center rounded-sm">
                <span
                  className={`
                    flex items-center justify-center rounded-md
                    h-6 w-6 text-[11px]
                    ${
                      subActive
                        ? "bg-gradient-to-br from-[#7d33ca] to-[#b08ae7] text-white shadow-inner shadow-white/20"
                        : "bg-[rgba(255,255,255,0.6)] backdrop-blur-[1px] text-[rgba(110,40,183,0.85)]"
                    }
                    border border-white/50
                  `}
                >
                  {icon}
                </span>
              </span>
              <span className="flex-1 text-left tracking-[0.1px]">
                {item.name}
              </span>
              <ChevronDown
                className={`w-4 h-4 ml-1 transition-transform ${
                  osm1Open ? "rotate-180" : ""
                }`}
              />
            </button>
            {osm1Open && (
              <div className="mt-1 pb-1">
                <div className="bg-[#f4eeff] rounded-lg shadow w-full flex flex-col py-1 px-2">
                  {REPORT_OSM1_SUBMENU.map((sub) => (
                    <button
                      key={sub.url}
                      className={`
                        flex items-center px-2 py-1.5 rounded-md mb-1 last:mb-0 text-sm font-medium
                        transition-all
                        ${
                          isActive(sub.url)
                            ? "bg-white text-[#7e32e2] shadow"
                            : "text-[#6E28B7] hover:bg-[#ece1f7]"
                        }
                      `}
                      onClick={() => {
                        router.push(sub.url);
                        setOsm1Open(true);
                        onMenuClick(sub.name);
                        if (isMobile && onClose) onClose();
                      }}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </li>
        );
      }

      if (
        item.name === "รายงาน ลูกน้ำยุงลาย" &&
        (roleType === "sobos" ||
          roleType === "zone" ||
          roleType === "province")
      ) {
        const subActive =
          isActive(item.url) ||
          REPORT_MOSQUITO_SUBMENU.some((sub) => isActive(sub.url));
        return (
          <li key={item.url}>
            <button
              type="button"
              className={`
                group w-full flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium
                transition-all duration-200 will-change-transform
                ${
                  subActive
                    ? "bg-white text-purple-800 shadow-sm ring-1 ring-white/60"
                    : "text-[rgba(64,40,97,0.85)] hover:text-purple-800 hover:bg-white/65"
                }
                ${subActive ? "translate-y-0" : "hover:-translate-y-[1px]"}
              `}
              style={
                subActive
                  ? { boxShadow: "0 2px 6px -2px rgba(110,40,183,0.25)" }
                  : {}
              }
              onClick={() => setMosquitoOpen((o) => !o)}
            >
              <span className="flex items-center justify-center rounded-sm">
                <span
                  className={`
                    flex items-center justify-center rounded-md
                    h-6 w-6 text-[11px]
                    ${
                      subActive
                        ? "bg-gradient-to-br from-[#7d33ca] to-[#b08ae7] text-white shadow-inner shadow-white/20"
                        : "bg-[rgba(255,255,255,0.6)] backdrop-blur-[1px] text-[rgba(110,40,183,0.85)]"
                    }
                    border border-white/50
                  `}
                >
                  {icon}
                </span>
              </span>
              <span className="flex-1 text-left tracking-[0.1px]">
                {item.name}
              </span>
              <ChevronDown
                className={`w-4 h-4 ml-1 transition-transform ${
                  mosquitoOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {mosquitoOpen && (
              <div className="mt-1 pb-1">
                <div className="bg-[#f4eeff] rounded-lg shadow w-full flex flex-col py-1 px-2">
                  {REPORT_MOSQUITO_SUBMENU.map((sub) => (
                    <button
                      key={sub.url}
                      className={`
                        flex items-center px-2 py-1.5 rounded-md mb-1 last:mb-0 text-sm font-medium
                        transition-all
                        ${
                          isActive(sub.url)
                            ? "bg-white text-[#7e32e2] shadow"
                            : "text-[#6E28B7] hover:bg-[#ece1f7]"
                        }
                      `}
                      onClick={() => {
                        if (sub.name === "ข้อมูลรายงาน ลูกน้ำยุงลาย") {
                          window.location.href = `${sub.url}?_t=${Date.now()}`;
                        } else {
                          router.push(sub.url);
                        }
                        setMosquitoOpen(true);
                        onMenuClick(sub.name);
                        if (isMobile && onClose) onClose();
                      }}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </li>
        );
      }

      if (item.name === "จัดการคะแนนสะสม อสม." && roleType === "sobos") {
        const subActive =
          isActive(item.url) ||
          OSM_POINTS_SUBMENU.some((sub) => isActive(sub.url));
        return (
          <li key={item.url}>
            <button
              type="button"
              className={`
                group w-full flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium
                transition-all duration-200 will-change-transform
                ${
                  subActive
                    ? "bg-white text-purple-800 shadow-sm ring-1 ring-white/60"
                    : "text-[rgba(64,40,97,0.85)] hover:text-purple-800 hover:bg-white/65"
                }
                ${subActive ? "translate-y-0" : "hover:-translate-y-[1px]"}
              `}
              style={
                subActive
                  ? { boxShadow: "0 2px 6px -2px rgba(110,40,183,0.25)" }
                  : {}
              }
              onClick={() => setPointsOpen((o) => !o)}
            >
              <span className="flex items-center justify-center rounded-sm">
                <span
                  className={`
                    flex items-center justify-center rounded-md
                    h-6 w-6 text-[11px]
                    ${
                      subActive
                        ? "bg-gradient-to-br from-[#7d33ca] to-[#b08ae7] text-white shadow-inner shadow-white/20"
                        : "bg-[rgba(255,255,255,0.6)] backdrop-blur-[1px] text-[rgba(110,40,183,0.85)]"
                    }
                    border border-white/50
                  `}
                >
                  {icon}
                </span>
              </span>
              <span className="flex-1 text-left tracking-[0.1px]">
                {item.name}
              </span>
              <ChevronDown
                className={`w-4 h-4 ml-1 transition-transform ${
                  pointsOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {pointsOpen && (
              <div className="mt-1 pb-1">
                <div className="bg-[#f4eeff] rounded-lg shadow w-full flex flex-col py-1 px-2">
                  {OSM_POINTS_SUBMENU.map((sub) => (
                    <button
                      key={sub.url}
                      className={`
                        flex items-center px-2 py-1.5 rounded-md mb-1 last:mb-0 text-sm font-medium
                        transition-all
                        ${
                          isActive(sub.url)
                            ? "bg-white text-[#7e32e2] shadow"
                            : "text-[#6E28B7] hover:bg-[#ece1f7]"
                        }
                      `}
                      onClick={() => {
                        router.push(sub.url);
                        setPointsOpen(true);
                        onMenuClick(sub.name);
                        if (isMobile && onClose) onClose();
                      }}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </li>
        );
      }
    }

    // API menus with children
    if (isApiMenu && hasSub) {
      const subActive =
        isActive(item.url) ||
        (item.children && item.children.some((sub) => isActive(sub.url)));

      return (
        <li key={item.code || item.url}>
          <button
            type="button"
            className={`
              group w-full flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium
              transition-all duration-200 will-change-transform
              ${
                subActive
                  ? "bg-white text-purple-800 shadow-sm ring-1 ring-white/60"
                  : "text-[rgba(64,40,97,0.85)] hover:text-purple-800 hover:bg-white/65"
              }
              ${subActive ? "translate-y-0" : "hover:-translate-y-[1px]"}
            `}
            style={
              subActive
                ? { boxShadow: "0 2px 6px -2px rgba(110,40,183,0.25)" }
                : {}
            }
            onClick={() => toggleSubmenu(item.code)}
          >
            <span className="flex items-center justify-center rounded-sm">
              <span
                className={`
                  flex items-center justify-center rounded-md
                  h-6 w-6 text-[11px]
                  ${
                    subActive
                      ? "bg-gradient-to-br from-[#7d33ca] to-[#b08ae7] text-white shadow-inner shadow-white/20"
                      : "bg-[rgba(255,255,255,0.6)] backdrop-blur-[1px] text-[rgba(110,40,183,0.85)]"
                  }
                  border border-white/50
                `}
              >
                {icon}
              </span>
            </span>
            <span className="flex-1 text-left tracking-[0.1px]">
              {item.name_th || item.name}
            </span>
            <ChevronDown
              className={`w-4 h-4 ml-1 transition-transform ${
                isSubOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {isSubOpen && item.children && (
            <div className="mt-1 pb-1">
              <div className="bg-[#f4eeff] rounded-lg shadow w-full flex flex-col py-1 px-2">
                {item.children.map((sub) => (
                  <button
                    key={sub.code || sub.url}
                    className={`
                      flex items-center px-2 py-1.5 rounded-md mb-1 last:mb-0 text-sm font-medium
                      transition-all
                      ${
                        isActive(sub.url)
                          ? "bg-white text-[#7e32e2] shadow"
                          : "text-[#6E28B7] hover:bg-[#ece1f7]"
                      }
                    `}
                    onClick={() => {
                      router.push(sub.url);
                      onMenuClick(sub.name_th || sub.name);
                      if (isMobile && onClose) onClose();
                    }}
                  >
                    {sub.name_th || sub.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </li>
      );
    }

    // Regular menu item (no submenu)
    return (
      <li key={item.code || item.url}>
        <button
          onClick={() => go(item)}
          className={`
            group w-full flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium
            transition-all duration-200 will-change-transform
            ${
              active
                ? "bg-white text-purple-800 shadow-sm ring-1 ring-white/60"
                : "text-[rgba(64,40,97,0.85)] hover:text-purple-800 hover:bg-white/65"
            }
            ${active ? "translate-y-0" : "hover:-translate-y-[1px]"}
          `}
          style={
            active
              ? { boxShadow: "0 2px 6px -2px rgba(110,40,183,0.25)" }
              : {}
          }
        >
          <span className="flex items-center justify-center rounded-sm">
            <span
              className={`
                flex items-center justify-center rounded-md
                h-6 w-6 text-[11px]
                ${
                  active
                    ? "bg-gradient-to-br from-[#7d33ca] to-[#b08ae7] text-white shadow-inner shadow-white/20"
                    : "bg-[rgba(255,255,255,0.6)] backdrop-blur-[1px] text-[rgba(110,40,183,0.85)]"
                }
                border border-white/50
              `}
            >
              {icon}
            </span>
          </span>
          <span
            className={`flex-1 text-left tracking-[0.1px] ${
              active ? "text-[13px]" : ""
            }`}
          >
            {isApiMenu ? (item.name_th || item.name) : item.name}
          </span>
          {active && (
            <span
              className="h-2 w-2 rounded-full bg-gradient-to-br from-[#9c52ea] to-[#6E28B7] shadow-sm shadow-[#6E28B7]/40"
              aria-hidden="true"
            />
          )}
        </button>
      </li>
    );
  };

  if (!roleType) {
    // SSR phase หรือรอ client hydration, render placeholder
    return <div style={{ width: 240, minHeight: "100vh" }} />;
  }

  return (
    <aside
      className={`
        relative flex flex-col
        ${isMobile ? "h-screen w-60" : "min-h-screen w-60"}
        shadow-sm
        side-menu-gradient
      `}
    >
      {/* Decorative subtle radial glow */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.55] [background:radial-gradient(circle_at_70%_30%,rgba(110,40,183,0.18),transparent_60%)]" />

      {/* Header */}
      <div className="relative flex items-center justify-between px-5 pt-5 pb-4">
        <button
          onClick={handleLogoClick}
          className="flex items-center group select-none"
        >
          <div className="flex items-center justify-center rounded-md">
            <Image
              src="/Smart_Osm_Plus.png"
              alt="Logo"
              width={528}
              height={128}
              priority
              unoptimized
              className="drop-shadow-md"
            />
          </div>
        </button>
        {isMobile && (
          <button
            onClick={onClose}
            className="ml-2 p-1 rounded-md text-gray-500 hover:bg-white/60 hover:text-gray-800 transition"
            aria-label="Close menu"
          >
            ✕
          </button>
        )}
      </div>

      {/* Menu */}
      <nav
        className={`relative flex-1 px-4 pt-1 pb-4 ${
          isMobile ? "overflow-y-auto" : ""
        }`}
      >
        <ul className="space-y-2">
          {menuItems.map((item) => renderMenuItem(item))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="relative mt-auto px-3 pb-4">
        <button
          onClick={handleLogout}
          className="group w-full flex items-center gap-2 text-[12.5px] font-medium text-[rgba(64,40,97,0.75)] hover:text-rose-600 rounded-md px-2 py-2 transition-colors"
        >
          <span className="flex items-center justify-center h-6 w-6 rounded-md border border-white/60 bg-white/70 text-[rgba(110,40,183,0.8)] group-hover:border-rose-200 group-hover:text-rose-600">
            <LogOut className="w-4 h-4" />
          </span>
          <span>ออกจากระบบ</span>
        </button>
      </div>

      {/* Scrollbar styling (only if scrollable) */}
      <style jsx>{`
        nav::-webkit-scrollbar {
          width: 6px;
        }
        nav::-webkit-scrollbar-track {
          background: transparent;
        }
        nav::-webkit-scrollbar-thumb {
          background: rgba(110, 40, 183, 0.25);
          border-radius: 3px;
        }
        nav::-webkit-scrollbar-thumb:hover {
          background: rgba(110, 40, 183, 0.4);
        }
      `}</style>

      {/* Component specific gradient */}
      <style jsx>{`
        .side-menu-gradient {
          background: linear-gradient(
            180deg,
            #f9f6ff 0%,
            #f3edfb 40%,
            #ece1f7 75%,
            #e7daf4 100%
          );
        }
      `}</style>
    </aside>
  );
};

export default SideMenuComp;
