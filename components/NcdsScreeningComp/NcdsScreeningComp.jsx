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
  ChevronDown,
  Calendar,
  MapPin,
  Building2,
  Heart,
  RotateCcw,
  FileText,
  Users,
} from "lucide-react";
import CustomSelect from "@services/customSelectService/customSelectService";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { font as sarabunFont } from "../../styles/Sarabun-Regular-normal";
import { fontbold as sarabunBoldFont } from "../../styles/Sarabun-Regular-bold";
import NcdsScreeningDetail from "./NcdsScreeningDetail/NcdsScreeningDetail";
import { getOsmByHealthService } from "@services/lookupService";
import { getUniqueUsersCount } from "@services/analyticsService";
import { getUsersCount } from "@services/analyticsService";
// Lookup services now handled by usePermissionFilters hook
import {
  getCurrentFiscalYear,
  getCurrentCalendarYear,
  getCurrentMonth,
  generateFiscalYearOptions,
  isInFiscalYear,
  isInCalendarYear,
  parseThaiDate,
  isInMonth
} from "@utils/fiscalYearHelper";
import { usePermissionFilters } from "@hooks/usePermissionFilters";
import { useUserPermission } from "@context/UserPermissionProvider";

// Mock Data
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

const WEEKS = ["สัปดาห์ 4 (23/6/68-27/6/68)", "สัปดาห์ 3 (16/6/68-22/6/68)"];

const YEAR_TYPES = [
  { label: "ปีงบประมาณ", value: "fiscal" },
  { label: "รายปี", value: "calendar" },
];

// Table mock (100 rows)
const ALL_ROWS = Array.from({ length: 100 }, (_, i) => ({
  index: i + 1,
  name: "นางสาวชบุษบก ผดุงจิตร",
  date: "25 มิถุนายน 2568",
  amount: 20,
}));

const PER_PAGE_OPTIONS = [
  { label: "10", value: 10 },
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
];

// Export helpers
function exportSummaryPDF(data) {
  const doc = new jsPDF();

  doc.addFileToVFS("Sarabun-Regular.ttf", sarabunFont);
  doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
  doc.addFileToVFS("Sarabun-Bold.ttf", sarabunBoldFont);
  doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
  doc.setFont("Sarabun");

  doc.setFontSize(16);
  doc.setFont("Sarabun", "bold");
  doc.text("สรุปจำนวนการส่งรายงานคัดกรอง NCDs", 105, 15, { align: "center" });
  doc.setFontSize(12);
  doc.setFont("Sarabun", "normal");
  doc.text(`วันที่ส่งออก: ${new Date().toLocaleDateString("th-TH")}`, 105, 23, {
    align: "center",
  });

  const startX = 15;
  const startY = 35;
  const rowHeight = 8;
  const colWidths = [20, 90, 40, 40];
  const headers = ["ลำดับ", "ชื่อ-นามสกุล", "วันที่", "จำนวนรายงาน"];

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

  let yPos = startY + rowHeight;
  doc.setFont("Sarabun", "normal");
  doc.setFontSize(10);

  data.forEach((row, idx) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    xPos = startX;
    doc.rect(xPos, yPos, colWidths[0], rowHeight);
    doc.text(String(idx + 1), xPos + colWidths[0] / 2, yPos + 5.5, {
      align: "center",
    });
    xPos += colWidths[0];

    doc.rect(xPos, yPos, colWidths[1], rowHeight);
    doc.text(row.name, xPos + 3, yPos + 5.5);
    xPos += colWidths[1];

    doc.rect(xPos, yPos, colWidths[2], rowHeight);
    doc.text(row.date, xPos + colWidths[2] / 2, yPos + 5.5, {
      align: "center",
    });
    xPos += colWidths[2];

    doc.rect(xPos, yPos, colWidths[3], rowHeight);
    doc.text(String(row.amount), xPos + colWidths[3] / 2, yPos + 5.5, {
      align: "center",
    });

    yPos += rowHeight;
  });

  // Save PDF - Format: NCDs_{year}.pdf
  const currentYear = new Date().getFullYear();
  doc.save(`NCDs_${currentYear}.pdf`);
}

