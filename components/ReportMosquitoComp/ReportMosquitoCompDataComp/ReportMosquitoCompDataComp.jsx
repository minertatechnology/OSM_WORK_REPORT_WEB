import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Search,
  Eye,
  Download,
  RotateCcw,
  Calendar,
  MapPin,
  Building2,
  Home,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  Users,
} from "lucide-react";

// Mock data
const YEARS = [
  { label: "2568", value: "2568" },
  { label: "2567", value: "2567" },
  { label: "2566", value: "2566" },
];
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
const WEEKS = [
  { label: "สัปดาห์ 1 (1/6/68 - 7/6/68)", value: "1" },
  { label: "สัปดาห์ 2 (8/6/68 - 14/6/68)", value: "2" },
  { label: "สัปดาห์ 3 (15/6/68 - 21/6/68)", value: "3" },
  { label: "สัปดาห์ 4 (22/6/68 - 30/6/68)", value: "4" },
];
const ZONES = [
  { label: "เลือกเขต", value: "" },
  ...Array.from({ length: 13 }, (_, i) => ({
    label: `เขตสุขภาพ ${i + 1}`,
    value: `${i + 1}`,
  })),
];
const PROVINCES = [
  { label: "เลือกจังหวัด", value: "" },
  { label: "นครราชสีมา", value: "นครราชสีมา" },
  { label: "ชัยภูมิ", value: "ชัยภูมิ" },
  { label: "บุรีรัมย์", value: "บุรีรัมย์" },
];
const DISTRICTS = [
  { label: "เลือกอำเภอ", value: "" },
  { label: "เมือง", value: "เมือง" },
  { label: "ปากช่อง", value: "ปากช่อง" },
  { label: "โนนสูง", value: "โนนสูง" },
];
const SUBDISTRICTS = [
  { label: "เลือกตำบล", value: "" },
  { label: "ในเมือง", value: "ในเมือง" },
  { label: "หนองสาหร่าย", value: "หนองสาหร่าย" },
  { label: "โนนไทย", value: "โนนไทย" },
];
const SERVICES = [
  { label: "เลือกหน่วยบริการ", value: "" },
  { label: "รพ.นครราชสีมา", value: "รพ.นครราชสีมา" },
  { label: "รพ.ปากช่อง", value: "รพ.ปากช่อง" },
  { label: "รพ.สต.โนนไทย", value: "รพ.สต.โนนไทย" },
];

