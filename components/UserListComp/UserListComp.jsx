import React, { useState, useRef, useEffect } from "react";
import InputService from "@services/inputService/inputService";
import ButtonService from "@services/buttonService/buttonService";
import alertService from "@services/alertService/alertService";
import useStore from "@utils/useStore";
import {
  Search,
  Download,
  ChevronDown,
  Eye,
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
} from "lucide-react";

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
const ZONES = [
  { label: "ทั้งหมด", value: "" },
  ...Array.from({ length: 13 }, (_, i) => ({
    label: `เขตสุขภาพที่ ${i + 1}`,
    value: `${i + 1}`,
  })),
];

const PROVINCES = [
  { label: "เลือกจังหวัด", value: "" },
  { label: "เชียงใหม่", value: "เชียงใหม่" },
  { label: "กรุงเทพฯ", value: "กรุงเทพฯ" },
];
const DISTRICTS = [
  { label: "เลือกอำเภอ", value: "" },
  { label: "เมือง", value: "เมือง" },
  { label: "สันทราย", value: "สันทราย" },
];
const SUBDISTRICTS = [
  { label: "เลือกตำบล", value: "" },
  { label: "ท่าศาลา", value: "ท่าศาลา" },
  { label: "หนองจ๊อม", value: "หนองจ๊อม" },
];

const PER_PAGE_OPTIONS = [
  { label: "10", value: 10 },
  { label: "20", value: 20 },
  { label: "50", value: 50 },
];

// Mock table data (array of 100 with 2 deleted, rest active)
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

function getPageNumbers(currentPage, totalPages, maxVisible = 5) {
  const pages = [];
  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else if (currentPage <= 3) {
    for (let i = 1; i <= 4; i++) pages.push(i);
    pages.push("...", totalPages);
  } else if (currentPage >= totalPages - 2) {
    pages.push(1, "...");
    for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1, "...");
    for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
    pages.push("...", totalPages);
  }
  return pages;
}

