import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Download,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  FileText,
  Heart,
  Users,
  Calendar,
  MapPin,
} from "lucide-react";
import CustomSelect from "@services/customSelectService/customSelectService";
import {
  getHealthRecordsAdminPage,
  getHealthRecordsAdminSummary,
  getAllHealthRecordsAdmin,
} from "@services/healthRecordService";
import { exportHealthRecordToPDF } from "./OsmHealthDetail/OsmHealthDetail";
import oauth2Service from "@services/oauth2Service";
import XLSX from "xlsx-js-style";
import {
  getCurrentFiscalYear,
  generateFiscalYearOptions,
  getCurrentMonth,
  getFiscalYearRange,
  getCalendarYearRange,
  getDisplayYearForFiscalMonth,
} from "@utils/fiscalYearHelper";
import { usePermissionFilters } from "@hooks/usePermissionFilters";
import { useUserPermission } from "@context/UserPermissionProvider";

// Thai month names
const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
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

/**
 * แปลงวันที่เป็นรูปแบบไทย
 * @param {string} dateString - ISO date string
 * @returns {string} - วันที่ในรูปแบบ "DD เดือน YYYY"
 */
const formatThaiDate = (dateString) => {
  if (!dateString) return "-";

  const date = new Date(dateString);
  const day = date.getDate();
  const month = THAI_MONTHS[date.getMonth()];
  const year = date.getFullYear() + 543; // แปลงเป็น พ.ศ.

  return `${day} ${month} ${year}`;
};

/**
 * คำนวณช่วงวันที่ (ISO) สำหรับส่งให้ API กรองตาม created_at
 * @param {string} year - ปี พ.ศ.
 * @param {string} yearType - "fiscal" | "calendar"
 * @param {string} month - "01"-"12" (ว่าง = ทั้งปี)
 * @returns {{start_date?: string, end_date?: string}}
 */
function getDateRange(year, yearType, month) {
  if (!year) return {};
  const yearNum = parseInt(year);

  if (month) {
    const monthNum = parseInt(month);
    const buddhistYear = yearType === "fiscal"
      ? getDisplayYearForFiscalMonth(yearNum, month)
      : yearNum;
    const gregorianYear = buddhistYear - 543;
    return {
      start_date: new Date(gregorianYear, monthNum - 1, 1).toISOString(),
      end_date: new Date(gregorianYear, monthNum, 0, 23, 59, 59, 999).toISOString(),
    };
  }

  const { startDate, endDate } = yearType === "fiscal"
    ? getFiscalYearRange(yearNum)
    : getCalendarYearRange(yearNum);
  endDate.setHours(23, 59, 59, 999);
  return {
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
  };
}

// Health zone mapping - maps province_id to health_region (เขตสุขภาพ)
// ใช้ province_id (code) เพื่อหาว่าจังหวัดนั้นอยู่ในเขตสุขภาพไหน
// อ้างอิงจาก /lookups/health-areas API
const HEALTH_ZONE_MAP = {
  // เขตสุขภาพ 1: เชียงราย, เชียงใหม่, น่าน, พะเยา, แพร่, แม่ฮ่องสอน, ลำปาง, ลำพูน
  "57": 1, "50": 1, "55": 1, "56": 1, "54": 1, "58": 1, "52": 1, "51": 1,
  // เขตสุขภาพ 2: ตาก, พิษณุโลก, เพชรบูรณ์, สุโขทัย, อุตรดิตถ์
  "63": 2, "65": 2, "67": 2, "64": 2, "53": 2,
  // เขตสุขภาพ 3: กำแพงเพชร, ชัยนาท, นครสวรรค์, พิจิตร, อุทัยธานี
  "62": 3, "18": 3, "60": 3, "66": 3, "61": 3,
  // เขตสุขภาพ 4: นครนายก, นนทบุรี, ปทุมธานี, พระนครศรีอยุธยา, ลพบุรี, สระบุรี, สิงห์บุรี, อ่างทอง
  "26": 4, "12": 4, "13": 4, "14": 4, "16": 4, "19": 4, "17": 4, "15": 4,
  // เขตสุขภาพ 5: กาญจนบุรี, นครปฐม, ประจวบคีรีขันธ์, เพชรบุรี, ราชบุรี, สมุทรสงคราม, สมุทรสาคร, สุพรรณบุรี
  "71": 5, "73": 5, "77": 5, "76": 5, "70": 5, "75": 5, "74": 5, "72": 5,
  // เขตสุขภาพ 6: จันทบุรี, ฉะเชิงเทรา, ชลบุรี, ตราด, ปราจีนบุรี, ระยอง, สมุทรปราการ, สระแก้ว
  "22": 6, "24": 6, "20": 6, "23": 6, "25": 6, "21": 6, "11": 6, "27": 6,
  // เขตสุขภาพ 7: กาฬสินธุ์, ขอนแก่น, มหาสารคาม, ร้อยเอ็ด
  "46": 7, "40": 7, "44": 7, "45": 7,
  // เขตสุขภาพ 8: นครพนม, บึงกาฬ, เลย, สกลนคร, หนองคาย, หนองบัวลำภู, อุดรธานี
  "48": 8, "38": 8, "42": 8, "47": 8, "43": 8, "39": 8, "41": 8,
  // เขตสุขภาพ 9: ชัยภูมิ, นครราชสีมา, บุรีรัมย์, สุรินทร์
  "36": 9, "30": 9, "31": 9, "32": 9,
  // เขตสุขภาพ 10: มุกดาหาร, ยโสธร, ศรีสะเกษ, อำนาจเจริญ, อุบลราชธานี
  "49": 10, "35": 10, "33": 10, "37": 10, "34": 10,
  // เขตสุขภาพ 11: กระบี่, ชุมพร, นครศรีธรรมราช, พังงา, ภูเก็ต, ระนอง, สุราษฎร์ธานี
  "81": 11, "86": 11, "80": 11, "82": 11, "83": 11, "85": 11, "84": 11,
  // เขตสุขภาพ 12: ตรัง, นราธิวาส, ปัตตานี, พัทลุง, ยะลา, สงขลา, สตูล
  "92": 12, "96": 12, "94": 12, "93": 12, "95": 12, "90": 12, "91": 12,
  // เขตสุขภาพ 13: กรุงเทพมหานคร
  "10": 13,
};

