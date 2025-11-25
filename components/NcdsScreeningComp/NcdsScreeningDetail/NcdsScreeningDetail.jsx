import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, FileText, Download } from "lucide-react";
import jsPDF from "jspdf";
import { font as SarabunFont } from "../../../styles/Sarabun-Regular-normal";
import { fontbold as SarabunBoldFont } from "../../../styles/Sarabun-Regular-bold";

// Mock data สำหรับตารางรายละเอียดการคัดกรอง NCDs
const mockDetailData = Array.from({ length: 20 }, (_, i) => ({
  no: i + 1,
  name: `นาง${["สมใจ มีสุข", "วรรณา ใจดี", "มาลี รักษ์ดี", "สุดา สุขใจ"][i % 4]}`,
  // คอลัมน์ทั้ง 12 หลัก (นอกจากลำดับและรายชื่อ)
  riskBehavior: i % 2 === 0 ? "มี" : "ไม่มี", // พฤติกรรมเสี่ยงโรคไม่ติดต่อเรื้อรัง
  obesity: i % 3 === 0 ? "ปกติ" : i % 3 === 1 ? "อ้วนลงพุง" : "เสี่ยง", // ภาวะอ้วนลงพุง
  bloodPressure: i % 3 === 0 ? "ปกติ" : i % 3 === 1 ? "สูง" : "ต่ำ", // ระดับความดันโลหิต
  bloodSugar: i % 2 === 0 ? "ปกติ" : "สูง", // ระดับน้ำตาลในเลือด
  diabetesRisk: i % 3 === 0 ? "ต่ำ" : i % 3 === 1 ? "ปานกลาง" : "สูง", // ความเสี่ยงการเกิดโรคเบาหวาน
  physicalActivity: i % 2 === 0 ? "ปกติ" : "เหนื่อยง่าย", // กิจกรรมทางกายเหนื่อยกว่าปกติ
  sleepQuality: i % 3 === 0 ? "ดี" : i % 3 === 1 ? "พอใช้" : "แย่", // ประเมินการนอนหลับ
  depression2Q: i % 2 === 0 ? "ปกติ" : "มีอาการ", // คัดกรองภาวะซึมเศร้า2Q
  stressST5: i % 3 === 0 ? "ต่ำ" : i % 3 === 1 ? "ปานกลาง" : "สูง", // ประเมินความเครียดST-5
  cvdRisk: i % 2 === 0 ? "ต่ำ" : "สูง", // ความเสี่ยงต่อการเกิดโรคหัวใจและหลอดเลือด
  vegetableConsumption: i % 2 === 0 ? "เพียงพอ" : "ไม่เพียงพอ", // พฤติกรรมบริโภคผัก
  sugarConsumption: i % 3 === 0 ? "น้อย" : i % 3 === 1 ? "ปานกลาง" : "มาก", // พฤติกรรมบริโภคน้ำตาล
}));

