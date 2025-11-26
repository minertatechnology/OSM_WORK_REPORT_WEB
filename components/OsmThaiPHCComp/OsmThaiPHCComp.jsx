import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { Search, Eye, Download, ChevronDown, Calendar, MapPin } from "lucide-react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import ButtonService from "@services/buttonService/buttonService";

// Register chart.js elements
ChartJS.register(ArcElement, Tooltip, Legend);

// Mock Data
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
const ZONES = [
  { label: "เลือกเขตสุขภาพ", value: "" },
  ...Array.from({ length: 13 }, (_, i) => ({
    label: `เขตสุขภาพที่ ${i + 1}`,
    value: `${i + 1}`,
  })),
];
const PROVINCES = [
  { label: "เลือกจังหวัด", value: "" },
  { label: "เชียงใหม่", value: "เชียงใหม่" },
  { label: "กรุงเทพฯ", value: "กรุงเทพฯ" },
];
const DISTRICTS = [
  { label: "เลือกอำเภอ", value: "" },
  { label: "เมือง", value: "เมือง" },
  { label: "สันทราย", value: "สันทราย" },
];
const SUBDISTRICTS = [
  { label: "เลือกตำบล", value: "" },
  { label: "ท่าศาลา", value: "ท่าศาลา" },
  { label: "หนองจ๊อม", value: "หนองจ๊อม" },
];

// ข้อมูลเมื่อเลือกจังหวัด (Pie chart + รายละเอียด)
const provincePieData = [
  {
    color: "#1ac6ae",
    value: 7835,
    label: "จำนวน อสม.ตามโควตาที่จังหวัดได้รับ",
    icon: (
      <span
        className="w-6 h-6 rounded-lg flex items-center justify-center"
        style={{ background: "#1ac6ae" }}
      >
        <svg width="18" height="18" viewBox="0 0 20 20">
          <rect x="2" y="2" width="16" height="16" rx="4" fill="#1ac6ae" />
          <path
            d="M6 10h8"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M10 6v8"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
    ),
    textColor: "#1ac6ae",
  },
  {
    color: "#8a61e5",
    value: 8974,
    label: "จำนวน อสม. ที่มีอยู่ ณ ปัจจุบัน",
    icon: (
      <span
        className="w-6 h-6 rounded-lg flex items-center justify-center"
        style={{ background: "#8a61e5" }}
      >
        <svg width="18" height="18" viewBox="0 0 20 20">
          <rect x="2" y="2" width="16" height="16" rx="4" fill="#8a61e5" />
          <path
            d="M10 6v8"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
    ),
    textColor: "#8a61e5",
  },
  {
    color: "#f5873d",
    value: -1139,
    label: "จำนวน อสม. ที่สามารถเพิ่มได้ตามโควตา",
    icon: (
      <span
        className="w-6 h-6 rounded-lg flex items-center justify-center"
        style={{ background: "#f5873d" }}
      >
        <svg width="18" height="18" viewBox="0 0 20 20">
          <rect x="2" y="2" width="16" height="16" rx="4" fill="#f5873d" />
          <path
            d="M14 10H6"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
    ),
    textColor: "#f5873d",
  },
];
const provincePieChartData = {
  labels: provincePieData.map((d) => d.label),
  datasets: [
    {
      data: provincePieData.map((d) => d.value),
      backgroundColor: provincePieData.map((d) => d.color),
      borderWidth: 2,
      borderColor: "#fff",
    },
  ],
};
const provincePieChartOptions = {
  cutout: "70%",
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: function (context) {
          const label = context.label || "";
          const value = context.raw || 0;
          return `${label}: ${value.toLocaleString()} คน`;
        },
      },
    },
  },
};

const provincePieSummary = provincePieData;