/**
 * รหัสจังหวัดทั้งหมดในเขตสุขภาพ (รองรับรหัสเขตแบบ "HA1" หรือ "1")
 */
function getProvinceIdsInZone(zoneCode) {
  const zoneNumber = parseInt(String(zoneCode).replace(/\D/g, ""));
  if (!zoneNumber) return [];
  return Object.keys(HEALTH_ZONE_MAP).filter((code) => HEALTH_ZONE_MAP[code] === zoneNumber);
}

// Excel export: จำกัดจำนวนแถวต่อไฟล์ (ข้อมูลทั้งประเทศระดับล้านรายการ export ใน browser ไม่ไหว)
const EXPORT_MAX_ROWS = 20000;

/**
 * ค้นหา district_id จากชื่ออำเภอภาษาไทย
 */
function findDistrictIdByName(thaiName, districts) {
  if (!thaiName || !districts.length) return null;
  const found = districts.find(d => d.name_th === thaiName);
  return found ? found.code : null;
}

/**
 * ค้นหา subdistrict_id จากชื่อตำบลภาษาไทย
 */
function findSubdistrictIdByName(thaiName, subdistricts) {
  if (!thaiName || !subdistricts.length) return null;
  const found = subdistricts.find(sd => sd.name_th === thaiName);
  return found ? found.code : null;
}

// Pagination helpers
const PER_PAGE_OPTIONS = [
  { value: 10, label: "10" },
  { value: 25, label: "25" },
  { value: 50, label: "50" },
  { value: 100, label: "100" },
];

