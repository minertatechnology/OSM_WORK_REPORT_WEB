import { useState, useMemo } from "react";

/**
 * usePagination Hook
 * จัดการ Pagination ให้อัตโนมัติ
 *
 * @param {Array} data - ข้อมูลทั้งหมด
 * @param {number} initialItemsPerPage - จำนวนรายการต่อหน้าเริ่มต้น
 * @returns {Object} - { currentPage, totalPages, paginatedData, ... }
 */
export const usePagination = (data = [], initialItemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  // คำนวณจำนวนหน้าทั้งหมด
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(data.length / itemsPerPage));
  }, [data.length, itemsPerPage]);

  // ข้อมูลที่แสดงในหน้าปัจจุบัน
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  // ไปหน้าที่กำหนด
  const goToPage = (page) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  // หน้าถัดไป
  const nextPage = () => {
    goToPage(currentPage + 1);
  };

  // หน้าก่อนหน้า
  const previousPage = () => {
    goToPage(currentPage - 1);
  };

  // หน้าแรก
  const firstPage = () => {
    setCurrentPage(1);
  };

  // หน้าสุดท้าย
  const lastPage = () => {
    setCurrentPage(totalPages);
  };

  // เปลี่ยนจำนวนรายการต่อหน้า
  const changeItemsPerPage = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset เป็นหน้าแรก
  };

  // Reset pagination
  const reset = () => {
    setCurrentPage(1);
    setItemsPerPage(initialItemsPerPage);
  };

  return {
    // State
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedData,

    // Metadata
    totalItems: data.length,
    startIndex: (currentPage - 1) * itemsPerPage,
    endIndex: Math.min(currentPage * itemsPerPage, data.length),
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,

    // Actions
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    changeItemsPerPage,
    reset,
    setCurrentPage,
    setItemsPerPage,
  };
};

export default usePagination;
