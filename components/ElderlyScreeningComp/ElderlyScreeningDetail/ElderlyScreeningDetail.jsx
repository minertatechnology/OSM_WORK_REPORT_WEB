import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, FileText, Download } from "lucide-react";
import jsPDF from "jspdf";
import { font as SarabunFont } from "../../../styles/Sarabun-Regular-normal";
import { fontbold as SarabunBoldFont } from "../../../styles/Sarabun-Regular-bold";

// Mock data สำหรับตารางรายละเอียดการคัดกรองผู้สูงอายุ
const mockDetailData = Array.from({ length: 20 }, (_, i) => ({
  no: i + 1,
  name: `นาง${["สมใจ มีสุข", "วรรณา ใจดี", "มาลี รักษ์ดี", "สุดา สุขใจ"][i % 4]}`,
  // ข้อมูลเชิงสังคม (3 คอลัมน์)
  living: i % 3 === 0 ? "อยู่คนเดียว" : i % 3 === 1 ? "อยู่กับครอบครัว" : "อยู่กับผู้ดูแล",
  housingType: i % 3 === 0 ? "บ้านตัวเอง" : i % 3 === 1 ? "บ้านเช่า" : "อื่นๆ",
  income: i % 3 === 0 ? "เพียงพอ" : i % 3 === 1 ? "พอใช้" : "ไม่เพียงพอ",
  // แบบคัดกรองผู้สูงอายุ
  // ด้านความคิดความทรงจำ
  memory: i % 3 === 0 ? "ปกติ" : i % 3 === 1 ? "บกพร่องเล็กน้อย" : "บกพร่อง",
  // ด้านการเคลื่อนไหวร่างกาย (2 คอลัมน์ย่อย)
  canWalk: i % 2 === 0 ? "ได้" : "ไม่ได้",
  falls6Month: i % 2 === 0 ? "ไม่มี" : "มี",
  // ด้านการขาดสารอาหาร (2 คอลัมน์ย่อย)
  weightLoss: i % 2 === 0 ? "ไม่มี" : "มี",
  appetiteLoss: i % 2 === 0 ? "ไม่มี" : "มี",
  // ด้านการมองเห็น
  vision: i % 3 === 0 ? "ปกติ" : i % 3 === 1 ? "พอใช้" : "บกพร่อง",
  // ด้านการได้ยิน
  hearing: i % 3 === 0 ? "ปกติ" : i % 3 === 1 ? "พอใช้" : "บกพร่อง",
  // ด้านภาวะซึมเศร้า (3 คอลัมน์ย่อย)
  feelUncomfortable: i % 2 === 0 ? "ไม่มี" : "มี",
  bored: i % 2 === 0 ? "ไม่มี" : "มี",
  feelSad: i % 2 === 0 ? "ไม่มี" : "มี",
  // ด้านการกลั้นปัสสาวะ
  urinaryControl: i % 3 === 0 ? "ปกติ" : i % 3 === 1 ? "กลั้นได้บางครั้ง" : "กลั้นไม่ได้",
}));

