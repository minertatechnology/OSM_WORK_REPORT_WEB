import React, { useState, useMemo } from "react";
import { Plus, Calendar, Search, ChevronsLeft, ChevronLeft, ChevronsRight, ChevronRight } from "lucide-react";
import InputService from "@services/inputService/inputService";
import ButtonService from "@services/buttonService/buttonService";
import NewsCompService from "@services/Table/NewsCompService";
import NewsAddPopup from "@components/NewsComp/NewsAddPopup";

// Dummy auth สำหรับตัวอย่าง
const dummyAuth = { roles: ["สบส."] };

const purple = "#9327e2";
const border = "#c9b7f7";
const text_gray = "#231d37";

// ตัวเลือกปี
const years = [
  "", "2567", "2568", "2569", "2570"
];

// ตัวเลือกเดือน
const months = [
  "",
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม",
  "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

// ตัวเลือกสัปดาห์
const weeks = [
  "",
  "สัปดาห์ 1 (1/6/68-7/6/68)",
  "สัปดาห์ 2 (8/6/68-14/6/68)",
  "สัปดาห์ 3 (15/6/68-21/6/68)",
  "สัปดาห์ 4 (22/6/68-28/6/68)",
];

// mock ข่าวสาร
export const rawNewsListOrigin = [
  {
    id: 1,
    date: "25 มิถุนายน 2568",
    title: "ระบบยืนยันตัวตนหลังการสมัครใช้งานแอป",
    year: "2568",
    month: "มิถุนายน",
    week: "สัปดาห์ 4 (22/6/68-28/6/68)",
    healthZone: "zone1",
    province: "เชียงใหม่",
    amphur: "เมือง",
    subdistrict: "บางรัก",
    hospital: "รพ.สต.1",
    detail: "รายละเอียดเกี่ยวกับการยืนยันตัวตนหลังสมัครใช้งานแอป"
  },
  {
    id: 2,
    date: "20 กรกฎาคม 2567",
    title: "อัพเดตเวอร์ชั่นใหม่",
    year: "2567",
    month: "กรกฎาคม",
    week: "สัปดาห์ 2 (8/6/68-14/6/68)",
    healthZone: "zone2",
    province: "กรุงเทพ",
    amphur: "เมือง",
    subdistrict: "บางรัก",
    hospital: "รพ.สต.1",
    detail: "เวอร์ชั่นใหม่ มาพร้อมฟีเจอร์พิเศษ"
  },
  {
    id: 3,
    date: "12 มีนาคม 2569",
    title: "ระบบแจ้งเตือนใหม่",
    year: "2569",
    month: "มีนาคม",
    week: "สัปดาห์ 1 (1/6/68-7/6/68)",
    healthZone: "zone1",
    province: "เชียงใหม่",
    amphur: "เมือง",
    subdistrict: "บางรัก",
    hospital: "รพ.สต.1",
    detail: "แจ้งเตือนกิจกรรมจากระบบใหม่"
  },
  {
    id: 4,
    date: "15 มิถุนายน 2570",
    title: "คู่มือการใช้งานแอป",
    year: "2570",
    month: "มิถุนายน",
    week: "สัปดาห์ 3 (15/6/68-21/6/68)",
    healthZone: "zone2",
    province: "กรุงเทพ",
    amphur: "เมือง",
    subdistrict: "บางรัก",
    hospital: "รพ.สต.1",
    detail: "คู่มือสำหรับผู้ใช้งานแอปเวอร์ชั่นล่าสุด"
  },
  {
    id: 5,
    date: "10 พฤษภาคม 2568",
    title: "เพิ่มระบบแสดงผลกราฟ",
    year: "2568",
    month: "พฤษภาคม",
    week: "สัปดาห์ 1 (1/6/68-7/6/68)",
    healthZone: "zone1",
    province: "เชียงใหม่",
    amphur: "เมือง",
    subdistrict: "บางรัก",
    hospital: "รพ.สต.1",
    detail: "ระบบกราฟช่วยวิเคราะห์ข้อมูลได้สะดวกขึ้น"
  },
  {
    id: 6,
    date: "30 เมษายน 2567",
    title: "แจ้งปิดปรับปรุงระบบ",
    year: "2567",
    month: "เมษายน",
    week: "สัปดาห์ 3 (15/6/68-21/6/68)",
    healthZone: "zone2",
    province: "กรุงเทพ",
    amphur: "เมือง",
    subdistrict: "บางรัก",
    hospital: "รพ.สต.1",
    detail: "ระบบจะปิดปรับปรุงชั่วคราวในวันจันทร์"
  },
  {
    id: 7,
    date: "18 สิงหาคม 2569",
    title: "เพิ่มระบบสมาชิก",
    year: "2569",
    month: "สิงหาคม",
    week: "สัปดาห์ 2 (8/6/68-14/6/68)",
    healthZone: "zone2",
    province: "กรุงเทพ",
    amphur: "เมือง",
    subdistrict: "บางรัก",
    hospital: "รพ.สต.1",
    detail: "สมาชิกสามารถลงทะเบียนและแก้ไขโปรไฟล์"
  },
  {
    id: 8,
    date: "5 กันยายน 2570",
    title: "อัพเดตระบบความปลอดภัย",
    year: "2570",
    month: "กันยายน",
    week: "สัปดาห์ 1 (1/6/68-7/6/68)",
    healthZone: "zone1",
    province: "เชียงใหม่",
    amphur: "เมือง",
    subdistrict: "บางรัก",
    hospital: "รพ.สต.1",
    detail: "เพิ่มมาตรการความปลอดภัยขั้นสูง"
  },
  {
    id: 9,
    date: "14 ตุลาคม 2568",
    title: "แจ้งเตือนการประชุม",
    year: "2568",
    month: "ตุลาคม",
    week: "สัปดาห์ 3 (15/6/68-21/6/68)",
    healthZone: "zone1",
    province: "เชียงใหม่",
    amphur: "เมือง",
    subdistrict: "บางรัก",
    hospital: "รพ.สต.1",
    detail: "ประชุมประจำเดือนจะจัดที่ห้องประชุมใหญ่"
  },
  {
    id: 10,
    date: "22 ธันวาคม 2567",
    title: "ระบบแจ้งเตือนวันหยุด",
    year: "2567",
    month: "ธันวาคม",
    week: "สัปดาห์ 4 (22/6/68-28/6/68)",
    healthZone: "zone2",
    province: "กรุงเทพ",
    amphur: "เมือง",
    subdistrict: "บางรัก",
    hospital: "รพ.สต.1",
    detail: "แจ้งเตือนวันหยุดประจำปีล่วงหน้า"
  }
];


function MyRadio({ checked, onChange, children }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 500, fontSize: 16 }}>
      <span style={{
        display: "inline-block",
        width: 22,
        height: 22,
        borderRadius: "50%",
        border: `2px solid ${checked ? purple : "#dadada"}`,
        background: "#fff",
        position: "relative",
        marginRight: 4
      }}>
        {checked && (
          <span style={{
            display: "block",
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: purple,
            position: "absolute",
            top: 3,
            left: 3
          }} />
        )}
        <input
          type="radio"
          checked={checked}
          onChange={onChange}
          style={{ opacity: 0, position: "absolute", width: 22, height: 22, cursor: "pointer" }}
        />
      </span>
      <span style={{ color: checked ? purple : text_gray }}>{children}</span>
    </label>
  );
}

