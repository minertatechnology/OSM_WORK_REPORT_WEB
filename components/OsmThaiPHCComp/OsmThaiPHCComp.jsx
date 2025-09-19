import React, { useState, useRef } from "react";
import { Search, Eye, Download, ChevronDown } from "lucide-react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import InputService from "@services/inputService/inputService";
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
  const dropdownRef = useRef(null);

  // Button styles (ใช้เหมือนภาพ ![image7](image7))
  const buttonStyle =
    "flex items-center justify-between px-6 py-2 rounded-xl border border-[#7e32e2] text-[#7e32e2] bg-white font-semibold text-[16px] focus:outline-none transition shadow-[0_2px_8px_0_rgba(126,50,226,0.10)]";
  const iconStyle = "text-[#7e32e2] mr-2";
  const arrowStyle = "text-[#7e32e2] ml-3";
  const splitStyle = "ml-4 flex items-center";

  return (
    <div>
      <div
        className="w-full h-full bg-white rounded-none shadow-none border-none p-0 m-0"
        style={{ boxSizing: "border-box" }}
      >
        {/* Search/filter */}
        <div className="w-full bg-white rounded-none border-b border-[#ece1f7] p-4 mb-0">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="font-semibold text-[#231d37] text-[15px] mr-3">
              รูปแบบการค้นหา :
            </span>
            <label className="flex items-center cursor-pointer mr-5">
              <input
                type="radio"
                checked={searchType === "year"}
                onChange={() => setSearchType("year")}
                className="hidden"
              />
              <span
                className={`w-5 h-5 mr-2 rounded-full border-2 flex items-center justify-center transition-colors ${
                  searchType === "year"
                    ? "border-[#7e32e2] bg-[#f6eeff]"
                    : "border-gray-300 bg-white"
                }`}
              >
                {searchType === "year" && (
                  <span className="w-3 h-3 bg-[#7e32e2] rounded-full block" />
                )}
              </span>
              <span
                className={`font-medium ${
                  searchType === "year" ? "text-[#7e32e2]" : "text-[#aaa]"
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
                className={`w-5 h-5 mr-2 rounded-full border-2 flex items-center justify-center transition-colors ${
                  searchType === "budget"
                    ? "border-[#7e32e2] bg-[#f6eeff]"
                    : "border-gray-300 bg-white"
                }`}
              >
                {searchType === "budget" && (
                  <span className="w-3 h-3 bg-[#7e32e2] rounded-full block" />
                )}
              </span>
              <span
                className={`font-medium ${
                  searchType === "budget" ? "text-[#7e32e2]" : "text-[#aaa]"
                }`}
              >
                ค้นหารายปีงบประมาณ
              </span>
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <div className="text-[14px] text-[#222] font-medium mb-1">ปี</div>
              <InputService
                options={YEARS}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="เลือกปี"
                name="year"
                clearable={false}
              />
            </div>
            <div>
              <div className="text-[14px] text-[#222] font-medium mb-1">
                เดือน
              </div>
              <InputService
                options={MONTHS}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="เลือกเดือน"
                name="month"
                clearable={false}
              />
            </div>
            <div />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div>
              <div className="text-[14px] text-[#222] font-medium mb-1">
                เขตสุขภาพ
              </div>
              <InputService
                options={ZONES}
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="เลือกเขตสุขภาพ"
                name="zone"
                clearable={true}
              />
            </div>
            <div>
              <div className="text-[14px] text-[#222] font-medium mb-1">
                จังหวัด
              </div>
              <InputService
                options={PROVINCES}
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="เลือกจังหวัด"
                name="province"
                clearable={true}
              />
            </div>
            <div>
              <div className="text-[14px] text-[#222] font-medium mb-1">
                อำเภอ
              </div>
              <InputService
                options={DISTRICTS}
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="เลือกอำเภอ"
                name="district"
                clearable={true}
              />
            </div>
            <div>
              <div className="text-[14px] text-[#222] font-medium mb-1">
                ตำบล
              </div>
              <InputService
                options={SUBDISTRICTS}
                value={subdistrict}
                onChange={(e) => setSubdistrict(e.target.value)}
                placeholder="เลือกตำบล"
                name="subdistrict"
                clearable={true}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mt-4">
            <ButtonService
              icon={<Search className="w-5 h-5 mr-2 text-white" />}
              variant="primary"
              size="md"
              className="w-full md:w-fit flex-1 h-12 text-[18px] bg-[#7e32e2] hover:bg-[#6c28c8] border-none text-white rounded-lg font-semibold flex items-center justify-center"
              onClick={() => {
                /* handle search */
              }}
            >
              ค้นหา
            </ButtonService>
            <ButtonService
              variant="secondary"
              size="md"
              className="w-full md:w-fit flex-1 h-12 text-[18px] bg-white border border-[#7e32e2] text-[#7e32e2] hover:bg-[#f6eeff] rounded-lg font-semibold"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 w-full px-0">
            {/* Pie chart province */}
            <div
              className="bg-white rounded-2xl shadow-sm border border-[#ece1f7] p-5 flex flex-col items-center w-full"
              style={{ minWidth: 340, boxSizing: "border-box" }}
            >
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
            <div
              className="bg-white rounded-2xl shadow-sm border border-[#ece1f7] p-5 flex flex-col w-full"
              style={{ minWidth: 340, boxSizing: "border-box" }}
            >
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 w-full px-0">
          {/* LEFT: Pie chart */}
          <div
            className="bg-white rounded-2xl shadow-sm border border-[#ece1f7] p-5 flex flex-col items-center w-full"
            style={{ minWidth: 340, boxSizing: "border-box" }}
          >
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
          <div
            className="bg-white rounded-2xl shadow-sm border border-[#ece1f7] p-5 flex flex-col w-full"
            style={{ minWidth: 340, boxSizing: "border-box" }}
          >
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
        <div className="bg-white rounded-2xl shadow-sm border border-[#ece1f7] p-4 mt-1 w-full px-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              รายชื่อ อสม.แยกตามเขตที่ผ่านการตรวจสอบข้อมูล
            </div>
            <div className="mt-4 mb-4 flex flex-row gap-2 items-center justify-between">
              <InputService
                options={LEGEND_OPTIONS}
                value={legend}
                onChange={(e) => setLegend(e.target.value)}
                placeholder="เลือกประเภท อสม."
                name="legend"
                clearable={false}
                style={{ minWidth: 600 }}
              />
              <div className="relative inline-block">
                <button
                  type="button"
                  className={buttonStyle}
                  style={{ minWidth: 260, boxShadow: "0 2px 8px #e5d9ff" }}
                  onClick={() => setOpen((s) => !s)}
                  aria-haspopup="true"
                  aria-expanded={open}
                >
                  <span className="flex items-center">
                    <Download className={iconStyle + " w-5 h-5"} />
                    ดาวน์โหลดเอกสาร
                  </span>
                  <span className={splitStyle}>
                    <ChevronDown className={arrowStyle + " w-6 h-6"} />
                  </span>
                </button>
                {open && (
                  <div
                    className="absolute z-30 left-0 mt-2 w-full bg-white shadow-lg rounded-xl border border-[#ece1f7] py-2"
                    style={{ minWidth: 180 }}
                  >
                    <button
                      className="flex items-center w-full px-5 py-3 gap-2 text-[#222] text-[17px] hover:bg-[#f6eeff] transition font-medium"
                      onClick={() => {
                        setOpen(false);
                        // TODO: Add Excel download logic here
                      }}
                    >
                      <img
                        src="/xlsx.png"
                        alt="Excel icon"
                        className="w-7 h-7"
                        style={{ display: "inline-block" }}
                      />
                      ดาวน์โหลดเอกสาร Excel
                    </button>
                    <button
                      className="flex items-center w-full px-5 py-3 gap-2 text-[#222] text-[17px] hover:bg-[#f6eeff] transition font-medium"
                      onClick={() => {
                        setOpen(false);
                        // TODO: Add PDF download logic here
                      }}
                    >
                      <img
                        src="/pdf.png"
                        alt="PDF icon"
                        className="w-7 h-7"
                        style={{ display: "inline-block" }}
                      />
                      ดาวน์โหลดเอกสาร PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table
              className="w-full text-[15px] border-separate"
              style={{ borderSpacing: 0, minWidth: "900px" }}
            >
              <thead>
                <tr
                  className="text-[#7e32e2]"
                  style={{
                    background:
                      "var(--Color-Blackground-Table-Topbar, #EAD5FF)",
                  }}
                >
                  <th className="py-3 px-4 font-semibold text-center rounded-tl-xl">
                    ลำดับ
                  </th>
                  <th className="py-3 px-4 font-semibold text-left">
                    รายชื่อ (100 รายการ)
                  </th>
                  <th className="py-3 px-4 font-semibold text-center">
                    เลขประจำตัวประชาชน
                  </th>
                  <th className="py-3 px-4 font-semibold text-center rounded-tr-xl">
                    สถานะการเปลี่ยนแปลง
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? "bg-white" : "bg-[#f9f6ff]"}
                  >
                    <td className="py-3 px-4 text-center align-middle font-medium">
                      {row.index}
                    </td>
                    <td className="py-3 px-4 align-middle">{row.name}</td>
                    <td className="py-3 px-4 text-center align-middle">
                      {row.cid}
                    </td>
                    <td className="py-3 px-4 text-center align-middle">
                      <ButtonService
                        icon={<Eye className="w-5 h-5 text-[#7e32e2]" />}
                        variant="secondary"
                        size="md"
                        className="border-[#7e32e2] text-[#7e32e2] font-semibold shadow-[0_2px_6px_0_rgba(126,50,226,0.10)]"
                        style={{
                          borderWidth: 2,
                          borderStyle: "solid",
                          background: "white",
                          boxShadow: "0 2px 6px 0 rgba(126,50,226,0.10)",
                        }}
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