const MOCK_REPORTS = [
  {
    name: "รายงานลูกน้ำยุงลาย บ้านเหนือ หมู่ 3 ต.ในเมือง อ.เมือง",
    date: "28 มิถุนายน 2568",
    amount: 21,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านใต้ หมู่ 7 ต.โนนสูง อ.โนนสูง",
    date: "27 มิถุนายน 2568",
    amount: 17,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านหนองน้ำ หมู่ 4 ต.หนองน้ำ อ.เมือง",
    date: "26 มิถุนายน 2568",
    amount: 24,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านทุ่งนา หมู่ 9 ต.ทุ่งนา อ.ปากช่อง",
    date: "25 มิถุนายน 2568",
    amount: 19,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านกลาง หมู่ 2 ต.ในเมือง อ.เมือง",
    date: "24 มิถุนายน 2568",
    amount: 14,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านโนนสูง หมู่ 11 ต.โนนสูง อ.โนนสูง",
    date: "23 มิถุนายน 2568",
    amount: 26,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านหนองสาหร่าย หมู่ 6 ต.หนองสาหร่าย อ.ปากช่อง",
    date: "22 มิถุนายน 2568",
    amount: 16,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านห้วยลึก หมู่ 10 ต.ห้วยลึก อ.เมือง",
    date: "21 มิถุนายน 2568",
    amount: 18,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านตลาด หมู่ 1 ต.ในเมือง อ.เมือง",
    date: "20 มิถุนายน 2568",
    amount: 22,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านหนองเต็ง หมู่ 8 ต.หนองเต็ง อ.โนนสูง",
    date: "19 มิถุนายน 2568",
    amount: 15,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านท่าแดง หมู่ 5 ต.ท่าแดง อ.ปากช่อง",
    date: "18 มิถุนายน 2568",
    amount: 20,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านห้วยใหญ่ หมู่ 12 ต.ห้วยใหญ่ อ.โนนสูง",
    date: "17 มิถุนายน 2568",
    amount: 23,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านหนองบัว หมู่ 4 ต.หนองบัว อ.เมือง",
    date: "16 มิถุนายน 2568",
    amount: 19,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านโคกสูง หมู่ 2 ต.โคกสูง อ.เมือง",
    date: "15 มิถุนายน 2568",
    amount: 13,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านหนองแค หมู่ 3 ต.หนองแค อ.เมือง",
    date: "14 มิถุนายน 2568",
    amount: 25,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านดอนกลาง หมู่ 6 ต.ดอนกลาง อ.ปากช่อง",
    date: "13 มิถุนายน 2568",
    amount: 18,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านท่าม่วง หมู่ 9 ต.ท่าม่วง อ.เมือง",
    date: "12 มิถุนายน 2568",
    amount: 16,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านหนองไผ่ หมู่ 7 ต.หนองไผ่ อ.โนนสูง",
    date: "11 มิถุนายน 2568",
    amount: 21,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านกุดตะเคียน หมู่ 5 ต.กุดตะเคียน อ.เมือง",
    date: "10 มิถุนายน 2568",
    amount: 17,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านหนองโพธิ์ หมู่ 8 ต.หนองโพธิ์ อ.โนนสูง",
    date: "9 มิถุนายน 2568",
    amount: 20,
  },
];

const ALL_ROWS = MOCK_REPORTS.map((row, idx) => ({ ...row, index: idx + 1 }));

