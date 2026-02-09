import React from "react";
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ChevronDown,
} from "lucide-react";

// Pagination options
const PER_PAGE_OPTIONS = [
  { label: "10", value: 10 },
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
];

/**
 * Pagination Component - Modern purple gradient style
 *
 * @param {Object} props
 * @param {number} props.currentPage - หน้าปัจจุบัน (เริ่มจาก 1)
 * @param {number} props.totalPages - จำนวนหน้าทั้งหมด
 * @param {Function} props.onPageChange - Callback เมื่อเปลี่ยนหน้า
 * @param {number} props.totalItems - จำนวนรายการทั้งหมด
 * @param {number} props.itemsPerPage - จำนวนรายการต่อหน้า
 * @param {Function} props.onItemsPerPageChange - Callback เมื่อเปลี่ยนจำนวนต่อหน้า
 * @param {Array} props.itemsPerPageOptions - ตัวเลือกจำนวนต่อหน้า (default: PER_PAGE_OPTIONS)
 * @param {string} props.className - Additional CSS classes
 */
export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems = 0,
  itemsPerPage = 10,
  onItemsPerPageChange,
  itemsPerPageOptions = PER_PAGE_OPTIONS,
  className = "",
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    if (onItemsPerPageChange) {
      onItemsPerPageChange(newItemsPerPage);
    }
  };

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
    <div className={`flex flex-row items-center justify-between gap-3 mt-6 pt-6 border-t-2 border-purple-100 flex-wrap ${className}`}>
      {/* Items per page selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
          แสดง
        </span>
        {onItemsPerPageChange ? (
          <div className="relative">
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="appearance-none bg-gradient-to-r from-purple-50/80 to-violet-50/80 border-2 border-purple-200 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#7e32e2] cursor-pointer hover:border-purple-300 hover:shadow-sm transition-all duration-200 min-w-[65px]"
            >
              {itemsPerPageOptions.map((option) => (
                <option key={option.value || option} value={option.value || option}>
                  {option.label || option}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#7e32e2] pointer-events-none"
            />
          </div>
        ) : (
          <span className="text-xs font-semibold text-[#7e32e2]">
            {itemsPerPage}
          </span>
        )}
        <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
          รายการ/หน้า
        </span>
      </div>

      {/* Total items */}
      {totalItems > 0 && (
        <div className="text-xs font-medium text-gray-700 whitespace-nowrap">
          รวม{" "}
          <span className="font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
            {totalItems.toLocaleString("th-TH")}
          </span>{" "}
          รายการ
        </div>
      )}

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {totalPages > 1 && (
          <>
            {/* Current item range */}
            <div className="text-xs font-medium text-gray-700 bg-gradient-to-r from-purple-50 to-white px-3 py-1.5 rounded-lg border border-purple-100 whitespace-nowrap">
              <span className="font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                {startItem}
              </span>
              -
              <span className="font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                {endItem}
              </span>
            </div>

            {/* Page buttons */}
            <div className="flex items-center gap-1 bg-white px-1.5 py-1.5 rounded-lg border border-purple-100 shadow-sm">
              <button
                onClick={() => handlePageChange(1)}
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
                onClick={() => handlePageChange(currentPage - 1)}
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
                        onClick={() => handlePageChange(page)}
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
                onClick={() => handlePageChange(currentPage + 1)}
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
                onClick={() => handlePageChange(totalPages)}
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
};

export default Pagination;
