import React, { useState, useRef, useEffect } from "react";
import InputService from "@services/inputService/inputService";
import ButtonService from "@services/buttonService/buttonService";
import { Search, Download, ChevronDown, Eye } from "lucide-react";

// Mock data for select options and table
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
  { label: "สัปดาห์ 1 (2/6/68-8/6/68)", value: "week1" },
  { label: "สัปดาห์ 2 (9/6/68-15/6/68)", value: "week2" },
  { label: "สัปดาห์ 3 (16/6/68-22/6/68)", value: "week3" },
  { label: "สัปดาห์ 4 (23/6/68-27/6/68)", value: "week4" },
];
const ZONES = [
  { label: "ทั้งหมด", value: "" },
  { label: "เขตสุขภาพที่ 1", value: "1" },
  { label: "เขตสุขภาพที่ 2", value: "2" },
  { label: "เขตสุขภาพที่ 3", value: "3" },
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

const PER_PAGE_OPTIONS = [
  { label: "10", value: 10 },
  { label: "20", value: 20 },
  { label: "50", value: 50 },
];

// Mock table data
const userRows = Array.from({ length: 100 }, (_, i) => ({
  name: "นางสาวชมบุษบก ผดุงจิตร",
  cid: "1539900551382",
  position: "อสม. ทั่วไป",
}));

// Responsive Pagination Component
const Pagination = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  perPageOptions = PER_PAGE_OPTIONS,
  className = "",
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push("...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "...");
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, "...");
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push("...", totalPages);
    }
    return pages;
  };

  return (
    <div className={`w-full mt-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">แสดง</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="appearance-none border border-[#e5e7eb] rounded-lg px-3 py-2 pr-8 text-sm font-medium text-[#7e32e2] focus:outline-none focus:ring-2 focus:ring-[#7e32e2] focus:border-transparent cursor-pointer hover:border-[#7e32e2] transition-colors"
          >
            {perPageOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600">รายการต่อหน้า</span>
        </div>
        <div className="flex flex-row flex-wrap justify-center items-center gap-1 mt-4">
          <ButtonService
            type="button"
            variant="ghost"
            className={`p-2 rounded-lg ${
              currentPage === 1
                ? "text-gray-400"
                : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-105"
            }`}
            disabled={currentPage === 1}
            onClick={() => onPageChange(1)}
            size="sm"
          >
            {"<<"}
          </ButtonService>
          <ButtonService
            type="button"
            variant="ghost"
            className={`p-2 rounded-lg ${
              currentPage === 1
                ? "text-gray-400"
                : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-105"
            }`}
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            size="sm"
          >
            {"<"}
          </ButtonService>
          {getPageNumbers().map((page, idx) =>
            page === "..." ? (
              <span key={idx} className="px-3 py-2 text-gray-400 select-none">
                ...
              </span>
            ) : (
              <ButtonService
                key={idx}
                type="button"
                variant="ghost"
                className={`min-w-[36px] h-9 rounded-lg font-medium transition-all duration-200 ${
                  currentPage === page
                    ? "bg-[#7e32e2] text-white shadow-lg scale-105"
                    : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-105"
                }`}
                onClick={() => onPageChange(page)}
                size="sm"
              >
                {page}
              </ButtonService>
            )
          )}
          <ButtonService
            type="button"
            variant="ghost"
            className={`p-2 rounded-lg ${
              currentPage === totalPages
                ? "text-gray-400"
                : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-105"
            }`}
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            size="sm"
          >
            {">"}
          </ButtonService>
          <ButtonService
            type="button"
            variant="ghost"
            className={`p-2 rounded-lg ${
              currentPage === totalPages
                ? "text-gray-400"
                : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-105"
            }`}
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(totalPages)}
            size="sm"
          >
            {">>"}
          </ButtonService>
        </div>
        <div className="text-sm text-gray-600">
          รวมทั้งหมด{" "}
          <span className="font-medium text-[#7e32e2]">{totalItems}</span>{" "}
          รายการ
        </div>
      </div>
    </div>
  );
};

const UserListComp = () => {
  const [searchType, setSearchType] = useState("year");
  const [year, setYear] = useState("2568");
  const [month, setMonth] = useState("06");
  const [week, setWeek] = useState(WEEKS[3].value);
  const [zone, setZone] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [subdistrict, setSubdistrict] = useState("");
  const [searchText, setSearchText] = useState("");
  const [tab, setTab] = useState("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Dropdown state for download button
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  // Filter users by search text (name or cid)
  const filteredUsers = userRows.filter(
    (user) => user.name.includes(searchText) || user.cid.includes(searchText)
  );
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Paginate users
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // Button style for download dropdown
  const buttonStyle =
    "relative flex items-center justify-between rounded-xl border-2 border-[#7e32e2] bg-white text-[#7e32e2] px-6 py-3 text-[17px] font-medium shadow-[0_2px_10px_rgba(126,50,226,0.07)] focus:outline-none cursor-pointer transition hover:bg-[#f6eeff]";
  const splitStyle =
    "absolute right-0 top-0 h-full w-[44px] flex items-center justify-center rounded-tr-xl rounded-br-xl border-l-2 border-[#7e32e2] bg-[#e5d9ff] transition";
  const iconStyle = "mr-2";
  const arrowStyle = "ml-0";

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-[#ece1f7] p-6">
      {/* ...search/filter area omitted for brevity (unchanged)... */}

      {/* Table area */}
      <div className="overflow-x-auto w-full">
        <table
          className="min-w-full text-[15px] border-separate"
          style={{ borderSpacing: 0 }}
        >
          <thead>
            <tr className="bg-[#f6eeff] text-[#7e32e2]">
              <th className="py-3 px-4 font-semibold text-center rounded-tl-xl">
                ลำดับ
              </th>
              <th className="py-3 px-4 font-semibold text-left">
                รายชื่อ (100 รายการ)
              </th>
              <th className="py-3 px-4 font-semibold text-center">
                เลขประจำตัวประชาชน
              </th>
              <th className="py-3 px-4 font-semibold text-center">
                ระดับตำแหน่ง
              </th>
              <th className="py-3 px-4 font-semibold text-center rounded-tr-xl">
                จัดการข้อมูล
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((row, idx) => (
              <tr
                key={idx}
                className={`${
                  idx % 2 === 0 ? "bg-white" : "bg-[#f9f6ff]"
                } hover:bg-[#f0ebff] transition-colors duration-150`}
              >
                <td className="py-3 px-4 text-center align-middle font-medium">
                  {(currentPage - 1) * itemsPerPage + idx + 1}
                </td>
                <td className="py-3 px-4 align-middle">{row.name}</td>
                <td className="py-3 px-4 text-center align-middle">
                  {row.cid}
                </td>
                <td className="py-3 px-4 text-center align-middle">
                  {row.position}
                </td>
                <td className="py-3 px-4 text-center align-middle">
                  <ButtonService
                    type="button"
                    variant="secondary"
                    icon={<Eye />}
                  >
                    <span>ดูรายละเอียด</span>
                  </ButtonService>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Responsive Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />
    </div>
  );
};

export default UserListComp;