function PaginationWithPerPage({
  currentPage,
  setCurrentPage,
  totalPages,
  itemsPerPage,
  setItemsPerPage,
  totalItems = 0,
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

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

  return (
    <div className="flex flex-row items-center justify-between gap-3 mt-6 pt-6 border-t-2 border-purple-100 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
          แสดง
        </span>
        <div className="relative">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
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

      {totalItems > 0 && (
        <div className="text-xs font-medium text-gray-700 whitespace-nowrap">
          รวม{" "}
          <span className="font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
            {totalItems.toLocaleString("th-TH")}
          </span>{" "}
          รายการ
        </div>
      )}

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
                onClick={() => setCurrentPage(1)}
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
                onClick={() => setCurrentPage(currentPage - 1)}
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
                        onClick={() => setCurrentPage(page)}
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
                onClick={() => setCurrentPage(currentPage + 1)}
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
                onClick={() => setCurrentPage(totalPages)}
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
  );
}

const OsmHealthComp = () => {
  const currentFiscalYear = getCurrentFiscalYear();

  const YEAR_TYPES = [
    { label: "ปีงบประมาณ", value: "fiscal" },
    { label: "รายปี", value: "calendar" },
  ];

  const YEARS = generateFiscalYearOptions(currentFiscalYear - 4, currentFiscalYear);

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Use permission-based filters
  const { lockLevel, getInitialFilters } = useUserPermission();
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
    filtersReady,
  } = usePermissionFilters({
    defaultYear: String(currentFiscalYear),
    defaultYearType: "fiscal",
    defaultMonth: getCurrentMonth(),
  });

  // Data state - เก็บเฉพาะหน้าปัจจุบัน (pagination ทำที่ server)
  const [healthRecords, setHealthRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [yearlyTotal, setYearlyTotal] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const lastQueryKeyRef = useRef(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State for managing citizen ID visibility (key: record.id, value: boolean)
  const [visibleCitizenIds, setVisibleCitizenIds] = useState(new Map());

  // Toggle citizen ID visibility
  const toggleCitizenIdVisibility = (recordId) => {
    setVisibleCitizenIds((prev) => {
      const newMap = new Map(prev);
      newMap.set(recordId, !newMap.get(recordId));
      return newMap;
    });
  };

  // Mask citizen ID (show last 4 digits as ****)
  const maskCitizenId = (citizenId) => {
    if (!citizenId || citizenId.length < 4) return citizenId || "-";
    return citizenId.slice(0, -4) + "****";
  };

  // แปลงข้อมูล location เป็น options สำหรับ CustomSelect (ใช้เฉพาะชื่อภาษาไทย)
  const healthAreaOptions = healthAreas.map(ha => ({
    label: ha.name_th,
    value: ha.code
  }));

  const provinceOptions = provinces.map(p => ({
    label: p.name_th,
    value: p.code
  }));

  const districtOptions = districts.map(d => ({
    label: d.name_th,
    value: d.code
  }));

  const subdistrictOptions = subdistricts.map(sd => ({
    label: sd.name_th,
    value: sd.code
  }));

  const healthServiceOptions = healthServices.map(hs => ({
    label: hs.name_th,
    value: hs.id
  }));

  // Filter ที่ส่งให้ API (ทุกเงื่อนไขกรองที่ SQL)
  const locationParams = React.useMemo(() => {
    const zoneProvinceIds = zone ? getProvinceIdsInZone(zone) : [];

    // หน่วยบริการ 1 แห่งครอบคลุมหลายตำบล: ส่งตำบลที่รับผิดชอบไปด้วย
    // เพื่อให้เจอ record ที่ location_data_resolved เป็น null
    const selectedService = service
      ? healthServices.find((hs) => String(hs.id) === String(service))
      : null;
    const serviceAreaCodes = selectedService
      ? [
          selectedService.subdistrict?.code,
          ...(selectedService.service_areas || []).map((area) => area.subdistrict_code),
        ].filter(Boolean)
      : [];

    return {
      ...(province
        ? { province_id: province }
        : zoneProvinceIds.length > 0 && { province_ids: zoneProvinceIds.join(",") }),
      ...(district && { district_id: district }),
      ...(subdistrict && { subdistrict_id: subdistrict }),
      ...(service && { health_service_id: service }),
      ...(serviceAreaCodes.length > 0 && {
        service_area_codes: [...new Set(serviceAreaCodes)].join(","),
      }),
    };
  }, [zone, province, district, subdistrict, service, healthServices]);

  const monthParams = React.useMemo(
    () => ({ ...locationParams, ...getDateRange(year, yearType, month) }),
    [locationParams, year, yearType, month]
  );
  const yearParams = React.useMemo(
    () => ({ ...locationParams, ...getDateRange(year, yearType, "") }),
    [locationParams, year, yearType]
  );
  const monthQueryKey = JSON.stringify(monthParams);
  const yearQueryKey = JSON.stringify(yearParams);

  // ดึงข้อมูลหน้าปัจจุบัน - นับ total ใหม่เฉพาะตอน filter เปลี่ยน (เปลี่ยนหน้าไม่ต้องนับซ้ำ)
  useEffect(() => {
    if (!filtersReady) return;

    const filtersChanged = lastQueryKeyRef.current !== monthQueryKey;
    if (filtersChanged && currentPage !== 1) {
      setCurrentPage(1); // effect จะรันใหม่ด้วย page 1
      return;
    }
    lastQueryKeyRef.current = monthQueryKey;

    let cancelled = false;
    const fetchPage = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await getHealthRecordsAdminPage({
          ...monthParams,
          page: currentPage,
          page_size: itemsPerPage,
          include_total: filtersChanged,
        });
        if (cancelled) return;
        setHealthRecords(data?.items || []);
        if (filtersChanged) setTotalRecords(data?.total ?? 0);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to fetch health records:", error);
        setHealthRecords([]);
        setTotalRecords(0);
        lastQueryKeyRef.current = null; // ให้นับ total ใหม่รอบหน้า
        setLoadError("โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchPage();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersReady, monthQueryKey, currentPage, itemsPerPage, refreshKey]);

  // สรุปรายปี (นับที่ server ไม่ต้องโหลดข้อมูล)
  useEffect(() => {
    if (!filtersReady) return;

    let cancelled = false;
    getHealthRecordsAdminSummary(yearParams)
      .then((summary) => {
        if (!cancelled) setYearlyTotal(summary?.total_records ?? null);
      })
      .catch((error) => {
        console.error("Failed to fetch health record summary:", error);
        if (!cancelled) setYearlyTotal(null);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersReady, yearQueryKey, refreshKey]);

  // เลือกรายการเดือนตามประเภทปี
  const monthOptions = React.useMemo(() => {
    return yearType === "fiscal" ? FISCAL_MONTHS : MONTHS;
  }, [yearType]);

  // Pagination calculation
  const totalPages = Math.ceil(totalRecords / itemsPerPage);

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

  // Reset filters
  const resetFilters = () => {
    handleReset();
    setCurrentPage(1);
  };

  // Handle search - ดึงข้อมูลล่าสุดใหม่ (filter ยิง API อัตโนมัติอยู่แล้ว)
  const handleSearch = () => {
    lastQueryKeyRef.current = null;
    setRefreshKey((key) => key + 1);
  };

  // Handle download PDF for single record
  const handleDownloadPDF = (record) => {
    try {
      exportHealthRecordToPDF(record);
    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert("เกิดข้อผิดพลาดในการสร้าง PDF กรุณาลองใหม่อีกครั้ง");
    }
  };

  // Handle download Excel for all filtered records
  const handleDownloadExcel = async () => {
    if (isExporting) return;
    try {
      if (totalRecords === 0) {
        alert("ไม่มีข้อมูลที่จะดาวน์โหลด");
        return;
      }

      if (
        totalRecords > EXPORT_MAX_ROWS &&
        !confirm(
          `ข้อมูลมี ${totalRecords.toLocaleString("th-TH")} รายการ ดาวน์โหลดได้สูงสุด ${EXPORT_MAX_ROWS.toLocaleString("th-TH")} รายการล่าสุดต่อไฟล์\n` +
          "ต้องการข้อมูลครบ กรุณาเลือกพื้นที่ให้แคบลง (จังหวัด/อำเภอ/ตำบล)\n\nดาวน์โหลดต่อหรือไม่?"
        )
      ) {
        return;
      }

      setIsExporting(true);
      setOpen(false);
      const filteredRecords = await getAllHealthRecordsAdmin(monthParams, EXPORT_MAX_ROWS);

      // ฟังก์ชันคำนวณอายุ
      const calculateAge = (birthDate) => {
        if (!birthDate) return "-";
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        return age.toString();
      };

      // สร้างที่อยู่แบบเต็ม
      const buildFullAddress = (osmData) => {
        if (!osmData) return "-";
        const parts = [
          osmData.address_number ? `เลขที่ ${osmData.address_number}` : "",
          osmData.village_no ? `หมู่ ${osmData.village_no}` : "",
          osmData.alley ? `ซอย ${osmData.alley}` : "",
          osmData.street ? `ถนน ${osmData.street}` : "",
          osmData.subdistrict_name_th ? `ต.${osmData.subdistrict_name_th}` : "",
          osmData.district_name_th ? `อ.${osmData.district_name_th}` : "",
          osmData.province_name_th ? `จ.${osmData.province_name_th}` : "",
          osmData.postal_code || "",
        ];
        return parts.filter(Boolean).join(" ") || "-";
      };

      // ดึงข้อมูล OSM ทั้งหมดแบบ batch เพื่อลดจำนวน request
      const uniqueUserIds = [...new Set(filteredRecords.map(record => record.external_user_id).filter(Boolean))];
      const osmDataMap = await oauth2Service.getBatch(uniqueUserIds);

      const excelData = filteredRecords.map((record, index) => {
        // ดึงข้อมูล OSM จาก batch result
        const osmData = record.external_user_id ? osmDataMap[record.external_user_id] || null : null;

        const fullName = `${record.prefix || ""}${record.first_name || ""} ${record.last_name || ""}`.trim() || "ไม่ระบุชื่อ";

        // ใช้ข้อมูลจาก OSM ถ้ามี ไม่งั้นใช้ของ record
        const birthDate = osmData?.birth_date || "";
        const age = calculateAge(birthDate);
        const fullAddress = osmData ? buildFullAddress(osmData) : (record.address || "-");

        // แปลงค่าสถานภาพ
        const maritalStatusMap = {
          "single": "โสด",
          "married": "สมรส",
          "divorced": "หย่าร้าง",
          "widowed": "หม้าย"
        };

        // แปลงค่า Yes/No
        const yesNoMap = {
          "yes": "มี",
          "no": "ไม่มี",
          "unknown": "ไม่ทราบ"
        };

        // แปลงค่าความเสี่ยง CV
        const cvRiskMap = {
          "low": "เสี่ยงต่ำ",
          "mid": "เสี่ยงปานกลาง",
          "high": "เสี่ยงสูง"
        };

        // แปลงค่าความเครียด
        const stressMap = {
          "normal": "ไม่มีความเครียด",
          "mid": "เครียดปานกลาง",
          "high": "เครียดสูง"
        };

        // แปลงค่าภาวะซึมเศร้า
        const depressionMap = {
          "ok": "ปกติ",
          "abnormal": "เสี่ยงเป็นโรคซึมเศร้า"
        };

        // แปลงค่าผลตรวจ
        const resultMap = {
          "normal": "ปกติ",
          "abnormal": "ผิดปกติ",
          "neg": "ผลเป็นลบ",
          "pos": "ผลเป็นบวก"
        };

        // แปลงค่า community screening
        const livingMap = {
          "hasCare": "ไม่ได้อยู่คนเดียว/มีคนดูแล",
          "alone": "อยู่คนเดียว/ไม่มีคนดูแล"
        };

        const houseSafetyMap = {
          "safe": "มั่นคงแข็งแรง/ปลอดภัย",
          "unsafe": "ไม่มั่นคง/ไม่ปลอดภัย"
        };

        const incomeMap = {
          "enough": "เพียงพอ",
          "notEnough": "ไม่เพียงพอ"
        };

        return {
          "ลำดับ": index + 1,
          "เลขบัตรประชาชน": osmData?.citizen_id || record.id_card || "-",
          "ชื่อ-นามสกุล": fullName,
          "วัน/เดือน/ปีเกิด": birthDate ? formatThaiDate(birthDate) : "-",
          "อายุ": age,
          "สถานภาพ": maritalStatusMap[osmData?.marital_status || record.marital_status] || osmData?.marital_status || record.marital_status || "-",
          "ที่อยู่": fullAddress,

          // ประวัติสุขภาพ
          "โรคประจำตัว": record.chronic_diseases || "-",
          "แพ้ยา": record.drug_allergies || "-",
          "แพ้อาหาร": record.food_allergies || "-",

          // ประวัติครอบครัว
          "ประวัติครอบครัว - มะเร็ง": yesNoMap[record.family_history_cancer] || "-",
          "ประวัติครอบครัว - เบาหวาน": yesNoMap[record.family_history_diabetes] || "-",
          "ประวัติครอบครัว - ความดันสูง": yesNoMap[record.family_history_hypertension] || "-",
          "ประวัติครอบครัว - หัวใจหลอดเลือด": yesNoMap[record.family_history_cvd] || "-",

          // การตรวจร่างกาย
          "ความดันโลหิตบน": record.blood_pressure_systolic || "-",
          "ความดันโลหิตล่าง": record.blood_pressure_diastolic || "-",
          "ความดันโลหิต": record.blood_pressure_systolic && record.blood_pressure_diastolic
            ? `${record.blood_pressure_systolic}/${record.blood_pressure_diastolic}`
            : "-",
          "น้ำหนัก (กก.)": record.weight || "-",
          "ส่วนสูง (ซม.)": record.height || "-",
          "BMI": record.bmi ? record.bmi.toFixed(2) : "-",
          "รอบเอว (ซม.)": record.waist || "-",

          // การตรวจคัดกรอง
          "ผลตรวจเต้านม": record.bse_result || "-",
          "ความเสี่ยงโรคหัวใจ": cvRiskMap[record.cv_risk_score] || record.cv_risk_score || "-",
          "ภาวะเครียด": stressMap[record.stress_level] || record.stress_level || "-",
          "ภาวะซึมเศร้า": depressionMap[record.depression_2q] || record.depression_2q || "-",

          // ผลตรวจทางห้องปฏิบัติการ
          "น้ำตาลในเลือด (mg/dl)": record.fasting_blood_sugar || "-",
          "ผลตรวจอุจจาระ": resultMap[record.stool_result] || record.stool_result || "-",
          "ผลตรวจ FIT": resultMap[record.fit_result] || record.fit_result || "-",
          "ผลตรวจ HPV": resultMap[record.hpv_result] || record.hpv_result || "-",

          // Community Screening (60+)
          "การอยู่อาศัย": livingMap[record.living_with_care] || record.living_with_care || "-",
          "ลักษณะที่อยู่อาศัย": houseSafetyMap[record.house_safety] || record.house_safety || "-",
          "ความเพียงพอของรายได้": incomeMap[record.income_sufficiency] || record.income_sufficiency || "-",

          // วันที่บันทึก
          "วันที่บันทึก": formatThaiDate(record.updated_at),
          "วันที่สร้าง": formatThaiDate(record.created_at),
        };
        });

      // สร้างหัวข้อรายงาน
      const monthName = month ? (MONTHS.find(m => m.value === month)?.label || "") : "";
      const yearDisplay = year ? (yearType === "fiscal" ? `ปีงบประมาณ ${year}` : `ปี ${parseInt(year) + 543}`) : "";
      const titleText = "ผลตรวจสุขภาพ อสม.";
      const subtitleText = `${monthName ? `เดือน${monthName} ` : ""}${yearDisplay}`;

      // เพิ่มแถวหัวข้อ
      const titleRow = [titleText];
      const subtitleRow = [subtitleText];

      // สร้าง array สำหรับ xlsx_add_json พร้อมหัวข้อ
      const wsData = [
        titleRow,
        subtitleRow,
        Object.keys(excelData[0] || {}),
        ...excelData.map(row => Object.values(row))
      ];

      // สร้าง worksheet ใหม่พร้อมหัวข้อ
      const newWs = XLSX.utils.aoa_to_sheet(wsData);

      // ผสานเซลล์สำหรับหัวข้อ (merge cells สำหรับ title และ subtitle)
      const numCols = Object.keys(excelData[0] || {}).length;
      if (numCols > 0) {
        newWs["!merges"] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } },  // merge แถวแรกทั้งหมด (title)
          { s: { r: 1, c: 0 }, e: { r: 1, c: numCols - 1 } }   // merge แถวที่สองทั้งหมด (subtitle)
        ];
      }

      // เพิ่ม borders ให้ทุกเซลล์
      const range = XLSX.utils.decode_range(newWs["!ref"] || "A1");
      const borderStyle = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" }
      };

      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!newWs[cellAddress]) {
            newWs[cellAddress] = { v: "" };
          }
          if (!newWs[cellAddress].s) {
            newWs[cellAddress].s = {};
          }
          newWs[cellAddress].s.border = borderStyle;

          // จัดรูปแบบหัวข้อหลัก (แถวแรก)
          if (R === 0) {
            newWs[cellAddress].s = {
              ...newWs[cellAddress].s,
              font: { bold: true, sz: 16 },
              alignment: { horizontal: "center", vertical: "center" }
            };
          }

          // จัดรูปแบบหัวข้อรอง - เดือน/ปี (แถวที่ 2)
          if (R === 1) {
            newWs[cellAddress].s = {
              ...newWs[cellAddress].s,
              font: { bold: true, sz: 12 },
              alignment: { horizontal: "center", vertical: "center" }
            };
          }

          // จัดรูปแบบหัวคอลัมน์ (แถวที่ 3)
          if (R === 2) {
            newWs[cellAddress].s = {
              ...newWs[cellAddress].s,
              font: { bold: true, sz: 11 },
              alignment: { horizontal: "center", vertical: "center", wrapText: true }
            };
          }
        }
      }

      // ตั้งความสูงของแถวหัวข้อ
      newWs["!rows"] = [
        { hpt: 30 },  // แถวหัวข้อหลัก
        { hpt: 22 },  // แถวหัวข้อรอง (เดือน/ปี)
        { hpt: 25 },  // แถวหัวคอลัมน์
      ];

      // ตั้งความกว้างของคอลัมน์
      const colWidths = [
        { wch: 8 },   // ลำดับ
        { wch: 18 },  // เลขบัตรประชาชน
        { wch: 25 },  // ชื่อ-นามสกุล
        { wch: 18 },  // วัน/เดือน/ปีเกิด
        { wch: 8 },   // อายุ
        { wch: 12 },  // สถานภาพ
        { wch: 60 },  // ที่อยู่
        { wch: 20 },  // โรคประจำตัว
        { wch: 15 },  // แพ้ยา
        { wch: 15 },  // แพ้อาหาร
        { wch: 15 },  // ประวัติครอบครัว - มะเร็ง
        { wch: 15 },  // ประวัติครอบครัว - เบาหวาน
        { wch: 15 },  // ประวัติครอบครัว - ความดันสูง
        { wch: 20 },  // ประวัติครอบครัว - หัวใจหลอดเลือด
        { wch: 12 },  // ความดันโลหิตบน
        { wch: 12 },  // ความดันโลหิตล่าง
        { wch: 15 },  // ความดันโลหิต
        { wch: 12 },  // น้ำหนัก
        { wch: 12 },  // ส่วนสูง
        { wch: 10 },  // BMI
        { wch: 12 },  // รอบเอว
        { wch: 15 },  // ผลตรวจเต้านม
        { wch: 15 },  // ความเสี่ยงโรคหัวใจ
        { wch: 15 },  // ภาวะเครียด
        { wch: 18 },  // ภาวะซึมเศร้า
        { wch: 15 },  // น้ำตาลในเลือด
        { wch: 15 },  // ผลตรวจอุจจาระ
        { wch: 12 },  // ผลตรวจ FIT
        { wch: 12 },  // ผลตรวจ HPV
        { wch: 25 },  // การอยู่อาศัย
        { wch: 25 },  // ลักษณะที่อยู่อาศัย
        { wch: 18 },  // ความเพียงพอของรายได้
        { wch: 18 },  // วันที่บันทึก
        { wch: 18 },  // วันที่สร้าง
      ];
      newWs["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, newWs, "ผลตรวจสุขภาพ");

      // สร้างชื่อไฟล์ - Format: Health_{month}_{year}.xlsx
      const fileName = monthName
        ? `Health_${monthName}_${year || new Date().getFullYear()}.xlsx`
        : `Health_${year || new Date().getFullYear()}.xlsx`;

      // ดาวน์โหลดไฟล์
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Failed to export Excel:", error);
      alert("เกิดข้อผิดพลาดในการสร้างไฟล์ Excel กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg">
              <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                ผลตรวจสุขภาพ อสม.
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                ข้อมูลผลการตรวจสุขภาพอาสาสมัครสาธารณสุข
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-md border border-purple-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-violet-100 rounded-xl">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">จำนวนผู้ตรวจทั้งหมดรายเดือน</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                  {isLoading ? "..." : totalRecords.toLocaleString("th-TH")}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-md border border-purple-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
                <Heart className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">ข้อมูลทั้งหมดรายปี</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoading ? "..." : (yearlyTotal ?? healthRecords.length).toLocaleString("th-TH")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-5 sm:p-6 mb-6">
          {/* Year Type, Year and Month */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <CustomSelect
              label="ประเภทปี"
              value={yearType}
              onChange={(e) => setYearType(e.target.value)}
              options={YEAR_TYPES}
              icon={Calendar}
              clearable={false}
            />
            <CustomSelect
              label={yearType === "fiscal" ? "ปี" : "ปี"}
              placeholder="เลือกปี"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              options={YEARS}
              icon={Calendar}
              clearable={false}
            />
            <CustomSelect
              label="เดือน"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              options={monthOptions}
              placeholder="-- เลือกเดือน --"
              icon={Calendar}
              clearable={false}
            />
          </div>

          {/* Location Filters: เขตสุขภาพ จังหวัด อำเภอ ตำบล หน่วยบริการ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-5">
            <CustomSelect
              label="เขตสุขภาพ"
              placeholder="เลือกเขต"
              value={zone}
              onChange={(e) => handleZoneChange(e.target.value)}
              options={healthAreaOptions}
              icon={MapPin}
            />
            <CustomSelect
              label="จังหวัด"
              placeholder="เลือกจังหวัด"
              value={province}
              onChange={(e) => handleProvinceChange(e.target.value)}
              options={provinceOptions}
              icon={MapPin}
            />
            <CustomSelect
              label="อำเภอ"
              placeholder="เลือกอำเภอ"
              value={district}
              onChange={(e) => handleDistrictChange(e.target.value)}
              options={districtOptions}
              disabled={isDistrictDisabled}
              icon={MapPin}
            />
            <CustomSelect
              label="ตำบล"
              placeholder="เลือกตำบล"
              value={subdistrict}
              onChange={(e) => handleSubdistrictChange(e.target.value)}
              options={subdistrictOptions}
              disabled={isSubdistrictDisabled}
              icon={MapPin}
            />
            <CustomSelect
              label="หน่วยบริการ"
              placeholder="เลือกหน่วยบริการ"
              value={service}
              onChange={(e) => handleServiceChange(e.target.value)}
              options={healthServiceOptions}
              disabled={isServiceDisabled}
              icon={MapPin}
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleSearch}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search size={20} />
              <span>{isLoading ? "กำลังค้นหา..." : "ค้นหา"}</span>
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-purple-300 text-purple-600 font-semibold rounded-xl hover:bg-purple-50 hover:border-purple-400 transition-all duration-200"
            >
              <X size={20} />
              <span>ล้างข้อมูล</span>
            </button>
          </div>
        </div>

        {/* Results Table Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-5 sm:p-6">
          {/* Title and Download Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                ตารางข้อมูลผลตรวจสุขภาพ อสม.
              </h2>
              <span className="text-sm text-gray-500">
                ({isLoading ? "..." : totalRecords.toLocaleString("th-TH")} รายการ)
              </span>
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setOpen((s) => !s)}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-wait"
              >
                <Download size={18} />
                <span className="hidden sm:inline">
                  {isExporting ? "กำลังเตรียมไฟล์..." : "ดาวน์โหลดเอกสาร"}
                </span>
                <span className="sm:hidden">{isExporting ? "กำลังเตรียม..." : "ดาวน์โหลด"}</span>
                <ChevronDown
                  size={18}
                  className={`transition-transform ${open ? "rotate-180" : ""}`}
                />
              </button>
              {open && (
                <div className="absolute z-30 right-0 mt-2 w-64 bg-white shadow-xl rounded-xl border border-purple-100 py-2 overflow-hidden">
                  <button
                    className="flex items-center w-full px-4 py-3 gap-3 text-gray-700 hover:bg-purple-50 transition font-medium"
                    onClick={handleDownloadExcel}
                  >
                    <Image
                      src="/xlsx.png"
                      alt="Excel icon"
                      width={24}
                      height={24}
                      className="w-6 h-6"
                    />
                    ดาวน์โหลดเอกสาร Excel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#7e32e2]">
                  <th className="py-4 px-3 text-white font-bold text-sm text-left rounded-tl-xl">
                    <span className="inline-flex items-center gap-1">
                      <Users size={14} />
                      รายชื่อ
                    </span>
                  </th>
                  <th className="py-4 px-3 text-white font-bold text-sm text-center">
                    <span className="inline-flex items-center gap-1">
                      เลขบัตรประชาชน
                    </span>
                  </th>
                  <th className="py-4 px-3 text-white font-bold text-sm text-center">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={14} />
                      วันที่
                    </span>
                  </th>
                  <th className="py-4 px-3 text-white font-bold text-sm text-center rounded-tr-xl w-[180px]">
                    <span className="inline-flex items-center gap-1">
                      <Download size={14} />
                      ดาวน์โหลดผลตรวจ
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                        <span>กำลังโหลดข้อมูล...</span>
                      </div>
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-red-500">
                      {loadError}
                    </td>
                  </tr>
                ) : healthRecords.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                ) : (
                  healthRecords.map((record, idx) => {
                    const fullName = `${record.prefix || ""}${record.first_name || ""} ${record.last_name || ""}`.trim() || "ไม่ระบุชื่อ";
                    const recordId = record.id || idx;
                    const isCitizenIdVisible = visibleCitizenIds.get(recordId) || false;
                    const citizenId = record.id_card || "-";

                    return (
                      <tr
                        key={recordId}
                        className="border-b border-purple-50 hover:bg-purple-50/50 transition-colors"
                      >
                        <td className="py-3 px-3 text-gray-800 text-sm font-medium">
                          {fullName}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-gray-700 text-sm font-mono">
                              {isCitizenIdVisible ? citizenId : maskCitizenId(citizenId)}
                            </span>
                            <button
                              onClick={() => toggleCitizenIdVisibility(recordId)}
                              className="text-gray-400 hover:text-purple-600 transition-colors focus:outline-none"
                              title={isCitizenIdVisible ? "ซ่อนเลขบัตร" : "แสดงเลขบัตร"}
                            >
                              {isCitizenIdVisible ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                                  <line x1="2" x2="22" y1="2" y2="22"/>
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                                  <circle cx="12" cy="12" r="3"/>
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center text-gray-600 text-sm">
                          {formatThaiDate(record.created_at || record.updated_at)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleDownloadPDF(record)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 text-purple-600 font-semibold text-sm rounded-lg hover:bg-purple-100 hover:border-purple-300 transition-all"
                          >
                            <Download size={16} />
                            <span className="hidden sm:inline">ดาวน์โหลด</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <PaginationWithPerPage
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            totalItems={totalRecords}
          />
        </div>
      </div>
    </div>
  );
};

export default OsmHealthComp;
