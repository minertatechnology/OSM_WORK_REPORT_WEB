import React, { useState, useMemo, useRef, useEffect } from "react";
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
} from "lucide-react";
import NewsCompService from "@services/Table/NewsCompService";
import NewsAddPopup from "@components/NewsComp/NewsAddPopup";
import CustomSelect from "@services/customSelectService/customSelectService";

// Dummy auth สำหรับตัวอย่าง
const dummyAuth = { roles: ["สบส."] };

// ตัวเลือกปี
const years = ["2567", "2568", "2569", "2570"];

// ตัวเลือกเดือน
const months = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

// ตัวเลือกสัปดาห์ (1 เดือนมี 4-5 สัปดาห์)
const weeks = [
  "สัปดาห์ที่ 1 (1-7)",
  "สัปดาห์ที่ 2 (8-14)",
  "สัปดาห์ที่ 3 (15-21)",
  "สัปดาห์ที่ 4 (22-28)",
  "สัปดาห์ที่ 5 (29-31)",
];

// mock ข่าวสาร
export const rawNewsListOrigin = [
  {
    id: 1,
    date: "25 มิถุนายน 2568",
    title: "ระบบยืนยันตัวตนหลังการสมัครใช้งานแอป",
    year: "2568",
    month: "มิถุนายน",
    week: "สัปดาห์ที่ 4 (22-28)",
    healthZone: "zone1",
    province: "เชียงใหม่",
    amphur: "เมือง",
    subdistrict: "บางรัก",
    hospital: "รพ.สต.1",
    detail: "รายละเอียดเกี่ยวกับการยืนยันตัวตนหลังสมัครใช้งานแอป",
  },
  {
    id: 2,
    date: "20 กรกฎาคม 2567",
    title: "อัพเดตเวอร์ชั่นใหม่",
    year: "2567",
    month: "กรกฎาคม",
    week: "สัปดาห์ที่ 3 (15-21)",
    healthZone: "zone2",
    province: "กรุงเทพ",
    amphur: "เมือง",
    subdistrict: "บางรัก",
    hospital: "รพ.สต.1",
    detail: "เวอร์ชั่นใหม่ มาพร้อมฟีเจอร์พิเศษ",
  },
  {
    id: 3,
    date: "12 มีนาคม 2569",
    title: "ระบบแจ้งเตือนใหม่",
    year: "2569",
    month: "มีนาคม",
    week: "สัปดาห์ที่ 2 (8-14)",
    healthZone: "zone1",
    province: "เชียงใหม่",
    amphur: "เมือง",
    subdistrict: "บางรัก",
    hospital: "รพ.สต.1",
    detail: "แจ้งเตือนกิจกรรมจากระบบใหม่",
  },
  {
    id: 4,
    date: "15 มิถุนายน 2570",
    title: "คู่มือการใช้งานแอป",
    year: "2570",
    month: "มิถุนายน",
    week: "สัปดาห์ที่ 3 (15-21)",
    healthZone: "zone2",
    province: "กรุงเทพ",
    amphur: "เมือง",
    subdistrict: "บางรัก",
    hospital: "รพ.สต.1",
    detail: "คู่มือสำหรับผู้ใช้งานแอปเวอร์ชั่นล่าสุด",
  },
  {
    id: 5,
    date: "10 พฤษภาคม 2568",
    title: "เพิ่มระบบแสดงผลกราฟ",
    year: "2568",
    month: "พฤษภาคม",
    week: "สัปดาห์ที่ 2 (8-14)",
    healthZone: "zone1",
    province: "เชียงใหม่",
    amphur: "เมือง",
    subdistrict: "บางรัก",
    hospital: "รพ.สต.1",
    detail: "ระบบกราฟช่วยวิเคราะห์ข้อมูลได้สะดวกขึ้น",
  },
  {
    id: 6,
    date: "30 เมษายน 2567",
    title: "แจ้งปิดปรับปรุงระบบ",
    year: "2567",
    month: "เมษายน",
    week: "สัปดาห์ที่ 5 (29-31)",
    healthZone: "zone2",
    province: "กรุงเทพ",
    amphur: "เมือง",
    subdistrict: "บางรัก",
    hospital: "รพ.สต.1",
    detail: "ระบบจะปิดปรับปรุงชั่วคราวในวันจันทร์",
  },
  {
    id: 7,
    date: "18 สิงหาคม 2569",
    title: "เพิ่มระบบสมาชิก",
    year: "2569",
    month: "สิงหาคม",
    week: "สัปดาห์ที่ 3 (15-21)",
    healthZone: "zone2",
    province: "กรุงเทพ",
    amphur: "เมือง",
    subdistrict: "บางรัก",
    hospital: "รพ.สต.1",
    detail: "สมาชิกสามารถลงทะเบียนและแก้ไขโปรไฟล์",
  },
  {
    id: 8,
    date: "5 กันยายน 2570",
    title: "อัพเดตระบบความปลอดภัย",
    year: "2570",
    month: "กันยายน",
    week: "สัปดาห์ที่ 1 (1-7)",
    healthZone: "zone1",
    province: "เชียงใหม่",
    amphur: "เมือง",
    subdistrict: "บางรัก",
    hospital: "รพ.สต.1",
    detail: "เพิ่มมาตรการความปลอดภัยขั้นสูง",
  },
  {
    id: 9,
    date: "14 ตุลาคม 2568",
    title: "แจ้งเตือนการประชุม",
    year: "2568",
    month: "ตุลาคม",
    week: "สัปดาห์ที่ 2 (8-14)",
    healthZone: "zone1",
    province: "เชียงใหม่",
    amphur: "เมือง",
    subdistrict: "บางรัก",
    hospital: "รพ.สต.1",
    detail: "ประชุมประจำเดือนจะจัดที่ห้องประชุมใหญ่",
  },
  {
    id: 10,
    date: "22 ธันวาคม 2567",
    title: "ระบบแจ้งเตือนวันหยุด",
    year: "2567",
    month: "ธันวาคม",
    week: "สัปดาห์ที่ 4 (22-28)",
    healthZone: "zone2",
    province: "กรุงเทพ",
    amphur: "เมือง",
    subdistrict: "บางรัก",
    hospital: "รพ.สต.1",
    detail: "แจ้งเตือนวันหยุดประจำปีล่วงหน้า",
  },
];

