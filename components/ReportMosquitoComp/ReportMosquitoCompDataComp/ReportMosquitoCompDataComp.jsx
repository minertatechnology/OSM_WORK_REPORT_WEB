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
  FileText,
  Users,
  Loader2,
  AlertCircle,
} from "lucide-react";
import CustomSelect from "@services/customSelectService/customSelectService";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { font as sarabunFont } from "../../../styles/Sarabun-Regular-normal";
import { fontbold as sarabunBoldFont } from "../../../styles/Sarabun-Regular-bold";
import ReportMosquitoCompDetailComp from "../ReportMosquitoCompDetailComp/ReportMosquitoCompDetailComp";
import {
  fetchMosquitoLarvaeReports,
} from "@services/mosquitoLarvaeService/mosquitoLarvaeService";
import oauth2Service from "@services/oauth2Service";
import { formatThaiDate } from "@utils/dateFormatter";
import { ArrowLeft } from "lucide-react";
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
  isInWeekOfMonth,
  generateWeekOptionsForMonth
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

const MOCK_REPORTS = [
  {
    name: "รายงานลูกน้ำยุงลาย บ้านเหนือ หมู่ 3 ต.ในเมือง อ.เมือง",
    date: "28 มิถุนายน 2568",
    amount: 21,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านใต้ หมู่ 7 ต.โนนสูง อ.โนนสูง",
    date: "27 มิถุนายน 2568",
    amount: 17,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านหนองน้ำ หมู่ 4 ต.หนองน้ำ อ.เมือง",
    date: "26 มิถุนายน 2568",
    amount: 24,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านทุ่งนา หมู่ 9 ต.ทุ่งนา อ.ปากช่อง",
    date: "25 มิถุนายน 2568",
    amount: 19,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านกลาง หมู่ 2 ต.ในเมือง อ.เมือง",
    date: "24 มิถุนายน 2568",
    amount: 14,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านโนนสูง หมู่ 11 ต.โนนสูง อ.โนนสูง",
    date: "23 มิถุนายน 2568",
    amount: 26,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านหนองสาหร่าย หมู่ 6 ต.หนองสาหร่าย อ.ปากช่อง",
    date: "22 มิถุนายน 2568",
    amount: 16,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านห้วยลึก หมู่ 10 ต.ห้วยลึก อ.เมือง",
    date: "21 มิถุนายน 2568",
    amount: 18,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านตลาด หมู่ 1 ต.ในเมือง อ.เมือง",
    date: "20 มิถุนายน 2568",
    amount: 22,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านหนองเต็ง หมู่ 8 ต.หนองเต็ง อ.โนนสูง",
    date: "19 มิถุนายน 2568",
    amount: 15,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านท่าแดง หมู่ 5 ต.ท่าแดง อ.ปากช่อง",
    date: "18 มิถุนายน 2568",
    amount: 20,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านห้วยใหญ่ หมู่ 12 ต.ห้วยใหญ่ อ.โนนสูง",
    date: "17 มิถุนายน 2568",
    amount: 23,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านหนองบัว หมู่ 4 ต.หนองบัว อ.เมือง",
    date: "16 มิถุนายน 2568",
    amount: 19,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านโคกสูง หมู่ 2 ต.โคกสูง อ.เมือง",
    date: "15 มิถุนายน 2568",
    amount: 13,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านหนองแค หมู่ 3 ต.หนองแค อ.เมือง",
    date: "14 มิถุนายน 2568",
    amount: 25,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านดอนกลาง หมู่ 6 ต.ดอนกลาง อ.ปากช่อง",
    date: "13 มิถุนายน 2568",
    amount: 18,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านท่าม่วง หมู่ 9 ต.ท่าม่วง อ.เมือง",
    date: "12 มิถุนายน 2568",
    amount: 16,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านหนองไผ่ หมู่ 7 ต.หนองไผ่ อ.โนนสูง",
    date: "11 มิถุนายน 2568",
    amount: 21,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านกุดตะเคียน หมู่ 5 ต.กุดตะเคียน อ.เมือง",
    date: "10 มิถุนายน 2568",
    amount: 17,
  },
  {
    name: "รายงานลูกน้ำยุงลาย บ้านหนองโพธิ์ หมู่ 8 ต.หนองโพธิ์ อ.โนนสูง",
    date: "9 มิถุนายน 2568",
    amount: 20,
  },
];

