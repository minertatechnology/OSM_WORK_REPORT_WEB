import React, { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Search,
  Download,
  ChevronDown,
  Eye,
  EyeOff,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  User,
  BadgeInfo,
  Venus,
  Hospital,
  MapPin,
  Map,
  Landmark,
  Home,
  X,
  RefreshCcw,
  Calendar,
  Building2,
  Users,
  FileText,
  RotateCcw,
  Loader2,
  Mail,
  Droplet,
  GraduationCap,
  Smartphone,
  CalendarCheck,
  CreditCard,
  Phone,
  Wifi,
  Moon,
  Shield,
  HeartPulse,
} from "lucide-react";
import Swal from "sweetalert2";
import CustomSelect from "@services/customSelectService/customSelectService";
import { getUsersList } from "@services/userService/userService";
import { getAuthToken } from "@utils/tokenHelper";
import { getUsersBatch } from "@services/oauth2Service";
import { getOsmByHealthService } from "@services/lookupService";
import { usePermissionFilters } from "@hooks/usePermissionFilters";
import { useUserPermission } from "@context/UserPermissionProvider";
import jsPDF from "jspdf";
import * as XLSX from "xlsx-js-style";
import { font as sarabunFont } from "../../styles/Sarabun-Regular-normal";
import { fontbold as sarabunBoldFont } from "../../styles/Sarabun-Regular-bold";
import { getHealthAreaNameWithFallback } from "@utils/healthZoneHelper";

// Mock data for select options (ลบ ZONES, PROVINCES, DISTRICTS, SUBDISTRICTS เพราะใช้จาก usePermissionFilters แทน)
const PER_PAGE_OPTIONS = [
  { label: "10", value: 10 },
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
];

// Old getPageNumbers removed

// Function to mask CID for PDPA compliance
// Mask last 4 digits (show first 9 digits)
const maskCID = (cid, showFull = false) => {
  if (!cid) return "-";
  const cleanCID = cid.replace(/[^0-9]/g, "");
  if (cleanCID.length !== 13) return cid;

  if (showFull) {
    // Show full CID in standard format
    return `${cleanCID.slice(0, 1)}-${cleanCID.slice(1, 5)}-${cleanCID.slice(
      5,
      10
    )}-${cleanCID.slice(10, 12)}-${cleanCID.slice(12, 13)}`;
  }

  // Mask only last 4 digits (9 digits + XX-XX)
  return `${cleanCID.slice(0, 1)}-${cleanCID.slice(1, 5)}-${cleanCID.slice(
    5,
    9
  )}-XX-XX`;
};