function exportOverviewPDF(data) {
  const doc = new jsPDF();

  doc.addFileToVFS("Sarabun-Regular.ttf", sarabunFont);
  doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
  doc.addFileToVFS("Sarabun-Bold.ttf", sarabunBoldFont);
  doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
  doc.setFont("Sarabun");

  doc.setFontSize(16);
  doc.setFont("Sarabun", "bold");
  doc.text("สรุปภาพรวมรายงานคัดกรอง NCDs ในพื้นที่", 105, 15, {
    align: "center",
  });
  doc.setFontSize(12);
  doc.setFont("Sarabun", "normal");
  doc.text(`วันที่ส่งออก: ${new Date().toLocaleDateString("th-TH")}`, 105, 23, {
    align: "center",
  });

  const startX = 15;
  const startY = 35;
  const rowHeight = 8;
  const colWidths = [20, 60, 35, 35, 35];
  const headers = ["ลำดับ", "ชื่อ-นามสกุล", "ส่งแล้ว", "ยังไม่ส่ง", "รวม"];

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

  let yPos = startY + rowHeight;
  doc.setFont("Sarabun", "normal");
  doc.setFontSize(10);

  data.forEach((row, idx) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    xPos = startX;
    doc.rect(xPos, yPos, colWidths[0], rowHeight);
    doc.text(String(idx + 1), xPos + colWidths[0] / 2, yPos + 5.5, {
      align: "center",
    });
    xPos += colWidths[0];

    doc.rect(xPos, yPos, colWidths[1], rowHeight);
    doc.text(row.name, xPos + 3, yPos + 5.5);
    xPos += colWidths[1];

    doc.rect(xPos, yPos, colWidths[2], rowHeight);
    doc.text("1", xPos + colWidths[2] / 2, yPos + 5.5, { align: "center" });
    xPos += colWidths[2];

    doc.rect(xPos, yPos, colWidths[3], rowHeight);
    doc.text("0", xPos + colWidths[3] / 2, yPos + 5.5, { align: "center" });
    xPos += colWidths[3];

    doc.rect(xPos, yPos, colWidths[4], rowHeight);
    doc.text(String(row.amount), xPos + colWidths[4] / 2, yPos + 5.5, {
      align: "center",
    });

    yPos += rowHeight;
  });

  // Save PDF - Format: NCDs_{year}.pdf
  const currentYear = new Date().getFullYear();
  doc.save(`NCDs_${currentYear}.pdf`);
}

function exportNotSubmittedPDF(data) {
  const doc = new jsPDF();

  doc.addFileToVFS("Sarabun-Regular.ttf", sarabunFont);
  doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
  doc.addFileToVFS("Sarabun-Bold.ttf", sarabunBoldFont);
  doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
  doc.setFont("Sarabun");

  doc.setFontSize(16);
  doc.setFont("Sarabun", "bold");
  doc.text("รายชื่อ อสม. ที่ยังไม่ส่งรายงานคัดกรอง NCDs", 105, 15, {
    align: "center",
  });

  doc.setFontSize(12);
  doc.setFont("Sarabun", "normal");
  doc.text(`วันที่ส่งออก: ${new Date().toLocaleDateString("th-TH")}`, 105, 23, {
    align: "center",
  });

  const notSubmittedData = data.filter((row) => row.status === "notSubmitted");

  const startX = 15;
  const startY = 35;
  const rowHeight = 8;
  const colWidths = [20, 100, 65];
  const headers = ["ลำดับ", "ชื่อ-นามสกุล", "สถานะ"];

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

  let yPos = startY + rowHeight;
  doc.setFont("Sarabun", "normal");
  doc.setFontSize(10);

  notSubmittedData.forEach((row, idx) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    xPos = startX;
    doc.rect(xPos, yPos, colWidths[0], rowHeight);
    doc.text(String(idx + 1), xPos + colWidths[0] / 2, yPos + 5.5, {
      align: "center",
    });
    xPos += colWidths[0];

    doc.rect(xPos, yPos, colWidths[1], rowHeight);
    doc.text(row.name, xPos + 3, yPos + 5.5);
    xPos += colWidths[1];

    doc.rect(xPos, yPos, colWidths[2], rowHeight);
    doc.text("ยังไม่ส่งรายงาน", xPos + 3, yPos + 5.5);

    yPos += rowHeight;
  });

  // Save PDF - Format: NCDs_{year}.pdf
  const currentYear = new Date().getFullYear();
  doc.save(`NCDs_${currentYear}.pdf`);
}

