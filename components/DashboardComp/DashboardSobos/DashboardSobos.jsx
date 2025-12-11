import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import InputService from "@services/inputService/inputService";
import ButtonService from "@services/buttonService/buttonService";
import CustomSelect from "@services/customSelectService/customSelectService";
import {
  Users,
  UserCheck,
  ClipboardList,
  BarChart2,
  Activity,
  FileCheck,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Search,
  MapPin,
  Calendar,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import MapThailandComponent from "@services/MapThailand/MapThailandService";
import { HEALTHZONE_PROVINCES } from "@utils/healthzone-province-data";
import reportsMapService from "@services/reportsMapService";
// ปี options (mock)
const YEARS = [
  { label: "2568", value: "2568" },
  { label: "2567", value: "2567" },
  { label: "2566", value: "2566" },
];

// เดือน options (mock)
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

// สำหรับ week
const WEEKS = [
  { label: "สัปดาห์ 1 (2/6/68-8/6/68)", value: "week1" },
  { label: "สัปดาห์ 2 (9/6/68-15/6/68)", value: "week2" },
  { label: "สัปดาห์ 3 (16/6/68-22/6/68)", value: "week3" },
  { label: "สัปดาห์ 4 (23/6/68-27/6/68)", value: "week4" },
];

// เขตสุขภาพ options
const ZONES = HEALTHZONE_PROVINCES.map((zone) => ({
  label: zone.zoneName,
  value: `zone${zone.zone}`,
}));
ZONES.unshift({ label: "ทั้งหมด", value: "" });

// อำเภอ mock data - เพิ่มข้อมูลนี้เพื่อแก้ไขปัญหา DISTRICTS is not defined
// const DISTRICTS = [
//   { label: "เลือกอำเภอ", value: "" },
//   { label: "เมือง", value: "เมือง" },
//   { label: "คลองหลวง", value: "คลองหลวง" },
//   { label: "บางกรวย", value: "บางกรวย" },
//   { label: "บางใหญ่", value: "บางใหญ่" },
//   { label: "ปากเกร็ด", value: "ปากเกร็ด" },
// ];

// ตำบล mock data - เพิ่มข้อมูลนี้เพื่อแก้ไขปัญหา SUBDISTRICTS is not defined
// const SUBDISTRICTS = [
//   { label: "เลือกตำบล", value: "" },
//   { label: "บางกระสอ", value: "บางกระสอ" },
//   { label: "ตลาดขวัญ", value: "ตลาดขวัญ" },
//   { label: "บางเขน", value: "บางเขน" },
//   { label: "ท่าทราย", value: "ท่าทราย" },
//   { label: "บางกร่าง", value: "บางกร่าง" },
// ];

// MOCK SUMMARY_CARDS (เดิม)
const SUMMARY_CARDS = [
  {
    label: "จำนวนผู้ใช้งานแอปพลิเคชัน อสม.",
    value: "1,111,674",
    icon: <Users className="w-6 h-6 text-purple-400" />,
    report: true,
  },
  {
    label: "จำนวน อสม. ทั่วประเทศ",
    value: "1,070,055",
    icon: <UserCheck className="w-6 h-6 text-purple-400" />,
    report: true,
  },
  {
    label: "จำนวนการส่งรายงาน อสม. 1",
    value: "600,391",
    icon: <ClipboardList className="w-6 h-6 text-purple-400" />,
    report: true,
  },
  {
    label: "จำนวนรายงาน คุ้มกันสุขภาพ",
    value: "600,391",
    icon: <BarChart2 className="w-6 h-6 text-purple-400" />,
    report: true,
  },
  {
    label: "จำนวนรายงานแบบฟอร์มลูกน้ำยุงลาย อสม.",
    value: "600,391",
    icon: <FileText className="w-6 h-6 text-purple-400" />,
    report: true,
  },
  {
    label: "จำนวนรายงานคัดกรองผู้สูงอายุในชุมชน",
    value: "600,391",
    icon: <UserCheck className="w-6 h-6 text-purple-400" />,
    report: true,
  },
  {
    label: "จำนวนรายงาน NCDs",
    value: "600,391",
    icon: <Activity className="w-6 h-6 text-purple-400" />,
    report: true,
  },
  {
    label: "จำนวนรายงานหญิงตั้งครรภ์",
    value: "600,391",
    icon: <FileCheck className="w-6 h-6 text-purple-400" />,
    report: true,
  },
];
// REPORT_TABS (ต้องมีครบ 13 เขตข้อมูล ถ้าไม่มี ให้ใส่ 0)
const createPie13 = (pieArr) => {
  const pie = [];
  for (let i = 1; i <= 13; i++) {
    const found = pieArr.find((p) => p.name === `เขตสุขภาพที่ ${i}`);
    pie.push({
      name: `เขตสุขภาพที่ ${i}`,
      value: found ? found.value : 0,
      color: found ? found.color : "#E5E5E5", // สีเทา ถ้าไม่มีข้อมูล
    });
  }
  return pie;
};

const createTable13 = (tableArr) => {
  const table = [];
  for (let i = 1; i <= 13; i++) {
    const found = tableArr.find((t) => t.zone === `เขตสุขภาพที่ ${i}`);
    table.push({
      zone: `เขตสุขภาพที่ ${i}`,
      total: found ? found.total : 0,
      submitted: found ? found.submitted : 0,
      percent: found ? found.percent : 0,
    });
  }
  return table;
};
const REPORT_TABS = [
  {
    name: "รายงาน อสม. 1",
    pie: createPie13([
      { name: "เขตสุขภาพที่ 1", value: 92000, color: "#6E28B7" },
      { name: "เขตสุขภาพที่ 2", value: 80000, color: "#4B61CF" },
      { name: "เขตสุขภาพที่ 3", value: 70000, color: "#5D86E7" },
      { name: "เขตสุขภาพที่ 4", value: 64000, color: "#4CA3DD" },
      { name: "เขตสุขภาพที่ 5", value: 76000, color: "#7C83E1" },
      { name: "เขตสุขภาพที่ 6", value: 72000, color: "#A682FF" },
      { name: "เขตสุขภาพที่ 7", value: 102000, color: "#E0AAFF" },
      { name: "เขตสุขภาพที่ 8", value: 104000, color: "#FFB3E6" },
      { name: "เขตสุขภาพที่ 9", value: 125000, color: "#FF9CEE" },
      { name: "เขตสุขภาพที่ 10", value: 85000, color: "#FFB7B2" },
      { name: "เขตสุขภาพที่ 11", value: 63000, color: "#FFDAC1" },
      { name: "เขตสุขภาพที่ 12", value: 75000, color: "#FFB347" },
      { name: "เขตสุขภาพที่ 13", value: 1000, color: "#EB6383" },
    ]),
    table: createTable13([
      { zone: "เขตสุขภาพที่ 1", total: 100000, submitted: 92000, percent: 92 },
      { zone: "เขตสุขภาพที่ 2", total: 90000, submitted: 80000, percent: 89 },
      { zone: "เขตสุขภาพที่ 3", total: 70000, submitted: 70000, percent: 100 },
      { zone: "เขตสุขภาพที่ 4", total: 80000, submitted: 64000, percent: 80 },
      { zone: "เขตสุขภาพที่ 5", total: 85000, submitted: 76000, percent: 89 },
      { zone: "เขตสุขภาพที่ 6", total: 75000, submitted: 72000, percent: 96 },
      { zone: "เขตสุขภาพที่ 7", total: 110000, submitted: 102000, percent: 93 },
      { zone: "เขตสุขภาพที่ 8", total: 115000, submitted: 104000, percent: 90 },
      { zone: "เขตสุขภาพที่ 9", total: 135000, submitted: 125000, percent: 93 },
      { zone: "เขตสุขภาพที่ 10", total: 95000, submitted: 85000, percent: 89 },
      { zone: "เขตสุขภาพที่ 11", total: 68000, submitted: 63000, percent: 93 },
      { zone: "เขตสุขภาพที่ 12", total: 80000, submitted: 75000, percent: 94 },
      { zone: "เขตสุขภาพที่ 13", total: 1200, submitted: 1000, percent: 83 },
    ]),
    summary: "600,391",
    legendTitle: "ข้อมูล รายงาน อสม.1",
  },
  {
    name: "รายงานลูกน้ำยุงลาย",
    pie: createPie13([
      { name: "เขตสุขภาพที่ 1", value: 132000, color: "#6E28B7" },
      { name: "เขตสุขภาพที่ 2", value: 70000, color: "#4B61CF" },
      { name: "เขตสุขภาพที่ 3", value: 60000, color: "#5D86E7" },
      { name: "เขตสุขภาพที่ 4", value: 65000, color: "#4CA3DD" },
      { name: "เขตสุขภาพที่ 5", value: 75000, color: "#7C83E1" },
      { name: "เขตสุขภาพที่ 6", value: 72000, color: "#A682FF" },
      { name: "เขตสุขภาพที่ 7", value: 102000, color: "#E0AAFF" },
      { name: "เขตสุขภาพที่ 8", value: 104000, color: "#FFB3E6" },
      { name: "เขตสุขภาพที่ 9", value: 125000, color: "#FF9CEE" },
      { name: "เขตสุขภาพที่ 10", value: 85000, color: "#FFB7B2" },
      { name: "เขตสุขภาพที่ 11", value: 63000, color: "#FFDAC1" },
      { name: "เขตสุขภาพที่ 12", value: 75000, color: "#FFB347" },
      { name: "เขตสุขภาพที่ 13", value: 1000, color: "#EB6383" },
    ]),
    table: createTable13([
      { zone: "เขตสุขภาพที่ 1", total: 140000, submitted: 132000, percent: 94 },
      { zone: "เขตสุขภาพที่ 2", total: 75000, submitted: 70000, percent: 93 },
      { zone: "เขตสุขภาพที่ 3", total: 60000, submitted: 60000, percent: 100 },
      { zone: "เขตสุขภาพที่ 4", total: 80000, submitted: 65000, percent: 81 },
      { zone: "เขตสุขภาพที่ 5", total: 80000, submitted: 75000, percent: 93 },
      { zone: "เขตสุขภาพที่ 6", total: 75000, submitted: 72000, percent: 96 },
      { zone: "เขตสุขภาพที่ 7", total: 120000, submitted: 102000, percent: 84 },
      { zone: "เขตสุขภาพที่ 8", total: 120000, submitted: 104000, percent: 87 },
      { zone: "เขตสุขภาพที่ 9", total: 140000, submitted: 125000, percent: 89 },
      { zone: "เขตสุขภาพที่ 10", total: 100000, submitted: 85000, percent: 85 },
      { zone: "เขตสุขภาพที่ 11", total: 65000, submitted: 63000, percent: 97 },
      { zone: "เขตสุขภาพที่ 12", total: 75000, submitted: 63000, percent: 84 },
      { zone: "เขตสุขภาพที่ 13", total: 2000, submitted: 1000, percent: 50 },
    ]),
    summary: "600,391",
    legendTitle: "ข้อมูล รายงานลูกน้ำยุงลาย",
  },
  {
    name: "รายงานบันทึกสุขภาพ อสม.",
    pie: createPie13([
      { name: "เขตสุขภาพที่ 1", value: 132000, color: "#6E28B7" },
      { name: "เขตสุขภาพที่ 2", value: 71000, color: "#4B61CF" },
      { name: "เขตสุขภาพที่ 3", value: 60000, color: "#5D86E7" },
      { name: "เขตสุขภาพที่ 4", value: 65000, color: "#4CA3DD" },
    ]),
    table: createTable13([
      { zone: "เขตสุขภาพที่ 1", total: 140000, submitted: 132000, percent: 94 },
      { zone: "เขตสุขภาพที่ 2", total: 75000, submitted: 71000, percent: 95 },
      { zone: "เขตสุขภาพที่ 3", total: 60000, submitted: 60000, percent: 100 },
      { zone: "เขตสุขภาพที่ 4", total: 80000, submitted: 65000, percent: 81 },
    ]),
    summary: "400,000",
    legendTitle: "ข้อมูล รายงานบันทึกสุขภาพ อสม.",
  },
  {
    name: "รายงานผู้สูงอายุในชุมชน",
    pie: createPie13([
      { name: "เขตสุขภาพที่ 1", value: 52000, color: "#6E28B7" },
      { name: "เขตสุขภาพที่ 2", value: 35000, color: "#4B61CF" },
      { name: "เขตสุขภาพที่ 3", value: 65000, color: "#5D86E7" },
      { name: "เขตสุขภาพที่ 4", value: 60000, color: "#4CA3DD" },
    ]),
    table: createTable13([
      { zone: "เขตสุขภาพที่ 1", total: 54000, submitted: 52000, percent: 96 },
      { zone: "เขตสุขภาพที่ 2", total: 37000, submitted: 35000, percent: 95 },
      { zone: "เขตสุขภาพที่ 3", total: 66000, submitted: 65000, percent: 99 },
      { zone: "เขตสุขภาพที่ 4", total: 61000, submitted: 60000, percent: 98 },
    ]),
    summary: "212,000",
    legendTitle: "ข้อมูล รายงานผู้สูงอายุในชุมชน",
  },
  {
    name: "รายงาน NCDs",
    pie: createPie13([
      { name: "เขตสุขภาพที่ 1", value: 76000, color: "#6E28B7" },
      { name: "เขตสุขภาพที่ 2", value: 57000, color: "#4B61CF" },
      { name: "เขตสุขภาพที่ 3", value: 43000, color: "#5D86E7" },
      { name: "เขตสุขภาพที่ 4", value: 80000, color: "#4CA3DD" },
    ]),
    table: createTable13([
      { zone: "เขตสุขภาพที่ 1", total: 80000, submitted: 76000, percent: 95 },
      { zone: "เขตสุขภาพที่ 2", total: 60000, submitted: 57000, percent: 95 },
      { zone: "เขตสุขภาพที่ 3", total: 44000, submitted: 43000, percent: 98 },
      { zone: "เขตสุขภาพที่ 4", total: 82000, submitted: 80000, percent: 97 },
    ]),
    summary: "256,000",
    legendTitle: "ข้อมูล รายงาน NCDs",
  },
  {
    name: "รายงานหญิงตั้งครรภ์",
    pie: createPie13([
      { name: "เขตสุขภาพที่ 1", value: 16000, color: "#6E28B7" },
      { name: "เขตสุขภาพที่ 2", value: 17000, color: "#4B61CF" },
      { name: "เขตสุขภาพที่ 3", value: 15500, color: "#5D86E7" },
      { name: "เขตสุขภาพที่ 4", value: 18000, color: "#4CA3DD" },
    ]),
    table: createTable13([
      { zone: "เขตสุขภาพที่ 1", total: 17000, submitted: 16000, percent: 94 },
      { zone: "เขตสุขภาพที่ 2", total: 18000, submitted: 17000, percent: 94 },
      { zone: "เขตสุขภาพที่ 3", total: 16000, submitted: 15500, percent: 97 },
      { zone: "เขตสุขภาพที่ 4", total: 19000, submitted: 18000, percent: 95 },
    ]),
    summary: "66,500",
    legendTitle: "ข้อมูล รายงานหญิงตั้งครรภ์",
  },
];

const PER_PAGE_OPTIONS = [
  { label: "5", value: 5 },
  { label: "10", value: 10 },
  { label: "20", value: 20 },
  { label: "50", value: 50 },
];

// Table Pagination Component
const TableWithPagination = ({
  data = [],
  defaultItemsPerPage = 5,
  className = "",
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  // Reset to page 1 when items per page changes
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // คำนวณข้อมูลสำหรับแต่ละหน้า
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  // คำนวณจำนวนหน้าทั้งหมด
  const totalPages = Math.ceil(data.length / itemsPerPage);

  // สร้างอาร์เรย์ของหมายเลขหน้า
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, data.length);

  return (
    <div className={`w-full ${className}`}>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-[14px]">
          <thead>
            <tr className="bg-[#f6eeff] text-[#7e32e2]">
              <th className="py-3 px-4 font-semibold text-center rounded-tl-xl">
                ลำดับ
              </th>
              <th className="py-3 px-4 font-semibold text-center">จังหวัด</th>
              <th className="py-3 px-4 font-semibold text-center">
                จำนวน อสม.
              </th>
              <th className="py-3 px-4 font-semibold text-center">
                จำนวนที่ส่งรายงาน
              </th>
              <th className="py-3 px-4 font-semibold text-center rounded-tr-xl">
                ร้อยละ
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr
                  key={row.province || idx}
                  className={`${
                    idx % 2 === 0 ? "bg-white" : "bg-[#f9f6ff]"
                  } hover:bg-[#f0ebff] transition-colors duration-200`}
                >
                  <td className="py-3 px-4 text-center align-middle font-medium">
                    {startItem + idx}
                  </td>
                  <td className="py-3 px-4 text-center align-middle">
                    {row.province}
                  </td>
                  <td className="py-3 px-4 text-center align-middle font-medium text-[#7e32e2]">
                    {row.total?.toLocaleString() ?? "0"}
                  </td>
                  <td className="py-3 px-4 text-center align-middle font-medium text-[#7e32e2]">
                    {row.submitted?.toLocaleString() ?? "0"}
                  </td>
                  <td className="py-3 px-4 text-center align-middle">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        row.percent >= 90
                          ? "bg-green-100 text-green-800"
                          : row.percent >= 70
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {row.percent ?? 0}%
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-8 text-center text-gray-500">
                  ไม่มีข้อมูลที่จะแสดง
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Items per page selector & Total count & Pagination - ทั้งหมดในแถวเดียว */}
      <div className="flex flex-row items-center justify-between gap-3 mt-6 pt-6 border-t-2 border-purple-100 flex-wrap">
        {/* Left: Items per page selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
            แสดง
          </span>
          <div className="relative">
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="appearance-none bg-gradient-to-r from-purple-50/80 to-violet-50/80 border-2 border-purple-200 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#7e32e2] cursor-pointer hover:border-purple-300 hover:shadow-sm transition-all duration-200 min-w-[65px]"
            >
              {PER_PAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#7e32e2] pointer-events-none"
            />
          </div>
          <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
            รายการ/หน้า
          </span>
        </div>

        {/* Center: Total count */}
        <div className="text-xs font-medium text-gray-700 whitespace-nowrap">
          รวม{" "}
          <span className="font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
            {data.length}
          </span>{" "}
          รายการ
        </div>

        {/* Right: Pagination controls */}
        <div className="flex items-center gap-2">
          {/* Info text */}
          {totalPages > 1 && (
            <div className="text-xs font-medium text-gray-700 bg-gradient-to-r from-purple-50 to-white px-3 py-1.5 rounded-lg border border-purple-100 whitespace-nowrap">
              <span className="font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                {startItem}
              </span>
              -
              <span className="font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                {endItem}
              </span>
            </div>
          )}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 bg-white px-1.5 py-1.5 rounded-lg border border-purple-100 shadow-sm">
              {/* First page */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className={`p-1.5 rounded-md transition-all duration-200 ${
                  currentPage === 1
                    ? "text-gray-300 cursor-not-allowed bg-gray-50"
                    : "text-purple-600 hover:bg-gradient-to-r hover:from-purple-600 hover:to-purple-500 hover:text-white hover:scale-105 hover:shadow-md"
                }`}
                title="หน้าแรก"
              >
                <ChevronsLeft size={16} />
              </button>

              {/* Previous page */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-1.5 rounded-md transition-all duration-200 ${
                  currentPage === 1
                    ? "text-gray-300 cursor-not-allowed bg-gray-50"
                    : "text-purple-600 hover:bg-gradient-to-r hover:from-purple-600 hover:to-purple-500 hover:text-white hover:scale-105 hover:shadow-md"
                }`}
                title="หน้าก่อนหน้า"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1 mx-0.5">
                {getPageNumbers().map((page, idx) => (
                  <React.Fragment key={idx}>
                    {page === "..." ? (
                      <span className="px-2 py-1 text-gray-400 font-semibold text-xs">
                        ...
                      </span>
                    ) : (
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`min-w-[32px] h-8 rounded-lg font-semibold text-xs transition-all duration-200 ${
                          currentPage === page
                            ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md scale-105"
                            : "text-purple-600 hover:bg-gradient-to-r hover:from-purple-100 hover:to-purple-50 hover:scale-105 border border-transparent hover:border-purple-200"
                        }`}
                      >
                        {page}
                      </button>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Next page */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-1.5 rounded-md transition-all duration-200 ${
                  currentPage === totalPages
                    ? "text-gray-300 cursor-not-allowed bg-gray-50"
                    : "text-purple-600 hover:bg-gradient-to-r hover:from-purple-600 hover:to-purple-500 hover:text-white hover:scale-105 hover:shadow-md"
                }`}
                title="หน้าถัดไป"
              >
                <ChevronRight size={16} />
              </button>

              {/* Last page */}
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className={`p-1.5 rounded-md transition-all duration-200 ${
                  currentPage === totalPages
                    ? "text-gray-300 cursor-not-allowed bg-gray-50"
                    : "text-purple-600 hover:bg-gradient-to-r hover:from-purple-600 hover:to-purple-500 hover:text-white hover:scale-105 hover:shadow-md"
                }`}
                title="หน้าสุดท้าย"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
const THAI_PROVINCE_DATA_URL =
  "https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province_with_amphure_tambon.json";

const DashboardSobos = () => {
  const [searchType, setSearchType] = useState("year");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [week, setWeek] = useState("");
  const [zone, setZone] = useState(""); // zone1 ... zone13
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [subdistrict, setSubdistrict] = useState("");
  const [tabIdx, setTabIdx] = useState(0); // default รายงาน อสม. 1
  // const [mapService, setMapService] = useState(null); // เก็บ instance ของ MapThailandService
  const [filteredTable, setFilteredTable] = useState(null);
  const [filteredPie, setFilteredPie] = useState(null);
  const [provinceData, setProvinceData] = useState([]);

  // เพิ่ม state สำหรับข้อมูลจาก API
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // โหลดข้อมูลจังหวัด/อำเภอ/ตำบล จาก API ครั้งเดียว
  useEffect(() => {
    fetch(THAI_PROVINCE_DATA_URL)
      .then((res) => res.json())
      .then(setProvinceData)
      .catch(() => setProvinceData([]));
  }, []);

  const provinceOptions = useMemo(() => {
    if (!zone) return [{ label: "เลือกจังหวัด", value: "" }];
    if (!provinceData.length) return [{ label: "เลือกจังหวัด", value: "" }];

    const zoneObj = HEALTHZONE_PROVINCES.find(
      (z) => z.zone === Number(zone.replace("zone", ""))
    );
    if (!zoneObj) return [{ label: "เลือกจังหวัด", value: "" }];

    // ใช้ name_th ในทุกจุด
    const zoneProvinces = zoneObj.provinces.map((prov) => prov.trim());

    const options = provinceData
      .filter((p) => zoneProvinces.includes(p.name_th.trim()))
      .map((p) => ({
        label: p.name_th,
        value: p.name_th,
      }));

    return [{ label: "เลือกจังหวัด", value: "" }, ...options];
  }, [provinceData, zone]);

  const districtOptions = useMemo(() => {
    if (!province) return [{ label: "เลือกอำเภอ", value: "" }];
    const foundProv = provinceData.find((p) => p.name_th === province);
    if (!foundProv) return [{ label: "เลือกอำเภอ", value: "" }];

    return [
      { label: "เลือกอำเภอ", value: "" },
      ...foundProv.amphure.map((a) => ({
        label: a.name_th,
        value: a.name_th,
      })),
    ];
  }, [province, provinceData]);

  const subdistrictOptions = useMemo(() => {
    if (!province || !district) return [{ label: "เลือกตำบล", value: "" }];
    const foundProv = provinceData.find((p) => p.name_th === province);
    if (!foundProv) return [{ label: "เลือกตำบล", value: "" }];
    const foundDist = foundProv.amphure.find((a) => a.name_th === district);
    if (!foundDist) return [{ label: "เลือกตำบล", value: "" }];

    return [
      { label: "เลือกตำบล", value: "" },
      ...foundDist.tambon.map((t) => ({
        label: t.name_th,
        value: t.name_th,
      })),
    ];
  }, [province, district, provinceData]);

  // ล้างข้อมูลการค้นหา
  const handleClear = () => {
    setYear("");
    setMonth("");
    setWeek("");
    setZone("");
    setProvince("");
    setDistrict("");
    setSubdistrict("");
    setFilteredTable(null);
  };

  // ฟังก์ชันดึงข้อมูลจาก API
  const fetchReportsData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const filters = {};

      // แปลง zone เป็น province_code ถ้ามีการเลือกเขต
      if (province) {
        // หาจังหวัดจาก provinceData
        const foundProv = provinceData.find((p) => p.name_th === province);
        if (foundProv) {
          filters.province_code = foundProv.id.toString();
        }
      }

      if (district) {
        const foundProv = provinceData.find((p) => p.name_th === province);
        if (foundProv) {
          const foundDist = foundProv.amphure.find((a) => a.name_th === district);
          if (foundDist) {
            filters.district_code = foundDist.id.toString();
          }
        }
      }

      if (subdistrict) {
        const foundProv = provinceData.find((p) => p.name_th === province);
        if (foundProv) {
          const foundDist = foundProv.amphure.find((a) => a.name_th === district);
          if (foundDist) {
            const foundSub = foundDist.tambon.find((t) => t.name_th === subdistrict);
            if (foundSub) {
              filters.subdistrict_code = foundSub.id.toString();
            }
          }
        }
      }

      // เพิ่ม filter ตามช่วงเวลา
      if (year && month) {
        const buddhistYear = parseInt(year);
        const gregorianYear = buddhistYear - 543;
        const monthNum = parseInt(month);

        const startDate = new Date(gregorianYear, monthNum - 1, 1);
        const endDate = new Date(gregorianYear, monthNum, 0, 23, 59, 59);

        filters.start_date = startDate.toISOString();
        filters.end_date = endDate.toISOString();
      } else if (year) {
        const buddhistYear = parseInt(year);
        const gregorianYear = buddhistYear - 543;

        const startDate = new Date(gregorianYear, 0, 1);
        const endDate = new Date(gregorianYear, 11, 31, 23, 59, 59);

        filters.start_date = startDate.toISOString();
        filters.end_date = endDate.toISOString();
      }

      filters.limit = 10000;

      const data = await reportsMapService.getReportsMapData(filters);
      setReportsData(data);
      console.log("📊 Reports data from API:", data);

    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  }, [province, district, subdistrict, year, month, provinceData]);

  // โหลดข้อมูลครั้งแรก
  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  // กดค้นหา
  const handleSearch = useCallback(() => {
    fetchReportsData();

    // เก็บ logic เดิมไว้สำหรับ fallback
    let table = REPORT_TABS[tabIdx].table;
    let pie = REPORT_TABS[tabIdx].pie;

    let selectedZoneNum = null;
    if (zone && zone.startsWith("zone")) {
      selectedZoneNum = parseInt(zone.replace("zone", ""));
      table = table.filter(
        (row) => row.zone === `เขตสุขภาพที่ ${selectedZoneNum}`
      );
      // pie: set value=0 for other zones
      pie = pie.map((item) =>
        item.name === `เขตสุขภาพที่ ${selectedZoneNum}`
          ? item
          : { ...item, value: 0 }
      );
    }

    // กรองตาม province
    let filtered = [];
    if (province) {
      filtered = table
        .map((row) => {
          const zoneNum = parseInt(row.zone.replace("เขตสุขภาพที่ ", ""));
          const zoneObj = HEALTHZONE_PROVINCES.find((z) => z.zone === zoneNum);
          if (!zoneObj || !zoneObj.provinces.includes(province)) return null;
          return {
            ...row,
            province,
          };
        })
        .filter(Boolean);
    } else {
      filtered = table.flatMap((row) => {
        const zoneNum = parseInt(row.zone.replace("เขตสุขภาพที่ ", ""));
        const zoneObj = HEALTHZONE_PROVINCES.find((z) => z.zone === zoneNum);
        if (!zoneObj) return [];
        return zoneObj.provinces.map((prov) => ({
          ...row,
          province: prov,
        }));
      });
    }

    // pie13: always 13 zones, set value=0 for missing zones
    // แต่ต้องคงสีจาก original tab ไว้
    const originalPie = REPORT_TABS[tabIdx].pie;
    let pie13 = [];
    for (let i = 1; i <= 13; i++) {
      const found = pie.find((p) => p.name === `เขตสุขภาพที่ ${i}`);
      const original = originalPie.find((p) => p.name === `เขตสุขภาพที่ ${i}`);

      pie13.push(
        found
          ? found
          : {
              name: `เขตสุขภาพที่ ${i}`,
              value: 0,
              color: original?.color || "#E5E5E5", // ใช้สีจาก original ถ้ามี
            }
      );
    }
    setFilteredTable(filtered);
    setFilteredPie(pie13);
  }, [tabIdx, zone, province]);

  // Handle province click on map
  const handleProvinceClick = useCallback(
    (data) => {
      setProvince(data.province);
      setZone(`zone${data.zone}`);
      handleSearch();
    },
    [handleSearch]
  );

  const currentTab = REPORT_TABS[tabIdx];

  const summaryTableData = useMemo(() => {
    if (filteredTable !== null) return filteredTable;
    let selectedZoneNum = 1;
    if (zone && zone.startsWith("zone"))
      selectedZoneNum = parseInt(zone.replace("zone", ""));
    const zoneObj = HEALTHZONE_PROVINCES.find(
      (z) => z.zone === selectedZoneNum
    );
    let zoneTable = [];
    if (zoneObj && currentTab.table) {
      zoneTable = zoneObj.provinces.map((prov) => {
        const found = currentTab.table.find(
          (t) => t.zone === `เขตสุขภาพที่ ${selectedZoneNum}`
        );
        return {
          zone: `เขตสุขภาพที่ ${selectedZoneNum}`,
          province: prov,
          total: found?.total ?? 0,
          submitted: found?.submitted ?? 0,
          percent: found?.percent ?? 0,
        };
      });
    }
    return zoneTable;
  }, [zone, currentTab, filteredTable]);

  const chartPieData = useMemo(() => {
    if (filteredPie !== null) return filteredPie;
    // default: ครบ 13 เขต
    return currentTab.pie;
  }, [currentTab, filteredPie]);

  // Pie chart center value (sum ของ pie ที่เหลือ)
  const chartSummaryValue = useMemo(() => {
    return chartPieData
      .reduce((sum, p) => sum + (p.value || 0), 0)
      .toLocaleString();
  }, [chartPieData]);

  const mapCustomOptions = useMemo(() => {
    // ใช้ chartPieData ซึ่งมี value = 0 สำหรับเขตอื่น
    const zoneDataMap = {};
    chartPieData.forEach((item) => {
      const zoneNum = parseInt(item.name.match(/\d+/)?.[0] || "0");
      zoneDataMap[zoneNum] = {
        value: item.value,
        // ใช้สีจาก item.color เสมอ ไม่ว่า value จะเป็น 0 หรือไม่
        color: item.color,
        percent: (
          (item.value /
            (chartPieData.reduce((sum, p) => sum + p.value, 0) || 1)) *
          100
        ).toFixed(1),
      };
    });

    return {
      tooltip: {
        formatter: function () {
          if (this.point && typeof this.point.value !== "undefined") {
            const zoneNumber = this.point.value || 0;
            const zoneData = zoneDataMap[zoneNumber];
            if (zoneData) {
              return `
              <div style="padding: 8px;">
                <b>${this.point.name}</b><br/>
                <span style="color: ${
                  zoneData.color
                };">●</span> เขตสุขภาพ: ${zoneNumber}<br/>
                จำนวน: <b>${zoneData.value.toLocaleString()}</b><br/>
                สัดส่วน: <b>${zoneData.percent}%</b>
              </div>
            `;
            } else {
              return `<b>${this.point.name}</b><br/>เขตสุขภาพ: ${
                zoneNumber || "-"
              }`;
            }
          }
          return false;
        },
        useHTML: true,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "#7e32e2",
        borderRadius: 8,
        borderWidth: 1,
        shadow: true,
      },
      colorAxis: {
        min: 0,
        max: 13,
        dataClasses: chartPieData
          .map((item) => {
            const zoneNum = parseInt(item.name.match(/\d+/)?.[0] || "0");
            // ใช้สีจาก item.color โดยตรง ไม่เช็ค value
            return {
              from: zoneNum,
              to: zoneNum,
              color: item.color,
              name: item.name,
            };
          })
          .concat([{ from: 0, to: 0, color: "#E5E5E5", name: "ไม่มีข้อมูล" }]),
      },
      plotOptions: {
        series: {
          borderColor: "#ffffff",
          borderWidth: 2,
          states: {
            hover: {
              color: "#E6E6E6",
              borderColor: "#7e32e2",
              borderWidth: 3,
            },
          },
          point: {
            events: {
              click: function () {
                const provinceName = this.name;
                const zoneNumber = this.value;
                const zoneData = zoneDataMap[zoneNumber];
                const clickData = {
                  province: provinceName,
                  zone: zoneNumber,
                  color: zoneData?.color || "#E5E5E5",
                  value: zoneData?.value || 0,
                  percent: zoneData?.percent || "0",
                };
                handleProvinceClick(clickData);
              },
            },
          },
        },
      },
    };
  }, [chartPieData, handleProvinceClick]);
  return (
    <div className="max-w-full mb-8">
      {/* Header Section with Gradient Background */}
      <div className="relative mb-6 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7e32e2] via-[#9333ea] to-[#a855f7]" />
        <div className="absolute inset-0 bg-white/5" />
        <div className="relative p-6 sm:p-8">
          <div className="text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <BarChart2 size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  Dashboard ระบบรายงาน อสม.
                </h1>
                <p className="text-white/80">
                  ข้อมูลสรุปรายงานต่างๆ ของ อสม. ทั่วประเทศ
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white via-purple-50/30 to-white rounded-3xl shadow-xl border border-purple-100/50 p-6 md:p-8">
        <div className="flex flex-col gap-5">
          {/* รูปแบบการค้นหา */}
          <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-5">
            <div className="flex flex-wrap gap-x-6 gap-y-3 items-center">
              <label className="font-bold text-purple-600 text-base flex items-center gap-2">
                <Search className="w-5 h-5" />
                รูปแบบการค้นหา :
              </label>
              <div className="flex gap-3 items-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    className="hidden peer"
                    checked={searchType === "year"}
                    onChange={() => setSearchType("year")}
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
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    className="hidden peer"
                    checked={searchType === "budget"}
                    onChange={() => setSearchType("budget")}
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
            </div>

            {/* ฟิลด์ ปี / เดือน / สัปดาห์ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CustomSelect
                label="ปี"
                options={YEARS}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="เลือกปี"
                icon={Calendar}
              />
              <CustomSelect
                label="เดือน"
                options={MONTHS}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="เลือกเดือน"
                icon={Calendar}
              />
              <CustomSelect
                label="สัปดาห์"
                options={WEEKS}
                value={week}
                onChange={(e) => setWeek(e.target.value)}
                placeholder="เลือกสัปดาห์"
                icon={Calendar}
              />
            </div>

            {/* ฟิลด์ เขตสุขภาพ จังหวัด อำเภอ ตำบล */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
              <CustomSelect
                label="เขตสุขภาพ"
                options={ZONES}
                value={zone}
                onChange={(e) => {
                  setZone(e.target.value);
                  // เมื่อเปลี่ยนเขต ให้ reset จังหวัด อำเภอ ตำบล
                  setProvince("");
                  setDistrict("");
                  setSubdistrict("");
                }}
                placeholder="เลือกเขตสุขภาพ"
                icon={MapPin}
              />
              <CustomSelect
                label="จังหวัด"
                options={provinceOptions}
                value={province}
                onChange={(e) => {
                  setProvince(e.target.value);
                  // เมื่อเปลี่ยนจังหวัด ให้ reset อำเภอ ตำบล
                  setDistrict("");
                  setSubdistrict("");
                }}
                placeholder="เลือกจังหวัด"
                icon={MapPin}
                disabled={!zone}
              />
              <CustomSelect
                label="อำเภอ"
                options={districtOptions}
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setSubdistrict("");
                }}
                placeholder="เลือกอำเภอ"
                icon={MapPin}
                disabled={!province}
              />
              <CustomSelect
                label="ตำบล"
                options={subdistrictOptions}
                value={subdistrict}
                onChange={(e) => setSubdistrict(e.target.value)}
                placeholder="เลือกตำบล"
                icon={MapPin}
                disabled={!district}
              />
            </div>

            {/* ปุ่มค้นหา/ล้าง (ดีไซน์ตามรูป) */}
            <div className="flex flex-col md:flex-row gap-3 mt-2">
              <ButtonService
                type="button"
                variant="primary"
                className="w-full md:w-fit flex-1 h-12 text-[18px] bg-[#7e32e2] hover:bg-[#6c28c8] border-none shadow-none text-white"
                onClick={handleSearch}
                icon={<Search className="w-5 h-5 mr-2 text-white" />}
              >
                ค้นหา
              </ButtonService>
              <ButtonService
                type="button"
                variant="secondary"
                className="w-full md:w-fit flex-1 h-12 text-[18px] bg-white border border-[#7e32e2] text-[#7e32e2] hover:bg-[#f6eeff] shadow-none"
                onClick={handleClear}
              >
                ล้างข้อมูลการค้นหา
              </ButtonService>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mt-8 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        )}

        {/* Responsive summary cards - ใช้ข้อมูลจาก API */}
        {!loading && reportsData && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-purple-600 mb-5 flex items-center gap-2">
              <BarChart2 className="w-6 h-6" />
              ข้อมูลสรุป
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              {/* การ์ดรวมทั้งหมด */}
              <div className="group relative flex flex-col justify-between bg-gradient-to-br from-white to-purple-50/30 rounded-2xl shadow-md hover:shadow-2xl border border-purple-100 p-5 min-h-[130px] transition-all duration-300 hover:scale-105 hover:border-purple-300 cursor-pointer overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-200/20 to-transparent rounded-bl-full"></div>
                <div className="flex items-start gap-3 relative z-10">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[13px] font-semibold text-gray-700 line-clamp-2 leading-tight pt-1">
                    รวมรายงานทั้งหมด
                  </span>
                </div>
                <div className="mt-4 flex items-end justify-between relative z-10">
                  <span className="text-[28px] font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                    {reportsData.total_reports.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* การ์ดตามประเภทรายงาน (แสดงทั้งหมด 7 ประเภท) */}
              {(() => {
                const reportTypeConfigs = [
                  { type: "report_osm1", label: "รายงาน อสม. 1", icon: FileText },
                  { type: "mosquito_larvae", label: "รายงานลูกน้ำยุงลาย", icon: FileText },
                  { type: "health_record", label: "แบบบันทึกสุขภาพ อสม.", icon: FileText },
                  { type: "ncds", label: "คัดกรอง NCDs", icon: FileText },
                  { type: "pregnant_women", label: "หญิงตั้งครรภ์/หลังคลอด", icon: FileText },
                  { type: "count_carbs", label: "อสม.ชวนนับคาร์บ", icon: FileText },
                  { type: "elderly_screening", label: "คัดกรองผู้สูงอายุ", icon: FileText },
                ];

                return reportTypeConfigs.map(({ type, label, icon: Icon }) => {
                  const count = reportsData.summary_by_type?.[type] || 0;

                  return (
                    <div
                      key={type}
                      className="group relative flex flex-col justify-between bg-gradient-to-br from-white to-purple-50/30 rounded-2xl shadow-md hover:shadow-2xl border border-purple-100 p-5 min-h-[130px] transition-all duration-300 hover:scale-105 hover:border-purple-300 cursor-pointer overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-200/20 to-transparent rounded-bl-full"></div>
                      <div className="flex items-start gap-3 relative z-10">
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-[13px] font-semibold text-gray-700 line-clamp-2 leading-tight pt-1">
                          {label}
                        </span>
                      </div>
                      <div className="mt-4 flex items-end justify-between relative z-10">
                        <span className="text-[28px] font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                          {count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* No Data State */}
        {!loading && !reportsData && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
            <Activity className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">ไม่มีข้อมูล</h3>
            <p className="text-gray-600">กรุณาตรวจสอบการเชื่อมต่อ API หรือลองค้นหาใหม่อีกครั้ง</p>
          </div>
        )}
        {/* Tabs section */}
        <div className="w-full mt-12 mb-6">
          <div className="bg-white rounded-2xl shadow-md border border-purple-100 p-2 inline-flex flex-wrap gap-2">
            {REPORT_TABS.map((tab, idx) => (
              <button
                key={tab.name}
                onClick={() => setTabIdx(idx)}
                className={`px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  tabIdx === idx
                    ? "text-white bg-gradient-to-r from-purple-600 to-purple-500 shadow-lg scale-105"
                    : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                }`}
                style={{ minWidth: 90 }}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main chart section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map: ให้สูงและยาว พร้อมข้อมูลที่เปลี่ยนตาม tab */}
          <div
            className="bg-gradient-to-br from-white to-purple-50/20 rounded-2xl shadow-lg hover:shadow-2xl border border-purple-100 p-6 flex flex-col transition-all duration-300"
            style={{ minHeight: 620 }}
          >
            <div className="font-bold text-purple-600 text-lg mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              แผนภาพ
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full" style={{ minHeight: 600 }}>
                <MapThailandComponent
                  height={600}
                  customOptions={mapCustomOptions}
                  onProvinceClick={handleProvinceClick}
                  onMapReady={(service) => {
                    console.log("Map service ready:", service);
                    // setMapService(service); // Commented out since mapService state is not used
                  }}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
          {/* ขวา: chart + legend stacked */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Pie Chart */}
            <div
              className="bg-gradient-to-br from-white to-purple-50/20 rounded-2xl shadow-lg hover:shadow-2xl border border-purple-100 p-6 flex flex-col transition-all duration-300"
              style={{ minHeight: 300 }}
            >
              <div className="font-bold text-purple-600 text-lg mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                สัดส่วนข้อมูล
              </div>
              <div className="flex flex-col items-center justify-center h-full relative">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={chartPieData} // <-- ใช้อันนี้แทน
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                      label={false}
                    >
                      {chartPieData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center value */}
                <div className="absolute top-0 left-0 flex flex-col items-center justify-center w-full h-full pointer-events-none">
                  <span className="mt-[15px] text-[28px] font-bold text-[#7e32e2]">
                    {chartSummaryValue}
                  </span>
                  <span className="text-[17px] font-medium text-[#7e32e2]">
                    รายการ
                  </span>
                </div>
              </div>
            </div>
            {/* Legend stacked under chart (ตามตัวอย่างรูป) */}
            <div
              className="bg-gradient-to-br from-white to-purple-50/20 rounded-2xl shadow-lg hover:shadow-2xl border border-purple-100 p-6 flex flex-col transition-all duration-300"
              style={{ minHeight: 240 }}
            >
              <div className="font-bold text-purple-600 text-lg mb-4 flex items-center gap-2">
                <BarChart2 className="w-5 h-5" />
                {currentTab.legendTitle}
              </div>
              <div className="w-full border-t border-purple-100 pt-5">
                <div className="flex flex-wrap gap-x-8 gap-y-2">
                  {/* ฝั่งซ้าย */}
                  <div className="flex flex-col gap-2 flex-1 min-w-[150px]">
                    {chartPieData.slice(0, 7).map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <span
                          className="inline-block w-3 h-3 rounded-full border border-white"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-[15px] font-semibold text-[#231d37]">
                          {item.name}
                        </span>
                        <span className="ml-1 text-[15px] text-[#7e32e2] font-bold">
                          {item.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* ฝั่งขวา */}
                  <div className="flex flex-col gap-2 flex-1 min-w-[150px]">
                    {chartPieData.slice(7).map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <span
                          className="inline-block w-3 h-3 rounded-full border border-white"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-[15px] font-semibold text-[#231d37]">
                          {item.name}
                        </span>
                        <span className="ml-1 text-[15px] text-[#7e32e2] font-bold">
                          {item.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Table section with Pagination */}
        <div className="bg-gradient-to-br from-white to-purple-50/20 rounded-2xl shadow-lg border border-purple-100 p-6 mt-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-purple-600 flex items-center gap-2">
              <FileText className="w-6 h-6" />
              ตารางข้อมูลรายละเอียด
            </h2>
          </div>
          {/* ใช้ HEALTHZONE_PROVINCES / getHealthZoneTable สร้างข้อมูลจังหวัดในแต่ละเขต */}
          <TableWithPagination
            data={summaryTableData}
            defaultItemsPerPage={5}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardSobos;
