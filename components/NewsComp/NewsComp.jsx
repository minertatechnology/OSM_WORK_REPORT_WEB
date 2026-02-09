import React, { useState, useMemo, useEffect, useTransition } from "react";
import {
  Plus,
  Calendar,
  Search,
  ChevronsLeft,
  ChevronLeft,
  ChevronsRight,
  ChevronRight,
  Megaphone,
  FileText,
  X,
  MapPin,
} from "lucide-react";
import NewsCompService from "@services/Table/NewsCompService";
import NewsAddPopup from "@components/NewsComp/NewsAddPopup";
import CustomSelect from "@services/customSelectService/customSelectService";
import ToastManager, { showToast } from "@components/Toast/ToastManager";
import {
  fetchNotifications,
  createNotification,
  deleteNotification,
  transformNotificationData,
} from "@services/notificationService/notificationService";
import { usePermissionFilters } from "@hooks/usePermissionFilters";
import { useUserPermission } from "@context/UserPermissionProvider";
import {
  getCurrentFiscalYear,
  generateFiscalYearOptions,
  isInFiscalYear,
  isInCalendarYear,
  parseThaiDate,
} from "@utils/fiscalYearHelper";

// Dummy auth สำหรับตัวอย่าง
const dummyAuth = { roles: ["สบส."] };

// เดือน options (ปกติ - เริ่มต้นเดือนมกราคม)
const MONTHS = [
  { label: "มกราคม", value: "01" },
  { label: "กุมภาพันธ์", value: "02" },
  { label: "มีนาคม", value: "03" },
  { label: "เมษายน", value: "04" },
  { label: "พฤษภาคม", value: "05" },
  { label: "มิถุนายน", value: "06" },
  { label: "กรกฎาคม", value: "07" },
  { label: "สิงหาคม", value: "08" },
  { label: "กันยายน", value: "09" },
  { label: "ตุลาคม", value: "10" },
  { label: "พฤศจิกายน", value: "11" },
  { label: "ธันวาคม", value: "12" },
];

// เดือน options (ปีงบประมาณ - เริ่มต้นเดือนตุลาคม)
const FISCAL_MONTHS = [
  { label: "ตุลาคม", value: "10" },
  { label: "พฤศจิกายน", value: "11" },
  { label: "ธันวาคม", value: "12" },
  { label: "มกราคม", value: "01" },
  { label: "กุมภาพันธ์", value: "02" },
  { label: "มีนาคม", value: "03" },
  { label: "เมษายน", value: "04" },
  { label: "พฤษภาคม", value: "05" },
  { label: "มิถุนายน", value: "06" },
  { label: "กรกฎาคม", value: "07" },
  { label: "สิงหาคม", value: "08" },
  { label: "กันยายน", value: "09" },
];

// ประเภทปี options
const YEAR_TYPES = [
  { label: "ปีงบประมาณ", value: "fiscal" },
  { label: "รายปี", value: "calendar" },
];

// ตัวเลือกสัปดาห์ (1 เดือนมี 4-5 สัปดาห์)
const weeks = [
  "สัปดาห์ที่ 1 (1-7)",
  "สัปดาห์ที่ 2 (8-14)",
  "สัปดาห์ที่ 3 (15-21)",
  "สัปดาห์ที่ 4 (22-28)",
  "สัปดาห์ที่ 5 (29-31)",
];

