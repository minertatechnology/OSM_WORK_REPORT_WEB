import React, { useState, useEffect, useMemo } from "react";
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
import {
  getAdminUsers,
  getAdminUsersStats,
  exportAdminUsers,
  createAdminUsersExportJob,
  getAdminUsersExportJob,
  downloadAdminUsersExportJob,
  syncAdminUserProfiles,
} from "@services/userService/userService";
import { usePermissionFilters } from "@hooks/usePermissionFilters";
import { useUserPermission } from "@context/UserPermissionProvider";
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";

// Mock data for select options (ลบ ZONES, PROVINCES, DISTRICTS, SUBDISTRICTS เพราะใช้จาก usePermissionFilters แทน)
const PER_PAGE_OPTIONS = [
  { label: "10", value: 10 },
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
];

// ประเภทรายงานที่ดาวน์โหลดได้ (ตรงกับการ์ดสถิติ) — statKey คือ field จาก /admin/users/stats
const EXPORT_CATEGORIES = [
  { key: "all", label: "ทั้งหมด", statKey: "total", icon: Users, color: "text-violet-600 bg-violet-100" },
  { key: "online", label: "ออนไลน์", statKey: "online", icon: Wifi, color: "text-emerald-600 bg-emerald-100" },
  { key: "officer", label: "เจ้าหน้าที่", statKey: "officers", icon: Shield, color: "text-sky-600 bg-sky-100" },
  { key: "osm", label: "อสม.", statKey: "osm", icon: HeartPulse, color: "text-rose-600 bg-rose-100" },
  { key: "osm_bangkok", label: "อสม. กรุงเทพ", statKey: "osm_bangkok", icon: Landmark, color: "text-orange-600 bg-orange-100" },
];
const EXPORT_CHUNK_SIZE = 5000;
// ไม่ยิงต่อเนื่องจนแย่ง server กับผู้ใช้แอป: เว้นระยะระหว่างรอบ และถ้า server ไม่ว่าง/error ให้รอนานขึ้นเรื่อยๆ ก่อนลองใหม่
const EXPORT_CHUNK_DELAY_MS = 200;
const EXPORT_MAX_ATTEMPTS = 5;
// "browser": หน้าเว็บสร้าง Excel เอง ใช้ได้ทันทีโดยไม่ต้องตั้งค่า server เพิ่ม (ไหวถึงราว 500,000 แถว)
// "server": server สร้างไฟล์เป็นงานเบื้องหลัง รองรับหลักล้านแถว — เปิดได้เมื่อ backend ต่อดิสก์กลาง
//   (uploads-pvc ที่ /app/export_files) แล้วเท่านั้น ไม่งั้นแต่ละ pod มองไม่เห็นงานของกัน → "ไม่พบงานดาวน์โหลดนี้"
const EXCEL_EXPORT_MODE = "browser";
// ใส่เส้นขอบทุก cell เฉพาะรายงานไม่ใหญ่มาก (style ทุก cell ของหลักแสนแถวใช้หน่วยความจำหลาย GB)
const EXCEL_STYLED_MAX_ROWS = 20000;
// Excel สร้างที่ server: poll ถี่ช่วงแรก แล้วห่างขึ้น (งานล้านแถวใช้ราว 2 นาที บวกเวลารอคิว)
const EXPORT_JOB_FAST_POLLS = 30;
const EXPORT_JOB_FAST_POLL_MS = 2000;
const EXPORT_JOB_SLOW_POLL_MS = 5000;
const EXPORT_JOB_MAX_WAIT_MS = 40 * 60 * 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 429 (server ไม่ว่าง), 5xx, timeout/network → รอ 1, 2, 4, 8 วินาทีแล้วลองใหม่
const withRetry = async (request) => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await request();
    } catch (error) {
      const status = error.response?.status;
      const retryable = !status || status === 429 || status >= 500;
      if (!retryable || attempt >= EXPORT_MAX_ATTEMPTS) throw error;
      await sleep(1000 * 2 ** (attempt - 1));
    }
  }
};

