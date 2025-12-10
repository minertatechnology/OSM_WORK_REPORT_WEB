import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Download,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  FileText,
  Heart,
  Users,
  Calendar,
} from "lucide-react";
import CustomSelect from "@services/customSelectService/customSelectService";
import { getHealthRecords } from "@services/healthRecordService";
import { exportHealthRecordToPDF } from "./OsmHealthDetail/OsmHealthDetail";

// Thai month names
const THAI_MONTHS = [
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

/**
 * แปลงวันที่เป็นรูปแบบไทย
 * @param {string} dateString - ISO date string
 * @returns {string} - วันที่ในรูปแบบ "DD เดือน YYYY"
 */
const formatThaiDate = (dateString) => {
  if (!dateString) return "-";

  const date = new Date(dateString);
  const day = date.getDate();
  const month = THAI_MONTHS[date.getMonth()];
  const year = date.getFullYear() + 543; // แปลงเป็น พ.ศ.

  return `${day} ${month} ${year}`;
};

// Pagination helpers
const PER_PAGE_OPTIONS = [
  { value: 10, label: "10" },
  { value: 20, label: "20" },
  { value: 50, label: "50" },
  { value: 100, label: "100" },
];

function getPageNumbers(current, total) {
  const visible = 5;
  if (total <= visible) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  if (current <= 3) {
    pages.push(1, 2, 3, 4, "...", total);
  } else if (current >= total - 2) {
    pages.push(1, "...", total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", total);
  }
  return pages.filter((v, i, arr) => v === "..." || arr.indexOf(v) === i);
}

function PaginationWithPerPage({
  currentPage,
  setCurrentPage,
  totalPages,
  itemsPerPage,
  setItemsPerPage,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-purple-100">
      <div className="flex items-center gap-2">
        <label htmlFor="per-page" className="text-sm text-gray-600 font-medium">
          แสดง
        </label>
        <select
          id="per-page"
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="appearance-none border border-purple-200 rounded-xl px-4 py-2 pr-8 text-sm font-semibold text-purple-600 bg-purple-50 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent hover:border-purple-400 cursor-pointer"
        >
          {PER_PAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-600">รายการต่อหน้า</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className={`hidden sm:flex p-2 rounded-lg transition-all ${
            currentPage === 1
              ? "text-gray-300 cursor-not-allowed"
              : "text-purple-600 bg-purple-50 hover:bg-purple-100"
          }`}
          title="หน้าแรก"
        >
          <ChevronsLeft size={18} />
        </button>
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg transition-all ${
            currentPage === 1
              ? "text-gray-300 cursor-not-allowed"
              : "text-purple-600 bg-purple-50 hover:bg-purple-100"
          }`}
          title="หน้าก่อนหน้า"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="hidden sm:flex items-center gap-1 mx-2">
          {getPageNumbers(currentPage, totalPages).map((page, idx) =>
            page === "..." ? (
              <span key={idx} className="px-2 text-gray-400">
                ...
              </span>
            ) : (
              <button
                key={idx}
                onClick={() => setCurrentPage(page)}
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
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg transition-all ${
            currentPage === totalPages
              ? "text-gray-300 cursor-not-allowed"
              : "text-purple-600 bg-purple-50 hover:bg-purple-100"
          }`}
          title="หน้าถัดไป"
        >
          <ChevronRight size={18} />
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className={`hidden sm:flex p-2 rounded-lg transition-all ${
            currentPage === totalPages
              ? "text-gray-300 cursor-not-allowed"
              : "text-purple-600 bg-purple-50 hover:bg-purple-100"
          }`}
          title="หน้าสุดท้าย"
        >
          <ChevronsRight size={18} />
        </button>
        <div className="hidden sm:block ml-3 text-sm text-gray-600 font-medium bg-purple-50 px-3 py-2 rounded-lg">
          หน้า {currentPage} / {totalPages}
        </div>
        <div className="sm:hidden ml-2 text-sm text-gray-600 font-medium">
          {currentPage} / {totalPages}
        </div>
      </div>
    </div>
  );
}

const OsmHealthComp = () => {
  const [searchType, setSearchType] = useState("year");
  const currentBuddhistYear = new Date().getFullYear() + 543;
  const currentMonth = THAI_MONTHS[new Date().getMonth()];

  const [year, setYear] = useState(currentBuddhistYear.toString());
  const [month, setMonth] = useState(currentMonth);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Data state
  const [healthRecords, setHealthRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [availableYears, setAvailableYears] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch health records on mount
  useEffect(() => {
    const fetchHealthRecords = async () => {
      try {
        setIsLoading(true);
        const data = await getHealthRecords({ limit: 1000 });
        setHealthRecords(data || []);

        // Generate available years from data
        const yearsSet = new Set();
        data.forEach((record) => {
          if (record.updated_at) {
            const date = new Date(record.updated_at);
            const buddhistYear = date.getFullYear() + 543;
            yearsSet.add(buddhistYear.toString());
          }
        });
        const yearsList = Array.from(yearsSet).sort((a, b) => b - a);
        setAvailableYears(
          yearsList.length > 0 ? yearsList : [currentBuddhistYear.toString()]
        );
      } catch (error) {
        console.error("Failed to fetch health records:", error);
        setHealthRecords([]);
        setAvailableYears([currentBuddhistYear.toString()]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHealthRecords();
  }, []);

  // Filter health records based on year and month
  const filteredRecords = React.useMemo(() => {
    if (!healthRecords.length) return [];

    return healthRecords.filter((record) => {
      if (!record.updated_at) return false;

      const date = new Date(record.updated_at);
      const recordYear = (date.getFullYear() + 543).toString();
      const recordMonth = THAI_MONTHS[date.getMonth()];

      // Check year match
      if (year && recordYear !== year) return false;

      // Check month match (only if search type is year, not budget)
      if (searchType === "year" && month && recordMonth !== month) return false;

      return true;
    });
  }, [healthRecords, year, month, searchType]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedData = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Close dropdown on click outside
  React.useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // Reset filters
  const resetFilters = () => {
    setSearchType("year");
    setYear(currentBuddhistYear.toString());
    setMonth(currentMonth);
    setCurrentPage(1);
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
  };

  // Handle download PDF for single record
  const handleDownloadPDF = (record) => {
    try {
      exportHealthRecordToPDF(record);
    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert("เกิดข้อผิดพลาดในการสร้าง PDF กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg">
              <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                ผลตรวจสุขภาพ อสม.
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                ข้อมูลผลการตรวจสุขภาพอาสาสมัครสาธารณสุข
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-md border border-purple-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-violet-100 rounded-xl">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">จำนวนผู้ตรวจทั้งหมด</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                  {isLoading ? "..." : filteredRecords.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-md border border-purple-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
                <Heart className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">ข้อมูลทั้งหมด</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoading ? "..." : healthRecords.length}
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
                <p className="text-sm text-gray-500">เดือนปัจจุบัน</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  {month}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-5 sm:p-6 mb-6">
          {/* Search Type Radio */}
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              รูปแบบการค้นหา
            </p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    searchType === "year"
                      ? "border-purple-600 bg-purple-600"
                      : "border-gray-300 group-hover:border-purple-400"
                  }`}
                >
                  {searchType === "year" && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${
                    searchType === "year" ? "text-purple-600" : "text-gray-600"
                  }`}
                >
                  ค้นหาแบบรายปี
                </span>
                <input
                  type="radio"
                  checked={searchType === "year"}
                  onChange={() => setSearchType("year")}
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
                  ค้นหาแบบรายงบประมาณ
                </span>
                <input
                  type="radio"
                  checked={searchType === "budget"}
                  onChange={() => setSearchType("budget")}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          {/* Year and Month */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <CustomSelect
              label="ปี"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              options={availableYears.map((y) => ({ label: y, value: y }))}
              placeholder="-- เลือกปี --"
              icon={Calendar}
            />
            <CustomSelect
              label="เดือน"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              options={THAI_MONTHS.map((m) => ({ label: m, value: m }))}
              placeholder="-- เลือกเดือน --"
              icon={Calendar}
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleSearch}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search size={20} />
              <span>{isLoading ? "กำลังค้นหา..." : "ค้นหา"}</span>
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-purple-300 text-purple-600 font-semibold rounded-xl hover:bg-purple-50 hover:border-purple-400 transition-all duration-200"
            >
              <X size={20} />
              <span>ล้างข้อมูล</span>
            </button>
          </div>
        </div>

        {/* Results Table Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-5 sm:p-6">
          {/* Title and Download Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                ตารางข้อมูลผลตรวจสุขภาพ อสม.
              </h2>
              <span className="text-sm text-gray-500">
                ({isLoading ? "..." : filteredRecords.length} รายการ)
              </span>
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setOpen((s) => !s)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <Download size={18} />
                <span className="hidden sm:inline">ดาวน์โหลดเอกสาร</span>
                <span className="sm:hidden">ดาวน์โหลด</span>
                <ChevronDown
                  size={18}
                  className={`transition-transform ${open ? "rotate-180" : ""}`}
                />
              </button>
              {open && (
                <div className="absolute z-30 right-0 mt-2 w-64 bg-white shadow-xl rounded-xl border border-purple-100 py-2 overflow-hidden">
                  <button
                    className="flex items-center w-full px-4 py-3 gap-3 text-gray-700 hover:bg-purple-50 transition font-medium"
                    onClick={() => setOpen(false)}
                  >
                    <Image
                      src="/xlsx.png"
                      alt="Excel icon"
                      width={24}
                      height={24}
                      className="w-6 h-6"
                    />
                    ดาวน์โหลดเอกสาร Excel
                  </button>
                  <button
                    className="flex items-center w-full px-4 py-3 gap-3 text-gray-700 hover:bg-purple-50 transition font-medium"
                    onClick={() => setOpen(false)}
                  >
                    <Image
                      src="/pdf.png"
                      alt="PDF icon"
                      width={24}
                      height={24}
                      className="w-6 h-6"
                    />
                    ดาวน์โหลดเอกสาร PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-gradient-to-r from-purple-100 to-violet-100">
                  <th className="py-4 px-3 text-purple-700 font-bold text-sm text-center rounded-tl-xl w-[140px]">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={14} />
                      วันที่
                    </span>
                  </th>
                  <th className="py-4 px-3 text-purple-700 font-bold text-sm text-left">
                    <span className="inline-flex items-center gap-1">
                      <Users size={14} />
                      รายชื่อ
                    </span>
                  </th>
                  <th className="py-4 px-3 text-purple-700 font-bold text-sm text-center rounded-tr-xl w-[180px]">
                    <span className="inline-flex items-center gap-1">
                      <Download size={14} />
                      ดาวน์โหลดผลตรวจ
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                        <span>กำลังโหลดข้อมูล...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-gray-500">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((record, idx) => {
                    const fullName = `${record.prefix || ""}${record.first_name || ""} ${record.last_name || ""}`.trim() || "ไม่ระบุชื่อ";
                    return (
                      <tr
                        key={record.id || idx}
                        className="border-b border-purple-50 hover:bg-purple-50/50 transition-colors"
                      >
                        <td className="py-3 px-3 text-center text-gray-600 text-sm">
                          {formatThaiDate(record.updated_at)}
                        </td>
                        <td className="py-3 px-3 text-gray-800 text-sm font-medium">
                          {fullName}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleDownloadPDF(record)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 text-purple-600 font-semibold text-sm rounded-lg hover:bg-purple-100 hover:border-purple-300 transition-all"
                          >
                            <Download size={16} />
                            <span className="hidden sm:inline">ดาวน์โหลด</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <PaginationWithPerPage
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
          />
        </div>
      </div>
    </div>
  );
};

export default OsmHealthComp;