// Table with Pagination
function TableWithPagination({ data = [], defaultItemsPerPage = 10, onDetail }) {
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
    <div style={{ width: "100%" }}>
      <NewsCompService rows={paginatedData} onDetail={onDetail} />
      {totalPages > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginTop: 32, paddingTop: 16, borderTop: "1px solid #f0ebff" }}>
          <div style={{ fontSize: 15, color: "#555" }}>
            แสดง <span style={{ fontWeight: 600, color: purple }}>{startItem}</span>
            {" "}ถึง <span style={{ fontWeight: 600, color: purple }}>{endItem}</span>
            {" "}จาก <span style={{ fontWeight: 600, color: purple }}>{data.length}</span> รายการ
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <button title="หน้าแรก" onClick={() => handlePageChange(1)} disabled={currentPage === 1}
              style={{
                padding: 7, borderRadius: 8,
                color: currentPage === 1 ? "#bbb" : purple,
                background: currentPage === 1 ? "#fff" : "#f6f2ff",
                border: "none", cursor: currentPage === 1 ? "not-allowed" : "pointer"
              }}>
              <ChevronsLeft size={18} />
            </button>
            <button title="หน้าก่อนหน้า" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
              style={{
                padding: 7, borderRadius: 8,
                color: currentPage === 1 ? "#bbb" : purple,
                background: currentPage === 1 ? "#fff" : "#f6f2ff",
                border: "none", cursor: currentPage === 1 ? "not-allowed" : "pointer"
              }}>
              <ChevronLeft size={18} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 3, margin: "0 8px" }}>
              {getPageNumbers().map((page, idx) =>
                page === "..." ? (
                  <span key={idx} style={{ padding: "0 10px", color: "#bbb" }}>...</span>
                ) : (
                  <button
                    key={idx}
                    onClick={() => handlePageChange(page)}
                    style={{
                      minWidth: 40, height: 36, borderRadius: 8, fontWeight: 600,
                      background: currentPage === page ? purple : "#fff",
                      color: currentPage === page ? "#fff" : purple,
                      boxShadow: currentPage === page ? "0 2px 8px #e3d7fa" : "none",
                      border: "none", cursor: "pointer"
                    }}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
            <button title="หน้าถัดไป" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
              style={{
                padding: 7, borderRadius: 8,
                color: currentPage === totalPages ? "#bbb" : purple,
                background: currentPage === totalPages ? "#fff" : "#f6f2ff",
                border: "none", cursor: currentPage === totalPages ? "not-allowed" : "pointer"
              }}>
              <ChevronRight size={18} />
            </button>
            <button title="หน้าสุดท้าย" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}
              style={{
                padding: 7, borderRadius: 8,
                color: currentPage === totalPages ? "#bbb" : purple,
                background: currentPage === totalPages ? "#fff" : "#f6f2ff",
                border: "none", cursor: currentPage === totalPages ? "not-allowed" : "pointer"
              }}>
              <ChevronsRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const NewsComp = () => {
  const [searchType, setSearchType] = useState("yearly");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [week, setWeek] = useState("");
  const [rawNewsList, setRawNewsList] = useState(rawNewsListOrigin);
  const [filteredNews, setFilteredNews] = useState(rawNewsListOrigin);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [detailData, setDetailData] = useState(null);

  // ดูรายละเอียดข่าวสาร
  const handleDetail = (item) => {
    setDetailData(item);
    setShowDetailPopup(true);
  };

  // เพิ่มข่าวสาร
  const handleAddNews = () => {
    setShowAddPopup(true);
  };
  const handleClosePopup = () => {
    setShowAddPopup(false);
  };
  const handleSubmitPopup = (data) => {
    // เพิ่มข้อมูลใหม่เข้า list (mock เพิ่ม date/id)
    const newId = rawNewsList.length ? Math.max(...rawNewsList.map(n => n.id || 0)) + 1 : 1;
    const now = new Date();
    const dateStr = `${now.getDate()} ${months[now.getMonth() + 1] || ""} ${now.getFullYear() + 543}`;
    const newData = { ...data, id: newId, date: dateStr };
    setRawNewsList(prev => [newData, ...prev]);
    setFilteredNews(prev => [newData, ...prev]);
    setShowAddPopup(false);
  };

  // ปิด popup ดูรายละเอียด
  const handleCloseDetailPopup = () => {
    setShowDetailPopup(false);
    setDetailData(null);
  };
  // ลบข้อมูล
  const handleDeleteDetail = (item) => {
    setRawNewsList(prev => prev.filter(n => n.id !== item.id));
    setFilteredNews(prev => prev.filter(n => n.id !== item.id));
    setShowDetailPopup(false);
    setDetailData(null);
  };

  // ล้างข้อมูลค้นหา
  const resetAll = () => {
    setYear("");
    setMonth("");
    setWeek("");
    setSearchType("yearly");
    setFilteredNews(rawNewsListOrigin);
  };

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    let filtered = rawNewsList;
    if (year) filtered = filtered.filter(n => n.year === year);
    if (month) filtered = filtered.filter(n => n.month === month);
    if (week) filtered = filtered.filter(n => n.week === week);
    setFilteredNews(filtered);
  };

  return (
    <div style={{
      background: "#f7f4ff",
      minHeight: "100vh",
      padding: "38px 0 0 0",
      fontFamily: "'Noto Sans Thai', 'Kanit', Arial, sans-serif"
    }}>
      <div style={{ position: "relative", maxWidth: 1050, margin: "0 auto" }}>
        <div style={{ fontWeight: 900, fontSize: 24, color: purple, marginBottom: 28, marginLeft: 6 }}>
          ประวัติการส่งข่าว
        </div>
        <div style={{
          position: "absolute", right: 0, top: -8,
        }}>
          <ButtonService
            type="button"
            variant="secondary"
            size="md"
            icon={<Plus size={22} style={{ marginRight: 8 }} />}
            className="inline-flex items-center"
            style={{
              background: "#fff",
              border: `2px solid ${purple}`,
              color: purple,
              fontWeight: 700,
              fontSize: 17,
              borderRadius: 13,
              padding: "8px 28px",
              boxShadow: "0 2px 8px #e3d7fa",
              gap: 8,
              transition: "all .18s",
              cursor: "pointer"
            }}
            onClick={handleAddNews}
          >
            เพิ่มข่าวสาร
          </ButtonService>
        </div>

        {/* Search Box */}
        <form
          style={{
            background: "#fff", border: `2px solid ${border}`,
            borderRadius: 14, boxShadow: "0 2px 8px #e3d7fa",
            padding: "28px 34px 22px 34px", marginBottom: 38, marginTop: 4,
          }}
          onSubmit={handleSearch}
        >
          <div style={{
            fontWeight: 700, fontSize: 18, color: text_gray, marginBottom: 14
          }}>
            รูปแบบการค้นหา :
            <span style={{ marginLeft: 18 }}>
              <MyRadio checked={searchType === "yearly"} onChange={() => setSearchType("yearly")}>
                ค้นหาแบบรายปี
              </MyRadio>
            </span>
            <span style={{ marginLeft: 22 }}>
              <MyRadio checked={searchType === "budget"} onChange={() => setSearchType("budget")}>
                ค้นหาแบบรายปีงบประมาณ
              </MyRadio>
            </span>
          </div>
          <div style={{ display: "flex", gap: 24, marginBottom: 18, flexWrap: "wrap" }}>
            {/* ปี */}
            <div style={{ flex: 1, minWidth: 150, maxWidth: 190 }}>
              <div style={{ fontWeight: 600, color: text_gray, fontSize: 15, marginBottom: 8 }}>
                ปี
              </div>
              <div style={{ position: "relative" }}>
                <InputService
                  type="select"
                  options={years.map(y => ({ value: y, label: y ? y : "เลือกปี" }))}
                  value={year}
                  onChange={e => setYear(e.value || e.target.value)}
                  className="w-full"
                  style={{
                    width: "100%",
                    border: `1.5px solid ${border}`,
                    borderRadius: 8,
                    fontSize: 16,
                    padding: "10px 18px 10px 18px",
                    color: text_gray,
                    background: "#f6f2ff",
                    fontWeight: 500,
                  }}
                  suffixIcon={<Calendar size={20} color="#a759e7" />}
                />
              </div>
            </div>
            {/* เดือน */}
            <div style={{ flex: 1, minWidth: 150, maxWidth: 190 }}>
              <div style={{ fontWeight: 600, color: text_gray, fontSize: 15, marginBottom: 8 }}>
                เดือน
              </div>
              <div style={{ position: "relative" }}>
                <InputService
                  type="select"
                  options={months.map(m => ({ value: m, label: m ? m : "เลือกเดือน" }))}
                  value={month}
                  onChange={e => setMonth(e.value || e.target.value)}
                  className="w-full"
                  style={{
                    width: "100%",
                    border: `1.5px solid ${border}`,
                    borderRadius: 8,
                    fontSize: 16,
                    padding: "10px 18px 10px 18px",
                    color: text_gray,
                    background: "#f6f2ff",
                    fontWeight: 500,
                  }}
                  suffixIcon={<Calendar size={20} color="#a759e7" />}
                />
              </div>
            </div>
            {/* สัปดาห์ */}
            <div style={{ flex: 1.2, minWidth: 180, maxWidth: 290 }}>
              <div style={{ fontWeight: 600, color: text_gray, fontSize: 15, marginBottom: 8 }}>
                สัปดาห์
              </div>
              <div style={{ position: "relative" }}>
                <InputService
                  type="select"
                  options={weeks.map(w => ({ value: w, label: w ? w : "เลือกสัปดาห์" }))}
                  value={week}
                  onChange={e => setWeek(e.value || e.target.value)}
                  className="w-full"
                  style={{
                    width: "100%",
                    border: `1.5px solid ${border}`,
                    borderRadius: 8,
                    fontSize: 16,
                    padding: "10px 18px 10px 18px",
                    color: text_gray,
                    background: "#f6f2ff",
                    fontWeight: 500,
                  }}
                  suffixIcon={<Calendar size={20} color="#a759e7" />}
                />
              </div>
            </div>
          </div>
          {/* ปุ่มค้นหาและล้างข้อมูลการค้นหา */}
          <div
            style={{
              display: "flex",
              gap: 10,
              width: "100%",
              marginBottom: 6,
            }}
          >
            <ButtonService
              type="submit"
              variant="primary"
              size="md"
              icon={<Search size={22} color="#fff" />}
              className="flex items-center justify-center"
              style={{
                background: purple,
                color: "#fff",
                fontWeight: 700,
                fontSize: 18,
                borderRadius: 9,
                border: "none",
                padding: "8px 0",
                minWidth: 0,
                width: "50%",
                boxShadow: "0 2px 8px #e3d7fa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                cursor: "pointer",
                transition: "all .18s"
              }}
            >
              ค้นหา
            </ButtonService>
            <ButtonService
              type="button"
              variant="secondary"
              size="md"
              className="flex items-center justify-center"
              style={{
                background: "#fff",
                color: purple,
                fontWeight: 700,
                fontSize: 17,
                borderRadius: 9,
                border: `1.5px solid ${purple}`,
                padding: "8px 0",
                minWidth: 0,
                width: "50%",
                boxShadow: "0 2px 8px #e3d7fa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                cursor: "pointer",
                transition: "all .18s"
              }}
              onClick={resetAll}
            >
              ล้างข้อมูลการค้นหา
            </ButtonService>
          </div>
        </form>

        {/* Table with Pagination */}
        <TableWithPagination data={filteredNews} defaultItemsPerPage={10} onDetail={handleDetail} />
      </div>
      <NewsAddPopup open={showAddPopup} onClose={handleClosePopup} onSubmit={handleSubmitPopup} auth={dummyAuth} />
      <NewsAddPopup
        open={showDetailPopup}
        onClose={handleCloseDetailPopup}
        mode="detail"
        data={detailData}
        onDelete={handleDeleteDetail}
        auth={dummyAuth}
      />
    </div>
  );
};

export default NewsComp;