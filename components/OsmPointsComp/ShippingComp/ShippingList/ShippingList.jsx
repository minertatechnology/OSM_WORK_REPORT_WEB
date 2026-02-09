import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ButtonService from "@services/buttonService/buttonService";
import InputService from "@services/inputService/inputService";
import {
  ChevronLeft,
  ChevronsLeft,
  ChevronRight,
  ChevronsRight,
  User2,
  MapPin,
  Home,
  Landmark,
  LocateIcon,
  Mail,
  BadgeCheck,
  Package,
  TruckIcon,
  CheckCircle,
  Clock,
  ArrowLeft,
  Search,
  Filter,
} from "lucide-react";
import alertService from "@services/alertService/alertService";

// Mock data
const list = Array.from({ length: 100 }).map((_, idx) => ({
  no: idx + 1,
  name: "นางสาวชุชนาถ ผดุงจิตร",
  date: "1/1/2568",
  status: idx % 2 === 0 ? "รอยืนยัน" : "จัดส่งแล้ว",
  approved: true,
  // เพิ่มข้อมูลสำหรับ Modal
  detail: {
    name: "นางสาวชุชนาถ ผดุงจิตร",
    position: "อสม. ทั่วไป",
    hospital: "โรงพยาบาลส่งเสริมสุขภาพตำบลไผ่ล้อม",
    address: {
      house: "99/99",
      village: "หมู่ 1",
      alley: "-",
      subArea: "-",
      province: "นนทบุรี",
      district: "เมืองนนทบุรี",
      subdistrict: "ท่าทราย",
      zipcode: "11000",
    },
  },
}));

const TABS = [
  { key: "รอยืนยัน", label: "รอยืนยัน" },
  { key: "จัดส่งแล้ว", label: "จัดส่งแล้ว" },
];

const PER_PAGE_OPTIONS = [
  { value: 10, label: "10" },
  { value: 25, label: "25" },
  { value: 50, label: "50" },
  { value: 100, label: "100" },
];

// ฟังก์ชันสร้าง page number (แบบมี ... เช่น [1,2,3,...,10])
function getPageNumbers(currentPage, totalPages) {
  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      );
    } else {
      pages.push(
        1,
        "...",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "...",
        totalPages
      );
    }
  }
  return pages;
}

