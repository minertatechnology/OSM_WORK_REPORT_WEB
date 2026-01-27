import React, { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Eye,
  EyeOff,
  Download,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  MapPin,
  Building2,
  FileText,
  Users,
  Baby,
  RotateCcw,
} from "lucide-react";
import CustomSelect from "@services/customSelectService/customSelectService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { font as sarabunFont } from "../../styles/Sarabun-Regular-normal";
import { fontbold as sarabunBoldFont } from "../../styles/Sarabun-Regular-bold";
import PregnantReportDetail from "./PregnantReportDetail/PregnantReportDetail";
import { getUserByExternalId } from "@services/oauth2Service";
import { getAllPregnantWomenEvaluations, aggregateByAssessor } from "@services/pregnantWomenService";
import { getOsmByHealthService } from "@services/lookupService";
// Lookup services now handled by usePermissionFilters hook
import {
  getCurrentFiscalYear,
  getCurrentCalendarYear,
  generateFiscalYearOptions,
  isInFiscalYear,
  isInCalendarYear,
  parseThaiDate,
  isInMonth,
} from "@utils/fiscalYearHelper";
import { usePermissionFilters } from "@hooks/usePermissionFilters";
import { useUserPermission } from "@context/UserPermissionProvider";

// Mock Data
const currentFiscalYear = getCurrentFiscalYear();
const YEARS = generateFiscalYearOptions(currentFiscalYear - 4, currentFiscalYear);

