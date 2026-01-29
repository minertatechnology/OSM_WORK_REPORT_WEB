"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Calendar,
  MapPin,
  Building2,
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
import ElderlyScreeningDetail from "./ElderlyScreeningDetail/ElderlyScreeningDetail";
import elderlyScreeningService from "@services/elderlyScreeningService";
import oauth2Service from "@services/oauth2Service";
import { formatThaiDate } from "@utils/dateFormatter";
import { ComponentLoadingSpinner } from "@components/shared/LoadingSpinner";
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
import { buildFilterParams, addDateFilters } from "@utils/filterParamsHelper";

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

const WEEKS = [
  "สัปดาห์ที่ 1 (1/6/68-7/6/68)",
  "สัปดาห์ที่ 2 (8/6/68-14/6/68)",
  "สัปดาห์ที่ 3 (15/6/68-21/6/68)",
  "สัปดาห์ที่ 4 (22/6/68-30/6/68)",
];

const PER_PAGE_OPTIONS = [
  { label: "10", value: 10 },
  { label: "20", value: 20 },
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
  doc.text("สรุปจำนวนการส่งรายงานคัดกรองผู้สูงอายุ", 105, 15, {
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
  const colWidths = [20, 80, 50, 50];
  const headers = ["ลำดับ", "ชื่อ-นามสกุล ผู้ประเมิน", "วันที่บันทึกล่าสุด", "จำนวน (คน)"];

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
    doc.text(row.name || "-", xPos + 3, yPos + 5.5);
    xPos += colWidths[1];

    doc.rect(xPos, yPos, colWidths[2], rowHeight);
    doc.text(row.date || "-", xPos + colWidths[2] / 2, yPos + 5.5, {
      align: "center",
    });
    xPos += colWidths[2];

    doc.rect(xPos, yPos, colWidths[3], rowHeight);
    const amount = row.amount ? `${row.amount} คน` : "-";
    doc.text(amount, xPos + colWidths[3] / 2, yPos + 5.5, {
      align: "center",
    });

    yPos += rowHeight;
  });

  doc.save(
    `สรุปจำนวนรายงาน_ผู้สูงอายุ_${new Date().toISOString().split("T")[0]}.pdf`
  );
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
  doc.text("สรุปภาพรวมรายงานคัดกรองผู้สูงอายุในพื้นที่", 105, 15, {
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
  const colWidths = [20, 70, 40, 50, 50];
  const headers = ["ลำดับ", "ชื่อ-นามสกุล ผู้ประเมิน", "จำนวน (คน)", "วันที่บันทึก", "รหัสผู้ประเมิน"];

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
    doc.text(row.name || "-", xPos + 3, yPos + 5.5);
    xPos += colWidths[1];

    doc.rect(xPos, yPos, colWidths[2], rowHeight);
    const amount = row.amount ? `${row.amount} คน` : "-";
    doc.text(amount, xPos + colWidths[2] / 2, yPos + 5.5, {
      align: "center",
    });
    xPos += colWidths[2];

    doc.rect(xPos, yPos, colWidths[3], rowHeight);
    doc.text(row.date || "-", xPos + colWidths[3] / 2, yPos + 5.5, {
      align: "center",
    });
    xPos += colWidths[3];

    doc.rect(xPos, yPos, colWidths[4], rowHeight);
    doc.text(row.citizen_id || "-", xPos + 3, yPos + 5.5);

    yPos += rowHeight;
  });

  doc.save(
    `สรุปภาพรวม_ผู้สูงอายุ_${new Date().toISOString().split("T")[0]}.pdf`
  );
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
  doc.text("รายชื่อ อสม. ที่ยังไม่ส่งรายงานคัดกรองผู้สูงอายุ", 105, 15, {
    align: "center",
  });

  doc.setFontSize(12);
  doc.setFont("Sarabun", "normal");
  doc.text(`วันที่ส่งออก: ${new Date().toLocaleDateString("th-TH")}`, 105, 23, {
    align: "center",
  });

  // Filter: Show rows with amount = 0 or empty (no screenings)
  const notSubmittedData = data.filter(
    (row) => !row.amount || row.amount === "0" || parseInt(row.amount) === 0
  );

  const startX = 15;
  const startY = 35;
  const rowHeight = 8;
  const colWidths = [20, 100, 65];
  const headers = ["ลำดับ", "ชื่อ-นามสกุล ผู้ประเมิน", "สถานะ"];

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

  if (notSubmittedData.length === 0) {
    doc.text("ไม่พบข้อมูล อสม. ที่ยังไม่ส่งรายงาน", 105, yPos + 10, {
      align: "center",
    });
  } else {
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
      doc.text(row.name || "-", xPos + 3, yPos + 5.5);
      xPos += colWidths[1];

      doc.rect(xPos, yPos, colWidths[2], rowHeight);
      doc.text("ยังไม่ส่งรายงาน", xPos + 3, yPos + 5.5);

      yPos += rowHeight;
    });
  }

  doc.save(
    `อสม_ที่ยังไม่ส่งรายงาน_ผู้สูงอายุ_${
      new Date().toISOString().split("T")[0]
    }.pdf`
  );
}