// Excel: server สร้างไฟล์เป็นงานเบื้องหลัง (แบบหน้ารายชื่อ อสม. ของ Thai PHC) เบราว์เซอร์แค่โหลดไฟล์ที่เสร็จแล้ว
// จึงไม่ค้างแม้หลักล้านแถว — คืน { rows, blob } (rows = 0 คือไม่มีข้อมูล)
const exportExcelViaJob = async (filters, category, onStatus) => {
  let job = await withRetry(() =>
    createAdminUsersExportJob({ ...filters, category: category.key })
  );
  const startedAt = Date.now();
  for (let polls = 0; job.status !== "completed"; polls++) {
    if (job.status === "failed") {
      throw Object.assign(new Error(job.error), { userMessage: job.error });
    }
    if (Date.now() - startedAt > EXPORT_JOB_MAX_WAIT_MS) {
      throw Object.assign(new Error("export job timeout"), {
        userMessage: "ใช้เวลานานเกินไป กรุณากดดาวน์โหลดอีกครั้งภายหลัง",
      });
    }
    onStatus(job);
    await sleep(polls < EXPORT_JOB_FAST_POLLS ? EXPORT_JOB_FAST_POLL_MS : EXPORT_JOB_SLOW_POLL_MS);
    const jobId = job.job_id;
    job = await withRetry(() => getAdminUsersExportJob(jobId));
  }

  if (job.rows_written === 0) return { rows: 0, blob: null };
  onStatus(job);
  const blob = await withRetry(() => downloadAdminUsersExportJob(job.job_id));
  return { rows: job.rows_written, blob };
};

const exportFileName = (category, ext) => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `User_${category.key}_${day}-${month}-${now.getFullYear()}.${ext}`;
};

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

const GENDER_TH = { male: "ชาย", female: "หญิง" };
const POSITION_BY_KIND = { osm: "อสม.", officer: "เจ้าหน้าที่" };

// แปลง row จาก /admin/users เป็นรูปแบบที่ตาราง/modal/export ใช้
const mapAdminUser = (user) => ({
  ...user,
  name: user.name || "ไม่ระบุชื่อ",
  cid: user.citizen_id || "-",
  position: POSITION_BY_KIND[user.user_kind] || "ไม่ระบุตำแหน่ง",
  position_name: user.position_name,
  gender: GENDER_TH[user.gender] || user.gender || "-",
  hospital: user.health_service_name || "-",
  province: user.province_name || "-",
  district: user.district_name || "-",
  subdistrict: user.subdistrict_name || "-",
  phone: user.phone || "-",
  status: user.is_active ? "active" : "deleted",
});

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

