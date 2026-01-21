import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
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

// สี Pie Chart สำหรับ 13 เขต
const ZONE_COLORS = [
  "#6E28B7", "#4B61CF", "#5D86E7", "#4CA3DD",
  "#7C83E1", "#A682FF", "#E0AAFF", "#FFB3E6",
  "#FF9CEE", "#FFB7B2", "#FFDAC1", "#FFB347", "#EB6383"
];

// Table Pagination Component
const TableWithPagination = ({
  data = [],
  defaultItemsPerPage = 5,
  className = "",
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

  return (
    <div className={`w-full ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-[14px]">
          <thead>
            <tr className="bg-[#f6eeff] text-[#7e32e2]">
              <th className="py-3 px-4 font-semibold text-center rounded-tl-xl">
                ลำดับ
              </th>
              <th className="py-3 px-4 font-semibold text-center">จังหวัด</th>
              <th className="py-3 px-4 font-semibold text-center">
                จำนวนรายงาน
              </th>
              <th className="py-3 px-4 font-semibold text-center rounded-tr-xl">
                เขตสุขภาพ
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr
                  key={row.province_name || idx}
                  className={`${
                    idx % 2 === 0 ? "bg-white" : "bg-[#f9f6ff]"
                  } hover:bg-[#f0ebff] transition-colors duration-200`}
                >
                  <td className="py-3 px-4 text-center align-middle font-medium">
                    {startItem + idx}
                  </td>
                  <td className="py-3 px-4 text-center align-middle">
                    {row.province_name}
                  </td>
                  <td className="py-3 px-4 text-center align-middle font-medium text-[#7e32e2]">
                    {row.total_reports?.toLocaleString() ?? "0"}
                  </td>
                  <td className="py-3 px-4 text-center align-middle">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {row.zone_name || "-"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="py-8 text-center text-gray-500">
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
  const { isLocked } = useUserPermission();
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

  // ล้างข้อมูลการค้นหา
  const handleClear = () => {
    handleReset(String(currentFiscalYear), "fiscal");
    setSelectedReportType("");
  };

  // เลือกรายการเดือนตามประเภทปี
  const monthOptions = useMemo(() => {
    return yearType === "fiscal" ? FISCAL_MONTHS : MONTHS;
  }, [yearType]);

  // ฟังก์ชันดึงข้อมูลจาก API
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const filters = {};

      // หา name_th จาก code ที่เลือก สำหรับ filter ฝั่ง frontend
      let filterProvinceName = null;
      let filterDistrictName = null;
      let filterSubdistrictName = null;

      if (province) {
        const selectedProvince = provinces.find(p => String(p.code || p.id) === province);
        if (selectedProvince) {
          filterProvinceName = selectedProvince.name_th;
        }
      }

      if (district) {
        const selectedDistrict = districts.find(d => String(d.code || d.id) === district);
        if (selectedDistrict) {
          filterDistrictName = selectedDistrict.name_th;
        }
      }

      if (subdistrict) {
        const selectedSubdistrict = subdistricts.find(s => String(s.code || s.id) === subdistrict);
        if (selectedSubdistrict) {
          filterSubdistrictName = selectedSubdistrict.name_th;
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

      // ไม่กรองตามประเภทรายงานที่ API (เพื่อให้ได้ข้อมูลทั้งหมดสำหรับการ์ดสรุป)
      // filter ตามประเภทรายงานจะทำฝั่ง frontend แทน
      // if (selectedReportType) {
      //   filters.report_type = selectedReportType;
      // }

      filters.limit = 10000;

      // ดึงข้อมูล OSM ตามหน่วยบริการ (ถ้าเลือกหน่วยบริการ)
      let osmData = [];
      if (service) {
        try {
          osmData = await getOsmByHealthService(service);
          console.log("📊 OSM Data received:", osmData.length, "items");
          console.log("🆔 OSM IDs:", osmData.map(o => o.id));
          setOsmDataByService(osmData);
        } catch (err) {
          console.error("Error fetching OSM data:", err);
          setOsmDataByService([]);
        }
      } else {
        setOsmDataByService([]);
      }

      // ดึงข้อมูลจาก 2 APIs พร้อมกัน (ไม่สน selectedReportType เพื่อให้ได้ข้อมูลทั้งหมด)
      const [mapData, summary] = await Promise.all([
        reportsMapService.getReportsMapData(filters),
        reportsMapService.getProvinceSummary(filters),
      ]);

      // Filter ฝั่ง Frontend เพราะ Backend ยังไม่รองรับ
      let filteredReports = mapData.reports || [];
      let filteredSummary = { ...summary };

      // Filter ตามหน่วยบริการ (เฉพาะบริการสุขภาพอสม.)
      // ถ้าเลือกหน่วยบริการ ให้ filter เฉพาะตามหน่วยบริการเท่านั้น (สำคัญสุด)
      // ไม่สน filter อื่นๆ เช่น จังหวัด/อำเภอ/ตำบล
      if (service && osmData.length > 0) {
        console.log("🎯 Service filter enabled (PRIORITY)");
        console.log("📊 Reports before service filter:", filteredReports.length);

        // สร้าง Set ของ OSM IDs เพื่อให้การ lookup เร็วขึ้น
        const osmIdSet = new Set(osmData.map(osm => osm.id));
        console.log("🆔 OSM ID Set (first 5):", Array.from(osmIdSet).slice(0, 5));
        console.log("👥 Total OSMs:", osmIdSet.size);

        // แสดง external_user_id ทั้งหมดของรายงาน
        const allExternalIds = filteredReports.map(r => r.external_user_id).filter(Boolean);
        console.log("📋 All external_user_ids (first 5):", allExternalIds.slice(0, 5));

        // Filter เฉพาะรายงานที่มี external_user_id อยู่ใน osmIdSet
        const beforeFilter = filteredReports.length;
        filteredReports = filteredReports.filter(r => {
          const match = r.external_user_id && osmIdSet.has(r.external_user_id);
          if (!match && r.external_user_id) {
            console.log("❌ No match - external_user_id:", r.external_user_id);
          } else if (match) {
            console.log("✅ Match - external_user_id:", r.external_user_id);
          }
          return match;
        });

        console.log(`✅ Reports after service filter: ${beforeFilter} → ${filteredReports.length}`);

        // ถ้าเลือกหน่วยบริการแล้ว ให้ skip filter ตามพื้นที่ทิ้ง
        // ไปที่สร้าง summary ได้เลย
      } else {
        // ไม่ได้เลือกหน่วยบริการ หรือไม่มีข้อมูล OSM ให้ filter ตามพื้นที่ตามปกติ
        // Filter ตามเขตสุขภาพ
        if (zone) {
          // หาจังหวัดที่อยู่ในเขตสุขภาพที่เลือก
          const zoneNumber = parseInt(String(zone).replace(/\D/g, ''));
          const zoneData = HEALTHZONE_PROVINCES.find(z => z.zone === zoneNumber);
          if (zoneData && zoneData.provinces) {
            const provincesInZone = zoneData.provinces.map(p => p.trim());
            filteredReports = filteredReports.filter(r =>
              provincesInZone.includes(r.province_name_th?.trim())
            );
          }
        }

        // Filter ตามจังหวัด
        if (filterProvinceName) {
          filteredReports = filteredReports.filter(r => r.province_name_th === filterProvinceName);
        }

        // Filter ตามอำเภอ
        if (filterDistrictName) {
          filteredReports = filteredReports.filter(r => r.district_name_th === filterDistrictName);
        }

        // Filter ตามตำบล
        if (filterSubdistrictName) {
          filteredReports = filteredReports.filter(r => r.subdistrict_name_th === filterSubdistrictName);
        }
      }

      // สร้าง summary ทั้งหมดจากข้อมูลที่ filter แล้ว (ก่อน filter ตามประเภทรายงาน)
      const summaryByType = {};
      REPORT_TYPES.forEach(rt => {
        summaryByType[rt.type] = filteredReports.filter(r => r.report_type === rt.type).length;
      });

      // สำหรับแผนที่และตาราง ต้อง filter ตามประเภทรายงาน (ถ้าเลือก)
      let mapReports = [...filteredReports];
      if (selectedReportType) {
        mapReports = filteredReports.filter(r => r.report_type === selectedReportType);
      }

      // สร้าง province summary ใหม่จากข้อมูลที่ filter แล้ว
      const provinceMap = {};
      mapReports.forEach(r => {
        const pName = r.province_name_th || 'ไม่ระบุ';
        if (!provinceMap[pName]) {
          provinceMap[pName] = 0;
        }
        provinceMap[pName]++;
      });

      const filteredProvinces = Object.keys(provinceMap).map(pName => ({
        province_name: pName,
        total_reports: provinceMap[pName]
      }));

      setReportsData({
        ...mapData,
        total_reports: filteredReports.length,
        reports: mapReports,
        summary_by_type: summaryByType
      });
      setProvinceSummary({
        ...filteredSummary,
        total_reports: mapReports.length,
        total_provinces: filteredProvinces.length,
        provinces: filteredProvinces,
        location_data: mapReports
      });
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  }, [zone, province, district, subdistrict, service, year, month, selectedReportType, healthAreas, provinces, districts, subdistricts, healthServices]);

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

  // สร้างข้อมูล Pie Chart จาก API
  const chartPieData = useMemo(() => {
    if (!provinceSummary || !provinceSummary.provinces) {
      return [];
    }

    // นับจำนวนรายงานแต่ละเขต
    const zoneCountMap = {};
    for (let i = 1; i <= 13; i++) {
      zoneCountMap[i] = 0;
    }

    provinceSummary.provinces.forEach((prov) => {
      const provinceName = prov.province_name.trim();

      // หาว่าจังหวัดนี้อยู่ในเขตไหน
      const zone = HEALTHZONE_PROVINCES.find((z) =>
        z.provinces.some((p) => p.trim() === provinceName)
      );

      if (zone) {
        zoneCountMap[zone.zone] += prov.total_reports;
      }
    });

    // สร้าง pieData
    return Object.keys(zoneCountMap).map((zoneNum, idx) => ({
      name: `เขตสุขภาพที่ ${zoneNum}`,
      value: zoneCountMap[zoneNum],
      color: ZONE_COLORS[idx] || "#999",
    }));
  }, [provinceSummary]);

  // คำนวณค่ารวมสำหรับกลาง Pie Chart
  const chartSummaryValue = useMemo(() => {
    return chartPieData
      .reduce((sum, p) => sum + (p.value || 0), 0)
      .toLocaleString();
  }, [chartPieData]);

  // สร้างข้อมูลตารางจังหวัด - แสดงทุกจังหวัดเสมอ
  const tableData = useMemo(() => {
    if (!provinces || provinces.length === 0) {
      return [];
    }

    // สร้าง Map ของจำนวนรายงานต่อจังหวัดจาก provinceSummary
    const reportCountMap = {};
    if (provinceSummary && provinceSummary.provinces) {
      provinceSummary.provinces.forEach((prov) => {
        reportCountMap[prov.province_name.trim()] = prov.total_reports;
      });
    }

    // สร้างข้อมูลตารางจากทุกจังหวัด
    return provinces.map((prov) => {
      const provinceName = prov.name_th || prov.name || "ไม่ระบุ";
      const provinceNameTrimmed = provinceName.trim();

      // หาเขตสุขภาพ
      const zone = HEALTHZONE_PROVINCES.find((z) =>
        z.provinces.some((p) => p.trim() === provinceNameTrimmed)
      );

      return {
        province_name: provinceNameTrimmed,
        total_reports: reportCountMap[provinceNameTrimmed] || 0,
        zone_name: zone ? zone.zoneName : "-",
      };
    });
  }, [provinceSummary, provinces]);

  // สร้างรายชื่อจังหวัดที่ควรแสดงสีบนแผนที่
  // - ถ้าเลือกจังหวัด: แสดงเฉพาะจังหวัดนั้น
  // - ถ้าเลือกเขต: แสดงเฉพาะจังหวัดในเขตนั้น
  // - ถ้าไม่เลือกอะไร: แสดงจังหวัดที่มีข้อมูลรายงาน
  const provincesWithData = useMemo(() => {
    // ถ้าเลือกจังหวัด - แสดงเฉพาะจังหวัดที่เลือก
    if (province && provinces.length) {
      const selectedProv = provinces.find(p => String(p.code || p.id) === province);
      if (selectedProv?.name_th) {
        return [selectedProv.name_th];
      }
    }

    // ถ้าเลือกเขต - แสดงเฉพาะจังหวัดในเขตนั้น
    if (zone) {
      const zoneNumber = parseInt(String(zone).replace(/\D/g, ''));
      const zoneData = HEALTHZONE_PROVINCES.find(z => z.zone === zoneNumber);
      if (zoneData && zoneData.provinces) {
        return zoneData.provinces.map(p => p.trim());
      }
    }

    // ถ้าไม่ได้เลือกเขต/จังหวัด - แสดงจังหวัดที่มีข้อมูลรายงาน
    if (!reportsData || !reportsData.reports) {
      return [];
    }
    const provinceNames = new Set();
    reportsData.reports.forEach(r => {
      if (r.province_name_th) {
        provinceNames.add(r.province_name_th);
      }
    });
    return Array.from(provinceNames);
  }, [reportsData, zone, province, provinces]);

  // หาชื่อจังหวัดที่เลือก (สำหรับ zoom แผนที่)
  const selectedProvinceName = useMemo(() => {
    if (!province || !provinces.length) return null;
    const found = provinces.find(p => String(p.code || p.id) === province);
    return found?.name_th || null;
  }, [province, provinces]);

  // หาเลขเขตที่เลือก (สำหรับ zoom แผนที่)
  const selectedZoneNumber = useMemo(() => {
    if (!zone) return null;
    // zone เก็บเป็น "HA1", "HA2", ... หรือเลข
    const match = String(zone).match(/\d+/);
    return match ? parseInt(match[0]) : null;
  }, [zone]);

  // สร้างข้อมูลสำหรับ Map
  const mapCustomOptions = useMemo(() => {
    const zoneDataMap = {};
    chartPieData.forEach((item) => {
      const zoneNum = parseInt(item.name.match(/\d+/)?.[0] || "0");
      zoneDataMap[zoneNum] = {
        value: item.value,
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
      colorAxis: {
        min: 0,
        max: 13,
        dataClasses: chartPieData
          .map((item) => {
            const zoneNum = parseInt(item.name.match(/\d+/)?.[0] || "0");
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
                แผนภาพ
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full" style={{ minHeight: 600 }}>
                  <MapThailandComponent
                    height={600}
                    customOptions={mapCustomOptions}
                    onProvinceClick={handleProvinceClick}
                    provincesWithData={provincesWithData}
                    zoomToZone={selectedZoneNumber}
                    zoomToProvince={selectedProvinceName}
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
                  ข้อมูลแยกตามเขตสุขภาพ
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
                            {item.value.toLocaleString()}
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
        )}

        {/* Table section */}
        {!loading && provinceSummary && (
          <div className="bg-gradient-to-br from-white to-purple-50/20 rounded-2xl shadow-lg border border-purple-100 p-6 mt-8">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-purple-600 flex items-center gap-2">
                <FileText className="w-6 h-6" />
                ตารางข้อมูลรายละเอียดตามจังหวัด
              </h2>
            </div>
            <TableWithPagination data={tableData} defaultItemsPerPage={10} />
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