const ALL_ROWS = MOCK_REPORTS.map((row, idx) => ({ ...row, index: idx + 1 }));

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
  doc.text("สรุปยอดรายงานลูกน้ำยุงลาย", 105, 15, { align: "center" });
  doc.setFontSize(12);
  doc.setFont("Sarabun", "normal");
  doc.text(`วันที่ส่งออก: ${new Date().toLocaleDateString("th-TH")}`, 105, 23, {
    align: "center",
  });

  const startX = 15;
  const startY = 35;
  const rowHeight = 8;
  const colWidths = [20, 90, 40, 30];
  const headers = ["ลำดับ", "ชื่อรายงาน", "วันที่", "จำนวน"];

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
    xPos += colWidths[2];

    doc.rect(xPos, yPos, colWidths[3], rowHeight);
    doc.text(String(row.amount), xPos + colWidths[3] / 2, yPos + 5.5, {
      align: "center",
    });

    yPos += rowHeight;
  });

  doc.save(
    `สรุปยอดรายงาน_ลูกน้ำยุงลาย_${new Date().toISOString().split("T")[0]}.pdf`
  );
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
  doc.text("สรุปรายอำเภอ - รายงานลูกน้ำยุงลาย", 105, 15, { align: "center" });
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

  // Mock district data
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

  doc.save(
    `สรุปรายอำเภอ_ลูกน้ำยุงลาย_${new Date().toISOString().split("T")[0]}.pdf`
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
  doc.text("หน่วยที่ยังไม่ส่งรายงานลูกน้ำยุงลาย", 105, 15, {
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

  // Mock not submitted data (first 5 items as example)
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
    `หน่วยที่ยังไม่ส่ง_ลูกน้ำยุงลาย_${
      new Date().toISOString().split("T")[0]
    }.pdf`
  );
}

function exportToExcel(data, title = "รายงานลูกน้ำยุงลาย") {
  const excelData = data.map((row, idx) => ({
    ลำดับ: idx + 1,
    ชื่อรายงาน: row.name,
    วันที่: row.date,
    จำนวน: row.amount,
  }));

  const ws = XLSX.utils.json_to_sheet(excelData);
  ws["!cols"] = [{ wch: 8 }, { wch: 50 }, { wch: 20 }, { wch: 15 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "รายงาน");

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(
    blob,
    `mosquito_report_${new Date().toISOString().split("T")[0]}.xlsx`
  );
}

function DetailModal({ open, onClose, data = [] }) {
  if (!open) return null;

  const rows = data?.length ? data : ALL_ROWS;

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

function Pagination({
  currentPage,
  setCurrentPage,
  totalPages,
  itemsPerPage,
  setItemsPerPage,
}) {
  const options = [
    { label: "10", value: 10 },
    { label: "20", value: 20 },
    { label: "50", value: 50 },
    { label: "100", value: 100 },
  ];
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
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-600">แถว</span>
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
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
            currentPage === 1
              ? "text-gray-300 cursor-not-allowed"
              : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-110"
          }`}
          title="ก่อนหน้า"
          aria-label="ก่อนหน้า"
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
                className={`min-w[36px] h-9 rounded-full font-semibold text-base transition-all duration-200 ${
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
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
            currentPage === totalPages
              ? "text-gray-300 cursor-not-allowed"
              : "text-[#7e32e2] hover:bg-[#f6eeff] hover:scale-110"
          }`}
          title="ถัดไป"
          aria-label="ถัดไป"
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

const ReportMosquitoCompDataComp = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use permission-based filters
  const { isLocked } = useUserPermission();
  const {
    yearType,
    year,
    month,
    week,
    zone,
    province,
    district,
    subdistrict,
    village,
    service,
    setYearType,
    setYear,
    setMonth,
    setWeek,
    handleZoneChange,
    handleProvinceChange,
    handleDistrictChange,
    handleSubdistrictChange,
    handleVillageChange,
    handleServiceChange,
    healthAreas,
    provinces,
    districts,
    subdistricts,
    villages,
    healthServices,
    isDistrictDisabled,
    isSubdistrictDisabled,
    isServiceDisabled,
  } = usePermissionFilters({
    defaultYear: String(currentFiscalYear),
    defaultYearType: "fiscal",
    includeWeek: true, // Enable week filtering for this component
  });

  // Generate dynamic week options based on selected year and month
  const WEEKS = useMemo(() => {
    return generateWeekOptionsForMonth(parseInt(year), parseInt(month));
  }, [year, month]);

  const [keyword, setKeyword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // API data states
  const [apiData, setApiData] = useState([]);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [osmDataByService, setOsmDataByService] = useState([]); // เก็บข้อมูล OSM ตามหน่วยบริการ

  // Get current view from URL params
  const userId = searchParams.get("user_id");
  const householdId = searchParams.get("household_id");

  // Note: Location data loading is handled by usePermissionFilters hook

  // Fetch data based on current view
  useEffect(() => {
    const loadData = async () => {
      // View 3: Detail page - no need to fetch list data
      if (householdId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setApiData([]);

        // ดึงข้อมูล OSM ตามหน่วยบริการ (ถ้าเลือกหน่วยบริการ)
        let osmData = [];
        if (service) {
          try {
            osmData = await getOsmByHealthService(service);
            console.log("📊 OSM Data received:", osmData.length, "items");
            console.log("🆔 OSM IDs:", osmData.map(o => o.id));
            setOsmDataByService(osmData);
          } catch (err) {
            console.error("Error fetching OSM data:", err);
            setOsmDataByService([]);
          }
        } else {
          setOsmDataByService([]);
        }

        // Fetch all reports
        const data = await fetchMosquitoLarvaeReports({
          skip: 0,
          limit: 1000,
        });

        console.log("📊 All data received:", data.length);

        // View 2: Household list for specific user
        if (userId) {
          // ดึงข้อมูลผู้ใช้ (อสม.)
          const users = await oauth2Service.getBatch([userId]);
          const userData = users[userId];
          setSelectedUserName(userData?.name || "ไม่ระบุชื่อ");

          console.log("👤 User data (อสม.):", {
            name: userData?.name,
            province: userData?.province_name_th,
            district: userData?.district_name_th,
            subdistrict: userData?.subdistrict_name_th
          });

          // กรองข้อมูล reports ของ user นี้
          const userReports = data.filter(
            (report) => report.external_user_id === userId
          );

          console.log("📊 User reports:", userReports.length);

          // Group by household_id และเก็บข้อมูลบ้าน + วันที่ล่าสุด
          const householdsMap = new Map();
          userReports.forEach((report) => {
            if (!report.household) return; // Skip if no household data

            const householdId = report.household_id;
            const existing = householdsMap.get(householdId);

            // ถ้ายังไม่มี หรือ report นี้ใหม่กว่า ให้อัพเดท
            if (!existing || new Date(report.report_date) > new Date(existing.lastReportDate)) {
              const householdData = {
                id: householdId,
                household_id: householdId,
                name: report.household.address || `บ้านเลขที่ ${report.household.house_number} หมู่ ${report.household.village_number}`,
                houseNumber: report.household.house_number,
                villageNumber: report.household.village_number,
                lastReportDate: report.report_date,
                residentCount: report.household.number_of_residents || 0,
                location_data: report.location_data || report.household.location_data,
                household: report.household,
                // เพิ่มข้อมูลที่อยู่ของ อสม. เพื่อใช้กรอง
                user_location: {
                  province_name_th: userData?.province_name_th,
                  district_name_th: userData?.district_name_th,
                  subdistrict_name_th: userData?.subdistrict_name_th,
                  village_no: userData?.village_no,
                  health_service_id: userData?.health_service_id,
                },
              };
              console.log("💾 Saving household data:", {
                householdId,
                hasLocationData: !!householdData.location_data,
                locationData: householdData.location_data,
                hasHousehold: !!householdData.household,
                userLocation: householdData.user_location
              });
              householdsMap.set(householdId, householdData);
            }
          });

          console.log("📊 Unique households:", householdsMap.size);

          // แปลงเป็น array และเพิ่มวันที่แบบไทย
          const transformedData = Array.from(householdsMap.values()).map((household, idx) => ({
            ...household,
            index: idx + 1,
            date: household.lastReportDate ? formatThaiDate(household.lastReportDate) : "-",
          }));

          console.log("🔍 Transformed Data Sample:", transformedData[0]);
          console.log("🔍 Has location_data?", transformedData[0]?.location_data);
          console.log("🔍 Has household?", transformedData[0]?.household);
          console.log("🔍 Has user_location?", transformedData[0]?.user_location);

          setApiData(transformedData);
        }
        // View 1: User list (group by user)
        else {
          // จัดกลุ่มตาม external_user_id และนับจำนวนบ้าน (household_id ที่ไม่ซ้ำ)
          const groupedByUser = {};
          data.forEach((report) => {
            const uid = report.external_user_id || "unknown";
            if (!groupedByUser[uid]) {
              groupedByUser[uid] = {
                userId: uid,
                households: new Set(), // ใช้ Set เพื่อเก็บ household_id ที่ไม่ซ้ำ
                lastReportDate: report.report_date,
                reportCount: 0,
              };
            }
            // เพิ่ม household_id เข้า Set (จะไม่ซ้ำอัตโนมัติ)
            if (report.household_id) {
              groupedByUser[uid].households.add(report.household_id);
            }
            // อัพเดทวันที่ล่าสุด
            if (report.report_date && new Date(report.report_date) > new Date(groupedByUser[uid].lastReportDate || 0)) {
              groupedByUser[uid].lastReportDate = report.report_date;
            }
            groupedByUser[uid].reportCount++;
          });

          // ดึงข้อมูลผู้ใช้ทั้งหมด
          const externalUserIds = Object.keys(groupedByUser).filter(id => id !== "unknown");
          let users = new Map();

          if (externalUserIds.length > 0) {
            users = await oauth2Service.getBatch(externalUserIds);
          }

          // แปลงข้อมูลพร้อมชื่อผู้ใช้และที่อยู่
          const transformedData = Object.values(groupedByUser).map((userGroup, idx) => {
            const userData = users[userGroup.userId];

            console.log("👤 User data (อสม.) in View 1:", {
              name: userData?.name,
              province: userData?.province_name_th,
              district: userData?.district_name_th,
              subdistrict: userData?.subdistrict_name_th,
              village_no: userData?.village_no,
              health_service_id: userData?.health_service_id,
            });

            return {
              id: userGroup.userId,
              external_user_id: userGroup.userId,
              index: idx + 1,
              name: userData?.name || "ไม่ระบุชื่อ",
              lastReportDate: userGroup.lastReportDate,
              date: userGroup.lastReportDate ? formatThaiDate(userGroup.lastReportDate) : "-",
              amount: userGroup.households.size,
              // เพิ่มข้อมูลที่อยู่ของ อสม. เพื่อใช้กรอง
              user_location: {
                province_name_th: userData?.province_name_th,
                district_name_th: userData?.district_name_th,
                subdistrict_name_th: userData?.subdistrict_name_th,
                village_no: userData?.village_no,
                health_service_id: userData?.health_service_id,
              },
            };
          });

          console.log("🔍 Transformed Data Sample (View 1):", transformedData[0]);
          console.log("🔍 Has user_location (View 1)?", transformedData[0]?.user_location);

          setApiData(transformedData);
        }
      } catch (err) {
        console.error("[MosquitoData] Error loading data:", err);
        setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId, householdId, service]); // เพิ่ม service เพื่อให้ดึงข้อมูลใหม่เมื่อเลือกหน่วยบริการ


  // Filter and search
  const filteredRows = useMemo(() => {
    console.log("🔍 ===== FILTER DEBUG START =====");
    console.log("📍 Selected Filters:", {
      zone,
      province,
      district,
      subdistrict,
      service,
      keyword
    });
    console.log("📊 Total apiData:", apiData.length);

    const result = apiData.filter((row, index) => {
      console.log(`\n--- Checking Row ${index} ---`);
      console.log("Row data:", {
        household: row.household,
        location_data: row.location_data,
        user_location: row.user_location
      });

      // Keyword search (ทำก่อนเสมอ)
      const term = keyword.trim().toLowerCase();
      if (term) {
        const nameMatch = row.name?.toLowerCase().includes(term);
        const dateMatch = row.date?.toLowerCase().includes(term);
        const indexMatch = String(row.index).includes(term);
        const houseNumMatch = row.houseNumber?.toLowerCase().includes(term);
        const villageNumMatch = row.villageNumber?.toLowerCase().includes(term);

        if (!(nameMatch || dateMatch || indexMatch || houseNumMatch || villageNumMatch)) {
          console.log("❌ Failed keyword search");
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
            console.log("❌ Failed year filter");
            return false;
          }
        }
      }

      // Month filtering
      if (month && row.date) {
        const parsedDate = parseThaiDate(row.date);
        if (parsedDate && !isInMonth(parsedDate, month)) {
          console.log("❌ Failed month filter");
          return false;
        }
      }

      // Week filtering (ต้องมีการเลือกเดือนก่อน)
      if (week && month && row.date) {
        const parsedDate = parseThaiDate(row.date);
        if (parsedDate && !isInWeekOfMonth(parsedDate, week)) {
          console.log("❌ Failed week filter");
          return false;
        }
      }

      // Filter ตามหน่วยบริการ (เฉพาะบริการสุขภาพอสม.)
      // ถ้าเลือกหน่วยบริการ ให้ filter เฉพาะตามหน่วยบริการเท่านั้น (สำคัญสุด)
      // ไม่สน filter อื่นๆ เช่น จังหวัด/อำเภอ/ตำบล
      if (service && osmDataByService.length > 0) {
        console.log("🎯 Service filter enabled (PRIORITY)");
        console.log("📊 Rows before service filter:", row.id);

        // สร้าง Set ของ OSM IDs เพื่อให้การ lookup เร็วขึ้น
        const osmIdSet = new Set(osmDataByService.map(osm => osm.id));
        console.log("🆔 OSM ID Set (first 5):", Array.from(osmIdSet).slice(0, 5));
        console.log("👥 Total OSMs:", osmIdSet.size);

        // Filter เฉพาะที่มี external_user_id อยู่ใน osmIdSet
        const match = row.external_user_id && osmIdSet.has(row.external_user_id);
        if (!match && row.external_user_id) {
          console.log("❌ No match - external_user_id:", row.external_user_id);
        } else if (match) {
          console.log("✅ Match - external_user_id:", row.external_user_id);
        }

        if (!match) {
          console.log("❌ Failed service filter");
          return false;
        }

        // ถ้าเลือกหน่วยบริการแล้ว ให้ skip filter ตามพื้นที่ทิ้ง
        console.log("✅ Service filter passed - skipping location filters");
        return true;
      }

      // ไม่ได้เลือกหน่วยบริการ หรือไม่มีข้อมูล OSM ให้ filter ตามพื้นที่ตามปกติ
      // ใช้ข้อมูลที่อยู่ของ อสม. ในการกรอง (user_location)
      const userLocation = row.user_location;
      console.log("📍 userLocation:", userLocation);

      // ถ้าไม่มี user_location แต่มีการเลือก filter location ให้ skip row นี้
      if (!userLocation && (zone || province || district || subdistrict)) {
        console.log("❌ No user_location but location filters selected");
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
            console.log("🏥 Health Area check:", {
              selected: selectedHealthArea.name_th,
              dataProvince: userLocation.province_name_th,
              match: !!provinceInHealthArea
            });
            if (!provinceInHealthArea) {
              console.log("❌ Failed health area filter - province not in selected health area");
              return false;
            }
          }
        }

        // Filter by province
        if (province) {
          const selectedProvince = provinces.find(p => p.code === province);
          console.log("🏛️ Province check:", {
            selected: selectedProvince?.name_th,
            data: userLocation.province_name_th,
            match: userLocation.province_name_th === selectedProvince?.name_th
          });
          if (selectedProvince && userLocation.province_name_th !== selectedProvince.name_th) {
            console.log("❌ Failed province filter");
            return false;
          }
        }

        // Filter by district
        if (district) {
          const selectedDistrict = districts.find(d => d.code === district);
          console.log("🏙️ District check:", {
            selected: selectedDistrict?.name_th,
            data: userLocation.district_name_th,
            match: userLocation.district_name_th === selectedDistrict?.name_th
          });
          if (selectedDistrict && userLocation.district_name_th !== selectedDistrict.name_th) {
            console.log("❌ Failed district filter");
            return false;
          }
        }

        // Filter by subdistrict
        if (subdistrict) {
          const selectedSubdistrict = subdistricts.find(s => s.code === subdistrict);
          console.log("🏘️ Subdistrict check:", {
            selected: selectedSubdistrict?.name_th,
            data: userLocation.subdistrict_name_th,
            match: userLocation.subdistrict_name_th === selectedSubdistrict?.name_th
          });
          if (selectedSubdistrict && userLocation.subdistrict_name_th !== selectedSubdistrict.name_th) {
            console.log("❌ Failed subdistrict filter");
            return false;
          }
        }

        // Filter by village - เทียบ village ที่เลือกกับข้อมูล user
        // selected village จะเป็น code เช่น "63050111" หรือ village_code
        // user มี village_no ซึ่งอาจเป็นรหัสหมู่บ้าน (เช่น "31011") หรือเลขหมู่ (เช่น "3")
        if (village) {
          const userVillageNo = userLocation.village_no;
          const userVillageCode = userLocation.village_code;

          // หา village object จาก villages array เพื่อเทียบหลายแบบ
          const selectedVillage = villages.find(v =>
            (v.code && String(v.code) === String(village)) ||
            (v.village_code && String(v.village_code) === String(village)) ||
            String(v.village_no) === String(village)
          );

          console.log("🏠 Village check:", {
            selected: village,
            selectedVillageObj: selectedVillage,
            userVillageNo: userVillageNo,
            userVillageCode: userVillageCode
          });

          // เทียบหลายรูปแบบ:
          // 1. เทียบ village_no ของ user กับ selected village code
          // 2. เทียบ village_no ของ user กับ village_no ของ selected village
          // 3. เทียบ village_code ของ user กับ selected village code
          let villageMatch = false;

          if (userVillageNo) {
            // ถ้า userVillageNo ตรงกับ selected village (code หรือ village_no)
            if (String(userVillageNo) === String(village)) {
              villageMatch = true;
            } else if (selectedVillage && String(userVillageNo) === String(selectedVillage.village_no)) {
              villageMatch = true;
            } else if (selectedVillage?.code && String(userVillageNo) === String(selectedVillage.code)) {
              villageMatch = true;
            }
          }

          if (userVillageCode) {
            if (String(userVillageCode) === String(village)) {
              villageMatch = true;
            }
          }

          console.log("🏠 Village match result:", villageMatch);

          if (!villageMatch) {
            console.log("❌ Failed village filter");
            return false;
          }
        }

        // Filter by health service - เทียบ health_service_id ของ user กับ service ที่เลือก
        if (service) {
          const userHealthServiceId = userLocation.health_service_id;
          console.log("🏥 Service check:", {
            selected: service,
            userHealthServiceId: userHealthServiceId,
            match: String(userHealthServiceId) === String(service)
          });
          // เทียบ health_service_id โดยตรง
          if (userHealthServiceId) {
            if (String(userHealthServiceId) !== String(service)) {
              console.log("❌ Failed service filter");
              return false;
            }
          } else {
            // ถ้าไม่มี health_service_id ให้ไม่ผ่าน filter
            console.log("❌ Failed service filter - no health_service_id in user data");
            return false;
          }
        }
      }

      console.log("✅ Row passed all filters");
      return true;
    });

    console.log("\n🎯 Filter Result:", result.length, "rows passed");
    console.log("===== FILTER DEBUG END =====\n");
    return result;
  }, [keyword, year, yearType, month, week, apiData, zone, province, district, subdistrict, village, service, osmDataByService, healthAreas, provinces, districts, subdistricts, villages, healthServices]); // เพิ่ม osmDataByService

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));
  const paginatedRows = useMemo(
    () => filteredRows.slice((page - 1) * itemsPerPage, page * itemsPerPage),
    [filteredRows, itemsPerPage, page]
  );

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  // Note: Reset functionality is handled by usePermissionFilters hook

  // View 3: แสดงหน้ารายละเอียดบ้าน
  if (householdId) {
    const monthLabel =
      MONTHS.find((m) => m.value === month)?.label || "มิถุนายน";
    const weekLabel =
      WEEKS.find((w) => w.value === week)?.label || "สัปดาห์ที่ 1";

    return (
      <ReportMosquitoCompDetailComp
        reportData={{
          year,
          month: monthLabel,
          week: weekLabel,
          name: "รายละเอียดการสำรวจลูกน้ำยุงลาย",
          userId: userId,
          householdId: householdId,
        }}
      />
    );
  }

  // View 2: แสดงรายการบ้านของผู้รับผิดชอบ
  if (userId) {
    return (
      <div className="w-full h-full bg-gradient-to-b from-[#f7f2ff] via-white to-white p-0">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="text-red-800 font-semibold mb-1">เกิดข้อผิดพลาด</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition"
            >
              โหลดใหม่
            </button>
          </div>
        )}

        <button
          onClick={() => router.push("/report-mosquito/data")}
          className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-purple-200 rounded-xl text-[#7e32e2] font-semibold hover:bg-purple-50 transition-all"
        >
          <ArrowLeft size={20} />
          กลับไปหน้ารายชื่อผู้รับผิดชอบ
        </button>

        <div className="relative mb-6 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#7e32e2] via-[#9333ea] to-[#a855f7]" />
          <div className="absolute inset-0 bg-white/5" />
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Home size={28} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">
                      รายการบ้านที่รับผิดชอบ
                    </h1>
                    <p className="text-white/80">
                      ผู้รับผิดชอบ: {selectedUserName}
                    </p>
                  </div>
                </div>
              </div>
            </div>
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
                placeholder="พิมพ์คำค้นหาชื่อบ้าน เลขที่บ้าน หมู่..."
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
                  <th className="py-4 px-4 font-semibold text-center text-white">
                    บ้านเลขที่
                  </th>
                  <th className="py-4 px-4 font-semibold text-center text-white">
                    หมู่
                  </th>
                  <th className="py-4 px-4 font-semibold text-center text-white">
                    วันที่บันทึกล่าสุด
                  </th>
                  <th className="py-4 px-4 font-semibold text-center text-white">
                    จำนวนสมาชิก
                  </th>
                  <th className="py-4 px-4 font-semibold text-center text-white rounded-tr-xl">
                    การทำงาน
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 size={48} className="text-[#7e32e2] animate-spin" />
                        <p className="text-gray-500 font-medium">กำลังโหลดข้อมูล...</p>
                      </div>
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
                      <td className="py-4 px-4 text-center font-medium text-[#231d37]">
                        {row.houseNumber || "-"}
                      </td>
                      <td className="py-4 px-4 text-center font-medium text-[#231d37]">
                        {row.villageNumber || "-"}
                      </td>
                      <td className="py-4 px-4 text-center text-gray-600">
                        {row.date}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                          <Users size={14} />
                          {row.residentCount}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7e32e2] to-[#9333ea] text-white font-semibold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                          onClick={() =>
                            router.push(
                              `/report-mosquito/data?user_id=${userId}&household_id=${row.id}`
                            )
                          }
                        >
                          <Eye size={16} />
                          ดูรายละเอียด
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
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-b from-[#f7f2ff] via-white to-white p-0">
      <DetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        data={filteredRows}
      />

      {/* Error Alert */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="text-red-800 font-semibold mb-1">เกิดข้อผิดพลาด</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition"
          >
            โหลดใหม่
          </button>
        </div>
      )}

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
                    รายชื่อผู้รับผิดชอบ
                  </h1>
                  <p className="text-white/80">
                    รายการผู้รับผิดชอบการสำรวจลูกน้ำยุงลาย
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
            placeholder="-- เลือกประเภทปี --"
            value={yearType}
            onChange={(e) => setYearType(e.target.value)}
            options={YEAR_TYPES}
            icon={Calendar}
          />
          <CustomSelect
            label={yearType === "fiscal" ? "ปี" : "ปี"}
            placeholder="-- เลือกปี --"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            options={YEARS}
            icon={Calendar}
          />
          <CustomSelect
            label="เดือน"
            placeholder="-- เลือกเดือน --"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            options={MONTHS}
            icon={Calendar}
          />
          <CustomSelect
            label="สัปดาห์"
            placeholder={month ? "-- เลือกสัปดาห์ --" : "-- เลือกเดือนก่อน --"}
            value={week}
            onChange={(e) => setWeek(e.target.value)}
            options={WEEKS}
            icon={Calendar}
            disabled={!month}
          />
          <CustomSelect
            label="เขตสุขภาพ"
            placeholder="-- เลือกเขต --"
            value={zone}
            onChange={(e) => handleZoneChange(e.target.value)}
            options={Array.isArray(healthAreas) ? healthAreas.map(h => ({ label: h.name_th, value: h.code })) : []}
            icon={MapPin}
            disabled={isLocked('zone')}
          />
          <CustomSelect
            label="จังหวัด"
            placeholder="-- เลือกจังหวัด --"
            value={province}
            onChange={(e) => handleProvinceChange(e.target.value)}
            options={Array.isArray(provinces) ? provinces.map(p => ({ label: p.name_th, value: p.code })) : []}
            icon={Building2}
            disabled={isLocked('province')}
          />
          <CustomSelect
            label="อำเภอ"
            placeholder="-- เลือกอำเภอ --"
            value={district}
            onChange={(e) => handleDistrictChange(e.target.value)}
            options={Array.isArray(districts) ? districts.map(d => ({ label: d.name_th, value: d.code })) : []}
            icon={Building2}
            disabled={isLocked('district') || isDistrictDisabled}
          />
          <CustomSelect
            label="ตำบล"
            placeholder="-- เลือกตำบล --"
            value={subdistrict}
            onChange={(e) => handleSubdistrictChange(e.target.value)}
            options={Array.isArray(subdistricts) ? subdistricts.map(s => ({ label: s.name_th, value: s.code })) : []}
            icon={Home}
            disabled={isLocked('subdistrict') || isSubdistrictDisabled}
          />
{/* หมู่บ้าน - ยังไม่เปิดใช้งาน เนื่องจากข้อมูลยังไม่พร้อม
          <CustomSelect
            label="หมู่บ้าน"
            placeholder="-- เลือกหมู่บ้าน --"
            value={village}
            onChange={(e) => handleVillageChange(e.target.value)}
            options={Array.isArray(villages) ? [...villages].sort((a, b) => Number(a.village_no) - Number(b.village_no)).map(v => ({ label: `หมู่ ${v.village_no}${v.village_name ? ` - ${v.village_name}` : ''}`, value: v.code || v.village_code || `${subdistrict}${String(v.village_no).padStart(2, '0')}` })) : []}
            icon={Home}
            disabled={!subdistrict}
          />
*/}
          <CustomSelect
            label="หน่วยบริการ"
            placeholder="-- เลือกหน่วยบริการ --"
            value={service}
            onChange={(e) => handleServiceChange(e.target.value)}
            options={Array.isArray(healthServices) ? healthServices.map(h => ({
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
              placeholder="พิมพ์คำค้นหาชื่อผู้รับผิดชอบ วันที่..."
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
                  ชื่อผู้รับผิดชอบ
                </th>
                <th className="py-4 px-4 font-semibold text-center text-white">
                  วันที่บันทึกล่าสุด
                </th>
                <th className="py-4 px-4 font-semibold text-center text-white">
                  จำนวนบ้านที่รับผิดชอบ
                </th>
                <th className="py-4 px-4 font-semibold text-center text-white rounded-tr-xl">
                  การทำงาน
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 size={48} className="text-[#7e32e2] animate-spin" />
                      <p className="text-gray-500 font-medium">กำลังโหลดข้อมูล...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
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
                        <Home size={14} />
                        {row.amount}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7e32e2] to-[#9333ea] text-white font-semibold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                        onClick={() =>
                          router.push(
                            `/report-mosquito/data?user_id=${row.id}`
                          )
                        }
                      >
                        <Eye size={16} />
                        ดูรายละเอียด
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
        />
      </div>
    </div>
  );
};

export default ReportMosquitoCompDataComp;