// CustomSelect component - styled dropdown
function CustomSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  icon: Icon,
}) {
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const display = useMemo(() => {
    const found = options.find((opt) => (opt.value ?? opt) === value);
    return (found && (found.label ?? found)) || "";
  }, [options, value]);

  const handleToggle = () => {
    setIsOpen((v) => !v);
    setHighlightedIndex(-1);
  };

  const handleSelect = (option) => {
    onChange(option.value ?? option);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (event) => {
    if (!isOpen) {
      if (
        event.key === "Enter" ||
        event.key === " " ||
        event.key === "ArrowDown"
      ) {
        event.preventDefault();
        setIsOpen(true);
      }
      return;
    }
    switch (event.key) {
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case "ArrowDown":
        event.preventDefault();
        setHighlightedIndex((prev) =>
          prev < options.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : options.length - 1
        );
        break;
      case "Enter":
        event.preventDefault();
        if (highlightedIndex >= 0) handleSelect(options[highlightedIndex]);
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative flex flex-col gap-1" ref={dropdownRef}>
      {label ? (
        <span className="text-sm font-semibold text-[#4b3b76]">{label}</span>
      ) : null}
      <div
        className={`w-full h-12 rounded-xl border-2 px-4 ${
          isOpen
            ? "border-[#7e32e2] ring-2 ring-purple-200"
            : "border-purple-200"
        } bg-gradient-to-r from-purple-50/80 to-violet-50/80 text-gray-700 font-medium hover:border-purple-300 hover:shadow-sm transition-all duration-200 cursor-pointer flex items-center justify-between`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="combobox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={18} className="text-[#7e32e2]" />}
          <span className={value ? "text-gray-700" : "text-gray-400"}>
            {display || placeholder}
          </span>
        </div>
        <ChevronDown
          size={20}
          className={`text-[#7e32e2] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-xl border-2 border-purple-200 shadow-xl max-h-64 overflow-auto">
          <ul role="listbox">
            <li
              className={`px-4 py-3 cursor-pointer transition-colors ${
                !value
                  ? "bg-purple-50 text-[#7e32e2] font-semibold"
                  : "hover:bg-purple-50 text-gray-700"
              }`}
              onClick={() => handleSelect({ value: "" })}
              role="option"
            >
              {placeholder}
            </li>
            {options.map((option, index) => (
              <li
                key={option.value || option.label || option}
                className={`px-4 py-3 cursor-pointer transition-colors ${
                  value === (option.value ?? option)
                    ? "bg-gradient-to-r from-purple-100 to-violet-100 text-[#7e32e2] font-semibold border-l-4 border-[#7e32e2]"
                    : highlightedIndex === index
                    ? "bg-purple-50 text-gray-700"
                    : "hover:bg-purple-50 text-gray-700"
                }`}
                onClick={() => handleSelect(option)}
                role="option"
                aria-selected={value === (option.value ?? option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {option.label ?? option}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function DetailModal({ open, onClose }) {
  if (!open) return null;
  const sections = ["สรุปยอดรายงาน", "สรุปรายอำเภอ", "หน่วยที่ยังไม่ส่ง"];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#ece1f7] w-full max-w-2xl p-6 relative">
        <div className="text-[20px] font-bold text-[#7e32e2] mb-5">
          ดาวน์โหลดเอกสาร
        </div>
        <div className="flex flex-col gap-4 mb-6">
          {sections.map((title, idx) => (
            <div
              key={title}
              className={`flex flex-col sm:flex-row items-center gap-3 sm:gap-4 rounded-xl px-4 py-3 border ${
                idx === 0
                  ? "bg-purple-50/60 border-purple-100"
                  : idx === 1
                  ? "bg-purple-50/40 border-purple-100"
                  : "bg-purple-50/30 border-purple-100"
              }`}
            >
              <div className="flex-1 text-[16px] text-[#231d37] font-semibold">
                {title}
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-white text-[#d32f2f] font-semibold text-[15px] shadow-sm hover:bg-red-50 hover:border-red-300 transition-all active:scale-95">
                  <Image
                    src="/pdf.png"
                    alt="pdf"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                  ดาวน์โหลด PDF
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-green-200 bg-white text-[#388e3c] font-semibold text-[15px] shadow-sm hover:bg-green-50 hover:border-green-300 transition-all active:scale-95">
                  <Image
                    src="/xlsx.png"
                    alt="excel"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                  ดาวน์โหลด Excel
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            className="px-6 py-2 rounded-xl border border-[#7e32e2] text-[#7e32e2] bg-white font-semibold text-[16px] shadow hover:bg-[#f6eeff] transition"
            onClick={onClose}
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

function getPageNumbers(currentPage, totalPages) {
  const delta = 2;
  const pages = [];
  for (
    let i = Math.max(1, currentPage - delta);
    i <= Math.min(totalPages, currentPage + delta);
    i++
  ) {
    pages.push(i);
  }
  if (pages[0] > 2) pages.unshift("...");
  if (pages[0] !== 1) pages.unshift(1);
  if (pages[pages.length - 1] < totalPages - 1) pages.push("...");
  if (pages[pages.length - 1] !== totalPages) pages.push(totalPages);
  return [...new Set(pages)];
}

function Pagination({
  currentPage,
  setCurrentPage,
  totalPages,
  itemsPerPage,
  setItemsPerPage,
}) {
  const options = [
    { label: "10", value: 10 },
    { label: "20", value: 20 },
    { label: "50", value: 50 },
    { label: "100", value: 100 },
  ];
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 mb-10 pt-4 border-t border-[#f0ebff]">
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
          className="appearance-none border border-[#e5e7eb] rounded-full px-4 py-2 pr-8 text-sm font-semibold text-[#7e32e2] bg-white shadow transition focus:outline-none focus:ring-2 focus:ring-[#7e32e2] focus:border-transparent hover:border-[#7e32e2] cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-600">แถว</span>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-[#ece1f7] shadow-lg backdrop-blur-sm">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
            currentPage === 1
              ? "text-gray-300 cursor-not-allowed"
              : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-110"
          }`}
          title="หน้าแรก"
          aria-label="หน้าแรก"
        >
          <ChevronsLeft size={18} />
        </button>
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
            currentPage === 1
              ? "text-gray-300 cursor-not-allowed"
              : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-110"
          }`}
          title="ก่อนหน้า"
          aria-label="ก่อนหน้า"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-1 mx-2">
          {getPageNumbers(currentPage, totalPages).map((page, idx) =>
            page === "..." ? (
              <span
                key={idx}
                className="px-2 py-1 text-gray-400 font-semibold select-none"
              >
                ...
              </span>
            ) : (
              <button
                key={idx}
                onClick={() => setCurrentPage(page)}
                className={`min-w[36px] h-9 rounded-full font-semibold text-base transition-all duration-200 ${
                  currentPage === page
                    ? "bg-[#7e32e2] text-white shadow-lg scale-110 border border-[#7e32e2]"
                    : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-105"
                }`}
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page}
              </button>
            )
          )}
        </div>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
            currentPage === totalPages
              ? "text-gray-300 cursor-not-allowed"
              : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-110"
          }`}
          title="ถัดไป"
          aria-label="ถัดไป"
        >
          <ChevronRight size={18} />
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
            currentPage === totalPages
              ? "text-gray-300 cursor-not-allowed"
              : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-110"
          }`}
          title="หน้าสุดท้าย"
          aria-label="หน้าสุดท้าย"
        >
          <ChevronsRight size={18} />
        </button>
        <div className="ml-3 text-sm text-[#888] font-semibold bg-[#f6eeff] px-4 py-2 rounded-xl shadow">
          หน้า {currentPage} / {totalPages}
        </div>
      </div>
    </div>
  );
}

const ReportMosquitoCompDataComp = () => {
  const [year, setYear] = useState("2568");
  const [month, setMonth] = useState("06");
  const [week, setWeek] = useState("1");
  const [zone, setZone] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [subdistrict, setSubdistrict] = useState("");
  const [service, setService] = useState("");
  const [keyword, setKeyword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredRows = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    if (!term) return ALL_ROWS;
    return ALL_ROWS.filter(
      (row) =>
        row.name.toLowerCase().includes(term) ||
        row.date.toLowerCase().includes(term) ||
        String(row.index).includes(term)
    );
  }, [keyword]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));
  const paginatedRows = useMemo(
    () => filteredRows.slice((page - 1) * itemsPerPage, page * itemsPerPage),
    [filteredRows, itemsPerPage, page]
  );

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const handleReset = () => {
    setYear("2568");
    setMonth("06");
    setWeek("1");
    setZone("");
    setProvince("");
    setDistrict("");
    setSubdistrict("");
    setService("");
    setKeyword("");
    setPage(1);
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-[#f7f2ff] via-white to-white p-0">
      <DetailModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <div className="relative mb-6 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7e32e2] via-[#9333ea] to-[#a855f7]" />
        <div className="absolute inset-0 bg-white/5" />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Download size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    รายงานลูกน้ำยุงลาย
                  </h1>
                  <p className="text-white/80">
                    สรุปข้อมูลรายงานและดาวน์โหลดไฟล์ได้ทันที
                  </p>
                </div>
              </div>
            </div>
            <div className="flex w-full lg:w-auto justify-end">
              <button
                className="bg-white text-[#7e32e2] font-semibold rounded-2xl px-4 py-3 shadow-lg border border-white/50 hover:-translate-y-0.5 transition"
                onClick={() => setModalOpen(true)}
              >
                <Download size={18} className="inline mr-2" /> ดาวน์โหลดรายงาน
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#eee5ff] shadow-xl rounded-2xl p-5 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CustomSelect
            label="ปีงบประมาณ"
            placeholder="เลือกปี"
            value={year}
            onChange={setYear}
            options={YEARS}
            icon={Calendar}
          />
          <CustomSelect
            label="เดือน"
            placeholder="เลือกเดือน"
            value={month}
            onChange={setMonth}
            options={MONTHS}
            icon={Calendar}
          />
          <CustomSelect
            label="สัปดาห์"
            placeholder="เลือกสัปดาห์"
            value={week}
            onChange={setWeek}
            options={WEEKS}
            icon={Calendar}
          />
          <CustomSelect
            label="เขตสุขภาพ"
            placeholder="เลือกเขต"
            value={zone}
            onChange={setZone}
            options={ZONES}
            icon={MapPin}
          />
          <CustomSelect
            label="จังหวัด"
            placeholder="เลือกจังหวัด"
            value={province}
            onChange={setProvince}
            options={PROVINCES}
            icon={Building2}
          />
          <CustomSelect
            label="อำเภอ"
            placeholder="เลือกอำเภอ"
            value={district}
            onChange={setDistrict}
            options={DISTRICTS}
            icon={Building2}
          />
          <CustomSelect
            label="ตำบล"
            placeholder="เลือกตำบล"
            value={subdistrict}
            onChange={setSubdistrict}
            options={SUBDISTRICTS}
            icon={Home}
          />
          <CustomSelect
            label="หน่วยบริการ"
            placeholder="เลือกหน่วยบริการ"
            value={service}
            onChange={setService}
            options={SERVICES}
            icon={Home}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-[#ece1f7] p-4 my-6">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
              placeholder="พิมพ์คำค้นหาชื่อรายงาน วันที่ หรือจำนวน..."
              className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-purple-200 bg-gradient-to-r from-purple-50/50 to-violet-50/50 text-gray-700 font-medium placeholder:text-gray-400 focus:border-[#7e32e2] focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all duration-200"
            />
          </div>
          <button
            className="flex items-center justify-center gap-2 px-6 py-3 h-12 bg-gradient-to-r from-[#7e32e2] to-[#a855f7] text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 whitespace-nowrap w-full sm:w-auto"
            onClick={() => setPage(1)}
          >
            <Search size={20} />
            ค้นหา
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#eee5ff] shadow-xl rounded-2xl p-5 sm:p-6">
        <div className="overflow-x-auto">
          <table
            className="w-full text-[15px] border-separate"
            style={{ borderSpacing: 0, minWidth: "900px" }}
          >
            <thead>
              <tr className="bg-gradient-to-r from-[#7e32e2] to-[#a855f7] text-white">
                <th className="py-4 px-4 font-semibold text-center text-white rounded-tl-xl">
                  ลำดับ
                </th>
                <th className="py-4 px-4 font-semibold text-left text-white">
                  ชื่อรายงาน
                </th>
                <th className="py-4 px-4 font-semibold text-center text-white">
                  วันที่
                </th>
                <th className="py-4 px-4 font-semibold text-center text-white">
                  จำนวน
                </th>
                <th className="py-4 px-4 font-semibold text-center text-white rounded-tr-xl">
                  การทำงาน
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileText size={48} className="text-gray-300" />
                      <p className="text-gray-500">ไม่พบข้อมูล</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => (
                  <tr
                    key={row.index}
                    className={`${
                      idx % 2 === 0 ? "bg-white" : "bg-purple-50/30"
                    } hover:bg-purple-50 transition-colors`}
                  >
                    <td className="py-4 px-4 text-center font-medium text-gray-600">
                      {(page - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="py-4 px-4 font-medium text-[#231d37]">
                      {row.name}
                    </td>
                    <td className="py-4 px-4 text-center text-gray-600">
                      {row.date}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-100 text-pink-700 font-semibold text-sm">
                        <Users size={14} />
                        {row.amount}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7e32e2] to-[#9333ea] text-white font-semibold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                        onClick={() => setModalOpen(true)}
                      >
                        <Eye size={16} />
                        รายละเอียด
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          setCurrentPage={setPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
        />
      </div>
    </div>
  );
};

export default ReportMosquitoCompDataComp;