// Table with Pagination
function TableWithPagination({
  data = [],
  defaultItemsPerPage = 10,
  onDetail,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex).map((row, idx) => ({
      ...row,
      no: startIndex + idx + 1,
    }));
  }, [data, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, data.length);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <NewsCompService rows={paginatedData} onDetail={onDetail} />
      </div>
      {/* Pagination - Always show items per page selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-purple-100">
        {data.length > 0 && (
        <div className="text-sm text-gray-600">
          <span className="hidden sm:inline">
            แสดง{" "}
            <span className="font-semibold text-purple-600">{startItem}</span>{" "}
            ถึง{" "}
            <span className="font-semibold text-purple-600">{endItem}</span>{" "}
            จาก{" "}
          </span>
          <span className="font-semibold text-purple-600">{data.length}</span>
          <span className="sm:hidden"> รายการทั้งหมด</span>
          <span className="hidden sm:inline"> รายการ</span>
        </div>
        )}
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">
              แสดง
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="appearance-none border border-purple-200 rounded-lg px-3 py-2 pr-8 text-sm font-semibold text-purple-600 bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-transparent hover:border-purple-400 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-600">รายการต่อหน้า</span>
          </div>
          {totalPages > 1 && (
          <div className="flex items-center gap-1">
          <button
            title="หน้าแรก"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className={`hidden sm:flex p-2 rounded-lg transition-all ${
              currentPage === 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-purple-600 bg-purple-50 hover:bg-purple-100"
            }`}
          >
            <ChevronsLeft size={18} />
          </button>
          <button
            title="หน้าก่อนหน้า"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-lg transition-all ${
              currentPage === 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-purple-600 bg-purple-50 hover:bg-purple-100"
            }`}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="hidden sm:flex items-center gap-1 mx-2">
            {getPageNumbers().map((page, idx) =>
              page === "..." ? (
                <span key={idx} className="px-2 text-gray-400">
                  ...
                </span>
              ) : (
                <button
                  key={idx}
                  onClick={() => handlePageChange(page)}
                  className={`min-w-[36px] h-9 rounded-lg font-semibold transition-all ${
                    currentPage === page
                      ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md"
                      : "text-purple-600 hover:bg-purple-50"
                  }`}
                >
                  {page}
                </button>
              )
            )}
          </div>
          <div className="sm:hidden mx-2 text-sm text-gray-600 font-medium">
            {currentPage} / {totalPages}
          </div>
          <button
            title="หน้าถัดไป"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-lg transition-all ${
              currentPage === totalPages
                ? "text-gray-300 cursor-not-allowed"
                : "text-purple-600 bg-purple-50 hover:bg-purple-100"
            }`}
          >
            <ChevronRight size={18} />
          </button>
          <button
            title="หน้าสุดท้าย"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={`hidden sm:flex p-2 rounded-lg transition-all ${
              currentPage === totalPages
                ? "text-gray-300 cursor-not-allowed"
                : "text-purple-600 bg-purple-50 hover:bg-purple-100"
            }`}
          >
            <ChevronsRight size={18} />
          </button>
        </div>
        )}
        </div>
      </div>
    </div>
  );
}

// Inner component that uses the hooks (client-only)
const NewsCompContent = () => {
  const currentFiscalYear = getCurrentFiscalYear();
  const YEARS = generateFiscalYearOptions(currentFiscalYear - 4, currentFiscalYear);

  // Use permission-based filters
  const { isLocked } = useUserPermission();
  const {
    yearType,
    year,
    month,
    zone,
    province,
    district,
    subdistrict,
    service,
    setYearType,
    setYear,
    setMonth,
    handleZoneChange,
    handleProvinceChange,
    handleDistrictChange,
    handleSubdistrictChange,
    handleServiceChange,
    healthAreas,
    provinces,
    districts,
    subdistricts,
    healthServices,
    handleReset,
    isDistrictDisabled,
    isSubdistrictDisabled,
    isServiceDisabled,
  } = usePermissionFilters({
    defaultYear: String(currentFiscalYear),
    defaultYearType: "fiscal",
  });

  const [week, setWeek] = useState("");
  const [rawNewsList, setRawNewsList] = useState([]);
  const [filteredNews, setFilteredNews] = useState([]);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(false);

  // แปลงข้อมูล location เป็น options สำหรับ CustomSelect (ใช้เฉพาะชื่อภาษาไทย)
  const healthAreaOptions = healthAreas.map(ha => ({
    label: ha.name_th,
    value: ha.code
  }));

  const provinceOptions = provinces.map(p => ({
    label: p.name_th,
    value: p.code
  }));

  const districtOptions = districts.map(d => ({
    label: d.name_th,
    value: d.code
  }));

  const subdistrictOptions = subdistricts.map(sd => ({
    label: sd.name_th,
    value: sd.code
  }));

  const healthServiceOptions = healthServices.map(hs => ({
    label: hs.name_th,
    value: hs.id
  }));

  // ดึงข้อมูลจาก API เมื่อ component โหลด
  useEffect(() => {
    loadNotifications();
  }, []);

  // ฟังก์ชันดึงข้อมูลจาก API
  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetchNotifications({
        skip: 0,
        limit: 1000,
        is_active: true, // ดึงเฉพาะที่ active
      });

      console.log("API Response:", response);
      console.log("Notifications:", response.notifications);

      const notifications = transformNotificationData(
        response.notifications || []
      );

      console.log("Transformed notifications:", notifications);

      // กรองเฉพาะ type: "info"
      const infoOnlyNotifications = notifications.filter(n => n.type === "info");

      setRawNewsList(infoOnlyNotifications);
      setFilteredNews(infoOnlyNotifications);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      showToast("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง", "error");
    } finally {
      setLoading(false);
    }
  };

  // เลือกรายการเดือนตามประเภทปี
  const monthOptions = useMemo(() => {
    return yearType === "fiscal" ? FISCAL_MONTHS : MONTHS;
  }, [yearType]);

  // ดูรายละเอียดข่าวสาร
  const handleDetail = (item) => {
    setDetailData(item);
    setShowDetailPopup(true);
  };

  // เพิ่มข่าวสาร
  const handleAddNews = () => {
    setShowAddPopup(true);
  };
  const handleClosePopup = () => {
    setShowAddPopup(false);
  };
  const handleSubmitPopup = async (data) => {
    try {
      console.log("=== handleSubmitPopup Debug ===");
      console.log("received data:", data);
      console.log("healthZone:", data.healthZone, "healthZoneData:", data.healthZoneData);
      console.log("province:", data.province, "provinceData:", data.provinceData);
      console.log("amphur:", data.amphur, "amphurData:", data.amphurData);
      console.log("subdistrict:", data.subdistrict, "subdistrictData:", data.subdistrictData);
      console.log("serviceUnit:", data.serviceUnit, "serviceUnitData:", data.serviceUnitData);

      // สร้าง target_location JSON จากข้อมูลพื้นที่ที่เลือก
      // เอาทุกระดับมาเสมอ ไม่ว่าจะเป็นค่าปกติหรือ "all"
      const target_location = {};

      // เขตสุขภาพ
      if (data.healthZoneData && data.healthZoneData.code && data.healthZoneData.code !== "") {
        target_location.health_zone = {
          id: data.healthZoneData.code,
          name: data.healthZoneData.name_th
        };
        console.log("Added health_zone:", target_location.health_zone);
      }

      // จังหวัด
      if (data.provinceData && data.provinceData.code && data.provinceData.code !== "") {
        target_location.province = {
          id: data.provinceData.code,
          name: data.provinceData.name_th
        };
        console.log("Added province:", target_location.province);
      }

      // อำเภอ
      if (data.amphurData && data.amphurData.code && data.amphurData.code !== "") {
        target_location.district = {
          id: data.amphurData.code,
          name: data.amphurData.name_th
        };
        console.log("Added district:", target_location.district);
      }

      // ตำบล
      if (data.subdistrictData && data.subdistrictData.code && data.subdistrictData.code !== "") {
        target_location.subdistrict = {
          id: data.subdistrictData.code,
          name: data.subdistrictData.name_th
        };
        console.log("Added subdistrict:", target_location.subdistrict);
      }

      // หน่วยบริการ
      if (data.serviceUnitData && data.serviceUnitData.id && data.serviceUnitData.id !== "") {
        target_location.service_unit = {
          id: data.serviceUnitData.id,
          name: data.serviceUnitData.name_th
        };
        console.log("Added service_unit:", target_location.service_unit);
      }

      console.log("Final target_location:", JSON.stringify(target_location, null, 2));

      // กำหนด target_level เป็น all เสมอ (สำหรับ admin ที่สร้างข่าวสาร)
      // เพื่อให้ทุกคนเห็นได้ และใช้ target_location สำหรับกรองตามพื้นที่จริง
      const target_level = "all";

      // สร้างข้อมูลสำหรับส่ง API
      const notificationData = {
        title: data.title,
        message: data.detail || data.message,
        type: "info",
        target_level: target_level,
        target_location: Object.keys(target_location).length > 0 ? target_location : null,
        is_active: true,
        is_pinned: false,
        priority: 0,
        author_name: dummyAuth.roles[0] || "Admin",
      };

      // เรียก API สร้าง notification
      await createNotification(notificationData);

      // โหลดข้อมูลใหม่ทันทีเพื่อแสดงผล real-time
      await loadNotifications();

      setShowAddPopup(false);
      showToast("เพิ่มข่าวสารสำเร็จ!", "success");
    } catch (error) {
      console.error("Failed to create notification:", error);
      showToast("ไม่สามารถเพิ่มข่าวสารได้ กรุณาลองใหม่อีกครั้ง", "error");
    }
  };

  // ปิด popup ดูรายละเอียด
  const handleCloseDetailPopup = () => {
    setShowDetailPopup(false);
    setDetailData(null);
  };

  // ลบข้อมูล
  const handleDeleteDetail = async (item) => {
    if (!confirm("ต้องการลบข่าวสารนี้?")) return;

    try {
      await deleteNotification(item.id);

      // โหลดข้อมูลใหม่
      await loadNotifications();

      setShowDetailPopup(false);
      setDetailData(null);
      showToast("ลบข่าวสารสำเร็จ!", "success");
    } catch (error) {
      console.error("Failed to delete notification:", error);
      showToast("ไม่สามารถลบข่าวสารได้ กรุณาลองใหม่อีกครั้ง", "error");
    }
  };

  // ล้างข้อมูลค้นหา
  const resetAll = () => {
    handleReset(String(currentFiscalYear), "fiscal");
    setWeek("");
    setFilteredNews(rawNewsList);
  };

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    let filtered = rawNewsList;

    // กรองตามวันที่ (แปลงจาก date string)
    if (year || month || week) {
      filtered = filtered.filter((n) => {
        const dateStr = n.date || "";

        // แปลงวันที่ไทยเป็น Date object
        const parsedDate = parseThaiDate(dateStr);
        if (!parsedDate) return false;

        // เช็คปี
        if (year) {
          const yearNum = parseInt(year);
          const matchesYear = yearType === "fiscal"
            ? isInFiscalYear(parsedDate, yearNum)
            : isInCalendarYear(parsedDate, yearNum);
          if (!matchesYear) return false;
        }

        // เช็คเดือน
        if (month) {
          const targetMonth = parseInt(month);
          if (parsedDate.getMonth() + 1 !== targetMonth) return false;
        }

        // สัปดาห์ - ต้องแปลงวันที่เป็นตัวเลข
        if (week) {
          const match = dateStr.match(/^(\d+)/);
          if (match) {
            const day = parseInt(match[1]);
            const weekNum = parseInt(week.match(/\d+/)[0]);

            const weekRanges = {
              1: [1, 7],
              2: [8, 14],
              3: [15, 21],
              4: [22, 28],
              5: [29, 31],
            };

            const range = weekRanges[weekNum];
            if (range && (day < range[0] || day > range[1])) return false;
          }
        }

        return true;
      });
    }

    setFilteredNews(filtered);
  };

  // Stats data
  const totalNews = rawNewsList.length;
  const currentYear = "2568";
  const thisYearNews = rawNewsList.filter((n) =>
    (n.date || "").includes(currentYear)
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg">
                <Megaphone className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                  ประกาศข่าวสาร
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  จัดการข่าวสารและประกาศ
                </p>
              </div>
            </div>
            <button
              onClick={handleAddNews}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
            >
              <Plus size={20} />
              <span>เพิ่มข่าวสาร</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-md border border-purple-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-violet-100 rounded-xl">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">ข่าวสารทั้งหมด</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                  {totalNews}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-md border border-purple-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl">
                <Calendar className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">ข่าวสารปี {currentYear}</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  {thisYearNews}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Box */}
        <form
          onSubmit={handleSearch}
          className="bg-white rounded-2xl shadow-lg border border-purple-100 p-5 sm:p-6 mb-6"
        >
          {/* Year Type Radio */}
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              รูปแบบการค้นหา
            </p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    yearType === "calendar"
                      ? "border-purple-600 bg-purple-600"
                      : "border-gray-300 group-hover:border-purple-400"
                  }`}
                >
                  {yearType === "calendar" && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${
                    yearType === "calendar"
                      ? "text-purple-600"
                      : "text-gray-600"
                  }`}
                >
                  ค้นหาแบบรายปี
                </span>
                <input
                  type="radio"
                  name="yearType"
                  checked={yearType === "calendar"}
                  onChange={() => setYearType("calendar")}
                  className="sr-only"
                />
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    yearType === "fiscal"
                      ? "border-purple-600 bg-purple-600"
                      : "border-gray-300 group-hover:border-purple-400"
                  }`}
                >
                  {yearType === "fiscal" && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${
                    yearType === "fiscal"
                      ? "text-purple-600"
                      : "text-gray-600"
                  }`}
                >
                  ค้นหาแบบรายปีงบประมาณ
                </span>
                <input
                  type="radio"
                  name="yearType"
                  checked={yearType === "fiscal"}
                  onChange={() => setYearType("fiscal")}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          {/* Date Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {/* Year */}
            <CustomSelect
              label="ปี"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              options={YEARS}
              placeholder="-- เลือกปี --"
              icon={Calendar}
            />

            {/* Month */}
            <CustomSelect
              label="เดือน"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              options={monthOptions}
              placeholder="-- เลือกเดือน --"
              icon={Calendar}
            />

            {/* Week */}
            <CustomSelect
              label="สัปดาห์"
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              options={weeks.map((w) => ({ label: w, value: w }))}
              placeholder="-- เลือกสัปดาห์ --"
              icon={Calendar}
            />
          </div>

          {/* Location Filters: เขตสุขภาพ จังหวัด อำเภอ ตำบล หน่วยบริการ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-5">
            <CustomSelect
              label="เขตสุขภาพ"
              placeholder="เลือกเขต"
              value={zone}
              onChange={(e) => handleZoneChange(e.target.value)}
              options={healthAreaOptions}
              icon={MapPin}
            />
            <CustomSelect
              label="จังหวัด"
              placeholder="เลือกจังหวัด"
              value={province}
              onChange={(e) => handleProvinceChange(e.target.value)}
              options={provinceOptions}
              icon={MapPin}
            />
            <CustomSelect
              label="อำเภอ"
              placeholder="เลือกอำเภอ"
              value={district}
              onChange={(e) => handleDistrictChange(e.target.value)}
              options={districtOptions}
              disabled={isDistrictDisabled}
              icon={MapPin}
            />
            <CustomSelect
              label="ตำบล"
              placeholder="เลือกตำบล"
              value={subdistrict}
              onChange={(e) => handleSubdistrictChange(e.target.value)}
              options={subdistrictOptions}
              disabled={isSubdistrictDisabled}
              icon={MapPin}
            />
            <CustomSelect
              label="หน่วยบริการ"
              placeholder="เลือกหน่วยบริการ"
              value={service}
              onChange={(e) => handleServiceChange(e.target.value)}
              options={healthServiceOptions}
              disabled={isServiceDisabled}
              icon={MapPin}
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-200"
            >
              <Search size={20} />
              <span>ค้นหา</span>
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-purple-300 text-purple-600 font-semibold rounded-xl hover:bg-purple-50 hover:border-purple-400 transition-all duration-200"
            >
              <X size={20} />
              <span>ล้างข้อมูล</span>
            </button>
          </div>
        </form>

        {/* Table Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-800">
              รายการข่าวสาร
            </h2>
            <span className="ml-auto text-sm text-gray-500">
              พบ {filteredNews.length} รายการ
            </span>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              กำลังโหลดข้อมูล...
            </div>
          ) : (
            <TableWithPagination
              data={filteredNews}
              defaultItemsPerPage={10}
              onDetail={handleDetail}
            />
          )}
        </div>
      </div>

      {/* Popups - always rendered */}
      <NewsAddPopup
        open={showAddPopup}
        onClose={handleClosePopup}
        onSubmit={handleSubmitPopup}
        auth={dummyAuth}
      />
      <NewsAddPopup
        open={showDetailPopup}
        onClose={handleCloseDetailPopup}
        mode="detail"
        data={detailData}
        onDelete={handleDeleteDetail}
        auth={dummyAuth}
      />
      <ToastManager />
    </div>
  );
};

// Main wrapper component with hydration protection
const NewsComp = () => {
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Use startTransition to mark the state update as non-urgent
    startTransition(() => {
      setMounted(true);
    });
  }, [startTransition]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return <NewsCompContent />;
};

export default NewsComp;
