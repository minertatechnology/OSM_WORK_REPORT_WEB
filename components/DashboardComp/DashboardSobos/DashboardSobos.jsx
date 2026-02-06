import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import ButtonService from "@services/buttonService/buttonService";
import CustomSelect from "@services/customSelectService/customSelectService";
import { getOsmByHealthService } from "@services/lookupService";
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
  Building2,
  RotateCcw,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import MapThailandComponent from "@services/MapThailand/MapThailandService";
import { HEALTHZONE_PROVINCES } from "@utils/healthzone-province-data";
import reportsMapService from "@services/reportsMapService";
import { usePermissionFilters } from "@hooks/usePermissionFilters";
import { useUserPermission } from "@context/UserPermissionProvider";
import {
  getCurrentFiscalYear,
  generateFiscalYearOptions,
} from "@utils/fiscalYearHelper";

// เดือน options (ปกติ - เริ่มต้นเดือนมกราคม)
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

// เดือน options (ปีงบประมาณ - เริ่มต้นเดือนตุลาคม)
const FISCAL_MONTHS = [
  { label: "ตุลาคม", value: "10" },
  { label: "พฤศจิกายน", value: "11" },
  { label: "ธันวาคม", value: "12" },
  { label: "มกราคม", value: "01" },
  { label: "กุมภาพันธ์", value: "02" },
  { label: "มีนาคม", value: "03" },
  { label: "เมษายน", value: "04" },
  { label: "พฤษภาคม", value: "05" },
  { label: "มิถุนายน", value: "06" },
  { label: "กรกฎาคม", value: "07" },
  { label: "สิงหาคม", value: "08" },
  { label: "กันยายน", value: "09" },
];

// ประเภทปี options
const YEAR_TYPES = [
  { label: "ปีงบประมาณ", value: "fiscal" },
  { label: "รายปี", value: "calendar" },
];

// ประเภทรายงานทั้ง 7 ประเภท
const REPORT_TYPES = [
  { type: "health_record", name: "แบบบันทึกสุขภาพ อสม.", icon: FileText },
  { type: "mosquito_larvae", name: "รายงานน้ำยุงรายบ้าน", icon: FileText },
  { type: "ncds", name: "คัดกรองโรคไม่ติดต่อเรื้อรัง (NCDs)", icon: Activity },
  { type: "elderly_screening", name: "คัดกรองผู้สูงอายุ", icon: UserCheck },
  { type: "pregnant_women", name: "ติดตามหญิงตั้งครรภ์/หลังคลอด", icon: FileCheck },
  { type: "count_carbs", name: "อสม. ชวนนับคาร์บ", icon: FileText },
  { type: "report_osm1", name: "รายงาน อสม. 1", icon: ClipboardList },
];

const PER_PAGE_OPTIONS = [
  { label: "5", value: 5 },
  { label: "10", value: 10 },
  { label: "20", value: 20 },
  { label: "50", value: 50 },
];

// สี Pie Chart สำหรับ 13 เขต (index 0 = สีเทาสำหรับไม่มีข้อมูล)
const ZONE_COLORS = [
  "#E5E5E5", // 0 สีเทา (ไม่มีข้อมูล)
  "#6E28B7", // 1
  "#4B61CF", // 2
  "#5D86E7", // 3
  "#4CA3DD", // 4
  "#7C83E1", // 5
  "#A682FF", // 6
  "#E0AAFF", // 7
  "#FFB3E6", // 8
  "#FF9CEE", // 9
  "#FFB7B2", // 10
  "#FFDAC1", // 11
  "#FFB347", // 12
  "#EB6383", // 13
];