function exportToExcel(data, title = "��§ҹ�Ѵ��ͧ�ä NCDs") {
  const excelData = data.map((row, idx) => ({
    "�ӴѺ": idx + 1,
    "����-���ʡ��": row.name,
    "�ѹ�����": row.date,
    "�ӹǹ��ѧ�����͹": row.amount,
  }));

  const ws = XLSX.utils.json_to_sheet(excelData);
  ws["!cols"] = [{ wch: 8 }, { wch: 30 }, { wch: 20 }, { wch: 20 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "��§ҹ");

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  // Save Excel - Format: NCDs_{year}.xlsx
  const currentYear = new Date().getFullYear();
  saveAs(blob, `NCDs_${currentYear}.xlsx`);
}

// Modal component styled like the image (for both download and detail)
function DetailModal({ open, onClose, data = [] }) {
  if (!open) return null;

  const rows = data?.length ? data : ALL_ROWS;

  const handleExportSummaryPDF = () => {
    if (rows.length) exportSummaryPDF(rows);
  };
  const handleExportOverviewPDF = () => {
    if (rows.length) exportOverviewPDF(rows);
  };
  const handleExportNotSubmittedPDF = () => {
    if (rows.length) exportNotSubmittedPDF(rows);
  };
  const handleExportExcel = (payload = rows, title) => {
    if (payload.length) exportToExcel(payload, title);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#ece1f7] w-full max-w-2xl p-6 relative">
        <div className="text-[20px] font-bold text-[#7e32e2] mb-5">
          ดาวน์โหลดเอกสาร
        </div>
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 bg-purple-50/60 border border-purple-100 rounded-xl px-4 py-3">
            <div className="flex-1 text-[16px] text-[#231d37] font-semibold">
              สรุปจำนวนการส่งรายงาน
            </div>
            <div className="flex gap-2">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-white text-[#d32f2f] font-semibold text-[15px] shadow-sm hover:bg-red-50 hover:border-red-300 transition-all active:scale-95"
                onClick={handleExportSummaryPDF}
              >
                <Image
                  src="/pdf.png"
                  alt="pdf"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
                เอกสาร PDF
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-green-200 bg-white text-[#388e3c] font-semibold text-[15px] shadow-sm hover:bg-green-50 hover:border-green-300 transition-all active:scale-95"
                onClick={() => handleExportExcel(rows)}
              >
                <Image
                  src="/xlsx.png"
                  alt="excel"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
                เอกสาร Excel
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 bg-purple-50/40 border border-purple-100 rounded-xl px-4 py-3">
            <div className="flex-1 text-[16px] text-[#231d37] font-semibold">
              สรุปภาพรวมรายงานในพื้นที่
            </div>
            <div className="flex gap-2">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-white text-[#d32f2f] font-semibold text-[15px] shadow-sm hover:bg-red-50 hover:border-red-300 transition-all active:scale-95"
                onClick={handleExportOverviewPDF}
              >
                <Image
                  src="/pdf.png"
                  alt="pdf"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
                เอกสาร PDF
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-green-200 bg-white text-[#388e3c] font-semibold text-[15px] shadow-sm hover:bg-green-50 hover:border-green-300 transition-all active:scale-95"
                onClick={() =>
                  handleExportExcel(rows, "สรุปภาพรวมรายงานในพื้นที่")
                }
              >
                <Image
                  src="/xlsx.png"
                  alt="excel"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
                เอกสาร Excel
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 bg-purple-50/30 border border-purple-100 rounded-xl px-4 py-3">
            <div className="flex-1 text-[16px] text-[#231d37] font-semibold">
              อสม. ที่ยังไม่ส่งรายงาน
            </div>
            <div className="flex gap-2">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-white text-[#d32f2f] font-semibold text-[15px] shadow-sm hover:bg-red-50 hover:border-red-300 transition-all active:scale-95"
                onClick={handleExportNotSubmittedPDF}
              >
                <Image
                  src="/pdf.png"
                  alt="pdf"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
                เอกสาร PDF
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-green-200 bg-white text-[#388e3c] font-semibold text-[15px] shadow-sm hover:bg-green-50 hover:border-green-300 transition-all active:scale-95"
                onClick={() =>
                  handleExportExcel(
                    rows.slice(0, 10),
                    "อสม. ที่ยังไม่ส่งรายงาน"
                  )
                }
              >
                <Image
                  src="/xlsx.png"
                  alt="excel"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
                เอกสาร Excel
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            className="px-6 py-2 rounded-xl border border-[#7e32e2] text-[#7e32e2] bg-white font-semibold text-[16px] shadow hover:bg-[#f6eeff] transition"
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

const NcdsScreeningComp = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ใช้ state เพื่อหลีกเลี่ยง hydration mismatch
  const [detailId, setDetailId] = useState(null);

  // โหลด searchParams หลัง hydration เสร็จ
  useEffect(() => {
    setDetailId(searchParams.get("detail"));
  }, [searchParams]);

  const currentFiscalYear = getCurrentFiscalYear();

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
    defaultMonth: getCurrentMonth(),
  });

  const [searchType, setSearchType] = useState("year");
  const [week, setWeek] = useState("สัปดาห์ 4 (23/6/68-27/6/68)");
  const [keyword, setKeyword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedCitizenIds, setExpandedCitizenIds] = useState(new Set());

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State สำหรับเก็บข้อมูลจาก API
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [osmDataByService, setOsmDataByService] = useState([]); // เก็บข้อมูล OSM ตามหน่วยบริการ
  const [uniqueUserCount, setUniqueUserCount] = useState(0); // จำนวน อสม. ที่ส่งรายงาน

  // Note: Location data loading is handled by usePermissionFilters hook
  // Note: usePermissionFilters already sets the default year, so no need for separate initialization

  // ดึงข้อมูลจาก API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

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

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_SMART_OSM_URL}/ncd-screeningsall?skip=0&limit=100`);
        const data = await response.json();

        // แปลงข้อมูลจาก API ให้เป็นรูปแบบที่ใช้แสดงในตาราง
        const transformedData = data.map((item, index) => ({
          index: index + 1,
          id: item.id,
          name: `${item.prefix}${item.first_name} ${item.last_name}`,
          date: formatThaiDate(item.assessment_date),
          _thaiDate: formatThaiDate(item.assessment_date), // เก็บวันที่ไทยสำหรับการกรอง
          _citizenId: item.citizen_id || "", // เก็บเลขบัตรประชาชนสำหรับการค้นหา
          rawData: item, // เก็บข้อมูลดิบไว้ใช้ในหน้ารายละเอียด
          location_data: item.location_data || {}, // เก็บข้อมูล location
          external_user_id: item.external_user_id, // เพิ่ม external_user_id
          osm_code: item.osm_code, // เพิ่ม osm_code สำหรับชื่อไฟล์
        }));

        setAllRows(transformedData);
      } catch (error) {
        console.error("Failed to fetch NCD screening data:", error);
        setAllRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [service]); // เฉพาะ service เท่านั้นที่ต้องดึงข้อมูลใหม่ (ไม่ใช้ currentBuddhistYear เพราะ API ไม่ได้กรองตามปี)

  // ดึงจำนวน Unique Users
  useEffect(() => {
    const fetchUniqueUsers = async () => {
      try {
        const result = await getUniqueUsersCount({
          menu_type: "ncds",
          year: year ? parseInt(year) : undefined,
          month: month ? parseInt(month) : undefined,
        });
        setUniqueUserCount(result?.unique_users || result?.count || 0);
      } catch (error) {
        console.error("Error fetching unique users count:", error);
        setUniqueUserCount(0);
      }
    };
    fetchUniqueUsers();
  }, [year, month]);

  // Note: Location data loading is now handled by usePermissionFilters hook

  // ฟังก์ชันแปลงวันที่เป็นภาษาไทย
  const formatThaiDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate();
    const monthNames = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  };

  // เลือกรายการเดือนตามประเภทปี
  const monthOptions = useMemo(() => {
    return yearType === "fiscal" ? FISCAL_MONTHS : MONTHS;
  }, [yearType]);

  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
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

      // Filter ตามหน่วยบริการ (เฉพาะบริการสุขภาพอสม.)
      // ถ้าเลือกหน่วยบริการ ให้ filter เฉพาะตามหน่วยบริการเท่านั้น (สำคัญสุด)
      // ไม่สน filter อื่นๆ เช่น จังหวัด/อำเภอ/ตำบล
      if (service && osmDataByService.length > 0) {
        // สร้าง Set ของ OSM IDs เพื่อให้การ lookup เร็วขึ้น
        const osmIdSet = new Set(osmDataByService.map(osm => osm.id));

        // Filter เฉพาะที่มี external_user_id อยู่ใน osmIdSet
        const match = row.external_user_id && osmIdSet.has(row.external_user_id);

        if (!match) {
          return false;
        }

        // ถ้าเลือกหน่วยบริการแล้ว ให้ skip filter ตามพื้นที่ทิ้ง
        // ยังคงต้อง filter keyword อยู่
        const keywordMatch = !keyword || (
          row.name.includes(keyword) ||
          row.date.includes(keyword) ||
          String(row.index).includes(keyword) ||
          (row._citizenId || "").includes(keyword)
        );
        return keywordMatch;
      }

      // ไม่ได้เลือกหน่วยบริการ หรือไม่มีข้อมูล OSM ให้ filter ตามพื้นที่ตามปกติ
      // กรองตาม location_data (แมพ code จาก dropdown กับชื่อใน location_data)
      const locationData = row.location_data || {};

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
        row.name.includes(keyword) ||
        row.date.includes(keyword) ||
        String(row.index).includes(keyword) ||
        (row._citizenId || "").includes(keyword) ||
        locationData.region?.includes(keyword) ||
        locationData.city?.includes(keyword) ||
        locationData.district?.includes(keyword)
      );

      return provinceMatch && districtMatch && subdistrictMatch && keywordMatch;
    });
  }, [keyword, allRows, year, yearType, month, zone, province, district, subdistrict, service, osmDataByService, healthAreas, provinces, districts, subdistricts]); // เพิ่ม service และ osmDataByService


  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));
  const paginatedRows = useMemo(
    () => filteredRows.slice((page - 1) * itemsPerPage, page * itemsPerPage),
    [filteredRows, page, itemsPerPage]
  );

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [filteredRows.length, totalPages, page]);

  const totalReports = filteredRows.length;
  const totalHouseholds = useMemo(
    () => filteredRows.reduce((sum, row) => sum + row.amount, 0),
    [filteredRows]
  );

  const handleClear = () => {
    handleReset();
    setWeek("สัปดาห์ 4 (23/6/68-27/6/68)");
    setKeyword("");
    setPage(1);
  };

  const searchModes = [
    { key: "year", label: "ค้นหาแบบรายปี" },
    { key: "budget", label: "ค้นหาแบบรายปีงบประมาณ" },
  ];

  // ถ้ามี detailId ให้แสดงหน้ารายละเอียด
  if (detailId) {
    const selectedRow = allRows.find((row) => row.index === Number(detailId));
    return (
      <NcdsScreeningDetail
        reportData={{
          year,
          month,
          name: selectedRow?.name || "ไม่พบข้อมูล",
          date: selectedRow?.date || "",
          rawData: selectedRow?.rawData || {}, // ส่งข้อมูลดิบจาก API
          osm_code: selectedRow?.osm_code, // ส่ง osm_code สำหรับชื่อไฟล์
        }}
      />
    );
  }

  return (
    <div className="w-full h-full bg-transparent p-0 m-0">
      <DetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        data={filteredRows}
      />

      <div className="relative mb-6 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7e32e2] via-[#9333ea] to-[#a855f7]" />
        <div className="absolute inset-0 bg-white/5" />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Heart size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    คัดกรองโรคไม่ติดต่อเรื้อรัง (NCDs)
                  </h1>
                  <p className="text-white/80">
                    แดชบอร์ดรายงานและรายละเอียดเอกสาร
                  </p>
                </div>
              </div>
            </div>
            {/* <div className="flex w-full lg:w-auto justify-end">
              <button
                className="bg-white text-[#7e32e2] font-semibold rounded-2xl px-4 py-3 shadow-lg border border-white/50 hover:-translate-y-0.5 transition"
                onClick={() => setModalOpen(true)}
              >
                <Download size={18} className="inline mr-2" /> รายละเอียดเอกสาร
              </button>
            </div> */}
          </div>
        </div>
      </div>

      {/* Unique User Count Display */}
      <div className="bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl p-4 mb-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <Users size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="text-white/80 text-sm">จำนวน อสม. ที่ส่งรายงาน (รายปี)</div>
            <div className="text-2xl font-bold text-white">
              {loading ? "..." : uniqueUserCount.toLocaleString("th-TH")} <span className="text-sm font-normal text-white/70">คน</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-[#ece1f7] p-6">
        {/* <div className="mb-4 flex flex-wrap gap-2">
          {searchModes.map((mode) => (
            <button
              key={mode.key}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${
                searchType === mode.key
                  ? "bg-gradient-to-r from-[#7e32e2] to-[#9333ea] text-white shadow-md"
                  : "text-gray-600 bg-purple-50 hover:bg-purple-100"
              }`}
              onClick={() => setSearchType(mode.key)}
            >
              {mode.label}
            </button>
          ))}
        </div> */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
            options={generateFiscalYearOptions(currentFiscalYear - 4, currentFiscalYear)}
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

        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <CustomSelect
            label="สัปดาห์"
            value={week}
            onChange={(e) => setWeek(e.target.value)}
            options={WEEKS.map((w) => ({ label: w, value: w }))}
            placeholder="-- เลือกสัปดาห์ --"
            icon={Calendar}
          />
        </div> */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

        <div className="flex flex-col sm:flex-row gap-3 mt-5">
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

      <div className="bg-white rounded-2xl shadow-lg border border-[#ece1f7] p-4 my-6">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
              placeholder="พิมพ์เพื่อค้นหาชื่อหรือเลขบัตรประชาชน..."
              className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-purple-200 bg-gradient-to-r from-purple-50/50 to-violet-50/50 text-gray-700 font-medium placeholder:text-gray-400 focus:border-[#7e32e2] focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all duration-200"
            />
          </div>
          <button
            className="flex items-center justify-center gap-2 px-6 py-3 h-12 bg-gradient-to-r from-[#7e32e2] to-[#a855f7] text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 whitespace-nowrap w-full sm:w-auto"
            onClick={() => setPage(1)}
          >
            <Search size={20} />
            ค้นหา
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-[#ece1f7] overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className="w-full text-[15px] border-separate"
            style={{ borderSpacing: 0, minWidth: "900px" }}
          >
            <thead>
              <tr className="bg-gradient-to-r from-[#7e32e2] to-[#a855f7] text-white">
                <th className="py-4 px-4 font-semibold text-center text-white rounded-tl-xl">
                  ลำดับ
                </th>
                <th className="py-4 px-4 font-semibold text-left text-white">
                  ชื่อ-นามสกุล
                </th>
                <th className="py-4 px-4 font-semibold text-left text-white">
                  เลขบัตรประชาชน
                </th>
                <th className="py-4 px-4 font-semibold text-center text-white">
                  วันที่
                </th>
                <th className="py-4 px-4 font-semibold text-center text-white rounded-tr-xl">
                  รายละเอียด
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileText size={48} className="text-gray-300" />
                      <p className="text-gray-500">ไม่พบข้อมูล</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const isExpanded = expandedCitizenIds.has(row.index);
                  const citizenId = row._citizenId || "";
                  // เมื่อ collapse แสดง 123456789XXXX (ปิด 4 ตัวท้าย), เมื่อ expand แสดงเลขทั้งหมด
                  const displayCitizenId = citizenId
                    ? (isExpanded ? citizenId : citizenId.slice(0, -4) + "XXXX")
                    : "-";

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
                        {row.name}
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{displayCitizenId}</span>
                          {citizenId && citizenId !== "" && (
                            <button
                              onClick={() => {
                                const newSet = new Set(expandedCitizenIds);
                                if (isExpanded) {
                                  newSet.delete(row.index);
                                } else {
                                  newSet.add(row.index);
                                }
                                setExpandedCitizenIds(newSet);
                              }}
                              className="text-[#7e32e2] hover:text-[#9333ea] transition-colors"
                              title={isExpanded ? "ซ่อน 4 ตัวท้าย" : "แสดงทั้งหมด"}
                            >
                              {isExpanded ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center text-gray-600">
                        {row.date}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7e32e2] to-[#9333ea] text-white font-semibold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                          onClick={() =>
                            router.push(`/ncds-screening?detail=${row.index}`)
                          }
                        >
                          <Eye size={16} />
                          รายละเอียด
                        </button>
                      </td>
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
          totalItems={filteredRows.length}
        />
      </div>
    </div>
  );
};

export default NcdsScreeningComp;
