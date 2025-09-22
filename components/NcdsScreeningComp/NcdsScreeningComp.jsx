import React, { useState } from "react";
import Image from "next/image";
import {
  Search,
  Eye,
  Download,
  // ChevronDown, // Unused
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import InputService from "@services/inputService/inputService";
import ButtonService from "@services/buttonService/buttonService";

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
const WEEKS = [
  { label: "สัปดาห์ 4 (23/6/68-27/6/68)", value: "4" },
  { label: "สัปดาห์ 3 (16/6/68-22/6/68)", value: "3" },
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
const SERVICES = [
  { label: "เลือกหน่วยบริการ", value: "" },
  { label: "รพ.เชียงใหม่", value: "รพ.เชียงใหม่" },
  { label: "รพ.สันทราย", value: "รพ.สันทราย" },
];

// Table mock (100 rows)
const ALL_ROWS = Array.from({ length: 100 }, (_, i) => ({
  index: i + 1,
  name: "นางสาวชบุษบก ผดุงจิตร",
  date: "25 มิถุนายน 2568",
  amount: 20,
}));

const PER_PAGE_OPTIONS = [
  { label: "10", value: 10 },
  { label: "20", value: 20 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
];

// Utility function for pagination numbers with ellipsis
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

// Modal component styled like the image (for both download and detail)
function DetailModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-2xl shadow-xl border border-[#ece1f7] w-[95vw] max-w-xl p-6 relative">
        <div className="text-[20px] font-bold text-[#7e32e2] mb-5">
          ดาวน์โหลดเอกสาร
        </div>
        <div className="flex flex-col gap-4 mb-8">
          {/* Row 1 */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <div className="flex-1 text-[16px] text-[#231d37] font-semibold">
              สรุปจำนวนการส่งรายงาน
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#7e32e2] bg-white text-[#d32f2f] font-semibold text-[15px] shadow hover:bg-[#fbe9e7] focus:outline-none">
                <Image src="/pdf.png" alt="pdf" width={24} height={24} className="w-6 h-6" />
                เอกสาร PDF
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#7e32e2] bg-white text-[#388e3c] font-semibold text-[15px] shadow hover:bg-[#e8f5e9] focus:outline-none">
                <Image src="/xlsx.png" alt="excel" width={24} height={24} className="w-6 h-6" />
                เอกสาร Excel
              </button>
            </div>
          </div>
          {/* Row 2 */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <div className="flex-1 text-[16px] text-[#231d37] font-semibold">
              สรุปภาพรวมรายงานในพื้นที่
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#ece1f7] bg-[#f7f7f7] text-[#bbb] font-semibold text-[15px] shadow cursor-not-allowed">
                <Image src="/pdf.png" alt="pdf" width={24} height={24} className="w-6 h-6 opacity-50" />
                เอกสาร PDF
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#ece1f7] bg-[#f7f7f7] text-[#bbb] font-semibold text-[15px] shadow cursor-not-allowed">
                <Image
                  src="/xlsx.png"
                  alt="excel"
                  width={24}
                  height={24}
                  className="w-6 h-6 opacity-50"
                />
                เอกสาร Excel
              </button>
            </div>
          </div>
          {/* Row 3 */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <div className="flex-1 text-[16px] text-[#231d37] font-semibold">
              อสม. ที่ยังไม่ส่งรายงาน
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#ece1f7] bg-[#f7f7f7] text-[#bbb] font-semibold text-[15px] shadow cursor-not-allowed">
                <Image src="/pdf.png" alt="pdf" width={24} height={24} className="w-6 h-6 opacity-50" />
                เอกสาร PDF
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#ece1f7] bg-[#f7f7f7] text-[#bbb] font-semibold text-[15px] shadow cursor-not-allowed">
                <Image
                  src="/xlsx.png"
                  alt="excel"
                  width={24}
                  height={24}
                  className="w-6 h-6 opacity-50"
                />
                เอกสาร Excel
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-2">
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

const NcdsScreeningComp = () => {
  // State
  const [searchType, setSearchType] = useState("year");
  const [year, setYear] = useState("2568");
  const [month, setMonth] = useState("06");
  const [week, setWeek] = useState("4");
  const [zone, setZone] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [subdistrict, setSubdistrict] = useState("");
  const [service, setService] = useState("");
  const [keyword, setKeyword] = useState("");
  const [modalOpen, setModalOpen] = useState(false); // for modal
  // const dropdownRef = useRef(null); // Unused

  // Pagination state
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter rows by keyword
  const filteredRows = ALL_ROWS.filter(
    (row) =>
      row.name.includes(keyword) ||
      row.date.includes(keyword) ||
      String(row.index).includes(keyword)
  );
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));
  // Paginated rows
  const paginatedRows = filteredRows.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Reset page if filteredRows or itemsPerPage change
  React.useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [filteredRows.length, totalPages, itemsPerPage, page]);

  // Button styles (ดาวน์โหลด)
  const buttonStyle =
    "flex items-center justify-center px-4 py-2 rounded-xl border border-[#7e32e2] text-[#7e32e2] bg-white font-semibold text-[15px] focus:outline-none transition shadow-[0_2px_8px_0_rgba(126,50,226,0.10)]";
  const iconStyle = "text-[#7e32e2] mr-2";

  return (
    <div className="w-full h-full bg-transparent p-0 m-0">
      {/* Modal */}
      <DetailModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* ฟอร์มค้นหา */}
      <div
        className="w-full bg-white rounded-xl shadow-sm border border-[#ece1f7] p-6 mb-5"
        style={{ boxSizing: "border-box" }}
      >
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <span className="font-semibold text-[#231d37] text-[16px] mr-3">
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
              ค้นหาแบบรายปี
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
              ค้นหาแบบรายปีงบประมาณ
            </span>
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
          <div>
            <div className="text-[15px] text-[#222] font-medium mb-1">ปี</div>
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
            <div className="text-[15px] text-[#222] font-medium mb-1">
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
          <div>
            <div className="text-[15px] text-[#222] font-medium mb-1">
              สัปดาห์
            </div>
            <InputService
              options={WEEKS}
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              placeholder="เลือกสัปดาห์"
              name="week"
              clearable={false}
            />
          </div>
          <div>
            <div className="text-[15px] text-[#222] font-medium mb-1">
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
            <div className="text-[15px] text-[#222] font-medium mb-1">ตำบล</div>
            <InputService
              options={SUBDISTRICTS}
              value={subdistrict}
              onChange={(e) => setSubdistrict(e.target.value)}
              placeholder="เลือกตำบล"
              name="subdistrict"
              clearable={true}
            />
          </div>
          <div>
            <div className="text-[15px] text-[#222] font-medium mb-1">
              หน่วยบริการ
            </div>
            <InputService
              options={SERVICES}
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="เลือกหน่วยบริการ"
              name="service"
              clearable={true}
            />
          </div>
          <div>
            <div className="text-[15px] text-[#222] font-medium mb-1">
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
            <div className="text-[15px] text-[#222] font-medium mb-1">
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
        </div>

        <div className="flex flex-col md:flex-row gap-3 mt-5">
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
              setWeek("");
              setZone("");
              setService("");
              setProvince("");
              setDistrict("");
              setSubdistrict("");
              setKeyword("");
            }}
          >
            ล้างข้อมูลการค้นหา
          </ButtonService>
        </div>
      </div>

      {/* Search bar + download */}
      <div className="flex flex-col md:flex-row items-center justify-between mt-4 mb-0 gap-2">
        <div className="w-full md:w-auto flex-1">
          <InputService
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1); // reset to page 1 on search
            }}
            placeholder="ค้นหาชื่อและนามสกุล"
            name="search"
            clearable={true}
          />
        </div>
        <div className="flex items-center gap-2 mt-3 md:mt-0">
          <ButtonService
            icon={<Search className="w-5 h-5 mr-2 text-white" />}
            variant="primary"
            size="md"
            className="w-full md:w-fit h-12 text-[16px] bg-[#7e32e2] border-none text-white rounded-lg font-semibold flex items-center justify-center"
            onClick={() => {
              setPage(1);
            }}
          >
            ค้นหา
          </ButtonService>
          <ButtonService
            icon={<Download className={iconStyle + " w-5 h-5"} />}
            variant="secondary"
            size="md"
            className={buttonStyle + " h-12 ml-2"}
            onClick={() => {
              setModalOpen(true);
            }}
          >
            ดาวน์โหลดรายงาน
          </ButtonService>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-6">
        <table
          className="w-full text-[15px] border-separate"
          style={{ borderSpacing: 0, minWidth: "900px" }}
        >
          <thead>
            <tr
              className="text-[#7e32e2]"
              style={{
                background: "#f6eeff",
              }}
            >
              <th className="py-3 px-4 font-semibold text-center rounded-tl-xl">
                ลำดับ
              </th>
              <th className="py-3 px-4 font-semibold text-left">
                รายชื่อ (100 รายการ)
              </th>
              <th className="py-3 px-4 font-semibold text-center">ส่งวันที่</th>
              <th className="py-3 px-4 font-semibold text-center">
                จำนวนหลังคาเรือน
              </th>
              <th className="py-3 px-4 font-semibold text-center rounded-tr-xl">
                รายละเอียด
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, idx) => (
              <tr
                key={row.index}
                className={idx % 2 === 0 ? "bg-white" : "bg-[#faf8ff]"}
              >
                <td className="py-3 px-4 text-center align-middle font-medium">
                  {row.index}
                </td>
                <td className="py-3 px-4 align-middle">{row.name}</td>
                <td className="py-3 px-4 text-center align-middle">
                  {row.date}
                </td>
                <td className="py-3 px-4 text-center align-middle">
                  {row.amount}
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
                      setModalOpen(true);
                    }}
                  >
                    ดูรายละเอียด
                  </ButtonService>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <PaginationWithPerPage
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

export default NcdsScreeningComp;