function exportToExcel(data, title = "รายงานคัดกรองผู้สูงอายุ") {
  const excelData = data.map((row, idx) => ({
    ลำดับ: idx + 1,
    "ชื่อ-นามสกุล ผู้ประเมิน": row.name || "-",
    "วันที่บันทึกล่าสุด": row.date || "-",
    "จำนวน (คน)": row.amount ? `${row.amount} คน` : "0 คน",
    "รหัสผู้ประเมิน": row.citizen_id || "-",
  }));

  const ws = XLSX.utils.json_to_sheet(excelData);
  ws["!cols"] = [{ wch: 8 }, { wch: 35 }, { wch: 20 }, { wch: 15 }, { wch: 20 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "รายงาน");

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `elderly_report_${new Date().toISOString().split("T")[0]}.xlsx`);
}

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

// Modal component styled like the image (for both download and detail)
function DetailModal({ open, onClose, data = [] }) {
  if (!open) return null;

  // Transform data based on the actual filteredRows structure
  const rows = (data || []).map((row, idx) => {
    // filteredRows has: _assessorName, _thaiDate, _elderlyCount, external_user_id
    return {
      index: idx + 1,
      name: row._assessorName || row.name || "ไม่ระบุชื่อ",
      date: row._thaiDate || row.date || "-",
      amount: row._elderlyCount?.toString() || row.amount?.toString() || "0",
      citizen_id: row.external_user_id || row.citizen_id || "-",
    };
  });

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
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 mb-10 pt-4 border-t border-[#f0ebff]">
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
          className="appearance-none border border-[#e5e7eb] rounded-full px-4 py-2 pr-8 text-sm font-semibold text-[#7e32e2] bg-white shadow transition focus:outline-none focus:ring-2 focus:ring-[#7e32e2] focus:border-transparent hover:border-[#7e32e2] cursor-pointer"
        >
          {PER_PAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-600">รายการต่อหน้า</span>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-[#ece1f7] shadow-lg backdrop-blur-sm">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
            currentPage === 1
              ? "text-gray-300 cursor-not-allowed"
              : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-110"
          }`}
          title="หน้าแรก"
          aria-label="หน้าแรก"
        >
          <ChevronsLeft size={18} />
        </button>
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
            currentPage === 1
              ? "text-gray-300 cursor-not-allowed"
              : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-110"
          }`}
          title="หน้าก่อนหน้า"
          aria-label="หน้าก่อนหน้า"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-1 mx-2">
          {getPageNumbers(currentPage, totalPages).map((page, idx) =>
            page === "..." ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 py-1 text-gray-400 font-semibold select-none"
              >
                ...
              </span>
            ) : (
              <button
                key={`page-${page}`}
                onClick={() => setCurrentPage(page)}
                className={`min-w-[36px] h-9 rounded-full font-semibold text-base transition-all duration-200 ${
                  currentPage === page
                    ? "bg-[#7e32e2] text-white shadow-lg scale-110 border border-[#7e32e2]"
                    : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-105"
                }`}
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page}
              </button>
            )
          )}
        </div>
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
            currentPage === totalPages
              ? "text-gray-300 cursor-not-allowed"
              : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-110"
          }`}
          title="หน้าถัดไป"
          aria-label="หน้าถัดไป"
        >
          <ChevronRight size={18} />
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
            currentPage === totalPages
              ? "text-gray-300 cursor-not-allowed"
              : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-110"
          }`}
          title="หน้าสุดท้าย"
          aria-label="หน้าสุดท้าย"
        >
          <ChevronsRight size={18} />
        </button>
        <div className="ml-3 text-sm text-[#888] font-semibold bg-[#f6eeff] px-4 py-2 rounded-xl shadow">
          หน้า {currentPage} / {totalPages}
        </div>
      </div>
    </div>
  );
}

