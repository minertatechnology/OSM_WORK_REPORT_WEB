import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import {
  LogOut,
  Database,
  Layers3,
  // Add more icons if needed
} from "lucide-react";
import alertService from "@services/alertService/alertService";

/*
  SideMenuComp (รีดีไซน์ให้เหมือนตัวอย่างรูป)
  จุดเด่นใหม่:
    - พื้นหลังไล่เฉดม่วงอ่อน (gradient + subtle radial)
    - Logo: รูป (D) + ตัวหนังสือ ASHBORD
    - เมนูสไตล์ "pill card" สีขาวเฉพาะรายการที่ active
    - สีหลัก #6E28B7
    - เมนูสั้น 2 รายการตามตัวอย่าง (ปรับ/เพิ่มได้ง่าย)
    - Hover: ขึ้นเล็กน้อย + เฉดม่วงจาง
    - Logout อยู่ล่างติด (sticky bottom)
    - รองรับ mobile (ปุ่มปิด)
*/

const PRIMARY = "#6E28B7";

const menuItems = [
  {
    name: "ข้อมูล Smart อสม.",
    url: "/smart-osm",
    icon: <Database className="w-4 h-4" strokeWidth={2} />,
  },
  {
    name: "ข้อมูล 3 หมอ รู้จักคุณ",
    url: "/three-doc",
    icon: <Layers3 className="w-4 h-4" strokeWidth={2} />,
  },
];

const SideMenuComp = ({ onMenuClick = () => {}, onClose, isMobile }) => {
  const router = useRouter();

  const isActive = (url) => router.pathname === url;

  const go = (item) => {
    if (item.url) {
      router.push(item.url);
      onMenuClick(item.name);
    }
    if (isMobile && onClose) onClose();
  };

  const handleLogoClick = () => {
    // ไปหน้าหลักของ Smart อสม. (หรือแก้ตามจริง)
    router.push("/smart-osm");
    onMenuClick("ข้อมูล Smart อสม.");
    if (isMobile && onClose) onClose();
  };

  const handleLogout = () => {
    alertService.confirm("คุณต้องการออกจากระบบใช่ไหม?", "").then((result) => {
      if (result.isConfirmed) {
        router.push("/");
      }
    });
  };

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
            {/* โลโก้ตัว D (ปรับ path / ขนาดตามจริง) */}
            <Image
              src="/logodb.png"
              alt="Logo"
              width={40}
              height={40}
              priority
              className="drop-shadow-md"
            />
          </div>
          <div className="ml-2">
            <div
              className="font-extrabold tracking-wide text-[18px] leading-none"
              style={{ color: PRIMARY }}
            >
              ASHBORD
            </div>
            {/* ถ้าต้องการ tagline เพิ่มได้
            <div className="text-[11px] text-gray-500 -mt-[2px]">
              ระบบบริหารจัดการ อสม.
            </div>
            */}
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
                  <span
                    className={`
                      flex items-center justify-center rounded-sm
                      ${
                        active
                          ? "text-[length:0px]" /* icon recolor below */
                          : ""
                      }
                    `}
                  >
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
