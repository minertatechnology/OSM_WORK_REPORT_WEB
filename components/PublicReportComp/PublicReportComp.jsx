import React, { useState, useEffect, useMemo } from "react";
import { Search, Download, RotateCcw, Loader2, FileText, MapPin, Building2, Home, Calendar, FileSpreadsheet, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, ChevronDown, Landmark, Globe } from "lucide-react";
import { getHealthAreas, getProvinces, getDistricts, getSubdistricts, getHealthServices } from "@services/lookupService";
import { getPublicOsm1SummaryByLocation } from "@services/publicReportService/publicReportService";
import { generateBangkokPDF, downloadBangkokPDF } from "@services/publicReportService/generateBangkokPDF";
import CustomSelect from "@services/customSelectService/customSelectService";
import { HEALTHZONE_PROVINCES } from "@utils/healthzone-province-data";
import { useUserPermission } from "@context/UserPermissionProvider";
import Swal from "sweetalert2";
import XLSX from "xlsx-js-style";

/**
 * Map API response data to table row format
 * @param {Object} apiData - API response data object
 * @returns {Object} - Mapped table row data
 */
const mapApiDataToTableRow = (apiData) => {
  const row = {
    // Basic info
    quota: apiData.quota || 0,
    reporters: apiData.total_reporters || 0,
    percentage: apiData.reporting_rate || 0,
  };

  // Map activities by activity_id to table columns
  const activityMap = {
    // Health Promotion (5.x)
    "promote_health_1": "hp_1",
    "promote_health_2": "hp_2",
    "promote_health_3": "hp_3",
    "promote_health_4": "hp_4",
    "promote_health_5": "hp_5",
    "promote_health_6": "hp_6",
    "promote_health_7": "hp_7",
    "promote_health_8": "hp_8",
    "promote_health_9": "hp_9",
    "promote_health_10": "hp_10",
    "promote_health_11": "hp_12",  // อสม.เยี่ยมบ้านและให้คำแนะนำผู้พิการด้านการดูแลสุขภาพ (ใช้ค่าจาก promote_health_11)
    // Disease Prevention (6.x)
    "protect_2": "dp_2",
    "protect_3": "dp_3",
    "protect_4": "dp_4",
    "protect_5": "dp_5",
    "protect_6": "dp_6",
    "protect_7": "dp_7",
    // Health Rehabilitation (7.x)
    "recover_1": "hr_1",
    // Consumer Protection (8.x)
    "consumer_1": "cp_1",
    // Community Health (9.x)
    "community_health_1": "ch_1",
    "community_health_2": "ch_2",
    // Support OSM (10.x)
    "family_doc_4": "so_1",       // ไม่มีกลุ่มในความดูแลรับผิดชอบ
    "family_doc_1": "so_2_1",     // (1) ผู้สูงอายุติดบ้านติดเตียง
    "family_doc_2": "so_2_2",     // (2) ผู้ป่วยโรคไม่ติดต่อเรื้อรัง
    "family_doc_3": "so_2_3",     // (3) ผู้ป่วยโรคไตอสม.
    // Rational Drug Use (11.x)
    "statistics_1": "rd_1",
    "statistics_2": "rd_2",
    // Family Doctor Team (12.x)
    // fd_1: "ไม่เป็นทีมหมอครอบครัว" - show "-" (not mapped)
    "doctor_family_1": "fd_2",     // "ช่วยเหลือดูแลผู้ป่วยในชุมชน"
    "doctor_family_2": "fd_3",     // "(1) ช่วยปรับปรุงสิ่งแวดล้อม"
    "doctor_family_3": "fd_4",     // "(2) ให้กำลังใจ ผู้ป่วย"
    // Other Activities (13.x)
    "other_activity_1": "oa_1",
    "other_activity_2": "oa_2",
    "other_activity_3": "oa_3",
  };

  // Initialize all columns with 0 or "-"
  Object.values(activityMap).forEach(colKey => {
    row[colKey] = 0;
  });

  // Map activities from categories
  if (apiData.categories && Array.isArray(apiData.categories)) {
    apiData.categories.forEach(category => {
      if (category.activities && Array.isArray(category.activities)) {
        category.activities.forEach(activity => {
          const tableCol = activityMap[activity.activity_id];
          if (tableCol) {
            row[tableCol] = activity.value || 0;
          }
        });
      }
    });
  }

  return row;
};

// Generate year options (current fiscal year ± 2 years)
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const fiscalYear = currentYear + 543; // Convert to Buddhist era
  const years = [];
  for (let i = -2; i <= 2; i++) {
    const year = fiscalYear + i;
    years.push({ label: `${year}`, value: String(year) });
  }
  return years;
};

// Fiscal month options (Thai budget year: October - September)
const FISCAL_MONTH_OPTIONS = [
  { label: "ตุลาคม", value: "10" },
  { label: "พฤศจิกายน", value: "11" },
  { label: "ธันวาคม", value: "12" },
  { label: "มกราคม", value: "1" },
  { label: "กุมภาพันธ์", value: "2" },
  { label: "มีนาคม", value: "3" },
  { label: "เมษายน", value: "4" },
  { label: "พฤษภาคม", value: "5" },
  { label: "มิถุนายน", value: "6" },
  { label: "กรกฎาคม", value: "7" },
  { label: "สิงหาคม", value: "8" },
  { label: "กันยายน", value: "9" },
];

// Pagination options
const PER_PAGE_OPTIONS = [
  { label: "10", value: 10 },
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
];

