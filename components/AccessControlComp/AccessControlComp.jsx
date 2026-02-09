import React, { useState, useMemo, useEffect } from "react";
import {
  Users,
  ClipboardList,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Shield,
} from "lucide-react";
import { useRouter } from "next/router";
import AccessControlTable from "@services/Table/AccessControlTable";
import CustomSelect from "@services/customSelectService/customSelectService";
import { getPositions } from "@services/lookupService";
import oauth2Service from "@services/oauth2Service";

// Pagination options
const PER_PAGE_OPTIONS = [
  { label: "10", value: 10 },
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
];

// -------------------- MAIN COMPONENT --------------------
export default function AccessControlComp() {
  const [search, setSearch] = useState("");
  const [searchRole, setSearchRole] = useState("");
  const [positions, setPositions] = useState([]);
  const [loadingPositions, setLoadingPositions] = useState(true);

  // State สำหรับข้อมูล officers จาก API
  const [officersData, setOfficersData] = useState([]);
  const [loadingOfficers, setLoadingOfficers] = useState(true);
  const [totalOfficers, setTotalOfficers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const router = useRouter();

  // สร้าง roleOptions จาก positions data เหมือน ManageAccess
  const roleOptions = useMemo(() => {
    if (!positions || positions.length === 0) return [];

    // กรองตำแหน่งที่ไม่ต้องการแสดง
    const excludedCodes = ['DIR', 'VIL']; // Director, Village

    return positions
      .filter(pos => !excludedCodes.includes(pos.code))
      .map(pos => pos.name_th || pos.label || pos.position_name || pos.name || pos.id || "");
  }, [positions]);

  // ดึงข้อมูล positions จาก API
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const data = await getPositions({ limit: 100 });
        setPositions(data);
      } catch (error) {
        console.error("Failed to fetch positions:", error);
        setPositions([]);
      } finally {
        setLoadingPositions(false);
      }
    };
    fetchPositions();
  }, []);

  // ดึงข้อมูล officers จาก API
  useEffect(() => {
    const fetchOfficers = async () => {
      setLoadingOfficers(true);
      try {
        const result = await oauth2Service.getOfficersList({
          page: currentPage,
          limit: itemsPerPage,
          order_by: "created_at",
          sort_dir: "desc",
          search: search.trim(),
        });

        // แปลงข้อมูลจาก API ให้ตรงกับรูปแบบตาราง
        const transformedData = result.items.map((officer, index) => {
          const fullName = `${officer.prefix_name_th || ""}${officer.first_name || ""} ${officer.last_name || ""}`.trim();
          return {
            id: officer.id,
            name: fullName || "ไม่ระบุชื่อ",
            role: officer.position_name_th || "เจ้าหน้าที่",
            position: officer.health_service_name_th ||
                      officer.province_name_th ||
                      officer.district_name_th ||
                      "-",
            citizenId: officer.citizen_id || "-",
            phone: officer.phone || "-",
            birth: "-",
            address: {
              house: "-",
              village: "-",
              province: officer.province_name_th || "-",
              district: officer.district_name_th || "-",
              subdistrict: officer.subdistrict_name_th || "-",
              zipcode: "-",
              alley: "-",
              community: "-",
            },
            is_active: officer.is_active,
            approval_status: officer.approval_status,
            permissions: officer.permissions || {},
            no: (currentPage - 1) * itemsPerPage + index + 1,
          };
        });

        // Debug: แสดงค่า pagination
        console.log("API Result:", result);
        console.log("Total items:", result.pagination?.total || result.total);
        console.log("Total pages:", result.pagination?.pages || result.totalPages);

        setOfficersData(transformedData);
        setTotalOfficers(result.pagination?.total || result.total || 0);
        setTotalPages(result.pagination?.pages || result.totalPages || 1);
      } catch (error) {
        console.error("Failed to fetch officers:", error);
        setOfficersData([]);
        setTotalOfficers(0);
        setTotalPages(1);
      } finally {
        setLoadingOfficers(false);
      }
    };

    fetchOfficers();
  }, [currentPage, itemsPerPage, search]);

  const handleSearch = (e) => {
    e?.preventDefault?.();
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleEdit = () => {
    router.push("/access-control/edit");
  };

  const handleClear = () => {
    setSearch("");
    setSearchRole("");
    setCurrentPage(1);
  };

  // Pagination helper functions
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

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalOfficers);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-r from-[#7e32e2] to-[#9b4dff] rounded-xl shadow-lg shadow-violet-300">
              <Shield size={24} className="text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
              กำหนดสิทธิ์การเข้าถึง
            </h1>
          </div>
          <p className="text-sm sm:text-base text-gray-500 ml-0 sm:ml-14">
            จัดการสิทธิ์และบทบาทของเจ้าหน้าที่ในระบบ
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Card: จำนวนบทบาททางเจ้าหน้าที่ */}
          <div className="bg-white rounded-2xl shadow-sm border border-violet-100 p-5 sm:p-6 hover:shadow-md hover:border-violet-200 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl">
                    <ClipboardList size={22} className="text-[#7e32e2]" />
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-gray-700">
                    จำนวนบทบาททางเจ้าหน้าที่
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#7e32e2] to-[#9b4dff] bg-clip-text text-transparent">
                    {roleOptions.length}
                  </span>
                  <span className="text-base sm:text-lg font-semibold text-[#7e32e2]">
                    บทบาท
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card: จำนวนเจ้าหน้าที่ทั้งหมด */}
          <div className="bg-white rounded-2xl shadow-sm border border-violet-100 p-5 sm:p-6 hover:shadow-md hover:border-violet-200 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl">
                    <Users size={22} className="text-[#7e32e2]" />
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-gray-700">
                    จำนวนเจ้าหน้าที่ทั้งหมด
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#7e32e2] to-[#9b4dff] bg-clip-text text-transparent">
                    {loadingOfficers ? "-" : totalOfficers.toLocaleString("th-TH")}
                  </span>
                  <span className="text-base sm:text-lg font-semibold text-[#7e32e2]">
                    คน
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-violet-100 p-4 sm:p-6 mb-6">
          <form onSubmit={handleSearch}>
            <div className="flex flex-col lg:flex-row gap-4 items-end">
              {/* Search Input */}
              <div className="flex-1">
                <label className="block text-sm font-semibold text-[#4b3b76] mb-1.5">
                  ค้นหา
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={20} />
                  </div>
                  <input
                    type="text"
                    className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-violet-200 bg-violet-50/50 text-gray-700 placeholder:text-gray-400 focus:border-[#7e32e2] focus:ring-2 focus:ring-violet-200 focus:bg-white transition-all duration-200 text-sm sm:text-base"
                    placeholder="ค้นหาชื่อ, ตำแหน่ง, หรือบทบาท..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>

              {/* Role Select */}
              <div className="w-full lg:w-72">
                {loadingPositions ? (
                  <div className="h-12 flex items-center justify-center rounded-xl border-2 border-violet-200 bg-violet-50/50 text-gray-400 text-sm">
                    กำลังโหลด...
                  </div>
                ) : (
                  <CustomSelect
                    label="บทบาทเจ้าหน้าที่"
                    placeholder="-- เลือกบทบาทเจ้าหน้าที่ --"
                    value={searchRole}
                    onChange={(e) => setSearchRole(e.target.value)}
                    options={roleOptions.map((role) => ({
                      label: role,
                      value: role,
                    }))}
                    icon={Shield}
                  />
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 flex-wrap sm:flex-nowrap w-full lg:w-auto">
                <button
                  type="submit"
                  className="flex-1 sm:flex-none h-12 px-6 bg-gradient-to-r from-[#7e32e2] to-[#9b4dff] text-white font-semibold rounded-xl shadow-lg shadow-violet-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Search size={18} />
                  <span>ค้นหา</span>
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex-1 sm:flex-none h-12 px-6 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 whitespace-nowrap"
                >
                  ล้าง
                </button>
                <button
                  type="button"
                  onClick={handleEdit}
                  className="flex-1 sm:flex-none h-12 px-6 border-2 border-[#7e32e2] text-[#7e32e2] font-semibold rounded-xl hover:bg-violet-50 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <ClipboardList size={18} />
                  <span className="hidden sm:inline">จัดการสิทธิ์</span>
                  <span className="sm:hidden">จัดการ</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-violet-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">
              รายชื่อเจ้าหน้าที่
            </h2>
            {/* <span className="text-sm text-gray-500">
              ทั้งหมด {loadingOfficers ? "-" : totalOfficers.toLocaleString("th-TH")} รายการ
            </span> */}
          </div>

          {loadingOfficers ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <div className="w-full">
              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-violet-100">
                <AccessControlTable rows={officersData} onDetail={() => {
                  // Detail clicked
                }} />
              </div>

              {/* Pagination */}
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

                {totalOfficers > 0 && (
                  <div className="text-xs font-medium text-gray-700 whitespace-nowrap">
                    รวม{" "}
                    <span className="font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                      {totalOfficers.toLocaleString("th-TH")}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
