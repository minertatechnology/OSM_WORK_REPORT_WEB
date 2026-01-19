import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Users,
  ClipboardList,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Search,
  Shield,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/router";
import AccessControlTable from "@services/Table/AccessControlTable";
import CustomSelect from "@services/customSelectService/customSelectService";
import { getPositions } from "@services/lookupService";

// -------------------- MOCK DATA --------------------
export const mockList = [
  {
    id: 1,
    name: "นายกิตติพงศ์ ศรีบรรจง",
    role: "เจ้าหน้าที่ศูนย์สนับสนุน",
    position: "ศูนย์สนับสนุนบริการสุขภาพที่ 4",
    citizenId: "1539900551382",
    phone: "0891234567",
    birth: "10/02/1980",
    address: {
      house: "99/99",
      village: "หมู่ 1",
      province: "นนทบุรี",
      district: "เมืองนนทบุรี",
      subdistrict: "ท่าทราย",
      zipcode: "11000",
      alley: "-",
      community: "-",
    },
  },
  {
    id: 2,
    name: "นางสาวณัฐธิดา สมานจิตต์",
    role: "เจ้าหน้าที่อำเภอ",
    position: "อำเภอเมืองนนทบุรี",
    citizenId: "1539900551383",
    phone: "0852345678",
    birth: "11/03/1981",
    address: {
      house: "101/1",
      village: "หมู่ 2",
      province: "นนทบุรี",
      district: "เมืองนนทบุรี",
      subdistrict: "ท่าทราย",
      zipcode: "11000",
      alley: "-",
      community: "-",
    },
  },
  {
    id: 3,
    name: "นายปริญญา รัตนชัย",
    role: "เจ้าหน้าที่จังหวัด",
    position: "จังหวัดนนทบุรี",
    citizenId: "1539900551384",
    phone: "0863456789",
    birth: "12/04/1982",
    address: {
      house: "102/2",
      village: "หมู่ 3",
      province: "นนทบุรี",
      district: "เมืองนนทบุรี",
      subdistrict: "ท่าทราย",
      zipcode: "11000",
      alley: "-",
      community: "-",
    },
  },
  {
    id: 4,
    name: "นางสาวพิมพ์พร วงศ์ประเสริฐ",
    role: "เจ้าหน้าที่สาธารณสุข",
    position: "สาธารณสุขจังหวัดนนทบุรี",
    citizenId: "1539900551385",
    phone: "0874567890",
    birth: "13/05/1983",
    address: {
      house: "103/3",
      village: "หมู่ 4",
      province: "นนทบุรี",
      district: "เมืองนนทบุรี",
      subdistrict: "ท่าทราย",
      zipcode: "11000",
      alley: "-",
      community: "-",
    },
  },
  {
    id: 5,
    name: "นายธนพล เทพสุข",
    role: "เจ้าหน้าที่ รพ.สต.",
    position: "รพ.สต.ทดสอบ 1",
    citizenId: "1539900551386",
    phone: "0885678901",
    birth: "14/06/1984",
    address: {
      house: "104/4",
      village: "หมู่ 5",
      province: "นนทบุรี",
      district: "เมืองนนทบุรี",
      subdistrict: "ท่าทราย",
      zipcode: "11000",
      alley: "-",
      community: "-",
    },
  },
  {
    id: 6,
    name: "นายศิริศร สุขสวัสดิ์",
    role: "เจ้าหน้าที่สาธารณสุขอำเภอ",
    position: "อำเภอไชโย",
    citizenId: "1539900551387",
    phone: "0896789012",
    birth: "15/07/1985",
    address: {
      house: "105/5",
      village: "หมู่ 6",
      province: "อ่างทอง",
      district: "ไชโย",
      subdistrict: "ชะไว",
      zipcode: "14110",
      alley: "-",
      community: "-",
    },
  },
  {
    id: 7,
    name: "นายอนุชา จิตวิริยะ",
    role: "เจ้าหน้าที่ รพ.",
    position: "โรงพยาบาลนนทบุรี",
    citizenId: "1539900551388",
    phone: "0817890123",
    birth: "16/08/1986",
    address: {
      house: "106/6",
      village: "หมู่ 7",
      province: "นนทบุรี",
      district: "เมืองนนทบุรี",
      subdistrict: "ท่าทราย",
      zipcode: "11000",
      alley: "-",
      community: "-",
    },
  },
  {
    id: 8,
    name: "นายวัชรัญญู ทองนาค",
    role: "เจ้าหน้าที่ อบต.",
    position: "อบต.ท่าทราย",
    citizenId: "1539900551389",
    phone: "0828901234",
    birth: "17/09/1987",
    address: {
      house: "107/7",
      village: "หมู่ 8",
      province: "นนทบุรี",
      district: "เมืองนนทบุรี",
      subdistrict: "ท่าทราย",
      zipcode: "11000",
      alley: "-",
      community: "-",
    },
  },
  {
    id: 9,
    name: "นายสุริยา บังพิมพ์",
    role: "เจ้าหน้าที่เทศบาล",
    position: "เทศบาลเมืองนนทบุรี",
    citizenId: "1539900551390",
    phone: "0839012345",
    birth: "18/10/1988",
    address: {
      house: "108/8",
      village: "หมู่ 9",
      province: "นนทบุรี",
      district: "เมืองนนทบุรี",
      subdistrict: "ท่าทราย",
      zipcode: "11000",
      alley: "-",
      community: "-",
    },
  },
  {
    id: 10,
    name: "นายสธิชา ศรีสมบูรณ์",
    role: "เจ้าหน้าที่พัฒนาสังคม",
    position: "กรมพัฒนาสังคม",
    citizenId: "1539900551391",
    phone: "0840123456",
    birth: "19/11/1989",
    address: {
      house: "109/9",
      village: "หมู่ 10",
      province: "นนทบุรี",
      district: "เมืองนนทบุรี",
      subdistrict: "ท่าทราย",
      zipcode: "11000",
      alley: "-",
      community: "-",
    },
  },
  {
    id: 11,
    name: "นายวรุตม์ โพธิ์กลิ่น",
    role: "เจ้าหน้าที่ศูนย์ข้อมูล",
    position: "ศูนย์ข้อมูลนนทบุรี",
    citizenId: "1539900551392",
    phone: "0812345678",
    birth: "20/12/1990",
    address: {
      house: "110/10",
      village: "หมู่ 11",
      province: "นนทบุรี",
      district: "เมืองนนทบุรี",
      subdistrict: "ท่าทราย",
      zipcode: "11000",
      alley: "-",
      community: "-",
    },
  },
  {
    id: 12,
    name: "นางสาวกมลวรรณ พิทักษ์",
    role: "เจ้าหน้าที่กระทรวงสาธารณสุข",
    position: "กระทรวงสาธารณสุข",
    citizenId: "1539900551393",
    phone: "0823456789",
    birth: "21/01/1991",
    address: {
      house: "111/11",
      village: "หมู่ 12",
      province: "นนทบุรี",
      district: "เมืองนนทบุรี",
      subdistrict: "ท่าทราย",
      zipcode: "11000",
      alley: "-",
      community: "-",
    },
  },
  {
    id: 13,
    name: "นายปกรณ์ ทัศนีย์",
    role: "เจ้าหน้าที่ฝ่ายงบประมาณ",
    position: "ฝ่ายงบประมาณ อำเภอบางกรวย",
    citizenId: "1539900551394",
    phone: "0834567890",
    birth: "22/02/1992",
    address: {
      house: "112/12",
      village: "หมู่ 13",
      province: "นนทบุรี",
      district: "บางกรวย",
      subdistrict: "บางสีทอง",
      zipcode: "11130",
      alley: "-",
      community: "-",
    },
  },
  {
    id: 14,
    name: "นางสาวศิริพร ศรีบุญ",
    role: "เจ้าหน้าที่ฝ่ายบุคคล",
    position: "ฝ่ายบุคคล อำเภอปากเกร็ด",
    citizenId: "1539900551395",
    phone: "0845678901",
    birth: "23/03/1993",
    address: {
      house: "113/13",
      village: "หมู่ 14",
      province: "นนทบุรี",
      district: "ปากเกร็ด",
      subdistrict: "บางพูด",
      zipcode: "11120",
      alley: "-",
      community: "-",
    },
  },
  {
    id: 15,
    name: "นายวชิรวิทย์ แก้วสกุล",
    role: "เจ้าหน้าที่ฝ่ายประชาสัมพันธ์",
    position: "ประชาสัมพันธ์ อำเภอบางใหญ่",
    citizenId: "1539900551396",
    phone: "0856789012",
    birth: "24/04/1994",
    address: {
      house: "114/14",
      village: "หมู่ 15",
      province: "นนทบุรี",
      district: "บางใหญ่",
      subdistrict: "เสาธงหิน",
      zipcode: "11140",
      alley: "-",
      community: "-",
    },
  },
  {
    id: 16,
    name: "นางสาวพรรณี มณีวรรณ",
    role: "เจ้าหน้าที่ฝ่ายแผนงาน",
    position: "ฝ่ายแผนงาน อำเภอบางบัวทอง",
    citizenId: "1539900551397",
    phone: "0867890123",
    birth: "25/05/1995",
    address: {
      house: "115/15",
      village: "หมู่ 16",
      province: "นนทบุรี",
      district: "บางบัวทอง",
      subdistrict: "บางบัวทอง",
      zipcode: "11110",
      alley: "-",
      community: "-",
    },
  },
  {
    id: 17,
    name: "นายปฏิภาณ ขวัญเมือง",
    role: "เจ้าหน้าที่ฝ่ายเทคโนโลยี",
    position: "ฝ่ายเทคโนโลยี อำเภอไทรน้อย",
    citizenId: "1539900551398",
    phone: "0878901234",
    birth: "26/06/1996",
    address: {
      house: "116/16",
      village: "หมู่ 17",
      province: "นนทบุรี",
      district: "ไทรน้อย",
      subdistrict: "ไทรน้อย",
      zipcode: "11150",
      alley: "-",
      community: "-",
    },
  },
  {
    id: 18,
    name: "นางสาววิมลรัตน์ กลิ่นขจร",
    role: "เจ้าหน้าที่ฝ่ายวิจัย",
    position: "ฝ่ายวิจัย อำเภอบางกรวย",
    citizenId: "1539900551399",
    phone: "0889012345",
    birth: "27/07/1997",
    address: {
      house: "117/17",
      village: "หมู่ 18",
      province: "นนทบุรี",
      district: "บางกรวย",
      subdistrict: "บางสีทอง",
      zipcode: "11130",
      alley: "-",
      community: "-",
    },
  },
  {
    id: 19,
    name: "นายพงศกร ชัยมงคล",
    role: "เจ้าหน้าที่ฝ่ายตรวจสอบ",
    position: "ฝ่ายตรวจสอบ อำเภอเมืองนนทบุรี",
    citizenId: "1539900551400",
    phone: "0890123456",
    birth: "28/08/1998",
    address: {
      house: "118/18",
      village: "หมู่ 19",
      province: "นนทบุรี",
      district: "เมืองนนทบุรี",
      subdistrict: "ท่าทราย",
      zipcode: "11000",
      alley: "-",
      community: "-",
    },
  },
  {
    id: 20,
    name: "นางสาวปรียานุช สิมมา",
    role: "เจ้าหน้าที่ฝ่ายกฎหมาย",
    position: "ฝ่ายกฎหมาย อำเภอบางใหญ่",
    citizenId: "1539900551401",
    phone: "0801234567",
    birth: "29/09/1999",
    address: {
      house: "119/19",
      village: "หมู่ 20",
      province: "นนทบุรี",
      district: "บางใหญ่",
      subdistrict: "เสาธงหิน",
      zipcode: "11140",
      alley: "-",
      community: "-",
    },
  },
];