// Table column definitions with hierarchical structure
const TABLE_COLUMNS = [
  { id: "no", label: "ลำดับ", rowspan: 3 },
  { id: "province", label: "จังหวัด", rowspan: 3 },
  { id: "quota", label: "จำนวนโควต้า", rowspan: 3, unit: "คน" },
  { id: "reporters", label: "จำนวนผู้รายงาน อสม.1", rowspan: 3, unit: "คน" },
  { id: "percentage", label: "ร้อยละ", rowspan: 3, unit: "คน" },
  {
    id: "health_promotion",
    label: "การส่งเสริมสุขภาพ",
    colspan: 11,
    subColumns: [
      { id: "hp_1", label: "ให้คำแนะนำหญิงตั้งครรภ์ (รายใหม่)", unit: "คน" },
      { id: "hp_2", label: "ค้นหาหญิงตั้งครรภ์อายุต่ำกว่า 15 ปี (รายใหม่)", unit: "คน" },
      { id: "hp_3", label: "ติดตามหญิงตั้งครรภ์ให้ได้รับยาเม็ดเสริมไอโอดีน", unit: "คน" },
      { id: "hp_4", label: "ให้คำแนะนำหญิงหลังคลอด (รายใหม่)", unit: "คน" },
      { id: "hp_5", label: "ไม่สามารถเลี้ยงดูบุตรด้วยนมแม่ครบ 6 เดือน (รายใหม่)", unit: "คน" },
      { id: "hp_6", label: "ติดตามหญิงหลังคลอดในนมบุตร 6 เดือน ให้ได้รับยาเม็ตเสริมไอโอดีน", unit: "คน" },
      { id: "hp_7", label: "ให้คำแนะนำผู้สูงอายุ", unit: "คน" },
      { id: "hp_8", label: "ผู้สูงอายุที่เป็นโรคเรื้อรังและถูกทอดทิ้ง (รายใหม่)", unit: "คน" },
      { id: "hp_9", label: "คัดกรอง ประเมินภาวะสุขภาพผู้สูงอายุ (ภาวะถดถอย 9 ด้าน)", unit: "คน" },
      { id: "hp_10", label: "สร้างความรอบรู้ และให้บริการดูแลสุขภาพตามสภาพปัญหาภาวะถดถอยในแต่ละด้านของผู้สูงอายุ และประสานภาคีเครือข่ายในการดูแลผู้สูงอายุให้มีชีวิตความเป็นอยู่ที่ดี", unit: "คน" },
      { id: "hp_12", label: "ให้คำแนะนำผู้พิการ", unit: "คน" },
    ],
  },
  {
    id: "disease_prevention",
    label: "การเฝ้าระวัง ป้องกัน และควบคุมโรค",
    colspan: 6,
    subColumns: [
      { id: "dp_2", label: "ป้องกัน ควบคุม ไข้เลือดออก", unit: "ครัวเรือน" },
      { id: "dp_3", label: "ป้องกัน ควบคุลไข้หวัดใหญ่", unit: "ครัวเรือน" },
      { id: "dp_4", label: "คัดกรอง ให้คำแนะนำ กลุ่มเสี่ยงโรค (เบาหวาน ความดันโลหิตสูง มะเร็ง)", unit: "คน" },
      { id: "dp_5", label: "ให้คำแนะนำการบริโภคอาหารที่ผสมไอโอดีน", unit: "ครัวเรือน" },
      { id: "dp_6", label: "ให้คำแนะนำลดกินหวาน มัน เค็ม", unit: "ครัวเรือน" },
      { id: "dp_7", label: "สำรวจ เฝ้าระวัง ป้องกันโรคในกลุ่มเป้าหมาย 607 และปักหมุดแจ้งพิกัดกลุ่มเปราะบางในแอปพลิเคชันพันภัย", unit: "คน" },
    ],
  },
  {
    id: "health_rehabilitation",
    label: "การฟื้นฟูสุขภาพ",
    colspan: 1,
    subColumns: [
      { id: "hr_1", label: "เยี่ยมบ้านผู้ป่วยเบาหวาน ความดันโลหิต มะเร็ง ฯลฯ", unit: "ครั้ง" },
    ],
  },
  {
    id: "consumer_protection",
    label: "การคุ้มครองผู้บริโภค",
    colspan: 1,
    subColumns: [
      { id: "cp_1", label: "อาหารปลอดภัย", unit: "ครั้ง" },
    ],
  },
  {
    id: "community_health",
    label: "การจัดการสุขภาพชุมชนและการมีส่วนร่วมในแผนสุขภาพตำบล",
    colspan: 2,
    subColumns: [
      { id: "ch_1", label: "ร่วมเป็นจิตอาสา", unit: "ครั้ง" },
      { id: "ch_2", label: "จัดทำแผนสุขภาพ", unit: "ครั้ง" },
    ],
  },
  {
    id: "support_osm",
    label: "การสนับสนุน อสค.",
    colspan: 4,
    subColumns: [
      { id: "so_1", label: "ไม่มีกลุ่มในความดูแลรับผิดชอบ", unit: "คน", rowspan: 2 },
      { id: "so_2_1", label: "(1) ผู้สูงอายุติดบ้านติดเตียง", unit: "คน", rowspan: 2 },
      { id: "so_2_2", label: "(2) ผู้ป่วยโรคไม่ติดต่อเรื้อรัง", unit: "คน", rowspan: 2 },
      { id: "so_2_3", label: "(3) ผู้ป่วยโรคไตอสม.", unit: "คน", rowspan: 2 },
    ],
  },
  {
    id: "rational_drug_use",
    label: "การใช้ยาอย่างสมเหตุสมผล/ การบริโภคผลิตภัณฑ์สุขภาพ",
    colspan: 2,
    subColumns: [
      { id: "rd_1", label: "ให้ความรู้การใช้ยาที่ถูกต้อง", unit: "ครอบครัว" },
      { id: "rd_2", label: "เฝ้าระวังและให้คำแนะนำการใช้ยาปฏิชีวนะ/ยาชุด", unit: "ครั้ง" },
    ],
  },
  {
    id: "family_doctor_team",
    label: "การเข้าร่วมกับทีมหมอครอบครัว",
    colspan: 4,
    subColumns: [
      { id: "fd_1", label: "ไม่เป็นทีมหมอครอบครัว", unit: "ครั้ง" },
      { id: "fd_2", label: "ช่วยเหลือดูแลผู้ป่วยในชุมชน", unit: "คน" },
      { id: "fd_3", label: "(1) ช่วยปรับปรุงสิ่งแวดล้อม", unit: "ครอบครัว" },
      { id: "fd_4", label: "(2) ให้กำลังใจ ผู้ป่วย", unit: "ครอบครัว" },
    ],
  },
  {
    id: "other_activities",
    label: "กิจกรรมอื่น ๆ",
    colspan: 3,
    subColumns: [
      { id: "oa_1", label: "ชวนลด ละ เลิกบุหรี่", unit: "คน" },
      { id: "oa_2", label: "ไม่สูบและเลิกได้ 6 เดือน", unit: "คน" },
      { id: "oa_3", label: "ร่วมกับเจ้าหน้าที่ในการติดตามผู้ผ่านการบำบัดยาเสพติดในระบบสมัครใจบำบัด โดยการสร้างกระบวนการมีส่วนร่วมของคนในชุมชน", unit: "คน" },
    ],
  },
];

// Export to Excel function using xlsx-js-style
// Thai number conversion
const toThaiNumber = (num) => {
  const thaiNums = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  return String(num).replace(/[0-9]/g, (d) => thaiNums[parseInt(d)]);
};

