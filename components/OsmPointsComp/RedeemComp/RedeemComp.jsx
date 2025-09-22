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
  { label: "20", value: 20 },
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
    </div>
  );
}

const RedeemComp = () => {
  // Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Rewards list
  const [rewards, setRewards] = useState([]);

  // Pagination state
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Derived pagination
  const totalItems = rewards.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedRewards = rewards.slice(
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
      setRewards((prev) => prev.filter((_, i) => i !== idx));
      alertService.success("ลบของรางวัลเรียบร้อยแล้ว");
    }
  }

  return (
    <div className="w-full h-full bg-transparent p-0 m-0">
      {/* Modal */}
      <AddRewardModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAddReward}
      />
      {/* Header & Add button */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-3 mt-2 px-2 gap-2">
        <div className="font-bold text-[#7e32e2] text-[18px]">
          เกณฑ์การแลกรางวัล
        </div>
        <button
          className="flex items-center gap-2 px-5 py-2 border border-[#7e32e2] rounded-xl bg-white text-[#7e32e2] font-semibold shadow hover:bg-[#f6eeff] transition text-[16px] whitespace-nowrap"
          style={{ minWidth: 180 }}
          onClick={() => setAddModalOpen(true)}
        >
          <Plus size={18} className="mr-2" />
          เพิ่มของรางวัล
        </button>
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table
          className="w-full border-separate rounded-xl shadow-lg"
          style={{
            borderSpacing: 0,
            minWidth: 600,
            background: "white",
            border: "1px solid #ece1f7",
          }}
        >
          <thead>
            <tr style={{ background: "#ead5ff" }} className="text-[#7e32e2]">
              <th className="py-3 px-2 sm:px-4 font-semibold text-center rounded-tl-xl border-b border-[#ece1f7] text-[16px] whitespace-nowrap">
                รูปภาพ
              </th>
              <th className="py-3 px-2 sm:px-4 font-semibold text-center border-b border-[#ece1f7] text-[16px] whitespace-nowrap">
                ชื่อรางวัล
              </th>
              <th className="py-3 px-2 sm:px-4 font-semibold text-center border-b border-[#ece1f7] text-[16px] whitespace-nowrap">
                ระยะเวลา
              </th>
              <th className="py-3 px-2 sm:px-4 font-semibold text-center border-b border-[#ece1f7] text-[16px] whitespace-nowrap">
                คะแนนที่ต้องใช้
              </th>
              <th className="py-3 px-2 sm:px-4 font-semibold text-center border-b border-[#ece1f7] text-[16px] whitespace-nowrap">
                จำนวนทั้งหมด
              </th>
              <th className="py-3 px-2 sm:px-4 font-semibold text-center rounded-tr-xl border-b border-[#ece1f7] text-[16px] whitespace-nowrap">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedRewards.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-16 sm:py-32 text-center text-[#c4c4c4] text-[17px] font-medium tracking-wide bg-white"
                  style={{
                    borderBottomLeftRadius: "12px",
                    borderBottomRightRadius: "12px",
                  }}
                >
                  ไม่พบข้อมูล
                </td>
              </tr>
            ) : (
              paginatedRewards.map((reward, idx) => (
                <tr key={idx} className="bg-white">
                  <td className="py-1 px-2 sm:px-4 text-center align-middle">
                    {reward.image && (
                      <Image
                        src={reward.image}
                        alt="reward"
                        width={48}
                        height={48}
                        className="w-12 h-12 object-contain rounded-lg mx-auto"
                        style={{ background: "#fff" }}
                      />
                    )}
                  </td>
                  <td className="py-1 px-2 sm:px-4 align-middle text-left font-medium text-[#231d37]">
                    {reward.name}
                  </td>
                  <td className="py-1 px-2 sm:px-4 align-middle text-center text-[#231d37]">
                    {reward.startDate && reward.endDate
                      ? `${formatThaiDate(reward.startDate)} - ${formatThaiDate(
                          reward.endDate
                        )}`
                      : "-"}
                  </td>
                  <td className="py-1 px-2 sm:px-4 align-middle text-center text-[#231d37]">
                    {reward.points || "-"}
                  </td>
                  <td className="py-1 px-2 sm:px-4 align-middle text-center text-[#231d37]">
                    {reward.totalCount || "-"}
                  </td>
                  <td className="py-1 px-2 sm:px-4 align-middle text-center">
                    <button
                      className="flex items-center gap-2 px-4 py-2 border border-[#e23a3a] rounded-xl bg-white text-[#e23a3a] font-semibold shadow hover:bg-[#ffe5e5] transition text-[15px]"
                      onClick={() =>
                        handleDeleteReward((page - 1) * itemsPerPage + idx)
                      }
                    >
                      <Trash2 size={18} className="mr-1" />
                      ลบของรางวัล
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination - styled and responsive */}
      <PaginationWithPerPage
        currentPage={page}
        setCurrentPage={setPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
      />
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
