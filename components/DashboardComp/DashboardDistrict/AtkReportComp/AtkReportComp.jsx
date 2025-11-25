import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Download,
  CalendarDays,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  TestTube,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

// Mock data for filter dropdowns
const healthZones = ["ทั้งหมด", "เขต1", "เขต2"];
const provinces = [
  "มหาสารคาม",
  "ชลบุรี",
  "ปราจีนบุรี",
  "กระบี่",
  "นครศรีธรรมราช",
  "สระแก้ว",
  "มุกดาหาร",
  "กรุงเทพมหานคร",
  "อุทัยธานี",
  "ลำปาง",
];
const amphurs = ["เมือง", "บ้านกรวด"];
const tambons = ["ท่าตูม", "ในเมือง"];

const years = ["2568", "2567", "2566"];
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

// Mock table data
const tableList = [
  { name: "มหาสารคาม", positive: 573, negative: 4755, invalid: 27, total: 5355 },
  { name: "ชลบุรี", positive: 75, negative: 1780, invalid: 4, total: 1859 },
  { name: "ปราจีนบุรี", positive: 75, negative: 1780, invalid: 4, total: 1859 },
  { name: "กระบี่", positive: 75, negative: 1780, invalid: 4, total: 1859 },
  { name: "นครศรีธรรมราช", positive: 75, negative: 1780, invalid: 4, total: 1859 },
  { name: "สระแก้ว", positive: 75, negative: 1780, invalid: 4, total: 1859 },
  { name: "มุกดาหาร", positive: 75, negative: 1780, invalid: 4, total: 1859 },
  { name: "กรุงเทพมหานคร", positive: 75, negative: 1780, invalid: 4, total: 1859 },
  { name: "อุทัยธานี", positive: 75, negative: 1780, invalid: 4, total: 1859 },
  { name: "ลำปาง", positive: 75, negative: 1780, invalid: 4, total: 1859 },
];

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