const exportToExcel = (data, filters, locationLabel) => {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Build header rows matching web table structure
  // Row 1: Main headers with vertical merges (first 5 cols) and horizontal merges (category headers)
  // Row 2: Sub-headers with units for all columns

  // Define column structure for proper array building
  const firstRow = [
    "ลำดับ",
    locationLabel,
    "จำนวนโควต้า\n(คน)",
    "จำนวนผู้รายงาน อสม.1\n(คน)",
    "ร้อยละ\n(คน)",
    // Health Promotion (11 cols)
    "การส่งเสริมสุขภาพ", "", "", "", "", "", "", "", "", "", "",
    // Disease Prevention (6 cols)
    "การเฝ้าระวัง ป้องกัน และควบคุมโรค", "", "", "", "", "",
    // Health Rehabilitation (1 col)
    "การฟื้นฟูสุขภาพ",
    // Consumer Protection (1 col)
    "การคุ้มครองผู้บริโภค",
    // Community Health (2 cols)
    "การจัดการสุขภาพชุมชน", "",
    // Support OSM (4 cols)
    "การสนับสนุน อสค.", "", "", "",
    // Rational Drug Use (2 cols)
    "การใช้ยาอย่างสมเหตุสมผล/ การบริโภคผลิตภัณฑ์สุขภาพ", "",
    // Family Doctor Team (4 cols)
    "การเข้าร่วมกับทีมหมอครอบครัว", "", "", "",
    // Other Activities (3 cols)
    "กิจกรรมอื่น ๆ", "", "",
  ];

  const secondRow = [
    "", "", "", "", "",  // First 5 cols - empty (will be merged vertically)
    // Health Promotion sub-columns (11 cols)
    "ให้คำแนะนำหญิงตั้งครรภ์ (รายใหม่)\n(คน)",
    "ค้นหาหญิงตั้งครรภ์อายุต่ำกว่า 15 ปี (รายใหม่)\n(คน)",
    "ติดตามหญิงตั้งครรภ์ให้ได้รับยาเม็ดเสริมไอโอดีน\n(คน)",
    "ให้คำแนะนำหญิงหลังคลอด (รายใหม่)\n(คน)",
    "ไม่สามารถเลี้ยงดูบุตรด้วยนมแม่ครบ 6 เดือน (รายใหม่)\n(คน)",
    "ติดตามหญิงหลังคลอดในนมบุตร 6 เดือน ให้ได้รับยาเม็ตเสริมไอโอดีน\n(คน)",
    "ให้คำแนะนำผู้สูงอายุ\n(คน)",
    "ผู้สูงอายุที่เป็นโรคเรื้อรังและถูกทอดทิ้ง (รายใหม่)\n(คน)",
    "คัดกรอง ประเมินภาวะสุขภาพผู้สูงอายุ (ภาวะถดถอย 9 ด้าน)\n(คน)",
    "สร้างความรอบรู้ และให้บริการดูแลสุขภาพตามสภาพปัญหาภาวะถดถอยในแต่ละด้านของผู้สูงอายุ และประสานภาคีเครือข่ายในการดูแลผู้สูงอายุให้มีชีวิตความเป็นอยู่ที่ดี\n(คน)",
    "ให้คำแนะนำผู้พิการ\n(คน)",
    // Disease Prevention sub-columns (6 cols)
    "ป้องกัน ควบคุบ ไข้เลือดออก\n(ครัวเรือน)",
    "ป้องกัน ควบคุลไข้หวัดใหญ่\n(ครัวเรือน)",
    "คัดกรอง ให้คำแนะนำ กลุ่มเสี่ยงโรค (เบาหวาน ความดันโลหิตสูง มะเร็ง)\n(คน)",
    "ให้คำแนะนำการบริโภคอาหารที่ผสมไอโอดีน\n(ครัวเรือน)",
    "ให้คำแนะนำลดกินหวาน มัน เค็ม\n(ครัวเรือน)",
    "สำรวจ เฝ้าระวัง ป้องกันโรคในกลุ่มเป้าหมาย 607 และปักหมุดแจ้งพิกัดกลุ่มเปราะบางในแอปพลิเคชันพันภัย\n(คน)",
    // Health Rehabilitation (1 col)
    "เยี่ยมบ้านผู้ป่วยเบาหวาน ความดันโลหิต มะเร็ง ฯลฯ\n(ครั้ง)",
    // Consumer Protection (1 col)
    "อาหารปลอดภัย\n(ครั้ง)",
    // Community Health sub-columns (2 cols)
    "ร่วมเป็นจิตอาสา\n(ครั้ง)",
    "จัดทำแผนสุขภาพ\n(ครั้ง)",
    // Support OSM sub-columns (4 cols) - second row
    "ไม่มีกลุ่มในความดูแลรับผิดชอบ\n(คน)",  // col 26
    "(1) ผู้สูงอายุติดบ้านติดเตียง\n(คน)",  // col 27
    "(2) ผู้ป่วยโรคไม่ติดต่อเรื้อรัง\n(คน)",  // col 28
    "(3) ผู้ป่วยโรคไตอสม.\n(คน)",  // col 29
    // Rational Drug Use sub-columns (2 cols)
    "ให้ความรู้การใช้ยาที่ถูกต้อง\n(ครอบครัว)",
    "เฝ้าระวังและให้คำแนะนำการใช้ยาปฏิชีวนะ/ยาชุด\n(ครั้ง)",
    // Family Doctor Team sub-columns (4 cols)
    "ไม่เป็นทีมหมอครอบครัว\n(ครั้ง)",
    "ช่วยเหลือดูแลผู้ป่วยในชุมชน\n(คน)",
    "(1) ช่วยปรับปรุงสิ่งแวดล้อม\n(ครอบครัว)",
    "(2) ให้กำลังใจ ผู้ป่วย\n(ครอบครัว)",
    // Other Activities sub-columns (3 cols)
    "ชวนลด ละ เลิกบุหรี่\n(คน)",
    "ไม่สูบและเลิกได้ 6 เดือน\n(คน)",
    "ร่วมกับเจ้าหน้าที่ในการติดตามผู้ผ่านการบำบัดยาเสพติดในระบบสมัครใจบำบัด โดยการสร้างกระบวนการมีส่วนร่วมของคนในชุมชน\n(คน)",
  ];

  const headers = [firstRow, secondRow];

  // Build data rows
  const getLocationKeyFromLabel = (label) => {
    if (label === "หน่วยบริการ") return "service";
    if (label === "ตำบล") return "subdistrict";
    if (label === "อำเภอ") return "district";
    return "province";
  };

  const locationKey = getLocationKeyFromLabel(locationLabel);

  const dataRows = data.map((row, idx) => [
    idx + 1,
    row[locationKey] ?? "-",
    row.quota ?? "-",
    row.reporters ?? "-",
    row.percentage ?? "-",
    row.hp_1 ?? "-", row.hp_2 ?? "-", row.hp_3 ?? "-", row.hp_4 ?? "-",
    row.hp_5 ?? "-", row.hp_6 ?? "-", row.hp_7 ?? "-", row.hp_8 ?? "-",
    row.hp_9 ?? "-", row.hp_10 ?? "-", row.hp_12 ?? "-",
    row.dp_2 ?? "-", row.dp_3 ?? "-", row.dp_4 ?? "-",
    row.dp_5 ?? "-", row.dp_6 ?? "-", row.dp_7 ?? "-",
    row.hr_1 ?? "-",
    row.cp_1 ?? "-",
    row.ch_1 ?? "-", row.ch_2 ?? "-",
    row.so_1 ?? "-", row.so_2_1 ?? "-", row.so_2_2 ?? "-", row.so_2_3 ?? "-",
    row.rd_1 ?? "-", row.rd_2 ?? "-",
    "-", row.fd_2 ?? "-", row.fd_3 ?? "-", row.fd_4 ?? "-",  // fd_1 always show "-"
    row.oa_1 ?? "-", row.oa_2 ?? "-", row.oa_3 ?? "-",
  ]);

  // Combine headers and data
  const wsData = [...headers, ...dataRows];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths - increased for better readability
  const colWidths = [
    { wch: 8 },   // 0: ลำดับ
    { wch: 25 },  // 1: Location
    { wch: 18 },  // 2: Quota
    { wch: 22 },  // 3: Reporters
    { wch: 12 },  // 4: Percentage
    // Health Promotion (5.x): cols 5-15 (11 cols)
    { wch: 25 },  // 5: hp_1
    { wch: 30 },  // 6: hp_2
    { wch: 30 },  // 7: hp_3
    { wch: 28 },  // 8: hp_4
    { wch: 35 },  // 9: hp_5
    { wch: 35 },  // 10: hp_6
    { wch: 22 },  // 11: hp_7
    { wch: 35 },  // 12: hp_8
    { wch: 30 },  // 13: hp_9
    { wch: 50 },  // 14: hp_10
    { wch: 35 },  // 15: hp_12 (อสม.เยี่ยมบ้านและให้คำแนะนำผู้พิการด้านการดูแลสุขภาพ)
    // Disease Prevention (6.x): cols 16-21 (6 cols)
    { wch: 22 },  // 16: dp_2
    { wch: 22 },  // 17: dp_3
    { wch: 35 },  // 18: dp_4
    { wch: 30 },  // 19: dp_5
    { wch: 25 },  // 20: dp_6
    { wch: 50 },  // 21: dp_7
    // Health Rehabilitation (7.x): col 22
    { wch: 40 },  // 22: hr_1
    // Consumer Protection (8.x): col 23
    { wch: 15 },  // 23: cp_1
    // Community Health (9.x): cols 24-25
    { wch: 18 },  // 24: ch_1
    { wch: 18 },  // 25: ch_2
    // Support OSM (10.x): cols 26-29
    { wch: 28 },  // 26: so_1
    { wch: 35 },  // 27: so_2_1
    { wch: 35 },  // 28: so_2_2
    { wch: 25 },  // 29: so_2_3
    // Rational Drug Use (11.x): cols 30-31
    { wch: 22 },  // 30: rd_1
    { wch: 35 },  // 31: rd_2
    // Family Doctor Team (12.x): cols 32-35
    { wch: 22 },  // 32: fd_1
    { wch: 25 },  // 33: fd_2
    { wch: 30 },  // 34: fd_3
    { wch: 22 },  // 35: fd_4
    // Other Activities (13.x): cols 36-38
    { wch: 18 },  // 36: oa_1
    { wch: 22 },  // 37: oa_2
    { wch: 60 },  // 38: oa_3
  ];
  ws["!cols"] = colWidths;

  // Merge cells for header rows
  // Column indices: 0=No, 1=Location, 2=Quota, 3=Reporters, 4=Percentage
  // Health Promotion (5.x): col 5-15 (11 cols)
  // Disease Prevention (6.x): col 16-21 (6 cols)
  // Health Rehabilitation (7.1): col 22 (1 col) - has sub-header in row 1, merged to row 2
  // Consumer Protection (8.1): col 23 (1 col) - has sub-header in row 1, merged to row 2
  // Community Health (9.x): col 24-25 (2 cols)
  // Support OSM (10.x): col 26-29 (4 cols) - with 2-level structure
  // Rational Drug Use (11.x): col 30-31 (2 cols)
  // Family Doctor Team (12.x): col 32-35 (4 cols)
  // Other Activities (13.x): col 36-38 (3 cols)
  const merges = [
    // Vertical merges for first 5 columns (rowspan=2 for columns without subColumns)
    { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },   // ลำดับ
    { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },   // จังหวัด/Location
    { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } },   // จำนวนโควต้า
    { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } },   // จำนวนผู้รายงาน
    { s: { r: 0, c: 4 }, e: { r: 1, c: 4 } },   // ร้อยละ
    // Horizontal merges for main header row (row 0)
    { s: { r: 0, c: 5 }, e: { r: 0, c: 15 } },   // Health Promotion (5.x) - 11 cols
    { s: { r: 0, c: 16 }, e: { r: 0, c: 21 } },  // Disease Prevention (6.x) - 6 cols
    { s: { r: 0, c: 22 }, e: { r: 0, c: 22 } },  // Health Rehabilitation (7.x) - 1 col (no horizontal merge)
    { s: { r: 0, c: 23 }, e: { r: 0, c: 23 } },  // Consumer Protection (8.x) - 1 col (no horizontal merge)
    { s: { r: 0, c: 24 }, e: { r: 0, c: 25 } },  // Community Health (9.x)
    { s: { r: 0, c: 26 }, e: { r: 0, c: 29 } },  // Support OSM (10.x) - 4 cols
    { s: { r: 0, c: 30 }, e: { r: 0, c: 31 } },  // Rational Drug Use (11.x)
    { s: { r: 0, c: 32 }, e: { r: 0, c: 35 } },  // Family Doctor Team (12.x)
    { s: { r: 0, c: 36 }, e: { r: 0, c: 38 } },  // Other Activities (13.x)
  ];
  ws["!merges"] = merges;

  // Apply styles with visible border colors
  const borderColor = { rgb: "000000" }; // Black border color

  const headerStyle1 = {
    font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "7E32E2" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: borderColor },
      bottom: { style: "thin", color: borderColor },
      left: { style: "thin", color: borderColor },
      right: { style: "thin", color: borderColor }
    },
  };

  const headerStyle2 = {
    font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "9333EA" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: borderColor },
      bottom: { style: "thin", color: borderColor },
      left: { style: "thin", color: borderColor },
      right: { style: "thin", color: borderColor }
    },
  };

  const dataStyle = {
    font: { sz: 10 },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: borderColor },
      bottom: { style: "thin", color: borderColor },
      left: { style: "thin", color: borderColor },
      right: { style: "thin", color: borderColor }
    },
  };

  const range = XLSX.utils.decode_range(ws["!ref"]);
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellAddress]) continue;
      if (R === 0) ws[cellAddress].s = headerStyle1;
      else if (R === 1) ws[cellAddress].s = headerStyle2;
      else ws[cellAddress].s = dataStyle;
    }
  }

  ws["!rows"] = [{ hpx: 30 }, { hpx: 60 }];

  XLSX.utils.book_append_sheet(wb, ws, "รายงาน อสม.1");

  // Generate filename - Format: PB_{year}.xlsx
  const currentYear = new Date().getFullYear();
  const filename = `PB_${currentYear}.xlsx`;

  XLSX.writeFile(wb, filename);
};

