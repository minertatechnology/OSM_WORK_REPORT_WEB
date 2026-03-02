import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Eye,
  Download,
  RotateCcw,
  Calendar,
  MapPin,
  Building2,
  Home,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText,
  Users,
} from "lucide-react";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { font as sarabunFont } from "../../../styles/Sarabun-Regular-normal";
import { fontbold as sarabunBoldFont } from "../../../styles/Sarabun-Regular-bold";
import Reportosm1CompDetailComp from "../Reportosm1CompDetailComp/Reportosm1CompDetailComp";
import CustomSelect from "@services/customSelectService/customSelectService";
import { getUsersBatch } from "@services/oauth2Service";
import { getOsmByHealthService, getHealthServices } from "@services/lookupService";
// Lookup services now handled by usePermissionFilters hook
import {
  getCurrentFiscalYear,
  getCurrentCalendarYear,
  generateFiscalYearOptions,
  isInFiscalYear,
  isInCalendarYear,
  parseThaiDate,
  isInMonth,
  getDisplayYearForFiscalMonth,
} from "@utils/fiscalYearHelper";
import { usePermissionFilters } from "@hooks/usePermissionFilters";
import { useUserPermission } from "@context/UserPermissionProvider";

// Generate dynamic year options (last 5 years)
const currentFiscalYear = getCurrentFiscalYear();
const YEARS = generateFiscalYearOptions(currentFiscalYear - 4, currentFiscalYear);

// Year type options
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
// Removed mock data - will use API data instead

// Export functions
function exportSummaryPDF(data) {
  const doc = new jsPDF();

  doc.addFileToVFS("Sarabun-Regular.ttf", sarabunFont);
  doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
  doc.addFileToVFS("Sarabun-Bold.ttf", sarabunBoldFont);
  doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
  doc.setFont("Sarabun");

  doc.setFontSize(16);
  doc.setFont("Sarabun", "bold");
  doc.text("สรุปยอดรายงาน อสม.1", 105, 15, { align: "center" });
  doc.setFontSize(12);
  doc.setFont("Sarabun", "normal");
  doc.text(`วันที่ส่งออก: ${new Date().toLocaleDateString("th-TH")}`, 105, 23, {
    align: "center",
  });

  const startX = 15;
  const startY = 35;
  const rowHeight = 8;
  const colWidths = [20, 120, 40];
  const headers = ["ลำดับ", "รายชื่อ", "ส่งวันที่"];

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
    const nameParts = doc.splitTextToSize(row.name, colWidths[1] - 4);
    doc.text(nameParts[0], xPos + 2, yPos + 5.5);
    xPos += colWidths[1];

    doc.rect(xPos, yPos, colWidths[2], rowHeight);
    doc.text(row.date, xPos + colWidths[2] / 2, yPos + 5.5, {
      align: "center",
    });

    yPos += rowHeight;
  });

  doc.save(`สรุปยอดรายงาน_อสม1_${new Date().toISOString().split("T")[0]}.pdf`);
}