// CustomSelect component
function CustomSelect({ value, onChange, options, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setHighlightedIndex(-1);
  };

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (event) => {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (event.key) {
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex(prev =>
          prev < options.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : options.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(options[highlightedIndex]);
        }
        break;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`w-full h-12 px-4 rounded-xl border-2 ${
          isOpen ? 'border-purple-600 ring-2 ring-purple-200' : 'border-purple-200'
        } bg-gradient-to-r from-purple-50/80 to-violet-50/80 text-gray-700 font-medium hover:border-purple-300 hover:shadow-sm transition-all duration-200 cursor-pointer flex items-center justify-between`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="combobox"
        aria-expanded={isOpen}
      >
        <span className={value ? 'text-gray-700' : 'text-gray-500'}>
          {value || placeholder}
        </span>
        <ChevronDown
          size={20}
          className={`text-purple-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border-2 border-purple-200 shadow-xl max-h-64 overflow-auto">
          <ul role="listbox">
            <li
              className={`px-4 py-3 cursor-pointer transition-colors ${
                !value ? 'bg-purple-50 text-purple-600 font-semibold' : 'hover:bg-purple-50 text-gray-700'
              }`}
              onClick={() => handleSelect("")}
              role="option"
            >
              {placeholder}
            </li>
            {options.map((option, index) => (
              <li
                key={option}
                className={`px-4 py-3 cursor-pointer transition-colors ${
                  value === option
                    ? 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-600 font-semibold border-l-4 border-purple-600'
                    : highlightedIndex === index
                    ? 'bg-purple-50 text-gray-700'
                    : 'hover:bg-purple-50 text-gray-700'
                }`}
                onClick={() => handleSelect(option)}
                role="option"
                aria-selected={value === option}
              >
                {option}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Pagination component
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
              <span key={idx} className="px-2 text-gray-400">...</span>
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

const AtkReportComp = () => {
  const [searchType, setSearchType] = useState("year");
  const [year, setYear] = useState("2568");
  const [month, setMonth] = useState("มิถุนายน");
  const [zone, setZone] = useState("");
  const [province, setProvince] = useState("");
  const [amphur, setAmphur] = useState("");
  const [tambon, setTambon] = useState("");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Slice table data for pagination
  const totalPages = Math.ceil(tableList.length / itemsPerPage);
  const paginatedData = tableList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate stats
  const totalPositive = tableList.reduce((sum, row) => sum + row.positive, 0);
  const totalNegative = tableList.reduce((sum, row) => sum + row.negative, 0);
  const totalInvalid = tableList.reduce((sum, row) => sum + row.invalid, 0);
  const totalAll = tableList.reduce((sum, row) => sum + row.total, 0);

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

  // Reset all filters
  const resetFilters = () => {
    setSearchType("year");
    setYear("2568");
    setMonth("มิถุนายน");
    setZone("");
    setProvince("");
    setAmphur("");
    setTambon("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg">
              <TestTube className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                รายงานผลตรวจ ATK
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">ข้อมูลการตรวจ Antigen Test Kit</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-md border border-purple-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-red-100 to-red-50 rounded-xl">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Positive</p>
                <p className="text-lg sm:text-xl font-bold text-red-500">{totalPositive.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-md border border-purple-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-green-100 to-green-50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Negative</p>
                <p className="text-lg sm:text-xl font-bold text-green-500">{totalNegative.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-md border border-purple-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-xl">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Invalid</p>
                <p className="text-lg sm:text-xl font-bold text-yellow-500">{totalInvalid.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-md border border-purple-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-100 to-violet-100 rounded-xl">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">ทั้งหมด</p>
                <p className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                  {totalAll.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-5 sm:p-6 mb-6">
          {/* Search Type Radio */}
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">รูปแบบการค้นหา</p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  searchType === "year" ? "border-purple-600 bg-purple-600" : "border-gray-300 group-hover:border-purple-400"
                }`}>
                  {searchType === "year" && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className={`text-sm font-medium ${searchType === "year" ? "text-purple-600" : "text-gray-600"}`}>
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
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  searchType === "budget" ? "border-purple-600 bg-purple-600" : "border-gray-300 group-hover:border-purple-400"
                }`}>
                  {searchType === "budget" && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className={`text-sm font-medium ${searchType === "budget" ? "text-purple-600" : "text-gray-600"}`}>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ปี</label>
              <CustomSelect
                value={year}
                onChange={setYear}
                options={years}
                placeholder="-- เลือกปี --"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">เดือน</label>
              <CustomSelect
                value={month}
                onChange={setMonth}
                options={months}
                placeholder="-- เลือกเดือน --"
              />
            </div>
          </div>

          {/* Location Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">เขตสุขภาพ</label>
              <CustomSelect
                value={zone}
                onChange={setZone}
                options={healthZones}
                placeholder="-- เลือกเขตสุขภาพ --"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">จังหวัด</label>
              <CustomSelect
                value={province}
                onChange={setProvince}
                options={provinces}
                placeholder="-- เลือกจังหวัด --"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">อำเภอ</label>
              <CustomSelect
                value={amphur}
                onChange={setAmphur}
                options={amphurs}
                placeholder="-- เลือกอำเภอ --"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ตำบล</label>
              <CustomSelect
                value={tambon}
                onChange={setTambon}
                options={tambons}
                placeholder="-- เลือกตำบล --"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-200"
            >
              <Search size={20} />
              <span>ค้นหา</span>
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
              <h2 className="text-lg font-semibold text-gray-800">ตารางข้อมูลผลตรวจ ATK</h2>
              <span className="text-sm text-gray-500">({tableList.length} รายการ)</span>
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setOpen((s) => !s)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <Download size={18} />
                <span className="hidden sm:inline">ดาวน์โหลดรายงาน</span>
                <span className="sm:hidden">ดาวน์โหลด</span>
                <ChevronDown size={18} className={`transition-transform ${open ? "rotate-180" : ""}`} />
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
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gradient-to-r from-purple-100 to-violet-100">
                  <th className="py-4 px-3 text-purple-700 font-bold text-sm text-center rounded-tl-xl">ลำดับ</th>
                  <th className="py-4 px-3 text-purple-700 font-bold text-sm text-left">รายการ</th>
                  <th className="py-4 px-3 text-purple-700 font-bold text-sm text-center">
                    <span className="inline-flex items-center gap-1">
                      <XCircle size={14} className="text-red-500" />
                      Positive
                    </span>
                  </th>
                  <th className="py-4 px-3 text-purple-700 font-bold text-sm text-center">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle size={14} className="text-green-500" />
                      Negative
                    </span>
                  </th>
                  <th className="py-4 px-3 text-purple-700 font-bold text-sm text-center">
                    <span className="inline-flex items-center gap-1">
                      <AlertCircle size={14} className="text-yellow-500" />
                      Invalid
                    </span>
                  </th>
                  <th className="py-4 px-3 text-purple-700 font-bold text-sm text-center rounded-tr-xl">ทั้งหมด</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-purple-50 hover:bg-purple-50/50 transition-colors"
                  >
                    <td className="py-3 px-3 text-center text-gray-600 text-sm">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="py-3 px-3 text-gray-800 text-sm font-medium">{row.name}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm font-semibold">
                        {row.positive.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-3 py-1 bg-green-50 text-green-600 rounded-full text-sm font-semibold">
                        {row.negative.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-3 py-1 bg-yellow-50 text-yellow-600 rounded-full text-sm font-semibold">
                        {row.invalid.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-gray-800 text-sm font-bold">
                      {row.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
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

export default AtkReportComp;