// Table Pagination Component
const TableWithPagination = ({
  data = [],
  defaultItemsPerPage = 5,
  className = "",
  tableLevel = "province", // province, district, subdistrict
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(data.length / itemsPerPage);

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

  // ชื่อคอลัมน์ตาม table_level
  const getColumnName = () => {
    switch (tableLevel) {
      case "zone":
        return "เขตสุขภาพ";
      case "province":
        return "จังหวัด";
      case "district":
        return "อำเภอ";
      case "subdistrict":
        return "ตำบล";
      case "service":
        return "หน่วยบริการ";
      case "osm":
        return "อสม.";
      default:
        return "พื้นที่";
    }
  };

  const columnName = getColumnName();

  return (
    <div className={`w-full ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-[14px]">
          <thead>
            <tr className="bg-[#f6eeff] text-[#7e32e2]">
              <th className="py-3 px-4 font-semibold text-center rounded-tl-xl">
                ลำดับ
              </th>
              <th className="py-3 px-4 font-semibold text-center">{columnName}</th>
              <th className="py-3 px-4 font-semibold text-center">
                จำนวนรายงาน
              </th>
              {tableLevel === "province" && (
                <th className="py-3 px-4 font-semibold text-center rounded-tr-xl">
                  เขตสุขภาพ
                </th>
              )}
              {tableLevel === "district" && (
                <th className="py-3 px-4 font-semibold text-center rounded-tr-xl">
                  จังหวัด
                </th>
              )}
              {tableLevel === "subdistrict" && (
                <>
                  <th className="py-3 px-4 font-semibold text-center">
                    อำเภอ
                  </th>
                  <th className="py-3 px-4 font-semibold text-center rounded-tr-xl">
                    จังหวัด
                  </th>
                </>
              )}
              {tableLevel === "service" && (
                <>
                  <th className="py-3 px-4 font-semibold text-center">
                    ตำบล
                  </th>
                  <th className="py-3 px-4 font-semibold text-center">
                    อำเภอ
                  </th>
                  <th className="py-3 px-4 font-semibold text-center rounded-tr-xl">
                    จังหวัด
                  </th>
                </>
              )}
              {tableLevel === "osm" && (
                <th className="py-3 px-4 font-semibold text-center rounded-tr-xl">
                  จังหวัด
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr
                  key={row.name || row.province_name || idx}
                  className={`${
                    idx % 2 === 0 ? "bg-white" : "bg-[#f9f6ff]"
                  } hover:bg-[#f0ebff] transition-colors duration-200`}
                >
                  <td className="py-3 px-4 text-center align-middle font-medium">
                    {startItem + idx}
                  </td>
                  <td className="py-3 px-4 text-center align-middle">
                    {row.name || row.province_name}
                  </td>
                  <td className="py-3 px-4 text-center align-middle font-medium text-[#7e32e2]">
                    {row.total_reports?.toLocaleString() ?? "0"}
                  </td>
                  {tableLevel === "province" && (
                    <td className="py-3 px-4 text-center align-middle">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {row.zone_name || "-"}
                      </span>
                    </td>
                  )}
                  {tableLevel === "district" && (
                    <td className="py-3 px-4 text-center align-middle">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {row.province_name || "-"}
                      </span>
                    </td>
                  )}
                  {tableLevel === "subdistrict" && (
                    <>
                      <td className="py-3 px-4 text-center align-middle">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {row.district_name || "-"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center align-middle">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {row.province_name || "-"}
                        </span>
                      </td>
                    </>
                  )}
                  {tableLevel === "service" && (
                    <>
                      <td className="py-3 px-4 text-center align-middle">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {row.subdistrict_name || "-"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center align-middle">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {row.district_name || "-"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center align-middle">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {row.province_name || "-"}
                        </span>
                      </td>
                    </>
                  )}
                  {tableLevel === "osm" && (
                    <td className="py-3 px-4 text-center align-middle">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {row.province_name || "-"}
                      </span>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={tableLevel === "subdistrict" ? 5 : (tableLevel === "service" ? 6 : (tableLevel === "province" ? 4 : 3))} className="py-8 text-center text-gray-500">
                  ไม่มีข้อมูลที่จะแสดง
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-row items-center justify-between gap-3 mt-6 pt-6 border-t-2 border-purple-100 flex-wrap">
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

        <div className="text-xs font-medium text-gray-700 whitespace-nowrap">
          รวม{" "}
          <span className="font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
            {data.length}
          </span>{" "}
          รายการ
        </div>

        <div className="flex items-center gap-2">
          {totalPages > 1 && (
            <>
              <div className="text-xs font-medium text-gray-700 bg-gradient-to-r from-purple-50 to-white px-3 py-1.5 rounded-lg border border-purple-100 whitespace-nowrap">
                <span className="font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                  {startItem}
                </span>
                -
                <span className="font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                  {endItem}
                </span>
              </div>

              <div className="flex items-center gap-1 bg-white px-1.5 py-1.5 rounded-lg border border-purple-100 shadow-sm">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className={`p-1.5 rounded-md transition-all duration-200 ${
                    currentPage === 1
                      ? "text-gray-300 cursor-not-allowed bg-gray-50"
                      : "text-purple-600 hover:bg-gradient-to-r hover:from-purple-600 hover:to-purple-500 hover:text-white hover:scale-105 hover:shadow-md"
                  }`}
                >
                  <ChevronsLeft size={16} />
                </button>

                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-1.5 rounded-md transition-all duration-200 ${
                    currentPage === 1
                      ? "text-gray-300 cursor-not-allowed bg-gray-50"
                      : "text-purple-600 hover:bg-gradient-to-r hover:from-purple-600 hover:to-purple-500 hover:text-white hover:scale-105 hover:shadow-md"
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>

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

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-1.5 rounded-md transition-all duration-200 ${
                    currentPage === totalPages
                      ? "text-gray-300 cursor-not-allowed bg-gray-50"
                      : "text-purple-600 hover:bg-gradient-to-r hover:from-purple-600 hover:to-purple-500 hover:text-white hover:scale-105 hover:shadow-md"
                  }`}
                >
                  <ChevronRight size={16} />
                </button>

                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`p-1.5 rounded-md transition-all duration-200 ${
                    currentPage === totalPages
                      ? "text-gray-300 cursor-not-allowed bg-gray-50"
                      : "text-purple-600 hover:bg-gradient-to-r hover:from-purple-600 hover:to-purple-500 hover:text-white hover:scale-105 hover:shadow-md"
                  }`}
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const DashboardSobos = () => {
  const [selectedReportType, setSelectedReportType] = useState(""); // ไม่เลือกประเภทรายงานเริ่มต้น = แสดงทั้งหมด
  const [reportsData, setReportsData] = useState(null);
  const [provinceSummary, setProvinceSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [osmDataByService, setOsmDataByService] = useState([]); // เก็บข้อมูล OSM ตามหน่วยบริการ

  // Generate year options
  const currentFiscalYear = getCurrentFiscalYear();
  const YEARS = generateFiscalYearOptions(currentFiscalYear - 4, currentFiscalYear);

  // Use permission-based filters
  const { isLocked, scope, lockLevel, getInitialFilters } = useUserPermission();
  const {
    yearType,
    year,
    month,
    zone,
    province,
    district,
    subdistrict,
    service,
    setYearType,
    setYear,
    setMonth,
    handleZoneChange,
    handleProvinceChange,
    handleDistrictChange,
    handleSubdistrictChange,
    handleServiceChange,
    healthAreas,
    provinces,
    districts,
    subdistricts,
    healthServices,
    handleReset,
    isDistrictDisabled,
    isSubdistrictDisabled,
    isServiceDisabled,
  } = usePermissionFilters({
    defaultYear: String(currentFiscalYear),
    defaultYearType: "fiscal",
  });

  // ✅ ใช้ refs เพื่อเก็บค่าล่าสุดของ lookup data
  // เพื่อไม่ต้องใส่ใน dependencies ของ fetchData (ซึ่งจะทำให้เกิด infinite loop)
  const healthAreasRef = useRef(healthAreas);
  const provincesRef = useRef(provinces);
  const districtsRef = useRef(districts);
  const subdistrictsRef = useRef(subdistricts);
  const healthServicesRef = useRef(healthServices);

  // ✅ อัปเดต refs เมื่อค่าเปลี่ยน
  useEffect(() => {
    healthAreasRef.current = healthAreas;
  }, [healthAreas]);

  useEffect(() => {
    provincesRef.current = provinces;
  }, [provinces]);

  useEffect(() => {
    districtsRef.current = districts;
  }, [districts]);

  useEffect(() => {
    subdistrictsRef.current = subdistricts;
  }, [subdistricts]);

  useEffect(() => {
    healthServicesRef.current = healthServices;
  }, [healthServices]);

  // ล้างข้อมูลการค้นหา
  const handleClear = () => {
    handleReset(String(currentFiscalYear), "fiscal");
    setSelectedReportType("");
  };

  // เลือกรายการเดือนตามประเภทปี
  const monthOptions = useMemo(() => {
    return yearType === "fiscal" ? FISCAL_MONTHS : MONTHS;
  }, [yearType]);

  // ฟังก์ชันดึงข้อมูลจาก API (ใช้ /reports/geo-summary แบบ dynamic)
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const filters = {};

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

      // ✅ ให้ user selection มี priority สูงสุดเสมอ
      // ถ้า user เลือก filter เอง ให้ใช้ค่าที่ user เลือก ไม่ใช่ค่า locked
      const initialFilters = getInitialFilters();
      const defaultZone = initialFilters.zone || "";
      const defaultProvince = initialFilters.province || "";
      const defaultDistrict = initialFilters.district || "";
      const defaultSubdistrict = initialFilters.subdistrict || "";
      const defaultService = initialFilters.service || "";

      // ✅ User selection override: ถ้า user เลือกค่าใหม่ (ไม่เท่ากับ default) ให้ใช้ค่าที่ user เลือก
      // ✅ ถ้า user ไม่ได้เลือก (ค่าว่าง) ให้ใช้ค่า locked เฉพาะที่ user มีสิทธิ์เท่านั้น
      // ✅ ส่งทั้ง code, name, และ id เพื่อให้ backend รองรับทั้ง text และ id

      // Zone filter
      // ✅ ถ้า user เลือก zone เอง (แม้จะเท่ากับ defaultZone) ให้ใช้ค่าที่เลือก
      // ✅ ถ้าไม่ได้เลือก (zone = "") แต่มี defaultZone (lockLevel != none) ให้ใช้ค่า locked
      if (zone !== "") {
        // User เลือก zone หรือ zone ถูก lock ไว้ - ใช้ค่า zone เสมอ
        const zoneNumber = parseInt(String(zone).replace(/\D/g, ''));
        filters.health_region = zoneNumber;
      }

      // Province filter - user เลือกเอง หรือ lockLevel เป็น province/district/subdistrict
      if (province && province !== defaultProvince) {
        // User เลือก province เอง - ส่งเป็น text และ id (ไม่ส่ง province_code)
        const provData = provincesRef.current.find(p => String(p.code || p.id) === province);
        if (provData) {
          filters.province = provData.name_th || provData.name;
          filters.province_id = province;
        }
      } else if (defaultProvince && lockLevel !== 'none' && lockLevel !== 'zone') {
        // User ไม่ได้เลือก ใช้ค่า locked เฉพาะ lockLevel = province, district, subdistrict
        // ✅ ส่งเป็น text และ id โดยตรง (ไม่ส่ง province_code)
        const provData = provincesRef.current.find(p => String(p.code || p.id) === defaultProvince);
        if (provData) {
          filters.province = provData.name_th || provData.name;
          filters.province_id = defaultProvince;
        }
      }

      // District filter - user เลือกเอง หรือ lockLevel เป็น district/subdistrict
      if (district && district !== defaultDistrict) {
        // User เลือก district เอง - ส่งเป็น text และ id (ไม่ส่ง district_code)
        const distData = districtsRef.current.find(d => String(d.code || d.id) === district);
        if (distData) {
          filters.district = distData.name_th || distData.name;
          filters.district_id = district;
        }
      } else if (defaultDistrict && (lockLevel === 'district' || lockLevel === 'subdistrict')) {
        // User ไม่ได้เลือก ใช้ค่า locked เฉพาะ lockLevel = district, subdistrict
        // ✅ ส่งเป็น text และ id โดยตรง (ไม่ส่ง district_code)
        const distData = districtsRef.current.find(d => String(d.code || d.id) === defaultDistrict);
        if (distData) {
          filters.district = distData.name_th || distData.name;
          filters.district_id = defaultDistrict;
        }
      }

      // Subdistrict filter - user เลือกเอง หรือ lockLevel เป็น subdistrict
      if (subdistrict && subdistrict !== defaultSubdistrict) {
        // User เลือก subdistrict เอง - ส่งเป็น text และ id (ไม่ส่ง subdistrict_code)
        const subdistData = subdistrictsRef.current.find(s => String(s.code || s.id) === subdistrict);
        if (subdistData) {
          filters.subdistrict = subdistData.name_th || subdistData.name;
          filters.subdistrict_id = subdistrict;
        }
      } else if (defaultSubdistrict && lockLevel === 'subdistrict') {
        // User ไม่ได้เลือก ใช้ค่า locked เฉพาะ lockLevel = subdistrict เท่านั้น
        // ✅ ส่งเป็น text และ id โดยตรง (ไม่ส่ง subdistrict_code)
        const subdistData = subdistrictsRef.current.find(s => String(s.code || s.id) === defaultSubdistrict);
        if (subdistData) {
          filters.subdistrict = subdistData.name_th || subdistData.name;
          filters.subdistrict_id = defaultSubdistrict;
        }
      }

      // ✅ Health Service filter (หน่วยบริการ)
      if (service) {
        filters.health_service_id = service;
      }

      // ดึงข้อมูล OSM ตามหน่วยบริการ (ถ้าเลือกหน่วยบริการ)
      let osmData = [];
      if (service) {
        try {
          osmData = await getOsmByHealthService(service);
          setOsmDataByService(osmData);
        } catch (err) {
          console.error("Error fetching OSM data:", err);
          setOsmDataByService([]);
        }
      } else {
        setOsmDataByService([]);
      }

      // ดึงข้อมูลจาก API /reports/map-data (ใช้ map-data แทน geo-summary เพื่อให้ได้ข้อมูล location)
      const mapDataResponse = await reportsMapService.getReportsMapData(filters);

      // Filter ตามหน่วยบริการ (ถ้าเลือก)
      let filteredReports = mapDataResponse.reports || [];
      let filteredItems = mapDataResponse.items || [];

      // ✅ Permission filters ถูกส่งไป backend แล้ว ไม่ต้อง filter ฝั่ง frontend
      // (ดูตรง filters.health_region, filters.province_code, filters.district_code, filters.subdistrict_code)

      // Determine the level based on the current filter state
      // Default to province level if no subdistrict/district filter
      let currentLevel = "province";
      if (subdistrict) {
        currentLevel = "subdistrict";
      } else if (district) {
        currentLevel = "district";
      } else if (province) {
        currentLevel = "province";
      }

      if (service && osmData.length > 0) {
        const osmIdSet = new Set(osmData.map(osm => osm.id));
        filteredReports = filteredReports.filter(r => r.external_user_id && osmIdSet.has(r.external_user_id));

        // สร้าง summary ใหม่จาก filtered reports
        const itemMap = {};
        filteredReports.forEach(r => {
          const itemName = currentLevel === "province"
            ? r.province_name_th
            : currentLevel === "district"
            ? r.district_name_th
            : r.subdistrict_name_th;

          if (!itemName) return;

          if (!itemMap[itemName]) {
            itemMap[itemName] = {
              name: itemName,
              name_th: itemName,
              total_reports: 0,
              report_types: {}
            };
          }
          itemMap[itemName].total_reports++;

          const rt = r.report_type;
          if (!itemMap[itemName].report_types[rt]) {
            itemMap[itemName].report_types[rt] = 0;
          }
          itemMap[itemName].report_types[rt]++;
        });

        filteredItems = Object.values(itemMap);
      }

      // สรุปตามประเภทรายงาน
      const summaryByType = {};
      REPORT_TYPES.forEach(rt => {
        // นับจำนวนรายงานจาก filteredReports แทน
        const count = filteredReports.filter(r => r.report_type === rt.type).length;
        summaryByType[rt.type] = count;
      });

      // Filter ตามประเภทรายงาน (ถ้าเลือก)
      let mapReports = [...filteredReports];
      if (selectedReportType) {
        mapReports = filteredReports.filter(r => r.report_type === selectedReportType);
      }

      // สร้างข้อมูลสรุปจาก mapReports
      const itemMap = {};
      mapReports.forEach(r => {
        const itemName = currentLevel === "province"
          ? r.province_name_th
          : currentLevel === "district"
          ? r.district_name_th
          : r.subdistrict_name_th;

        if (!itemName) return;

        if (!itemMap[itemName]) {
          itemMap[itemName] = {
            name: itemName,
            name_th: itemName,
            total_reports: 0
          };
        }
        itemMap[itemName].total_reports++;
      });

      const finalItems = Object.values(itemMap);

      setReportsData({
        total_reports: filteredReports.length,
        reports: mapReports,
        summary_by_type: summaryByType
      });

      // ✅ สร้าง map_items และ table_items จาก lookup + merge กับข้อมูลรายงาน
      // ให้แสดงทุกอย่างจาก lookup และนับจำนวนรายงาน (ถ้าไม่มีให้ 0)

      // ✅ Override map_level และ table_level ตามสิทธิ์ของ user
      // country (กรม) → map=zone, table=province
      // area (เขต) → map=province, table=district
      // province (จังหวัด) → map=district, table=subdistrict
      // district (อำเภอ) → map=subdistrict, table=service
      // subdistrict (ตำบล) → map=service, table=osm
      // service (หน่วยบริการ) → map=osm, table=osm

      // ✅ ถ้า user มีการเลือก filter (zone/province/district/subdistrict/service) ให้แสดงผลตามที่เลือก
      // โดยไม่สนใจ lockLevel เพราะ user อยากเห็นข้อมูลระดับที่เลือก
      let mapLevel = "province";
      let tableLevel = "province";

      // หาค่า default filter จาก permission (ค่าที่ user ถูกล็อคไว้)
      // ใช้ defaultZone, defaultProvince, defaultDistrict, defaultSubdistrict จากด้านบนที่ประกาศไปแล้ว

      // ✅ ให้ความสำคัญกับ filter ที่ user เลือกล่าสุด (ลำดับสุดท้ายสุด)
      // ถ้าเลือก service → แสดงหน่วยบริการที่เลือกทั้งในตารางและสัดส่วน
      if (service && service !== defaultService) {
        mapLevel = "service";
        tableLevel = "service";
      }
      // ถ้าเลือก subdistrict → แสดงหน่วยบริการทั้งในตารางและสัดส่วน
      else if (subdistrict && subdistrict !== defaultSubdistrict) {
        mapLevel = "service";
        tableLevel = "service";
      }
      // ถ้าเลือก district → แสดงตำบล
      else if (district && district !== defaultDistrict) {
        mapLevel = "district";
        tableLevel = "subdistrict";
      }
      // ถ้าเลือก province → แสดงอำเภอ
      // ✅ รองรับกรณี user มีสิทธิ์ระดับต่ำ (district/subdistrict) แต่อยากเห็นอำเภอในจังหวัดตัวเอง
      // ✅ ถ้าไม่ได้เลือก filter หรือมีการเลือก lock อยู่ → ให้แสดงระดับตามสิทธิ์อย่างง่ายขึ้น
      else if (province && !district && !subdistrict && !service) {
        mapLevel = "district";
        tableLevel = "district";
      }
      else if (province && province !== defaultProvince && !district) {
        mapLevel = "district";
        tableLevel = "district";
      }
      // ถ้าเลือก zone → แสดงจังหวัด
      // ✅ เช็คว่า user เลือก zone จริงๆ (ไม่ใช่ค่า lock) หรือ lockLevel เป็น none/zone ให้กรอง
      else if (zone && !province && (lockLevel === "none" || lockLevel === "zone" || zone !== defaultZone)) {
        mapLevel = "province";
        tableLevel = "province";
      }
      // ถ้าไม่ได้เลือก filter → ใช้ lockLevel
      else {
        // Override ตาม lockLevel (permission level ของ user)
        if (lockLevel === "none") {
          // country (กรม) - สิทธิ์สูงสุด
          mapLevel = "zone";
          tableLevel = "province";
        } else if (lockLevel === "zone") {
          // area (เขต)
          mapLevel = "province";
          tableLevel = "district";
        } else if (lockLevel === "province") {
          // province (จังหวัด)
          mapLevel = "district";
          tableLevel = "subdistrict";
        } else if (lockLevel === "district") {
          // district (อำเภอ)
          mapLevel = "subdistrict";
          tableLevel = "service";
        } else if (lockLevel === "subdistrict") {
          // subdistrict (ตำบล)
          mapLevel = "service";
          tableLevel = "osm";
        } else if (lockLevel === "service") {
          // service (หน่วยบริการ)
          mapLevel = "osm";
          tableLevel = "osm";
        }
      }

      // สร้าง map_items จาก lookup
      let mapItems = [];
      // ✅ ประกาศตัวแปร filtered items ร่วมกันเพื่อให้ lookupMap ใช้ได้
      let filteredServices = [];
      let filteredProvinces = [];
      let filteredDistricts = [];
      let filteredSubdistricts = [];
      if (mapLevel === "zone") {
        // ใช้ healthAreas จาก lookup
        mapItems = healthAreasRef.current.map(area => ({
          name_th: area.name_th,
          name: area.name_th,
          code: area.code,
          total_reports: 0
        }));
      } else if (mapLevel === "province") {
        // ✅ กรองจังหวัดตาม zone ที่เลือก
        filteredProvinces = provincesRef.current;
        if (zone && (lockLevel === "none" || lockLevel === "zone" || zone !== defaultZone)) {
          const zoneNumber = parseInt(String(zone).replace(/\D/g, ''));
          const zoneProvinces = HEALTHZONE_PROVINCES.find(z => z.zone === zoneNumber);
          if (zoneProvinces) {
            filteredProvinces = provincesRef.current.filter(p =>
              zoneProvinces.provinces.some(prov => prov.trim() === p.name_th.trim())
            );
          }
        }
        mapItems = filteredProvinces.map(p => ({
          name_th: p.name_th,
          name: p.name_th,
          code: p.code || p.id,
          total_reports: 0
        }));
      } else if (mapLevel === "district") {
        // ✅ กรองอำเภอตามจังหวัดที่เลือก
        filteredDistricts = districtsRef.current;
        if (province) {
          const provData = provincesRef.current.find(p => String(p.code || p.id) === province);
          if (provData) {
            filteredDistricts = districtsRef.current.filter(d => d.province_name_th === provData.name_th);
          }
        }
        mapItems = filteredDistricts.map(d => ({
          name_th: d.name_th,
          name: d.name_th,
          code: d.code || d.id,
          total_reports: 0
        }));
      } else if (mapLevel === "subdistrict") {
        // ✅ กรองตำบลตามอำเภอที่เลือก
        filteredSubdistricts = subdistrictsRef.current;
        if (district) {
          const distData = districtsRef.current.find(d => String(d.code || d.id) === district);
          if (distData) {
            filteredSubdistricts = subdistrictsRef.current.filter(s => s.district_name_th === distData.name_th);
          }
        }
        mapItems = filteredSubdistricts.map(s => ({
          name_th: s.name_th,
          name: s.name_th,
          code: s.code || s.id,
          total_reports: 0
        }));
      } else if (mapLevel === "service") {
        // ✅ กรองหน่วยบริการตามที่เลือก (service) หรือตามตำบลที่เลือก
        filteredServices = healthServicesRef.current || [];
        if (service) {
          const serviceData = (healthServicesRef.current || []).find(s => String(s.id || s.code) === service);
          if (serviceData) {
            filteredServices = [serviceData];
          }
        } else if (subdistrict) {
          const subdistData = subdistrictsRef.current.find(s => String(s.code || s.id) === subdistrict);
          if (subdistData) {
            filteredServices = (healthServicesRef.current || []).filter(svc =>
              (svc.subdistrict?.name_th === subdistData.name_th) ||
              (String(svc.subdistrict?.code || "") === String(subdistrict))
            );
          }
        }
        mapItems = filteredServices.map(s => ({
          name_th: s.name_th || s.name || s.service_name || "ไม่ระบุ",
          name: s.name_th || s.name || s.service_name || "ไม่ระบุ",
          code: s.id || s.code || "",
          total_reports: 0
        }));
      } else if (mapLevel === "osm") {
        // ใช้ osmData จาก OSM
        mapItems = osmData.map(osm => ({
          name_th: osm.full_name || osm.name_th || osm.firstname + " " + (osm.lastname || ""),
          name: osm.full_name || osm.name_th || osm.firstname + " " + (osm.lastname || ""),
          code: osm.id || "",
          total_reports: 0
        }));
      }

      // ✅ นับจำนวนรายงานจาก location_data
      // location_data จาก backend มี province_name_th, district_name_th, subdistrict_name_th โดยตรง

      // สร้าง map สำหรับ lookup ทั้งแบบ code และ name_th เพื่อให้ match ได้ง่ายขึ้น
      const lookupMapByCode = {};
      const lookupMapByName = {};

      if (mapLevel === "zone") {
        healthAreasRef.current.forEach(area => {
          const code = String(area.code);
          lookupMapByCode[code] = area.name_th;
          lookupMapByName[area.name_th] = code;
        });
      } else if (mapLevel === "province") {
        // ✅ ใช้ filteredProvinces ที่กรองแล้ว
        filteredProvinces.forEach(p => {
          const code = String(p.code || p.id);
          lookupMapByCode[code] = p.name_th;
          lookupMapByName[p.name_th] = code;
        });
      } else if (mapLevel === "district") {
        // ✅ ใช้ filteredDistricts ที่กรองแล้ว
        filteredDistricts.forEach(d => {
          const code = String(d.code || d.id);
          lookupMapByCode[code] = d.name_th;
          lookupMapByName[d.name_th] = code;
        });
      } else if (mapLevel === "subdistrict") {
        // ✅ ใช้ filteredSubdistricts ที่กรองแล้ว
        filteredSubdistricts.forEach(s => {
          const code = String(s.code || s.id);
          lookupMapByCode[code] = s.name_th;
          lookupMapByName[s.name_th] = code;
        });
      } else if (mapLevel === "service") {
        // ✅ ใช้เฉพาะ filteredServices ที่กรองแล้ว (ไม่ใช้ทั้งหมด)
        filteredServices.forEach(s => {
          const id = String(s.id || s.code || "");
          const name = s.name_th || s.name || s.service_name || "";
          lookupMapByCode[id] = name;
          lookupMapByName[name] = id;
        });
      } else if (mapLevel === "osm") {
        osmData.forEach(osm => {
          const id = String(osm.id || "");
          const name = osm.full_name || osm.name_th || osm.firstname + " " + (osm.lastname || "");
          lookupMapByCode[id] = name;
          lookupMapByName[name] = id;
        });
      }

      // นับจำนวนรายงานโดยใช้ code เป็น key
      const reportCountMap = {};
      mapReports.forEach((r) => {
        let key = null;

        if (mapLevel === "zone") {
          // หาเขตจากจังหวัด - ใช้ HEALTHZONE_PROVINCES
          const provinceName = r.province_name_th;
          if (provinceName) {
            const zoneData = HEALTHZONE_PROVINCES.find(z =>
              z.provinces.some(p => p.trim() === provinceName.trim())
            );
            if (zoneData) {
              key = `HA${zoneData.zone}`;
            }
          }
        } else if (mapLevel === "province") {
          // ใช้ province_name_th ตรงๆ
          const provinceName = r.province_name_th;
          if (provinceName) {
            key = lookupMapByName[provinceName];
          }
        } else if (mapLevel === "district") {
          // ใช้ district_name_th ตรงๆ
          const districtName = r.district_name_th;
          if (districtName) {
            key = lookupMapByName[districtName];
          }
        } else if (mapLevel === "subdistrict") {
          // ใช้ subdistrict_name_th ตรงๆ
          const subdistrictName = r.subdistrict_name_th;
          if (subdistrictName) {
            key = lookupMapByName[subdistrictName];
          }
        } else if (mapLevel === "service") {
          // ใช้ health_service_id จากรายงาน
          const serviceId = r.health_service_id;
          if (serviceId) {
            key = String(serviceId);
          }
        } else if (mapLevel === "osm") {
          // ใช้ external_user_id จากรายงาน
          const osmId = r.external_user_id;
          if (osmId) {
            key = String(osmId);
          }
        }

        if (key) {
          reportCountMap[key] = (reportCountMap[key] || 0) + 1;
        }
      });

      // Merge จำนวนรายงานเข้ากับ map_items
      mapItems.forEach(item => {
        const itemCode = String(item.code);
        // ใช้ || 0 เพื่อให้แน่ใจว่าถ้าไม่มีข้อมูลจะเป็น 0
        item.total_reports = reportCountMap[itemCode] || 0;
      });

      // สร้าง table_items จาก lookup (เหมือนกันแต่ใช้ tableLevel)
      let tableItems = [];
      if (tableLevel === "zone") {
        tableItems = healthAreasRef.current.map(area => ({
          name_th: area.name_th,
          name: area.name_th,
          total_reports: 0
        }));
      } else if (tableLevel === "province") {
        // ✅ กรองจังหวัดตาม zone ที่เลือก (ถ้ามี)
        let filteredProvinces = provincesRef.current;
        if (zone && (lockLevel === "none" || lockLevel === "zone" || zone !== defaultZone)) {
          const zoneNumber = parseInt(String(zone).replace(/\D/g, ''));
          const zoneProvinces = HEALTHZONE_PROVINCES.find(z => z.zone === zoneNumber);
          if (zoneProvinces) {
            filteredProvinces = provincesRef.current.filter(p =>
              zoneProvinces.provinces.some(prov => prov.trim() === p.name_th.trim())
            );
          }
        }
        tableItems = filteredProvinces.map(p => {
          // หา zone_name จาก HEALTHZONE_PROVINCES
          const zoneData = HEALTHZONE_PROVINCES.find(z =>
            z.provinces.some(prov => prov.trim() === p.name_th.trim())
          );
          return {
            name_th: p.name_th,
            name: p.name_th,
            total_reports: 0,
            province_name: p.name_th,
            zone_name: zoneData ? zoneData.zoneName : "-"
          };
        });
      } else if (tableLevel === "district") {
        // ✅ กรองอำเภอตามจังหวัดที่เลือก
        let filteredDistricts = districtsRef.current;
        if (province) {
          const provData = provincesRef.current.find(p => String(p.code || p.id) === province);
          if (provData) {
            filteredDistricts = districtsRef.current.filter(d => d.province_name_th === provData.name_th);
          }
        }
        tableItems = filteredDistricts.map(d => ({
          name_th: d.name_th,
          name: d.name_th,
          total_reports: 0,
          province_name: d.province_name_th || "-"
        }));
      } else if (tableLevel === "subdistrict") {
        // ✅ กรองตำบลตามอำเภอที่เลือก
        let filteredSubdistricts = subdistrictsRef.current;
        if (district) {
          const distData = districtsRef.current.find(d => String(d.code || d.id) === district);
          if (distData) {
            filteredSubdistricts = subdistrictsRef.current.filter(s => s.district_name_th === distData.name_th);
          }
        }

        // ✅ สร้าง map ของ districts เพื่อหา province_name และ district_name
        const districtMap = {};
        districtsRef.current.forEach(d => {
          districtMap[d.name_th] = {
            province_name_th: d.province_name_th,
            district_name_th: d.name_th
          };
        });

        tableItems = filteredSubdistricts.map(s => {
          // ✅ ดึงข้อมูลจังหวัดและอำเภอจาก districts lookup โดย match ชื่ออำเภอ
          const distInfo = districtMap[s.district_name_th] || {};
          return {
            name_th: s.name_th,
            name: s.name_th,
            total_reports: 0,
            province_name: distInfo.province_name_th || s.province_name_th || "-",
            district_name: distInfo.district_name_th || s.district_name_th || "-"
          };
        });
      } else if (tableLevel === "service") {
        // ✅ กรองหน่วยบริการตามที่เลือก (service) หรือตามตำบลที่เลือก
        // ใช้ตัวแปร filteredServices ร่วมกับ tableLookupMap
        if (!filteredServices || filteredServices.length === 0) {
          filteredServices = healthServicesRef.current || [];
        }
        if (service) {
          // User เลือกหน่วยบริการเอง - แสดงเฉพาะหน่วยบริการที่เลือก
          const serviceData = (healthServicesRef.current || []).find(s => String(s.id || s.code) === service);
          if (serviceData) {
            filteredServices = [serviceData];
          }
        } else if (subdistrict) {
          const subdistData = subdistrictsRef.current.find(s => String(s.code || s.id) === subdistrict);
          if (subdistData) {
            filteredServices = (healthServicesRef.current || []).filter(svc =>
              (svc.subdistrict?.name_th === subdistData.name_th) ||
              (String(svc.subdistrict?.code || "") === String(subdistrict))
            );
          }
        }
        tableItems = filteredServices.map(s => ({
          name_th: s.name_th || s.name || s.service_name || "ไม่ระบุ",
          name: s.name_th || s.name || s.service_name || "ไม่ระบุ",
          total_reports: 0,
          province_name: s.province?.name_th || s.province_name_th || "-",
          district_name: s.district?.name_th || s.district_name_th || "-",
          subdistrict_name: s.subdistrict?.name_th || s.subdistrict_name_th || "-",
          id: s.id || s.code || ""
        }));
      } else if (tableLevel === "osm") {
        // ✅ แสดง OSM ตามหน่วยบริการที่เลือก
        tableItems = osmData.map(osm => ({
          name_th: osm.full_name || osm.name_th || osm.firstname + " " + (osm.lastname || ""),
          name: osm.full_name || osm.name_th || osm.firstname + " " + (osm.lastname || ""),
          total_reports: 0,
          province_name: osm.province_name_th || "-",
          id: osm.id || ""
        }));
      }

      // นับจำนวนรายงานสำหรับ table_items
      // สร้าง lookup map เพื่อให้ match ได้ง่ายขึ้น
      const tableLookupMapByCode = {};
      const tableLookupMapByName = {};

      if (tableLevel === "zone") {
        healthAreasRef.current.forEach(area => {
          const code = String(area.code);
          tableLookupMapByCode[code] = area.name_th;
          tableLookupMapByName[area.name_th] = code;
        });
      } else if (tableLevel === "province") {
        provincesRef.current.forEach(p => {
          const code = String(p.code || p.id);
          tableLookupMapByCode[code] = p.name_th;
          tableLookupMapByName[p.name_th] = code;
        });
      } else if (tableLevel === "district") {
        districtsRef.current.forEach(d => {
          const code = String(d.code || d.id);
          tableLookupMapByCode[code] = d.name_th;
          tableLookupMapByName[d.name_th] = code;
        });
      } else if (tableLevel === "subdistrict") {
        subdistrictsRef.current.forEach(s => {
          const code = String(s.code || s.id);
          tableLookupMapByCode[code] = s.name_th;
          tableLookupMapByName[s.name_th] = code;
        });
      } else if (tableLevel === "service") {
        // ✅ ใช้ filteredServices ที่กรองแล้ว (เหมือน tableItems)
        filteredServices.forEach(s => {
          const id = String(s.id || s.code || "");
          const name = s.name_th || s.name || s.service_name || "";
          tableLookupMapByCode[id] = name;
          tableLookupMapByName[name] = id;
        });
      } else if (tableLevel === "osm") {
        osmData.forEach(osm => {
          const id = String(osm.id || "");
          const name = osm.full_name || osm.name_th || osm.firstname + " " + (osm.lastname || "");
          tableLookupMapByCode[id] = name;
          tableLookupMapByName[name] = id;
        });
      }

      const tableReportCountMap = {};
      mapReports.forEach(r => {
        let key = null;

        if (tableLevel === "zone") {
          const provinceName = r.province_name_th;
          if (provinceName) {
            const zoneData = HEALTHZONE_PROVINCES.find(z =>
              z.provinces.some(p => p.trim() === provinceName.trim())
            );
            if (zoneData) {
              key = `HA${zoneData.zone}`;
            }
          }
        } else if (tableLevel === "province") {
          const provinceName = r.province_name_th;
          if (provinceName) {
            key = tableLookupMapByName[provinceName];
          }
        } else if (tableLevel === "district") {
          const districtName = r.district_name_th;
          if (districtName) {
            key = tableLookupMapByName[districtName];
          }
        } else if (tableLevel === "subdistrict") {
          const subdistrictName = r.subdistrict_name_th;
          if (subdistrictName) {
            key = tableLookupMapByName[subdistrictName];
          }
        } else if (tableLevel === "service") {
          // ✅ สำหรับ service level - ใช้ health_service_id จากรายงาน
          const serviceId = r.health_service_id;
          if (serviceId) {
            key = String(serviceId);
          }
        } else if (tableLevel === "osm") {
          // ✅ สำหรับ OSM level - ใช้ external_user_id จากรายงาน
          const osmId = r.external_user_id;
          if (osmId) {
            key = String(osmId);
          }
        }

        if (key) {
          tableReportCountMap[key] = (tableReportCountMap[key] || 0) + 1;
        }
      });

      // Merge จำนวนรายงานเข้ากับ table_items
      tableItems.forEach(item => {
        // สำหรับ service/osm level ใช้ id แทน name
        let itemKey;
        if (tableLevel === "service" || tableLevel === "osm") {
          itemKey = String(item.id);
        } else {
          itemKey = tableLookupMapByName[item.name_th];
        }
        // ใช้ || 0 เพื่อให้แน่ใจว่าถ้าไม่มีข้อมูลจะเป็น 0
        item.total_reports = itemKey ? (tableReportCountMap[itemKey] || 0) : 0;
      });

      setProvinceSummary({
        map_level: mapLevel,
        map_items: mapItems,
        table_level: tableLevel,
        table_items: tableItems,
        total_reports: mapReports.length,
        total_items: finalItems.length,
        items: finalItems,
        location_data: mapReports
      });

    } catch (err) {
      console.error("Error fetching data:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone, province, district, subdistrict, service, year, month, selectedReportType, lockLevel, getInitialFilters]);

  // ค้นหาอัตโนมัติเมื่อ filter เปลี่ยน
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // กดค้นหา (เผื่อผู้ใช้ต้องการกดค้นหาเอง)
  const handleSearch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Handle province click on map
  const handleProvinceClick = useCallback(
    (data) => {
      // หา province code จากชื่อจังหวัด
      const foundProv = provinces.find(p => p.name_th === data.province);
      if (foundProv) {
        handleProvinceChange(String(foundProv.code || foundProv.id));
      }
      // หา zone code
      handleZoneChange(String(data.zone));
      handleSearch();
    },
    [handleSearch, provinces, handleProvinceChange, handleZoneChange]
  );

  // สร้างข้อมูล Pie Chart แบบ Dynamic ตาม map_level (ใช้ map_items จาก backend)
  const chartPieData = useMemo(() => {
    if (!provinceSummary || !provinceSummary.map_items) {
      return [];
    }

    const mapLevel = provinceSummary.map_level || "province";

    // ✅ ตรวจสอบว่าต้องใช้ค่า display หรือไม่
    // 1. ถ้าทุก items มี total_reports = 0 ต้องใช้ค่า 1 ให้แสดงสีได้
    // 2. ถ้ามี items เพียง 1 ตัว ต้องใช้ค่า 1 เพื่อให้แสดงสีได้ (ไม่ว่าค่าจะเท่าไหร่)
    const allZeros = provinceSummary.map_items.every(item => item.total_reports === 0);
    const hasSingleItem = provinceSummary.map_items.length === 1;
    const useDisplayValue = allZeros || hasSingleItem;

    // ใช้ map_items จาก backend โดยตรง
    return provinceSummary.map_items.map((item, idx) => {
      let color;
      if (mapLevel === "zone") {
        // ✅ สำหรับ zone level - ใช้เลขเขตจาก code (HA1, HA2, ...) เพื่อเลือกสีที่ถูกต้อง
        const zoneMatch = String(item.code || "").match(/HA?(\d+)/);
        const zoneNum = zoneMatch ? parseInt(zoneMatch[1]) : 0;
        color = ZONE_COLORS[zoneNum] || "#999";
      } else {
        color = ZONE_COLORS[idx % ZONE_COLORS.length] || "#999";
      }

      // ✅ ถ้าต้องการค่า display (กรณี allZeros หรือ singleItem) ให้ใช้ค่า 1
      // ถ้ามีบาง items มีค่ามากกว่า 0 และมีมากกว่า 1 item ให้ใช้ค่าจริง
      const displayValue = useDisplayValue ? 1 : item.total_reports;

      return {
        name: item.name_th || item.name || "ไม่ระบุ",
        value: displayValue,
        // เก็บค่าจริงไว้แสดงในตัวเลขรวม
        actualValue: item.total_reports,
        color,
      };
    });
  }, [provinceSummary]);

  // คำนวณค่ารวมสำหรับกลาง Pie Chart (ใช้ actualValue เพื่อแสดงค่าจริง)
  const chartSummaryValue = useMemo(() => {
    return chartPieData
      .reduce((sum, p) => sum + (p.actualValue || 0), 0)
      .toLocaleString();
  }, [chartPieData]);

  // สร้างข้อมูลตารางแบบ Dynamic ตาม table_level (ใช้ table_items จาก backend โดยตรง)
  const tableData = useMemo(() => {
    if (!provinceSummary || !provinceSummary.table_items) {
      return [];
    }

    // ใช้ table_items จาก backend โดยตรง (backend สรุปข้อมูลมาให้แล้ว)
    return provinceSummary.table_items.map((item) => ({
      name: item.name_th || item.name || "ไม่ระบุ",
      total_reports: item.total_reports,
      province_name: item.province_name || "-",
      zone_name: item.zone_name || "-",
      district_name: item.district_name || "-",
      subdistrict_name: item.subdistrict_name || "-",
    }));
  }, [provinceSummary]);

  // ✅ สร้างรายชื่อสำหรับแสดงสีบนแผนที่ (ใช้ map_items)
  // สำหรับ district/subdistrict level - จะหาจังหวัดที่เกี่ยวข้องเพื่อ highlight บนแผนที่
  const provincesWithData = useMemo(() => {
    if (!provinceSummary || !provinceSummary.map_items) {
      return [];
    }

    const mapLevel = provinceSummary.map_level || "province";

    if (mapLevel === "zone") {
      // ✅ สำหรับ zone level - หาจังหวัดทั้งหมดในเขตที่มีข้อมูล
      // เพื่อให้ MapThailandService สามารถ highlight จังหวัดได้
      const provinceSet = new Set();
      provinceSummary.map_items.forEach(item => {
        // item.code คือ "HA1", "HA2" ฯลฯ
        const zoneMatch = String(item.code || "").match(/HA?(\d+)/);
        if (zoneMatch) {
          const zoneNum = parseInt(zoneMatch[1]);
          // หาจังหวัดทั้งหมดในเขตนี้จาก HEALTHZONE_PROVINCES
          const zoneData = HEALTHZONE_PROVINCES.find(z => z.zone === zoneNum);
          if (zoneData) {
            zoneData.provinces.forEach(prov => provinceSet.add(prov));
          }
        }
      });
      return Array.from(provinceSet);
    } else if (mapLevel === "province") {
      // แสดงชื่อจังหวัดทั้งหมดที่มีใน map_items
      return provinceSummary.map_items.map(item => item.name_th || item.name);
    } else if (mapLevel === "district") {
      // ✅ สำหรับ district level - หาจังหวัดที่เกี่ยวข้องกับอำเภอเหล่านั้น
      // โดยใช้ province_name จาก table_items หรือ map_items
      const provinceSet = new Set();
      provinceSummary.table_items?.forEach(item => {
        if (item.province_name) {
          provinceSet.add(item.province_name);
        }
      });
      // ถ้าไม่มี province_name ให้ใช้จังหวัดที่เลือกจาก filter
      if (provinceSet.size === 0 && province) {
        const foundProv = provinces.find(p => String(p.code || p.id) === province);
        if (foundProv) provinceSet.add(foundProv.name_th);
      }
      return Array.from(provinceSet);
    } else if (mapLevel === "subdistrict") {
      // ✅ สำหรับ subdistrict level - หาจังหวัดที่เกี่ยวข้องกับตำบลเหล่านั้น
      const provinceSet = new Set();
      provinceSummary.table_items?.forEach(item => {
        if (item.province_name) {
          provinceSet.add(item.province_name);
        }
      });
      // ถ้าไม่มี province_name ให้ใช้จังหวัดที่เลือกจาก filter
      if (provinceSet.size === 0 && province) {
        const foundProv = provinces.find(p => String(p.code || p.id) === province);
        if (foundProv) provinceSet.add(foundProv.name_th);
      }
      return Array.from(provinceSet);
    } else {
      return [];
    }
  }, [provinceSummary, province, provinces]);

  // ✅ หาชื่อที่เลือก (สำหรับ zoom แผนที่) - ใช้ map_level
  // สำหรับ district/subdistrict level จะ zoom ไปยังจังหวัดที่เกี่ยวข้อง
  const selectedAreaName = useMemo(() => {
    if (!provinceSummary) return null;

    const mapLevel = provinceSummary.map_level || "province";

    if (mapLevel === "province" && province && provinces.length) {
      const found = provinces.find(p => String(p.code || p.id) === province);
      return found?.name_th || null;
    } else if (mapLevel === "district" && province && provinces.length) {
      // ✅ district level - zoom ไปยังจังหวัดที่เลือก
      const found = provinces.find(p => String(p.code || p.id) === province);
      return found?.name_th || null;
    } else if (mapLevel === "subdistrict" && province && provinces.length) {
      // ✅ subdistrict level - zoom ไปยังจังหวัดที่เลือก
      const found = provinces.find(p => String(p.code || p.id) === province);
      return found?.name_th || null;
    }

    return null;
  }, [provinceSummary, province, provinces]);

  // หาเลขเขต/จังหวัดที่เลือก (สำหรับ zoom แผนที่)
  const selectedZoneNumber = useMemo(() => {
    if (!zone) return null;
    const match = String(zone).match(/\d+/);
    return match ? parseInt(match[0]) : null;
  }, [zone]);

  // สร้างข้อมูลสำหรับ Map (dynamic ตาม map_level)
  const mapCustomOptions = useMemo(() => {
    const mapLevel = provinceSummary?.map_level || "province";

    // ถ้าเป็น zone level ใช้เขตสุขภาพ
    if (mapLevel === "zone") {
      const zoneDataMap = {};
      chartPieData.forEach((item) => {
        const zoneNum = parseInt(item.name.match(/\d+/)?.[0] || "0");
        zoneDataMap[zoneNum] = {
          value: item.actualValue,
          color: item.color,
          percent: (
            (item.actualValue /
              (chartPieData.reduce((sum, p) => sum + p.actualValue, 0) || 1)) *
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
                    <span style="color: ${zoneData.color};">●</span> เขตสุขภาพ: ${zoneNumber}<br/>
                    จำนวน: <b>${zoneData.value.toLocaleString()}</b><br/>
                    สัดส่วน: <b>${zoneData.percent}%</b>
                  </div>
                `;
              } else {
                return `<b>${this.point.name}</b><br/>เขตสุขภาพ: ${zoneNumber || "-"}`;
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
        // ✅ ไม่ต้องส่ง colorAxis เพราะ MapThailandService จะสร้างให้เอง
        // เราส่งเฉพาะ tooltip เพื่อแสดงข้อมูลที่ถูกต้อง
      };
    }

    // ถ้าเป็น province/district/subdistrict level ให้แสดงเป็นชื่อพื้นที่
    const itemDataMap = {};
    chartPieData.forEach((item, idx) => {
      itemDataMap[item.name] = {
        value: item.actualValue,
        color: item.color,
        percent: (
          (item.actualValue /
            (chartPieData.reduce((sum, p) => sum + p.actualValue, 0) || 1)) *
          100
        ).toFixed(1),
      };
    });

    return {
      tooltip: {
        formatter: function () {
          if (this.point && this.point.name) {
            const itemData = itemDataMap[this.point.name];
            if (itemData) {
              return `
                <div style="padding: 8px;">
                  <b>${this.point.name}</b><br/>
                  จำนวน: <b>${itemData.value.toLocaleString()}</b><br/>
                  สัดส่วน: <b>${itemData.percent}%</b>
                </div>
              `;
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
        max: chartPieData.length - 1,
        dataClasses: chartPieData.map((item, idx) => ({
          from: idx,
          to: idx,
          color: item.color,
          name: item.name,
        })),
      },
    };
  }, [chartPieData, provinceSummary]);

  return (
    <div className="max-w-full mb-8">
      {/* Header */}
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
        {/* ฟิลเตอร์การค้นหา */}
        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-5">
          {/* ฟิลด์ ประเภทปี / ปี / เดือน */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <CustomSelect
              label="ประเภทปี"
              placeholder="เลือกประเภทปี"
              value={yearType}
              onChange={(e) => setYearType(e.target.value)}
              options={YEAR_TYPES}
              icon={Calendar}
            />
            <CustomSelect
              label={yearType === "fiscal" ? "ปี" : "ปี"}
              placeholder="เลือกปี"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              options={YEARS}
              icon={Calendar}
            />
            <CustomSelect
              label="เดือน"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              options={monthOptions}
              placeholder="-- เลือกเดือน --"
              icon={Calendar}
            />
          </div>

          {/* ฟิลด์ เขตสุขภาพ จังหวัด อำเภอ ตำบล หน่วยบริการ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <CustomSelect
              label="เขตสุขภาพ"
              value={zone}
              onChange={(e) => handleZoneChange(e.target.value)}
              options={Array.isArray(healthAreas) ? healthAreas.map(h => ({ label: h.name_th, value: h.code })) : []}
              placeholder="-- เลือกเขตสุขภาพ --"
              icon={MapPin}
              disabled={isLocked('zone')}
            />
            <CustomSelect
              label="จังหวัด"
              value={province}
              onChange={(e) => handleProvinceChange(e.target.value)}
              options={(provinces || []).map((p) => ({
                label: p.name_th || p.name || "ไม่ระบุ",
                value: String(p.code || p.id || "")
              }))}
              placeholder="-- เลือกจังหวัด --"
              icon={MapPin}
              disabled={isLocked('province')}
            />
            <CustomSelect
              label="อำเภอ"
              value={district}
              onChange={(e) => handleDistrictChange(e.target.value)}
              options={(districts || []).map((d) => ({
                label: d.name_th || d.name || "ไม่ระบุ",
                value: String(d.code || d.id || "")
              }))}
              placeholder="-- เลือกอำเภอ --"
              icon={MapPin}
              disabled={isLocked('district') || isDistrictDisabled}
            />
            <CustomSelect
              label="ตำบล"
              value={subdistrict}
              onChange={(e) => handleSubdistrictChange(e.target.value)}
              options={(subdistricts || []).map((s) => ({
                label: s.name_th || s.name || "ไม่ระบุ",
                value: String(s.code || s.id || "")
              }))}
              placeholder="-- เลือกตำบล --"
              icon={MapPin}
              disabled={isLocked('subdistrict') || isSubdistrictDisabled}
            />
            <CustomSelect
              label="หน่วยบริการ"
              value={service}
              onChange={(e) => handleServiceChange(e.target.value)}
              options={(healthServices || []).map((s) => ({
                label: s.name_th || s.name || s.service_name || "ไม่ระบุ",
                value: String(s.id || s.code || "")
              }))}
              placeholder="-- เลือกหน่วยบริการ --"
              icon={Building2}
              disabled={isLocked('service') || isServiceDisabled}
            />
          </div>

          {/* เลือกประเภทรายงาน */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ประเภทรายงาน
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              <button
                onClick={() => setSelectedReportType("")}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  selectedReportType === ""
                    ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md"
                    : "bg-white text-gray-600 border border-purple-200 hover:bg-purple-50"
                }`}
              >
                ทั้งหมด
              </button>
              {REPORT_TYPES.map((rt) => (
                <button
                  key={rt.type}
                  onClick={() => setSelectedReportType(rt.type)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                    selectedReportType === rt.type
                      ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md"
                      : "bg-white text-gray-600 border border-purple-200 hover:bg-purple-50"
                  }`}
                >
                  {rt.name}
                </button>
              ))}
            </div>
          </div>

          {/* ปุ่มค้นหา/ล้าง */}
          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <button
              className="flex-1 flex items-center justify-center gap-2 h-12 px-6 bg-gradient-to-r from-[#7e32e2] to-[#a855f7] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
              onClick={handleSearch}
            >
              <Search size={20} />
              ค้นหา
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-2 h-12 px-6 bg-white border-2 border-[#7e32e2] text-[#7e32e2] font-semibold rounded-xl hover:bg-purple-50 transition-all duration-200"
              onClick={handleClear}
            >
              <RotateCcw size={20} />
              ล้างข้อมูลการค้นหา
            </button>
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

        {/* Summary Cards */}
        {!loading && reportsData && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-purple-600 mb-5 flex items-center gap-2">
              <BarChart2 className="w-6 h-6" />
              ข้อมูลสรุป
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              {/* การ์ดรวมทั้งหมด - แสดงผลรวมของทั้ง 7 ประเภทรายงานเสมอ */}
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
                    {Object.values(reportsData.summary_by_type || {}).reduce((sum, count) => sum + count, 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* การ์ดตามประเภทรายงาน */}
              {/* ถ้าเลือก "ทั้งหมด" แสดงทุกการ์ด, ถ้าเลือกรายงานเฉพาะแสดงเฉพาะการ์ดที่เลือก */}
              {REPORT_TYPES.filter((rt) => !selectedReportType || rt.type === selectedReportType).map((rt) => {
                const count = reportsData.summary_by_type?.[rt.type] || 0;
                const Icon = rt.icon;

                return (
                  <div
                    key={rt.type}
                    className="group relative flex flex-col justify-between bg-gradient-to-br from-white to-purple-50/30 rounded-2xl shadow-md hover:shadow-2xl border border-purple-100 p-5 min-h-[130px] transition-all duration-300 hover:scale-105 hover:border-purple-300 cursor-pointer overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-200/20 to-transparent rounded-bl-full"></div>
                    <div className="flex items-start gap-3 relative z-10">
                      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-[13px] font-semibold text-gray-700 line-clamp-2 leading-tight pt-1">
                        {rt.name}
                      </span>
                    </div>
                    <div className="mt-4 flex items-end justify-between relative z-10">
                      <span className="text-[28px] font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                        {count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main chart section */}
        {!loading && reportsData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-12">
            {/* Map */}
            <div
              className="bg-gradient-to-br from-white to-purple-50/20 rounded-2xl shadow-lg hover:shadow-2xl border border-purple-100 p-6 flex flex-col transition-all duration-300"
              style={{ minHeight: 620 }}
            >
              <div className="font-bold text-purple-600 text-lg mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {provinceSummary?.map_level === "zone" && "แผนที่เขตสุขภาพ"}
                {provinceSummary?.map_level === "province" && "แผนที่จังหวัด"}
                {provinceSummary?.map_level === "district" && "แผนที่อำเภอ"}
                {provinceSummary?.map_level === "subdistrict" && "แผนที่ตำบล"}
                {!provinceSummary?.map_level && "แผนภาพ"}
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full" style={{ minHeight: 600 }}>
                  <MapThailandComponent
                    height={600}
                    customOptions={mapCustomOptions}
                    onProvinceClick={handleProvinceClick}
                    provincesWithData={provincesWithData}
                    zoomToZone={selectedZoneNumber}
                    zoomToProvince={selectedAreaName}
                    mapLevel={provinceSummary?.map_level || "province"}
                  />
                </div>
              </div>
            </div>

            {/* Pie Chart + Legend */}
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
                        data={chartPieData}
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
                      <Tooltip />
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

              {/* Legend */}
              <div
                className="bg-gradient-to-br from-white to-purple-50/20 rounded-2xl shadow-lg hover:shadow-2xl border border-purple-100 p-6 flex flex-col transition-all duration-300"
                style={{ minHeight: 240 }}
              >
                <div className="font-bold text-purple-600 text-lg mb-4 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5" />
                  {provinceSummary?.map_level === "zone" && "ข้อมูลแยกตามเขตสุขภาพ"}
                  {provinceSummary?.map_level === "province" && "ข้อมูลแยกตามจังหวัด"}
                  {provinceSummary?.map_level === "district" && "ข้อมูลแยกตามอำเภอ"}
                  {provinceSummary?.map_level === "subdistrict" && "ข้อมูลแยกตามตำบล"}
                  {!provinceSummary?.map_level && "ข้อมูลแยกตามพื้นที่"}
                </div>
                <div className="w-full border-t border-purple-100 pt-5">
                  <div className="flex flex-wrap gap-x-8 gap-y-2">
                    <div className="flex flex-col gap-2 flex-1 min-w-[150px]">
                      {chartPieData.slice(0, 7).map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block w-3 h-3 rounded-full border border-white shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-[15px] font-semibold text-[#231d37]">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-[15px] text-[#7e32e2] font-bold shrink-0 ml-4">
                            {item.actualValue.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col gap-2 flex-1 min-w-[150px]">
                      {chartPieData.slice(7).map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block w-3 h-3 rounded-full border border-white shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-[15px] font-semibold text-[#231d37]">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-[15px] text-[#7e32e2] font-bold shrink-0 ml-4">
                            {item.actualValue.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table section */}
        {!loading && provinceSummary && (
          <div className="bg-gradient-to-br from-white to-purple-50/20 rounded-2xl shadow-lg border border-purple-100 p-6 mt-8">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-purple-600 flex items-center gap-2">
                <FileText className="w-6 h-6" />
                {provinceSummary.table_level === "zone" && "ตารางข้อมูลรายละเอียดตามเขตสุขภาพ"}
                {provinceSummary.table_level === "province" && "ตารางข้อมูลรายละเอียดตามจังหวัด"}
                {provinceSummary.table_level === "district" && "ตารางข้อมูลรายละเอียดตามอำเภอ"}
                {provinceSummary.table_level === "subdistrict" && "ตารางข้อมูลรายละเอียดตามตำบล"}
                {provinceSummary.table_level === "service" && "ตารางข้อมูลรายละเอียดตามหน่วยบริการ"}
                {provinceSummary.table_level === "osm" && "ตารางข้อมูลรายละเอียดตามอสม."}
                {!provinceSummary.table_level && "ตารางข้อมูลรายละเอียด"}
              </h2>
            </div>
            <TableWithPagination
              data={tableData}
              defaultItemsPerPage={10}
              tableLevel={provinceSummary.table_level || "province"}
            />
          </div>
        )}

        {/* No Data State */}
        {!loading && !reportsData && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
            <Activity className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">ไม่มีข้อมูล</h3>
            <p className="text-gray-600">
              กรุณาตรวจสอบการเชื่อมต่อ API หรือลองค้นหาใหม่อีกครั้ง
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardSobos;
