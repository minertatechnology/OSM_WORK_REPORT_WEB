import React, { useState, useMemo } from "react";
import {
  Users,
  ClipboardList,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { useRouter } from "next/router";
import AccessControlTable from "@services/Table/AccessControlTable"; // ← ใช้ table ตาม path ที่ระบุ
import InputService from "@services/inputService/inputService";
import ButtonService from "@services/ButtonService/ButtonService";
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
const PER_PAGE_OPTIONS = [
  { label: "5", value: 5 },
  { label: "10", value: 10 },
  { label: "20", value: 20 },
  { label: "50", value: 50 },
];

function TableWithPagination({ data = [], defaultItemsPerPage = 10, onDetail }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

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
      <AccessControlTable rows={paginatedData} onDetail={onDetail} />
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-[#f0ebff]">
          <div className="text-sm text-gray-600">
            แสดง <span className="font-medium text-[#7e32e2]">{startItem}</span>{" "}
            ถึง <span className="font-medium text-[#7e32e2]">{endItem}</span>{" "}
            จาก <span className="font-medium text-[#7e32e2]">{data.length}</span> รายการ
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-all duration-200 ${currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-[#7e32e2] hover:bg-violet-100 hover:scale-105"}`}
              title="หน้าแรก"
            >
              <ChevronsLeft size={18} />
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-all duration-200 ${currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-[#7e32e2] hover:bg-violet-100 hover:scale-105"}`}
              title="หน้าก่อนหน้า"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1 mx-2">
              {getPageNumbers().map((page, idx) => (
                <React.Fragment key={idx}>
                  {page === "..." ? (
                    <span className="px-3 py-2 text-gray-400">...</span>
                  ) : (
                    <button
                      onClick={() => handlePageChange(page)}
                      className={`min-w-[40px] h-10 rounded-lg font-medium transition-all duration-200 ${
                        currentPage === page
                          ? "bg-[#7e32e2] text-white shadow-lg scale-105"
                          : "text-[#7e32e2] hover:bg-violet-100 hover:scale-105"
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
              className={`p-2 rounded-lg transition-all duration-200 ${currentPage === totalPages ? "text-gray-400 cursor-not-allowed" : "text-[#7e32e2] hover:bg-violet-100 hover:scale-105"}`}
              title="หน้าถัดไป"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg transition-all duration-200 ${currentPage === totalPages ? "text-gray-400 cursor-not-allowed" : "text-[#7e32e2] hover:bg-violet-100 hover:scale-105"}`}
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

  // สำหรับ modal รายละเอียด
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);

  // Next.js router
  const router = useRouter();

  // สร้างบทบาทจากข้อมูล (unique)
  const roleOptions = useMemo(() => {
    const roles = mockList.map(x => x.role);
    return Array.from(new Set(roles));
  }, []);

  // ฟังก์ชันค้นหา
  const handleSearch = (e) => {
    e?.preventDefault?.();
    const keyword = search.trim();
    const filtered = mockList.filter(
      (item) =>
        (!keyword || item.name.includes(keyword) || item.position.includes(keyword) || item.role.includes(keyword)) &&
        (!searchRole || item.role === searchRole)
    );
    setFilteredList(filtered);
  };

  // กด Enter ในช่องค้นหา = trigger handleSearch
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  // ฟังก์ชันไปหน้าแก้ไขสิทธิ์
  const handleEdit = () => {
    router.push("/access-control/edit");
  };

  return (
    <div className="w-full min-h-screen bg-violet-50 flex items-start justify-center p-0 box-border">
      <div className="w-full max-w-[1200px] min-h-screen bg-white shadow-lg rounded-2xl px-8 py-8 mx-auto flex flex-col">
        {/* Top Badge Section */}
      <div className="flex gap-6 items-stretch mb-6 w-full">
        {/* Card: จำนวนบทบาททางเจ้าหน้าที่ */}
        <div className="flex-1 bg-violet-50 border-2 border-violet-200 rounded-[18px] px-7 py-5 min-w-[240px] max-w-[480px] flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-7">
            <div className="flex items-center justify-center bg-[#eadcff] rounded-full w-[40px] h-[40px]">
              <ClipboardList size={22} color="#7e32e2" />
            </div>
            <div className="flex flex-col gap-0">
            <div className="text-[17px] font-bold text-black">จำนวนบทบาททางเจ้าหน้าที่</div>
          </div>
          </div>
          <div className="flex items-end justify-between w-full">
            <span className="text-[22px] font-extrabold text-[#7e32e2] leading-none">{roleOptions.length}</span>
            <span className="text-[16px] font-bold text-[#7e32e2] mb-[2px]">บทบาท</span>
          </div>
        </div>
        {/* Card: จำนวนเจ้าหน้าที่ทั้งหมด */}
        <div className="flex-1 bg-violet-50 border-2 border-violet-200 rounded-[18px] px-7 py-5 min-w-[240px] max-w-[480px] flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-7">
            <div className="flex items-center justify-center bg-[#eadcff] rounded-full w-[40px] h-[40px]">
              <Users size={22} color="#7e32e2" />
            </div>
            <div className="flex flex-col gap-0">
            <div className="text-[17px] font-bold text-black">จำนวนเจ้าหน้าที่ทั้งหมด</div>
          </div>
          </div>
          <div className="flex items-end justify-between w-full">
            <span className="text-[22px] font-extrabold text-[#7e32e2] leading-none">{mockList.length.toLocaleString("th-TH")}</span>
            <span className="text-[16px] font-bold text-[#7e32e2] mb-[2px]">คน</span>
          </div>
        </div>
      </div>

        {/* Search Row + ปุ่มจัดการสิทธิ์ */}
        <form
          className="flex gap-4 mb-4 items-center flex-nowrap"
          onSubmit={handleSearch}
        >
          <div className="flex-1 min-w-[200px]">
            <InputService
              type="text"
              className="w-full rounded-lg border border-violet-300 px-4 py-2 text-[16px] bg-violet-50 text-[#231d37] h-12"
              placeholder="ค้นหารายชื่อ, ตำแหน่ง, หรือบทบาท"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                border: "1.5px solid #c5a8fa",
                background: "#f6f2ff",
                fontSize: 16,
                color: "#231d37",
                height: 48,
              }}
            />
          </div>
          <div className="min-w-[220px]">
            <InputService
              options={[
                { value: "", label: "เลือกบทบาทเจ้าหน้าที่" },
                ...roleOptions
              ]}
              value={searchRole}
              onChange={e => setSearchRole(e.value || e.target.value)}
              clearable={true}
              className="w-full rounded-lg border border-violet-300 px-3 py-2 text-[16px] bg-violet-50 text-[#231d37] h-12"
              style={{
                border: "1.5px solid #c5a8fa",
                background: "#f6f2ff",
                fontSize: 16,
                color: "#231d37",
                height: 48,
              }}
            />
          </div>
          <ButtonService
            type="submit"
            variant="primary"
            size="md"
            className="flex items-center h-12"
            style={{
              height: 48,
              fontSize: 16,
              fontWeight: 700,
              borderRadius: "0.75rem",
              paddingLeft: 28,
              paddingRight: 28,
              backgroundColor: "#7e32e2",
            }}
          >
            ค้นหา
          </ButtonService>
          <ButtonService
            type="button"
            variant="secondary"
            size="md"
            icon={<ClipboardList size={18} className="mr-2" />}
            className="ml-auto flex items-center h-12"
            onClick={handleEdit}
            style={{
              height: 48,
              fontSize: 16,
              fontWeight: 700,
              borderRadius: "0.75rem",
              paddingLeft: 20,
              paddingRight: 20,
              borderWidth: 2,
              borderColor: "#7e32e2",
              color: "#7e32e2",
            }}
          >
            จัดการสิทธิ์การเข้าถึง
          </ButtonService>
        </form>

        {/* Table Section with Pagination */}
        <TableWithPagination
          data={filteredList}
          defaultItemsPerPage={10}
          onDetail={row => {
            setDetailOpen(true);
            setDetailData(row);
          }}
        />
      </div>
    </div>
  );
}