const ElderlyScreeningComp = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ใช้ state เพื่อหลีกเลี่ยง hydration mismatch
  const [detailId, setDetailId] = useState(null);
  const [currentBuddhistYear, setCurrentBuddhistYear] = useState(null);

  const [records, setRecords] = useState([]);
  const [aggregatedData, setAggregatedData] = useState([]);
  const [userDataMap, setUserDataMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [osmDataByService, setOsmDataByService] = useState([]); // เก็บข้อมูล OSM ตามหน่วยบริการ

  const currentFiscalYear = getCurrentFiscalYear();
  const YEARS = generateFiscalYearOptions(currentFiscalYear - 4, currentFiscalYear);

  const YEAR_TYPES = [
    { label: "ปีงบประมาณ", value: "fiscal" },
    { label: "รายปี", value: "calendar" },
  ];

  // Use permission-based filters
  const { isLocked, lockLevel, getInitialFilters } = useUserPermission();
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
    isDistrictDisabled,
    isSubdistrictDisabled,
    isServiceDisabled,
  } = usePermissionFilters({
    defaultYear: String(currentFiscalYear),
    defaultYearType: "fiscal",
  });

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

  const [week, setWeek] = useState("สัปดาห์ 4 (23/6/68-27/6/68)");
  const [keyword, setKeyword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [availableYears, setAvailableYears] = useState([]);

  // State สำหรับเปิด/ปิดการแสดงเลขบัตรประชาชน
  const [visibleCitizenIds, setVisibleCitizenIds] = useState(new Set());

  // Note: Location data loading is handled by usePermissionFilters hook

  // โหลด searchParams และปีปัจจุบันหลัง hydration เสร็จ
  useEffect(() => {
    setCurrentBuddhistYear(new Date().getFullYear() + 543);
  }, []);

  // Set ปีเริ่มต้นหลัง currentBuddhistYear โหลดเสร็จ
  useEffect(() => {
    if (currentBuddhistYear && !year) {
      setYear(currentBuddhistYear.toString());
      if (availableYears.length === 0) {
        setAvailableYears([currentBuddhistYear.toString()]);
      }
    }
  }, [currentBuddhistYear, year, availableYears.length]);

  const fetchElderly = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
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

      // ล้าง cache ข้อมูล OAuth2 ก่อน
      oauth2Service.clearCache();

      // ดึงข้อมูลผู้สูงอายุทั้งหมด - ส่ง filter parameters (health_region, province, province_id, district, district_id, subdistrict, subdistrict_id, etc.)
      // Backend รองรับทั้ง text (ชื่อภาษาไทย) และ id
      const data = await elderlyScreeningService.getAll({ skip: 0, limit: 1000, ...apiParams });

      if (data.length === 0) {
        console.warn("Empty data received from API");
        setError("ไม่พบข้อมูลในระบบ กรุณาตรวจสอบ token หรือติดต่อผู้ดูแลระบบ");
        setRecords([]);
        setAggregatedData([]);
        return;
      }

      setRecords(data);

      // รวมข้อมูลตาม external_user_id (ผู้ประเมิน)
      const aggregated = elderlyScreeningService.aggregateByAssessor(data);

      setAggregatedData(aggregated);

      // สร้างรายการปีจากข้อมูล
      const yearsSet = new Set();
      data.forEach(item => {
        if (item.assessment_date) {
          const date = new Date(item.assessment_date);
          const buddhistYear = date.getFullYear() + 543;
          yearsSet.add(buddhistYear.toString());
        }
      });
      const yearsList = Array.from(yearsSet).sort((a, b) => b - a);
      setAvailableYears(yearsList.length > 0 ? yearsList : [currentBuddhistYear?.toString() || "2568"]);

      // ดึงข้อมูลผู้ใช้จาก OAuth2
      const externalUserIds = aggregated.map((item) => item.external_user_id);
      const users = await oauth2Service.getBatch(externalUserIds);

      setUserDataMap(users);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "ไม่สามารถโหลดข้อมูล";
      console.error("Fetch Error:", err);
      setError(message);
      setRecords([]);
      setAggregatedData([]);
    } finally {
      setLoading(false);
    }
  }, [apiParams]); // ดึงข้อมูลใหม่เมื่อ filter เปลี่ยน

  useEffect(() => {
    fetchElderly();
  }, [fetchElderly]);

  useEffect(() => {
    // รอให้ component mount เสร็จก่อนถึงจะ hydrate
    setHydrated(true);
  }, []);

  useEffect(() => {
    // อ่าน detailId ทันทีเมื่อ searchParams เปลี่ยน (ไม่ต้องรอ hydrated)
    if (searchParams) {
      const detailParam = searchParams.get("detail");
      setDetailId(detailParam);
    }
  }, [searchParams]);

  // เลือกรายการเดือนตามประเภทปี
  const monthOptions = useMemo(() => {
    return yearType === "fiscal" ? FISCAL_MONTHS : MONTHS;
  }, [yearType]);

  const filteredRows = useMemo(() => {
    if (!hydrated) return []; // รอให้ hydrate เสร็จก่อน

    const keywordLower = keyword.trim().toLowerCase();

    // ใช้ aggregatedData แทน records
    const result = (aggregatedData || []).map((assessorData) => {
      // ดึงข้อมูลผู้ใช้จาก OAuth2
      const userData = userDataMap[assessorData.external_user_id];

      // ใช้ชื่อที่ service สร้างไว้แล้ว (มีชื่อเต็มอยู่แล้ว)
      const assessorName = userData?.name || "ไม่ระบุชื่อ";

      // แปลงวันที่เป็นรูปแบบไทย: "25 มิถุนายน 2568"
      const thaiDate = formatThaiDate(assessorData.latest_date);

      // ดึง location_data จาก screening แรก (ถ้ามี)
      const location_data = assessorData.screenings?.[0]?.location_data || {};

      return {
        id: assessorData.external_user_id,
        external_user_id: assessorData.external_user_id,
        _assessorName: assessorName,
        _thaiDate: thaiDate,
        _elderlyCount: assessorData.count,
        screenings: assessorData.screenings,
        location_data: location_data,
      };
    }).filter((row) => {
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
        const keywordMatch = !keywordLower || (
          row._assessorName.toLowerCase().includes(keywordLower) ||
          (row.external_user_id || "").toLowerCase().includes(keywordLower)
        );
        return keywordMatch;
      }

      // ไม่ได้เลือกหน่วยบริการ หรือไม่มีข้อมูล OSM ให้ filter ตามพื้นที่ตามปกติ
      // กรองตาม location_data
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

      const selectedProvince = provinces.find(p => p.code === province);
      const provinceMatch = !province || locationData.region === selectedProvince?.name_th;

      const selectedDistrict = districts.find(d => d.code === district);
      const districtMatch = !district || locationData.city === selectedDistrict?.name_th;

      const selectedSubdistrict = subdistricts.find(s => s.code === subdistrict);
      const subdistrictMatch = !subdistrict || locationData.district === selectedSubdistrict?.name_th;

      // กรองตาม keyword
      const keywordMatch = !keywordLower || (
        row._assessorName.toLowerCase().includes(keywordLower) ||
        (row.external_user_id || "").toLowerCase().includes(keywordLower) ||
        locationData.region?.toLowerCase().includes(keywordLower) ||
        locationData.city?.toLowerCase().includes(keywordLower) ||
        locationData.district?.toLowerCase().includes(keywordLower)
      );

      return provinceMatch && districtMatch && subdistrictMatch && keywordMatch;
    });

    return result;
  }, [aggregatedData, userDataMap, keyword, hydrated, year, yearType, month, zone, province, district, subdistrict, service, osmDataByService, healthAreas, provinces, districts, subdistricts]); // เพิ่ม service และ osmDataByService


  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));
  const paginatedRows = useMemo(
    () => filteredRows.slice((page - 1) * itemsPerPage, page * itemsPerPage),
    [filteredRows, page, itemsPerPage]
  );

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [filteredRows.length, totalPages, page]);

  const handleClear = () => {
    setYearType("fiscal");
    setYear(String(currentFiscalYear));
    setMonth("");
    setWeek("สัปดาห์ 4 (23/6/68-27/6/68)");
    handleZoneChange("");
    handleProvinceChange("");
    handleDistrictChange("");
    handleSubdistrictChange("");
    handleServiceChange("");
    setKeyword("");
    setPage(1);
  };


  // ถ้ามี detailId ให้แสดงหน้ารายละเอียด
  if (detailId) {
    // ตรวจสอบว่ามี assessorData และ userData สำหรับ detailId นี้หรือยัง
    const assessorData = aggregatedData.find(
      (item) => item.external_user_id === detailId
    );
    const userData = userDataMap[detailId];

    // Debug logging
    console.log("🔍 Detail View Check:", {
      detailId,
      loading,
      aggregatedDataLength: aggregatedData.length,
      foundAssessorData: !!assessorData,
      foundUserData: !!userData,
      assessorData,
      userData
    });

    // ถ้ายังโหลดข้อมูล หรือไม่พบข้อมูล ให้แสดง loading
    if (loading || aggregatedData.length === 0 || !assessorData || !userData) {
      console.log("⏳ Showing loading spinner...");
      return <ComponentLoadingSpinner />;
    }

    // ส่งข้อมูลผู้ประเมินและรายการผู้สูงอายุทั้งหมดที่เขาประเมิน
    const assessorName = userData?.name || "ไม่ระบุชื่อ";

    return (
      <ElderlyScreeningDetail
        assessorId={detailId}
        assessorName={assessorName}
        elderlyList={assessorData?.screenings || []}
        elderlyCount={assessorData?.count || 0}
        onBack={() => router.push("/elderly-screening")}
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
                  <Users size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    คัดกรองผู้สูงอายุในชุมชน
                  </h1>
                  <p className="text-white/80">
                    แดชบอร์ดรายงานและรายละเอียดเอกสาร
                  </p>
                </div>
              </div>
            </div>
            <div className="flex w-full lg:w-auto justify-end">
              <button
                className="bg-white text-[#7e32e2] font-semibold rounded-2xl px-4 py-3 shadow-lg border border-white/50 hover:-translate-y-0.5 transition"
                onClick={() => setModalOpen(true)}
              >
                <Download size={18} className="inline mr-2" /> ดาวน์โหลดรายงาน
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-[#ece1f7] p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
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
        </div>

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
              placeholder="พิมพ์เพื่อค้นหาชื่อหรือข้อมูล..."
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
                <th className="py-4 px-4 font-semibold text-center text-white">
                  เลขบัตรประชาชน
                </th>
                <th className="py-4 px-4 font-semibold text-center text-white">
                  วันที่บันทึกล่าสุด
                </th>
                <th className="py-4 px-4 font-semibold text-center text-white">
                  จำนวนในครัวเรือน
                </th>
                <th className="py-4 px-4 font-semibold text-center text-white rounded-tr-xl">
                  รายละเอียด
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <ComponentLoadingSpinner />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-red-600 font-semibold">
                    {error}
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileText size={48} className="text-gray-300" />
                      <p className="text-gray-500">ไม่พบข้อมูล</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  // ดึง citizen_id จาก screening แรก (ถ้ามี)
                  const citizenId = row.screenings?.[0]?.citizen_id || "";
                  return (
                    <tr
                      key={row.external_user_id || idx}
                      className={`${
                        idx % 2 === 0 ? "bg-white" : "bg-purple-50/30"
                      } hover:bg-purple-50 transition-colors`}
                    >
                      <td className="py-4 px-4 text-center font-medium text-gray-600">
                        {(page - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="py-4 px-4 font-medium text-[#231d37]">
                        {row._assessorName}
                      </td>
                      <td className="py-4 px-4 text-center text-sm text-gray-600">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-mono">
                            {citizenId ? (
                              visibleCitizenIds.has(row.external_user_id) ? (
                                citizenId
                              ) : (
                                citizenId.slice(0, -4) + "XXXX"
                              )
                            ) : (
                              <span className="text-gray-400">ไม่ระบุ</span>
                            )}
                          </span>
                          {citizenId && (
                            <button
                              onClick={() => {
                                const newVisible = new Set(visibleCitizenIds);
                                if (newVisible.has(row.external_user_id)) {
                                  newVisible.delete(row.external_user_id);
                                } else {
                                  newVisible.add(row.external_user_id);
                                }
                                setVisibleCitizenIds(newVisible);
                              }}
                              className="p-1 rounded hover:bg-gray-100 transition-colors"
                              title={visibleCitizenIds.has(row.external_user_id) ? "ซ่อนเลขบัตร" : "แสดงเลขบัตร"}
                            >
                              {visibleCitizenIds.has(row.external_user_id) ? (
                                <EyeOff size={16} className="text-gray-500" />
                              ) : (
                                <Eye size={16} className="text-gray-500" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center text-gray-700">
                        {row._thaiDate}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-sm">
                          <Users size={16} />
                          {row._elderlyCount} คน
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7e32e2] to-[#9333ea] text-white font-semibold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                          onClick={() =>
                            router.push(
                              `/elderly-screening?detail=${row.external_user_id}`
                            )
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
        />
      </div>
    </div>
  );
};

export default ElderlyScreeningComp;
