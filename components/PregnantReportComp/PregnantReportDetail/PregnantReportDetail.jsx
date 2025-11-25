import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, TruckIcon, FileText, User2, Calendar, Download } from "lucide-react";
import jsPDF from "jspdf";
import { font as SarabunFont } from "../../../styles/Sarabun-Regular-normal";
import { fontbold as SarabunBoldFont } from "../../../styles/Sarabun-Regular-bold";

// Mock data สำหรับตารางรายละเอียด
const mockDetailData = Array.from({ length: 20 }, (_, i) => ({
  no: i + 1,
  name: `นาง${["สมใจ มีสุข", "วรรณา ใจดี", "มาลี รักษ์ดี", "สุดา สุขใจ"][i % 4]}`,
  // หญิงตั้งครรภ์
  pregnant_0_12: i % 3 === 0 ? 1 : 0,
  pregnant_13_24: i % 3 === 1 ? 1 : 0,
  pregnant_25_plus: i % 3 === 2 ? 1 : 0,
  // หญิงหลังคลอด
  postpartum_0_12: i % 2 === 0 ? 1 : 0,
  postpartum_13_24: i % 2 === 1 ? 1 : 0,
}));

const PregnantReportDetail = ({ reportData }) => {
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
      doc.text(`แบบรายงานผลการปฏิบัติงานของ อสม. ปีงบประมาณ ${year}`, 105, 15, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("Sarabun", "normal");
      doc.text(`ประจำเดือน ${month}`, 105, 22, { align: "center" });
      doc.text(name, 105, 28, { align: "center" });

      // Table settings
      const startX = 18;
      const startY = 38;
      const rowHeight = 7;
      const headerHeight = 9;

      // Column widths
      const colWidths = [18, 45, 22, 22, 22, 22, 22]; // ลำดับ, รายชื่อ, pregnant x3, postpartum x2
      const tableWidth = colWidths.reduce((sum, w) => sum + w, 0);

      // Draw table border
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);

      // Header Row 1 - Main headers with rowSpan
      let currentY = startY;

      // Draw header backgrounds
      doc.setFillColor(255, 255, 255);
      doc.rect(startX, currentY, tableWidth, headerHeight * 2, 'F');

      // Draw header borders and text
      doc.setFont("Sarabun", "bold");
      doc.setFontSize(11);

      let currentX = startX;

      // ลำดับ (rowSpan 2)
      doc.rect(currentX, currentY, colWidths[0], headerHeight * 2);
      doc.text("ลำดับ", currentX + colWidths[0] / 2, currentY + headerHeight, { align: "center" });
      currentX += colWidths[0];

      // รายชื่อ (rowSpan 2)
      doc.rect(currentX, currentY, colWidths[1], headerHeight * 2);
      doc.text("รายชื่อ", currentX + colWidths[1] / 2, currentY + headerHeight, { align: "center" });
      currentX += colWidths[1];

      // หญิงตั้งครรภ์ (colSpan 3)
      const pregnantWidth = colWidths[2] + colWidths[3] + colWidths[4];
      doc.rect(currentX, currentY, pregnantWidth, headerHeight);
      doc.text("หญิงตั้งครรภ์", currentX + pregnantWidth / 2, currentY + 5.5, { align: "center" });

      // หญิงหลังคลอด (colSpan 2)
      const postpartumWidth = colWidths[5] + colWidths[6];
      doc.rect(currentX + pregnantWidth, currentY, postpartumWidth, headerHeight);
      doc.text("หญิงหลังคลอด", currentX + pregnantWidth + postpartumWidth / 2, currentY + 5.5, { align: "center" });

      // Header Row 2 - Sub headers
      currentY += headerHeight;
      currentX = startX + colWidths[0] + colWidths[1]; // Skip first two columns (rowSpan)

      doc.setFontSize(8.5);

      // Sub headers for pregnant
      const subHeaders = [
        "อายุครรภ์\nไม่เกิน 12 สัปดาห์",
        "อายุครรภ์\n13 - 24 สัปดาห์",
        "อายุครรภ์\n25 สัปดาห์ขึ้นไป",
        "อายุครรภ์\nไม่เกิน 12 สัปดาห์",
        "อายุครรภ์\n13 - 24 สัปดาห์"
      ];

      for (let i = 0; i < 5; i++) {
        doc.rect(currentX, currentY, colWidths[i + 2], headerHeight);
        const lines = subHeaders[i].split('\n');
        doc.text(lines[0], currentX + colWidths[i + 2] / 2, currentY + 4, { align: "center" });
        doc.text(lines[1], currentX + colWidths[i + 2] / 2, currentY + 7.5, { align: "center" });
        currentX += colWidths[i + 2];
      }

      // Draw body rows
      currentY += headerHeight;
      doc.setFont("Sarabun", "normal");
      doc.setFontSize(10);

      mockDetailData.forEach((row) => {
        currentX = startX;

        // ลำดับ
        doc.rect(currentX, currentY, colWidths[0], rowHeight);
        doc.setFont("Sarabun", "bold");
        doc.setFontSize(10);
        doc.text(row.no.toString(), currentX + colWidths[0] / 2, currentY + 4.5, { align: "center" });
        currentX += colWidths[0];

        // รายชื่อ
        doc.rect(currentX, currentY, colWidths[1], rowHeight);
        doc.setFont("Sarabun", "normal");
        doc.setFontSize(8);
        doc.text(row.name, currentX + colWidths[1] / 2, currentY + 4.5, { align: "center" });
        currentX += colWidths[1];

        // Data columns with checkmarks
        doc.setFont("Sarabun", "bold");
        doc.setFontSize(11);
        const values = [
          row.pregnant_0_12 ? "√" : "X",
          row.pregnant_13_24 ? "√" : "X",
          row.pregnant_25_plus ? "√" : "X",
          row.postpartum_0_12 ? "√" : "X",
          row.postpartum_13_24 ? "√" : "X"
        ];

        for (let i = 0; i < 5; i++) {
          doc.rect(currentX, currentY, colWidths[i + 2], rowHeight);
          doc.text(values[i], currentX + colWidths[i + 2] / 2, currentY + 4.8, { align: "center" });
          currentX += colWidths[i + 2];
        }

        currentY += rowHeight;
      });

      // Summary row
      currentX = startX;
      doc.setFont("Sarabun", "bold");
      doc.setFontSize(10);

      // รวมทั้งหมด (colSpan 2)
      doc.rect(currentX, currentY, colWidths[0] + colWidths[1], rowHeight);
      doc.text("รวมทั้งหมด", currentX + (colWidths[0] + colWidths[1]) / 2, currentY + 4.5, { align: "center" });
      currentX += colWidths[0] + colWidths[1];

      // Totals
      const totals = [
        mockDetailData.reduce((sum, r) => sum + r.pregnant_0_12, 0),
        mockDetailData.reduce((sum, r) => sum + r.pregnant_13_24, 0),
        mockDetailData.reduce((sum, r) => sum + r.pregnant_25_plus, 0),
        mockDetailData.reduce((sum, r) => sum + r.postpartum_0_12, 0),
        mockDetailData.reduce((sum, r) => sum + r.postpartum_13_24, 0)
      ];

      for (let i = 0; i < 5; i++) {
        doc.rect(currentX, currentY, colWidths[i + 2], rowHeight);
        doc.text(totals[i].toString(), currentX + colWidths[i + 2] / 2, currentY + 4.5, { align: "center" });
        currentX += colWidths[i + 2];
      }

      // บันทึกไฟล์
      doc.save(`รายงานหญิงตั้งครรภ์_${month}_${year}_${name}.pdf`);
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
              onClick={() => router.push("/pregnant-report")}
              className="flex items-center gap-2 px-4 py-2 mb-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl transition-all duration-200 w-fit"
            >
              <ArrowLeft size={20} />
              <span className="font-semibold">กลับ</span>
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <FileText size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  รายละเอียดข้อมูลรายงานประเมินหญิงตั้งครรภ์
                </h1>
                <p className="text-white/80 text-sm mt-1">
                  ตรวจสอบรายละเอียดรายงานผลการปฏิบัติงาน
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
              แบบรายงานผลการปฏิบัติงานของ อสม. ปีงบประมาณ {year}
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
          <table className="w-full border-collapse">
            <thead>
              {/* Row 1: Main headers */}
              <tr className="bg-white">
                <th
                  rowSpan={2}
                  className="border border-black py-4 px-4 font-bold text-center text-[#231d37] text-base"
                  style={{ width: "80px" }}
                >
                  ลำดับ
                </th>
                <th
                  rowSpan={2}
                  className="border border-black py-4 px-4 font-bold text-center text-[#231d37] text-base"
                  style={{ width: "280px" }}
                >
                  รายชื่อ
                </th>
                <th
                  colSpan={3}
                  className="border border-black py-4 px-4 font-bold text-center text-[#231d37] text-base"
                >
                  หญิงตั้งครรภ์
                </th>
                <th
                  colSpan={2}
                  className="border border-black py-4 px-4 font-bold text-center text-[#231d37] text-base"
                >
                  หญิงหลังคลอด
                </th>
              </tr>
              {/* Row 2: Sub headers */}
              <tr className="bg-white">
                {/* หญิงตั้งครรภ์ - 3 columns */}
                <th className="border border-black py-3 px-3 font-semibold text-center text-sm text-[#231d37] leading-tight">
                  <div>อายุครรภ์</div>
                  <div>ไม่เกิน 12 สัปดาห์</div>
                </th>
                <th className="border border-black py-3 px-3 font-semibold text-center text-sm text-[#231d37] leading-tight">
                  <div>อายุครรภ์</div>
                  <div>13 - 24 สัปดาห์</div>
                </th>
                <th className="border border-black py-3 px-3 font-semibold text-center text-sm text-[#231d37] leading-tight">
                  <div>อายุครรภ์</div>
                  <div>25 สัปดาห์ขึ้นไป</div>
                </th>
                {/* หญิงหลังคลอด - 2 columns */}
                <th className="border border-black py-3 px-3 font-semibold text-center text-sm text-[#231d37] leading-tight">
                  <div>อายุครรภ์</div>
                  <div>ไม่เกิน 12 สัปดาห์</div>
                </th>
                <th className="border border-black py-3 px-3 font-semibold text-center text-sm text-[#231d37] leading-tight">
                  <div>อายุครรภ์</div>
                  <div>13 - 24 สัปดาห์</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {mockDetailData.map((row, idx) => (
                <tr
                  key={row.no}
                  className="bg-white hover:bg-[#faf8ff] transition-colors"
                >
                  <td className="border border-black py-3 px-3 text-center font-semibold text-[#231d37] text-sm">
                    {row.no}
                  </td>
                  <td className="border border-black py-3 px-3 text-center text-[#231d37] font-medium text-sm">
                    {row.name}
                  </td>
                  {/* หญิงตั้งครรภ์ */}
                  <td className="border border-black py-3 px-3 text-center text-[#231d37] font-bold text-base">
                    {row.pregnant_0_12 ? "✓" : "✗"}
                  </td>
                  <td className="border border-black py-3 px-3 text-center text-[#231d37] font-bold text-base">
                    {row.pregnant_13_24 ? "✓" : "✗"}
                  </td>
                  <td className="border border-black py-3 px-3 text-center text-[#231d37] font-bold text-base">
                    {row.pregnant_25_plus ? "✓" : "✗"}
                  </td>
                  {/* หญิงหลังคลอด */}
                  <td className="border border-black py-3 px-3 text-center text-[#231d37] font-bold text-base">
                    {row.postpartum_0_12 ? "✓" : "✗"}
                  </td>
                  <td className="border border-black py-3 px-3 text-center text-[#231d37] font-bold text-base">
                    {row.postpartum_13_24 ? "✓" : "✗"}
                  </td>
                </tr>
              ))}
              {/* Summary Row */}
              <tr className="bg-[#f5f0ff] font-bold">
                <td
                  colSpan={2}
                  className="border border-black py-3 px-3 text-center text-[#231d37] text-base"
                >
                  รวมทั้งหมด
                </td>
                <td className="border border-black py-3 px-3 text-center text-[#231d37] text-base">
                  {mockDetailData.reduce((sum, r) => sum + r.pregnant_0_12, 0)}
                </td>
                <td className="border border-black py-3 px-3 text-center text-[#231d37] text-base">
                  {mockDetailData.reduce((sum, r) => sum + r.pregnant_13_24, 0)}
                </td>
                <td className="border border-black py-3 px-3 text-center text-[#231d37] text-base">
                  {mockDetailData.reduce((sum, r) => sum + r.pregnant_25_plus, 0)}
                </td>
                <td className="border border-black py-3 px-3 text-center text-[#231d37] text-base">
                  {mockDetailData.reduce((sum, r) => sum + r.postpartum_0_12, 0)}
                </td>
                <td className="border border-black py-3 px-3 text-center text-[#231d37] text-base">
                  {mockDetailData.reduce((sum, r) => sum + r.postpartum_13_24, 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PregnantReportDetail;
