import React, { useState, useMemo, useEffect } from "react";
import InputService from "@services/inputService/inputService";
import ButtonService from "@services/buttonService/buttonService";
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
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { HEALTHZONE_PROVINCES } from "@utils/healthzone-province-data";
import { Search } from "lucide-react";
import useStore from "@utils/useStore";

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

const ZONES = HEALTHZONE_PROVINCES.map((zone) => ({
  label: zone.zoneName,
  value: `zone${zone.zone}`,
}));
ZONES.unshift({ label: "ทั้งหมด", value: "" });

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

const ZONE_COLORS = [
  "#6E28B7",
  "#A682FF",
  "#5D86E7",
  "#4CA3DD",
  "#FFB347",
  "#E0AAFF",
  "#EB6383",
  "#FF9CEE",
  "#FFB3E6",
  "#FFB7B2",
  "#FFDAC1",
  "#4B61CF",
  "#7C83E1",
];

const createPie13 = (pieArr) => {
  const pie = [];
  for (let i = 1; i <= 13; i++) {
    const found = pieArr.find((p) => p.name === `เขตสุขภาพที่ ${i}`);
    pie.push({
      name: `เขตสุขภาพที่ ${i}`,
      value: found ? found.value : 0,
      color: found ? found.color : "#E5E5E5",
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
  // ... (other tabs remain unchanged, copy structure as above)
];

const PER_PAGE_OPTIONS = [
  { label: "10", value: 10 },
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
];

const TableWithPagination = ({
  data = [],
  defaultItemsPerPage = 5,
  className = "",
  searchText = "",
  isDistrict = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  // filter by province or district name
  const filteredData = useMemo(() => {
    if (!searchText) return data;
    const txt = searchText.toLowerCase().trim();
    return data.filter(
      (row) =>
        row.province?.toLowerCase().includes(txt) ||
        row.district?.toLowerCase?.().includes(txt) ||
        (row.total?.toString() ?? "").includes(txt) ||
        (row.submitted?.toString() ?? "").includes(txt)
    );
  }, [data, searchText]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
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

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, filteredData.length);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">แสดง</span>
          <div className="relative">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="appearance-none bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 pr-8 text-sm font-medium text-[#7e32e2] focus:outline-none focus:ring-2 focus:ring-[#7e32e2] focus:border-transparent cursor-pointer hover:border-[#7e32e2] transition-colors"
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
          <span className="text-sm text-gray-600">รายการต่อหน้า</span>
        </div>
        <div className="text-sm text-gray-600">
          รวมทั้งหมด{" "}
          <span className="font-medium text-[#7e32e2]">
            {filteredData.length}
          </span>{" "}
          รายการ
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-[14px]">
          <thead>
            <tr className="bg-[#f6eeff] text-[#7e32e2]">
              <th className="py-3 px-4 font-semibold text-center rounded-tl-xl">
                ลำดับ
              </th>
              <th className="py-3 px-4 font-semibold text-center">
                {isDistrict ? "อำเภอ" : "จังหวัด"}
              </th>
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
              paginatedData.map((row, index) => (
                <tr
                  key={isDistrict ? row.district : row.province || index}
                  className={`${
                    index % 2 === 0 ? "bg-white" : "bg-[#f9f6ff]"
                  } hover:bg-[#f0ebff] transition-colors duration-200`}
                >
                  <td className="py-3 px-4 text-center align-middle font-medium">
                    {startItem + index}
                  </td>
                  <td className="py-3 px-4 text-center align-middle">
                    {isDistrict ? row.district : row.province}
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
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-[#f0ebff]">
          <div className="text-sm text-gray-600">
            แสดง <span className="font-medium text-[#7e32e2]">{startItem}</span>{" "}
            ถึง <span className="font-medium text-[#7e32e2]">{endItem}</span>{" "}
            จาก{" "}
            <span className="font-medium text-[#7e32e2]">
              {filteredData.length}
            </span>{" "}
            รายการ
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-all duration-200 ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-105"
              }`}
              title="หน้าแรก"
            >
              <ChevronsLeft size={18} />
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-all duration-200 ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-105"
              }`}
              title="หน้าก่อนหน้า"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1 mx-2">
              {getPageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                  {page === "..." ? (
                    <span className="px-3 py-2 text-gray-400">...</span>
                  ) : (
                    <button
                      onClick={() => handlePageChange(page)}
                      className={`min-w-[40px] h-10 rounded-lg font-medium transition-all duration-200 ${
                        currentPage === page
                          ? "bg-[#7e32e2] text-white shadow-lg scale-105"
                          : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-105"
                      }`}
                    >
                      {page}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg transition-all duration-200 ${
                currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-105"
              }`}
              title="หน้าถัดไป"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg transition-all duration-200 ${
                currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-105"
              }`}
              title="หน้าสุดท้าย"
            >
              <ChevronsRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const THAI_PROVINCE_DATA_URL =
  "https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province_with_amphure_tambon.json";

const getUserZone = (user) => {
  if (user?.auth?.zone) {
    const match = user.auth.zone.match(/เขตสุขภาพที่ (\d+)/);
    if (match) return parseInt(match[1]);
  }
  return 1;
};

const DashboardZone = () => {
  const [searchType, setSearchType] = useState("year");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [week, setWeek] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [subdistrict, setSubdistrict] = useState("");
  const [tabIdx, setTabIdx] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [provinceData, setProvinceData] = useState([]);

  const [user] = useStore("user");
  const zoneNum = getUserZone(user);

  useEffect(() => {
    fetch(THAI_PROVINCE_DATA_URL)
      .then((res) => res.json())
      .then(setProvinceData)
      .catch(() => setProvinceData([]));
  }, []);

  const provinceOptions = useMemo(() => {
    if (!provinceData.length) return [{ label: "เลือกจังหวัด", value: "" }];
    const zoneObj = HEALTHZONE_PROVINCES.find((z) => z.zone === zoneNum);
    if (!zoneObj) return [{ label: "เลือกจังหวัด", value: "" }];
    const zoneProvincesList = zoneObj.provinces.map((prov) => prov.trim());
    const options = provinceData
      .filter((p) => zoneProvincesList.includes(p.name_th.trim()))
      .map((p) => ({
        label: p.name_th,
        value: p.name_th,
      }));
    return [{ label: "เลือกจังหวัด", value: "" }, ...options];
  }, [provinceData, zoneNum]);

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

  const handleClear = () => {
    setYear("");
    setMonth("");
    setWeek("");
    setProvince("");
    setDistrict("");
    setSubdistrict("");
    setSearchText("");
  };

  const currentTab = REPORT_TABS[tabIdx];
  const tableZone = currentTab.table.find(
    (t) => t.zone === `เขตสุขภาพที่ ${zoneNum}`
  );

  // สร้างข้อมูลสำหรับ Pie/Legend/ตาราง แบบจังหวัดหรืออำเภอ
  const provinceChartData = useMemo(() => {
    const zoneObj = HEALTHZONE_PROVINCES.find((z) => z.zone === zoneNum);
    const zoneProvincesList = zoneObj
      ? zoneObj.provinces.map((prov) => prov.trim())
      : [];
    return zoneProvincesList.map((province, index) => ({
      province,
      value: tableZone?.submitted ?? 0,
      color: ZONE_COLORS[index % ZONE_COLORS.length],
      submitted: tableZone?.submitted ?? 0,
      total: tableZone?.total ?? 0,
      percent: tableZone?.percent ?? 0,
    }));
  }, [zoneNum, tableZone]);

  const chartSummaryValue = useMemo(() => {
    return provinceChartData
      .reduce((sum, p) => sum + (p.value || 0), 0)
      .toLocaleString();
  }, [provinceChartData]);

  // สร้างข้อมูล summaryTableData: ถ้าเลือกจังหวัดจะแสดงอำเภอ
  const summaryTableData = useMemo(() => {
    if (province && provinceData.length) {
      const foundProv = provinceData.find((p) => p.name_th === province);
      if (!foundProv || !foundProv.amphure) return [];
      return foundProv.amphure.map((am, index) => ({
        province,
        district: am.name_th,
        total: tableZone?.total ?? 0,
        submitted: tableZone?.submitted ?? 0,
        percent: tableZone?.percent ?? 0,
        color: ZONE_COLORS[index % ZONE_COLORS.length],
      }));
    } else {
      return provinceChartData;
    }
  }, [province, provinceData, provinceChartData, tableZone]);

  // Legend: show districts if province selected, else provinces
  const legendData = useMemo(() => {
    if (province && provinceData.length) {
      const foundProv = provinceData.find((p) => p.name_th === province);
      if (!foundProv || !foundProv.amphure) return [];
      return foundProv.amphure.map((am, index) => ({
        name: am.name_th,
        value: am.name_th,
        color: ZONE_COLORS[index % ZONE_COLORS.length],
      }));
    } else {
      return provinceChartData.map((item) => ({
        name: item.province,
        color: item.color,
        value: item.value,
      }));
    }
  }, [province, provinceData, provinceChartData]);

  // ตาราง: ถ้าเลือกจังหวัดคืออำเภอ
  const isDistrictTable = !!province;

  // Search ในตาราง (province หรือ district)
  const filteredTableData = useMemo(() => {
    if (!searchText) return summaryTableData;
    const txt = searchText.toLowerCase().trim();
    return summaryTableData.filter(
      (row) =>
        row.province?.toLowerCase().includes(txt) ||
        row.district?.toLowerCase?.().includes(txt) ||
        (row.total?.toString() ?? "").includes(txt) ||
        (row.submitted?.toString() ?? "").includes(txt)
    );
  }, [summaryTableData, searchText]);

  return (
    <div className="bg-white rounded-2xl shadow p-4 md:p-6 max-w-full mb-8">
      <div className="flex flex-col gap-4">
        {/* รูปแบบการค้นหา */}
        <div className="flex flex-wrap gap-x-6 gap-y-3 items-center">
          <label className="font-semibold text-[#231d37] text-[15.5px]">
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
          <div>
            <div className="text-[14px] text-[#222] font-medium mb-1">ปี</div>
            <InputService
              options={YEARS}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="เลือกปี"
              name="year"
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
            />
          </div>
          <div>
            <div className="text-[14px] text-[#222] font-medium mb-1">
              สัปดาห์
            </div>
            <InputService
              options={WEEKS}
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              placeholder="เลือกสัปดาห์"
              name="week"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
          <div>
            <div className="text-[14px] text-[#222] font-medium mb-1">
              เขตสุขภาพ
            </div>
            <InputService
              options={ZONES}
              value={`zone${zoneNum}`}
              onChange={() => {}}
              placeholder="เลือกเขตสุขภาพ"
              name="zone"
              disabled
            />
            <div className="text-xs text-[#7e32e2] mt-1">
              * คุณถูกกำหนดสิทธิ์เฉพาะ {user?.auth?.zone}
            </div>
          </div>
          <div>
            <div className="text-[14px] text-[#222] font-medium mb-1">
              จังหวัด
            </div>
            <InputService
              options={provinceOptions}
              value={province}
              onChange={(e) => {
                setProvince(e.target.value);
                setDistrict("");
                setSubdistrict("");
              }}
              placeholder="เลือกจังหวัด"
              name="province"
              disabled={!zoneNum}
            />
          </div>
          <div>
            <div className="text-[14px] text-[#222] font-medium mb-1">
              อำเภอ
            </div>
            <InputService
              options={districtOptions}
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                setSubdistrict("");
              }}
              disabled={!province}
            />
          </div>
          <div>
            <div className="text-[14px] text-[#222] font-medium mb-1">ตำบล</div>
            <InputService
              options={subdistrictOptions}
              value={subdistrict}
              onChange={(e) => setSubdistrict(e.target.value)}
              disabled={!district}
            />
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-3 mt-2">
          <ButtonService
            type="button"
            variant="primary"
            className="w-full md:w-fit flex-1 h-12 text-[18px] bg-[#7e32e2] hover:bg-[#6c28c8] border-none shadow-none text-white"
            onClick={() => {}}
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
      <div className="mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {SUMMARY_CARDS.map((card, index) => (
            <div
              key={index}
              className="relative flex flex-col justify-between bg-white rounded-xl shadow-sm border border-[#eee] p-4 min-h-[110px]"
            >
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-full p-2 flex items-center justify-center">
                  {card.icon}
                </div>
                <span className="text-[14px] font-medium text-[#231d37] line-clamp-2">
                  {card.label}
                </span>
              </div>
              <div className="mt-2 flex items-end justify-between">
                <span className="text-[22px] font-bold text-[#7e32e2]">
                  {card.value}
                </span>
                {card.report && (
                  <button
                    type="button"
                    className="ml-3 px-2 py-1 rounded text-[13px] font-medium text-[#7e32e2] bg-[#f6eeff] hover:bg-[#ece1f7] transition"
                  >
                    รายงาน
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full mt-10 mb-6 flex flex-wrap border-b border-[#ece1f7]">
        {REPORT_TABS.map((tab, index) => (
          <button
            key={tab.name}
            onClick={() => setTabIdx(index)}
            className={`px-4 py-2 text-[15px] font-medium ${
              tabIdx === index
                ? "text-[#7e32e2] border-b-2 border-[#7e32e2] bg-[#f6eeff]"
                : "text-[#231d37] hover:text-[#7e32e2] hover:bg-[#f6eeff]"
            } transition`}
            style={{ minWidth: 90 }}
          >
            {tab.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="bg-white rounded-xl shadow-sm border border-[#ece1f7] p-4 flex flex-col"
          style={{ minHeight: 270 }}
        >
          <div className="font-semibold text-[#7e32e2] text-[15.5px] mb-2">
            สัดส่วนข้อมูล
          </div>
          <div className="flex flex-col items-center justify-center h-full relative">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={provinceChartData}
                  dataKey="value"
                  nameKey="province"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  label={false}
                >
                  {provinceChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
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
        {/* Legend: จังหวัด หรืออำเภอถ้าเลือกจังหวัด */}
        <div
          className="bg-white rounded-xl shadow-sm border border-[#ece1f7] p-4 flex flex-col"
          style={{ minHeight: 210 }}
        >
          <div className="font-semibold text-[#7e32e2] text-[16.5px] mb-2">
            {currentTab.legendTitle}
          </div>
          <div className="w-full border-t border-[#ece1f7] pt-4">
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              <div className="flex flex-col gap-2 flex-1 min-w-[150px]">
                {legendData
                  .slice(0, Math.ceil(legendData.length / 2))
                  .map((item) => (
                    <div
                      key={item.name || item.province}
                      className="flex items-center gap-2"
                    >
                      <span
                        className="inline-block w-3 h-3 rounded-full border border-white"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[15px] font-semibold text-[#231d37]">
                        {item.name || item.province}
                      </span>
                    </div>
                  ))}
              </div>
              <div className="flex flex-col gap-2 flex-1 min-w-[150px]">
                {legendData
                  .slice(Math.ceil(legendData.length / 2))
                  .map((item) => (
                    <div
                      key={item.name || item.province}
                      className="flex items-center gap-2"
                    >
                      <span
                        className="inline-block w-3 h-3 rounded-full border border-white"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[15px] font-semibold text-[#231d37]">
                        {item.name || item.province}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-3 mt-8 mb-2">
        <input
          className="border rounded-lg px-3 py-2 text-[15px] w-full md:w-1/3"
          type="text"
          placeholder={
            isDistrictTable ? "ค้นหาอำเภอหรือจำนวน" : "ค้นหาจังหวัดหรือจำนวน"
          }
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-[#eee] p-4 mt-2">
        <TableWithPagination
          data={filteredTableData}
          defaultItemsPerPage={5}
          searchText={searchText}
          isDistrict={isDistrictTable}
        />
      </div>
    </div>
  );
};

export default DashboardZone;
