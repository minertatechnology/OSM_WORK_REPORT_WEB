import React, { useState, useRef, useEffect, useMemo } from "react";
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
  Calendar,
  MapPin,
  Building2,
  Home,
  Heart,
  UserCheck,
  RotateCcw,
  FileText,
  Users,
} from "lucide-react";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { font as sarabunFont } from "../../styles/Sarabun-Regular-normal";
import { fontbold as sarabunBoldFont } from "../../styles/Sarabun-Regular-bold";
import ElderlyScreeningDetail from "./ElderlyScreeningDetail/ElderlyScreeningDetail";

// Mock Data
const YEARS = ["2568", "2567", "2566"];
const MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];
const WEEKS = [
  'สัปดาห์ที่ 1 (1/6/68-7/6/68)',
  'สัปดาห์ที่ 2 (8/6/68-14/6/68)',
  'สัปดาห์ที่ 3 (15/6/68-21/6/68)',
  'สัปดาห์ที่ 4 (22/6/68-30/6/68)',
];
const ZONES = Array.from({ length: 13 }, (_, i) => `เขตสุขภาพที่ ${i + 1}`);
const PROVINCES = ['เชียงใหม่', 'กรุงเทพฯ', 'อุดรธานี', 'นครราชสีมา', 'ชลบุรี'];
const DISTRICTS = ['เมือง', 'สันทราย', 'บางนา', 'พระประแดง'];
const SUBDISTRICTS = ['ท่าศาลา', 'หนองจ๊อม', 'บางแก้ว', 'บางครุ'];
const SERVICES = ['รพ.เชียงใหม่', 'รพ.สันทราย', 'รพ.บางนา', 'รพ.พระประแดง'];

// Table mock (100 rows)
const ALL_ROWS = Array.from({ length: 100 }, (_, i) => ({
  index: i + 1,
  name: "นางสาวชนุชนาถ ผดุงจิตร",
  date: "25 มิถุนายน 2568",
  amount: 15 + (i % 10),
}));

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
  doc.text("สรุปจำนวนการส่งรายงานคัดกรองผู้สูงอายุ", 105, 15, { align: "center" });
  doc.setFontSize(12);
  doc.setFont("Sarabun", "normal");
  doc.text(`วันที่ส่งออก: ${new Date().toLocaleDateString("th-TH")}`, 105, 23, { align: "center" });

  const startX = 15;
  const startY = 35;
  const rowHeight = 8;
  const colWidths = [20, 90, 40, 40];
  const headers = ["ลำดับ", "ชื่อ-นามสกุล", "วันที่", "จำนวนผู้สูงอายุ"];

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.setFillColor(255, 255, 255);

  let xPos = startX;
  headers.forEach((header, i) => {
    doc.rect(xPos, startY, colWidths[i], rowHeight);
    doc.setFont("Sarabun", "bold");
    doc.setFontSize(11);
    doc.text(header, xPos + colWidths[i] / 2, startY + 5.5, { align: "center" });
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
    doc.text(String(idx + 1), xPos + colWidths[0] / 2, yPos + 5.5, { align: "center" });
    xPos += colWidths[0];

    doc.rect(xPos, yPos, colWidths[1], rowHeight);
    doc.text(row.name, xPos + 3, yPos + 5.5);
    xPos += colWidths[1];

    doc.rect(xPos, yPos, colWidths[2], rowHeight);
    doc.text(row.date, xPos + colWidths[2] / 2, yPos + 5.5, { align: "center" });
    xPos += colWidths[2];

    doc.rect(xPos, yPos, colWidths[3], rowHeight);
    doc.text(String(row.amount), xPos + colWidths[3] / 2, yPos + 5.5, { align: "center" });

    yPos += rowHeight;
  });

  doc.save(`สรุปจำนวนรายงาน_ผู้สูงอายุ_${new Date().toISOString().split("T")[0]}.pdf`);
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
  doc.text("สรุปภาพรวมรายงานคัดกรองผู้สูงอายุในพื้นที่", 105, 15, { align: "center" });
  doc.setFontSize(12);
  doc.setFont("Sarabun", "normal");
  doc.text(`วันที่ส่งออก: ${new Date().toLocaleDateString("th-TH")}`, 105, 23, { align: "center" });

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
    doc.text(header, xPos + colWidths[i] / 2, startY + 5.5, { align: "center" });
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
    doc.text(String(idx + 1), xPos + colWidths[0] / 2, yPos + 5.5, { align: "center" });
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
    doc.text(String(row.amount), xPos + colWidths[4] / 2, yPos + 5.5, { align: "center" });

    yPos += rowHeight;
  });

  doc.save(`สรุปภาพรวม_ผู้สูงอายุ_${new Date().toISOString().split("T")[0]}.pdf`);
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
  doc.text("รายชื่อ อสม. ที่ยังไม่ส่งรายงานคัดกรองผู้สูงอายุ", 105, 15, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("Sarabun", "normal");
  doc.text(`วันที่ส่งออก: ${new Date().toLocaleDateString("th-TH")}`, 105, 23, { align: "center" });

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
    doc.text(header, xPos + colWidths[i] / 2, startY + 5.5, { align: "center" });
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
    doc.text(String(idx + 1), xPos + colWidths[0] / 2, yPos + 5.5, { align: "center" });
    xPos += colWidths[0];

    doc.rect(xPos, yPos, colWidths[1], rowHeight);
    doc.text(row.name, xPos + 3, yPos + 5.5);
    xPos += colWidths[1];

    doc.rect(xPos, yPos, colWidths[2], rowHeight);
    doc.text("ยังไม่ส่งรายงาน", xPos + 3, yPos + 5.5);

    yPos += rowHeight;
  });

  doc.save(`อสม_ที่ยังไม่ส่งรายงาน_ผู้สูงอายุ_${new Date().toISOString().split("T")[0]}.pdf`);
}