// -------------------- PAGINATION TABLE COMPONENT --------------------
function TableWithPagination({
  data = [],
  defaultItemsPerPage = 10,
  onDetail,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(defaultItemsPerPage);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex).map((row, idx) => ({
      ...row,
      no: startIndex + idx + 1,
    }));
  }, [data, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, data.length);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="w-full">
      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-violet-100">
        <AccessControlTable rows={paginatedData} onDetail={onDetail} />
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-violet-100">
          <div className="text-sm text-gray-600 order-2 sm:order-1">
            แสดง{" "}
            <span className="font-semibold text-[#7e32e2]">{startItem}</span>{" "}
            ถึง <span className="font-semibold text-[#7e32e2]">{endItem}</span>{" "}
            จาก{" "}
            <span className="font-semibold text-[#7e32e2]">{data.length}</span>{" "}
            รายการ
          </div>
          <div className="flex items-center gap-1 order-1 sm:order-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-all duration-200 ${
                currentPage === 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-[#7e32e2] hover:bg-violet-100 active:scale-95"
              }`}
              title="หน้าแรก"
            >
              <ChevronsLeft size={18} />
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-all duration-200 ${
                currentPage === 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-[#7e32e2] hover:bg-violet-100 active:scale-95"
              }`}
              title="หน้าก่อนหน้า"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1 mx-1 sm:mx-2">
              {getPageNumbers().map((page, idx) => (
                <React.Fragment key={idx}>
                  {page === "..." ? (
                    <span className="px-2 sm:px-3 py-2 text-gray-400 text-sm">
                      ...
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePageChange(page)}
                      className={`min-w-[36px] sm:min-w-[40px] h-9 sm:h-10 rounded-lg font-medium text-sm transition-all duration-200 ${
                        currentPage === page
                          ? "bg-gradient-to-r from-[#7e32e2] to-[#9b4dff] text-white shadow-lg shadow-violet-300"
                          : "text-[#7e32e2] hover:bg-violet-100 active:scale-95"
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
              className={`p-2 rounded-lg transition-all duration-200 ${
                currentPage === totalPages
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-[#7e32e2] hover:bg-violet-100 active:scale-95"
              }`}
              title="หน้าถัดไป"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg transition-all duration-200 ${
                currentPage === totalPages
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-[#7e32e2] hover:bg-violet-100 active:scale-95"
              }`}
              title="หน้าสุดท้าย"
            >
              <ChevronsRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------- MAIN COMPONENT --------------------
export default function AccessControlComp() {
  const [search, setSearch] = useState("");
  const [searchRole, setSearchRole] = useState("");
  const [filteredList, setFilteredList] = useState(mockList);
  const [positions, setPositions] = useState([]);
  const [loadingPositions, setLoadingPositions] = useState(true);

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
        console.log("Positions data:", data);
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

  const handleSearch = (e) => {
    e?.preventDefault?.();
    const keyword = search.trim();
    const filtered = mockList.filter(
      (item) =>
        (!keyword ||
          item.name.includes(keyword) ||
          item.position.includes(keyword) ||
          item.role.includes(keyword)) &&
        (!searchRole || item.role === searchRole)
    );
    setFilteredList(filtered);
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
    setFilteredList(mockList);
  };

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
                    {mockList.length.toLocaleString("th-TH")}
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
            <span className="text-sm text-gray-500">
              ทั้งหมด {filteredList.length} รายการ
            </span>
          </div>
          <TableWithPagination
            data={filteredList}
            defaultItemsPerPage={10}
            onDetail={(row) => {
              console.log("Detail clicked for:", row);
            }}
          />
        </div>
      </div>
    </div>
  );
}