// Modal for user details
function UserDetailModal({
  open,
  onClose,
  onDeactivate,
  onRestore,
  user,
  isRestoreBtn,
}) {
  if (!open || !user) return null;
  const handleDeactivate = async () => {
    const res = await alertService.confirm(
      "ยืนยันการปิดบัญชี",
      "คุณต้องการปิดบัญชีผู้ใช้งานรายนี้จริงหรือไม่?"
    );
    if (res.isConfirmed) {
      alertService.success("ปิดบัญชีสำเร็จ", "บัญชีนี้ถูกปิดเรียบร้อยแล้ว");
      onDeactivate && onDeactivate();
    }
  };
  const handleRestore = async () => {
    const res = await alertService.confirm(
      "ยืนยันการกู้คืนบัญชี",
      "คุณต้องการกู้คืนบัญชีผู้ใช้งานรายนี้จริงหรือไม่?"
    );
    if (res.isConfirmed) {
      alertService.success(
        "กู้คืนบัญชีสำเร็จ",
        "บัญชีนี้ถูกกู้คืนเรียบร้อยแล้ว"
      );
      onRestore && onRestore();
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-7 relative">
        <div className="text-[22px] font-semibold text-[#7e32e2] mb-4">
          รายละเอียด
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
              {user.cid}
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

const UserListComp = () => {
  const [searchType, setSearchType] = useState("year");
  const [year, setYear] = useState("2568");
  const [month, setMonth] = useState("06");
  const [week, setWeek] = useState(WEEKS[3].value);
  const [zone, setZone] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [subdistrict, setSubdistrict] = useState("");
  const [searchText, setSearchText] = useState("");
  const [tab, setTab] = useState("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [userstore] = useStore("userInfo");

  // ทำให้ zone เป็นเลขเขตสุขภาพที่ user มีสิทธิ์ (ถ้า locked)
  useEffect(() => {
    if (
      userstore?.auth?.permissions?.includes("ZONE_1") &&
      /^เขตสุขภาพที่\s*\d{1,2}$/.test(userstore?.auth?.zone)
    ) {
      const match = userstore.auth.zone.match(/เขตสุขภาพที่\s*(\d{1,2})/);
      if (match) setZone(match[1]);
    }
  }, [userstore, setZone]);

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState("detail"); // "detail" | "restore"

  const [users, setUsers] = useState(getInitialUsers());

  const filteredUsers = users
    .filter(
      (user) => user.name.includes(searchText) || user.cid.includes(searchText)
    )
    .filter((user) =>
      tab === "active" ? user.status !== "deleted" : user.status === "deleted"
    );

  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  function isZoneHealth(zone) {
    const n = Number(zone);
    return n >= 1 && n <= 13;
  }

  // ฟังก์ชันเช็คว่า locked เขตสุขภาพ (permission + zone ตรงกับ 1-13)
  function isZoneLocked(userstore, zone) {
    // กรณี userstore.auth.zone อาจเป็น label ("เขตสุขภาพที่ 5") หรือ value ("5")
    // ดึงเลข zone จาก label ถ้าเป็น label
    let zoneVal = zone;
    if (/^เขตสุขภาพที่\s*\d{1,2}$/.test(userstore?.auth?.zone)) {
      const match = userstore.auth.zone.match(/เขตสุขภาพที่\s*(\d{1,2})/);
      zoneVal = match ? match[1] : zone;
    }
    return (
      userstore?.auth?.permissions?.includes("ZONE_1") && isZoneHealth(zoneVal)
    );
  }

  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

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

  const buttonStyle =
    "relative flex items-center justify-between rounded-xl border-2 border-[#7e32e2] bg-white text-[#7e32e2] px-6 py-3 text-[17px] font-medium shadow-[0_2px_10px_rgba(126,50,226,0.07)] focus:outline-none cursor-pointer transition hover:bg-[#f6eeff]";
  const splitStyle =
    "absolute right-0 top-0 h-full w-[44px] flex items-center justify-center rounded-tr-xl rounded-br-xl border-l-2 border-[#7e32e2] bg-[#e5d9ff] transition";
  const iconStyle = "mr-2";
  const arrowStyle = "ml-0";
  const disabledStyle = isZoneLocked
    ? {
        background: "#f3f4f6",
        color: "#a3a3a3",
        WebkitTextFillColor: "#a3a3a3", // สำหรับ Chrome autofill
      }
    : {};
  return (
    <div
      className="w-full min-h-screen bg-[#f8f7fd] flex flex-col items-center justify-start"
      style={{ boxSizing: "border-box" }}
    >
      <div
        className="w-full max-w-none bg-white rounded-2xl shadow-sm border border-[#ece1f7] p-4 sm:p-6 mx-auto my-4"
        style={{ boxSizing: "border-box" }}
      >
        {/* Search area (Filter) */}
        <div className="w-full bg-white rounded-xl border border-[#ece1f7] p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="font-semibold text-[#231d37] text-[15px] mr-3">
              รูปแบบการค้นหา :
            </span>
            <label className="flex items-center cursor-pointer mr-6">
              <input
                type="radio"
                checked={searchType === "year"}
                onChange={() => setSearchType("year")}
                className="hidden"
              />
              <span
                className={`w-5 h-5 mr-2 rounded-full border-2 flex items-center justify-center transition-colors ${
                  searchType === "year"
                    ? "border-[#7e32e2] bg-[#f6eeff]"
                    : "border-gray-300 bg-white"
                }`}
              >
                {searchType === "year" && (
                  <span className="w-3 h-3 bg-[#7e32e2] rounded-full block" />
                )}
              </span>
              <span
                className={`font-medium ${
                  searchType === "year" ? "text-[#7e32e2]" : "text-[#aaa]"
                }`}
              >
                ค้นหาแบบรายปี
              </span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={searchType === "budget"}
                onChange={() => setSearchType("budget")}
                className="hidden"
              />
              <span
                className={`w-5 h-5 mr-2 rounded-full border-2 flex items-center justify-center transition-colors ${
                  searchType === "budget"
                    ? "border-[#7e32e2] bg-[#f6eeff]"
                    : "border-gray-300 bg-white"
                }`}
              >
                {searchType === "budget" && (
                  <span className="w-3 h-3 bg-[#7e32e2] rounded-full block" />
                )}
              </span>
              <span
                className={`font-medium ${
                  searchType === "budget" ? "text-[#7e32e2]" : "text-[#aaa]"
                }`}
              >
                ค้นหาแบบรายปีงบประมาณ
              </span>
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <div className="text-[14px] text-[#222] font-medium mb-1">ปี</div>
              <InputService
                options={YEARS}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="เลือกปี"
                name="year"
              />
            </div>
            <div>
              <div className="text-[14px] text-[#222] font-medium mb-1">
                เดือน
              </div>
              <InputService
                options={MONTHS}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="เลือกเดือน"
                name="month"
              />
            </div>
            <div>
              <div className="text-[14px] text-[#222] font-medium mb-1">
                สัปดาห์
              </div>
              <InputService
                options={WEEKS}
                value={week}
                onChange={(e) => setWeek(e.target.value)}
                placeholder="เลือกสัปดาห์"
                name="week"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div>
              <div className="text-[14px] text-[#222] font-medium mb-1">
                เขตสุขภาพ
              </div>
              <InputService
                options={ZONES}
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="เลือกเขตสุขภาพ"
                clearable={!isZoneHealth(zone)}
                name="zone"
                disabled={isZoneLocked}
                style={disabledStyle}
              />
            </div>
            <div>
              <div className="text-[14px] text-[#222] font-medium mb-1">
                จังหวัด
              </div>
              <InputService
                options={PROVINCES}
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="เลือกจังหวัด"
                name="province"
              />
            </div>
            <div>
              <div className="text-[14px] text-[#222] font-medium mb-1">
                อำเภอ
              </div>
              <InputService
                options={DISTRICTS}
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="เลือกอำเภอ"
                name="district"
              />
            </div>
            <div>
              <div className="text-[14px] text-[#222] font-medium mb-1">
                ตำบล
              </div>
              <InputService
                options={SUBDISTRICTS}
                value={subdistrict}
                onChange={(e) => setSubdistrict(e.target.value)}
                placeholder="เลือกตำบล"
                name="subdistrict"
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-3 mt-4">
            <ButtonService
              type="button"
              variant="primary"
              className="w-full md:w-fit flex-1 h-12 text-[18px] bg-[#7e32e2] hover:bg-[#6c28c8] border-none shadow-none text-white rounded-lg font-semibold flex items-center justify-center"
              icon={<Search className="w-5 h-5 mr-2 text-white" />}
            >
              ค้นหา
            </ButtonService>
            <ButtonService
              type="button"
              variant="secondary"
              className="w-full md:w-fit flex-1 h-12 text-[18px] bg-white border border-[#7e32e2] text-[#7e32e2] hover:bg-[#f6eeff] shadow-none rounded-lg font-semibold"
              onClick={() => {
                setYear("2568");
                setMonth("06");
                setWeek(WEEKS[3].value);
                setZone("");
                setProvince("");
                setDistrict("");
                setSubdistrict("");
                setSearchText("");
              }}
            >
              ล้างข้อมูลการค้นหา
            </ButtonService>
          </div>
        </div>
        <div className="flex gap-6 items-center border-b border-[#ece1f7] mb-2 flex-wrap">
          <button
            className={`text-[16px] px-2 py-2 font-medium rounded-t-md ${
              tab === "active"
                ? "text-[#7e32e2] border-b-2 border-[#7e32e2] bg-[#f6eeff]"
                : "text-[#231d37] bg-transparent hover:bg-[#f6eeff]"
            }`}
            onClick={() => {
              setTab("active");
              setCurrentPage(1);
            }}
          >
            รายชื่อผู้ใช้งาน
          </button>
          <button
            className={`text-[16px] px-2 py-2 font-medium rounded-t-md ${
              tab === "deleted"
                ? "text-[#7e32e2] border-b-2 border-[#7e32e2] bg-[#f6eeff]"
                : "text-[#231d37] bg-transparent hover:bg-[#f6eeff]"
            }`}
            onClick={() => {
              setTab("deleted");
              setCurrentPage(1);
            }}
          >
            บัญชีที่ยกเลิกสิทธิ์แล้ว
          </button>
        </div>
        <div className="flex flex-row items-center gap-3 mb-4 w-full flex-wrap">
          <div style={{ flex: 1, minWidth: 220, maxWidth: 400 }}>
            <InputService
              options={[]}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="ค้นหารายชื่อหรือเลขประจำตัวประชาชน"
              name="usersearch"
              iconLeft={<Search className="w-5 h-5 text-[#aaa]" />}
            />
          </div>
          <ButtonService
            type="button"
            variant="primary"
            className="px-8 py-2 rounded-lg font-medium text-[17px] bg-[#7e32e2] text-white flex items-center gap-2 whitespace-nowrap"
            icon={<Search className="w-5 h-5 text-white" />}
          >
            ค้นหา
          </ButtonService>
          <div style={{ flex: 1 }} />
          <div className="relative inline-block" ref={dropdownRef}>
            <button
              type="button"
              className={buttonStyle}
              style={{ minWidth: 260, boxShadow: "0 2px 8px #e5d9ff" }}
              onClick={() => setOpen((s) => !s)}
              aria-haspopup="true"
              aria-expanded={open}
            >
              <span className="flex items-center">
                <Download className={iconStyle + " w-5 h-5"} />
                ดาวน์โหลดเอกสาร
              </span>
              <span className={splitStyle}>
                <ChevronDown className={arrowStyle + " w-6 h-6"} />
              </span>
            </button>
            {open && (
              <div
                className="absolute z-30 left-0 mt-2 w-full bg-white shadow-lg rounded-xl border border-[#ece1f7] py-2"
                style={{ minWidth: 180 }}
              >
                <button
                  className="flex items-center w-full px-5 py-3 gap-2 text-[#222] text-[17px] hover:bg-[#f6eeff] transition font-medium"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  <img
                    src="/xlsx.png"
                    alt="Excel icon"
                    className="w-7 h-7"
                    style={{ display: "inline-block" }}
                  />
                  ดาวน์โหลดเอกสาร Excel
                </button>
                <button
                  className="flex items-center w-full px-5 py-3 gap-2 text-[#222] text-[17px] hover:bg-[#f6eeff] transition font-medium"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  <img
                    src="/pdf.png"
                    alt="PDF icon"
                    className="w-7 h-7"
                    style={{ display: "inline-block" }}
                  />
                  ดาวน์โหลดเอกสาร PDF
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="w-full overflow-x-auto">
          <table
            className="text-[15px] border-separate"
            style={{
              borderSpacing: 0,
              width: "100%",
              minWidth: "1200px",
            }}
          >
            <thead>
              <tr className="bg-[#f6eeff] text-[#7e32e2]">
                <th className="py-3 px-4 font-semibold text-center rounded-tl-xl">
                  ลำดับ
                </th>
                <th className="py-3 px-4 font-semibold text-left">
                  รายชื่อ ({totalItems} รายการ)
                </th>
                <th className="py-3 px-4 font-semibold text-center">
                  เลขประจำตัวประชาชน
                </th>
                <th className="py-3 px-4 font-semibold text-center">
                  ระดับตำแหน่ง
                </th>
                <th className="py-3 px-4 font-semibold text-center rounded-tr-xl">
                  จัดการข้อมูล
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-[#7e32e2] font-semibold bg-[#f9f6ff] text-[18px]"
                  >
                    ไม่พบข้อมูล
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((row, idx) => (
                  <tr
                    key={row.cid + idx}
                    className={`${
                      idx % 2 === 0 ? "bg-white" : "bg-[#f9f6ff]"
                    } hover:bg-[#f0ebff] transition-colors duration-150`}
                  >
                    <td className="py-3 px-4 text-center align-middle font-medium">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="py-3 px-4 align-middle">{row.name}</td>
                    <td className="py-3 px-4 text-center align-middle">
                      {row.cid}
                    </td>
                    <td className="py-3 px-4 text-center align-middle">
                      {row.position}
                    </td>
                    <td className="py-3 px-4 text-center align-middle">
                      {tab === "deleted" ? (
                        <ButtonService
                          type="button"
                          variant="success"
                          icon={<RefreshCcw />}
                          onClick={() => {
                            setSelectedUser(row);
                            setModalType("restore");
                            setModalOpen(true);
                          }}
                        >
                          <span>กู้คืนบัญชี</span>
                        </ButtonService>
                      ) : (
                        <ButtonService
                          type="button"
                          variant="secondary"
                          icon={<Eye />}
                          onClick={() => {
                            setSelectedUser(row);
                            setModalType("detail");
                            setModalOpen(true);
                          }}
                        >
                          <span>ดูรายละเอียด</span>
                        </ButtonService>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-[#f0ebff]">
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
        <UserDetailModal
          open={modalOpen}
          user={selectedUser}
          onClose={() => setModalOpen(false)}
          onDeactivate={handleDeactivateUser}
          onRestore={handleRestoreUser}
          isRestoreBtn={modalType === "restore"}
        />
      </div>
    </div>
  );
};

export default UserListComp;