const PublicReportComp = () => {
  // Permission hooks
  const { user, scope, isLocked, getInitialFilters, loading: permissionLoading } = useUserPermission();

  // Filter states - initialize with permission-based filters if user is logged in
  const initialFilters = useMemo(() => {
    if (user && !permissionLoading) {
      return getInitialFilters();
    }
    return {
      zone: "",
      province: "",
      province_name_th: "",
      district: "",
      district_name_th: "",
      subdistrict: "",
      subdistrict_name_th: "",
      service: "",
    };
  }, [user, permissionLoading, getInitialFilters]);

  const [fiscalYear, setFiscalYear] = useState(String(new Date().getFullYear() + 543));
  const [month, setMonth] = useState("");
  const [zone, setZone] = useState(initialFilters.zone);
  const [province, setProvince] = useState(initialFilters.province);
  const [district, setDistrict] = useState(initialFilters.district);
  const [subdistrict, setSubdistrict] = useState(initialFilters.subdistrict);
  const [service, setService] = useState(initialFilters.service);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Location data
  const [healthAreas, setHealthAreas] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);
  const [healthServices, setHealthServices] = useState([]);

  // Report data
  const [reportData, setReportData] = useState([]);
  const [bangkokData, setBangkokData] = useState([]); // Separate data for Bangkok
  const [currentLevel, setCurrentLevel] = useState("province"); // province, district, subdistrict, service
  const [loading, setLoading] = useState(false);

  // Active tab: "all" or "bangkok"
  const [activeTab, setActiveTab] = useState("all");

  // Store all provinces from lookup for filling missing data
  const [allProvincesLookup, setAllProvincesLookup] = useState([]);

  // Store lookup data for Bangkok tab (for filling missing data with 0)
  const [allDistrictsLookup, setAllDistrictsLookup] = useState([]);
  const [allSubdistrictsLookup, setAllSubdistrictsLookup] = useState([]);
  const [allHealthServicesLookup, setAllHealthServicesLookup] = useState([]);

  // Bangkok constants
  const BANGKOK_ZONE = "HA13"; // เขตสุขภาพที่ 13
  const BANGKOK_PROVINCE_CODE = "10"; // กรุงเทพมหานคร

  // Check if user is logged in
  const isLoggedIn = user && !permissionLoading;

  // Sync filter states with user permissions when they are loaded
  useEffect(() => {
    if (user && !permissionLoading) {
      const filters = getInitialFilters();
      // Only set filters if they haven't been manually changed by user
      // For logged in users, apply permission-based filters
      if (filters.zone && zone === "") setZone(filters.zone);
      if (filters.province && province === "") setProvince(filters.province);
      if (filters.district && district === "") setDistrict(filters.district);
      if (filters.subdistrict && subdistrict === "") setSubdistrict(filters.subdistrict);
      if (filters.service && service === "") setService(filters.service);
    }
  }, [user, permissionLoading]);

  // Helper to get location label based on current level
  const getLocationLabel = () => {
    switch (currentLevel) {
      case "service":
        return "หน่วยบริการ";
      case "subdistrict":
        return "ตำบล";
      case "district":
        return "อำเภอ";
      default:
        return "จังหวัด";
    }
  };

  // Helper to get location key based on current level
  const getLocationKey = () => {
    switch (currentLevel) {
      case "service":
        return "service";
      case "subdistrict":
        return "subdistrict";
      case "district":
        return "district";
      default:
        return "province";
    }
  };

  // Load health areas on mount
  useEffect(() => {
    const loadHealthAreas = async () => {
      try {
        const data = await getHealthAreas({ limit: 100 });
        const sortedData = (data || []).sort((a, b) => {
          const numA = parseInt(a.code.replace('HA', ''));
          const numB = parseInt(b.code.replace('HA', ''));
          return numA - numB;
        });
        setHealthAreas(sortedData);
      } catch (error) {
        console.error('Failed to load health areas:', error);
        setHealthAreas([]);
      }
    };
    loadHealthAreas();
  }, []);

  // Load all provinces for filling missing data (for village health volunteers)
  useEffect(() => {
    const loadAllProvinces = async () => {
      try {
        const data = await getProvinces({ limit: 100 });
        setAllProvincesLookup(data || []);
      } catch (error) {
        console.error('Failed to load all provinces:', error);
        setAllProvincesLookup([]);
      }
    };
    loadAllProvinces();
  }, []);

  // Load all districts/subdistricts/healthservices for Bangkok (for filling missing data in bangkok tab)
  useEffect(() => {
    const loadBangkokLookupData = async () => {
      try {
        // Load all districts in Bangkok
        const districtsData = await getDistricts(BANGKOK_PROVINCE_CODE);
        setAllDistrictsLookup(districtsData || []);

        // Load all subdistricts in Bangkok (need to loop through each district)
        const allSubdistricts = [];
        for (const dist of (districtsData || [])) {
          const subdistData = await getSubdistricts(dist.code || dist.district_code || dist.id);
          allSubdistricts.push(...(subdistData || []));
        }
        setAllSubdistrictsLookup(allSubdistricts);

        // Load all health services in Bangkok
        const healthServicesData = await getHealthServices({ province_code: BANGKOK_PROVINCE_CODE });
        setAllHealthServicesLookup(healthServicesData || []);
      } catch (error) {
        console.error('Failed to load Bangkok lookup data:', error);
      }
    };
    loadBangkokLookupData();
  }, []);

  // Load provinces when zone changes
  useEffect(() => {
    const loadProvinces = async () => {
      if (!zone) {
        // No zone selected - load all provinces
        const data = await getProvinces({ limit: 100 });
        setProvinces(data || []);
      } else {
        // Zone selected - filter provinces using HEALTHZONE_PROVINCES mapping
        // Convert zone code (e.g., "HA1", "HA12") to zone number (1, 12)
        const zoneNumber = parseInt(String(zone).replace(/\D/g, ''));

        // Find zone data from HEALTHZONE_PROVINCES
        const zoneData = HEALTHZONE_PROVINCES.find(z => z.zone === zoneNumber);

        if (zoneData && zoneData.provinces) {
          // Get province names in this zone
          const provinceNamesInZone = zoneData.provinces.map(p => p.trim());

          // Load all provinces and filter to only those in this zone
          const allProvinces = await getProvinces({ limit: 100 });
          const filteredProvinces = allProvinces.filter(p =>
            provinceNamesInZone.includes(p.name_th?.trim())
          );
          setProvinces(filteredProvinces);
        } else {
          // Zone not found in mapping, load all provinces
          const data = await getProvinces({ limit: 100 });
          setProvinces(data || []);
        }
      }
    };
    loadProvinces();
  }, [zone]);

  // Load districts when province changes
  useEffect(() => {
    const loadDistricts = async () => {
      if (!province) {
        setDistricts([]);
        return;
      }
      const data = await getDistricts(province);
      setDistricts(data || []);
    };
    loadDistricts();
  }, [province]);

  // Load subdistricts when district changes
  useEffect(() => {
    const loadSubdistricts = async () => {
      if (!district) {
        setSubdistricts([]);
        return;
      }
      const data = await getSubdistricts(district);
      setSubdistricts(data || []);
    };
    loadSubdistricts();
  }, [district]);

  // Load health services when province/district/subdistrict changes
  useEffect(() => {
    const loadHealthServices = async () => {
      if (!province) {
        setHealthServices([]);
        return;
      }
      const params = {
        province_code: province,
        ...(district && { district_code: district }),
        ...(subdistrict && { subdistrict_code: subdistrict }),
      };
      const data = await getHealthServices(params);
      setHealthServices(data || []);
    };
    loadHealthServices();
  }, [province, district, subdistrict]);

  // Fetch report data when filters change
  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        // Determine the display level based on filters selected
        // The logic: show data at the child level of the most specific filter
        let displayLevel = "province"; // default: show all provinces
        let locationKey = "province";
        let locationLabel = "จังหวัด";

        // Build params based on what level we want to display
        // - If service selected: show that service only
        // - If subdistrict selected: show all services in that subdistrict
        // - If district selected: show all subdistricts in that district
        // - If province selected: show all districts in that province
        // - If zone selected: show all provinces in that zone
        // - If nothing selected: show all provinces
        const params = {
          fiscal_year: fiscalYear,
          month: month,
        };

        if (service) {
          // Show specific service
          displayLevel = "service";
          locationKey = "service";
          locationLabel = "หน่วยบริการ";
          params.health_service_code = service;
          if (subdistrict) params.subdistrict_code = subdistrict;
          if (district) params.district_code = district;
          if (province) params.province_code = province;
          if (zone) params.zone_code = zone;
        } else if (subdistrict) {
          // Show all services in this subdistrict
          displayLevel = "service";
          locationKey = "service";
          locationLabel = "หน่วยบริการ";
          params.subdistrict_code = subdistrict;
          if (district) params.district_code = district;
          if (province) params.province_code = province;
          if (zone) params.zone_code = zone;
        } else if (district) {
          // Show all subdistricts in this district
          displayLevel = "subdistrict";
          locationKey = "subdistrict";
          locationLabel = "ตำบล";
          params.district_code = district;
          if (province) params.province_code = province;
          if (zone) params.zone_code = zone;
        } else if (province) {
          // Show all districts in this province
          displayLevel = "district";
          locationKey = "district";
          locationLabel = "อำเภอ";
          params.province_code = province;
          if (zone) params.zone_code = zone;
        } else if (zone) {
          // Show all provinces in this zone
          displayLevel = "province";
          locationKey = "province";
          locationLabel = "จังหวัด";
          params.zone_code = zone;
        }
        // If nothing selected, show all provinces (no location params needed)

        console.log('API Request params:', params);

        // Call real API
        const apiData = await getPublicOsm1SummaryByLocation(params);

        // Handle different response formats
        let dataArray = [];
        if (!apiData || (Array.isArray(apiData) && apiData.length === 0) || (typeof apiData === 'object' && Object.keys(apiData).length === 0)) {
          // No data from API - will fill with 0 values from lookup later
          dataArray = [];
        } else if (Array.isArray(apiData)) {
          dataArray = apiData;
        } else if (apiData.items && Array.isArray(apiData.items)) {
          dataArray = apiData.items;
        } else if (apiData.data && Array.isArray(apiData.data)) {
          dataArray = apiData.data;
        } else {
          // Single object response
          dataArray = [apiData];
        }

        // Map each data item to table row format
        const mappedData = dataArray.map((item) => {
          let locationName = "-";

          if (displayLevel === "service") {
            locationName = item.health_services || item.service_name || item.service || item.name || "-";
          } else if (displayLevel === "subdistrict") {
            locationName = item.subdistrict_name || item.subdistrict || item.name_th || item.name || "-";
          } else if (displayLevel === "district") {
            locationName = item.district_name || item.district || item.name_th || item.name || "-";
          } else {
            locationName = item.province_name || item.province || item.name_th || item.name || "-";
          }

          // Get province name for filtering (used to separate Bangkok from other provinces)
          const provinceName = item.province_name || item.province || item.name_th || item.name || "-";

          return {
            ...mapApiDataToTableRow(item),
            [locationKey]: locationName,
            province: provinceName, // Always include province for filtering
          };
        });

        // Separate Bangkok data from other provinces
        const bangkokItems = mappedData.filter((item) =>
          item.province === "กรุงเทพมหานคร" ||
          item.province?.includes("กรุงเทพ")
        );
        let otherItems = mappedData.filter((item) =>
          item.province !== "กรุงเทพมหานคร" &&
          !item.province?.includes("กรุงเทพ")
        );

        // For village health volunteers (activeTab === "all"), fill missing data with 0 values
        // Logic:
        // - If province selected: show all districts in that province
        // - If district selected: show all subdistricts in that district
        // - If subdistrict selected: show all health services in that subdistrict (if no services, don't show)
        // - If service selected: show that service only
        // - If nothing selected: show all provinces (fill missing with 0)
        if (activeTab === "all") {
          // Helper function to create empty row with 0 values
          const createEmptyRow = (locationName, locationKey, provinceName) => ({
            [locationKey]: locationName,
            province: provinceName || locationName,
            quota: 0,
            reporters: 0,
            percentage: 0,
            // All activity columns with 0
            hp_1: 0, hp_2: 0, hp_3: 0, hp_4: 0, hp_5: 0, hp_6: 0, hp_7: 0, hp_8: 0, hp_9: 0, hp_10: 0, hp_12: 0,
            dp_2: 0, dp_3: 0, dp_4: 0, dp_5: 0, dp_6: 0, dp_7: 0,
            hr_1: 0,
            cp_1: 0,
            ch_1: 0, ch_2: 0,
            so_1: 0, so_2_1: 0, so_2_2: 0, so_2_3: 0,
            rd_1: 0, rd_2: 0,
            fd_2: 0, fd_3: 0, fd_4: 0,
            oa_1: 0, oa_2: 0, oa_3: 0,
          });

          // Create a map of existing data by location name
          const existingDataMap = new Map();
          otherItems.forEach(item => {
            const key = item[locationKey] || item.district || item.subdistrict || item.service || item.province;
            existingDataMap.set(key, item);
          });

          let filledData = [];

          if (displayLevel === "province" && allProvincesLookup.length > 0) {
            // Show all provinces (except Bangkok) - fill missing with 0
            let provincesToShow = allProvincesLookup.filter(p =>
              p.name_th !== "กรุงเทพมหานคร" &&
              !p.name_th?.includes("กรุงเทพ")
            );

            // If zone is selected, filter provinces by zone
            if (zone) {
              const zoneNumber = parseInt(String(zone).replace(/\D/g, ''));
              const zoneData = HEALTHZONE_PROVINCES.find(z => z.zone === zoneNumber);
              if (zoneData && zoneData.provinces) {
                const provinceNamesInZone = zoneData.provinces.map(p => p.trim());
                provincesToShow = provincesToShow.filter(p =>
                  provinceNamesInZone.includes(p.name_th?.trim())
                );
              }
            }

            filledData = provincesToShow.map(p => {
              const existingData = existingDataMap.get(p.name_th);
              if (existingData) {
                return existingData;
              }
              return createEmptyRow(p.name_th, "province", p.name_th);
            });
          } else if (displayLevel === "district" && districts.length > 0) {
            // Show all districts in selected province - fill missing with 0
            filledData = districts.map(dist => {
              const existingData = existingDataMap.get(dist.name_th);
              if (existingData) {
                return existingData;
              }
              return createEmptyRow(dist.name_th, "district", provinces.find(p => p.code === province)?.name_th);
            });
          } else if (displayLevel === "subdistrict" && subdistricts.length > 0) {
            // Show all subdistricts in selected district - fill missing with 0
            filledData = subdistricts.map(sd => {
              const existingData = existingDataMap.get(sd.name_th);
              if (existingData) {
                return existingData;
              }
              return createEmptyRow(sd.name_th, "subdistrict", provinces.find(p => p.code === province)?.name_th);
            });
          } else if (displayLevel === "service" && subdistrict && healthServices.length > 0) {
            // Show all health services in selected subdistrict
            // If no services exist, don't show anything (empty array)
            const servicesInSubdistrict = healthServices.filter(hs =>
              hs.subdistrict_code === subdistrict || hs.subdistrict_id === subdistrict || hs.subdistrict === subdistrict
            );
            if (servicesInSubdistrict.length > 0) {
              filledData = servicesInSubdistrict.map(hs => {
                const existingData = existingDataMap.get(hs.name_th || hs.name || hs.service_name);
                if (existingData) {
                  return existingData;
                }
                return createEmptyRow(hs.name_th || hs.name || hs.service_name, "service", provinces.find(p => p.code === province)?.name_th);
              });
            } else {
              // If no services in subdistrict, keep existing data (don't fill with 0)
              filledData = otherItems;
            }
          } else if (displayLevel === "service" && service) {
            // Show selected service only
            filledData = otherItems;
          } else {
            // For other cases, keep existing data
            filledData = otherItems;
          }

          otherItems = filledData;
        }

        // For proactive health volunteers (activeTab === "bangkok"), fill missing data with 0 values
        // Logic:
        // - If province selected: show all districts in that province
        // - If district selected: show all subdistricts in that district
        // - If subdistrict selected: show all health services in that subdistrict (if no services, don't show)
        // - If service selected: show that service only
        if (activeTab === "bangkok") {
          // Helper function to create empty row with 0 values
          const createEmptyRow = (locationName, locationKey) => ({
            [locationKey]: locationName,
            province: "กรุงเทพมหานคร",
            quota: 0,
            reporters: 0,
            percentage: 0,
            // All activity columns with 0
            hp_1: 0, hp_2: 0, hp_3: 0, hp_4: 0, hp_5: 0, hp_6: 0, hp_7: 0, hp_8: 0, hp_9: 0, hp_10: 0, hp_12: 0,
            dp_2: 0, dp_3: 0, dp_4: 0, dp_5: 0, dp_6: 0, dp_7: 0,
            hr_1: 0,
            cp_1: 0,
            ch_1: 0, ch_2: 0,
            so_1: 0, so_2_1: 0, so_2_2: 0, so_2_3: 0,
            rd_1: 0, rd_2: 0,
            fd_2: 0, fd_3: 0, fd_4: 0,
            oa_1: 0, oa_2: 0, oa_3: 0,
          });

          // Create a map of existing data by location name
          const existingDataMap = new Map();
          bangkokItems.forEach(item => {
            const key = item[locationKey] || item.service || item.subdistrict || item.district || item.province;
            existingDataMap.set(key, item);
          });

          let filledBangkokData = [];

          if (displayLevel === "district" && allDistrictsLookup.length > 0) {
            // Show all districts in Bangkok - fill missing with 0
            filledBangkokData = allDistrictsLookup.map(dist => {
              const existingData = existingDataMap.get(dist.name_th);
              if (existingData) {
                return existingData;
              }
              return createEmptyRow(dist.name_th, "district");
            });
          } else if (displayLevel === "subdistrict" && district && allSubdistrictsLookup.length > 0) {
            // Show all subdistricts in selected district - fill missing with 0
            const subdistrictsInDistrict = allSubdistrictsLookup.filter(sd =>
              sd.district_code === district || sd.district_id === district || sd.district === district
            );
            filledBangkokData = subdistrictsInDistrict.map(sd => {
              const existingData = existingDataMap.get(sd.name_th);
              if (existingData) {
                return existingData;
              }
              return createEmptyRow(sd.name_th, "subdistrict");
            });
          } else if (displayLevel === "service" && subdistrict && allHealthServicesLookup.length > 0) {
            // Show all health services in selected subdistrict
            // If no services exist, don't show anything (empty array)
            const servicesInSubdistrict = allHealthServicesLookup.filter(hs =>
              hs.subdistrict_code === subdistrict || hs.subdistrict_id === subdistrict || hs.subdistrict === subdistrict
            );
            if (servicesInSubdistrict.length > 0) {
              filledBangkokData = servicesInSubdistrict.map(hs => {
                const existingData = existingDataMap.get(hs.name_th || hs.name || hs.service_name);
                if (existingData) {
                  return existingData;
                }
                return createEmptyRow(hs.name_th || hs.name || hs.service_name, "service");
              });
            } else {
              // If no services in subdistrict, keep existing data (don't fill with 0)
              filledBangkokData = bangkokItems;
            }
          } else if (displayLevel === "service" && service) {
            // Show selected service only
            filledBangkokData = bangkokItems;
          } else {
            // For other cases, keep existing data
            filledBangkokData = bangkokItems;
          }

          setBangkokData(filledBangkokData);
        } else {
          setBangkokData(bangkokItems);
        }

        setReportData(otherItems);
        setCurrentLevel(displayLevel);
      } catch (error) {
        console.error('Error fetching report data:', error);
        setReportData([]);
        setCurrentLevel("province");
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [fiscalYear, month, zone, province, district, subdistrict, service, activeTab, allProvincesLookup, allDistrictsLookup, allSubdistrictsLookup, allHealthServicesLookup, districts, subdistricts, healthServices, provinces]);

  const handleSearch = () => {
    // Data will be refetched by useEffect
  };

  const handleReset = () => {
    setFiscalYear(String(new Date().getFullYear() + 543));
    setMonth("");

    // For proactive health volunteers (bangkok tab), keep zone locked, reset only child filters
    if (activeTab === "bangkok") {
      setDistrict("");
      setSubdistrict("");
      setService("");
    } else {
      // For village health volunteers, reset all filters
      // Only reset filters that are not locked
      if (!isLoggedIn || !isLocked('zone')) setZone("");
      if (!isLoggedIn || !isLocked('province')) setProvince("");
      if (!isLoggedIn || !isLocked('district')) setDistrict("");
      if (!isLoggedIn || !isLocked('subdistrict')) setSubdistrict("");
      if (!isLoggedIn || !isLocked('service')) setService("");
    }
  };

  const handleExportExcel = () => {
    exportToExcel(currentData, {
      fiscalYear,
      month,
      zone,
      province,
      district,
      subdistrict,
      service,
    }, getLocationLabel());
  };

  // Calculate total columns for horizontal scroll
  // 1 (No.) + 4 (Province, Quota, Reporters, %) + 11 + 6 + 1 + 1 + 2 + 4 + 2 + 4 + 3 = 39
  const totalColumns = 1 + 4 + 11 + 6 + 1 + 1 + 2 + 4 + 2 + 4 + 3;

  // Dynamic table columns based on current level
  const dynamicTableColumns = useMemo(() => {
    const locationLabel = getLocationLabel();
    return TABLE_COLUMNS.map(col => {
      if (col.id === "province") {
        return { ...col, label: locationLabel };
      }
      return col;
    });
  }, [currentLevel]);

  // Get current data based on active tab
  const currentData = useMemo(() => {
    return activeTab === "bangkok" ? bangkokData : reportData;
  }, [activeTab, bangkokData, reportData]);

  // Pagination helpers
  const totalPages = Math.ceil(currentData.length / itemsPerPage) || 1;
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, currentData.length);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return currentData.slice(startIndex, endIndex);
  }, [currentData, currentPage, itemsPerPage]);

  // Helper function to get page numbers
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
    setCurrentPage(page);
  };

  // Reset to page 1 when filters or tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [fiscalYear, month, zone, province, district, subdistrict, service, activeTab]);

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#f7f2ff] via-white to-white">
      {/* Header Section */}
      <div className="relative mb-6 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7e32e2] via-[#9333ea] to-[#a855f7]" />
        <div className="absolute inset-0 bg-white/5" />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <FileSpreadsheet size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    ผลการรายงานผลการปฏิบัติงานของอสม.
                  </h1>
                  <p className="text-white/80">
                    รายงานสรุปผลการดำเนินงานของอาสาสมัครสาธารณสุข
                  </p>
                </div>
              </div>
            </div>
            <div className="flex w-full lg:w-auto justify-end gap-3">
              {/* {activeTab === "bangkok" && (
                <>
                  <button
                    onClick={() => downloadBangkokPDF({ fiscalYear, month })}
                    className="flex items-center gap-2 bg-white/20 text-white font-semibold rounded-2xl px-4 py-3 shadow-lg border border-white/30 hover:-translate-y-0.5 hover:bg-white/30 transition"
                  >
                    <FileText size={18} />
                    รายงานกรุงเทพ
                  </button>
                  <button
                    onClick={() => generateBangkokPDF({ fiscalYear, month })}
                    className="flex items-center gap-2 bg-white text-[#7e32e2] font-semibold rounded-2xl px-4 py-3 shadow-lg border border-white/50 hover:-translate-y-0.5 transition"
                  >
                    <Download size={18} />
                    พิมพ์รายงาน
                  </button>
                </>
              )} */}
              <button
                onClick={handleExportExcel}
                disabled={loading || currentData.length === 0}
                className="flex items-center gap-2 bg-white text-[#7e32e2] font-semibold rounded-2xl px-4 py-3 shadow-lg border border-white/50 hover:-translate-y-0.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={18} />
                ส่งออก Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Tabs */}
      <div className="mb-4 flex flex-wrap gap-3">
        <button
          onClick={() => {
            setActiveTab("all");
            // Reset to show all provinces except Bangkok - clear all location filters
            setZone("");
            setProvince("");
            setDistrict("");
            setSubdistrict("");
            setService("");
          }}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-200 ${
            activeTab === "all" && !zone && !province
              ? "bg-gradient-to-r from-[#7e32e2] to-[#a855f7] text-white shadow-lg"
              : "bg-white border-2 border-purple-200 text-[#7e32e2] hover:bg-purple-50 hover:border-purple-300"
          }`}
        >
          <Globe size={20} />
          อาสาสมัครสารธารณะสุขประจำหมู่บ้าน
        </button>
        <button
          onClick={() => {
            setActiveTab("bangkok");
            // Lock to Bangkok zone and province for proactive health volunteers
            setZone(BANGKOK_ZONE);
            setProvince(BANGKOK_PROVINCE_CODE); // Set province to Bangkok to show districts
            setDistrict("");
            setSubdistrict("");
            setService("");
          }}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-200 ${
            activeTab === "bangkok"
              ? "bg-gradient-to-r from-[#7e32e2] to-[#a855f7] text-white shadow-lg"
              : "bg-white border-2 border-purple-200 text-[#7e32e2] hover:bg-purple-50 hover:border-purple-300"
          }`}
        >
          <Landmark size={20} />
          อาสาสมัครสารธารณะสุขเชิงรุก
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white border border-[#eee5ff] shadow-xl rounded-2xl p-5 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CustomSelect
            label="ปีงบประมาณ"
            placeholder="เลือกปีงบประมาณ"
            value={fiscalYear}
            onChange={(e) => setFiscalYear(e.target.value)}
            options={generateYearOptions()}
            icon={Calendar}
          />
          <CustomSelect
            label="เดือน"
            placeholder="เลือกเดือน"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            options={FISCAL_MONTH_OPTIONS}
            icon={Calendar}
          />
          <CustomSelect
            label="เขตสุขภาพ"
            placeholder="เลือกเขต"
            value={zone}
            onChange={(e) => {
              setZone(e.target.value);
              // Clear child values only if they are not locked
              if (!isLoggedIn || !isLocked('province')) setProvince("");
              if (!isLoggedIn || !isLocked('district')) setDistrict("");
              if (!isLoggedIn || !isLocked('subdistrict')) setSubdistrict("");
              if (!isLoggedIn || !isLocked('service')) setService("");
            }}
            options={Array.isArray(healthAreas)
              ? healthAreas
                  .filter(h => activeTab === "all" ? h.code !== BANGKOK_ZONE : true) // Hide zone 13 for "all" tab
                  .map(h => ({ label: h.name_th, value: h.code }))
              : []}
            icon={MapPin}
            disabled={activeTab === "bangkok" || (isLoggedIn && isLocked('zone'))}
          />
          <CustomSelect
            label="จังหวัด"
            placeholder="เลือกจังหวัด"
            value={province}
            onChange={(e) => {
              setProvince(e.target.value);
              // Clear child values only if they are not locked
              if (!isLoggedIn || !isLocked('district')) setDistrict("");
              if (!isLoggedIn || !isLocked('subdistrict')) setSubdistrict("");
              if (!isLoggedIn || !isLocked('service')) setService("");
            }}
            options={(provinces || [])
              .filter(p => activeTab === "all" ? (p.name_th !== "กรุงเทพมหานคร" && !p.name_th?.includes("กรุงเทพ")) : true) // Hide Bangkok for "all" tab
              .map((p) => ({ label: p.name_th, value: p.code }))}
            icon={Building2}
            disabled={isLoggedIn && isLocked('province')}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <CustomSelect
            label="อำเภอ"
            placeholder="เลือกอำเภอ"
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              // Clear child values only if they are not locked
              if (!isLoggedIn || !isLocked('subdistrict')) setSubdistrict("");
              if (!isLoggedIn || !isLocked('service')) setService("");
            }}
            options={(districts || []).map((d) => ({ label: d.name_th, value: d.code }))}
            icon={Building2}
            disabled={(isLoggedIn && isLocked('district')) || !province}
          />
          <CustomSelect
            label="ตำบล"
            placeholder="เลือกตำบล"
            value={subdistrict}
            onChange={(e) => {
              setSubdistrict(e.target.value);
              // Clear child values only if they are not locked
              if (!isLoggedIn || !isLocked('service')) setService("");
            }}
            options={(subdistricts || []).map((s) => ({ label: s.name_th, value: s.code }))}
            icon={Home}
            disabled={(isLoggedIn && isLocked('subdistrict')) || !district}
          />
          <CustomSelect
            label="หน่วยบริการ"
            placeholder="เลือกหน่วยบริการ"
            value={service}
            onChange={(e) => setService(e.target.value)}
            options={(healthServices || []).map((s) => ({
              label: s.name_th || s.name || s.service_name || "ไม่ระบุ",
              value: String(s.id || s.code || "")
            }))}
            icon={Building2}
            disabled={(isLoggedIn && isLocked('service')) || !subdistrict}
          />
        </div>
        <div className="flex gap-3 mt-4">
          <button
            className="flex items-center justify-center gap-2 px-6 py-3 h-12 bg-gradient-to-r from-[#7e32e2] to-[#a855f7] text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
            onClick={handleSearch}
          >
            <Search size={20} />
            ค้นหา
          </button>
          <button
            className="flex items-center justify-center gap-2 px-6 py-3 h-12 bg-white border-2 border-purple-200 text-[#7e32e2] font-semibold rounded-xl hover:bg-purple-50 transition-all duration-200"
            onClick={handleReset}
          >
            <RotateCcw size={20} />
            ล้างข้อมูล
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-[#eee5ff] shadow-xl rounded-2xl p-4 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={48} className="text-purple-500 animate-spin" />
              <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        ) : currentData.length === 0 ? (
          <div className="py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <FileText size={48} className="text-gray-300" />
              <p className="text-gray-500">ไม่พบข้อมูล</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ maxWidth: "100%" }}>
            {/* Scroll indicator */}
            <div className="text-xs text-gray-400 mb-2 text-right italic">
              &larr; เลื่อนซ้าย/ขวาเพื่อดูข้อมูลทั้งหมด &rarr;
            </div>
            <table
              className="w-full text-xs border-collapse"
              style={{ borderSpacing: 0, minWidth: `${totalColumns * 80}px` }}
            >
              <thead>
                {/* Main header row */}
                <tr className="bg-gradient-to-r from-[#7e32e2] to-[#a855f7] text-white">
                  {dynamicTableColumns.map((col) => {
                    if (col.subColumns) {
                      return (
                        <th
                          key={col.id}
                          colSpan={col.colspan}
                          className="py-3 px-3 font-semibold text-center text-white border-r border-purple-400 last:border-r-0 text-sm"
                        >
                          {col.label}
                        </th>
                      );
                    }
                    return (
                      <th
                        key={col.id}
                        rowSpan={col.rowspan}
                        className="py-3 px-3 font-semibold text-center text-white border-r border-purple-400 last:border-r-0 text-sm"
                      >
                        {col.label}
                        {col.unit && <><br/>({col.unit})</>}
                      </th>
                    );
                  })}
                </tr>
                {/* Second header row - first level subColumns */}
                {TABLE_COLUMNS.filter(col => col.subColumns).length > 0 && (
                  <tr className="bg-[#9333ea] text-white">
                    {dynamicTableColumns.map((col) => {
                      if (col.subColumns) {
                        return col.subColumns.map((subCol, subIdx) => {
                          // If subColumn has its own subColumns, render with colspan, otherwise render with rowspan
                          if (subCol.subColumns) {
                            return (
                              <th
                                key={`${col.id}-${subIdx}`}
                                colSpan={subCol.colspan}
                                className="py-3 px-2 font-semibold text-center text-white border-r border-purple-300 last:border-r-0 text-xs leading-tight"
                              >
                                {subCol.label}
                              </th>
                            );
                          }
                          // If subColumn has rowspan > 1, it spans multiple rows
                          if (subCol.rowspan && subCol.rowspan > 1) {
                            return (
                              <th
                                key={`${col.id}-${subIdx}`}
                                rowSpan={subCol.rowspan}
                                className="py-3 px-2 font-semibold text-center text-white border-r border-purple-300 last:border-r-0 text-xs leading-tight"
                              >
                                {subCol.label}
                                {subCol.unit && <><br/>({subCol.unit})</>}
                              </th>
                            );
                          }
                          // Regular subColumn without nested structure
                          return (
                            <th
                              key={`${col.id}-${subIdx}`}
                              className="py-3 px-2 font-semibold text-center text-white border-r border-purple-300 last:border-r-0 text-xs leading-tight"
                            >
                              {subCol.label}
                              {subCol.unit && <><br/>({subCol.unit})</>}
                            </th>
                          );
                        });
                      }
                      return null;
                    })}
                  </tr>
                )}
                {/* Third header row - for nested subColumns (e.g., under "มีกลุ่มในความดูแลรับผิดชอบ") */}
                {TABLE_COLUMNS.some(col => col.subColumns?.some(sc => sc.subColumns)) && (
                  <tr className="bg-[#a855f7] text-white">
                    {dynamicTableColumns.flatMap((col) => {
                      if (!col.subColumns) return [];

                      return col.subColumns.flatMap((subCol, subIdx) => {
                        // Only render th if this subColumn has nested subColumns
                        if (subCol.subColumns) {
                          return subCol.subColumns.map((nestedSubCol, nestedIdx) => (
                            <th
                              key={`${col.id}-${subIdx}-${nestedIdx}`}
                              className="py-3 px-2 font-semibold text-center text-white border-r border-purple-300 last:border-r-0 text-xs leading-tight"
                            >
                              {nestedSubCol.label}
                              {nestedSubCol.unit && <><br/>({nestedSubCol.unit})</>}
                            </th>
                          ));
                        }
                        // SubColumn without nested subColumns but with rowspan - this column
                        // occupies space in this row (covered by rowspan from row 1), so skip rendering
                        return [];
                      });
                    })}
                  </tr>
                )}
              </thead>
              <tbody>
                {paginatedData.map((row, idx) => (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? "bg-white" : "bg-purple-50/30"}
                  >
                    <td className="py-3 px-3 text-center text-gray-700 border border-gray-200 font-medium">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="py-3 px-3 text-center text-gray-700 border border-gray-200 font-medium whitespace-nowrap">
                      {row[getLocationKey()] ?? "-"}
                    </td>
                    <td className="py-3 px-3 text-center text-gray-700 border border-gray-200">
                      {row.quota ?? "-"}
                    </td>
                    <td className="py-3 px-3 text-center text-gray-700 border border-gray-200">
                      {row.reporters ?? "-"}
                    </td>
                    <td className="py-3 px-3 text-center text-gray-700 border border-gray-200 font-medium">
                      {row.percentage ?? "-"}
                    </td>
                    {/* Health Promotion columns */}
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12].map((i) => (
                      <td key={`hp_${i}`} className="py-3 px-3 text-center text-gray-700 border border-gray-200">
                        {row[`hp_${i}`] ?? "-"}
                      </td>
                    ))}
                    {/* Disease Prevention columns */}
                    {[2, 3, 4, 5, 6, 7].map((i) => (
                      <td key={`dp_${i}`} className="py-3 px-3 text-center text-gray-700 border border-gray-200">
                        {row[`dp_${i}`] ?? "-"}
                      </td>
                    ))}
                    {/* Health Rehabilitation */}
                    <td className="py-3 px-3 text-center text-gray-700 border border-gray-200">
                      {row.hr_1 ?? "-"}
                    </td>
                    {/* Consumer Protection */}
                    <td className="py-3 px-3 text-center text-gray-700 border border-gray-200">
                      {row.cp_1 ?? "-"}
                    </td>
                    {/* Community Health */}
                    {[1, 2].map((i) => (
                      <td key={`ch_${i}`} className="py-3 px-3 text-center text-gray-700 border border-gray-200">
                        {row[`ch_${i}`] ?? "-"}
                      </td>
                    ))}
                    {/* Support OSM */}
                    <td className="py-3 px-3 text-center text-gray-700 border border-gray-200">
                      {row.so_1 ?? "-"}
                    </td>
                    {["2_1", "2_2", "2_3"].map((i) => (
                      <td key={`so_${i}`} className="py-3 px-3 text-center text-gray-700 border border-gray-200">
                        {row[`so_${i}`] ?? "-"}
                      </td>
                    ))}
                    {/* Rational Drug Use */}
                    {[1, 2].map((i) => (
                      <td key={`rd_${i}`} className="py-3 px-3 text-center text-gray-700 border border-gray-200">
                        {row[`rd_${i}`] ?? "-"}
                      </td>
                    ))}
                    {/* Family Doctor Team */}
                    {/* fd_1: "ไม่เป็นทีมหมอครอบครัว" - always show "-" */}
                    <td className="py-3 px-3 text-center text-gray-700 border border-gray-200">-</td>
                    {[2, 3, 4].map((i) => (
                      <td key={`fd_${i}`} className="py-3 px-3 text-center text-gray-700 border border-gray-200">
                        {row[`fd_${i}`] ?? "-"}
                      </td>
                    ))}
                    {/* Other Activities */}
                    {[1, 2, 3].map((i) => (
                      <td key={`oa_${i}`} className="py-3 px-3 text-center text-gray-700 border border-gray-200">
                        {row[`oa_${i}`] ?? "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {currentData.length > 0 && (
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

                <div className="text-xs font-medium text-gray-700 whitespace-nowrap">
                  รวม{" "}
                  <span className="font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                    {currentData.length.toLocaleString("th-TH")}
                  </span>{" "}
                  รายการ
                </div>

                <div className="flex items-center gap-2">
                  {currentData.length > 0 && (
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

                      {totalPages > 1 && (
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
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicReportComp;