// Table with Pagination
function TableWithPagination({
  data = [],
  defaultItemsPerPage = 10,
  onDetail,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(defaultItemsPerPage);

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
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-purple-100">
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
        </div>
      )}
    </div>
  );
}

const NewsComp = () => {
  const [searchType, setSearchType] = useState("yearly");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [week, setWeek] = useState("");
  const [rawNewsList, setRawNewsList] = useState(rawNewsListOrigin);
  const [filteredNews, setFilteredNews] = useState(rawNewsListOrigin);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [detailData, setDetailData] = useState(null);

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
  const handleSubmitPopup = (data) => {
    const newId = rawNewsList.length
      ? Math.max(...rawNewsList.map((n) => n.id || 0)) + 1
      : 1;
    const now = new Date();
    const dateStr = `${now.getDate()} ${months[now.getMonth() + 1] || ""} ${
      now.getFullYear() + 543
    }`;
    const newData = { ...data, id: newId, date: dateStr };
    setRawNewsList((prev) => [newData, ...prev]);
    setFilteredNews((prev) => [newData, ...prev]);
    setShowAddPopup(false);
  };

  // ปิด popup ดูรายละเอียด
  const handleCloseDetailPopup = () => {
    setShowDetailPopup(false);
    setDetailData(null);
  };
  // ลบข้อมูล
  const handleDeleteDetail = (item) => {
    setRawNewsList((prev) => prev.filter((n) => n.id !== item.id));
    setFilteredNews((prev) => prev.filter((n) => n.id !== item.id));
    setShowDetailPopup(false);
    setDetailData(null);
  };

  // ล้างข้อมูลค้นหา
  const resetAll = () => {
    setYear("");
    setMonth("");
    setWeek("");
    setSearchType("yearly");
    setFilteredNews(rawNewsListOrigin);
  };

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    let filtered = rawNewsList;
    if (year) filtered = filtered.filter((n) => n.year === year);
    if (month) filtered = filtered.filter((n) => n.month === month);
    if (week) filtered = filtered.filter((n) => n.week === week);
    setFilteredNews(filtered);
  };

  // Stats data
  const totalNews = rawNewsList.length;
  const thisYearNews = rawNewsList.filter((n) => n.year === "2568").length;

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
                <p className="text-sm text-gray-500">ข่าวสารปี 2568</p>
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
          {/* Search Type Radio */}
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              รูปแบบการค้นหา
            </p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    searchType === "yearly"
                      ? "border-purple-600 bg-purple-600"
                      : "border-gray-300 group-hover:border-purple-400"
                  }`}
                >
                  {searchType === "yearly" && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${
                    searchType === "yearly"
                      ? "text-purple-600"
                      : "text-gray-600"
                  }`}
                >
                  ค้นหาแบบรายปี
                </span>
                <input
                  type="radio"
                  name="searchType"
                  checked={searchType === "yearly"}
                  onChange={() => setSearchType("yearly")}
                  className="sr-only"
                />
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    searchType === "budget"
                      ? "border-purple-600 bg-purple-600"
                      : "border-gray-300 group-hover:border-purple-400"
                  }`}
                >
                  {searchType === "budget" && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${
                    searchType === "budget"
                      ? "text-purple-600"
                      : "text-gray-600"
                  }`}
                >
                  ค้นหาแบบรายปีงบประมาณ
                </span>
                <input
                  type="radio"
                  name="searchType"
                  checked={searchType === "budget"}
                  onChange={() => setSearchType("budget")}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {/* Year */}
            <CustomSelect
              label="ปี"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              options={years.map((y) => ({ label: y, value: y }))}
              placeholder="-- เลือกปี --"
              icon={Calendar}
            />

            {/* Month */}
            <CustomSelect
              label="เดือน"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              options={months.map((m) => ({ label: m, value: m }))}
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
          <TableWithPagination
            data={filteredNews}
            defaultItemsPerPage={10}
            onDetail={handleDetail}
          />
        </div>
      </div>

      {/* Popups */}
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
    </div>
  );
};

export default NewsComp;