// Legend options (เดิม)
const LEGEND_OPTIONS = [
  {
    label: (
      <span className="flex items-center gap-2">
        <span
          className="w-4 h-4 rounded-full inline-block"
          style={{ background: "#47d2be" }}
        />
        จำนวน อสม.จากฐานข้อมูล ThaiPHC และกรมบัญชีกลาง
      </span>
    ),
    value: "phc-central",
  },
  {
    label: (
      <span className="flex items-center gap-2">
        <span
          className="w-4 h-4 rounded-full inline-block"
          style={{ background: "#7ec3fa" }}
        />
        จำนวน อสม.จากฐานข้อมูลกรมบัญชีกลาง ที่ไม่มีข้อมูลใน Thaiphc
      </span>
    ),
    value: "central-no-phc",
  },
  {
    label: (
      <span className="flex items-center gap-2">
        <span
          className="w-4 h-4 rounded-full inline-block"
          style={{ background: "#2991e8" }}
        />
        จำนวน อสม.รายใหม่ที่รอยืนยันจากสสจ.
      </span>
    ),
    value: "new-osm",
  },
  {
    label: (
      <span className="flex items-center gap-2">
        <span
          className="w-4 h-4 rounded-full inline-block"
          style={{ background: "#b0a9c5" }}
        />
        จำนวน อสม.ที่ไม่มีข้อมูลในฐานข้อมูลกรมบัญชีกลาง
      </span>
    ),
    value: "no-central",
  },
  {
    label: (
      <span className="flex items-center gap-2">
        <span
          className="w-4 h-4 rounded-full inline-block"
          style={{ background: "#888" }}
        />
        จำนวน อสม. จาก ThaiPHC ที่ไม่เข้าเงื่อนไข
      </span>
    ),
    value: "phc-not-match",
  },
];

// Pie chart mock values (สีให้ตรง legend)
const pieData = [
  {
    color: "#47d2be",
    value: 8974,
    label: "รายชื่อ อสม.แยกตามแหล่งที่มา ของข้อมูล",
    textColor: "#1ac6ae",
  },
  {
    color: "#417af7",
    value: 2,
    label: "จำนวน อสม.จากฐานข้อมูล กรมบัญชีกลาง ที่ไม่มีข้อมูลใน Thaiphc",
    textColor: "#417af7",
  },
  {
    color: "#00b2ea",
    value: 4,
    label: "จำนวน อสม.รายใหม่ที่รอยืนยันจากสสจ.",
    textColor: "#00b2ea",
  },
  {
    color: "#b686f0",
    value: 475,
    label: "จำนวน อสม.ที่ไม่มีข้อมูลในฐานข้อมูลกรมบัญชีกลาง",
    textColor: "#b686f0",
  },
  {
    color: "#7e32e2",
    value: 88,
    label: "อสม. ขอรับค่าป่วยการ",
    textColor: "#7e32e2",
  },
  {
    color: "#8f48ce",
    value: 39,
    label: "อสม. ไม่ขอรับค่าป่วยการ",
    textColor: "#8f48ce",
  },
  {
    color: "#c799f7",
    value: 348,
    label: "อสม. รอรับค่าป่วยการ",
    textColor: "#c799f7",
  },
];

const pieDataSummary = pieData.slice(0, 3); // 3 ก้อนแรกแสดงใต้กราฟ

const pieChartData = {
  labels: pieData.map((d) => d.label),
  datasets: [
    {
      data: pieData.map((d) => d.value),
      backgroundColor: pieData.map((d) => d.color),
      borderWidth: 2,
      borderColor: "#fff",
    },
  ],
};
const pieChartOptions = {
  cutout: "70%",
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: function (context) {
          const label = context.label || "";
          const value = context.raw || 0;
          return `${label}: ${value.toLocaleString()} คน`;
        },
      },
    },
  },
};

const tableRows = Array.from({ length: 10 }, (_, i) => ({
  index: i + 1,
  name: "นางสาวชมบุษบก ผดุงจิตร",
  cid: "1539900551382",
}));

const showProvinceChart = (province) => province && province !== "";

// CustomSelect component
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
    const newValue = option.value ?? option;
    onChange({ target: { value: newValue } });
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

