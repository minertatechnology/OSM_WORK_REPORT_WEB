import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
  Gift,
  Star,
  Package,
  Calendar,
  Coins,
  Search,
  Filter,
  Eye,
} from "lucide-react";
import alertService from "@services/alertService/alertService";

// Pagination utility function for page numbers with ellipsis
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

const PER_PAGE_OPTIONS = [
  { label: "10", value: 10 },
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
];

// Modal component for "เพิ่มของรางวัล"
function AddRewardModal({ open, onClose, onAdd }) {
  // Image upload preview {url, file}
  const [imageObj, setImageObj] = useState(null);
  const imageUrlRef = useRef(null);
  // Add key for img preview
  const [imgKey, setImgKey] = useState(0);

  // Form fields
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [points, setPoints] = useState("");
  const [totalCount, setTotalCount] = useState("");
  const [limit, setLimit] = useState("");

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      // ไม่ต้อง revoke URL เดิม
      const url = URL.createObjectURL(file);
      imageUrlRef.current = url;
      setImageObj({ url, file });
      setImgKey(Date.now()); // เปลี่ยน key ทุกครั้ง
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      imageUrlRef.current = url;
      setImageObj({ url, file });
      setImgKey(Date.now());
    }
  }

  function handleRemoveImage() {
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current);
      imageUrlRef.current = null;
    }
    setImageObj(null);
    setImgKey(Date.now());
  }

  // cleanup on close/unmount
  React.useEffect(() => {
    if (!open) {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
        imageUrlRef.current = null;
      }
      setImageObj(null);
      setName("");
      setDesc("");
      setStartDate("");
      setEndDate("");
      setPoints("");
      setTotalCount("");
      setLimit("");
      setImgKey(Date.now());
    }
    return () => {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
        imageUrlRef.current = null;
      }
    };
    // eslint-disable-next-line
  }, [open]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name || !imageObj) return; // Minimal validation
    onAdd({
      image: imageObj.url,
      name,
      desc,
      startDate,
      endDate,
      points,
      totalCount,
      limit,
    });
    onClose();
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-2xl shadow-xl border border-[#ece1f7] w-[98vw] max-w-5xl p-8 relative">
        <div className="font-bold text-[#7e32e2] text-[20px] mb-5">
          เพิ่มของรางวัล
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image upload section */}
            <div className="flex flex-col items-center">
              <label
                htmlFor="reward-image"
                className={`flex flex-col items-center justify-center border-2 border-dashed border-[#dadada] rounded-xl h-48 cursor-pointer transition hover:border-[#7e32e2] mb-2 bg-[#faf8ff] relative w-full`}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                style={{ overflow: "hidden" }}
              >
                {imageObj ? (
                  <Image
                    key={imgKey}
                    src={imageObj.url}
                    alt="preview"
                    fill
                    className="object-contain rounded-xl"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <Image
                      src="https://cdn-icons-png.flaticon.com/512/109/109612.png"
                      alt="upload"
                      width={48}
                      height={48}
                      className="w-12 h-12 mb-2 opacity-60"
                    />
                    <span className="text-[#888] font-medium text-[16px] text-center">
                      เลือกไฟล์หรือวางไฟล์ในพื้นที่ที่กำหนดเพื่อดำเนินการอัปโหลด
                    </span>
                  </div>
                )}
                <input
                  id="reward-image"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
              {imageObj && (
                <button
                  type="button"
                  className="mt-2 flex items-center gap-1 px-3 py-1 rounded-lg border border-[#e23a3a] bg-white text-[#e23a3a] font-medium shadow hover:bg-[#ffe5e5] transition text-[14px]"
                  onClick={handleRemoveImage}
                >
                  <X size={16} />
                  ลบรูป
                </button>
              )}
            </div>
            {/* Reward name and details */}
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-[#7e32e2] font-semibold mb-1 text-[15px]">
                  ชื่อรางวัล
                </label>
                <input
                  type="text"
                  placeholder="ระบุชื่อรางวัล"
                  className="w-full border border-[#ece1f7] rounded-xl px-4 py-2 text-[16px] bg-[#faf8ff] focus:outline-none focus:ring-2 focus:ring-[#7e32e2]"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-[#7e32e2] font-semibold mb-1 text-[15px]">
                  รายละเอียดของรางวัล
                </label>
                <textarea
                  placeholder="ระบุรายละเอียด"
                  rows={4}
                  className="w-full border border-[#ece1f7] rounded-xl px-4 py-2 text-[16px] bg-[#faf8ff] focus:outline-none focus:ring-2 focus:ring-[#7e32e2] resize-none"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
              </div>
            </div>
          </div>
          {/* Grid for rest of the fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-[#7e32e2] font-semibold mb-1 text-[15px]">
                วันที่เริ่มต้นโปรโมชั่น
              </label>
              <input
                type="date"
                className="w-full border border-[#ece1f7] rounded-xl px-4 py-2 text-[16px] bg-[#faf8ff] focus:outline-none focus:ring-2 focus:ring-[#7e32e2]"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[#7e32e2] font-semibold mb-1 text-[15px]">
                วันที่สิ้นสุดโปรโมชั่น
              </label>
              <input
                type="date"
                className="w-full border border-[#ece1f7] rounded-xl px-4 py-2 text-[16px] bg-[#faf8ff] focus:outline-none focus:ring-2 focus:ring-[#7e32e2]"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[#7e32e2] font-semibold mb-1 text-[15px]">
                คะแนนที่ต้องใช้
              </label>
              <input
                type="number"
                placeholder="ระบุคะแนนที่ต้องใช้"
                className="w-full border border-[#ece1f7] rounded-xl px-4 py-2 text-[16px] bg-[#faf8ff] focus:outline-none focus:ring-2 focus:ring-[#7e32e2]"
                min={0}
                value={points}
                onChange={(e) => setPoints(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[#7e32e2] font-semibold mb-1 text-[15px]">
                จำนวนรายการทั้งหมด
              </label>
              <input
                type="number"
                placeholder="ระบุจำนวน"
                className="w-full border border-[#ece1f7] rounded-xl px-4 py-2 text-[16px] bg-[#faf8ff] focus:outline-none focus:ring-2 focus:ring-[#7e32e2]"
                min={0}
                value={totalCount}
                onChange={(e) => setTotalCount(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[#7e32e2] font-semibold mb-1 text-[15px]">
                กำหนดจำนวนสิทธิ์
              </label>
              <input
                type="number"
                placeholder="ระบุจำนวนสิทธิ์"
                className="w-full border border-[#ece1f7] rounded-xl px-4 py-2 text-[16px] bg-[#faf8ff] focus:outline-none focus:ring-2 focus:ring-[#7e32e2]"
                min={0}
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              />
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-10 gap-3">
            <button
              type="button"
              className="flex items-center gap-2 px-7 py-3 rounded-xl border border-[#7e32e2] bg-white text-[#7e32e2] font-semibold text-[17px] shadow hover:bg-[#f6eeff] transition"
              onClick={onClose}
            >
              <ChevronLeft size={18} />
              กลับหน้าแรก
            </button>
            <button
              type="submit"
              className="flex items-center px-12 py-3 rounded-xl border-none bg-[#7e32e2] text-white font-semibold text-[18px] shadow hover:bg-[#691dc9] transition"
            >
              เพิ่ม
            </button>
          </div>
        </form>
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
      {totalPages > 1 && (
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
        <div className="ml-3 text-sm text-[#888] font-semibold bg-[#f6eeff] px-4 py-2 rounded-xl shadow whitespace-nowrap">
          หน้า {currentPage} / {totalPages}
        </div>
      </div>
      )}
    </div>
  );
}

// Mock data สำหรับรางวัล - ใช้รูปสินค้าจริงจาก Unsplash
const mockRewardsData = [
  {
    id: 1,
    name: "เสื้อโปโล OSM",
    description: "เสื้อโปโลคุณภาพดี สีม่วง พร้อมโลโก้ OSM",
    imageUrl: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=400&h=400&fit=crop",
    points: 500,
    totalCount: 50,
    remainingCount: 35,
    limit: 1,
    startDate: "2025-01-01",
    endDate: "2025-12-31",
  },
  {
    id: 2,
    name: "กระเป๋าผ้า OSM",
    description: "กระเป๋าผ้าแคนวาส ทนทาน จุของได้เยอะ",
    imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&h=400&fit=crop",
    points: 800,
    totalCount: 30,
    remainingCount: 20,
    limit: 1,
    startDate: "2025-01-01",
    endDate: "2025-12-31",
  },
  {
    id: 3,
    name: "แก้วน้ำสแตนเลส",
    description: "แก้วน้ำสแตนเลส เก็บความเย็น 24 ชม.",
    imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop",
    points: 1200,
    totalCount: 40,
    remainingCount: 28,
    limit: 1,
    startDate: "2025-01-01",
    endDate: "2025-12-31",
  },
  {
    id: 5,
    name: "Power Bank 10000mAh",
    description: "แบตสำรอง ความจุ 10000mAh ชาร์จเร็ว",
    imageUrl: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop",
    points: 2500,
    totalCount: 20,
    remainingCount: 12,
    limit: 1,
    startDate: "2025-01-01",
    endDate: "2025-12-31",
  },
  {
    id: 6,
    name: "หูฟังบลูทูธ",
    description: "หูฟังบลูทูธไร้สาย คุณภาพเสียงดี",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    points: 3500,
    totalCount: 15,
    remainingCount: 8,
    limit: 1,
    startDate: "2025-01-01",
    endDate: "2025-12-31",
  },
  {
    id: 7,
    name: "นาฬิกาสมาร์ทวอทช์",
    description: "สมาร์ทวอทช์ วัดชีพจร นับก้าว แจ้งเตือน",
    imageUrl: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=400&fit=crop",
    points: 5000,
    totalCount: 10,
    remainingCount: 5,
    limit: 1,
    startDate: "2025-01-01",
    endDate: "2025-12-31",
  },
  {
    id: 8,
    name: "แท็บเล็ต 10 นิ้ว",
    description: "แท็บเล็ต 10 นิ้ว RAM 4GB ROM 64GB",
    imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop",
    points: 8000,
    totalCount: 5,
    remainingCount: 3,
    limit: 1,
    startDate: "2025-01-01",
    endDate: "2025-12-31",
  },
  {
    id: 9,
    name: "บัตรของขวัญ 1000 บาท",
    description: "บัตรของขวัญมูลค่า 1000 บาท ใช้ได้ทุกสาขา",
    imageUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&h=400&fit=crop",
    points: 10000,
    totalCount: 20,
    remainingCount: 12,
    limit: 1,
    startDate: "2025-01-01",
    endDate: "2025-12-31",
  },
  {
    id: 11,
    name: "โน้ตบุ๊ค",
    description: "โน้ตบุ๊ค Intel Core i5 RAM 8GB SSD 256GB",
    imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop",
    points: 15000,
    totalCount: 3,
    remainingCount: 2,
    limit: 1,
    startDate: "2025-01-01",
    endDate: "2025-12-31",
  },
];

// Helper function to get stock status
function getStockStatus(remaining, total) {
  const percentage = (remaining / total) * 100;
  if (percentage <= 10) return { label: "ใกล้หมด", color: "bg-red-500", textColor: "text-red-600" };
  if (percentage <= 30) return { label: "เหลือน้อย", color: "bg-orange-500", textColor: "text-orange-600" };
  return { label: "มีสินค้า", color: "bg-green-500", textColor: "text-green-600" };
}

// Reward Card Component
function RewardCard({ reward, onDelete, index }) {
  const stockStatus = getStockStatus(reward.remainingCount || reward.totalCount, reward.totalCount);
  const stockPercentage = ((reward.remainingCount || reward.totalCount) / reward.totalCount) * 100;

  return (
    <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-[#f0ebff] hover:border-[#c4a8ff] hover:-translate-y-1">
      {/* Points Badge */}
      <div className="absolute top-3 right-3 z-10">
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#7e32e2] to-[#a855f7] text-white font-bold text-sm shadow-lg">
          <Coins size={14} />
          <span>{reward.points?.toLocaleString() || 0}</span>
        </div>
      </div>

      {/* Image Section */}
      <div className="relative h-48 bg-gradient-to-br from-[#f8f4ff] to-[#ede4ff] flex items-center justify-center overflow-hidden">
        {reward.imageUrl || reward.image ? (
          <Image
            src={reward.imageUrl || reward.image}
            alt={reward.name}
            fill
            className="object-contain p-4 group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-[#c4a8ff]">
            <Gift size={64} strokeWidth={1.5} />
            <span className="text-sm mt-2">ไม่มีรูปภาพ</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-bold text-[#231d37] text-lg mb-2 line-clamp-1 group-hover:text-[#7e32e2] transition-colors">
          {reward.name}
        </h3>

        {/* Description */}
        <p className="text-gray-500 text-sm mb-3 line-clamp-2 min-h-[40px]">
          {reward.description || "ไม่มีรายละเอียด"}
        </p>

        {/* Date Range */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <Calendar size={14} className="text-[#7e32e2]" />
          <span>
            {reward.startDate && reward.endDate
              ? `${formatThaiDate(reward.startDate)} - ${formatThaiDate(reward.endDate)}`
              : "ไม่ระบุระยะเวลา"}
          </span>
        </div>

        {/* Stock Status */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <Package size={14} />
              คงเหลือ
            </span>
            <span className={`text-sm font-semibold ${stockStatus.textColor}`}>
              {reward.remainingCount || reward.totalCount}/{reward.totalCount} ชิ้น
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${stockStatus.color} rounded-full transition-all duration-500`}
              style={{ width: `${stockPercentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className={`text-xs font-medium ${stockStatus.textColor}`}>
              {stockStatus.label}
            </span>
            <span className="text-xs text-gray-400">
              จำกัด {reward.limit || 1} ชิ้น/คน
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#7e32e2] to-[#a855f7] text-white font-semibold text-sm shadow-md hover:shadow-lg hover:from-[#6b28c9] hover:to-[#9333ea] transition-all duration-200"
            onClick={() => {}}
          >
            <Eye size={16} />
            ดูรายละเอียด
          </button>
          <button
            className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border-2 border-red-200 text-red-500 font-semibold text-sm hover:bg-red-50 hover:border-red-300 transition-all duration-200"
            onClick={() => onDelete(index)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

const RedeemComp = () => {
  // Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Rewards list - เริ่มต้นด้วย mock data
  const [rewards, setRewards] = useState(mockRewardsData);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Filter rewards by search
  const filteredRewards = rewards.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Derived pagination
  const totalItems = filteredRewards.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedRewards = filteredRewards.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Add reward handler
  function handleAddReward(data) {
    setRewards((prev) => [data, ...prev]);
    setPage(1);
  }

  // Delete reward (with confirm)
  async function handleDeleteReward(idx) {
    const result = await alertService.confirm(
      "ยืนยันการลบของรางวัลนี้?",
      "หากลบแล้วจะไม่สามารถกู้คืนได้"
    );
    if (result.isConfirmed) {
      const actualIdx = (page - 1) * itemsPerPage + idx;
      setRewards((prev) => prev.filter((_, i) => i !== actualIdx));
      alertService.success("ลบของรางวัลเรียบร้อยแล้ว");
    }
  }

  // Stats calculations
  const totalRewards = rewards.length;
  const totalStock = rewards.reduce((sum, r) => sum + (r.totalCount || 0), 0);
  const remainingStock = rewards.reduce((sum, r) => sum + (r.remainingCount || r.totalCount || 0), 0);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#faf8ff] via-white to-[#f5f0ff] p-4 sm:p-6">
      {/* Modal */}
      <AddRewardModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAddReward}
      />

      {/* Header Section with Gradient */}
      <div className="relative mb-8 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7e32e2] via-[#9333ea] to-[#a855f7]" />
        <div className="absolute inset-0 bg-white/5" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Title & Stats */}
            <div className="text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Gift size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">เกณฑ์การแลกรางวัล</h1>
                  <p className="text-white/80 text-sm mt-1">จัดการของรางวัลและคะแนนสะสม</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
                  <Package size={18} />
                  <span className="font-semibold">{totalRewards}</span>
                  <span className="text-white/80 text-sm">รางวัลทั้งหมด</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
                  <Star size={18} />
                  <span className="font-semibold">{remainingStock.toLocaleString()}</span>
                  <span className="text-white/80 text-sm">/ {totalStock.toLocaleString()} ชิ้น</span>
                </div>
              </div>
            </div>

            {/* Add Button */}
            <button
              className="flex items-center gap-2 px-6 py-3 bg-white text-[#7e32e2] font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              onClick={() => setAddModalOpen(true)}
            >
              <Plus size={20} />
              เพิ่มของรางวัล
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <div className="relative flex-1 w-full">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาของรางวัล..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-[#ece1f7] bg-white focus:outline-none focus:border-[#7e32e2] focus:ring-2 focus:ring-[#7e32e2]/20 transition-all duration-200 text-[15px]"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border-2 border-[#ece1f7]">
          <Filter size={18} className="text-[#7e32e2]" />
          <span className="text-gray-600 text-sm">
            แสดง <span className="font-bold text-[#7e32e2]">{filteredRewards.length}</span> รายการ
          </span>
        </div>
      </div>

      {/* Rewards Grid */}
      {paginatedRewards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-[#ece1f7]">
          <Gift size={64} className="text-[#c4a8ff] mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">ไม่พบของรางวัล</h3>
          <p className="text-gray-400 text-center mb-6">
            {searchTerm ? "ลองค้นหาด้วยคำอื่น หรือ" : "ยังไม่มีของรางวัลในระบบ"}
          </p>
          <button
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7e32e2] to-[#a855f7] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            onClick={() => setAddModalOpen(true)}
          >
            <Plus size={18} />
            เพิ่มของรางวัลใหม่
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedRewards.map((reward, idx) => (
            <RewardCard
              key={reward.id || idx}
              reward={reward}
              onDelete={handleDeleteReward}
              index={idx}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredRewards.length > 0 && (
        <PaginationWithPerPage
          currentPage={page}
          setCurrentPage={setPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
        />
      )}
    </div>
  );
};

// Helper to format date as 'd/m/yyyy' in Thai
function formatThaiDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

export default RedeemComp;