// Modal for user details
function UserDetailModal({
  open,
  onClose,
  onDeactivate,
  onRestore,
  user,
  isRestoreBtn,
}) {
  const [showFullCID, setShowFullCID] = useState(false);

  // Reset CID visibility when modal closes or user changes
  useEffect(() => {
    if (!open) {
      setShowFullCID(false);
    }
  }, [open]);

  if (!open || !user) return null;

  const handleDeactivate = async () => {
    if (confirm("คุณต้องการปิดบัญชีผู้ใช้งานรายนี้จริงหรือไม่?")) {
      onDeactivate && onDeactivate();
    }
  };

  const handleRestore = async () => {
    if (confirm("คุณต้องการกู้คืนบัญชีผู้ใช้งานรายนี้จริงหรือไม่?")) {
      onRestore && onRestore();
    }
  };

  const handleToggleCID = async () => {
    if (!showFullCID) {
      // Show PDPA warning before revealing full ID
      const result = await Swal.fire({
        title: "คำเตือนตามกฎหมาย PDPA",
        html: `
          <div style="text-align: left; padding: 10px;">
            <p style="margin-bottom: 15px; font-weight: 600; color: #7e32e2;">
              ⚠️ พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
            </p>
            <p style="margin-bottom: 12px; line-height: 1.6;">
              การเปิดเผยข้อมูลส่วนบุคคล เช่น <strong>เลขบัตรประจำตัวประชาชน</strong> ต้องมีวัตถุประสงค์ที่ชอบด้วยกฎหมาย และได้รับความยินยอมจากเจ้าของข้อมูล
            </p>
            <p style="margin-bottom: 12px; line-height: 1.6;">
              ผู้ที่เปิดเผยข้อมูลโดยไม่ได้รับอนุญาต อาจต้องรับโทษ:
            </p>
            <ul style="margin-left: 20px; margin-bottom: 15px; line-height: 1.8;">
              <li>ปรับทางแพ่ง สูงสุด <strong>5,000,000 บาท</strong></li>
              <li>จำคุกไม่เกิน <strong>1 ปี</strong> หรือปรับไม่เกิน <strong>1,000,000 บาท</strong> หรือทั้งจำทั้งปรับ</li>
            </ul>
            <p style="line-height: 1.6; color: #dc2626; font-weight: 500;">
              กรุณาใช้ข้อมูลอย่างระมัดระวังและรับผิดชอบ
            </p>
          </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#7e32e2",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "เข้าใจและยอมรับ",
        cancelButtonText: "ยกเลิก",
        customClass: {
          popup: "swal-wide",
          title: "text-xl font-bold",
          htmlContainer: "text-base",
        },
        focusConfirm: false,
      });

      if (result.isConfirmed) {
        setShowFullCID(true);
      }
    } else {
      setShowFullCID(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#ece1f7] max-w-2xl w-full p-7 relative">
        <div className="text-[22px] font-bold text-[#7e32e2] mb-4">
          รายละเอียดผู้ใช้งาน
        </div>

        {/* Personal Information Section */}
        <div className="mb-6">
          <h3 className="text-[18px] font-semibold text-[#7e32e2] mb-3 border-b border-purple-200 pb-2">
            ข้อมูลส่วนตัว
          </h3>
          <div className="grid grid-cols-2 gap-y-3 gap-x-8">
            <div>
              <div className="flex items-center gap-2 mb-1 text-[#7e32e2] font-medium text-[15px]">
                <User size={16} />
                ชื่อ-นามสกุล
              </div>
              <div className="ml-6 text-[#231d37] text-[15px]">
                {user.name}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 text-[#7e32e2] font-medium text-[15px]">
                <BadgeInfo size={16} />
                เลขประจำตัวประชาชน
              </div>
              <div className="ml-6 text-[#231d37] text-[15px]">
                <div className="flex items-center gap-2">
                  <span className="font-mono">
                    {maskCID(user.cid, showFullCID)}
                  </span>
                  <button
                    onClick={handleToggleCID}
                    className="text-purple-600 hover:text-purple-800 transition-colors p-1 hover:bg-purple-50 rounded"
                    title={showFullCID ? "ซ่อนเลขบัตรประชาชน" : "แสดงเลขบัตรประชาชน"}
                  >
                    {showFullCID ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 text-[#7e32e2] font-medium text-[15px]">
                <Venus size={16} />
                เพศ
              </div>
              <div className="ml-6 text-[#231d37] text-[15px]">
                {user.gender}
              </div>
            </div>
            {user.phone && (
              <div>
                <div className="flex items-center gap-2 mb-1 text-[#7e32e2] font-medium text-[15px]">
                  <Phone size={16} />
                  เบอร์โทรศัพท์
                </div>
                <div className="ml-6 text-[#231d37] text-[15px]">
                  {user.phone}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Work Information Section */}
        <div className="mb-6">
          <h3 className="text-[18px] font-semibold text-[#7e32e2] mb-3 border-b border-purple-200 pb-2">
            ข้อมูลการทำงาน
          </h3>
          <div className="grid grid-cols-2 gap-y-3 gap-x-8">
            <div>
              <div className="flex items-center gap-2 mb-1 text-[#7e32e2] font-medium text-[15px]">
                <MapPin size={16} />
                ระดับตำแหน่ง
              </div>
              <div className="ml-6 text-[#231d37] text-[15px]">
                {user.position}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 text-[#7e32e2] font-medium text-[15px]">
                <Hospital size={16} />
                สังกัดปัจจุบัน
              </div>
              <div className="ml-6 text-[#231d37] text-[15px]">
                {user.hospital}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 text-[#7e32e2] font-medium text-[15px]">
                <Map size={16} />
                จังหวัด
              </div>
              <div className="ml-6 text-[#231d37] text-[15px]">
                {user.province}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 text-[#7e32e2] font-medium text-[15px]">
                <Landmark size={16} />
                อำเภอ
              </div>
              <div className="ml-6 text-[#231d37] text-[15px]">
                {user.district}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 text-[#7e32e2] font-medium text-[15px]">
                <Home size={16} />
                ตำบล
              </div>
              <div className="ml-6 text-[#231d37] text-[15px]">
                {user.subdistrict}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-3">
          {/* {isRestoreBtn ? (
            <button
              className="px-6 py-3 rounded-xl bg-[#21c978] text-white text-[17px] font-semibold shadow hover:bg-[#169e5f] transition"
              onClick={handleRestore}
            >
              กู้คืนบัญชี
            </button>
          ) : (
            <button
              className="px-6 py-3 rounded-xl bg-[#e74c3c] text-white text-[17px] font-semibold shadow hover:bg-[#c0392b] transition"
              onClick={handleDeactivate}
            >
              ปิดบัญชี
            </button>
          )} */}
          {/* <button
            className="px-6 py-3 rounded-xl border border-[#7e32e2] text-[#7e32e2] text-[17px] font-semibold shadow bg-white hover:bg-[#f6eeff] transition"
            onClick={onClose}
          >
            ปิด
          </button> */}
        </div>
        <button
          className="absolute top-4 right-4 text-[#aaa] hover:text-[#e74c3c] transition"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={22} />
        </button>
      </div>
    </div>
  );
}

// Export PDF function - แสดงเฉพาะคอลัมน์ที่แสดงในตาราง
function exportUserListPDF(data) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // เพิ่มฟอนต์ไทย Sarabun
  doc.addFileToVFS("Sarabun-Regular.ttf", sarabunFont);
  doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
  doc.addFileToVFS("Sarabun-Bold.ttf", sarabunBoldFont);
  doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
  doc.setFont("Sarabun");

  // ตั้งค่าตาราง
  const startX = 10; // ขยับไปทางซ้าย
  const rowHeight = 10;
  const colWidths = [15, 85, 55, 40]; // ลำดับ, ชื่อ-นามสกุล, เลขประจำตัวประชาชน, ระดับตำแหน่ง
  const headers = ["ลำดับ", "ชื่อ-นามสกุล", "เลขประจำตัวประชาชน", "ระดับตำแหน่ง"];
  const rowsPerPage = 20; // แบ่งหน้าทุก 20 รายการ

  // ฟังก์ชันวาดหัวเอกสารและ header ตาราง
  const drawPageHeader = (pageNum, totalPages) => {
    // หัวเอกสาร
    doc.setFontSize(18);
    doc.setFont("Sarabun", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("รายชื่อผู้ใช้งานแอปพลิเคชัน", 105, 20, { align: "center" });
    doc.setFontSize(11);
    doc.setFont("Sarabun", "normal");
    doc.text(`วันที่ส่งออก: ${new Date().toLocaleDateString("th-TH")}`, 105, 28, { align: "center" });
    doc.text(`จำนวนทั้งหมด: ${data.length} รายการ`, 105, 35, { align: "center" });

    // วาด header ตาราง
    let xPos = startX;
    const headerY = 45;
    doc.setDrawColor(0, 0, 0); // เส้นขอบสีดำ
    doc.setLineWidth(0.3);

    headers.forEach((header, i) => {
      doc.rect(xPos, headerY, colWidths[i], rowHeight, "S"); // แค่เส้นขอบ ไม่มีพื้นหลัง
      doc.setFont("Sarabun", "normal");
      doc.setFontSize(11); // ขนาดเท่ากับข้อมูล
      doc.setTextColor(0, 0, 0); // สีดำ
      doc.text(header, xPos + colWidths[i] / 2, headerY + 7, { align: "center" });
      xPos += colWidths[i];
    });

    return headerY + rowHeight; // คืนค่า Y position สำหรับแถวถัดไป
  };

  // คำนวณจำนวนหน้าทั้งหมด
  const totalPages = Math.ceil(data.length / rowsPerPage);

  // วาดหน้าแรก
  let currentPage = 1;
  let yPos = drawPageHeader(currentPage, totalPages);
  let rowCountOnPage = 0;

  data.forEach((row, idx) => {
    // ถ้าครบ 20 รายการ ให้ขึ้นหน้าใหม่
    if (rowCountOnPage >= rowsPerPage) {
      doc.addPage();
      currentPage++;
      yPos = drawPageHeader(currentPage, totalPages);
      rowCountOnPage = 0;
    }

    let xPos = startX;

    // Mask CID สำหรับ export (ปกป้องข้อมูลส่วนบุคคล)
    const maskedCid = maskCID(row.cid, false);

    const rowData = [
      String(idx + 1),
      row.name || "-",
      maskedCid,
      row.position || "-",
    ];

    doc.setFont("Sarabun", "normal");
    doc.setFontSize(10);

    rowData.forEach((text, i) => {
      // วาดเส้นขอบสีดำ ไม่มีพื้นหลัง
      doc.setDrawColor(0, 0, 0);
      doc.rect(xPos, yPos, colWidths[i], rowHeight, "S");

      // ตั้งสีข้อความเป็นสีดำ
      doc.setTextColor(0, 0, 0);

      // ตัดข้อความถ้ายาวเกินไป
      const maxWidth = colWidths[i] - 4;
      let displayText = text;
      if (doc.getTextWidth(text) > maxWidth) {
        while (doc.getTextWidth(displayText + "...") > maxWidth && displayText.length > 0) {
          displayText = displayText.slice(0, -1);
        }
        displayText += "...";
      }

      if (i === 0 || i === 2 || i === 3) {
        // Center align: ลำดับ, เลขประจำตัวประชาชน, ระดับตำแหน่ง
        doc.text(displayText, xPos + colWidths[i] / 2, yPos + 7, { align: "center" });
      } else {
        // Left align: ชื่อ-นามสกุล
        doc.text(displayText, xPos + 2, yPos + 7);
      }
      xPos += colWidths[i];
    });

    yPos += rowHeight;
    rowCountOnPage++;
  });

  // Save PDF - Format: User_{DD-MM-YYYY}.pdf
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const dateStr = `${day}-${month}-${year}`;
  doc.save(`User_${dateStr}.pdf`);
}

// Export Excel function - ใช้ xlsx library สำหรับสร้างไฟล์ Excel ที่ถูกต้อง
function exportUserListExcel(data) {
  // สร้าง worksheet data
  const wsData = [
    ["ลำดับ", "ชื่อ-นามสกุล", "เลขประจำตัวประชาชน", "ระดับตำแหน่ง"],
  ];

  data.forEach((row, idx) => {
    const maskedCid = maskCID(row.cid, false);
    wsData.push([
      idx + 1,
      row.name || "-",
      maskedCid,
      row.position || "-",
    ]);
  });

  // สร้าง workbook และ worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // ตั้งค่าความกว้างคอลัมน์
  ws["!cols"] = [
    { wch: 8 },   // ลำดับ
    { wch: 30 },  // ชื่อ-นามสกุล
    { wch: 20 },  // เลขประจำตัวประชาชน
    { wch: 20 },  // ระดับตำแหน่ง
  ];

  // กำหนด style สำหรับ borders
  const borderStyle = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  };

  // Header style - พื้นหลังสีม่วงอ่อน ตัวหนา
  const headerStyle = {
    border: borderStyle,
    fill: { fgColor: { rgb: "E8D5F9" } },
    font: { bold: true, sz: 11 },
    alignment: { horizontal: "center", vertical: "center" },
  };

  // Data cell style - มี borders
  const dataStyle = {
    border: borderStyle,
    alignment: { vertical: "center" },
  };

  // Data cell style สำหรับคอลัมน์ที่ต้องง center
  const dataCenterStyle = {
    border: borderStyle,
    alignment: { horizontal: "center", vertical: "center" },
  };

  // ใส่ style ให้ทุก cell
  const range = XLSX.utils.decode_range(ws["!ref"]);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellAddress]) continue;

      if (R === 0) {
        // Header row
        ws[cellAddress].s = headerStyle;
      } else {
        // Data rows - คอลัมน์ 0, 2, 3 center, คอลัมน์ 1 left
        if (C === 1) {
          ws[cellAddress].s = dataStyle;
        } else {
          ws[cellAddress].s = dataCenterStyle;
        }
      }
    }
  }

  // เพิ่ม worksheet เข้า workbook
  XLSX.utils.book_append_sheet(wb, ws, "รายชื่อผู้ใช้งาน");

  // บันทึกไฟล์ Excel - Format: User_{DD-MM-YYYY}.xlsx
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const dateStr = `${day}-${month}-${year}`;
  XLSX.writeFile(wb, `User_${dateStr}.xlsx`);
}

// Download Modal
function DownloadModal({ open, onClose, totalItems, filters, filteredUsers }) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  // ใช้ filteredUsers ที่ส่งมาจากหน้าหลักแทนการดึงข้อมูลใหม่
  // เพราะการกรองใน Frontend และ API ให้ผลลัพธ์ต่างกัน
  const prepareDataForExport = () => {
    if (!filteredUsers || filteredUsers.length === 0) {
      return [];
    }

    return filteredUsers.map(user => ({
      name: user.name || "ไม่ระบุชื่อ",
      cid: user.cid || "-",
      position: user.position || "ไม่ระบุตำแหน่ง",
      status: user.status || "active",
    }));
  };

  const handleExportPDF = async () => {
    if (totalItems === 0) {
      Swal.fire({
        icon: "warning",
        title: "ไม่มีข้อมูล",
        text: "ไม่มีข้อมูลสำหรับดาวน์โหลด",
        confirmButtonColor: "#7e32e2",
      });
      return;
    }

    setLoading(true);
    try {
      Swal.fire({
        title: "กำลังเตรียมข้อมูล...",
        text: `กำลังดึงข้อมูลทั้งหมด ${totalItems} รายการ`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // ใช้ filteredUsers ที่ส่งมาจากหน้าหลักแทนการเรียก API
      const allUsers = prepareDataForExport();
      Swal.close();
      exportUserListPDF(allUsers);
    } catch (error) {
      console.error("Export PDF error:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถดึงข้อมูลสำหรับดาวน์โหลดได้",
        confirmButtonColor: "#7e32e2",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (totalItems === 0) {
      Swal.fire({
        icon: "warning",
        title: "ไม่มีข้อมูล",
        text: "ไม่มีข้อมูลสำหรับดาวน์โหลด",
        confirmButtonColor: "#7e32e2",
      });
      return;
    }

    setLoading(true);
    try {
      Swal.fire({
        title: "กำลังเตรียมข้อมูล...",
        text: `กำลังดึงข้อมูลทั้งหมด ${totalItems} รายการ`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // ใช้ filteredUsers ที่ส่งมาจากหน้าหลักแทนการเรียก API
      const allUsers = prepareDataForExport();
      Swal.close();
      exportUserListExcel(allUsers);
    } catch (error) {
      console.error("Export Excel error:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถดึงข้อมูลสำหรับดาวน์โหลดได้",
        confirmButtonColor: "#7e32e2",
      });
    } finally {
      setLoading(false);
    }
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
              รายชื่อผู้ใช้งาน ({totalItems} รายการ)
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportPDF}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-white text-[#d32f2f] font-semibold text-[15px] shadow-sm hover:bg-red-50 hover:border-red-300 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
                onClick={handleExportExcel}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-green-200 bg-white text-[#388e3c] font-semibold text-[15px] shadow-sm hover:bg-green-50 hover:border-green-300 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
            disabled={loading}
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

// Pagination component
function Pagination({
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
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

const UserListComp = () => {
  // Use permission-based filters
  const { isLocked, isCountryLevel, getInitialFilters, user: currentUser, scope, lockLevel, loading: permissionLoading } = useUserPermission();
  const {
    zone,
    province,
    district,
    subdistrict,
    service,
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
    handleReset: resetFilters,
  } = usePermissionFilters({
    defaultYear: String(new Date().getFullYear() + 543),
    defaultYearType: "fiscal",
  });

  const [keyword, setKeyword] = useState("");
  const [tab, setTab] = useState("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState("detail");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(null); // สำหรับแสดง progress กรณีดึงข้อมูลเยอะๆ
  const [osmDataByService, setOsmDataByService] = useState([]); // เก็บ OSM ตามหน่วยบริการ

  // CID visibility state - track which rows show full CID
  const [cidVisibility, setCidVisibility] = useState({});

  // ✅ Prevent multiple API calls on initial mount
  const isFetching = useRef(false);
  const prevFiltersRef = useRef({ zone: '', province: '', district: '', subdistrict: '', service: '' });


  // Fetch users from API
  useEffect(() => {
    // ✅ รอให้ permission loading เสร็จก่อน
    if (permissionLoading) {
      return;
    }

    // ✅ สำหรับ non-country level: รอให้ locked filters ถูก set ก่อน
    // เช็คว่าถ้า lockLevel เป็น province ต้องมี province value, เป็น district ต้องมี district value, etc.
    const requiredFilterReady = (() => {
      if (lockLevel === 'none' || lockLevel === 'zone') return true; // zone level ต้องการแค่ zone ซึ่ง set เร็ว
      if (lockLevel === 'province') return province !== '' || !isLocked('province');
      if (lockLevel === 'district') return district !== '' || !isLocked('district');
      if (lockLevel === 'subdistrict') return subdistrict !== '' || !isLocked('subdistrict');
      if (lockLevel === 'service') return service !== '' || !isLocked('service');
      return true;
    })();

    if (!requiredFilterReady) {
      console.log('⏳ Waiting for locked filters to be set...', { lockLevel, zone, province, district, subdistrict, service });
      return;
    }

    // ✅ ป้องกันการ fetch ซ้ำเมื่อ filter ไม่ได้เปลี่ยน (รอบแรกต้องยิง)
    const currentFilters = { zone, province, district, subdistrict, service, tab };
    const filtersChanged = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(currentFilters);

    if (isFetching.current && !filtersChanged) {
      return;
    }

    prevFiltersRef.current = currentFilters;

    const fetchUsers = async () => {
      isFetching.current = true;
      setLoading(true);
      try {
        // Get token from auth helper
        const token = getAuthToken();

        if (!token) {
          throw new Error("No authentication token found. Please login again.");
        }

        // ดึงข้อมูล OSM ตามหน่วยบริการ (ถ้าเลือก)
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

        // ดึงข้อมูลทั้งหมดเพื่อกรองใน frontend (ทุกสิทธิ์ต้องกรองเหมือนกัน)
        const shouldFetchAll = true;

        let allUsers = [];
        let allUserCount = 0;
        let allExternalUserIds = []; // เก็บ IDs ทั้งหมดก่อน
        let batchUsersMap = {};

        if (shouldFetchAll) {
          // ดึงข้อมูลทีละ 100 รายการ จนกว่าจะครบ (จำกัดสูงสุด 10,000 รายการ)
          let page = 1;
          const perPage = 100;
          const maxPages = 100; // จำกัดสูงสุด 10,000 รายการ
          let hasMore = true;

          // ✅ ดึง initial filters จาก permission (สำหรับ locked values)
          const initialFilters = getInitialFilters();

          // ✅ กำหนด filter parameters - priority: user selection > permission locked
          const filterProvince = province || initialFilters.province || "";
          const filterDistrict = district || initialFilters.district || "";
          const filterSubdistrict = subdistrict || initialFilters.subdistrict || "";
          const filterService = service || initialFilters.service || "";
          const filterZone = zone || initialFilters.zone || "";

          console.log("🔍 API Filter Parameters:", {
            zone: filterZone,
            province: filterProvince,
            district: filterDistrict,
            subdistrict: filterSubdistrict,
            service: filterService,
          });

          while (hasMore && page <= maxPages) {
            // อัพเดท progress
            setLoadingProgress({ page, total: allUserCount });

            // ✅ ส่ง filter parameters ไป API (กรองที่ API แทน frontend)
            const response = await getUsersList({
              page: page,
              per_page: perPage,
              keyword: keyword || undefined, // ✅ ส่ง keyword ไป API
              is_active: tab === "active" ? true : false,
              // ✅ ส่ง filter parameters ไป API
              province_code: filterProvince || undefined,
              district_code: filterDistrict || undefined,
              subdistrict_code: filterSubdistrict || undefined,
              health_service_code: filterService || undefined,
              health_area_id: filterZone || undefined, // ✅ ส่ง zone (HA1-HA13)
              token: token
            });

            allUsers = [...allUsers, ...response.users];
            allUserCount = response.total;

            // เก็บ external_user_ids ไว้ยิง batch API ทีเดียวทีหลัง
            const pageExternalIds = response.users
              .map(user => user.external_user_id)
              .filter(id => id);
            allExternalUserIds = [...allExternalUserIds, ...pageExternalIds];

            // เช็คว่ายังมีข้อมูลอีกไหม
            if (response.users.length < perPage || allUsers.length >= response.total) {
              hasMore = false;
            } else {
              page++;
            }
          }

          setLoadingProgress(null); // เคลียร์ progress เมื่อโหลดเสร็จ

          // ยิง batch API ครั้งเดียวด้วย IDs ทั้งหมด
          if (allExternalUserIds.length > 0) {
            batchUsersMap = await getUsersBatch(allExternalUserIds);
          }
        }

        // 4. รวมข้อมูลจาก user list และ batch OAuth2
        const usersWithDetails = allUsers.map(user => {
          if (!user.external_user_id) {
            // ถ้าไม่มี external_user_id ให้ใช้ข้อมูล base
            return {
              external_user_id: user.external_user_id,
              name: "ไม่ระบุชื่อ",
              cid: user.citizen_id || "-",
              position: "ไม่ระบุตำแหน่ง",
              gender: "-",
              hospital: "-",
              province: user.province_name || "-",
              district: user.district_name || "-",
              subdistrict: user.subdistrict_name || "-",
              // Health Area: คำนวณจาก province_name ถ้าเป็นไปได้
              health_area_name_th: getHealthAreaNameWithFallback({ province_name_th: user.province_name }) || "-",
              status: user.is_active ? "active" : "deleted",
              email: user.email,
              phone: user.phone || "-",
              last_active_at: user.last_active_at, // เพิ่ม last_active_at
            };
          }

          // ดึงข้อมูลจาก batch results
          const oauthData = batchUsersMap[user.external_user_id];

          // Helper function to safely get value with fallback
          const getWithFallback = (oauthVal, userVal, defaultVal = "-") => {
            return oauthVal || userVal || defaultVal;
          };

          // ถ้าไม่มีข้อมูลจาก batch API ให้ fallback ไปใช้ข้อมูลจาก user API
          if (!oauthData) {
            const prefix = user.prefix || "";
            const firstName = user.first_name || "";
            const lastName = user.last_name || "";
            const fullName = `${prefix} ${firstName} ${lastName}`.trim() || "ไม่ระบุชื่อ";

            const rawGender = user.gender;
            const gender = rawGender === "male" ? "ชาย" :
                          rawGender === "female" ? "หญิง" :
                          rawGender || "-";

            return {
              external_user_id: user.external_user_id,
              name: fullName,
              cid: user.citizen_id || "-",
              position: user.user_type || "ไม่ระบุตำแหน่ง",
              gender: gender,
              hospital: user.hospital || "-",
              province: user.province_name || "-",
              district: user.district_name || "-",
              subdistrict: user.subdistrict_name || "-",
              // Health Area: คำนวณจาก province_name ถ้าเป็นไปได้
              health_area_name_th: getHealthAreaNameWithFallback({ province_name_th: user.province_name }) || "-",
              status: user.is_active ? "active" : "deleted",
              email: user.email,
              phone: user.phone || "-",
              last_active_at: user.last_active_at, // สำหรับ online status
              prefix: prefix,
              first_name: firstName,
              last_name: lastName,
            };
          }

          // สร้างชื่อเต็ม จาก OAuth2 (ใช้ prefix_name_th แทน prefix)
          const prefix = oauthData?.prefix_name_th || user.prefix || "";
          const firstName = oauthData?.first_name || user.first_name || "";
          const lastName = oauthData?.last_name || user.last_name || "";
          const fullName = `${prefix} ${firstName} ${lastName}`.trim() || "ไม่ระบุชื่อ";

          // แปลง gender
          const rawGender = oauthData?.gender || user.gender;
          const gender = rawGender === "male" ? "ชาย" :
                        rawGender === "female" ? "หญิง" :
                        rawGender || "-";

          // แปลง marital_status
          const rawMaritalStatus = oauthData?.marital_status;
          const maritalStatus = rawMaritalStatus === "single" ? "โสด" :
                               rawMaritalStatus === "married" ? "สมรส" :
                               rawMaritalStatus === "divorced" ? "หย่าร้าง" :
                               rawMaritalStatus === "widowed" ? "หม้าย" :
                               rawMaritalStatus || "-";

          // แปลง volunteer_status
          const rawVolunteerStatus = oauthData?.volunteer_status;
          const volunteerStatus = rawVolunteerStatus === "already_volunteer" ? "เป็น อสม. แล้ว" :
                                 rawVolunteerStatus === "want_to_be_volunteer" ? "ต้องการเป็น อสม." :
                                 rawVolunteerStatus === "not_volunteer" ? "ไม่เป็น อสม." :
                                 rawVolunteerStatus || "-";

          // Merge ข้อมูลจาก 2 sources โดยให้ OAuth2 เป็น priority
          return {
            // Base user data
            external_user_id: user.external_user_id,
            email: getWithFallback(oauthData?.email, user.email),
            is_active: user.is_active,
            osm_code: user.osm_code,
            last_login: user.last_login,
            last_active_at: user.last_active_at, // สำหรับ online status
            created_at: user.created_at,

            // Personal info (OAuth2 เป็น priority, fallback ไป user API)
            name: fullName,
            cid: getWithFallback(oauthData?.citizen_id, user.citizen_id),
            position: oauthData?.position_level || getWithFallback(oauthData?.permission_level, user.user_type, "ไม่ระบุตำแหน่ง"),
            gender: gender,
            hospital: getWithFallback(oauthData?.health_service_name_th, user.hospital),
            phone: getWithFallback(oauthData?.phone, user.phone),

            // Location data - prefer OAuth2 with Thai names
            province: oauthData?.province_name_th || user.province_name || "-",
            district: oauthData?.district_name_th || user.district_name || "-",
            subdistrict: oauthData?.subdistrict_name_th || user.subdistrict_name || "-",
            // Health Area: ใช้ค่าจาก OAuth2 หรือคำนวณจาก lookup ถ้าไม่มี
            health_area_name_th: getHealthAreaNameWithFallback(oauthData) || "-",

            // Status
            status: user.is_active ? "active" : "deleted",

            // Keep original fields
            prefix: prefix,
            prefix_name_th: oauthData?.prefix_name_th,
            prefix_id: oauthData?.prefix_id,
            first_name: firstName,
            last_name: lastName,

            // NEW: Demographics from OAuth2
            birth_date: oauthData?.birth_date,
            marital_status: maritalStatus,
            number_of_children: oauthData?.number_of_children,
            blood_type: oauthData?.blood_type,
            osm_year: oauthData?.osm_year,

            // NEW: Occupation & Education
            occupation_id: oauthData?.occupation_id,
            occupation_name_th: oauthData?.occupation_name_th,
            education_id: oauthData?.education_id,
            education_name_th: oauthData?.education_name_th,

            // NEW: Health Service & Bank
            health_service_id: oauthData?.health_service_id,
            health_service_name_th: oauthData?.health_service_name_th,
            bank_id: oauthData?.bank_id,
            bank_name_th: oauthData?.bank_name_th,
            bank_account_number: oauthData?.bank_account_number,

            // NEW: Volunteer & Device Status
            volunteer_status: volunteerStatus,
            rawVolunteerStatus: rawVolunteerStatus, // เก็บค่าดิบไว้ใช้กรอง
            is_smartphone_owner: oauthData?.is_smartphone_owner,

            // NEW: Detailed Address
            address_number: oauthData?.address_number,
            alley: oauthData?.alley,
            street: oauthData?.street,
            village_no: oauthData?.village_no,
            village_name: oauthData?.village_name,
            village_code: oauthData?.village_code,
            province_id: oauthData?.province_id,
            district_id: oauthData?.district_id,
            subdistrict_id: oauthData?.subdistrict_id,
            postal_code: oauthData?.postal_code,

            // NEW: Approval Status
            approval_status: oauthData?.approval_status,
            approval_by: oauthData?.approval_by,
            approval_date: oauthData?.approval_date,

            // NEW: Created/Updated Info
            created_by: oauthData?.created_by,
            created_by_name: oauthData?.created_by_name,
            created_by_position_name: oauthData?.created_by_position_name,
            created_by_scope_level: oauthData?.created_by_scope_level,
            created_by_scope_label: oauthData?.created_by_scope_label,
            updated_by: oauthData?.updated_by,
            updated_by_name: oauthData?.updated_by_name,
            updated_by_position_name: oauthData?.updated_by_position_name,
            updated_by_scope_level: oauthData?.updated_by_scope_level,
            updated_by_scope_label: oauthData?.updated_by_scope_label,
            updated_at: oauthData?.updated_at,

            // NEW: Related Data Objects
            spouse: oauthData?.spouse,
            children: oauthData?.children,
            official_positions: oauthData?.official_positions,
            special_skills: oauthData?.special_skills,
            club_positions: oauthData?.club_positions,
            trainings: oauthData?.trainings,

            // Health data จาก OAuth2
            chronic_diseases: oauthData?.chronic_diseases,
            drug_allergies: oauthData?.drug_allergies,
            food_allergies: oauthData?.food_allergies,
            blood_pressure_systolic: oauthData?.blood_pressure_systolic,
            blood_pressure_diastolic: oauthData?.blood_pressure_diastolic,
            weight: oauthData?.weight,
            height: oauthData?.height,
            bmi: oauthData?.bmi,
            waist: oauthData?.waist,

            // Additional OAuth2 fields
            family_history_cancer: oauthData?.family_history_cancer,
            family_history_diabetes: oauthData?.family_history_diabetes,
            family_history_hypertension: oauthData?.family_history_hypertension,
            family_history_cvd: oauthData?.family_history_cvd,
            family_history_stroke: oauthData?.family_history_stroke,
            bse_result: oauthData?.bse_result,
            cv_risk_score: oauthData?.cv_risk_score,
            stress_level: oauthData?.stress_level,
            depression_2q: oauthData?.depression_2q,
            fasting_blood_sugar: oauthData?.fasting_blood_sugar,
            stool_result: oauthData?.stool_result,
            fit_result: oauthData?.fit_result,
            hpv_result: oauthData?.hpv_result,
            living_with_care: oauthData?.living_with_care,
            house_safety: oauthData?.house_safety,
            income_sufficiency: oauthData?.income_sufficiency,
            time_up_go_test: oauthData?.time_up_go_test,
            fall_history_6m: oauthData?.fall_history_6m,
            swallow_problem_3m: oauthData?.swallow_problem_3m,
            vision_problem: oauthData?.vision_problem,
            hearing_status: oauthData?.hearing_status,
            depression_2w: oauthData?.depression_2w,
            urinary_incontinence: oauthData?.urinary_incontinence,
            adl_status: oauthData?.adl_status,
            oral_chewing_difficulty: oauthData?.oral_chewing_difficulty,
            oral_pain: oauthData?.oral_pain,
            cognitive_status: oauthData?.cognitive_status,
            latitude: oauthData?.latitude,
            longitude: oauthData?.longitude,
          };
        });

        // ✅ กรองที่ API แล้ว - ไม่ต้องกรองซ้ำใน frontend
        // เซ็ต users จาก API response โดยตรง
        setUsers(usersWithDetails);
      } catch (error) {
        console.error("Error fetching users:", error);

        // Clear users on error
        setUsers([]);

        // Show appropriate error message
        let errorMessage = "ไม่สามารถดึงข้อมูลผู้ใช้งานได้ กรุณาลองใหม่อีกครั้ง";

        if (error.message.includes("authentication token")) {
          errorMessage = "ไม่พบ Token กรุณาเข้าสู่ระบบใหม่อีกครั้ง";
        } else if (error.message.includes("403")) {
          errorMessage = "คุณไม่มีสิทธิ์ในการเข้าถึงข้อมูลนี้";
        }

        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: errorMessage,
          confirmButtonColor: "#7e32e2"
        });
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    };

    fetchUsers();
  }, [itemsPerPage, tab, zone, province, district, subdistrict, service, isCountryLevel, permissionLoading, lockLevel, isLocked]);

  // Auto-refresh online status ทุก 30 วินาที
  const [, forceUpdate] = useState({});
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render เพื่ออัพเดทการคำนวณ online/offline status
      forceUpdate({});
    }, 30 * 1000); // 30 วินาที

    return () => clearInterval(interval);
  }, []);

  // Helper function to check if user is online
  const isUserOnline = (user) => {
    if (user.status !== "active") return false;
    const lastActiveAt = user.last_active_at ? new Date(user.last_active_at) : null;
    if (!lastActiveAt) return false;
    const now = new Date();
    const minutesSinceActive = (now.getTime() - lastActiveAt.getTime()) / (1000 * 60);
    return minutesSinceActive <= 5;
  };

  // กรองผู้ใช้และทำ frontend pagination
  const { displayUsers, filteredUsers, filteredTotalItems, filteredTotalPages, statistics } = useMemo(() => {
    let filtered = users;

    if (!isCountryLevel()) {
      // สิทธิ์อื่นๆ: แสดงทุกคนยกเว้น "เจ้าหน้าที่" และ "ไม่ระบุชื่อ"
      filtered = filtered.filter(user => {
        return user.position !== "เจ้าหน้าที่" && user.name !== "ไม่ระบุชื่อ";
      });
    }

    // กรองด้วย keyword (ชื่อหรือเลขประจำตัวประชาชน)
    if (keyword && keyword.trim()) {
      const searchTerm = keyword.trim();
      const searchTermNoSpace = searchTerm.replace(/\s/g, ""); // เอา space ออก
      filtered = filtered.filter(user => {
        // ค้นหาด้วยชื่อเต็ม (ไม่สนใจ space)
        const fullNameNoSpace = (user.name || "").replace(/\s/g, "");
        const nameMatch = fullNameNoSpace.includes(searchTermNoSpace) ||
                         (user.name && user.name.includes(searchTerm));

        // ค้นหาด้วยชื่อจริง
        const firstNameMatch = user.first_name &&
          (user.first_name.includes(searchTerm) || user.first_name.replace(/\s/g, "").includes(searchTermNoSpace));

        // ค้นหาด้วยนามสกุล
        const lastNameMatch = user.last_name &&
          (user.last_name.includes(searchTerm) || user.last_name.replace(/\s/g, "").includes(searchTermNoSpace));

        // ค้นหาด้วยเลขประจำตัวประชาชน (ทั้งแบบมีขีดและไม่มีขีด)
        const cidRaw = (user.cid || "").replace(/[^0-9]/g, ""); // เอาเฉพาะตัวเลข
        const searchRaw = searchTerm.replace(/[^0-9]/g, ""); // เอาเฉพาะตัวเลขจากคำค้นหา
        const cidMatch = searchRaw && cidRaw.includes(searchRaw);

        return nameMatch || firstNameMatch || lastNameMatch || cidMatch;
      });
    }

    // คำนวณสถิติจาก filtered users ทั้งหมด (ก่อนกรอง online)
    // Officers = เจ้าหน้าที่ (position contains "เจ้าหน้าที่" or permission_level is officer-type)
    // OSM = อสม. (not officer)
    const stats = {
      total: filtered.length,
      online: filtered.filter(user => isUserOnline(user)).length,
      offline: filtered.filter(user => user.status === "active" && !isUserOnline(user)).length,
      officers: filtered.filter(user => {
        const pos = (user.position || "").toLowerCase();
        return pos.includes("เจ้าหน้าที่") || pos.includes("officer") || user.permission_level === "officer";
      }).length,
      osm: filtered.filter(user => {
        const pos = (user.position || "").toLowerCase();
        const isOfficer = pos.includes("เจ้าหน้าที่") || pos.includes("officer") || user.permission_level === "officer";
        // OSM = not officer (includes unknown names)
        return !isOfficer;
      }).length,
      // OSM กรุงเทพ (province_id === "10" และไม่ใช่ officer)
      osmBangkok: filtered.filter(user => {
        const pos = (user.position || "").toLowerCase();
        const isOfficer = pos.includes("เจ้าหน้าที่") || pos.includes("officer") || user.permission_level === "officer";
        const isBangkok = String(user.province_id || "") === "10";
        return !isOfficer && isBangkok;
      }).length,
    };

    // กรองเฉพาะ online สำหรับแสดงในตาราง
    filtered = filtered.filter(user => isUserOnline(user));

    // Frontend pagination: slice ตาม currentPage และ itemsPerPage
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUsers = filtered.slice(startIndex, endIndex);

    const filteredPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    return { displayUsers: paginatedUsers, filteredUsers: filtered, filteredTotalItems: filtered.length, filteredTotalPages: filteredPages, statistics: stats };
  }, [users, isCountryLevel, currentPage, itemsPerPage, keyword]);

  const handleRestoreUser = () => {
    if (!selectedUser) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.cid === selectedUser.cid ? { ...u, status: "active" } : u
      )
    );
    setModalOpen(false);
  };

  const handleDeactivateUser = () => {
    if (!selectedUser) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.cid === selectedUser.cid ? { ...u, status: "deleted" } : u
      )
    );
    setModalOpen(false);
  };

  // Toggle CID visibility with PDPA warning
  const handleToggleCID = async (userCid) => {
    const isCurrentlyVisible = cidVisibility[userCid];

    if (!isCurrentlyVisible) {
      // Show PDPA warning before revealing full ID
      const result = await Swal.fire({
        title: "คำเตือนตามกฎหมาย PDPA",
        html: `
          <div style="text-align: left; padding: 10px;">
            <p style="margin-bottom: 15px; font-weight: 600; color: #7e32e2;">
              ⚠️ พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
            </p>
            <p style="margin-bottom: 12px; line-height: 1.6;">
              การเปิดเผยข้อมูลส่วนบุคคล เช่น <strong>เลขบัตรประจำตัวประชาชน</strong> ต้องมีวัตถุประสงค์ที่ชอบด้วยกฎหมาย และได้รับความยินยอมจากเจ้าของข้อมูล
            </p>
            <p style="margin-bottom: 12px; line-height: 1.6;">
              ผู้ที่เปิดเผยข้อมูลโดยไม่ได้รับอนุญาต อาจต้องรับโทษ:
            </p>
            <ul style="margin-left: 20px; margin-bottom: 15px; line-height: 1.8;">
              <li>ปรับทางแพ่ง สูงสุด <strong>5,000,000 บาท</strong></li>
              <li>จำคุกไม่เกิน <strong>1 ปี</strong> หรือปรับไม่เกิน <strong>1,000,000 บาท</strong> หรือทั้งจำทั้งปรับ</li>
            </ul>
            <p style="line-height: 1.6; color: #dc2626; font-weight: 500;">
              กรุณาใช้ข้อมูลอย่างระมัดระวังและรับผิดชอบ
            </p>
          </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#7e32e2",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "เข้าใจและยอมรับ",
        cancelButtonText: "ยกเลิก",
        customClass: {
          popup: "swal-wide",
          title: "text-xl font-bold",
          htmlContainer: "text-base",
        },
        focusConfirm: false,
      });

      if (result.isConfirmed) {
        setCidVisibility((prev) => ({ ...prev, [userCid]: true }));
      }
    } else {
      setCidVisibility((prev) => ({ ...prev, [userCid]: false }));
    }
  };

  const handleReset = () => {
    resetFilters(); // ใช้ resetFilters จาก usePermissionFilters
    setKeyword("");
    setCurrentPage(1);
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-[#f7f2ff] via-white to-white p-0">
      <UserDetailModal
        open={modalOpen}
        user={selectedUser}
        onClose={() => setModalOpen(false)}
        onDeactivate={handleDeactivateUser}
        onRestore={handleRestoreUser}
        isRestoreBtn={modalType === "restore"}
      />
      <DownloadModal
        open={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        totalItems={filteredTotalItems}
        filteredUsers={filteredUsers}
        filters={{
          keyword,
          tab,
          province,
          district,
          subdistrict,
          service,
        }}
      />

      {/* Header Section */}
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
                    รายชื่อผู้ใช้งานแอปพลิเคชัน
                  </h1>
                  <p className="text-white/80">
                    จัดการข้อมูลผู้ใช้งานและดาวน์โหลดรายงาน
                  </p>
                </div>
              </div>
            </div>
            <div className="flex w-full lg:w-auto justify-end">
              <button
                className="bg-white text-[#7e32e2] font-semibold rounded-2xl px-4 py-3 shadow-lg border border-white/50 hover:-translate-y-0.5 transition"
                onClick={() => setDownloadModalOpen(true)}
              >
                <Download size={18} className="inline mr-2" /> ดาวน์โหลดรายงาน
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white border border-[#eee5ff] shadow-xl rounded-2xl p-5 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CustomSelect
            label="เขตสุขภาพ"
            placeholder="เลือกเขต"
            value={zone}
            onChange={(e) => handleZoneChange(e.target.value)}
            options={Array.isArray(healthAreas) ? healthAreas.map(h => ({ label: h.name_th, value: h.code })) : []}
            icon={MapPin}
            disabled={isLocked("zone")}
          />
          <CustomSelect
            label="จังหวัด"
            placeholder="เลือกจังหวัด"
            value={province}
            onChange={(e) => handleProvinceChange(e.target.value)}
            options={(provinces || []).map((p) => ({ label: p.name_th, value: p.code }))}
            icon={Building2}
            disabled={isLocked("province")}
          />
          <CustomSelect
            label="อำเภอ"
            placeholder="เลือกอำเภอ"
            value={district}
            onChange={(e) => handleDistrictChange(e.target.value)}
            options={(districts || []).map((d) => ({ label: d.name_th, value: d.code }))}
            icon={Building2}
            disabled={isLocked("district")}
          />
          <CustomSelect
            label="ตำบล"
            placeholder="เลือกตำบล"
            value={subdistrict}
            onChange={(e) => handleSubdistrictChange(e.target.value)}
            options={(subdistricts || []).map((s) => ({ label: s.name_th, value: s.code }))}
            icon={Home}
            disabled={isLocked("subdistrict")}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <CustomSelect
            label="หน่วยบริการ"
            placeholder="เลือกหน่วยบริการ"
            value={service}
            onChange={(e) => handleServiceChange(e.target.value)}
            options={(healthServices || []).map((s) => ({
              label: s.name_th || s.name || s.service_name || "ไม่ระบุ",
              value: String(s.id || s.code || "")
            }))}
            icon={Building2}
            disabled={isLocked("service")}
          />
        </div>
        <div className="flex gap-3 mt-4">
          <button
            className="flex items-center justify-center gap-2 px-6 py-3 h-12 bg-gradient-to-r from-[#7e32e2] to-[#a855f7] text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
            onClick={() => setCurrentPage(1)}
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

      {/* Tabs Section */}
      <div className="bg-white border border-[#eee5ff] shadow-xl rounded-2xl p-4 mb-6">
        <div className="flex gap-4 border-b border-purple-100 mb-4">
          <button
            className={`px-4 py-3 font-semibold rounded-t-lg transition-all ${
              tab === "active"
                ? "bg-gradient-to-r from-purple-100 to-violet-100 text-[#7e32e2] border-b-2 border-[#7e32e2]"
                : "text-gray-600 hover:bg-purple-50"
            }`}
            onClick={() => {
              setTab("active");
              setCurrentPage(1);
            }}
          >
            รายชื่อผู้ใช้งาน
          </button>
          {/* <button
            className={`px-4 py-3 font-semibold rounded-t-lg transition-all ${
              tab === "deleted"
                ? "bg-gradient-to-r from-purple-100 to-violet-100 text-[#7e32e2] border-b-2 border-[#7e32e2]"
                : "text-gray-600 hover:bg-purple-50"
            }`}
            onClick={() => {
              setTab("deleted");
              setCurrentPage(1);
            }}
          >
            บัญชีที่ยกเลิกสิทธิ์แล้ว
          </button> */}
        </div>

        {/* Search Bar */}
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
                  setCurrentPage(1);
                }}
                placeholder="พิมพ์คำค้นหาชื่อหรือเลขประจำตัวประชาชน"
                className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-purple-200 bg-gradient-to-r from-purple-50/50 to-violet-50/50 text-gray-700 font-medium placeholder:text-gray-400 focus:border-[#7e32e2] focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all duration-200"
              />
            </div>
            <button
              className="flex items-center justify-center gap-2 px-6 py-3 h-12 bg-gradient-to-r from-[#7e32e2] to-[#a855f7] text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 whitespace-nowrap w-full sm:w-auto"
              onClick={() => setCurrentPage(1)}
            >
              <Search size={20} />
              ค้นหา
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {/* Total */}
          <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Users size={24} className="text-white" />
              </div>
              <div>
                <div className="text-white/80 text-sm">ทั้งหมด</div>
                <div className="text-2xl font-bold text-white">
                  {statistics?.total?.toLocaleString("th-TH") || 0}
                </div>
              </div>
            </div>
          </div>
          {/* Online */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Wifi size={24} className="text-white" />
              </div>
              <div>
                <div className="text-white/80 text-sm">ออนไลน์</div>
                <div className="text-2xl font-bold text-white">
                  {statistics?.online?.toLocaleString("th-TH") || 0}
                </div>
              </div>
            </div>
          </div>
          {/* Offline */}
          <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Moon size={24} className="text-white" />
              </div>
              <div>
                <div className="text-white/80 text-sm">ออฟไลน์</div>
                <div className="text-2xl font-bold text-white">
                  {statistics?.offline?.toLocaleString("th-TH") || 0}
                </div>
              </div>
            </div>
          </div>
          {/* Officers - แสดงเฉพาะสิทธิกรม */}
          {isCountryLevel() && (
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Shield size={24} className="text-white" />
                </div>
                <div>
                  <div className="text-white/80 text-sm">เจ้าหน้าที่</div>
                  <div className="text-2xl font-bold text-white">
                    {statistics?.officers?.toLocaleString("th-TH") || 0}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* OSM */}
          <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <HeartPulse size={24} className="text-white" />
              </div>
              <div>
                <div className="text-white/80 text-sm">อสม.</div>
                <div className="text-2xl font-bold text-white">
                  {statistics?.osm?.toLocaleString("th-TH") || 0}
                </div>
              </div>
            </div>
          </div>
          {/* OSM กรุงเทพ - แสดงเฉพาะสิทธิกรม หรือ user ที่อยู่ในกรุงเทพ */}
          {(isCountryLevel() || scope?.province === "10") && (
            <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Landmark size={24} className="text-white" />
                </div>
                <div>
                  <div className="text-white/80 text-sm">อสม. กรุงเทพ</div>
                  <div className="text-2xl font-bold text-white">
                    {statistics?.osmBangkok?.toLocaleString("th-TH") || 0}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading Progress Indicator */}
        {loadingProgress && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <Loader2 size={24} className="text-purple-600 animate-spin" />
              <div className="flex-1">
                <p className="text-purple-800 font-semibold">กำลังดึงข้อมูล...</p>
                <p className="text-purple-600 text-sm">
                  หน้า {loadingProgress.page} (ดึงข้อมูลแล้ว {Math.min(loadingProgress.page * 100, loadingProgress.total)} จากทั้งหมด {loadingProgress.total} รายการ)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
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
                  ผู้ใช้งานออนไลน์ ({filteredTotalItems} รายการ)
                </th>
                <th className="py-4 px-4 font-semibold text-center text-white">
                  เลขประจำตัวประชาชน
                </th>
                <th className="py-4 px-4 font-semibold text-center text-white">
                  ระดับตำแหน่ง
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
                      <Loader2 size={48} className="text-purple-500 animate-spin" />
                      <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
                    </div>
                  </td>
                </tr>
              ) : displayUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileText size={48} className="text-gray-300" />
                      <p className="text-gray-500">ไม่พบข้อมูล</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayUsers.map((row, idx) => (
                  <tr
                    key={row.external_user_id || `user-${idx}`}
                    className={`${
                      idx % 2 === 0 ? "bg-white" : "bg-purple-50/30"
                    } hover:bg-purple-50 transition-colors`}
                  >
                    <td className="py-4 px-4 text-center font-medium text-gray-600">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="py-4 px-4 font-medium text-[#231d37]">
                      <div className="flex items-center gap-2">
                        {/* Status indicator - สีเขียว = online, เหลือง = active (offline), เทา = deleted */}
                        {(() => {
                          if (row.status !== "active") {
                            // บัญชีถูกปิด
                            return (
                              <div
                                className="w-3 h-3 rounded-full bg-gray-400"
                                title="ปิดการใช้งาน"
                              />
                            );
                          }

                          // บัญชีใช้งานได้ - เช็คสถานะ online/offline
                          const lastActiveAt = row.last_active_at ? new Date(row.last_active_at) : null;
                          const now = new Date();
                          const minutesSinceActive = lastActiveAt
                            ? (now.getTime() - lastActiveAt.getTime()) / (1000 * 60)
                            : Infinity;

                          // ✅ แก้ไข: เช็คให้ถูกต้อง และเพิ่ม threshold เป็น 5 นาทีสำหรับ production
                          // refreshTrigger ใช้เพื่อ force re-render ทุก 1 นาที
                          const isOnline = lastActiveAt && minutesSinceActive <= 5;

                          return (
                            <div
                              className={`w-3 h-3 rounded-full ${
                                isOnline
                                  ? "bg-green-500 shadow-lg shadow-green-500/50 animate-pulse"
                                  : "bg-yellow-400"
                              }`}
                              title={
                                isOnline
                                  ? `ออนไลน์ (ใช้งานเมื่อ ${Math.floor(minutesSinceActive)} นาทีที่แล้ว)`
                                  : lastActiveAt
                                  ? `ออฟไลน์ (ใช้งานครั้งล่าสุดเมื่อ ${lastActiveAt.toLocaleString('th-TH')})`
                                  : "ออฟไลน์ (ยังไม่เคยใช้งาน)"
                              }
                            />
                          );
                        })()}
                        <span>{row.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center text-gray-600">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-mono">
                          {maskCID(row.cid, cidVisibility[row.cid])}
                        </span>
                        <button
                          onClick={() => handleToggleCID(row.cid)}
                          className="text-purple-600 hover:text-purple-800 transition-colors p-1 hover:bg-purple-50 rounded"
                          title={
                            cidVisibility[row.cid]
                              ? "ซ่อนเลขบัตรประชาชน"
                              : "แสดงเลขบัตรประชาชน"
                          }
                        >
                          {cidVisibility[row.cid] ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center text-gray-600">
                      {row.position}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {tab === "deleted" ? (
                        <button
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#21c978] to-[#169e5f] text-white font-semibold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                          onClick={() => {
                            setSelectedUser(row);
                            setModalType("restore");
                            setModalOpen(true);
                          }}
                        >
                          <RefreshCcw size={16} />
                          กู้คืนบัญชี
                        </button>
                      ) : (
                        <button
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7e32e2] to-[#9333ea] text-white font-semibold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                          onClick={() => {
                            setSelectedUser(row);
                            setModalType("detail");
                            setModalOpen(true);
                          }}
                        >
                          <Eye size={16} />
                          รายละเอียด
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={filteredTotalPages}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          totalItems={filteredTotalItems}
        />
      </div>
    </div>
  );
};

export default UserListComp;