const NcdsScreeningDetail = ({ reportData }) => {
  const router = useRouter();
  const tableRef = useRef(null);

  // ถ้าไม่มีข้อมูล ให้ใช้ค่า default
  const year = reportData?.year || "2568";
  const month = reportData?.month || "มิถุนายน";
  const name = reportData?.name || "นางสาวชุชนาถ ผดุงจิตร";

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();

      // เพิ่ม Thai font
      doc.addFileToVFS("Sarabun-Regular.ttf", SarabunFont);
      doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
      doc.addFileToVFS("Sarabun-Bold.ttf", SarabunBoldFont);
      doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
      doc.setFont("Sarabun");

      // Header - Title
      doc.setFontSize(14);
      doc.setFont("Sarabun", "bold");
      doc.text(`แบบรายงานการคัดกรองโรคไม่ติดต่อเรื้อรัง (NCDs) ปีงบประมาณ ${year}`, 105, 15, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("Sarabun", "normal");
      doc.text(`ประจำเดือน ${month}`, 105, 22, { align: "center" });
      doc.text(name, 105, 28, { align: "center" });

      // Table settings - Landscape orientation for wide table
      doc.addPage('a4', 'landscape');
      doc.deletePage(1);

      // Add title on the landscape page
      doc.setFontSize(14);
      doc.setFont("Sarabun", "bold");
      doc.text(`แบบรายงานการคัดกรองโรคไม่ติดต่อเรื้อรัง (NCDs) ปีงบประมาณ ${year}`, 148.5, 10, { align: "center" });
      doc.setFontSize(12);
      doc.setFont("Sarabun", "normal");
      doc.text(`ประจำเดือน ${month} - ${name}`, 148.5, 16, { align: "center" });

      const startX = 17;
      const startY = 22;
      const rowHeight = 9;
      const headerHeight = 16;

      // Column widths - 14 columns total - ลดความกว้างไม่ให้ทะลุ
      const colWidths = [10, 38, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18];
      const tableWidth = colWidths.reduce((sum, w) => sum + w, 0);

      // Draw table border
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);

      let currentY = startY;
      let currentX = startX;

      // Draw header
      doc.setFont("Sarabun", "bold");
      doc.setFontSize(8.5);

      const headers = [
        "ลำดับ",
        "รายชื่อ",
        "พฤติกรรม\nเสี่ยงโรค\nไม่ติดต่อ\nเรื้อรัง",
        "ภาวะอ้วน\nลงพุง",
        "ระดับ\nความดัน\nโลหิต",
        "ระดับ\nน้ำตาลใน\nเลือด",
        "ความเสี่ยง\nการเกิดโรค\nเบาหวาน",
        "กิจกรรม\nทางกาย\nเหนื่อยกว่า\nปกติ",
        "ประเมิน\nการนอน\nหลับ",
        "คัดกรอง\nภาวะซึม\nเศร้า2Q",
        "ประเมิน\nความ\nเครียดST-5",
        "ความเสี่ยง\nต่อการเกิด\nโรคหัวใจ\nและหลอด\nเลือด",
        "พฤติกรรม\nบริโภคผัก",
        "พฤติกรรม\nบริโภค\nน้ำตาล"
      ];

      currentX = startX;
      for (let i = 0; i < headers.length; i++) {
        doc.rect(currentX, currentY, colWidths[i], headerHeight);
        const lines = headers[i].split('\n');
        const lineHeight = 2.5;
        const startLineY = currentY + (headerHeight - (lines.length - 1) * lineHeight) / 2 + 1.5;
        lines.forEach((line, lineIdx) => {
          doc.text(line, currentX + colWidths[i] / 2, startLineY + lineIdx * lineHeight, { align: "center" });
        });
        currentX += colWidths[i];
      }

      // Draw body rows
      currentY += headerHeight;
      doc.setFont("Sarabun", "normal");
      doc.setFontSize(7);

      mockDetailData.forEach((row) => {
        if (currentY > 185) {
          doc.addPage('a4', 'landscape');
          currentY = 20;

          // Redraw header on new page
          currentX = startX;
          doc.setFont("Sarabun", "bold");
          doc.setFontSize(8.5);
          for (let i = 0; i < headers.length; i++) {
            doc.rect(currentX, currentY, colWidths[i], headerHeight);
            const lines = headers[i].split('\n');
            const lineHeight = 2.5;
            const startLineY = currentY + (headerHeight - (lines.length - 1) * lineHeight) / 2 + 1.5;
            lines.forEach((line, lineIdx) => {
              doc.text(line, currentX + colWidths[i] / 2, startLineY + lineIdx * lineHeight, { align: "center" });
            });
            currentX += colWidths[i];
          }
          currentY += headerHeight;
          doc.setFont("Sarabun", "normal");
          doc.setFontSize(7);
        }

        currentX = startX;

        // ลำดับ
        doc.rect(currentX, currentY, colWidths[0], rowHeight);
        doc.setFont("Sarabun", "bold");
        doc.text(row.no.toString(), currentX + colWidths[0] / 2, currentY + 5.5, { align: "center" });
        currentX += colWidths[0];

        // รายชื่อ
        doc.rect(currentX, currentY, colWidths[1], rowHeight);
        doc.setFont("Sarabun", "normal");
        doc.text(row.name, currentX + colWidths[1] / 2, currentY + 5.5, { align: "center" });
        currentX += colWidths[1];

        // Data columns - 12 columns
        const values = [
          row.riskBehavior,
          row.obesity,
          row.bloodPressure,
          row.bloodSugar,
          row.diabetesRisk,
          row.physicalActivity,
          row.sleepQuality,
          row.depression2Q,
          row.stressST5,
          row.cvdRisk,
          row.vegetableConsumption,
          row.sugarConsumption
        ];

        for (let i = 0; i < 12; i++) {
          doc.rect(currentX, currentY, colWidths[i + 2], rowHeight);
          doc.text(values[i], currentX + colWidths[i + 2] / 2, currentY + 5.5, { align: "center" });
          currentX += colWidths[i + 2];
        }

        currentY += rowHeight;
      });

      // บันทึกไฟล์
      doc.save(`รายงานคัดกรอง_NCDs_${month}_${year}_${name}.pdf`);
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
              onClick={() => router.push("/ncds-screening")}
              className="flex items-center gap-2 px-4 py-2 mb-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl transition-all duration-200 w-fit"
            >
              <ArrowLeft size={20} />
              <span className="font-semibold">กลับ</span>
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Heart size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  รายละเอียดข้อมูลคัดกรองโรคไม่ติดต่อเรื้อรัง (NCDs)
                </h1>
                <p className="text-white/80 text-sm mt-1">
                  ตรวจสอบรายละเอียดรายงานการคัดกรองโรค NCDs
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
              แบบรายงานการคัดกรองโรคไม่ติดต่อเรื้อรัง (NCDs) ปีงบประมาณ {year}
            </h2>
            <p className="text-gray-700 font-medium text-base mb-1">
              ประจำเดือน {month}
            </p>
            <p className="text-gray-700 font-medium text-base">{name}</p>
          </div>

          {/* Export Button - Right top - Hide in PDF */}
          <button
            onClick={handleExportPDF}
            className="export-button flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#7e32e2] to-[#9333ea] text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 text-base"
          >
            <Download size={20} />
            Export PDF
          </button>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full border-collapse" style={{ minWidth: "1100px" }}>
            <thead>
              <tr className="bg-white">
                <th className="border border-black py-2 px-1 font-bold text-center text-[#231d37]" style={{ width: "30px", fontSize: "11px" }}>
                  ลำดับ
                </th>
                <th className="border border-black py-2 px-1 font-bold text-center text-[#231d37]" style={{ width: "100px", fontSize: "11px" }}>
                  รายชื่อ
                </th>
                <th className="border border-black py-2 px-1 font-bold text-center text-[#231d37]" style={{ fontSize: "10px", lineHeight: "1.3", width: "70px" }}>
                  พฤติกรรม<br/>เสี่ยงโรค<br/>ไม่ติดต่อ<br/>เรื้อรัง
                </th>
                <th className="border border-black py-2 px-1 font-bold text-center text-[#231d37]" style={{ fontSize: "10px", lineHeight: "1.3", width: "60px" }}>
                  ภาวะ<br/>อ้วนลงพุง
                </th>
                <th className="border border-black py-2 px-1 font-bold text-center text-[#231d37]" style={{ fontSize: "10px", lineHeight: "1.3", width: "60px" }}>
                  ระดับ<br/>ความดัน<br/>โลหิต
                </th>
                <th className="border border-black py-2 px-1 font-bold text-center text-[#231d37]" style={{ fontSize: "10px", lineHeight: "1.3", width: "60px" }}>
                  ระดับ<br/>น้ำตาล<br/>ในเลือด
                </th>
                <th className="border border-black py-2 px-1 font-bold text-center text-[#231d37]" style={{ fontSize: "10px", lineHeight: "1.3", width: "70px" }}>
                  ความเสี่ยง<br/>การเกิดโรค<br/>เบาหวาน
                </th>
                <th className="border border-black py-2 px-1 font-bold text-center text-[#231d37]" style={{ fontSize: "10px", lineHeight: "1.3", width: "65px" }}>
                  กิจกรรม<br/>ทางกาย<br/>เหนื่อย<br/>กว่าปกติ
                </th>
                <th className="border border-black py-2 px-1 font-bold text-center text-[#231d37]" style={{ fontSize: "10px", lineHeight: "1.3", width: "60px" }}>
                  ประเมิน<br/>การนอน<br/>หลับ
                </th>
                <th className="border border-black py-2 px-1 font-bold text-center text-[#231d37]" style={{ fontSize: "10px", lineHeight: "1.3", width: "65px" }}>
                  คัดกรอง<br/>ภาวะซึม<br/>เศร้า2Q
                </th>
                <th className="border border-black py-2 px-1 font-bold text-center text-[#231d37]" style={{ fontSize: "10px", lineHeight: "1.3", width: "65px" }}>
                  ประเมิน<br/>ความ<br/>เครียด<br/>ST-5
                </th>
                <th className="border border-black py-2 px-1 font-bold text-center text-[#231d37]" style={{ fontSize: "10px", lineHeight: "1.3", width: "75px" }}>
                  ความเสี่ยง<br/>ต่อการเกิด<br/>โรคหัวใจ<br/>และหลอด<br/>เลือด
                </th>
                <th className="border border-black py-2 px-1 font-bold text-center text-[#231d37]" style={{ fontSize: "10px", lineHeight: "1.3", width: "65px" }}>
                  พฤติกรรม<br/>บริโภคผัก
                </th>
                <th className="border border-black py-2 px-1 font-bold text-center text-[#231d37]" style={{ fontSize: "10px", lineHeight: "1.3", width: "65px" }}>
                  พฤติกรรม<br/>บริโภค<br/>น้ำตาล
                </th>
              </tr>
            </thead>
            <tbody>
              {mockDetailData.map((row, idx) => (
                <tr
                  key={row.no}
                  className="bg-white hover:bg-[#faf8ff] transition-colors"
                >
                  <td className="border border-black py-2 px-1 text-center font-semibold text-[#231d37]" style={{ fontSize: "11px" }}>
                    {row.no}
                  </td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37] font-medium" style={{ fontSize: "11px" }}>
                    {row.name}
                  </td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                    {row.riskBehavior}
                  </td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                    {row.obesity}
                  </td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                    {row.bloodPressure}
                  </td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                    {row.bloodSugar}
                  </td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                    {row.diabetesRisk}
                  </td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                    {row.physicalActivity}
                  </td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                    {row.sleepQuality}
                  </td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                    {row.depression2Q}
                  </td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                    {row.stressST5}
                  </td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                    {row.cvdRisk}
                  </td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                    {row.vegetableConsumption}
                  </td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                    {row.sugarConsumption}
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

export default NcdsScreeningDetail;
