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
} from "lucide-react";
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

// Submenus
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
  const [osm1Open, setOsm1Open] = useState(false); // submenu state
  const [mosquitoOpen, setMosquitoOpen] = useState(false);
  const [pointsOpen, setPointsOpen] = useState(false);

  // คำนวณ roleType จาก sessionStorage ที่โหลดแล้ว
  const roleType = React.useMemo(() => {
    if (!isClient || !isLoaded) return null;
    return getRoleType(userInfo?.auth);
  }, [isClient, isLoaded, userInfo]);

  const menuItems = roleType ? MENU_MAP[roleType] || MENU_MAP.sobos : [];

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
          {menuItems.map((item) => {
            // Submenu รายงาน อสม.1 (เฉพาะ sobos, zone, province)
            if (
              item.name === "รายงาน อสม.1" &&
              (roleType === "sobos" ||
                roleType === "zone" ||
                roleType === "province")
            ) {
              const active =
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
                    onClick={() => setOsm1Open((o) => !o)}
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
                        {item.icon}
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
                              onMenuClick(sub.name); // <--- ส่งชื่อ submenu
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

            // Submenu รายงาน ลูกน้ำยุงลาย (เฉพาะ sobos, zone, province)
            if (
              item.name === "รายงาน ลูกน้ำยุงลาย" &&
              (roleType === "sobos" ||
                roleType === "zone" ||
                roleType === "province")
            ) {
              const active =
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
                    onClick={() => setMosquitoOpen((o) => !o)}
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
                        {item.icon}
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
                              // รีเฟรชหน้าอัตโนมัติสำหรับเมนู "ข้อมูลรายงาน ลูกน้ำยุงลาย"
                              if (sub.name === "ข้อมูลรายงาน ลูกน้ำยุงลาย") {
                                // Add timestamp to force reload
                                window.location.href = `${sub.url}?_t=${Date.now()}`;
                              } else {
                                router.push(sub.url);
                              }
                              setMosquitoOpen(true);
                              onMenuClick(sub.name); // <--- ส่งชื่อ submenu
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

            // Submenu จัดการคะแนนสะสม อสม. (เฉพาะ sobos)
            if (item.name === "จัดการคะแนนสะสม อสม." && roleType === "sobos") {
              const active =
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
                    onClick={() => setPointsOpen((o) => !o)}
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
                        {item.icon}
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
                              onMenuClick(sub.name); // <--- ส่งชื่อ submenu
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

            // เมนูปกติ
            const active = isActive(item.url);
            return (
              <li key={item.url}>
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
                      {item.icon}
                    </span>
                  </span>
                  <span
                    className={`flex-1 text-left tracking-[0.1px] ${
                      active ? "text-[13px]" : ""
                    }`}
                  >
                    {item.name}
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
          })}
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
