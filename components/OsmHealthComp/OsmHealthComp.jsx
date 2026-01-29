import React, { useState, useRef, useEffect, useMemo } from "react";
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
import { getHealthRecords } from "@services/healthRecordService";
import { exportHealthRecordToPDF } from "./OsmHealthDetail/OsmHealthDetail";
import { getOsmById, getOsmByHealthService } from "@services/lookupService";
import * as XLSX from "xlsx";
import {
  getCurrentFiscalYear,
  generateFiscalYearOptions,
  isInFiscalYear,
  isInCalendarYear,
  parseThaiDate,
  isInMonth,
} from "@utils/fiscalYearHelper";
import { usePermissionFilters } from "@hooks/usePermissionFilters";
import { useUserPermission } from "@context/UserPermissionProvider";
import { buildFilterParams, addDateFilters } from "@utils/filterParamsHelper";

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
 * ตรวจสอบว่า province_id อยู่ใน health_zone ที่ระบุหรือไม่
 */
function isInHealthZone(provinceId, healthZone) {
  if (!provinceId || !healthZone) return true;
  const zone = HEALTH_ZONE_MAP[String(provinceId)];
  return zone === healthZone;
}

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

function PaginationWithPerPage({
  currentPage,
  setCurrentPage,
  totalPages,
  itemsPerPage,
  setItemsPerPage,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-purple-100">
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
          className="appearance-none border border-purple-200 rounded-xl px-4 py-2 pr-8 text-sm font-semibold text-purple-600 bg-purple-50 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent hover:border-purple-400 cursor-pointer"
        >
          {PER_PAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-600">รายการต่อหน้า</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className={`hidden sm:flex p-2 rounded-lg transition-all ${
            currentPage === 1
              ? "text-gray-300 cursor-not-allowed"
              : "text-purple-600 bg-purple-50 hover:bg-purple-100"
          }`}
          title="หน้าแรก"
        >
          <ChevronsLeft size={18} />
        </button>
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg transition-all ${
            currentPage === 1
              ? "text-gray-300 cursor-not-allowed"
              : "text-purple-600 bg-purple-50 hover:bg-purple-100"
          }`}
          title="หน้าก่อนหน้า"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="hidden sm:flex items-center gap-1 mx-2">
          {getPageNumbers(currentPage, totalPages).map((page, idx) =>
            page === "..." ? (
              <span key={idx} className="px-2 text-gray-400">
                ...
              </span>
            ) : (
              <button
                key={idx}
                onClick={() => setCurrentPage(page)}
                className={`min-w-[36px] h-9 rounded-lg font-semibold transition-all ${
                  currentPage === page
                    ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md"
                    : "text-purple-600 hover:bg-purple-50"
                }`}
              >
                {page}
              </button>
            )
          )}
        </div>
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg transition-all ${
            currentPage === totalPages
              ? "text-gray-300 cursor-not-allowed"
              : "text-purple-600 bg-purple-50 hover:bg-purple-100"
          }`}
          title="หน้าถัดไป"
        >
          <ChevronRight size={18} />
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className={`hidden sm:flex p-2 rounded-lg transition-all ${
            currentPage === totalPages
              ? "text-gray-300 cursor-not-allowed"
              : "text-purple-600 bg-purple-50 hover:bg-purple-100"
          }`}
          title="หน้าสุดท้าย"
        >
          <ChevronsRight size={18} />
        </button>
        <div className="hidden sm:block ml-3 text-sm text-gray-600 font-medium bg-purple-50 px-3 py-2 rounded-lg">
          หน้า {currentPage} / {totalPages}
        </div>
        <div className="sm:hidden ml-2 text-sm text-gray-600 font-medium">
          {currentPage} / {totalPages}
        </div>
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
  } = usePermissionFilters({ currentFiscalYear });

  // Build filter params for backend API (supports both text and ID)
  const filterParams = useMemo(() => {
    return buildFilterParams({
      zone,
      province,
      district,
      subdistrict,
      health_service_id: service,
      provinces,
      districts,
      subdistricts,
      lockLevel,
      getInitialFilters,
    });
  }, [zone, province, district, subdistrict, service, provinces, districts, subdistricts, lockLevel, getInitialFilters]);

  // Add date filters to params
  const apiParams = useMemo(() => {
    return addDateFilters(filterParams, year, month, yearType);
  }, [filterParams, year, month, yearType]);

  // Data state
  const [healthRecords, setHealthRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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

  // State for OSM data (for service filtering)
  const [osmDataByService, setOsmDataByService] = useState([]);

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

  // Fetch health records on mount
  useEffect(() => {
    const fetchHealthRecords = async () => {
      try {
        setIsLoading(true);
        // ส่ง filterParams ไป backend (รองรับทั้ง text และ ID)
        const data = await getHealthRecords({ limit: 1000, ...apiParams });
        setHealthRecords(data || []);
      } catch (error) {
        console.error("Failed to fetch health records:", error);
        setHealthRecords([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHealthRecords();
  }, [apiParams]); // ดึงข้อมูลใหม่เมื่อ filter เปลี่ยน

  // Fetch OSM data when service is selected
  useEffect(() => {
    const fetchOsmData = async () => {
      if (service) {
        try {
          const osmData = await getOsmByHealthService(service);
          setOsmDataByService(osmData || []);
        } catch (error) {
          console.error("Error fetching OSM data:", error);
          setOsmDataByService([]);
        }
      } else {
        setOsmDataByService([]);
      }
    };
    fetchOsmData();
  }, [service]);

  // เลือกรายการเดือนตามประเภทปี
  const monthOptions = React.useMemo(() => {
    return yearType === "fiscal" ? FISCAL_MONTHS : MONTHS;
  }, [yearType]);

  // Filter health records based on year, month, and location
  const filteredRecords = React.useMemo(() => {
    if (!healthRecords.length) return [];

    return healthRecords.filter((record) => {
      if (!record.updated_at) return false;

      const date = new Date(record.updated_at);

      // Year filtering
      if (year) {
        const yearNum = parseInt(year);
        const matchesYear = yearType === "fiscal"
          ? isInFiscalYear(date, yearNum)
          : isInCalendarYear(date, yearNum);

        if (!matchesYear) {
          return false;
        }
      }

      // Month filtering
      if (month) {
        if (!isInMonth(date, month)) {
          return false;
        }
      }

      // Service filtering (เฉพาะบริการสุขภาพอสม.)
      // ถ้าเลือกหน่วยบริการ ให้ filter เฉพาะตามหน่วยบริการเท่านั้น (สำคัญสุด)
      // ไม่สน filter อื่นๆ เช่น จังหวัด/อำเภอ/ตำบล
      if (service && osmDataByService.length > 0) {
        const osmIdSet = new Set(osmDataByService.map(osm => osm.id));
        if (!record.external_user_id || !osmIdSet.has(record.external_user_id)) {
          return false;
        }
      } else {
        // ใช้ location_data_resolved จาก health record เท่านั้น
        const resolvedData = record.location_data_resolved;

        // ถ้าไม่มี location_data_resolved ให้ return false (ไม่มีข้อมูลตำแหน่ง ไม่สามารถกรองได้)
        if (!resolvedData) {
          return false;
        }

        // Debug: แสดงข้อมูลเมื่อกรอง
        if (zone || province || district || subdistrict) {
          console.log("🔍 Filtering record:", {
            external_user_id: record.external_user_id,
            locationData: {
              district: resolvedData.district,
              subdistrict: resolvedData.subdistrict,
              province: resolvedData.province,
              district_id: resolvedData.district_id,
              subdistrict_id: resolvedData.subdistrict_id,
              province_id: resolvedData.province_id,
              health_area: resolvedData.health_area,
              health_area_id: resolvedData.health_area_id,
            },
            filter: { zone, province, district, subdistrict },
          });
        }

        // ใช้ข้อมูลจาก location_data_resolved เท่านั้น
        const provinceName = resolvedData.province;
        const districtName = resolvedData.district;
        const subdistrictName = resolvedData.subdistrict;
        const provinceId = resolvedData.province_id;
        const districtId = resolvedData.district_id;
        const subdistrictId = resolvedData.subdistrict_id;

        // Debug: แสดงผลลัพธ์การดึงชื่อ
        if (zone || province || district || subdistrict) {
          console.log("📍 Extracted Names:", {
            from: "location_data_resolved",
            provinceName,
            districtName,
            subdistrictName,
            ids: { provinceId, districtId, subdistrictId },
            filter: { zone, province, district, subdistrict },
            selectedItems: {
              province: provinces.find(p => p.code === province),
              district: districts.find(d => d.code === district),
              subdistrict: subdistricts.find(s => s.code === subdistrict),
            },
          });
        }

        // Zone filtering - ใช้ provinceId ที่แปลงได้จากชื่อจังหวัด
        if (zone) {
          const zoneNumber = parseInt(String(zone).replace(/\D/g, ''));
          if (provinceId) {
            const provinceInZone = isInHealthZone(provinceId, zoneNumber);
            if (!provinceInZone) {
              return false;
            }
          } else {
            // ถ้าไม่สามารถแปลงชื่อจังหวัดเป็น ID ได้ ให้ return false
            return false;
          }
        }

        // Province filtering - เปรียบเทียบชื่อโดยตรง
        if (province) {
          const selectedProvince = provinces.find(p => p.code === province);
          if (!selectedProvince || provinceName !== selectedProvince.name_th) {
            return false;
          }
        }

        // District filtering - เปรียบเทียบชื่อโดยตรง (ใช้ resolvedData.district)
        if (district) {
          const selectedDistrict = districts.find(d => d.code === district);
          if (!selectedDistrict || districtName !== selectedDistrict.name_th) {
            return false;
          }
        }

        // Subdistrict filtering - เปรียบเทียบชื่อโดยตรง (ใช้ resolvedData.subdistrict)
        if (subdistrict) {
          const selectedSubdistrict = subdistricts.find(s => s.code === subdistrict);
          if (!selectedSubdistrict || subdistrictName !== selectedSubdistrict.name_th) {
            return false;
          }
        }
      }

      return true;
    });
  }, [healthRecords, year, month, yearType, service, osmDataByService, zone, province, district, subdistrict, provinces, districts, subdistricts]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedData = filteredRecords.slice(
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

  // Reset filters
  const resetFilters = () => {
    handleReset(String(currentFiscalYear), "fiscal");
    setCurrentPage(1);
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
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
    try {
      if (filteredRecords.length === 0) {
        alert("ไม่มีข้อมูลที่จะดาวน์โหลด");
        return;
      }

      // แสดง loading
      const loadingMsg = alert("กำลังเตรียมข้อมูล... กรุณารอสักครู่");

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

      // ดึงข้อมูลจาก OSM API สำหรับทุก record
      const excelData = await Promise.all(
        filteredRecords.map(async (record, index) => {
          // ดึงข้อมูล OSM ถ้ามี external_user_id (ใช้ getOsmById แทน getUserByExternalId)
          let osmData = null;
          if (record.external_user_id) {
            try {
              osmData = await getOsmById(record.external_user_id);
            } catch (error) {
              console.error(`Failed to fetch OSM data for ${record.external_user_id}:`, error);
            }
          }

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
        })
      );

      // สร้าง workbook และ worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "ผลตรวจสุขภาพ");

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
      ws["!cols"] = colWidths;

      // สร้างชื่อไฟล์ด้วยวันที่ปัจจุบัน
      const now = new Date();
      const dateStr = `${now.getDate()}_${now.getMonth() + 1}_${now.getFullYear() + 543}`;
      const fileName = `ผลตรวจสุขภาพ_อสม_${dateStr}.xlsx`;

      // ดาวน์โหลดไฟล์
      XLSX.writeFile(wb, fileName);
      setOpen(false);
    } catch (error) {
      console.error("Failed to export Excel:", error);
      alert("เกิดข้อผิดพลาดในการสร้างไฟล์ Excel กรุณาลองใหม่อีกครั้ง");
    }
  };

  // Handle download PDF for all filtered records
  const handleDownloadAllPDF = async () => {
    try {
      if (filteredRecords.length === 0) {
        alert("ไม่มีข้อมูลที่จะดาวน์โหลด");
        return;
      }

      setOpen(false);

      // แสดงข้อความแจ้งเตือน
      const confirmDownload = window.confirm(
        `คุณต้องการดาวน์โหลด PDF ทั้งหมด ${filteredRecords.length} ไฟล์ใช่หรือไม่?\n\nไฟล์จะถูกดาวน์โหลดทีละไฟล์`
      );

      if (!confirmDownload) return;

      // ดาวน์โหลด PDF ทีละไฟล์
      for (let i = 0; i < filteredRecords.length; i++) {
        const record = filteredRecords[i];
        await exportHealthRecordToPDF(record);

        // หน่วงเวลาเล็กน้อยระหว่างการดาวน์โหลดแต่ละไฟล์
        if (i < filteredRecords.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      alert(`ดาวน์โหลด PDF เสร็จสิ้น (${filteredRecords.length} ไฟล์)`);
    } catch (error) {
      console.error("Failed to export all PDFs:", error);
      alert("เกิดข้อผิดพลาดในการสร้าง PDF กรุณาลองใหม่อีกครั้ง");
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-md border border-purple-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-violet-100 rounded-xl">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">จำนวนผู้ตรวจทั้งหมด</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                  {isLoading ? "..." : filteredRecords.length}
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
                <p className="text-sm text-gray-500">ข้อมูลทั้งหมด</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoading ? "..." : healthRecords.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-md border border-purple-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl">
                <Calendar className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">เดือนปัจจุบัน</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  {month}
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
                ({isLoading ? "..." : filteredRecords.length} รายการ)
              </span>
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setOpen((s) => !s)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <Download size={18} />
                <span className="hidden sm:inline">ดาวน์โหลดเอกสาร</span>
                <span className="sm:hidden">ดาวน์โหลด</span>
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
                  <button
                    className="flex items-center w-full px-4 py-3 gap-3 text-gray-700 hover:bg-purple-50 transition font-medium"
                    onClick={handleDownloadAllPDF}
                  >
                    <Image
                      src="/pdf.png"
                      alt="PDF icon"
                      width={24}
                      height={24}
                      className="w-6 h-6"
                    />
                    ดาวน์โหลดเอกสาร PDF
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
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((record, idx) => {
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
                          {formatThaiDate(record.updated_at)}
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
          />
        </div>
      </div>
    </div>
  );
};

export default OsmHealthComp;
