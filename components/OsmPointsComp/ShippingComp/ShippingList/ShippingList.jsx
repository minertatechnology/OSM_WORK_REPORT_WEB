import React, { useState, useEffect } from "react";
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
  { value: 20, label: "20" },
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
    </div>
  );
}

function DetailModal({ open, onClose, onApprove, data }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-2xl max-w-[480px] w-full p-7 relative animate-fadein">
        {/* Header */}
        <div className="font-bold text-lg text-[#6E28B7] mb-2">รายละเอียด</div>
        {/* ชื่อและตำแหน่ง */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex items-center gap-2 text-[#6E28B7] font-medium">
            <User2 size={18} />
            <span>ชื่อ-นามสกุล</span>
          </div>
          <div className="flex items-center gap-2 text-[#6E28B7] font-medium">
            <BadgeCheck size={18} />
            <span>ระดับตำแหน่ง</span>
          </div>
          <div className="col-span-1 pl-6 text-[#231d37]">
            {data.detail.name}
          </div>
          <div className="col-span-1 pl-6 text-[#231d37]">
            {data.detail.position}
          </div>
        </div>
        {/* สังกัดปัจจุบัน */}
        <div className="flex items-center gap-2 mb-3 text-[#6E28B7] font-medium">
          <Package size={18} />
          <span>สังกัดปัจจุบัน</span>
        </div>
        <div className="pl-6 mb-4 text-[#231d37]">{data.detail.hospital}</div>
        {/* ข้อมูลที่อยู่ */}
        <div className="font-bold mb-3 text-[#6E28B7]">ที่อยู่</div>
        <div className="grid grid-cols-2 gap-y-2 gap-x-7 text-[15px] text-[#231d37] mb-2">
          <div className="flex items-center gap-2">
            <Home size={16} />
            <span>บ้านเลขที่</span>
          </div>
          <div className="flex items-center gap-2">
            <LocateIcon size={16} />
            <span>ซอย</span>
          </div>
          <div className="pl-6">{data.detail.address.house}</div>
          <div className="pl-6">{data.detail.address.alley}</div>

          <div className="flex items-center gap-2">
            <Landmark size={16} />
            <span>หมู่ที่</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <span>ชุมชนบ้าน / ชุมชน</span>
          </div>
          <div className="pl-6">{data.detail.address.village}</div>
          <div className="pl-6">{data.detail.address.subArea}</div>

          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <span>จังหวัด</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <span>อำเภอ</span>
          </div>
          <div className="pl-6">{data.detail.address.province}</div>
          <div className="pl-6">{data.detail.address.district}</div>

          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <span>ตำบล</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail size={16} />
            <span>รหัสไปรษณีย์</span>
          </div>
          <div className="pl-6">{data.detail.address.subdistrict}</div>
          <div className="pl-6">{data.detail.address.zipcode}</div>
        </div>
        {/* Footer */}
        <div className="flex justify-between mt-9">
          <ButtonService
            variant="secondary"
            size="md"
            className="px-7"
            onClick={onClose}
          >
            ปิด
          </ButtonService>
          <ButtonService
            variant="primary"
            size="md"
            className="px-7"
            onClick={onApprove}
          >
            อนุมัติคำขอ
          </ButtonService>
        </div>
      </div>
    </div>
  );
}

const ShippingList = () => {
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

  return (
    <div>
      {/* Header */}
      <div className="w-full mb-5 font-bold text-[#6E28B7] text-[20px]">
        รายชื่อ อสม. ที่ขอแลกของรางวัล
      </div>
      {/* Tabs */}
      <div className="w-full flex items-center px-10 mt-2 mb-3">
        <div className="flex gap-4 border-b border-[#EAD8FF] w-full">
          {TABS.map((tab) => (
            <div
              key={tab.key}
              className={`cursor-pointer font-bold pb-2 px-4 transition ${
                activeTab === tab.key
                  ? "text-[#6E28B7] border-b-2 border-[#6E28B7] bg-none"
                  : "text-[#B7B7B7] border-b-2 border-transparent bg-none"
              }`}
              onClick={() => setActiveTab(tab.key)}
              role="tab"
              aria-selected={activeTab === tab.key}
              tabIndex={0}
            >
              {tab.label}
            </div>
          ))}
        </div>
      </div>
      {/* Search */}
      <div className="w-full flex items-center mb-4 gap-2">
        <InputService
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อและนามสกุล"
        />
        <ButtonService variant="primary" size="md">
          ค้นหา
        </ButtonService>
      </div>
      {/* Table */}
      <div className="w-full">
        <table className="w-full border-separate [border-spacing:0] rounded-xl overflow-hidden">
          <thead>
            <tr>
              <th className="bg-[#EAD8FF] text-[#6E28B7] font-bold py-3 px-2 text-[16px] border-b border-[#dadada] rounded-tl-xl">
                ลำดับ
              </th>
              <th className="bg-[#EAD8FF] text-[#6E28B7] font-bold py-3 px-2 text-[16px] border-b border-[#dadada]">
                รายชื่อ (100 รายการ)
              </th>
              <th className="bg-[#EAD8FF] text-[#6E28B7] font-bold py-3 px-2 text-[16px] border-b border-[#dadada]">
                วันที่สั่งคำขอ
              </th>
              <th className="bg-[#EAD8FF] text-[#6E28B7] font-bold py-3 px-2 text-[16px] border-b border-[#dadada]">
                สถานะการจัดส่ง
              </th>
              {/* ถ้าเป็น tab รอยืนยัน ให้มีคอลัมน์ อนุมัติ */}
              {activeTab === "รอยืนยัน" && (
                <th className="bg-[#EAD8FF] text-[#6E28B7] font-bold py-3 px-2 text-[16px] border-b border-[#dadada] rounded-tr-xl">
                  อนุมัติ
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedList.map((row, idx) => (
              <tr key={row.no} className="border-b border-[#F2EFFF]">
                <td className="py-3 text-center text-[#231d37] text-[15px] font-normal">
                  {/* ลำดับใหม่ในแต่ละหน้า */}
                  {(currentPage - 1) * itemsPerPage + idx + 1}
                </td>
                <td className="py-3 text-center text-[#231d37] text-[15px] font-normal">
                  {row.name}
                </td>
                <td className="py-3 text-center text-[#231d37] text-[15px] font-normal">
                  {row.date}
                </td>
                <td
                  className={`py-3 text-center text-[15px] font-bold ${
                    row.status === "จัดส่งแล้ว"
                      ? "text-[#2AC769]"
                      : "text-[#FF7A00]"
                  }`}
                >
                  {row.status}
                </td>
                {/* ถ้าเป็น tab รอยืนยัน ให้มีปุ่มอนุมัติ */}
                {activeTab === "รอยืนยัน" && (
                  <td className="py-3">
                    <div className="flex justify-center">
                      <ButtonService
                        variant="secondary"
                        size="md"
                        className="flex items-center gap-2 px-4 py-1 rounded-lg border border-[#dadada] bg-[#F8F7FD] text-[#6E28B7] font-bold text-[15px] shadow-sm min-w-[118px] justify-center box-shadow-none"
                        icon={
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                          >
                            <circle cx="10" cy="10" r="10" fill="#6E28B7" />
                            <path
                              d="M6 10.5L9 13.5L14 8.5"
                              stroke="white"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        }
                        onClick={() => handleOpenModal(row)}
                      >
                        อนุมัติคำขอ
                      </ButtonService>
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
