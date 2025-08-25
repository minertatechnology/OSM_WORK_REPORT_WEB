import React, { useState, useEffect } from "react";
import SideMenuComp from "@components/SideMenuComp/SideMenuComp";
import { Menu } from "lucide-react";
import { useLoading } from "@context/LoadingProvider";
import Image from "next/image";

/*
  Layout + Navbar (เวอร์ชัน title คงที่ "ข้อมูล Smart อสม.")
  เพิ่มไอคอน icon1.png (จาก public/icon1.png) ด้านหน้าข้อความ title
*/

const PRIMARY = "#6E28B7";

const Navbar = ({
  onToggleSidebar,
  isMobile,
  userName = "นาย เกษตร รุ่งเรือง",
  userProvince = "จังหวัด นนทบุรี",
}) => {
  return (
    <div
      className={`${
        isMobile ? "h-11" : "h-14"
      } bg-white border-b border-gray-200 flex items-center justify-between px-3 lg:px-6`}
    >
      {/* Left: ICON + FIXED TITLE */}
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

        {/* ไอคอนจาก public/icon1.png */}
        <div className="flex items-center">
          <Image
            src="/icon1.png"
            alt="icon"
            width={isMobile ? 18 : 20}
            height={isMobile ? 18 : 20}
            priority
            className="object-contain select-none"
          />
        </div>

        <span
          className={`font-medium ${
            isMobile ? "text-[13px]" : "text-[14px]"
          } tracking-[0.2px]`}
          style={{ color: PRIMARY }}
        >
          ข้อมูล Smart อสม.
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
          <div
            className={`${
              isMobile ? "text-[10px]" : "text-[11px]"
            } font-medium`}
            style={{ color: PRIMARY }}
          >
            {userProvince}
          </div>
        </div>
      </div>
    </div>
  );
};

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { setLoading } = useLoading();

  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const handleMenuClick = () => {
    setLoading(true);
    if (isMobile) setIsSidebarOpen(false);
    setTimeout(() => setLoading(false), 700);
  };

  const toggleSidebar = () => setIsSidebarOpen((o) => !o);

  return (
    <div className="flex h-screen relative">
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
          userName="นาย เกษตร รุ่งเรือง"
          userProvince="จังหวัด นนทบุรี"
        />
        <main className="flex-1 p-3 lg:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
