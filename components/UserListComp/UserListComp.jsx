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
} from "lucide-react";
import Swal from "sweetalert2";
import CustomSelect from "@services/customSelectService/customSelectService";

// Mock data for select options and table
const YEARS = [
  { label: "2568", value: "2568" },
  { label: "2567", value: "2567" },
  { label: "2566", value: "2566" },
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
const WEEKS = [
  { label: "สัปดาห์ 1 (2/6/68-8/6/68)", value: "week1" },
  { label: "สัปดาห์ 2 (9/6/68-15/6/68)", value: "week2" },
  { label: "สัปดาห์ 3 (16/6/68-22/6/68)", value: "week3" },
  { label: "สัปดาห์ 4 (23/6/68-27/6/68)", value: "week4" },
];
const ZONES = Array.from({ length: 13 }, (_, i) => ({
  label: `เขตสุขภาพ ${i + 1}`,
  value: `${i + 1}`,
}));

const PROVINCES = [
  { label: "เชียงใหม่", value: "เชียงใหม่" },
  { label: "กรุงเทพฯ", value: "กรุงเทพฯ" },
  { label: "นครราชสีมา", value: "นครราชสีมา" },
];
const DISTRICTS = [
  { label: "เมือง", value: "เมือง" },
  { label: "สันทราย", value: "สันทราย" },
  { label: "ปากช่อง", value: "ปากช่อง" },
];
const SUBDISTRICTS = [
  { label: "ท่าศาลา", value: "ท่าศาลา" },
  { label: "หนองจ๊อม", value: "หนองจ๊อม" },
  { label: "ในเมือง", value: "ในเมือง" },
];

const PER_PAGE_OPTIONS = [
  { label: "10", value: 10 },
  { label: "20", value: 20 },
  { label: "50", value: 50 },
];

// Mock table data
function getInitialUsers() {
  return [
    {
      name: "นางสาวชมบุษบก ผดุงจิตร",
      cid: "1539900551382",
      position: "อสม. ทั่วไป",
      gender: "หญิง",
      hospital: "โรงพยาบาลส่งเสริมสุขภาพตำบลไผ่ล้อม",
      province: "นนทบุรี",
      district: "เมืองนนทบุรี",
      subdistrict: "ท่าทราย",
      status: "active",
    },
    {
      name: "นายสมชาย กู้ชีพ",
      cid: "1103700222345",
      position: "อสม. ทั่วไป",
      gender: "ชาย",
      hospital: "รพ.สต.ท่าศาลา",
      province: "เชียงใหม่",
      district: "สันทราย",
      subdistrict: "ท่าศาลา",
      status: "deleted",
    },
    {
      name: "นางสาวสายใจ ทองดี",
      cid: "1103700229999",
      position: "อสม. ทั่วไป",
      gender: "หญิง",
      hospital: "รพ.สต.หนองจ๊อม",
      province: "เชียงใหม่",
      district: "สันทราย",
      subdistrict: "หนองจ๊อม",
      status: "active",
    },
    ...Array.from({ length: 97 }, (_, i) => ({
      name: `อสม. ทดสอบ ${i + 1}`,
      cid: `110370022${(1000 + i).toString().padStart(4, "0")}`,
      position: "อสม. ทั่วไป",
      gender: "หญิง",
      hospital: "รพ.สต.ท่าศาลา",
      province: "เชียงใหม่",
      district: "สันทราย",
      subdistrict: "หนองจ๊อม",
      status: "active",
    })),
  ];
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
        <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-7">
          <div>
            <div className="flex items-center gap-2 mb-1 text-[#7e32e2] font-medium text-[16px]">
              <User size={18} />
              ชื่อ-นามสกุล
            </div>
            <div className="ml-6 text-[#231d37] text-[16px] mb-3">
              {user.name}
            </div>
            <div className="flex items-center gap-2 mb-1 text-[#7e32e2] font-medium text-[16px]">
              <Venus size={18} />
              เพศ
            </div>
            <div className="ml-6 text-[#231d37] text-[16px] mb-3">
              {user.gender}
            </div>
            <div className="flex items-center gap-2 mb-1 text-[#7e32e2] font-medium text-[16px]">
              <Hospital size={18} />
              สังกัดปัจจุบัน
            </div>
            <div className="ml-6 text-[#231d37] text-[16px] mb-3">
              {user.hospital}
            </div>
            <div className="flex items-center gap-2 mb-1 text-[#7e32e2] font-medium text-[16px]">
              <Landmark size={18} />
              อำเภอ
            </div>
            <div className="ml-6 text-[#231d37] text-[16px] mb-3">
              {user.district}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 text-[#7e32e2] font-medium text-[16px]">
              <BadgeInfo size={18} />
              เลขประจำตัวประชาชน
            </div>
            <div className="ml-6 text-[#231d37] text-[16px] mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono">
                  {maskCID(user.cid, showFullCID)}
                </span>
                <button
                  onClick={handleToggleCID}
                  className="text-purple-600 hover:text-purple-800 transition-colors p-1 hover:bg-purple-50 rounded"
                  title={
                    showFullCID ? "ซ่อนเลขบัตรประชาชน" : "แสดงเลขบัตรประชาชน"
                  }
                >
                  {showFullCID ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-1 text-[#7e32e2] font-medium text-[16px]">
              <MapPin size={18} />
              ระดับตำแหน่ง
            </div>
            <div className="ml-6 text-[#231d37] text-[16px] mb-3">
              {user.position}
            </div>
            <div className="flex items-center gap-2 mb-1 text-[#7e32e2] font-medium text-[16px]">
              <Map size={18} />
              จังหวัด
            </div>
            <div className="ml-6 text-[#231d37] text-[16px] mb-3">
              {user.province}
            </div>
            <div className="flex items-center gap-2 mb-1 text-[#7e32e2] font-medium text-[16px]">
              <Home size={18} />
              ตำบล
            </div>
            <div className="ml-6 text-[#231d37] text-[16px] mb-3">
              {user.subdistrict}
            </div>
          </div>
        </div>
        <div className="flex justify-between gap-3">
          {isRestoreBtn ? (
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
          )}
          <button
            className="px-6 py-3 rounded-xl border border-[#7e32e2] text-[#7e32e2] text-[17px] font-semibold shadow bg-white hover:bg-[#f6eeff] transition"
            onClick={onClose}
          >
            ปิด
          </button>
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

// Download Modal
function DownloadModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#ece1f7] w-full max-w-2xl p-6 relative">
        <div className="text-[20px] font-bold text-[#7e32e2] mb-5">
          ดาวน์โหลดเอกสาร
        </div>
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 bg-purple-50/60 border border-purple-100 rounded-xl px-4 py-3">
            <div className="flex-1 text-[16px] text-[#231d37] font-semibold">
              รายชื่อผู้ใช้งาน
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-white text-[#d32f2f] font-semibold text-[15px] shadow-sm hover:bg-red-50 hover:border-red-300 transition-all active:scale-95">
                <Image
                  src="/pdf.png"
                  alt="pdf"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
                เอกสาร PDF
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-green-200 bg-white text-[#388e3c] font-semibold text-[15px] shadow-sm hover:bg-green-50 hover:border-green-300 transition-all active:scale-95">
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

// Pagination component
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
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-[#f0ebff]">
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

const UserListComp = () => {
  const [year, setYear] = useState("2568");
  const [month, setMonth] = useState("06");
  const [week, setWeek] = useState(WEEKS[3].value);
  const [zone, setZone] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [subdistrict, setSubdistrict] = useState("");
  const [keyword, setKeyword] = useState("");
  const [tab, setTab] = useState("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState("detail");
  const [users, setUsers] = useState(getInitialUsers());

  // CID visibility state - track which rows show full CID
  const [cidVisibility, setCidVisibility] = useState({});

  const filteredUsers = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    const tabFiltered = users.filter((user) =>
      tab === "active" ? user.status !== "deleted" : user.status === "deleted"
    );
    if (!term) return tabFiltered;
    return tabFiltered.filter(
      (user) =>
        user.name.toLowerCase().includes(term) || user.cid.includes(term)
    );
  }, [users, keyword, tab]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / itemsPerPage)
  );
  const paginatedUsers = useMemo(
    () =>
      filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [filteredUsers, itemsPerPage, currentPage]
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [currentPage, totalPages]);

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
    setYear("2568");
    setMonth("06");
    setWeek(WEEKS[3].value);
    setZone("");
    setProvince("");
    setDistrict("");
    setSubdistrict("");
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CustomSelect
            label="ปีงบประมาณ"
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
            options={MONTHS}
            icon={Calendar}
          />
          <CustomSelect
            label="เขตสุขภาพ"
            placeholder="เลือกเขต"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            options={ZONES}
            icon={MapPin}
          />
          <CustomSelect
            label="จังหวัด"
            placeholder="เลือกจังหวัด"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            options={PROVINCES}
            icon={Building2}
          />
          <CustomSelect
            label="อำเภอ"
            placeholder="เลือกอำเภอ"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            options={DISTRICTS}
            icon={Building2}
          />
          <CustomSelect
            label="ตำบล"
            placeholder="เลือกตำบล"
            value={subdistrict}
            onChange={(e) => setSubdistrict(e.target.value)}
            options={SUBDISTRICTS}
            icon={Home}
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
          <button
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
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
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
              placeholder="พิมพ์คำค้นหาชื่อหรือเลขประจำตัวประชาชน..."
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
                  รายชื่อ ({filteredUsers.length} รายการ)
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
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileText size={48} className="text-gray-300" />
                      <p className="text-gray-500">ไม่พบข้อมูล</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((row, idx) => (
                  <tr
                    key={row.cid}
                    className={`${
                      idx % 2 === 0 ? "bg-white" : "bg-purple-50/30"
                    } hover:bg-purple-50 transition-colors`}
                  >
                    <td className="py-4 px-4 text-center font-medium text-gray-600">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="py-4 px-4 font-medium text-[#231d37]">
                      {row.name}
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
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
        />
      </div>
    </div>
  );
};

export default UserListComp;