const YEAR_TYPES = [
  { label: "ปีงบประมาณ", value: "fiscal" },
  { label: "รายปี", value: "calendar" },
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

const WEEKS = [
  "สัปดาห์ 1 (1/6/68 - 7/6/68)",
  "สัปดาห์ 2 (8/6/68 - 14/6/68)",
  "สัปดาห์ 3 (15/6/68 - 21/6/68)",
  "สัปดาห์ 4 (22/6/68 - 30/6/68)",
];

// Tabs for report status
const TABS = [
  { key: "submitted", label: "ส่งรายงานแล้ว" },
  // { key: "notSubmitted", label: "ยังไม่ส่งรายงาน" }, // ซ่อนไว้ก่อน
];

// Table mock (100 rows) - เพิ่ม external_user_id สำหรับดึงข้อมูลจาก OAuth2
// ในตัวอย่างนี้ใช้ UUID จำลอง แต่ในการใช้งานจริงควรมาจาก API
const MOCK_USER_IDS = [
  "550e8400-e29b-41d4-a716-446655440001",
  "550e8400-e29b-41d4-a716-446655440002",
  "550e8400-e29b-41d4-a716-446655440003",
  "550e8400-e29b-41d4-a716-446655440004",
];

const ALL_ROWS = Array.from({ length: 100 }, (_, i) => ({
  index: i + 1,
  external_user_id: MOCK_USER_IDS[i % 4], // ใช้ external_user_id แทน name
  name: `นางสาว${
    ["ชุชนาถ ผดุงจิตร", "สมหญิง ใจดี", "วรรณา สุขใจ", "มาลี รักษ์ดี"][i % 4]
  }`, // เก็บไว้เป็น fallback
  date: `${(i % 28) + 1} มิถุนายน 2568`,
  amount: 15 + (i % 10),
  status: i % 3 === 0 ? "notSubmitted" : "submitted", // 1/3 ยังไม่ส่ง, 2/3 ส่งแล้ว
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

// Export functions
// 1. สรุปจำนวนการส่งรายงาน
function exportSummaryPDF(data, userDataMap) {
  const doc = new jsPDF();

  // Add Thai font
  doc.addFileToVFS("Sarabun-Regular.ttf", sarabunFont);
  doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
  doc.addFileToVFS("Sarabun-Bold.ttf", sarabunBoldFont);
  doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
  doc.setFont("Sarabun");

  // Title
  doc.setFontSize(16);
  doc.setFont("Sarabun", "bold");
  doc.text("การติดตามการได้รับยาเม็ดเสริมไอโอดีน", 105, 15, {
    align: "center",
  });

  doc.setFontSize(12);
  doc.setFont("Sarabun", "normal");
  doc.text(`วันที่ส่งออก: ${new Date().toLocaleDateString("th-TH")}`, 105, 23, {
    align: "center",
  });

  // Table settings
  const startX = 15;
  const startY = 35;
  const rowHeight = 8;
  const colWidths = [20, 70, 40, 35];
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const headers = ["ลำดับ", "ชื่อ-นามสกุล", "วันที่ส่ง", "จำนวน"];

  // Draw header
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.setFillColor(255, 255, 255);

  let xPos = startX;
  headers.forEach((header, i) => {
    doc.rect(xPos, startY, colWidths[i], rowHeight);
    doc.setFont("Sarabun", "bold");
    doc.setFontSize(11);
    doc.text(header, xPos + colWidths[i] / 2, startY + 5.5, {
      align: "center",
    });
    xPos += colWidths[i];
  });

  // Draw body
  let yPos = startY + rowHeight;
  doc.setFont("Sarabun", "normal");
  doc.setFontSize(10);

  data.forEach((row, idx) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    xPos = startX;

    // ลำดับ
    doc.rect(xPos, yPos, colWidths[0], rowHeight);
    doc.text(String(idx + 1), xPos + colWidths[0] / 2, yPos + 5.5, {
      align: "center",
    });
    xPos += colWidths[0];

    // ชื่อ - ใช้ข้อมูลจาก userDataMap
    const userData = userDataMap?.get(row.external_user_id);
    const displayName = userData?.name || row.name || "ไม่ระบุชื่อ";
    doc.rect(xPos, yPos, colWidths[1], rowHeight);
    doc.text(displayName, xPos + 3, yPos + 5.5);
    xPos += colWidths[1];

    // วันที่
    doc.rect(xPos, yPos, colWidths[2], rowHeight);
    doc.text(row.date, xPos + colWidths[2] / 2, yPos + 5.5, {
      align: "center",
    });
    xPos += colWidths[2];

    // จำนวน
    doc.rect(xPos, yPos, colWidths[3], rowHeight);
    doc.text(String(row.amount), xPos + colWidths[3] / 2, yPos + 5.5, {
      align: "center",
    });

    yPos += rowHeight;
  });

  doc.save(
    `สรุปจำนวนการส่งรายงาน_${new Date().toISOString().split("T")[0]}.pdf`
  );
}

// 2. สรุปภาพรวมรายงานในพื้นที่
function exportOverviewPDF(data, userDataMap) {
  const doc = new jsPDF();

  // Add Thai font
  doc.addFileToVFS("Sarabun-Regular.ttf", sarabunFont);
  doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
  doc.addFileToVFS("Sarabun-Bold.ttf", sarabunBoldFont);
  doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
  doc.setFont("Sarabun");

  // Title
  doc.setFontSize(16);
  doc.setFont("Sarabun", "bold");
  doc.text("สรุปภาพรวมรายงานประเมินหญิงตั้งครรภ์ในพื้นที่", 105, 15, {
    align: "center",
  });

  doc.setFontSize(12);
  doc.setFont("Sarabun", "normal");
  doc.text(`วันที่ส่งออก: ${new Date().toLocaleDateString("th-TH")}`, 105, 23, {
    align: "center",
  });

  // Table settings
  const startX = 15;
  const startY = 35;
  const rowHeight = 8;
  const colWidths = [20, 60, 35, 35, 35];
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const headers = ["ลำดับ", "ชื่อ-นามสกุล", "ส่งแล้ว", "ยังไม่ส่ง", "รวม"];

  // Draw header
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.setFillColor(255, 255, 255);

  let xPos = startX;
  headers.forEach((header, i) => {
    doc.rect(xPos, startY, colWidths[i], rowHeight);
    doc.setFont("Sarabun", "bold");
    doc.setFontSize(11);
    doc.text(header, xPos + colWidths[i] / 2, startY + 5.5, {
      align: "center",
    });
    xPos += colWidths[i];
  });

  // Draw body
  let yPos = startY + rowHeight;
  doc.setFont("Sarabun", "normal");
  doc.setFontSize(10);

  data.forEach((row, idx) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    xPos = startX;

    // ลำดับ
    doc.rect(xPos, yPos, colWidths[0], rowHeight);
    doc.text(String(idx + 1), xPos + colWidths[0] / 2, yPos + 5.5, {
      align: "center",
    });
    xPos += colWidths[0];

    // ชื่อ - ใช้ข้อมูลจาก userDataMap
    const userData = userDataMap?.get(row.external_user_id);
    const displayName = userData?.name || row.name || "ไม่ระบุชื่อ";
    doc.rect(xPos, yPos, colWidths[1], rowHeight);
    doc.text(displayName, xPos + 3, yPos + 5.5);
    xPos += colWidths[1];

    // ส่งแล้ว
    doc.rect(xPos, yPos, colWidths[2], rowHeight);
    doc.text("1", xPos + colWidths[2] / 2, yPos + 5.5, { align: "center" });
    xPos += colWidths[2];

    // ยังไม่ส่ง
    doc.rect(xPos, yPos, colWidths[3], rowHeight);
    doc.text("0", xPos + colWidths[3] / 2, yPos + 5.5, { align: "center" });
    xPos += colWidths[3];

    // รวม
    doc.rect(xPos, yPos, colWidths[4], rowHeight);
    doc.text(String(row.amount), xPos + colWidths[4] / 2, yPos + 5.5, {
      align: "center",
    });

    yPos += rowHeight;
  });

  doc.save(
    `สรุปภาพรวมรายงานในพื้นที่_${new Date().toISOString().split("T")[0]}.pdf`
  );
}

// 3. อสม. ที่ยังไม่ส่งรายงาน
function exportNotSubmittedPDF(data, userDataMap) {
  const doc = new jsPDF();

  // Add Thai font
  doc.addFileToVFS("Sarabun-Regular.ttf", sarabunFont);
  doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
  doc.addFileToVFS("Sarabun-Bold.ttf", sarabunBoldFont);
  doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
  doc.setFont("Sarabun");

  // Title
  doc.setFontSize(16);
  doc.setFont("Sarabun", "bold");
  doc.text("รายชื่อ อสม. ที่ยังไม่ส่งรายงาน", 105, 15, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("Sarabun", "normal");
  doc.text(`วันที่ส่งออก: ${new Date().toLocaleDateString("th-TH")}`, 105, 23, {
    align: "center",
  });

  // Filter only not submitted
  const notSubmittedData = data.filter((row) => row.status === "notSubmitted");

  // Table settings
  const startX = 15;
  const startY = 35;
  const rowHeight = 8;
  const colWidths = [20, 100, 65];
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const headers = ["ลำดับ", "ชื่อ-นามสกุล", "หมายเหตุ"];

  // Draw header
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.setFillColor(255, 255, 255);

  let xPos = startX;
  headers.forEach((header, i) => {
    doc.rect(xPos, startY, colWidths[i], rowHeight);
    doc.setFont("Sarabun", "bold");
    doc.setFontSize(11);
    doc.text(header, xPos + colWidths[i] / 2, startY + 5.5, {
      align: "center",
    });
    xPos += colWidths[i];
  });

  // Draw body
  let yPos = startY + rowHeight;
  doc.setFont("Sarabun", "normal");
  doc.setFontSize(10);

  notSubmittedData.forEach((row, idx) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    xPos = startX;

    // ลำดับ
    doc.rect(xPos, yPos, colWidths[0], rowHeight);
    doc.text(String(idx + 1), xPos + colWidths[0] / 2, yPos + 5.5, {
      align: "center",
    });
    xPos += colWidths[0];

    // ชื่อ - ใช้ข้อมูลจาก userDataMap
    const userData = userDataMap?.get(row.external_user_id);
    const displayName = userData?.name || row.name || "ไม่ระบุชื่อ";
    doc.rect(xPos, yPos, colWidths[1], rowHeight);
    doc.text(displayName, xPos + 3, yPos + 5.5);
    xPos += colWidths[1];

    // หมายเหตุ
    doc.rect(xPos, yPos, colWidths[2], rowHeight);
    doc.text("ยังไม่ส่งรายงาน", xPos + 3, yPos + 5.5);

    yPos += rowHeight;
  });

  doc.save(
    `อสม_ที่ยังไม่ส่งรายงาน_${new Date().toISOString().split("T")[0]}.pdf`
  );
}

function exportToExcel(data, userDataMap, title = "รายงานประเมินหญิงตั้งครรภ์") {
  // Prepare data for Excel
  const excelData = data.map((row, idx) => {
    const userData = userDataMap?.get(row.external_user_id);
    const displayName = userData?.name || row.name || "ไม่ระบุชื่อ";
    return {
      ลำดับ: idx + 1,
      "ชื่อ-นามสกุล": displayName,
      วันที่ส่ง: row.date,
      จำนวนหญิงตั้งครรภ์: row.amount,
    };
  });

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  ws["!cols"] = [
    { wch: 8 }, // ลำดับ
    { wch: 30 }, // ชื่อ-นามสกุล
    { wch: 20 }, // วันที่ส่ง
    { wch: 20 }, // จำนวนหญิงตั้งครรภ์
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "รายงาน");

  // Generate Excel file
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(
    blob,
    `pregnant_report_${new Date().toISOString().split("T")[0]}.xlsx`
  );
}

// Modal component styled like the image (for both download and detail)
function DetailModal({ open, onClose, data = [], userDataMap = new Map() }) {
  if (!open) return null;

  const handleExportSummaryPDF = () => {
    if (data.length > 0) {
      exportSummaryPDF(data, userDataMap);
    }
  };

  const handleExportOverviewPDF = () => {
    if (data.length > 0) {
      exportOverviewPDF(data, userDataMap);
    }
  };

  const handleExportNotSubmittedPDF = () => {
    // Use ALL_ROWS instead of data to get all records including notSubmitted
    const allData = ALL_ROWS;
    if (allData.length > 0) {
      exportNotSubmittedPDF(allData, userDataMap);
    }
  };

  const handleExportSummaryExcel = () => {
    if (data.length > 0) {
      exportToExcel(data, userDataMap, "สรุปจำนวนการส่งรายงาน");
    }
  };

  const handleExportOverviewExcel = () => {
    if (data.length > 0) {
      exportToExcel(data, userDataMap, "สรุปภาพรวมรายงานในพื้นที่");
    }
  };

  const handleExportNotSubmittedExcel = () => {
    // Use ALL_ROWS instead of data to get all records including notSubmitted
    const notSubmittedData = ALL_ROWS.filter(
      (row) => row.status === "notSubmitted"
    );
    if (notSubmittedData.length > 0) {
      exportToExcel(notSubmittedData, userDataMap, "อสม. ที่ยังไม่ส่งรายงาน");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#ece1f7] w-[95vw] max-w-xl p-6 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={20} className="text-gray-500" />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-[#7e32e2] to-[#a855f7] rounded-xl">
            <Download size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#231d37]">
              ดาวน์โหลดเอกสาร
            </h3>
            <p className="text-sm text-gray-500"></p>
          </div>
        </div>
        <div className="flex flex-col gap-4 mb-6">
          {/* Row 1 - สรุปจำนวนการส่งรายงาน */}
          <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl">
            <div className="flex-1 text-[15px] text-[#231d37] font-semibold">
              สรุปจำนวนการส่งรายงาน
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportSummaryPDF}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-white text-[#d32f2f] font-semibold text-sm shadow-sm hover:bg-red-50 hover:border-red-300 transition-all active:scale-95"
              >
                <Image
                  src="/pdf.png"
                  alt="pdf"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                PDF
              </button>
              <button
                onClick={handleExportSummaryExcel}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-green-200 bg-white text-[#388e3c] font-semibold text-sm shadow-sm hover:bg-green-50 hover:border-green-300 transition-all active:scale-95"
              >
                <Image
                  src="/xlsx.png"
                  alt="excel"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                Excel
              </button>
            </div>
          </div>

          {/* Row 2 - สรุปภาพรวมรายงานในพื้นที่ */}
          <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl">
            <div className="flex-1 text-[15px] text-[#231d37] font-semibold">
              สรุปภาพรวมรายงานในพื้นที่
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportOverviewPDF}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-white text-[#d32f2f] font-semibold text-sm shadow-sm hover:bg-red-50 hover:border-red-300 transition-all active:scale-95"
              >
                <Image
                  src="/pdf.png"
                  alt="pdf"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                PDF
              </button>
              <button
                onClick={handleExportOverviewExcel}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-green-200 bg-white text-[#388e3c] font-semibold text-sm shadow-sm hover:bg-green-50 hover:border-green-300 transition-all active:scale-95"
              >
                <Image
                  src="/xlsx.png"
                  alt="excel"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                Excel
              </button>
            </div>
          </div>

          {/* Row 3 - อสม. ที่ยังไม่ส่งรายงาน */}
          <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl">
            <div className="flex-1 text-[15px] text-[#231d37] font-semibold">
              อสม. ที่ยังไม่ส่งรายงาน
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportNotSubmittedPDF}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-white text-[#d32f2f] font-semibold text-sm shadow-sm hover:bg-red-50 hover:border-red-300 transition-all active:scale-95"
              >
                <Image
                  src="/pdf.png"
                  alt="pdf"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                PDF
              </button>
              <button
                onClick={handleExportNotSubmittedExcel}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-green-200 bg-white text-[#388e3c] font-semibold text-sm shadow-sm hover:bg-green-50 hover:border-green-300 transition-all active:scale-95"
              >
                <Image
                  src="/xlsx.png"
                  alt="excel"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                Excel
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7e32e2] to-[#a855f7] text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
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
    <div className="flex flex-col items-center gap-4 mt-6 mb-10 pt-4 border-t border-[#f0ebff]">
      {/* Mobile: Simple pagination */}
      <div className="flex sm:hidden items-center justify-between w-full">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
            currentPage === 1
              ? "text-gray-300 cursor-not-allowed"
              : "text-[#7e32e2] bg-purple-50 hover:bg-purple-100"
          }`}
        >
          <ChevronLeft size={16} />
          ก่อนหน้า
        </button>
        <div className="text-sm font-semibold text-[#7e32e2] bg-[#f6eeff] px-4 py-2 rounded-xl">
          {currentPage} / {totalPages}
        </div>
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
            currentPage === totalPages
              ? "text-gray-300 cursor-not-allowed"
              : "text-[#7e32e2] bg-purple-50 hover:bg-purple-100"
          }`}
        >
          ถัดไป
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Desktop: Full pagination */}
      <div className="hidden sm:flex flex-col lg:flex-row items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-2">
          <label
            htmlFor="per-page"
            className="text-sm text-gray-600 font-medium"
          >
            แสดง
          </label>
          <select
            id="per-page"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="appearance-none border-2 border-purple-200 rounded-full px-4 py-2 pr-8 text-sm font-semibold text-[#7e32e2] bg-gradient-to-r from-purple-50 to-violet-50 shadow transition focus:outline-none focus:ring-2 focus:ring-[#7e32e2] focus:border-transparent hover:border-purple-300 cursor-pointer"
          >
            {PER_PAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600">รายการต่อหน้า</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-2xl bg-white border border-[#ece1f7] shadow-lg backdrop-blur-sm flex-wrap justify-center">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
              currentPage === 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-110"
            }`}
            title="หน้าแรก"
          >
            <ChevronsLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
              currentPage === 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-110"
            }`}
            title="หน้าก่อนหน้า"
          >
            <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
          <div className="flex items-center gap-1 mx-1 sm:mx-2">
            {getPageNumbers(currentPage, totalPages).map((page, idx) =>
              page === "..." ? (
                <span
                  key={idx}
                  className="px-1 sm:px-2 py-1 text-gray-400 font-semibold select-none text-sm"
                >
                  ...
                </span>
              ) : (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[32px] sm:min-w-[36px] h-8 sm:h-9 rounded-full font-semibold text-sm sm:text-base transition-all duration-200 ${
                    currentPage === page
                      ? "bg-gradient-to-r from-[#7e32e2] to-[#a855f7] text-white shadow-lg scale-105 sm:scale-110"
                      : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-105"
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
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
              currentPage === totalPages
                ? "text-gray-300 cursor-not-allowed"
                : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-110"
            }`}
            title="หน้าถัดไป"
          >
            <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
              currentPage === totalPages
                ? "text-gray-300 cursor-not-allowed"
                : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-110"
            }`}
            title="หน้าสุดท้าย"
          >
            <ChevronsRight size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
          <div className="ml-2 sm:ml-3 text-xs sm:text-sm text-[#888] font-semibold bg-[#f6eeff] px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow whitespace-nowrap">
            หน้า {currentPage} / {totalPages}
          </div>
        </div>
      </div>

      {/* Mobile: Per page selector */}
      <div className="flex sm:hidden items-center gap-2">
        <span className="text-xs text-gray-500">แสดง</span>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="appearance-none border border-purple-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#7e32e2] bg-purple-50 focus:outline-none cursor-pointer"
        >
          {PER_PAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-500">รายการ</span>
      </div>
    </div>
  );
}

const PregnantReportComp = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ใช้ state เพื่อหลีกเลี่ยง hydration mismatch
  const [detailId, setDetailId] = useState(null);
  const [currentBuddhistYear, setCurrentBuddhistYear] = useState(null);

  // โหลด searchParams และปีปัจจุบันหลัง hydration เสร็จ
  useEffect(() => {
    setDetailId(searchParams.get("detail"));
    setCurrentBuddhistYear(new Date().getFullYear() + 543);
  }, [searchParams]);

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

  // State
  const [searchType, setSearchType] = useState("year");
  const [week, setWeek] = useState("สัปดาห์ 4 (22/6/68-30/6/68)");
  const [keyword, setKeyword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState("submitted");

  // Pagination state
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State สำหรับเก็บข้อมูลจาก API
  const [pregnantData, setPregnantData] = useState([]);
  const [allEvaluations, setAllEvaluations] = useState([]); // เก็บข้อมูล evaluations ทั้งหมด
  const [aggregatedData, setAggregatedData] = useState([]); // เก็บข้อมูลที่ aggregate แล้ว
  const [userDataMap, setUserDataMap] = useState(new Map());
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [availableYears, setAvailableYears] = useState([]); // เก็บรายการปีจากข้อมูล

  // State สำหรับเปิด/ปิดการแสดงเลขบัตรประชาชน
  const [visibleCitizenIds, setVisibleCitizenIds] = useState(new Set());

  // Set ปีเริ่มต้นหลัง currentBuddhistYear โหลดเสร็จ
  useEffect(() => {
    if (currentBuddhistYear && !year) {
      setYear(currentBuddhistYear.toString());
      if (availableYears.length === 0) {
        setAvailableYears([currentBuddhistYear.toString()]);
      }
    }
  }, [currentBuddhistYear, year, availableYears.length]);

  // Note: Location data loading is handled by usePermissionFilters hook

  // State สำหรับเก็บ OSM data ตามหน่วยบริการ
  const [osmDataByService, setOsmDataByService] = useState([]); // เก็บข้อมูล OSM ตามหน่วยบริการ

  // ดึงข้อมูลการประเมินหญิงตั้งครรภ์และข้อมูลผู้ใช้จาก API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      setIsLoadingUsers(true);

      try {
        // 1. ดึงข้อมูลการประเมินทั้งหมด
        const evaluations = await getAllPregnantWomenEvaluations({ skip: 0, limit: 1000 });
        setAllEvaluations(evaluations); // เก็บข้อมูล evaluations ทั้งหมด

        // 1.1 สร้างรายการปีจาก created_at
        const yearsSet = new Set();
        evaluations.forEach(evaluation => {
          if (evaluation.created_at) {
            const date = new Date(evaluation.created_at);
            const buddhistYear = date.getFullYear() + 543;
            yearsSet.add(buddhistYear.toString());
          }
        });
        const yearsList = Array.from(yearsSet).sort((a, b) => b - a); // เรียงจากมากไปน้อย
        setAvailableYears(yearsList.length > 0 ? yearsList : [currentBuddhistYear.toString()]);

        // 2. รวมข้อมูลตาม external_user_id
        const aggregated = aggregateByAssessor(evaluations);
        setAggregatedData(aggregated); // เก็บข้อมูลที่ aggregate แล้ว

        // 3. แปลงเป็นรูปแบบที่ใช้แสดงในตาราง
        const formattedData = aggregated.map((item, index) => {
          const date = new Date(item.latest_date);
          const thaiYear = date.getFullYear() + 543; // แปลงเป็นปีพุทธศักราช
          const formattedDate = date.toLocaleDateString("th-TH", {
            day: "numeric",
            month: "long",
          }) + " " + thaiYear;

          // หา evaluation ล่าสุดเพื่อดึง location_data และ citizen_id
          const latestEvaluation = evaluations.find(
            evaluation => evaluation.external_user_id === item.external_user_id &&
                         evaluation.created_at === item.latest_date
          ) || evaluations.find(evaluation => evaluation.external_user_id === item.external_user_id);

          return {
            index: index + 1,
            external_user_id: item.external_user_id,
            name: "กำลังโหลด...", // จะถูกแทนที่ด้วยชื่อจริงจาก OAuth2
            date: formattedDate,
            _thaiDate: formattedDate, // เก็บวันที่แบบไทยสำหรับการกรอง
            amount: item.count,
            status: item.status || "submitted",
            location_data: latestEvaluation?.location_data || {},
            citizen_id: latestEvaluation?.citizen_id || "",
          };
        });

        setPregnantData(formattedData);

        // 4. ดึงข้อมูลผู้ใช้จาก OAuth2 API
        const newUserDataMap = new Map();
        const uniqueUserIds = [...new Set(aggregated.map(item => item.external_user_id))];

        await Promise.allSettled(
          uniqueUserIds.map(async (userId) => {
            try {
              const userData = await getUserByExternalId(userId);
              newUserDataMap.set(userId, userData);
            } catch (error) {
              // ไม่ log error 404
              if (error?.response?.status !== 404) {
                console.error(`Failed to fetch user ${userId}:`, error);
              }
              // ใช้ข้อมูล fallback
              newUserDataMap.set(userId, {
                id: userId,
                name: "ไม่ระบุชื่อ",
                external_user_id: userId,
              });
            }
          })
        );

        setUserDataMap(newUserDataMap);
      } catch (error) {
        console.error("Failed to fetch pregnant women data:", error);
        // ถ้า error ใช้ mock data แทน
        setPregnantData(ALL_ROWS);
      } finally {
        setIsLoadingData(false);
        setIsLoadingUsers(false);
      }
    };

    fetchData();
  }, []); // ดึงข้อมูลครั้งเดียวตอน mount

  // ดึงข้อมูล OSM ตามหน่วยบริการ
  useEffect(() => {
    const fetchOsmData = async () => {
      if (service) {
        try {
          const osmData = await getOsmByHealthService(service);
          setOsmDataByService(osmData);
        } catch (err) {
          console.error("Error fetching OSM data:", err);
          setOsmDataByService([]);
        }
      } else {
        setOsmDataByService([]);
      }
    };

    fetchOsmData();
  }, [service]);

  // Note: Location data loading is now handled by usePermissionFilters hook

  // Helper function เพื่อดึงชื่อผู้ใช้จาก userDataMap
  const getUserName = (external_user_id, fallbackName) => {
    const userData = userDataMap.get(external_user_id);
    return userData?.name || fallbackName || "กำลังโหลด...";
  };

  // ใช้ข้อมูลจาก API หรือ fallback เป็น mock data
  const dataSource = pregnantData.length > 0 ? pregnantData : ALL_ROWS;

  // เลือกรายการเดือนตามประเภทปี
  const monthOptions = useMemo(() => {
    return yearType === "fiscal" ? FISCAL_MONTHS : MONTHS;
  }, [yearType]);

  // Filter rows by tab, year, location, and keyword
  const filteredRows = useMemo(() => {
    return dataSource.filter((row) => {
      const userName = getUserName(row.external_user_id, row.name);

      // กรองตาม location_data (แมพ code จาก dropdown กับชื่อใน location_data)
      const locationData = row.location_data || {};

      // Filter ตามหน่วยบริการ (เฉพาะบริการสุขภาพอสม.)
      // ถ้าเลือกหน่วยบริการ ให้ filter เฉพาะตามหน่วยบริการเท่านั้น (สำคัญสุด)
      // ไม่สน filter อื่นๆ เช่น จังหวัด/อำเภอ/ตำบล
      if (service && osmDataByService.length > 0) {
        // สร้าง Set ของ OSM IDs เพื่อให้การ lookup เร็วขึ้น
        const osmIdSet = new Set(osmDataByService.map(osm => osm.id));

        // Filter เฉพาะรายงานที่มี external_user_id อยู่ใน osmIdSet
        return row.external_user_id && osmIdSet.has(row.external_user_id) &&
               row.status === activeTab;
      }

      // ไม่ได้เลือกหน่วยบริการ หรือไม่มีข้อมูล OSM ให้ filter ตามพื้นที่ตามปกติ

      // กรองตามเขตสุขภาพ
      if (zone) {
        const selectedHealthArea = healthAreas.find(h => h.code === zone);
        if (selectedHealthArea && selectedHealthArea.provinces) {
          const provinceInHealthArea = selectedHealthArea.provinces.find(
            p => p.name_th === locationData.region
          );
          if (!provinceInHealthArea) {
            return false;
          }
        }
      }

      // หาชื่อจังหวัดจาก code ที่เลือก (ใช้ name_th)
      const selectedProvince = provinces.find(p => p.code === province);
      const provinceMatch = !province || locationData.region === selectedProvince?.name_th;

      // หาชื่ออำเภอจาก code ที่เลือก (ใช้ name_th)
      const selectedDistrict = districts.find(d => d.code === district);
      const districtMatch = !district || locationData.city === selectedDistrict?.name_th;

      // หาชื่อตำบลจาก code ที่เลือก (ใช้ name_th)
      const selectedSubdistrict = subdistricts.find(s => s.code === subdistrict);
      const subdistrictMatch = !subdistrict || locationData.district === selectedSubdistrict?.name_th;

      // กรองตาม keyword
      const keywordMatch = !keyword || (
        userName.includes(keyword) ||
        row.date.includes(keyword) ||
        String(row.index).includes(keyword) ||
        row.citizen_id?.includes(keyword) ||
        locationData.region?.includes(keyword) ||
        locationData.city?.includes(keyword) ||
        locationData.district?.includes(keyword)
      );

      // Year filtering
      if (year && row._thaiDate) {
        const parsedDate = parseThaiDate(row._thaiDate);
        if (parsedDate) {
          const yearNum = parseInt(year);
          const matchesYear = yearType === "fiscal"
            ? isInFiscalYear(parsedDate, yearNum)
            : isInCalendarYear(parsedDate, yearNum);

          if (!matchesYear) {
            return false;
          }
        }
      }

      // Month filtering
      if (month && row._thaiDate) {
        const parsedDate = parseThaiDate(row._thaiDate);
        if (parsedDate && !isInMonth(parsedDate, month)) {
          return false;
        }
      }

      return (
        row.status === activeTab &&
        provinceMatch &&
        districtMatch &&
        subdistrictMatch &&
        keywordMatch
      );
    });
  }, [dataSource, activeTab, year, yearType, month, zone, province, district, subdistrict, service, keyword, healthAreas, provinces, districts, subdistricts, userDataMap, osmDataByService]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));
  const paginatedRows = filteredRows.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Reset page when changing tabs
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  // Stats - removed totalReports and totalPregnant as they are not displayed

  // Reset page if needed
  React.useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [filteredRows.length, totalPages, itemsPerPage, page]);

  const handleClear = () => {
    handleReset(String(currentFiscalYear), "fiscal");
    setWeek("สัปดาห์ 4 (22/6/68-30/6/68)");
    setKeyword("");
  };

  // ถ้ามี detailId ให้แสดงหน้ารายละเอียด
  if (detailId) {
    const selectedRow = pregnantData.find((row) => row.index === Number(detailId)) ||
                        ALL_ROWS.find((row) => row.index === Number(detailId));

    // หาข้อมูล evaluations ของ user นี้
    const userEvaluations = allEvaluations.filter(
      (evaluation) => evaluation.external_user_id === selectedRow?.external_user_id
    );

    // ดึงชื่อจาก userDataMap
    const userName = getUserName(selectedRow?.external_user_id, selectedRow?.name);

    // ดึงปีจาก created_at ของ evaluation แรก (หรือใช้ปีปัจจุบันถ้าไม่มีข้อมูล)
    let reportYear = currentBuddhistYear ? currentBuddhistYear.toString() : new Date().getFullYear() + 543 + "";
    if (userEvaluations.length > 0 && userEvaluations[0].created_at) {
      const date = new Date(userEvaluations[0].created_at);
      reportYear = (date.getFullYear() + 543).toString();
    }

    return (
      <PregnantReportDetail
        reportData={{
          year: reportYear,
          month,
          name: userName || "ไม่พบข้อมูล",
          date: selectedRow?.date || selectedRow?._thaiDate || "",
          external_user_id: selectedRow?.external_user_id,
        }}
        evaluations={userEvaluations}
      />
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#faf8ff] via-white to-[#f5f0ff] p-0">
      {/* Modal */}
      <DetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        data={filteredRows}
        userDataMap={userDataMap}
      />

      {/* Header Section with Gradient */}
      <div className="relative mb-6 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7e32e2] via-[#9333ea] to-[#a855f7]" />
        <div className="absolute inset-0 bg-white/5" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Title & Actions */}
            <div className="text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Baby size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    การติดตามการได้รับยาเม็ดเสริมไอโอดีน
                  </h1>
                  <p className="text-white/80 text-sm mt-1">
                    แดชบอร์ดรายงานและดาวน์โหลดสำหรับการติดตามการได้รับยาเม็ดเสริมไอโอดีน
                  </p>
                </div>
              </div>
            </div>
            <button
              className="flex items-center gap-2 px-6 py-3 bg-white text-[#7e32e2] font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              onClick={() => setModalOpen(true)}
            >
              <Download size={20} />
              ดาวน์โหลดเอกสาร
            </button>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#ece1f7] p-6 mb-6">

        {/* Search Type Radio */}
        {/* <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-[#f0ebff]">
          <span className="font-semibold text-[#231d37] text-[15px]">
            รูปแบบการค้นหา :
          </span>
          <label className="flex items-center cursor-pointer group">
            <input
              type="radio"
              checked={searchType === "year"}
              onChange={() => setSearchType("year")}
              className="hidden"
            />
            <span
              className={`w-5 h-5 mr-2 rounded-full border-2 flex items-center justify-center transition-all ${
                searchType === "year"
                  ? "border-[#7e32e2] bg-purple-50"
                  : "border-gray-300 bg-white group-hover:border-purple-300"
              }`}
            >
              {searchType === "year" && (
                <span className="w-2.5 h-2.5 bg-[#7e32e2] rounded-full" />
              )}
            </span>
            <span
              className={`font-medium transition-colors ${
                searchType === "year"
                  ? "text-[#7e32e2]"
                  : "text-gray-500 group-hover:text-gray-700"
              }`}
            >
              ค้นหาแบบรายปี
            </span>
          </label>
          <label className="flex items-center cursor-pointer group">
            <input
              type="radio"
              checked={searchType === "budget"}
              onChange={() => setSearchType("budget")}
              className="hidden"
            />
            <span
              className={`w-5 h-5 mr-2 rounded-full border-2 flex items-center justify-center transition-all ${
                searchType === "budget"
                  ? "border-[#7e32e2] bg-purple-50"
                  : "border-gray-300 bg-white group-hover:border-purple-300"
              }`}
            >
              {searchType === "budget" && (
                <span className="w-2.5 h-2.5 bg-[#7e32e2] rounded-full" />
              )}
            </span>
            <span
              className={`font-medium transition-colors ${
                searchType === "budget"
                  ? "text-[#7e32e2]"
                  : "text-gray-500 group-hover:text-gray-700"
              }`}
            >
              ค้นหาแบบรายปีงบประมาณ
            </span>
          </label>
        </div> */}

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
          {/* <CustomSelect
            label="สัปดาห์"
            value={week}
            onChange={(e) => setWeek(e.target.value)}
            options={WEEKS.map((w) => ({ label: w, value: w }))}
            placeholder="-- เลือกสัปดาห์ --"
            icon={Calendar}
          /> */}
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
            options={provinces.map((p) => ({
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
            options={districts.map((d) => ({
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
            options={subdistricts.map((s) => ({
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
            options={healthServices.map((s) => ({
              label: s.name_th || s.name || s.service_name || "ไม่ระบุ",
              value: String(s.id || s.code || "")
            }))}
            placeholder="-- เลือกหน่วยบริการ --"
            icon={Building2}
            disabled={isLocked('service') || isServiceDisabled}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            className="flex-1 flex items-center justify-center gap-2 h-12 px-6 bg-gradient-to-r from-[#7e32e2] to-[#a855f7] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
            onClick={() => setPage(1)}
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

      {/* Tabs + Search bar + Results */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#ece1f7] p-6">
        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 p-1 bg-white rounded-xl border border-[#ece1f7] shadow-md w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-gradient-to-r from-[#7e32e2] to-[#9333ea] text-white shadow-md"
                    : "text-gray-600 hover:bg-[#f6eeff]"
                }`}
                onClick={() => setActiveTab(tab.key)}
                role="tab"
                aria-selected={activeTab === tab.key}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 w-full">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
              placeholder="ค้นหาชื่อและนามสกุล..."
              className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-purple-200 bg-gradient-to-r from-purple-50/50 to-violet-50/50 focus:outline-none focus:border-[#7e32e2] focus:ring-2 focus:ring-purple-200 transition-all duration-200"
            />
            {keyword && (
              <button
                onClick={() => setKeyword("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <button className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#7e32e2] to-[#9333ea] text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
            <Search size={18} />
            <span>ค้นหา</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-[#ece1f7]">
          <table className="w-full text-[15px]" style={{ minWidth: "800px" }}>
            <thead>
              <tr className="bg-gradient-to-r from-[#7e32e2] to-[#a855f7] text-white">
                <th className="py-4 px-4 font-semibold text-center rounded-tl-xl">
                  ลำดับ
                </th>
                <th className="py-4 px-4 font-semibold text-left">
                  ชื่อ-นามสกุล
                </th>
                <th className="py-4 px-4 font-semibold text-center">
                  เลขบัตรประชาชน
                </th>
                <th className="py-4 px-4 font-semibold text-center">
                  วันที่คัดกรอง
                </th>
                <th className="py-4 px-4 font-semibold text-center">
                  จำนวนการติดตาม
                </th>
                {activeTab === "submitted" && (
                  <th className="py-4 px-4 font-semibold text-center rounded-tr-xl">
                    รายละเอียด
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {isLoadingData ? (
                <tr>
                  <td
                    colSpan={activeTab === "submitted" ? 6 : 5}
                    className="py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                      <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={activeTab === "submitted" ? 6 : 5}
                    className="py-12 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <FileText size={48} className="text-gray-300" />
                      <p className="text-gray-500">ไม่พบข้อมูล</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const displayName = getUserName(row.external_user_id, row.name);

                  return (
                    <tr
                      key={row.index}
                      className={`${
                        idx % 2 === 0 ? "bg-white" : "bg-purple-50/30"
                      } hover:bg-purple-50 transition-colors`}
                    >
                      <td className="py-4 px-4 text-center font-medium text-gray-600">
                        {(page - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="py-4 px-4 font-medium text-[#231d37]">
                        {isLoadingUsers ? (
                          <span className="text-gray-400">กำลังโหลด...</span>
                        ) : (
                          displayName
                        )}
                      </td>
                      <td className="py-4 px-4 text-center text-sm text-gray-600">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-mono">
                            {row.citizen_id ? (
                              visibleCitizenIds.has(row.index) ? (
                                row.citizen_id
                              ) : (
                                row.citizen_id.slice(0, -4) + "XXXX"
                              )
                            ) : (
                              <span className="text-gray-400">ไม่ระบุ</span>
                            )}
                          </span>
                          {row.citizen_id && (
                            <button
                              onClick={() => {
                                const newVisible = new Set(visibleCitizenIds);
                                if (newVisible.has(row.index)) {
                                  newVisible.delete(row.index);
                                } else {
                                  newVisible.add(row.index);
                                }
                                setVisibleCitizenIds(newVisible);
                              }}
                              className="p-1 rounded hover:bg-gray-100 transition-colors"
                              title={visibleCitizenIds.has(row.index) ? "ซ่อนเลขบัตร" : "แสดงเลขบัตร"}
                            >
                              {visibleCitizenIds.has(row.index) ? (
                                <EyeOff size={16} className="text-gray-500" />
                              ) : (
                                <Eye size={16} className="text-gray-500" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center text-gray-600">
                        {row.date}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-100 text-pink-700 font-semibold text-sm">
                          <Baby size={14} />
                          {row.amount}
                        </span>
                      </td>
                      {activeTab === "submitted" && (
                        <td className="py-4 px-4 text-center">
                          <button
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7e32e2] to-[#9333ea] text-white font-semibold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                            onClick={() =>
                              router.push(`/pregnant-report?detail=${row.index}`)
                            }
                          >
                            <Eye size={16} />
                            ดูรายละเอียด
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

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

export default PregnantReportComp;