function exportToExcel(data, title = "รายงานคัดกรองผู้สูงอายุ") {
  const excelData = data.map((row, idx) => ({
    "ลำดับ": idx + 1,
    "ชื่อ-นามสกุล": row.name,
    "วันที่ส่ง": row.date,
    "จำนวนผู้สูงอายุ": row.amount,
  }));

  const ws = XLSX.utils.json_to_sheet(excelData);
  ws["!cols"] = [
    { wch: 8 },
    { wch: 30 },
    { wch: 20 },
    { wch: 20 },
  ];

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
        <div className="text-[20px] font-bold text-[#7e32e2] mb-5">รายละเอียดเอกสาร</div>
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 bg-purple-50/60 border border-purple-100 rounded-xl px-4 py-3">
            <div className="flex-1 text-[16px] text-[#231d37] font-semibold">สรุปจำนวนการส่งรายงาน</div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-white text-[#d32f2f] font-semibold text-[15px] shadow-sm hover:bg-red-50 hover:border-red-300 transition-all active:scale-95" onClick={handleExportSummaryPDF}>
                <Image src="/pdf.png" alt="pdf" width={24} height={24} className="w-6 h-6" />
                เอกสาร PDF
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-green-200 bg-white text-[#388e3c] font-semibold text-[15px] shadow-sm hover:bg-green-50 hover:border-green-300 transition-all active:scale-95" onClick={() => handleExportExcel(rows)}>
                <Image src="/xlsx.png" alt="excel" width={24} height={24} className="w-6 h-6" />
                เอกสาร Excel
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 bg-purple-50/40 border border-purple-100 rounded-xl px-4 py-3">
            <div className="flex-1 text-[16px] text-[#231d37] font-semibold">สรุปภาพรวมรายงานในพื้นที่</div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-white text-[#d32f2f] font-semibold text-[15px] shadow-sm hover:bg-red-50 hover:border-red-300 transition-all active:scale-95" onClick={handleExportOverviewPDF}>
                <Image src="/pdf.png" alt="pdf" width={24} height={24} className="w-6 h-6" />
                เอกสาร PDF
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-green-200 bg-white text-[#388e3c] font-semibold text-[15px] shadow-sm hover:bg-green-50 hover:border-green-300 transition-all active:scale-95" onClick={() => handleExportExcel(rows, "สรุปภาพรวมรายงานในพื้นที่")}>
                <Image src="/xlsx.png" alt="excel" width={24} height={24} className="w-6 h-6" />
                เอกสาร Excel
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 bg-purple-50/30 border border-purple-100 rounded-xl px-4 py-3">
            <div className="flex-1 text-[16px] text-[#231d37] font-semibold">อสม. ที่ยังไม่ส่งรายงาน</div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-white text-[#d32f2f] font-semibold text-[15px] shadow-sm hover:bg-red-50 hover:border-red-300 transition-all active:scale-95" onClick={handleExportNotSubmittedPDF}>
                <Image src="/pdf.png" alt="pdf" width={24} height={24} className="w-6 h-6" />
                เอกสาร PDF
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-green-200 bg-white text-[#388e3c] font-semibold text-[15px] shadow-sm hover:bg-green-50 hover:border-green-300 transition-all active:scale-95" onClick={() => handleExportExcel(rows.slice(0, 10), "อสม. ที่ยังไม่ส่งรายงาน")}>
                <Image src="/xlsx.png" alt="excel" width={24} height={24} className="w-6 h-6" />
                เอกสาร Excel
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button className="px-6 py-2 rounded-xl border border-[#7e32e2] text-[#7e32e2] bg-white font-semibold text-[16px] shadow hover:bg-[#f6eeff] transition" onClick={onClose}>
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
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
        className={`w-full h-12 px-4 rounded-xl border-2 ${
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
                key={idx}
                className="px-2 py-1 text-gray-400 font-semibold select-none"
              >
                ...
              </span>
            ) : (
              <button
                key={idx}
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
  const detailId = searchParams.get("detail");

  const [searchType, setSearchType] = useState("year");
  const [year, setYear] = useState("2568");
  const [month, setMonth] = useState("มิถุนายน");
  const [week, setWeek] = useState("สัปดาห์ 4 (23/6/68-27/6/68)");
  const [zone, setZone] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [subdistrict, setSubdistrict] = useState("");
  const [service, setService] = useState("");
  const [keyword, setKeyword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredRows = useMemo(
    () =>
      ALL_ROWS.filter(
        (row) =>
          row.name.includes(keyword) ||
          row.date.includes(keyword) ||
          String(row.index).includes(keyword)
      ),
    [keyword]
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));
  const paginatedRows = useMemo(
    () =>
      filteredRows.slice((page - 1) * itemsPerPage, page * itemsPerPage),
    [filteredRows, page, itemsPerPage]
  );

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [filteredRows.length, totalPages, page]);

  const totalReports = filteredRows.length;
  const totalElderly = useMemo(
    () => filteredRows.reduce((sum, row) => sum + row.amount, 0),
    [filteredRows]
  );

  const handleClear = () => {
    setYear("2568");
    setMonth("มิถุนายน");
    setWeek("สัปดาห์ 4 (23/6/68-27/6/68)");
    setZone("");
    setService("");
    setProvince("");
    setDistrict("");
    setSubdistrict("");
    setKeyword("");
    setPage(1);
  };

  const searchModes = [
    { key: "year", label: "ค้นหาแบบรายปี" },
    { key: "budget", label: "ค้นหาแบบรายปีงบประมาณ" }
  ];

  // ถ้ามี detailId ให้แสดงหน้ารายละเอียด
  if (detailId) {
    const selectedRow = ALL_ROWS.find((row) => row.index === Number(detailId));
    return (
      <ElderlyScreeningDetail
        reportData={{
          year,
          month,
          name: selectedRow?.name || "ไม่พบข้อมูล",
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
                  <Users size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">คัดกรองผู้สูงอายุในชุมชน</h1>
                  <p className="text-white/80">แดชบอร์ดรายงานและรายละเอียดเอกสาร</p>
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
        <div className="mb-4 flex flex-wrap gap-2">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ปี</label>
            <CustomSelect
              value={year}
              onChange={setYear}
              options={YEARS}
              placeholder="เลือกปี"
              icon={Calendar}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เดือน</label>
            <CustomSelect
              value={month}
              onChange={setMonth}
              options={MONTHS}
              placeholder="เลือกเดือน"
              icon={Calendar}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">สัปดาห์</label>
            <CustomSelect
              value={week}
              onChange={setWeek}
              options={WEEKS}
              placeholder="เลือกสัปดาห์"
              icon={Calendar}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เขตสุขภาพ</label>
            <CustomSelect
              value={zone}
              onChange={setZone}
              options={ZONES}
              placeholder="เลือกเขตสุขภาพ"
              icon={MapPin}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">จังหวัด</label>
            <CustomSelect
              value={province}
              onChange={setProvince}
              options={PROVINCES}
              placeholder="เลือกจังหวัด"
              icon={Building2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">อำเภอ</label>
            <CustomSelect
              value={district}
              onChange={setDistrict}
              options={DISTRICTS}
              placeholder="เลือกอำเภอ"
              icon={Building2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ตำบล</label>
            <CustomSelect
              value={subdistrict}
              onChange={setSubdistrict}
              options={SUBDISTRICTS}
              placeholder="เลือกตำบล"
              icon={Home}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หน่วยบริการ</label>
            <CustomSelect
              value={service}
              onChange={setService}
              options={SERVICES}
              placeholder="เลือกหน่วยบริการ"
              icon={UserCheck}
            />
          </div>
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
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
          <table className="w-full text-[15px] border-separate" style={{ borderSpacing: 0, minWidth: "900px" }}>
            <thead>
              <tr className="bg-gradient-to-r from-[#7e32e2] to-[#a855f7] text-white">
                <th className="py-4 px-4 font-semibold text-center text-white rounded-tl-xl">ลำดับ</th>
                <th className="py-4 px-4 font-semibold text-left text-white">ชื่อ-นามสกุล</th>
                <th className="py-4 px-4 font-semibold text-center text-white">วันที่</th>
                <th className="py-4 px-4 font-semibold text-center text-white">จำนวนผู้สูงอายุ</th>
                <th className="py-4 px-4 font-semibold text-center text-white rounded-tr-xl">รายละเอียด</th>
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
                paginatedRows.map((row, idx) => (
                  <tr
                    key={row.index}
                    className={`${idx % 2 === 0 ? "bg-white" : "bg-purple-50/30"} hover:bg-purple-50 transition-colors`}
                  >
                    <td className="py-4 px-4 text-center font-medium text-gray-600">
                      {(page - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="py-4 px-4 font-medium text-[#231d37]">{row.name}</td>
                    <td className="py-4 px-4 text-center text-gray-600">{row.date}</td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-100 text-pink-700 font-semibold text-sm">
                        <Users size={14} />
                        {row.amount}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7e32e2] to-[#9333ea] text-white font-semibold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                        onClick={() => router.push(`/elderly-screening?detail=${row.index}`)}
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