function exportDistrictPDF(data) {
  const doc = new jsPDF();

  doc.addFileToVFS("Sarabun-Regular.ttf", sarabunFont);
  doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
  doc.addFileToVFS("Sarabun-Bold.ttf", sarabunBoldFont);
  doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
  doc.setFont("Sarabun");

  doc.setFontSize(16);
  doc.setFont("Sarabun", "bold");
  doc.text("สรุปรายอำเภอ - รายงาน อสม.1", 105, 15, { align: "center" });
  doc.setFontSize(12);
  doc.setFont("Sarabun", "normal");
  doc.text(`วันที่ส่งออก: ${new Date().toLocaleDateString("th-TH")}`, 105, 23, {
    align: "center",
  });

  const startX = 15;
  const startY = 35;
  const rowHeight = 8;
  const colWidths = [20, 70, 30, 30, 35];
  const headers = ["ลำดับ", "อำเภอ", "ส่งแล้ว", "ยังไม่ส่ง", "รวม"];

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

  const districts = ["เมือง", "ปากช่อง", "โนนสูง"];
  districts.forEach((district, idx) => {
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
    doc.text(district, xPos + colWidths[1] / 2, yPos + 5.5, {
      align: "center",
    });
    xPos += colWidths[1];

    doc.rect(xPos, yPos, colWidths[2], rowHeight);
    doc.text(
      String(Math.floor(data.length / 3)),
      xPos + colWidths[2] / 2,
      yPos + 5.5,
      {
        align: "center",
      }
    );
    xPos += colWidths[2];

    doc.rect(xPos, yPos, colWidths[3], rowHeight);
    doc.text("0", xPos + colWidths[3] / 2, yPos + 5.5, { align: "center" });
    xPos += colWidths[3];

    doc.rect(xPos, yPos, colWidths[4], rowHeight);
    doc.text(
      String(Math.floor(data.length / 3)),
      xPos + colWidths[4] / 2,
      yPos + 5.5,
      {
        align: "center",
      }
    );

    yPos += rowHeight;
  });

  doc.save(`สรุปรายอำเภอ_อสม1_${new Date().toISOString().split("T")[0]}.pdf`);
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
  doc.text("หน่วยที่ยังไม่ส่งรายงาน อสม.1", 105, 15, {
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
  const colWidths = [20, 100, 65];
  const headers = ["ลำดับ", "ชื่อหน่วยบริการ", "สถานะ"];

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

  const notSubmitted = [
    "รพ.สต.บ้านดง",
    "รพ.สต.บ้านหนองบัว",
    "รพ.สต.บ้านโคกสูง",
  ];
  notSubmitted.forEach((unit, idx) => {
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
    doc.text(unit, xPos + 3, yPos + 5.5);
    xPos += colWidths[1];

    doc.rect(xPos, yPos, colWidths[2], rowHeight);
    doc.text("ยังไม่ส่งรายงาน", xPos + 3, yPos + 5.5);

    yPos += rowHeight;
  });

  doc.save(
    `หน่วยที่ยังไม่ส่ง_อสม1_${new Date().toISOString().split("T")[0]}.pdf`
  );
}

function exportToExcel(data, title = "รายงาน อสม.1") {
  const excelData = data.map((row, idx) => ({
    ลำดับ: idx + 1,
    รายชื่อ: row.name,
    ส่งวันที่: row.date,
  }));

  const ws = XLSX.utils.json_to_sheet(excelData);
  ws["!cols"] = [{ wch: 8 }, { wch: 50 }, { wch: 20 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "รายงาน");

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `osm1_report_${new Date().toISOString().split("T")[0]}.xlsx`);
}

function DetailModal({ open, onClose, data = [] }) {
  if (!open) return null;

  const rows = data;

  const handleExportSummaryPDF = () => {
    if (rows.length) exportSummaryPDF(rows);
  };

  const handleExportDistrictPDF = () => {
    if (rows.length) exportDistrictPDF(rows);
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
              สรุปยอดรายงาน
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
                onClick={() => handleExportExcel(rows, "สรุปยอดรายงาน")}
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
              สรุปรายอำเภอ
            </div>
            <div className="flex gap-2">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-white text-[#d32f2f] font-semibold text-[15px] shadow-sm hover:bg-red-50 hover:border-red-300 transition-all active:scale-95"
                onClick={handleExportDistrictPDF}
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
                onClick={() => handleExportExcel(rows, "สรุปรายอำเภอ")}
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
              หน่วยที่ยังไม่ส่ง
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
                  handleExportExcel(rows.slice(0, 5), "หน่วยที่ยังไม่ส่ง")
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


function Pagination({
  currentPage,
  setCurrentPage,
  totalPages,
  itemsPerPage,
  setItemsPerPage,
  totalItems = 0,
}) {
  const PER_PAGE_OPTIONS = [
    { label: "10", value: 10 },
    { label: "25", value: 25 },
    { label: "50", value: 50 },
    { label: "100", value: 100 },
  ];

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
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className={`p-1.5 rounded-md transition-all duration-200 ${currentPage === 1 ? "text-gray-300 cursor-not-allowed bg-gray-50" : "text-purple-600 hover:bg-gradient-to-r hover:from-purple-600 hover:to-purple-500 hover:text-white hover:scale-105 hover:shadow-md"}`}>
                <ChevronsLeft size={16} />
              </button>
              <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className={`p-1.5 rounded-md transition-all duration-200 ${currentPage === 1 ? "text-gray-300 cursor-not-allowed bg-gray-50" : "text-purple-600 hover:bg-gradient-to-r hover:from-purple-600 hover:to-purple-500 hover:text-white hover:scale-105 hover:shadow-md"}`}>
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1 mx-0.5">
                {getPageNumbers().map((page, idx) => (
                  <React.Fragment key={idx}>
                    {page === "..." ? (
                      <span className="px-2 py-1 text-gray-400 font-semibold text-xs">...</span>
                    ) : (
                      <button onClick={() => setCurrentPage(page)} className={`min-w-[32px] h-8 rounded-lg font-semibold text-xs transition-all duration-200 ${currentPage === page ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md scale-105" : "text-purple-600 hover:bg-gradient-to-r hover:from-purple-100 hover:to-purple-50 hover:scale-105 border border-transparent hover:border-purple-200"}`}>
                        {page}
                      </button>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className={`p-1.5 rounded-md transition-all duration-200 ${currentPage === totalPages ? "text-gray-300 cursor-not-allowed bg-gray-50" : "text-purple-600 hover:bg-gradient-to-r hover:from-purple-600 hover:to-purple-500 hover:text-white hover:scale-105 hover:shadow-md"}`}>
                <ChevronRight size={16} />
              </button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className={`p-1.5 rounded-md transition-all duration-200 ${currentPage === totalPages ? "text-gray-300 cursor-not-allowed bg-gray-50" : "text-purple-600 hover:bg-gradient-to-r hover:from-purple-600 hover:to-purple-500 hover:text-white hover:scale-105 hover:shadow-md"}`}>
                <ChevronsRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const Reportosm1DataComp = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const detailId = searchParams.get("detail");

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
    isDistrictDisabled,
    isSubdistrictDisabled,
    isServiceDisabled,
  } = usePermissionFilters({
    defaultYear: String(currentFiscalYear),
    defaultYearType: "fiscal",
  });

  // เลือกรายการเดือนตามประเภทปี
  const monthOptions = useMemo(() => {
    return yearType === "fiscal" ? FISCAL_MONTHS : MONTHS;
  }, [yearType]);

  const [keyword, setKeyword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [osmDataByService, setOsmDataByService] = useState([]); // เก็บข้อมูล OSM ตามหน่วยบริการ
  const [filteredHealthServices, setFilteredHealthServices] = useState([]); // เก็บข้อมูลหน่วยบริการที่กรองตามพื้นที่

  // Note: Location data loading is handled by usePermissionFilters hook

  // Fetch OSM data when health service changes
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

  // Fetch health services filtered by province/district/subdistrict
  useEffect(() => {
    const fetchHealthServices = async () => {
      try {
        const params = {};
        // Add location filters if selected
        if (province) params.province_code = province;
        if (district) params.district_code = district;
        if (subdistrict) params.subdistrict_code = subdistrict;

        const data = await getHealthServices(params);

        console.log("🏥 [OSM1] Filtered health services:", {
          province,
          district,
          subdistrict,
          count: data.length,
        });

        setFilteredHealthServices(data);
      } catch (err) {
        console.error("Error fetching health services:", err);
        setFilteredHealthServices([]);
      }
    };

    fetchHealthServices();
  }, [province, district, subdistrict]);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Build query string - ไม่ส่ง location filters ไป backend เพื่อให้ frontend กรองเอง
        const queryString = new URLSearchParams({
          skip: 0,
          limit: 1000,
          // ไม่ส่ง location filters (zone, province, district, subdistrict) ไป backend
          // ให้ frontend กรองเองจาก location_data_resolved
        }).toString();

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_SMART_OSM_URL}/report-osm1/submissionsall?${queryString}`
        );
        const data = await response.json();

        console.log("📥 [OSM1] Reports from backend:", {
          totalReports: data.length,
        });

        // ดึงรายการ external_user_id ทั้งหมดเพื่อไปดึงชื่อจาก OSM batch API
        const externalUserIds = data.map(item => item.external_user_id).filter(Boolean);

        // ดึงข้อมูลผู้ใช้จาก OSM batch API เพื่อเอาชื่อ
        const usersMap = await getUsersBatch(externalUserIds);

        // Debug: แสดงข้อมูล OSM แรก
        if (externalUserIds.length > 0) {
          console.log("📥 [OSM1] OSM Data from batch API:", {
            totalUserIds: externalUserIds.length,
            firstUserId: externalUserIds[0],
            sampleUserData: usersMap[externalUserIds[0]],
          });
        }

        // ผสานข้อมูล: ชื่อจาก OSM batch API + ที่อยู่จาก location_data_resolved
        const enrichedData = data.map(item => {
          const userData = usersMap[item.external_user_id];
          const locationResolved = item.location_data_resolved || {};

          // สร้างชื่อเต็มจาก OSM batch API
          const fullName = userData
            ? `${userData.prefix_name_th || ""}${userData.first_name || ""} ${userData.last_name || ""}`.trim()
            : item.external_user_id || "ไม่ระบุชื่อ";

          // ดึง province_id จาก OSM batch API (สำคัญสุด - ใช้ตัดสินใจว่าเป็นกรุงเทพหรือไม่)
          const osmProvinceId = userData?.province_id || null;

          // สร้าง user_location จาก location_data_resolved (ใช้สำหรับกรองพื้นที่)
          const userLocation = {
            province_id: locationResolved.province_id,
            province_name_th: locationResolved.province,
            district_id: locationResolved.district_id,
            district_name_th: locationResolved.district,
            subdistrict_id: locationResolved.subdistrict_id,
            subdistrict_name_th: locationResolved.subdistrict,
            health_area_id: locationResolved.health_area_id,
            health_area_name: locationResolved.health_area,
            health_services: locationResolved.health_services,
          };

          // Debug: แสดงข้อมูลแรก
          if (item === data[0]) {
            console.log("📍 [OSM1] Sample enriched data:", {
              submissionId: item.id,
              externalUserId: item.external_user_id,
              fullName: fullName,
              locationResolved: locationResolved,
              userLocation: userLocation,
              osmProvinceId: osmProvinceId,
              userData: userData,
            });
          }

          return {
            ...item,
            userName: fullName,
            user_location: userLocation,
            osm_province_id: osmProvinceId, // เก็บ province_id จาก OSM batch API
          };
        });

        setApiData(enrichedData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setApiData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // ไม่ดึงข้อมูลใหม่เมื่อ filter เปลี่ยน - ให้ frontend กรองเอง

  // Transform API data to table format
  const ALL_ROWS = useMemo(() => {
    return apiData.map((item, idx) => ({
      index: idx + 1,
      id: item.id,
      name: item.userName || "ไม่ระบุชื่อ",
      date: item.submitted_at
        ? new Date(item.submitted_at).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "-",
      fiscal_year: item.fiscal_year,
      total_activities: item.total_activities,
      filled_activities: item.filled_activities,
      completion_rate: item.completion_rate,
      status: item.status,
      user_location: item.user_location,
      rawData: item,
    }));
  }, [apiData]);

  const filteredRows = useMemo(() => {
    return ALL_ROWS.filter((row) => {
      // Filter ตามหน่วยบริการ (เฉพาะบริการสุขภาพอสม.)
      // ถ้าเลือกหน่วยบริการ ให้ filter เฉพาะตามหน่วยบริการเท่านั้น (สำคัญสุด)
      // ไม่สน filter อื่นๆ เช่น จังหวัด/อำเภอ/ตำบล
      if (service && osmDataByService.length > 0) {
        // สร้าง Set ของ OSM IDs
        const osmIdSet = new Set(osmDataByService.map(osm => osm.id));

        // เช็คว่า external_user_id ของรายงานตรงกับ OSM ID ในหน่วยบริการนี้หรือไม่
        const match = row.rawData?.external_user_id && osmIdSet.has(row.rawData.external_user_id);

        return match;
      }

      // Keyword search
      const term = keyword.trim().toLowerCase();
      if (term) {
        const nameMatch = row.name?.toLowerCase().includes(term);
        const dateMatch = row.date?.toLowerCase().includes(term);
        const indexMatch = String(row.index).includes(term);
        if (!(nameMatch || dateMatch || indexMatch)) {
          return false;
        }
      }

      // Year filtering
      if (year && row.date) {
        const parsedDate = parseThaiDate(row.date);
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
      if (month && row.date) {
        const parsedDate = parseThaiDate(row.date);
        if (parsedDate && !isInMonth(parsedDate, month)) {
          return false;
        }
      }

      // Location filtering ใช้ข้อมูลที่อยู่ของ อสม. (ใช้เฉพาะเมื่อไม่ได้เลือกหน่วยบริการ)
      const userLocation = row.user_location;

      // ถ้าไม่มี user_location แต่มีการเลือก filter location ให้ skip
      if (!userLocation && (zone || province || district || subdistrict)) {
        return false;
      }

      if (userLocation) {
        // Filter by health area (เขตสุขภาพ)
        if (zone) {
          const selectedHealthArea = healthAreas.find(h => h.code === zone);
          if (selectedHealthArea && selectedHealthArea.provinces) {
            const provinceInHealthArea = selectedHealthArea.provinces.find(
              p => p.name_th === userLocation.province_name_th
            );
            if (!provinceInHealthArea) {
              return false;
            }
          }
        }

        // Filter by province
        if (province) {
          const selectedProvince = provinces.find(p => p.code === province);
          if (selectedProvince && userLocation.province_name_th !== selectedProvince.name_th) {
            return false;
          }
        }

        // Filter by district
        if (district) {
          const selectedDistrict = districts.find(d => d.code === district);
          if (selectedDistrict && userLocation.district_name_th !== selectedDistrict.name_th) {
            return false;
          }
        }

        // Filter by subdistrict
        if (subdistrict) {
          const selectedSubdistrict = subdistricts.find(s => s.code === subdistrict);
          if (selectedSubdistrict && userLocation.subdistrict_name_th !== selectedSubdistrict.name_th) {
            return false;
          }
        }
      }

      return true;
    });
  }, [keyword, year, yearType, month, ALL_ROWS, zone, province, district, subdistrict, service, healthAreas, provinces, districts, subdistricts, filteredHealthServices, osmDataByService]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));
  const paginatedRows = useMemo(
    () => filteredRows.slice((page - 1) * itemsPerPage, page * itemsPerPage),
    [filteredRows, itemsPerPage, page]
  );

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  // ถ้ามี detailId ให้แสดงหน้ารายละเอียด
  if (detailId) {
    const selectedRow = ALL_ROWS.find((row) => row.id === detailId);
    // เลือกชุดเดือนตามประเภทปี
    const monthSource = yearType === "fiscal" ? FISCAL_MONTHS : MONTHS;
    const monthLabel =
      monthSource.find((m) => m.value === month)?.label || "มิถุนายน";

    // คำนวณปีที่แสดง (สำหรับปีงบประมาณ)
    const displayYear = yearType === "fiscal" && year
      ? getDisplayYearForFiscalMonth(parseInt(year), month)
      : year;

    return (
      <Reportosm1CompDetailComp
        reportData={{
          year: displayYear,
          month: monthLabel,
          name: selectedRow?.name || "ไม่พบข้อมูล",
          date: selectedRow?.date || "",
          rawData: selectedRow?.rawData,
        }}
      />
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-b from-[#f7f2ff] via-white to-white p-0">
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
                  <Download size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    รายงาน อสม.1
                  </h1>
                  <p className="text-white/80">
                    สรุปข้อมูลรายงานและดาวน์โหลดไฟล์ได้ทันที
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

      <div className="bg-white border border-[#eee5ff] shadow-xl rounded-2xl p-5 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            placeholder="เลือกเดือน"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            options={monthOptions}
            icon={Calendar}
          />
          <CustomSelect
            label="เขตสุขภาพ"
            placeholder="เลือกเขต"
            value={zone}
            onChange={(e) => handleZoneChange(e.target.value)}
            options={Array.isArray(healthAreas) ? healthAreas.map(h => ({ label: h.name_th, value: h.code })) : []}
            icon={MapPin}
            disabled={isLocked('zone')}
          />
          <CustomSelect
            label="จังหวัด"
            placeholder="เลือกจังหวัด"
            value={province}
            onChange={(e) => handleProvinceChange(e.target.value)}
            options={Array.isArray(provinces) ? provinces.map(p => ({ label: p.name_th, value: p.code })) : []}
            icon={Building2}
            disabled={isLocked('province')}
          />
          <CustomSelect
            label="อำเภอ"
            placeholder="เลือกอำเภอ"
            value={district}
            onChange={(e) => handleDistrictChange(e.target.value)}
            options={Array.isArray(districts) ? districts.map(d => ({ label: d.name_th, value: d.code })) : []}
            icon={Building2}
            disabled={isLocked('district') || isDistrictDisabled}
          />
          <CustomSelect
            label="ตำบล"
            placeholder="เลือกตำบล"
            value={subdistrict}
            onChange={(e) => handleSubdistrictChange(e.target.value)}
            options={Array.isArray(subdistricts) ? subdistricts.map(s => ({ label: s.name_th, value: s.code })) : []}
            icon={Home}
            disabled={isLocked('subdistrict') || isSubdistrictDisabled}
          />
          <CustomSelect
            label="หน่วยบริการ"
            placeholder="เลือกหน่วยบริการ"
            value={service}
            onChange={(e) => handleServiceChange(e.target.value)}
            options={Array.isArray(filteredHealthServices) ? filteredHealthServices.map(h => ({
              label: h.name_th || h.name || h.service_name || "ไม่ระบุ",
              value: h.code
            })) : []}
            icon={Home}
            disabled={isLocked('service') || isServiceDisabled}
          />
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
              placeholder="พิมพ์คำค้นหาชื่อรายงาน วันที่..."
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

      <div className="bg-white border border-[#eee5ff] shadow-xl rounded-2xl p-5 sm:p-6">
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
                  รายชื่อ
                </th>
                <th className="py-4 px-4 font-semibold text-center text-white">
                  ส่งวันที่
                </th>
                <th className="py-4 px-4 font-semibold text-center text-white rounded-tr-xl">
                  การทำงาน
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7e32e2]"></div>
                      <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileText size={48} className="text-gray-300" />
                      <p className="text-gray-500">ไม่พบข้อมูล</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => (
                  <tr
                    key={row.id || row.index}
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
                    <td className="py-4 px-4 text-center text-gray-600">
                      {row.date}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7e32e2] to-[#9333ea] text-white font-semibold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                        onClick={() =>
                          router.push(`/report-osm1/data?detail=${row.id}`)
                        }
                      >
                        <Eye size={16} />
                        รายละเอียด
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
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

export default Reportosm1DataComp;