const OsmThaiPHCComp = () => {
  // State
  const [searchType, setSearchType] = useState("year");
  const [year, setYear] = useState("2568");
  const [month, setMonth] = useState("06");
  const [zone, setZone] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [subdistrict, setSubdistrict] = useState("");
  const [legend, setLegend] = useState(""); // เลือก filter legend

  // Download dropdown state
  const [open, setOpen] = useState(false);
  // const dropdownRef = useRef(null);

  // Button styles (ใช้เหมือนภาพ ![image7](image7))
  const buttonStyle =
    "flex items-center justify-between px-6 py-2 rounded-xl border border-[#7e32e2] text-[#7e32e2] bg-white font-semibold text-[16px] focus:outline-none transition shadow-[0_2px_8px_0_rgba(126,50,226,0.10)]";
  const iconStyle = "text-[#7e32e2] mr-2";
  const arrowStyle = "text-[#7e32e2] ml-3";
  const splitStyle = "ml-4 flex items-center";

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-violet-50/30">
      <div className="w-full h-full p-6">
        {/* Header Section with Gradient */}
        <div className="relative mb-6 rounded-3xl overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-[#7e32e2] via-[#9333ea] to-[#a855f7]" />
          <div className="absolute inset-0 bg-white/5" />
          <div className="relative p-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  ข้อมูล อสม. Thai PHC
                </h1>
                <p className="text-white/90 text-sm">
                  ข้อมูลอาสาสมัครสาธารณสุขประจำหมู่บ้าน จากระบบ ThaiPHC
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search/filter */}
        <div className="w-full bg-white rounded-2xl shadow-md border border-purple-100 p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-purple-600" />
              เลือกรูปแบบการค้นหา
            </h2>
            <div className="flex flex-wrap gap-6 items-center bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-xl">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={searchType === "year"}
                  onChange={() => setSearchType("year")}
                  className="hidden"
                />
                <span
                  className={`w-6 h-6 mr-3 rounded-full border-2 flex items-center justify-center transition-all ${
                    searchType === "year"
                      ? "border-[#7e32e2] bg-[#7e32e2] shadow-lg"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {searchType === "year" && (
                    <span className="w-3 h-3 bg-white rounded-full block" />
                  )}
                </span>
                <span
                  className={`font-semibold text-base ${
                    searchType === "year" ? "text-[#7e32e2]" : "text-gray-500"
                  }`}
                >
                  ค้นหารายปี
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={searchType === "budget"}
                  onChange={() => setSearchType("budget")}
                  className="hidden"
                />
                <span
                  className={`w-6 h-6 mr-3 rounded-full border-2 flex items-center justify-center transition-all ${
                    searchType === "budget"
                      ? "border-[#7e32e2] bg-[#7e32e2] shadow-lg"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {searchType === "budget" && (
                    <span className="w-3 h-3 bg-white rounded-full block" />
                  )}
                </span>
                <span
                  className={`font-semibold text-base ${
                    searchType === "budget" ? "text-[#7e32e2]" : "text-gray-500"
                  }`}
                >
                  ค้นหารายปีงบประมาณ
                </span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <CustomSelect
              label="ปี"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              options={YEARS}
              placeholder="เลือกปี"
              icon={Calendar}
            />
            <CustomSelect
              label="เดือน"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              options={MONTHS}
              placeholder="เลือกเดือน"
              icon={Calendar}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <CustomSelect
              label="เขตสุขภาพ"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              options={ZONES}
              placeholder="เลือกเขตสุขภาพ"
              icon={MapPin}
            />
            <CustomSelect
              label="จังหวัด"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              options={PROVINCES}
              placeholder="เลือกจังหวัด"
              icon={MapPin}
            />
            <CustomSelect
              label="อำเภอ"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              options={DISTRICTS}
              placeholder="เลือกอำเภอ"
              icon={MapPin}
            />
            <CustomSelect
              label="ตำบล"
              value={subdistrict}
              onChange={(e) => setSubdistrict(e.target.value)}
              options={SUBDISTRICTS}
              placeholder="เลือกตำบล"
              icon={MapPin}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4 mt-6">
            <ButtonService
              icon={<Search className="w-5 h-5 mr-2 text-white" />}
              variant="primary"
              size="md"
              className="w-full md:w-fit flex-1 h-14 text-lg bg-gradient-to-r from-[#7e32e2] to-[#9333ea] hover:from-[#6c28c8] hover:to-[#7e32e2] border-none text-white rounded-xl font-semibold flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
              onClick={() => {
                /* handle search */
              }}
            >
              ค้นหา
            </ButtonService>
            <ButtonService
              variant="secondary"
              size="md"
              className="w-full md:w-fit flex-1 h-14 text-lg bg-white border-2 border-purple-300 text-purple-600 hover:bg-purple-50 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
              onClick={() => {
                setYear("");
                setMonth("");
                setZone("");
                setProvince("");
                setDistrict("");
                setSubdistrict("");
                setLegend("");
              }}
            >
              ล้างข้อมูลการค้นหา
            </ButtonService>
          </div>
        </div>

        {/* Province Pie Chart (ด้านบน chart เมื่อค้นด้วยจังหวัด) */}
        {showProvinceChart(province) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Pie chart province */}
            <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 flex flex-col items-center hover:shadow-xl transition-shadow">
              <div
                className="text-[17px] font-semibold mb-2"
                style={{
                  color: "#8a61e5",
                  letterSpacing: "-1px",
                  marginBottom: "4px",
                  width: "100%",
                }}
              >
                แผนภาพ
              </div>
              <div
                className="w-full"
                style={{
                  height: 2,
                  background: "#ece1f7",
                  marginBottom: 18,
                  marginTop: -2,
                  borderRadius: 3,
                }}
              />
              <div
                className="flex flex-col items-center justify-center"
                style={{ width: 250, height: 250 }}
              >
                <Doughnut
                  data={provincePieChartData}
                  options={provincePieChartOptions}
                />
              </div>
              <div className="flex items-center justify-center gap-7 mt-6">
                {provincePieSummary.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-[17px] font-semibold"
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        background: d.color,
                        borderRadius: 8,
                        display: "inline-block",
                      }}
                    />
                    <span style={{ color: d.textColor }}>
                      {d.value.toLocaleString()}
                    </span>
                    <span className="text-[#888] text-[14px] font-normal">
                      คน
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* รายละเอียดจังหวัด */}
            <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 flex flex-col hover:shadow-xl transition-shadow">
              <div
                className="text-[17px] font-semibold mb-2"
                style={{
                  color: "#1ac6ae",
                  letterSpacing: "-1px",
                  marginBottom: "4px",
                  width: "100%",
                }}
              >
                จำนวน อสม.
              </div>
              <div
                className="w-full"
                style={{
                  height: 2,
                  background: "#ece1f7",
                  marginBottom: 18,
                  marginTop: -2,
                  borderRadius: 3,
                }}
              />
              <div className="flex flex-col gap-3">
                {provincePieData.map((d, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-[16px] font-medium"
                  >
                    {d.icon}
                    <span className="font-normal" style={{ color: "#231d37" }}>
                      {d.label}
                    </span>
                    <span
                      className="ml-auto font-semibold"
                      style={{ color: d.textColor, fontSize: "19px" }}
                    >
                      {d.value.toLocaleString()}
                    </span>
                    <span
                      className="text-[#888] font-normal text-[14px]"
                      style={{ marginLeft: 4 }}
                    >
                      คน
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chart + detail (ตามปกติ) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* LEFT: Pie chart */}
          <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 flex flex-col items-center hover:shadow-xl transition-shadow">
            <div
              className="text-[17px] font-semibold mb-2"
              style={{
                color: "#7e32e2",
                letterSpacing: "-1px",
                marginBottom: "4px",
                width: "100%",
              }}
            >
              แผนภาพ
            </div>
            <div
              className="w-full"
              style={{
                height: 2,
                background: "#ece1f7",
                marginBottom: 18,
                marginTop: -2,
                borderRadius: 3,
              }}
            />
            <div
              className="flex flex-col items-center justify-center"
              style={{ width: 250, height: 250 }}
            >
              <Doughnut data={pieChartData} options={pieChartOptions} />
            </div>
            <div className="flex items-center justify-center gap-7 mt-6">
              {pieDataSummary.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-[17px] font-semibold"
                >
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      background: d.color,
                      borderRadius: 8,
                      display: "inline-block",
                    }}
                  />
                  <span style={{ color: d.textColor }}>
                    {d.value.toLocaleString()}
                  </span>
                  <span className="text-[#888] text-[14px] font-normal">
                    คน
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* RIGHT: จำนวน อสม.แยกตามประเภท */}
          <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 flex flex-col hover:shadow-xl transition-shadow">
            <div
              className="text-[17px] font-semibold mb-2"
              style={{
                color: "#7e32e2",
                letterSpacing: "-1px",
                marginBottom: "4px",
                width: "100%",
              }}
            >
              จำนวน อสม.แจกแจงตามแหล่งที่มาและการตรวจสอบข้อมูล
            </div>
            <div
              className="w-full"
              style={{
                height: 2,
                background: "#ece1f7",
                marginBottom: 18,
                marginTop: -2,
                borderRadius: 3,
              }}
            />
            <div className="flex flex-col gap-3">
              {pieData.map((d, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-[16px] font-medium"
                >
                  <span
                    className="w-5 h-5 rounded-lg flex items-center justify-center"
                    style={{ background: d.color }}
                  >
                    <svg width="20" height="20">
                      <circle cx="10" cy="10" r="8" fill={d.color} />
                    </svg>
                  </span>
                  <span className="font-normal" style={{ color: "#231d37" }}>
                    {d.label}
                  </span>
                  <span
                    className="ml-auto font-semibold"
                    style={{ color: d.textColor, fontSize: "19px" }}
                  >
                    {d.value.toLocaleString()}
                  </span>
                  <span
                    className="text-[#888] font-normal text-[14px]"
                    style={{ marginLeft: 4 }}
                  >
                    คน
                  </span>
                </div>
              ))}
              {/* Extra rows (static, สีเทา) */}
              <div className="flex items-center gap-2 mt-2 text-[16px] font-medium">
                <span className="w-5 h-5 rounded-lg flex items-center justify-center bg-[#888]">
                  <svg width="20" height="20">
                    <rect
                      x="3"
                      y="3"
                      width="14"
                      height="14"
                      rx="3"
                      fill="#888"
                    />
                  </svg>
                </span>
                <span className="font-normal" style={{ color: "#231d37" }}>
                  จำนวน อสม. จาก ThaiPHC ที่ไม่เข้าเงื่อนไข
                  <span className="text-[#888] font-normal text-[15px] ml-2">
                    (จำหน่ายหรือหมดอายุสมาชิก)
                  </span>
                </span>
                <span
                  className="ml-auto font-semibold text-[#888]"
                  style={{ fontSize: "19px" }}
                >
                  3,887
                </span>
                <span
                  className="text-[#888] font-normal text-[14px]"
                  style={{ marginLeft: 4 }}
                >
                  คน
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              รายชื่อ อสม.แยกตามเขตที่ผ่านการตรวจสอบข้อมูล
            </h2>
            <div className="mt-4 mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
              <div className="flex-1">
                <CustomSelect
                  value={legend}
                  onChange={(e) => setLegend(e.target.value)}
                  options={LEGEND_OPTIONS}
                  placeholder="เลือกประเภท อสม."
                />
              </div>
              <div className="relative inline-block">
                <button
                  type="button"
                  className="flex items-center justify-between px-6 py-3 rounded-xl border-2 border-purple-500 text-purple-600 bg-white font-semibold text-base hover:bg-purple-50 transition-all shadow-md hover:shadow-lg w-full md:w-auto"
                  onClick={() => setOpen((s) => !s)}
                  aria-haspopup="true"
                  aria-expanded={open}
                >
                  <span className="flex items-center">
                    <Download className="w-5 h-5 mr-2" />
                    ดาวน์โหลดเอกสาร
                  </span>
                  <ChevronDown className="w-5 h-5 ml-4" />
                </button>
                {open && (
                  <div className="absolute z-30 right-0 mt-2 w-64 bg-white shadow-xl rounded-xl border border-purple-200 py-2">
                    <button
                      className="flex items-center w-full px-5 py-3 gap-3 text-gray-700 text-base hover:bg-purple-50 transition font-medium"
                      onClick={() => {
                        setOpen(false);
                        // TODO: Add Excel download logic here
                      }}
                    >
                      <Image
                        src="/xlsx.png"
                        alt="Excel icon"
                        width={28}
                        height={28}
                        className="w-7 h-7"
                      />
                      ดาวน์โหลดเอกสาร Excel
                    </button>
                    <button
                      className="flex items-center w-full px-5 py-3 gap-3 text-gray-700 text-base hover:bg-purple-50 transition font-medium"
                      onClick={() => {
                        setOpen(false);
                        // TODO: Add PDF download logic here
                      }}
                    >
                      <Image
                        src="/pdf.png"
                        alt="PDF icon"
                        width={28}
                        height={28}
                        className="w-7 h-7"
                      />
                      ดาวน์โหลดเอกสาร PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-purple-100">
            <table className="w-full text-base border-separate" style={{ borderSpacing: 0, minWidth: "900px" }}>
              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-violet-600 text-white">
                  <th className="py-4 px-6 font-bold text-center rounded-tl-xl">
                    ลำดับ
                  </th>
                  <th className="py-4 px-6 font-bold text-left">
                    รายชื่อ (100 รายการ)
                  </th>
                  <th className="py-4 px-6 font-bold text-center">
                    เลขประจำตัวประชาชน
                  </th>
                  <th className="py-4 px-6 font-bold text-center rounded-tr-xl">
                    สถานะการเปลี่ยนแปลง
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`${
                      idx % 2 === 0 ? "bg-white" : "bg-purple-50/40"
                    } hover:bg-purple-100/50 transition-colors`}
                  >
                    <td className="py-4 px-6 text-center align-middle font-semibold text-gray-700">
                      {row.index}
                    </td>
                    <td className="py-4 px-6 align-middle font-medium text-gray-800">
                      {row.name}
                    </td>
                    <td className="py-4 px-6 text-center align-middle text-gray-600 font-mono">
                      {row.cid}
                    </td>
                    <td className="py-4 px-6 text-center align-middle">
                      <ButtonService
                        icon={<Eye className="w-5 h-5" />}
                        variant="secondary"
                        size="md"
                        className="border-2 border-purple-500 text-purple-600 hover:bg-purple-50 font-semibold shadow-md hover:shadow-lg transition-all rounded-lg px-4 py-2"
                        onClick={() => {
                          /* handle detail */
                        }}
                      >
                        ดูรายละเอียด
                      </ButtonService>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OsmThaiPHCComp;