// Export Excel ในเบราว์เซอร์ - ใช้ xlsx library สำหรับสร้างไฟล์ Excel ที่ถูกต้อง
function buildUserListExcel(data) {
  const wsData = [
    ["ลำดับ", "ชื่อ-นามสกุล", "เลขประจำตัวประชาชน", "ระดับตำแหน่ง"],
  ];
  data.forEach((row, idx) => {
    wsData.push([idx + 1, row.name || "-", maskCID(row.cid, false), row.position || "-"]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!cols"] = [{ wch: 8 }, { wch: 30 }, { wch: 20 }, { wch: 20 }];

  const borderStyle = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  };
  const headerStyle = {
    border: borderStyle,
    fill: { fgColor: { rgb: "E8D5F9" } },
    font: { bold: true, sz: 11 },
    alignment: { horizontal: "center", vertical: "center" },
  };
  const dataStyle = { border: borderStyle, alignment: { vertical: "center" } };
  const dataCenterStyle = { border: borderStyle, alignment: { horizontal: "center", vertical: "center" } };

  // ใส่เส้นขอบทุก cell เฉพาะรายงานไม่ใหญ่มาก (รายงานใหญ่ใส่เฉพาะหัวตาราง ไม่งั้นเบราว์เซอร์กินแรมหลาย GB)
  const range = XLSX.utils.decode_range(ws["!ref"]);
  const lastStyledRow = data.length <= EXCEL_STYLED_MAX_ROWS ? range.e.r : 0;
  for (let R = range.s.r; R <= lastStyledRow; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
      if (!cell) continue;
      cell.s = R === 0 ? headerStyle : C === 1 ? dataStyle : dataCenterStyle;
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, "รายชื่อผู้ใช้งาน");
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array", compression: true });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  return blob;
}

// Download Modal - ดาวน์โหลด Excel แยกตามการ์ดสถิติ (ทั้งหมด / ออนไลน์ / เจ้าหน้าที่ / อสม. / อสม. กรุงเทพ)
function DownloadModal({ open, onClose, categories, exportExcel }) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const setLoadingText = (text) => {
    const el = Swal.getHtmlContainer();
    if (el) el.textContent = text;
  };

  const handleExport = async (category) => {
    setLoading(true);
    try {
      Swal.fire({
        title: "กำลังเตรียมข้อมูล...",
        text: `กำลังดึงข้อมูล${category.label}`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const { rows, blob } = await exportExcel(category, setLoadingText);
      if (rows === 0) {
        Swal.fire({
          icon: "warning",
          title: "ไม่มีข้อมูล",
          text: "ไม่มีข้อมูลสำหรับดาวน์โหลด",
          confirmButtonColor: "#7e32e2",
        });
        return;
      }
      // ดาวน์โหลดตอนผู้ใช้กดปุ่มเท่านั้น: Chrome บล็อกการดาวน์โหลดที่เกิดหลังคลิกไปนานแล้ว (รอดึงข้อมูล) แบบเงียบๆ
      Swal.fire({
        icon: "success",
        title: "ไฟล์พร้อมแล้ว",
        text: `${category.label} ${rows.toLocaleString("th-TH")} รายการ`,
        confirmButtonText: "ดาวน์โหลดไฟล์",
        confirmButtonColor: "#7e32e2",
        showCancelButton: true,
        cancelButtonText: "ปิด",
        allowOutsideClick: false,
        preConfirm: () => saveAs(blob, exportFileName(category, "xlsx")),
      });
    } catch (error) {
      console.error("Export excel error:", error);
      const detail = error.response?.data?.detail;
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text:
          error.userMessage ||
          (typeof detail === "string" ? detail : "ไม่สามารถดึงข้อมูลสำหรับดาวน์โหลดได้ กรุณาลองใหม่อีกครั้ง"),
        confirmButtonColor: "#7e32e2",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#ece1f7] w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <div className="text-[20px] font-bold text-[#7e32e2] mb-5">
          ดาวน์โหลดเอกสาร
        </div>
        <div className="flex flex-col gap-3 mb-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.key}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 bg-purple-50/60 border border-purple-100 rounded-xl px-4 py-3"
              >
                <div className="flex flex-1 items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-xl ${category.color}`}>
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[16px] text-[#231d37] font-semibold">
                      {category.label}
                    </div>
                    <div className="text-[13px] text-gray-500">
                      {category.count == null
                        ? "-"
                        : `${category.count.toLocaleString("th-TH")} รายการ`}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleExport(category)}
                  disabled={loading || category.count === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-green-200 bg-white text-[#388e3c] font-semibold text-[15px] shadow-sm hover:bg-green-50 hover:border-green-300 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Image
                    src="/xlsx.png"
                    alt="excel"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                  Excel
                </button>
              </div>
            );
          })}
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
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statistics, setStatistics] = useState(null);
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const [syncProgress, setSyncProgress] = useState(null); // { done, remaining } ระหว่าง sync โปรไฟล์

  // CID visibility state - track which rows show full CID
  const [cidVisibility, setCidVisibility] = useState({});

  // หน่วงการค้นหาด้วย keyword เพื่อไม่ยิง API ทุกตัวอักษร
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword.trim()), 400);
    return () => clearTimeout(timer);
  }, [keyword]);

  // ✅ รอให้ locked filters ของสิทธิ์ถูก set ก่อน (backend บังคับขอบเขตพื้นที่ซ้ำอีกชั้น)
  const filtersReady = useMemo(() => {
    if (permissionLoading) return false;
    if (lockLevel === "province") return province !== "" || !isLocked("province");
    if (lockLevel === "district") return district !== "" || !isLocked("district");
    if (lockLevel === "subdistrict") return subdistrict !== "" || !isLocked("subdistrict");
    if (lockLevel === "service") return service !== "" || !isLocked("service");
    return true;
  }, [permissionLoading, lockLevel, province, district, subdistrict, service, isLocked]);

  // ✅ filter ที่ส่งไป backend - priority: user selection > permission locked
  const apiFilters = useMemo(() => {
    if (!filtersReady) return null;
    const initialFilters = getInitialFilters();
    return {
      is_active: tab === "active",
      keyword: debouncedKeyword || undefined,
      health_area_id: zone || initialFilters.zone || undefined,
      province_code: province || initialFilters.province || undefined,
      district_code: district || initialFilters.district || undefined,
      subdistrict_code: subdistrict || initialFilters.subdistrict || undefined,
      health_service_code: service || initialFilters.service || undefined,
      // สิทธิ์อื่นที่ไม่ใช่ระดับกรม: แสดงเฉพาะ อสม. (ไม่รวมเจ้าหน้าที่และผู้ที่ไม่พบข้อมูล)
      user_kind: isCountryLevel() ? undefined : "osm",
    };
  }, [filtersReady, tab, debouncedKeyword, zone, province, district, subdistrict, service, isCountryLevel]);

  // เปลี่ยน filter แล้วกลับไปหน้าแรก
  useEffect(() => {
    setCurrentPage(1);
  }, [apiFilters]);

  // ดึงรายชื่อเฉพาะหน้าปัจจุบัน (ตารางแสดงเฉพาะผู้ที่ออนไลน์)
  useEffect(() => {
    if (!apiFilters) return;
    let cancelled = false;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await getAdminUsers({
          ...apiFilters,
          online_only: true,
          page: currentPage,
          per_page: itemsPerPage,
        });
        if (cancelled) return;
        setUsers(response.users.map(mapAdminUser));
        setTotalItems(response.total);
        setTotalPages(response.total_pages || 1);
      } catch (error) {
        if (cancelled) return;
        console.error("Error fetching users:", error);
        setUsers([]);
        setTotalItems(0);
        setTotalPages(1);

        const status = error.response?.status;
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text:
            status === 401
              ? "ไม่พบ Token กรุณาเข้าสู่ระบบใหม่อีกครั้ง"
              : status === 403
              ? "คุณไม่มีสิทธิ์ในการเข้าถึงข้อมูลนี้"
              : "ไม่สามารถดึงข้อมูลผู้ใช้งานได้ กรุณาลองใหม่อีกครั้ง",
          confirmButtonColor: "#7e32e2",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchUsers();
    return () => {
      cancelled = true;
    };
  }, [apiFilters, currentPage, itemsPerPage, refreshTick]);

  // สถิติ (นับที่ backend ตาม filter เดียวกัน)
  useEffect(() => {
    if (!apiFilters) return;
    let cancelled = false;
    getAdminUsersStats(apiFilters)
      .then((stats) => {
        if (!cancelled) setStatistics(stats);
      })
      .catch((error) => console.error("Error fetching user stats:", error));
    return () => {
      cancelled = true;
    };
  }, [apiFilters, refreshTick]);

  // Auto-refresh รายชื่อผู้ออนไลน์และสถิติทุก 60 วินาที
  useEffect(() => {
    const interval = setInterval(() => setRefreshTick((t) => t + 1), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ดึงโปรไฟล์ของผู้ใช้ที่ยังไม่มีข้อมูลจากตัวกลาง (ทีละรอบจนครบ)
  const handleSyncProfiles = async () => {
    setSyncProgress({ done: 0, remaining: statistics?.unsynced || 0 });
    try {
      let done = 0;
      let remaining = Infinity;
      while (remaining > 0) {
        const result = await syncAdminUserProfiles(2000);
        done += result.requested;
        remaining = result.requested === 0 ? 0 : result.remaining;
        setSyncProgress({ done, remaining });
      }
      setRefreshTick((t) => t + 1);
    } catch (error) {
      console.error("Error syncing user profiles:", error);
      Swal.fire({
        icon: "error",
        title: "ซิงค์ข้อมูลไม่สำเร็จ",
        text: "ไม่สามารถดึงข้อมูลผู้ใช้จากระบบตัวกลางได้ กรุณาลองใหม่อีกครั้ง",
        confirmButtonColor: "#7e32e2",
      });
    } finally {
      setSyncProgress(null);
    }
  };

  // การ์ด เจ้าหน้าที่ / อสม. กรุงเทพ แสดงเฉพาะบางสิทธิ์ (ใช้ทั้งการ์ดสถิติและรายงานดาวน์โหลด)
  const showOfficers = isCountryLevel();
  const showOsmBangkok = isCountryLevel() || scope?.province === "10";
  const exportCategories = EXPORT_CATEGORIES.filter(
    (c) => (c.key !== "officer" || showOfficers) && (c.key !== "osm_bangkok" || showOsmBangkok)
  ).map((c) => ({ ...c, count: statistics ? statistics[c.statKey] ?? 0 : null }));

  // ดึงรายชื่อของประเภทที่เลือกตาม filter ปัจจุบัน (ทีละ EXPORT_CHUNK_SIZE ทีละรอบ) สำหรับสร้าง Excel ในเบราว์เซอร์
  const fetchAllUsersForExport = async (category, onProgress) => {
    const all = [];
    let after;
    do {
      if (after) await sleep(EXPORT_CHUNK_DELAY_MS);
      const params = { ...apiFilters, category: category.key, after, limit: EXPORT_CHUNK_SIZE };
      const response = await withRetry(() => exportAdminUsers(params));
      for (const user of response.users) all.push(mapAdminUser(user));
      onProgress?.(all.length, Math.max(category.count || 0, all.length));
      after = response.next_cursor;
    } while (after);
    return all;
  };

  // คืน { rows, blob } (rows = 0 คือไม่มีข้อมูล) — setText แสดงความคืบหน้า
  const exportExcel = async (category, setText) => {
    const count = (n) => n.toLocaleString("th-TH");
    if (EXCEL_EXPORT_MODE === "server") {
      return exportExcelViaJob(apiFilters, category, (job) => {
        if (job.status === "queued") setText("รอคิว — มีรายงานอื่นกำลังสร้างอยู่");
        else if (job.status === "completed") setText(`กำลังดาวน์โหลดไฟล์ ${count(job.rows_written)} รายการ`);
        else setText(`กำลังสร้างไฟล์ ${count(job.rows_written)} / ${count(Math.max(category.count || 0, job.rows_written))} รายการ`);
      });
    }

    const exportUsers = await fetchAllUsersForExport(category, (loaded, total) => {
      setText(`กำลังดึงข้อมูล${category.label} ${count(loaded)} / ${count(total)} รายการ`);
    });
    if (exportUsers.length === 0) return { rows: 0, blob: null };
    // สร้างไฟล์เป็นงาน sync ที่ block หน้าจอ — รอให้ข้อความแสดงก่อน
    setText(`กำลังสร้างไฟล์ ${count(exportUsers.length)} รายการ`);
    await sleep(50);
    return { rows: exportUsers.length, blob: buildUserListExcel(exportUsers) };
  };

  const displayUsers = users;
  const filteredTotalItems = totalItems;
  const filteredTotalPages = totalPages;

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
        categories={exportCategories}
        exportExcel={exportExcel}
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
                className="bg-white text-[#7e32e2] font-semibold rounded-2xl px-4 py-3 shadow-lg border border-white/50 hover:-translate-y-0.5 transition disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                onClick={() => setDownloadModalOpen(true)}
                disabled={!apiFilters}
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
          {showOfficers && (
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
          {showOsmBangkok && (
            <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Landmark size={24} className="text-white" />
                </div>
                <div>
                  <div className="text-white/80 text-sm">อสม. กรุงเทพ</div>
                  <div className="text-2xl font-bold text-white">
                    {statistics?.osm_bangkok?.toLocaleString("th-TH") || 0}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ผู้ใช้ที่ยังไม่มีข้อมูลโปรไฟล์จากตัวกลาง (จะไม่ถูกนับเมื่อกรองด้วยพื้นที่) */}
        {isCountryLevel() && (syncProgress || statistics?.unsynced > 0) && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {syncProgress && <Loader2 size={24} className="text-purple-600 animate-spin" />}
              <div className="flex-1">
                <p className="text-purple-800 font-semibold">
                  {syncProgress ? "กำลังซิงค์ข้อมูลผู้ใช้จากระบบตัวกลาง..." : "มีผู้ใช้ที่ยังไม่มีข้อมูลชื่อ/พื้นที่"}
                </p>
                <p className="text-purple-600 text-sm">
                  {syncProgress
                    ? `ซิงค์แล้ว ${syncProgress.done.toLocaleString("th-TH")} รายการ (เหลือ ${syncProgress.remaining.toLocaleString("th-TH")} รายการ)`
                    : `${statistics.unsynced.toLocaleString("th-TH")} รายการ ยังไม่ถูกนับเมื่อกรองตามพื้นที่`}
                </p>
              </div>
              {!syncProgress && (
                <button
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7e32e2] to-[#a855f7] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200"
                  onClick={handleSyncProfiles}
                >
                  <RefreshCcw size={16} />
                  ซิงค์ข้อมูล
                </button>
              )}
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
