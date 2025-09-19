import React, { useState, useRef } from "react";
import ButtonService from "@services/buttonService/buttonService";
import InputService from "@services/inputService/inputService";
import {
  Download,
  CalendarDays,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

// Mock data for filter dropdowns
const healthZones = [
  { value: "", label: "ทั้งหมด" },
  { value: "เขต1", label: "เขต1" },
  { value: "เขต2", label: "เขต2" },
];
const provinces = [
  { value: "", label: "เลือกจังหวัด" },
  { value: "มหาสารคาม", label: "มหาสารคาม" },
  { value: "ชลบุรี", label: "ชลบุรี" },
  { value: "ปราจีนบุรี", label: "ปราจีนบุรี" },
  { value: "กระบี่", label: "กระบี่" },
  { value: "นครศรีธรรมราช", label: "นครศรีธรรมราช" },
  { value: "สระแก้ว", label: "สระแก้ว" },
  { value: "มุกดาหาร", label: "มุกดาหาร" },
  { value: "กรุงเทพมหานคร", label: "กรุงเทพมหานคร" },
  { value: "อุทัยธานี", label: "อุทัยธานี" },
  { value: "ลำปาง", label: "ลำปาง" },
];
const amphurs = [
  { value: "", label: "เลือกอำเภอ" },
  { value: "เมือง", label: "เมือง" },
  { value: "บ้านกรวด", label: "บ้านกรวด" },
];
const tambons = [
  { value: "", label: "เลือกตำบล" },
  { value: "ท่าตูม", label: "ท่าตูม" },
  { value: "ในเมือง", label: "ในเมือง" },
];

const years = [
  { value: "2568", label: "2568" },
  { value: "2567", label: "2567" },
  { value: "2566", label: "2566" },
];
const months = [
  { value: "มกราคม", label: "มกราคม" },
  { value: "กุมภาพันธ์", label: "กุมภาพันธ์" },
  { value: "มีนาคม", label: "มีนาคม" },
  { value: "เมษายน", label: "เมษายน" },
  { value: "พฤษภาคม", label: "พฤษภาคม" },
  { value: "มิถุนายน", label: "มิถุนายน" },
  { value: "กรกฎาคม", label: "กรกฎาคม" },
  { value: "สิงหาคม", label: "สิงหาคม" },
  { value: "กันยายน", label: "กันยายน" },
  { value: "ตุลาคม", label: "ตุลาคม" },
  { value: "พฤศจิกายน", label: "พฤศจิกายน" },
  { value: "ธันวาคม", label: "ธันวาคม" },
];

// Mock table data
const tableList = [
  {
    name: "มหาสารคาม",
    positive: 573,
    negative: 4755,
    invalid: 27,
    total: 5355,
  },
  {
    name: "ชลบุรี",
    positive: 75,
    negative: 1780,
    invalid: 4,
    total: 1859,
  },
  {
    name: "ปราจีนบุรี",
    positive: 75,
    negative: 1780,
    invalid: 4,
    total: 1859,
  },
  {
    name: "กระบี่",
    positive: 75,
    negative: 1780,
    invalid: 4,
    total: 1859,
  },
  {
    name: "นครศรีธรรมราช",
    positive: 75,
    negative: 1780,
    invalid: 4,
    total: 1859,
  },
  {
    name: "สระแก้ว",
    positive: 75,
    negative: 1780,
    invalid: 4,
    total: 1859,
  },
  {
    name: "มุกดาหาร",
    positive: 75,
    negative: 1780,
    invalid: 4,
    total: 1859,
  },
  {
    name: "กรุงเทพมหานคร",
    positive: 75,
    negative: 1780,
    invalid: 4,
    total: 1859,
  },
  {
    name: "อุทัยธานี",
    positive: 75,
    negative: 1780,
    invalid: 4,
    total: 1859,
  },
  {
    name: "ลำปาง",
    positive: 75,
    negative: 1780,
    invalid: 4,
    total: 1859,
  },
];

// Pagination constants and helpers
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

// Pagination component
function PaginationWithPerPage({
  currentPage,
  setCurrentPage,
  totalPages,
  itemsPerPage,
  setItemsPerPage,
}) {
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
          {PER_PAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-600">รายการต่อหน้า</span>
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
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
            currentPage === 1
              ? "text-gray-300 cursor-not-allowed"
              : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-110"
          }`}
          title="หน้าก่อนหน้า"
          aria-label="หน้าก่อนหน้า"
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
                className={`min-w-[36px] h-9 rounded-full font-semibold text-base transition-all duration-200 ${
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
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
            currentPage === totalPages
              ? "text-gray-300 cursor-not-allowed"
              : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-110"
          }`}
          title="หน้าถัดไป"
          aria-label="หน้าถัดไป"
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

  // Styles
  const buttonStyle =
    "flex justify-between items-center w-full gap-2 px-5 py-2 rounded-lg shadow border border-[#ece1f7] text-[#6E28B7] font-bold text-[15px] bg-white transition";
  const iconStyle = "mr-2 text-[#6E28B7]";
  const splitStyle = "ml-4 flex items-center";
  const arrowStyle = "text-[#6E28B7]";

  return (
    <div>
      {/* Search Form */}
      <div className="bg-white rounded-2xl shadow border border-[#ece1f7] p-5">
        <div className="mx-auto px-8">
          <div className="font-bold text-[16px] text-[#6E28B7] mb-4">
            รูปแบบการค้นหา :
          </div>
          <div className="flex flex-col gap-4 mb-4">
            {/* Search type */}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={searchType === "year"}
                  onChange={() => setSearchType("year")}
                  className="accent-[#6E28B7]"
                />
                <span className="text-[#6E28B7] font-medium text-[15px]">
                  ค้นหาแบบรายปี
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={searchType === "budget"}
                  onChange={() => setSearchType("budget")}
                  className="accent-[#6E28B7]"
                />
                <span className="text-[#6E28B7] font-medium text-[15px]">
                  ค้นหาแบบรายงบประมาณ
                </span>
              </label>
            </div>
            {/* ปี + เดือน */}
            <div className="flex items-end gap-4">
              {/* ปี */}
              <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
                <label className="text-[#6E28B7] font-medium text-[15px] mb-1">
                  ปี
                </label>
                <div className="relative">
                  <InputService
                    options={years}
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    name="year"
                    placeholder="เลือกปี"
                    icon={
                      <CalendarDays
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B7B7B7]"
                        size={20}
                      />
                    }
                  />
                </div>
              </div>
              {/* เดือน */}
              <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
                <label className="text-[#6E28B7] font-medium text-[15px] mb-1">
                  เดือน
                </label>
                <div className="relative">
                  <InputService
                    options={months}
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    name="month"
                    placeholder="เลือกเดือน"
                    icon={
                      <CalendarDays
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B7B7B7]"
                        size={20}
                      />
                    }
                  />
                </div>
              </div>
            </div>
            {/* ฟีลเตอร์เพิ่มเติม: เขต จังหวัด อำเภอ ตำบล */}
            <div className="flex items-end gap-4">
              {/* เขตสุขภาพ */}
              <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
                <label className="text-[#6E28B7] font-medium text-[15px] mb-1">
                  เขตสุขภาพ
                </label>
                <InputService
                  options={healthZones}
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  name="zone"
                  placeholder="ทั้งหมด"
                />
              </div>
              {/* จังหวัด */}
              <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
                <label className="text-[#6E28B7] font-medium text-[15px] mb-1">
                  จังหวัด
                </label>
                <InputService
                  options={provinces}
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  name="province"
                  placeholder="เลือกจังหวัด"
                />
              </div>
              {/* อำเภอ */}
              <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
                <label className="text-[#6E28B7] font-medium text-[15px] mb-1">
                  อำเภอ
                </label>
                <InputService
                  options={amphurs}
                  value={amphur}
                  onChange={(e) => setAmphur(e.target.value)}
                  name="amphur"
                  placeholder="เลือกอำเภอ"
                />
              </div>
              {/* ตำบล */}
              <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
                <label className="text-[#6E28B7] font-medium text-[15px] mb-1">
                  ตำบล
                </label>
                <InputService
                  options={tambons}
                  value={tambon}
                  onChange={(e) => setTambon(e.target.value)}
                  name="tambon"
                  placeholder="เลือกตำบล"
                />
              </div>
            </div>
          </div>
          {/* Actions */}
          <div className="grid grid-cols-2 gap-4 w-full mt-3">
            <ButtonService
              variant="primary"
              size="md"
              className="w-full flex justify-center items-center gap-2"
              icon={<Search size={20} />}
            >
              ค้นหา
            </ButtonService>
            <ButtonService
              variant="secondary"
              size="md"
              className="w-full flex justify-center items-center gap-2"
              icon={<RotateCcw size={20} />}
            >
              ล้างข้อมูลการค้นหา
            </ButtonService>
          </div>
        </div>
      </div>

      {/* Results Table Section */}
      <div className="w-full max-w-none">
        <div className="mx-auto py-3">
          {/* Title and Download Dropdown */}
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-[#6E28B7] text-[17px]">
              ตารางข้อมูลผลตรวจสอบ ATK
            </div>
            <div className="relative inline-block" ref={dropdownRef}>
              <button
                type="button"
                className={buttonStyle}
                style={{ minWidth: 200, boxShadow: "0 2px 8px #e5d9ff" }}
                onClick={() => setOpen((s) => !s)}
                aria-haspopup="true"
                aria-expanded={open}
              >
                <span className="flex items-center">
                  <Download className={iconStyle + " w-5 h-5"} />
                  ดาวน์โหลดรายงาน
                </span>
                <span className={splitStyle}>
                  <ChevronDown className={arrowStyle + " w-6 h-6"} />
                </span>
              </button>
              {open && (
                <div
                  className="absolute z-30 right-0 mt-2 w-full bg-white shadow-lg rounded-xl border border-[#ece1f7] py-2"
                  style={{ minWidth: 180 }}
                >
                  <button
                    className="flex items-center w-full px-5 py-3 gap-2 text-[#222] text-[17px] hover:bg-[#f6eeff] transition font-medium"
                    onClick={() => {
                      setOpen(false);
                      // TODO: handle excel download
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
                      // TODO: handle pdf download
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
          {/* Table */}
          <div className="w-full">
            <table className="w-full border-separate [border-spacing:0] rounded-xl overflow-hidden">
              <thead>
                <tr>
                  <th className="bg-[#EAD8FF] text-[#6E28B7] font-bold py-3 px-2 text-[15px] border-b border-[#dadada] rounded-tl-xl text-center">
                    ลำดับ
                  </th>
                  <th className="bg-[#EAD8FF] text-[#6E28B7] font-bold py-3 px-2 text-[15px] border-b border-[#dadada] text-center">
                    รายการ
                  </th>
                  <th className="bg-[#EAD8FF] text-[#6E28B7] font-bold py-3 px-2 text-[15px] border-b border-[#dadada] text-center">
                    Positive
                  </th>
                  <th className="bg-[#EAD8FF] text-[#6E28B7] font-bold py-3 px-2 text-[15px] border-b border-[#dadada] text-center">
                    negative
                  </th>
                  <th className="bg-[#EAD8FF] text-[#6E28B7] font-bold py-3 px-2 text-[15px] border-b border-[#dadada] text-center">
                    Invalid
                  </th>
                  <th className="bg-[#EAD8FF] text-[#6E28B7] font-bold py-3 px-2 text-[15px] border-b border-[#dadada] rounded-tr-xl text-center">
                    ทั้งหมด
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, idx) => (
                  <tr key={idx} className="border-b border-[#F2EFFF]">
                    <td className="py-3 px-2 text-center text-[#231d37] text-[15px] font-normal">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="py-3 px-2 text-center text-[#231d37] text-[15px] font-normal">
                      {row.name}
                    </td>
                    <td className="py-3 px-2 text-center text-[#231d37] text-[15px] font-normal">
                      {row.positive}
                    </td>
                    <td className="py-3 px-2 text-center text-[#231d37] text-[15px] font-normal">
                      {row.negative}
                    </td>
                    <td className="py-3 px-2 text-center text-[#231d37] text-[15px] font-normal">
                      {row.invalid}
                    </td>
                    <td className="py-3 px-2 text-center text-[#231d37] text-[15px] font-normal">
                      {row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </div>
  );
};

export default AtkReportComp;