function PaginationWithPerPage({
  currentPage,
  setCurrentPage,
  totalPages,
  itemsPerPage,
  setItemsPerPage,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 mb-10 pt-4 border-t border-[#f0ebff] w-full">
      {/* Per page selector */}
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
      {/* Pagination */}
      {totalPages > 1 && (
      <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-[#ece1f7] shadow-lg backdrop-blur-sm">
        {/* First page */}
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
        {/* Prev page */}
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
        {/* Page numbers */}
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
        {/* Next page */}
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
        {/* Last page */}
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
      )}
    </div>
  );
}

function DetailModal({ open, onClose, onApprove, data }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-[520px] w-full mx-4 overflow-hidden border-2 border-[#f0ebff]">
        {/* Header with Gradient */}
        <div className="relative p-6 bg-gradient-to-r from-[#7e32e2] via-[#9333ea] to-[#a855f7]">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <User2 size={24} />
            </div>
            <h2 className="text-xl font-bold">รายละเอียดผู้ขอแลกรางวัล</h2>
          </div>
        </div>

        <div className="p-6">
          {/* ชื่อและตำแหน่ง */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#faf8ff] p-4 rounded-xl border border-[#f0ebff]">
              <div className="flex items-center gap-2 text-[#7e32e2] font-semibold mb-2 text-sm">
                <User2 size={16} />
                <span>ชื่อ-นามสกุล</span>
              </div>
              <div className="text-[#231d37] font-medium pl-6">
                {data.detail.name}
              </div>
            </div>
            <div className="bg-[#faf8ff] p-4 rounded-xl border border-[#f0ebff]">
              <div className="flex items-center gap-2 text-[#7e32e2] font-semibold mb-2 text-sm">
                <BadgeCheck size={16} />
                <span>ระดับตำแหน่ง</span>
              </div>
              <div className="text-[#231d37] font-medium pl-6">
                {data.detail.position}
              </div>
            </div>
          </div>

          {/* สังกัดปัจจุบัน */}
          <div className="bg-[#faf8ff] p-4 rounded-xl border border-[#f0ebff] mb-6">
            <div className="flex items-center gap-2 text-[#7e32e2] font-semibold mb-2 text-sm">
              <Package size={16} />
              <span>สังกัดปัจจุบัน</span>
            </div>
            <div className="text-[#231d37] font-medium pl-6">
              {data.detail.hospital}
            </div>
          </div>

          {/* ข้อมูลที่อยู่ */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-4 text-[#7e32e2] font-bold text-base">
              <MapPin size={18} />
              <span>ข้อมูลที่อยู่</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white p-3 rounded-lg border border-[#ece1f7]">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Home size={14} className="text-[#7e32e2]" />
                  <span className="text-xs">บ้านเลขที่</span>
                </div>
                <div className="pl-5 font-medium text-[#231d37]">
                  {data.detail.address.house}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#ece1f7]">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Landmark size={14} className="text-[#7e32e2]" />
                  <span className="text-xs">หมู่ที่</span>
                </div>
                <div className="pl-5 font-medium text-[#231d37]">
                  {data.detail.address.village}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#ece1f7]">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <LocateIcon size={14} className="text-[#7e32e2]" />
                  <span className="text-xs">ซอย</span>
                </div>
                <div className="pl-5 font-medium text-[#231d37]">
                  {data.detail.address.alley}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#ece1f7]">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <MapPin size={14} className="text-[#7e32e2]" />
                  <span className="text-xs">ชุมชนบ้าน/ชุมชน</span>
                </div>
                <div className="pl-5 font-medium text-[#231d37]">
                  {data.detail.address.subArea}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#ece1f7]">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <MapPin size={14} className="text-[#7e32e2]" />
                  <span className="text-xs">จังหวัด</span>
                </div>
                <div className="pl-5 font-medium text-[#231d37]">
                  {data.detail.address.province}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#ece1f7]">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <MapPin size={14} className="text-[#7e32e2]" />
                  <span className="text-xs">อำเภอ</span>
                </div>
                <div className="pl-5 font-medium text-[#231d37]">
                  {data.detail.address.district}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#ece1f7]">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <MapPin size={14} className="text-[#7e32e2]" />
                  <span className="text-xs">ตำบล</span>
                </div>
                <div className="pl-5 font-medium text-[#231d37]">
                  {data.detail.address.subdistrict}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#ece1f7]">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Mail size={14} className="text-[#7e32e2]" />
                  <span className="text-xs">รหัสไปรษณีย์</span>
                </div>
                <div className="pl-5 font-medium text-[#231d37]">
                  {data.detail.address.zipcode}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-[#f0ebff]">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border-2 border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-all duration-200"
            >
              ปิด
            </button>
            <button
              onClick={onApprove}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7e32e2] to-[#9333ea] text-white font-semibold shadow-md hover:shadow-lg hover:from-[#6b28c9] hover:to-[#8333d8] transition-all duration-200"
            >
              <CheckCircle size={16} />
              อนุมัติคำขอ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const ShippingList = () => {
  const router = useRouter();

  // Pagination state
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(TABS[0].key);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  // List state (for changing status)
  const [tableList, setTableList] = useState(list);

  // Filter list by tab and search
  const filteredList = tableList.filter(
    (row) =>
      row.status === activeTab && (search === "" || row.name.includes(search))
  );
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const paginatedList = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page to 1 if activeTab or search or itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, itemsPerPage]);

  // เปิด Modal
  const handleOpenModal = (row) => {
    setSelectedRow(row);
    setModalOpen(true);
  };

  // ปิด Modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRow(null);
  };

  // กดอนุมัติ
  const handleApprove = () => {
    if (!selectedRow) return;
    setTableList((prev) =>
      prev.map((item) =>
        item.no === selectedRow.no ? { ...item, status: "จัดส่งแล้ว" } : item
      )
    );
    handleCloseModal();
    alertService.success("อนุมัติคำขอสำเร็จ");
  };

  // Stats
  const pendingCount = tableList.filter(
    (row) => row.status === "รอยืนยัน"
  ).length;
  const shippedCount = tableList.filter(
    (row) => row.status === "จัดส่งแล้ว"
  ).length;

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#faf8ff] via-white to-[#f5f0ff] p-4 sm:p-6">
      {/* Header Section with Gradient */}
      <div className="relative mb-8 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7e32e2] via-[#9333ea] to-[#a855f7]" />
        <div className="absolute inset-0 bg-white/5" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-6">
            {/* Back Button and Title */}
            <div className="text-white">
              <button
                onClick={() => router.push("/osm-points/shipping")}
                className="flex items-center gap-2 px-4 py-2 mb-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl transition-all duration-200 w-fit"
              >
                <ArrowLeft size={20} />
                <span className="font-semibold">กลับ</span>
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <TruckIcon size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    รายชื่อ อสม. ที่ขอแลกของรางวัล
                  </h1>
                  <p className="text-white/80 text-sm mt-1">
                    ตรวจสอบและอนุมัติคำขอแลกรางวัล
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
                  <Clock size={18} />
                  <span className="font-semibold">{pendingCount}</span>
                  <span className="text-white/80 text-sm">รอยืนยัน</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
                  <CheckCircle size={18} />
                  <span className="font-semibold">{shippedCount}</span>
                  <span className="text-white/80 text-sm">จัดส่งแล้ว</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <div className="relative flex-1 w-full">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="ค้นหาชื่อและนามสกุล..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-[#ece1f7] bg-white focus:outline-none focus:border-[#7e32e2] focus:ring-2 focus:ring-[#7e32e2]/20 transition-all duration-200 text-[15px]"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border-2 border-[#ece1f7]">
          <Filter size={18} className="text-[#7e32e2]" />
          <span className="text-gray-600 text-sm">
            แสดง{" "}
            <span className="font-bold text-[#7e32e2]">
              {filteredList.length}
            </span>{" "}
            รายการ
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="w-full bg-white rounded-2xl shadow-lg border border-[#f0ebff] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-[#7e32e2] via-[#9333ea] to-[#a855f7]">
              <th className="text-white font-bold py-4 px-4 text-[16px] text-center">
                ลำดับ
              </th>
              <th className="text-white font-bold py-4 px-4 text-[16px] text-left">
                ชื่อ-นามสกุล
              </th>
              <th className="text-white font-bold py-4 px-4 text-[16px] text-center">
                วันที่สั่งคำขอ
              </th>
              <th className="text-white font-bold py-4 px-4 text-[16px] text-center">
                สถานะการจัดส่ง
              </th>
              {activeTab === "รอยืนยัน" && (
                <th className="text-white font-bold py-4 px-4 text-[16px] text-center">
                  อนุมัติ
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedList.map((row, idx) => (
              <tr
                key={row.no}
                className="border-b border-[#f0ebff] hover:bg-[#faf8ff] transition-colors duration-150"
              >
                <td className="py-4 px-4 text-center text-[#231d37] text-[15px] font-semibold">
                  {(currentPage - 1) * itemsPerPage + idx + 1}
                </td>
                <td className="py-4 px-4 text-left text-[#231d37] text-[15px] font-medium">
                  {row.name}
                </td>
                <td className="py-4 px-4 text-center text-gray-600 text-[15px]">
                  {row.date}
                </td>
                <td className="py-4 px-4 text-center">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
                      row.status === "จัดส่งแล้ว"
                        ? "bg-green-50 text-green-600 border border-green-200"
                        : "bg-orange-50 text-orange-600 border border-orange-200"
                    }`}
                  >
                    {row.status === "จัดส่งแล้ว" ? (
                      <CheckCircle size={14} />
                    ) : (
                      <Clock size={14} />
                    )}
                    {row.status}
                  </span>
                </td>
                {activeTab === "รอยืนยัน" && (
                  <td className="py-4 px-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleOpenModal(row)}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#7e32e2] to-[#9333ea] text-white font-semibold text-sm shadow-md hover:shadow-lg hover:from-[#6b28c9] hover:to-[#8333d8] transition-all duration-200"
                      >
                        <CheckCircle size={16} />
                        อนุมัติคำขอ
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        <PaginationWithPerPage
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
        />
      </div>

      <DetailModal
        open={modalOpen}
        onClose={handleCloseModal}
        onApprove={handleApprove}
        data={selectedRow || { detail: { address: {} } }}
      />
    </div>
  );
};

export default ShippingList;
