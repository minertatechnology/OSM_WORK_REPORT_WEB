import React from "react";
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";

/**
 * Pagination Component
 *
 * @param {Object} props
 * @param {number} props.currentPage - หน้าปัจจุบัน (เริ่มจาก 1)
 * @param {number} props.totalPages - จำนวนหน้าทั้งหมด
 * @param {Function} props.onPageChange - Callback เมื่อเปลี่ยนหน้า
 * @param {number} props.totalItems - จำนวนรายการทั้งหมด
 * @param {number} props.itemsPerPage - จำนวนรายการต่อหน้า
 * @param {Function} props.onItemsPerPageChange - Callback เมื่อเปลี่ยนจำนวนต่อหน้า
 * @param {Array} props.itemsPerPageOptions - ตัวเลือกจำนวนต่อหน้า
 */
export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems = 0,
  itemsPerPage = 10,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 20, 50, 100],
  className = "",
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // แสดงทุกหน้า
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // แสดงหน้าที่เกี่ยวข้อง
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);

      if (currentPage <= 3) {
        end = maxVisible;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - maxVisible + 1;
      }

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 ${className}`}
    >
      {/* Items info */}
      <div className="text-sm text-gray-600">
        แสดง {startItem.toLocaleString()}-{endItem.toLocaleString()} จาก{" "}
        {totalItems.toLocaleString()} รายการ
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Items per page selector */}
        {onItemsPerPageChange && (
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-gray-600">แสดง</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {itemsPerPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-600">รายการ</span>
          </div>
        )}

        {/* First page */}
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          title="หน้าแรก"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous page */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          title="หน้าก่อนหน้า"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) =>
            page === "..." ? (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-lg border transition-colors ${
                  currentPage === page
                    ? "bg-blue-600 text-white border-blue-600 font-medium"
                    : "border-gray-300 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            )
          )}
        </div>

        {/* Next page */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          title="หน้าถัดไป"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last page */}
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          title="หน้าสุดท้าย"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
