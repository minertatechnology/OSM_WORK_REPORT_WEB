import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";
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
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import MapThailandComponent from "@services/MapThailand/MapThailandService";
import { HEALTHZONE_PROVINCES } from "@utils/healthzone-province-data";
import reportsMapService from "@services/reportsMapService";
import lookupService from "@services/lookupService";

// ปี options
const YEARS = [
  { label: "2568", value: "2568" },
  { label: "2567", value: "2567" },
  { label: "2566", value: "2566" },
];

// เดือน options
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

// เขตสุขภาพ options
const ZONES = HEALTHZONE_PROVINCES.map((zone) => ({
  label: zone.zoneName,
  value: `zone${zone.zone}`,
}));
ZONES.unshift({ label: "ทั้งหมด", value: "" });

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
  const [searchType, setSearchType] = useState("year");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [zone, setZone] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [subdistrict, setSubdistrict] = useState("");
  const [selectedReportType, setSelectedReportType] = useState(""); // ไม่เลือกประเภทรายงานเริ่มต้น = แสดงทั้งหมด

  const [provinceData, setProvinceData] = useState([]);
  const [districtData, setDistrictData] = useState([]);
  const [subdistrictData, setSubdistrictData] = useState([]);
  const [reportsData, setReportsData] = useState(null);
  const [provinceSummary, setProvinceSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // โหลดข้อมูลจังหวัด/อำเภอ/ตำบลจาก lookupService
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        console.log("📍 Loading provinces from lookupService...");
        const provinces = await lookupService.getProvinces();
        console.log("📍 Provinces loaded:", provinces.length, "provinces");

        // แปลงข้อมูลให้ตรงกับ format ที่ใช้ (มี amphure และ tambon)
        const formattedProvinces = provinces.map(p => ({
          id: p.code || p.province_code,
          name_th: p.name_th || p.province_name_th,
          amphure: [], // จะโหลดเมื่อเลือกจังหวัด
        }));

        setProvinceData(formattedProvinces);
      } catch (err) {
        console.error("📍 Error loading provinces:", err);
        setProvinceData([]);
      }
    };

    loadProvinces();
  }, []);

  // โหลดข้อมูลอำเภอเมื่อเลือกจังหวัด
  useEffect(() => {
    if (!province) {
      setDistrictData([]);
      return;
    }

    const loadDistricts = async () => {
      try {
        const foundProv = provinceData.find((p) => p.name_th === province);
        if (!foundProv) return;

        console.log("📍 Loading districts for province:", foundProv.id);
        const districts = await lookupService.getDistricts(foundProv.id);
        console.log("📍 Districts loaded:", districts.length);
        setDistrictData(districts);
      } catch (err) {
        console.error("📍 Error loading districts:", err);
        setDistrictData([]);
      }
    };

    loadDistricts();
  }, [province, provinceData]);

  // โหลดข้อมูลตำบลเมื่อเลือกอำเภอ
  useEffect(() => {
    if (!district) {
      setSubdistrictData([]);
      return;
    }

    const loadSubdistricts = async () => {
      try {
        const foundDist = districtData.find(
          (d) => (d.name_th || d.district_name_th) === district
        );
        if (!foundDist) return;

        console.log("📍 Loading subdistricts for district:", foundDist.code || foundDist.district_code);
        const subdistricts = await lookupService.getSubdistricts(foundDist.code || foundDist.district_code);
        console.log("📍 Subdistricts loaded:", subdistricts.length);
        setSubdistrictData(subdistricts);
      } catch (err) {
        console.error("📍 Error loading subdistricts:", err);
        setSubdistrictData([]);
      }
    };

    loadSubdistricts();
  }, [district, districtData]);

  const provinceOptions = useMemo(() => {
    if (!zone) return [{ label: "เลือกจังหวัด", value: "" }];
    if (!provinceData.length) return [{ label: "เลือกจังหวัด", value: "" }];

    const zoneObj = HEALTHZONE_PROVINCES.find(
      (z) => z.zone === Number(zone.replace("zone", ""))
    );
    if (!zoneObj) return [{ label: "เลือกจังหวัด", value: "" }];

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
    if (!districtData.length) return [{ label: "เลือกอำเภอ", value: "" }];

    return [
      { label: "เลือกอำเภอ", value: "" },
      ...districtData.map((d) => ({
        label: d.name_th || d.district_name_th,
        value: d.name_th || d.district_name_th,
      })),
    ];
  }, [province, districtData]);

  const subdistrictOptions = useMemo(() => {
    if (!province || !district) return [{ label: "เลือกตำบล", value: "" }];
    if (!subdistrictData.length) return [{ label: "เลือกตำบล", value: "" }];

    return [
      { label: "เลือกตำบล", value: "" },
      ...subdistrictData.map((s) => ({
        label: s.name_th || s.subdistrict_name_th,
        value: s.name_th || s.subdistrict_name_th,
      })),
    ];
  }, [province, district, subdistrictData]);

  // ล้างข้อมูลการค้นหา
  const handleClear = () => {
    setYear("");
    setMonth("");
    setZone("");
    setProvince("");
    setDistrict("");
    setSubdistrict("");
    setDistrictData([]);
    setSubdistrictData([]);
    setSelectedReportType("");
  };

  // ฟังก์ชันดึงข้อมูลจาก API
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const filters = {};

      // แปลง province เป็น province_code
      if (province) {
        const foundProv = provinceData.find((p) => p.name_th === province);
        if (foundProv) {
          filters.province_code = foundProv.id.toString();
        }
      }

      if (district) {
        const foundDist = districtData.find(
          (d) => (d.name_th || d.district_name_th) === district
        );
        if (foundDist) {
          filters.district_code = (foundDist.code || foundDist.district_code).toString();
        }
      }

      if (subdistrict) {
        const foundSub = subdistrictData.find(
          (s) => (s.name_th || s.subdistrict_name_th) === subdistrict
        );
        if (foundSub) {
          filters.subdistrict_code = (foundSub.code || foundSub.subdistrict_code).toString();
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

      // กรองตามประเภทรายงาน
      if (selectedReportType) {
        filters.report_type = selectedReportType;
      }

      filters.limit = 10000;

      // ดึงข้อมูลจาก 2 APIs พร้อมกัน
      const [mapData, summary] = await Promise.all([
        reportsMapService.getReportsMapData(filters),
        reportsMapService.getProvinceSummary(filters),
      ]);

      setReportsData(mapData);
      setProvinceSummary(summary);

      console.log("📊 Reports data:", mapData);
      console.log("📊 Province summary:", summary);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  }, [province, district, subdistrict, year, month, selectedReportType, provinceData, districtData, subdistrictData]);

  // โหลดข้อมูลครั้งแรก
  useEffect(() => {
    console.log("🔄 useEffect triggered - provinceData.length:", provinceData.length);
    if (provinceData.length > 0) {
      console.log("✅ Calling fetchData...");
      fetchData();
    } else {
      console.log("⏳ Waiting for province data...");
    }
  }, [provinceData.length, fetchData]);

  // กดค้นหา
  const handleSearch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Handle province click on map
  const handleProvinceClick = useCallback(
    (data) => {
      setProvince(data.province);
      setZone(`zone${data.zone}`);
      handleSearch();
    },
    [handleSearch]
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

  // สร้างข้อมูลตารางจังหวัด
  const tableData = useMemo(() => {
    if (!provinceSummary || !provinceSummary.provinces) {
      return [];
    }

    return provinceSummary.provinces.map((prov) => {
      const provinceName = prov.province_name.trim();

      // หาเขตสุขภาพ
      const zone = HEALTHZONE_PROVINCES.find((z) =>
        z.provinces.some((p) => p.trim() === provinceName)
      );

      return {
        province_name: provinceName,
        total_reports: prov.total_reports,
        zone_name: zone ? zone.zoneName : "-",
      };
    });
  }, [provinceSummary]);

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
          <div className="flex flex-wrap gap-x-6 gap-y-3 items-center mb-4">
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

          {/* ฟิลด์ ปี / เดือน */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
          </div>

          {/* ฟิลด์ เขตสุขภาพ จังหวัด อำเภอ ตำบล */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <CustomSelect
              label="เขตสุขภาพ"
              options={ZONES}
              value={zone}
              onChange={(e) => {
                setZone(e.target.value);
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
          <div className="flex flex-col md:flex-row gap-3">
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

              {/* การ์ดตามประเภทรายงาน (แสดง 7 ประเภท) */}
              {REPORT_TYPES.map((rt) => {
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
                    className="w-full h-full"
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
