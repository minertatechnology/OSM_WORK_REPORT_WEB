import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Eye,
  Download,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Calendar,
  MapPin,
  Building2,
  FileText,
  Users,
  Baby,
  RotateCcw,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { font as sarabunFont } from "../../styles/Sarabun-Regular-normal";
import { fontbold as sarabunBoldFont } from "../../styles/Sarabun-Regular-bold";
import PregnantReportDetail from "./PregnantReportDetail/PregnantReportDetail";

// Mock Data
const YEARS = ["2568", "2567", "2566"];
const MONTHS = [
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
const WEEKS = [
  "สัปดาห์ 4 (22/6/68-30/6/68)",
  "สัปดาห์ 3 (15/6/68-21/6/68)",
  "สัปดาห์ 2 (8/6/68-14/6/68)",
  "สัปดาห์ 1 (1/6/68-7/6/68)",
];
const ZONES = Array.from({ length: 13 }, (_, i) => `เขตสุขภาพที่ ${i + 1}`);
const PROVINCES = ["เชียงใหม่", "กรุงเทพฯ", "ขอนแก่น", "นครราชสีมา", "ชลบุรี"];
const DISTRICTS = ["เมือง", "สันทราย", "หางดง", "ดอยสะเก็ด"];
const SUBDISTRICTS = ["ท่าศาลา", "หนองจ๊อม", "สันทรายน้อย", "สันทรายหลวง"];
const SERVICES = ["รพ.เชียงใหม่", "รพ.สันทราย", "รพ.หางดง", "รพ.ดอยสะเก็ด"];

// Tabs for report status
const TABS = [
  { key: "submitted", label: "ส่งรายงานแล้ว" },
  { key: "notSubmitted", label: "ยังไม่ส่งรายงาน" },
];

// Table mock (100 rows)
const ALL_ROWS = Array.from({ length: 100 }, (_, i) => ({
  index: i + 1,
  name: `นางสาว${
    ["ชุชนาถ ผดุงจิตร", "สมหญิง ใจดี", "วรรณา สุขใจ", "มาลี รักษ์ดี"][i % 4]
  }`,
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

// CustomSelect component - styled dropdown
function CustomSelect({ value, onChange, options, placeholder, icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setHighlightedIndex(-1);
  };

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (event) => {
    if (!isOpen) {
      if (
        event.key === "Enter" ||
        event.key === " " ||
        event.key === "ArrowDown"
      ) {
        event.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (event.key) {
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case "ArrowDown":
        event.preventDefault();
        setHighlightedIndex((prev) =>
          prev < options.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : options.length - 1
        );
        break;
      case "Enter":
        event.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(options[highlightedIndex]);
        }
        break;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`w-full h-12 rounded-xl border-2 ${
          isOpen
            ? "border-[#7e32e2] ring-2 ring-purple-200"
            : "border-purple-200"
        } bg-gradient-to-r from-purple-50/80 to-violet-50/80 text-gray-700 font-medium hover:border-purple-300 hover:shadow-sm transition-all duration-200 cursor-pointer flex items-center justify-between`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="combobox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={18} className="text-[#7e32e2]" />}
          <span className={value ? "text-gray-700" : "text-gray-400"}>
            {value || placeholder}
          </span>
        </div>
        <ChevronDown
          size={20}
          className={`text-[#7e32e2] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border-2 border-purple-200 shadow-xl max-h-64 overflow-auto">
          <ul role="listbox">
            <li
              className={`px-4 py-3 cursor-pointer transition-colors ${
                !value
                  ? "bg-purple-50 text-[#7e32e2] font-semibold"
                  : "hover:bg-purple-50 text-gray-700"
              }`}
              onClick={() => handleSelect("")}
              role="option"
            >
              {placeholder}
            </li>
            {options.map((option, index) => (
              <li
                key={option}
                className={`px-4 py-3 cursor-pointer transition-colors ${
                  value === option
                    ? "bg-gradient-to-r from-purple-100 to-violet-100 text-[#7e32e2] font-semibold border-l-4 border-[#7e32e2]"
                    : highlightedIndex === index
                    ? "bg-purple-50 text-gray-700"
                    : "hover:bg-purple-50 text-gray-700"
                }`}
                onClick={() => handleSelect(option)}
                role="option"
                aria-selected={value === option}
              >
                {option}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Export functions
// 1. สรุปจำนวนการส่งรายงาน
function exportSummaryPDF(data) {
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
  doc.text("สรุปจำนวนการส่งรายงานประเมินหญิงตั้งครรภ์", 105, 15, {
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

    // ชื่อ
    doc.rect(xPos, yPos, colWidths[1], rowHeight);
    doc.text(row.name, xPos + 3, yPos + 5.5);
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
function exportOverviewPDF(data) {
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

    // ชื่อ
    doc.rect(xPos, yPos, colWidths[1], rowHeight);
    doc.text(row.name, xPos + 3, yPos + 5.5);
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
function exportNotSubmittedPDF(data) {
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

    // ชื่อ
    doc.rect(xPos, yPos, colWidths[1], rowHeight);
    doc.text(row.name, xPos + 3, yPos + 5.5);
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

function exportToExcel(data, title = "รายงานประเมินหญิงตั้งครรภ์") {
  // Prepare data for Excel
  const excelData = data.map((row, idx) => ({
    ลำดับ: idx + 1,
    "ชื่อ-นามสกุล": row.name,
    วันที่ส่ง: row.date,
    จำนวนหญิงตั้งครรภ์: row.amount,
  }));

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
function DetailModal({ open, onClose, data = [] }) {
  if (!open) return null;

  const handleExportSummaryPDF = () => {
    if (data.length > 0) {
      exportSummaryPDF(data);
    }
  };

  const handleExportOverviewPDF = () => {
    if (data.length > 0) {
      exportOverviewPDF(data);
    }
  };

  const handleExportNotSubmittedPDF = () => {
    // Use ALL_ROWS instead of data to get all records including notSubmitted
    const allData = ALL_ROWS;
    if (allData.length > 0) {
      exportNotSubmittedPDF(allData);
    }
  };

  const handleExportSummaryExcel = () => {
    if (data.length > 0) {
      exportToExcel(data, "สรุปจำนวนการส่งรายงาน");
    }
  };

  const handleExportOverviewExcel = () => {
    if (data.length > 0) {
      exportToExcel(data, "สรุปภาพรวมรายงานในพื้นที่");
    }
  };

  const handleExportNotSubmittedExcel = () => {
    // Use ALL_ROWS instead of data to get all records including notSubmitted
    const notSubmittedData = ALL_ROWS.filter(
      (row) => row.status === "notSubmitted"
    );
    if (notSubmittedData.length > 0) {
      exportToExcel(notSubmittedData, "อสม. ที่ยังไม่ส่งรายงาน");
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
  const detailId = searchParams.get("detail");

  // State
  const [searchType, setSearchType] = useState("year");
  const [year, setYear] = useState("2568");
  const [month, setMonth] = useState("มิถุนายน");
  const [week, setWeek] = useState("สัปดาห์ 4 (22/6/68-30/6/68)");
  const [zone, setZone] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [subdistrict, setSubdistrict] = useState("");
  const [service, setService] = useState("");
  const [keyword, setKeyword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState("submitted");

  // Pagination state
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter rows by tab and keyword
  const filteredRows = ALL_ROWS.filter(
    (row) =>
      row.status === activeTab &&
      (row.name.includes(keyword) ||
        row.date.includes(keyword) ||
        String(row.index).includes(keyword))
  );
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
    setYear("2568");
    setMonth("มิถุนายน");
    setWeek("สัปดาห์ 4 (22/6/68-30/6/68)");
    setZone("");
    setService("");
    setProvince("");
    setDistrict("");
    setSubdistrict("");
    setKeyword("");
  };

  // ถ้ามี detailId ให้แสดงหน้ารายละเอียด
  if (detailId) {
    const selectedRow = ALL_ROWS.find((row) => row.index === Number(detailId));
    return (
      <PregnantReportDetail
        reportData={{
          year,
          month,
          name: selectedRow?.name || "ไม่พบข้อมูล",
        }}
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
                    รายงานประเมินหญิงตั้งครรภ์
                  </h1>
                  <p className="text-white/80 text-sm mt-1">
                    แดชบอร์ดรายงานและดาวน์โหลดสำหรับหญิงตั้งครรภ์
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
        <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-[#f0ebff]">
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
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              ปี
            </label>
            <CustomSelect
              value={year}
              onChange={setYear}
              options={YEARS}
              placeholder="เลือกปี"
              icon={Calendar}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              เดือน
            </label>
            <CustomSelect
              value={month}
              onChange={setMonth}
              options={MONTHS}
              placeholder="เลือกเดือน"
              icon={Calendar}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              สัปดาห์
            </label>
            <CustomSelect
              value={week}
              onChange={setWeek}
              options={WEEKS}
              placeholder="เลือกสัปดาห์"
              icon={Calendar}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              เขตสุขภาพ
            </label>
            <CustomSelect
              value={zone}
              onChange={setZone}
              options={ZONES}
              placeholder="เลือกเขตสุขภาพ"
              icon={MapPin}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              จังหวัด
            </label>
            <CustomSelect
              value={province}
              onChange={setProvince}
              options={PROVINCES}
              placeholder="เลือกจังหวัด"
              icon={MapPin}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              อำเภอ
            </label>
            <CustomSelect
              value={district}
              onChange={setDistrict}
              options={DISTRICTS}
              placeholder="เลือกอำเภอ"
              icon={MapPin}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              ตำบล
            </label>
            <CustomSelect
              value={subdistrict}
              onChange={setSubdistrict}
              options={SUBDISTRICTS}
              placeholder="เลือกตำบล"
              icon={MapPin}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              หน่วยบริการ
            </label>
            <CustomSelect
              value={service}
              onChange={setService}
              options={SERVICES}
              placeholder="เลือกหน่วยบริการ"
              icon={Building2}
            />
          </div>
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
                  ส่งวันที่
                </th>
                <th className="py-4 px-4 font-semibold text-center">
                  จำนวนหญิงตั้งครรภ์
                </th>
                {activeTab === "submitted" && (
                  <th className="py-4 px-4 font-semibold text-center rounded-tr-xl">
                    รายละเอียด
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={activeTab === "submitted" ? 5 : 4}
                    className="py-12 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <FileText size={48} className="text-gray-300" />
                      <p className="text-gray-500">ไม่พบข้อมูล</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => (
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
                ))
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

