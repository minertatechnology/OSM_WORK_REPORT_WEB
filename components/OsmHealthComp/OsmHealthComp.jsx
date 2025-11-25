import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Download,
  CalendarDays,
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

// Mock data
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
const mockList = Array.from({ length: 23 }).map((_, idx) => ({
  date: "25 มิถุนายน 2568",
  name: `นางสาวชุชนาถ ผดุงจิตร ${idx + 1}`,
}));

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

const OsmHealthComp = () => {
  const [searchType, setSearchType] = useState("year");
  const [year, setYear] = useState("2568");
  const [month, setMonth] = useState("มิถุนายน");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Pagination calculation
  const totalPages = Math.ceil(mockList.length / itemsPerPage);
  const paginatedData = mockList.slice(
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
    setYear("2568");
    setMonth("มิถุนายน");
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
              <p className="text-sm text-gray-500 mt-0.5">ข้อมูลผลการตรวจสุขภาพอาสาสมัครสาธารณสุข</p>
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
                  {mockList.length}
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
                <p className="text-sm text-gray-500">สุขภาพดี</p>
                <p className="text-2xl font-bold text-green-600">18</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
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
              <h2 className="text-lg font-semibold text-gray-800">ตารางข้อมูลผลตรวจสุขภาพ อสม.</h2>
              <span className="text-sm text-gray-500">({mockList.length} รายการ)</span>
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
                {paginatedData.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-purple-50 hover:bg-purple-50/50 transition-colors"
                  >
                    <td className="py-3 px-3 text-center text-gray-600 text-sm">
                      {row.date}
                    </td>
                    <td className="py-3 px-3 text-gray-800 text-sm font-medium">
                      {row.name}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 text-purple-600 font-semibold text-sm rounded-lg hover:bg-purple-100 hover:border-purple-300 transition-all">
                        <Download size={16} />
                        <span className="hidden sm:inline">ดาวน์โหลด</span>
                      </button>
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

export default OsmHealthComp;