const ElderlyScreeningDetail = ({ reportData }) => {
  const router = useRouter();
  const tableRef = useRef(null);

  // ถ้าไม่มีข้อมูล ให้ใช้ค่า default
  const year = reportData?.year || "2568";
  const month = reportData?.month || "มิถุนายน";
  const name = reportData?.name || "นางสาวชนุชนาถ ผดุงจิตร";

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });

      // เพิ่ม Thai font
      doc.addFileToVFS("Sarabun-Regular.ttf", SarabunFont);
      doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
      doc.addFileToVFS("Sarabun-Bold.ttf", SarabunBoldFont);
      doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
      doc.setFont("Sarabun");

      // Title
      doc.setFontSize(14);
      doc.setFont("Sarabun", "bold");
      doc.text(`แบบรายงานการคัดกรองผู้สูงอายุในชุมชน ปีงบประมาณ ${year}`, 148.5, 10, { align: "center" });
      doc.setFontSize(12);
      doc.setFont("Sarabun", "normal");
      doc.text(`ประจำเดือน ${month} - ${name}`, 148.5, 16, { align: "center" });

      const startX = 10;
      const startY = 22;
      const rowHeight = 8;

      // บันทึกไฟล์
      doc.save(`รายงานคัดกรองผู้สูงอายุ_${month}_${year}_${name}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("เกิดข้อผิดพลาดในการสร้าง PDF");
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#faf8ff] via-white to-[#f5f0ff] p-4 sm:p-6">
      {/* Header Section with Gradient */}
      <div className="relative mb-8 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7e32e2] via-[#9333ea] to-[#a855f7]" />
        <div className="absolute inset-0 bg-white/5" />

        <div className="relative p-6 sm:p-8">
          <div className="text-white">
            <button
              onClick={() => router.push("/elderly-screening")}
              className="flex items-center gap-2 px-4 py-2 mb-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl transition-all duration-200 w-fit"
            >
              <ArrowLeft size={20} />
              <span className="font-semibold">กลับ</span>
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Users size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  รายละเอียดข้อมูลคัดกรองผู้สูงอายุในชุมชน
                </h1>
                <p className="text-white/80 text-sm mt-1">
                  ตรวจสอบรายละเอียดรายงานการคัดกรองผู้สูงอายุ
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table PDF-style */}
      <div ref={tableRef} className="bg-white shadow-lg border border-[#f0ebff] overflow-hidden rounded-lg">
        {/* Header with Report Info and Export Button */}
        <div className="flex items-start justify-between p-6 border-b border-[#ece1f7]">
          {/* Report Info - Center aligned */}
          <div className="flex-1 text-center">
            <h2 className="font-bold text-[#231d37] text-lg mb-2">
              แบบรายงานการคัดกรองผู้สูงอายุในชุมชน ปีงบประมาณ {year}
            </h2>
            <p className="text-gray-700 font-medium text-base mb-1">
              ประจำเดือน {month}
            </p>
            <p className="text-gray-700 font-medium text-base">{name}</p>
          </div>

          {/* Export Button - Right top */}
          <button
            onClick={handleExportPDF}
            className="export-button flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#7e32e2] to-[#9333ea] text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 text-base"
          >
            <Download size={20} />
            Export PDF
          </button>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full border-collapse" style={{ minWidth: "1400px" }}>
            <thead>
              {/* Header Row 1 - Main Categories */}
              <tr className="bg-white">
                <th rowSpan={3} className="border border-black py-1 px-1 font-bold text-center text-[#231d37]" style={{ width: "30px", fontSize: "10px" }}>
                  ลำดับ
                </th>
                <th rowSpan={3} className="border border-black py-1 px-1 font-bold text-center text-[#231d37]" style={{ width: "90px", fontSize: "10px" }}>
                  รายชื่อ
                </th>
                <th colSpan={3} className="border border-black py-1 px-1 font-bold text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                  ข้อมูลเชิงสังคม
                </th>
                <th colSpan={11} className="border border-black py-1 px-1 font-bold text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                  แบบคัดกรองผู้สูงอายุ
                </th>
              </tr>

              {/* Header Row 2 - Sub Categories */}
              <tr className="bg-white">
                {/* ข้อมูลเชิงสังคม - ไม่มี sub category ต่อ */}
                <th rowSpan={2} className="border border-black py-1 px-1 font-bold text-center text-[#231d37]" style={{ width: "60px", fontSize: "9px", lineHeight: "1.2" }}>
                  การอยู่<br/>อาศัย
                </th>
                <th rowSpan={2} className="border border-black py-1 px-1 font-bold text-center text-[#231d37]" style={{ width: "60px", fontSize: "9px", lineHeight: "1.2" }}>
                  ลักษณะที่<br/>อยู่อาศัย
                </th>
                <th rowSpan={2} className="border border-black py-1 px-1 font-bold text-center text-[#231d37]" style={{ width: "65px", fontSize: "9px", lineHeight: "1.2" }}>
                  ความเพียงพอ<br/>ของรายได้
                </th>

                {/* แบบคัดกรองผู้สูงอายุ - มี sub categories */}
                <th rowSpan={2} className="border border-black py-1 px-1 font-bold text-center text-[#231d37]" style={{ width: "60px", fontSize: "9px", lineHeight: "1.2" }}>
                  ด้านความคิด<br/>ความทรงจำ
                </th>
                <th colSpan={2} className="border border-black py-1 px-1 font-bold text-center text-[#231d37]" style={{ fontSize: "9px", lineHeight: "1.2" }}>
                  ด้านการเคลื่อนไหว<br/>ร่างกาย
                </th>
                <th colSpan={2} className="border border-black py-1 px-1 font-bold text-center text-[#231d37]" style={{ fontSize: "9px", lineHeight: "1.2" }}>
                  ด้านการขาด<br/>สารอาหาร
                </th>
                <th rowSpan={2} className="border border-black py-1 px-1 font-bold text-center text-[#231d37]" style={{ width: "55px", fontSize: "9px", lineHeight: "1.2" }}>
                  ด้านการ<br/>มองเห็น
                </th>
                <th rowSpan={2} className="border border-black py-1 px-1 font-bold text-center text-[#231d37]" style={{ width: "55px", fontSize: "9px", lineHeight: "1.2" }}>
                  ด้านการ<br/>ได้ยิน
                </th>
                <th colSpan={3} className="border border-black py-1 px-1 font-bold text-center text-[#231d37]" style={{ fontSize: "9px", lineHeight: "1.2" }}>
                  ด้านภาวะซึมเศร้า
                </th>
                <th rowSpan={2} className="border border-black py-1 px-1 font-bold text-center text-[#231d37]" style={{ width: "60px", fontSize: "9px", lineHeight: "1.2" }}>
                  ด้านการ<br/>กลั้นปัสสาวะ
                </th>
              </tr>

              {/* Header Row 3 - Detail columns */}
              <tr className="bg-white">
                {/* ด้านการเคลื่อนไหวร่างกาย */}
                <th className="border border-black py-1 px-1 font-bold text-center text-[#231d37]" style={{ width: "55px", fontSize: "8px", lineHeight: "1.2" }}>
                  สามารถเดิน<br/>ไปกลับได้
                </th>
                <th className="border border-black py-1 px-1 font-bold text-center text-[#231d37]" style={{ width: "55px", fontSize: "8px", lineHeight: "1.2" }}>
                  หกล้มภายใน<br/>6 เดือน
                </th>
                {/* ด้านการขาดสารอาหาร */}
                <th className="border border-black py-1 px-1 font-bold text-center text-[#231d37]" style={{ width: "58px", fontSize: "8px", lineHeight: "1.2" }}>
                  น้ำหนักลด<br/>มากกว่า 3 กก.
                </th>
                <th className="border border-black py-1 px-1 font-bold text-center text-[#231d37]" style={{ width: "58px", fontSize: "8px", lineHeight: "1.2" }}>
                  ความอยาก<br/>อาหารลดลง
                </th>
                {/* ด้านภาวะซึมเศร้า */}
                <th className="border border-black py-1 px-1 font-bold text-center text-[#231d37]" style={{ width: "55px", fontSize: "8px", lineHeight: "1.2" }}>
                  รู้สึกไม่<br/>สบายใจ
                </th>
                <th className="border border-black py-1 px-1 font-bold text-center text-[#231d37]" style={{ width: "55px", fontSize: "8px", lineHeight: "1.2" }}>
                  เบื่อไม่<br/>อยากพูด
                </th>
                <th className="border border-black py-1 px-1 font-bold text-center text-[#231d37]" style={{ width: "55px", fontSize: "8px", lineHeight: "1.2" }}>
                  มีความรู้สึก<br/>ทุกข์ใจ
                </th>
              </tr>
            </thead>
            <tbody>
              {mockDetailData.map((row, idx) => (
                <tr
                  key={row.no}
                  className="bg-white hover:bg-[#faf8ff] transition-colors"
                >
                  <td className="border border-black py-1 px-1 text-center font-semibold text-[#231d37]" style={{ fontSize: "10px" }}>
                    {row.no}
                  </td>
                  <td className="border border-black py-1 px-1 text-center text-[#231d37] font-medium" style={{ fontSize: "10px" }}>
                    {row.name}
                  </td>
                  <td className="border border-black py-1 px-1 text-center text-[#231d37]" style={{ fontSize: "9px" }}>
                    {row.living}
                  </td>
                  <td className="border border-black py-1 px-1 text-center text-[#231d37]" style={{ fontSize: "9px" }}>
                    {row.housingType}
                  </td>
                  <td className="border border-black py-1 px-1 text-center text-[#231d37]" style={{ fontSize: "9px" }}>
                    {row.income}
                  </td>
                  <td className="border border-black py-1 px-1 text-center text-[#231d37]" style={{ fontSize: "9px" }}>
                    {row.memory}
                  </td>
                  <td className="border border-black py-1 px-1 text-center text-[#231d37]" style={{ fontSize: "9px" }}>
                    {row.canWalk}
                  </td>
                  <td className="border border-black py-1 px-1 text-center text-[#231d37]" style={{ fontSize: "9px" }}>
                    {row.falls6Month}
                  </td>
                  <td className="border border-black py-1 px-1 text-center text-[#231d37]" style={{ fontSize: "9px" }}>
                    {row.weightLoss}
                  </td>
                  <td className="border border-black py-1 px-1 text-center text-[#231d37]" style={{ fontSize: "9px" }}>
                    {row.appetiteLoss}
                  </td>
                  <td className="border border-black py-1 px-1 text-center text-[#231d37]" style={{ fontSize: "9px" }}>
                    {row.vision}
                  </td>
                  <td className="border border-black py-1 px-1 text-center text-[#231d37]" style={{ fontSize: "9px" }}>
                    {row.hearing}
                  </td>
                  <td className="border border-black py-1 px-1 text-center text-[#231d37]" style={{ fontSize: "9px" }}>
                    {row.feelUncomfortable}
                  </td>
                  <td className="border border-black py-1 px-1 text-center text-[#231d37]" style={{ fontSize: "9px" }}>
                    {row.bored}
                  </td>
                  <td className="border border-black py-1 px-1 text-center text-[#231d37]" style={{ fontSize: "9px" }}>
                    {row.feelSad}
                  </td>
                  <td className="border border-black py-1 px-1 text-center text-[#231d37]" style={{ fontSize: "9px" }}>
                    {row.urinaryControl}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ElderlyScreeningDetail;
