import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Download } from "lucide-react";
import jsPDF from "jspdf";
import { font as SarabunFont } from "../../../styles/Sarabun-Regular-normal";
import { fontbold as SarabunBoldFont } from "../../../styles/Sarabun-Regular-bold";

const PregnantReportDetail = ({ reportData, evaluations = [] }) => {
  const router = useRouter();
  const tableRef = useRef(null);

  // ถ้าไม่มีข้อมูล ให้ใช้ค่า default
  const year = reportData?.year || "2568";
  const month = reportData?.month || "มิถุนายน";
  const name = reportData?.name || "ไม่พบข้อมูล";

  // แปลงข้อมูลเป็นรูปแบบตาราง (1 แถวต่อ 1 คน)
  const tableData = evaluations.map((evaluation, index) => {
    console.log("Evaluation data:", evaluation); // Debug log

    // รองรับหลายรูปแบบของชื่อฟิลด์
    const category = evaluation.category || evaluation.q0_category;
    const stage = evaluation.stage || evaluation.q0_stage;

    const row = {
      no: index + 1,
      name: evaluation.name || evaluation.target_name || "-",
      // หญิงตั้งครรภ์
      pregnant_0_12: category === "A" && stage === "A1" ? 1 : 0,
      pregnant_13_24: category === "A" && stage === "A2" ? 1 : 0,
      pregnant_25_plus: category === "A" && stage === "A3" ? 1 : 0,
      // หญิงหลังคลอด
      postpartum_0_12: category === "B" && stage === "B1" ? 1 : 0,
      postpartum_13_24: category === "B" && stage === "B2" ? 1 : 0,
      postpartum_25_plus: category === "B" && stage === "B3" ? 1 : 0,
      // ข้อมูลเพิ่มเติม
      q1_received_medicine: evaluation.q1_received_medicine,
      q2_frequency: evaluation.q2_frequency,
      q3_reason: evaluation.q3_reason,
    };
    console.log("Row data (category:", category, ", stage:", stage, "):", row); // Debug log
    return row;
  });

  // Helper functions สำหรับ labels
  const getMedicineStatus = (status) => {
    return status === "Y" ? "ได้รับยา" : status === "N" ? "ไม่ได้รับยา" : "-";
  };

  const getFrequencyLabel = (freq) => {
    const freqMap = {
      A: "ทุกวัน",
      B: "5-6 วัน/สัปดาห์",
      C: "3-4 วัน/สัปดาห์",
      D: "1-2 วัน/สัปดาห์",
      E: "ไม่ได้ทาน",
    };
    return freqMap[freq] || "-";
  };

  const handleExportPDF = () => {
    try {
      console.log("=== Exporting PDF ===");
      console.log("tableData:", tableData);
      console.log("First row:", tableData[0]);

      const doc = new jsPDF();

      // เพิ่ม Thai font
      doc.addFileToVFS("Sarabun-Regular.ttf", SarabunFont);
      doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
      doc.addFileToVFS("Sarabun-Bold.ttf", SarabunBoldFont);
      doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
      doc.setFont("Sarabun");

      // ตั้งค่าจำนวนแถวต่อหน้า
      const ROWS_PER_PAGE = 10;
      const totalPages = Math.ceil(tableData.length / ROWS_PER_PAGE);

      // ฟังก์ชันสำหรับวาดลายน้ำโลโก้
      const addWatermark = (doc) => {
        const watermarkImage = "/Smart_Osm_Plus.png";
        const imgWidth = 150;
        const imgHeight = 100;

        const centerX = 220 / 2;
        const centerY = 360 / 2;

        const x = centerX - (imgWidth / 2);
        const y = centerY - (imgHeight / 2);

        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.10 }));
        doc.addImage(watermarkImage, 'PNG', x, y, imgWidth, imgHeight, '', 'NONE', 0);
        doc.restoreGraphicsState();
      };

      // Table settings
      const rowHeight = 12;
      const headerHeight = 11;
      const colWidths = [7, 22, 13, 13, 13, 13, 13, 13, 14, 20, 36];
      const tableWidth = colWidths.reduce((sum, w) => sum + w, 0);
      const startX = (210 - tableWidth) / 2;

      // Sub headers for pregnant and postpartum
      const subHeaders = [
        "อายุครรภ์\nไม่เกิน\n12 สัปดาห์",
        "อายุครรภ์\n13 - 24\nสัปดาห์",
        "อายุครรภ์\n25 สัปดาห์\nขึ้นไป",
        "หลังคลอด\nไม่เกิน\n12 สัปดาห์",
        "หลังคลอด\n13 - 24\nสัปดาห์",
        "หลังคลอด\n25 สัปดาห์\nขึ้นไป"
      ];

      // ฟังก์ชันวาด Header ของตาราง
      const drawTableHeader = (doc, startY) => {
        let currentY = startY;
        let currentX = startX;

        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.4);
        doc.setFillColor(255, 255, 255);
        doc.rect(startX, currentY, tableWidth, headerHeight * 2, 'F');

        doc.setFont("Sarabun", "bold");
        doc.setFontSize(11);

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

        // หญิงหลังคลอด (colSpan 3)
        const postpartumWidth = colWidths[5] + colWidths[6] + colWidths[7];
        doc.rect(currentX + pregnantWidth, currentY, postpartumWidth, headerHeight);
        doc.text("หญิงหลังคลอด", currentX + pregnantWidth + postpartumWidth / 2, currentY + 5.5, { align: "center" });

        // รับยา (rowSpan 2)
        doc.rect(currentX + pregnantWidth + postpartumWidth, currentY, colWidths[8], headerHeight * 2);
        doc.text("รับยา", currentX + pregnantWidth + postpartumWidth + colWidths[8] / 2, currentY + headerHeight, { align: "center" });

        // จำนวนวันฯ (rowSpan 2)
        doc.rect(currentX + pregnantWidth + postpartumWidth + colWidths[8], currentY, colWidths[9], headerHeight * 2);
        const daysText = "จำนวนวันใน\n1 สัปดาห์\nที่ทานยา";
        const daysLines = daysText.split('\n');
        doc.setFontSize(6);
        doc.text(daysLines[0], currentX + pregnantWidth + postpartumWidth + colWidths[8] + colWidths[9] / 2, currentY + headerHeight - 3, { align: "center" });
        doc.text(daysLines[1], currentX + pregnantWidth + postpartumWidth + colWidths[8] + colWidths[9] / 2, currentY + headerHeight, { align: "center" });
        doc.text(daysLines[2], currentX + pregnantWidth + postpartumWidth + colWidths[8] + colWidths[9] / 2, currentY + headerHeight + 3, { align: "center" });
        doc.setFontSize(11);

        // สาเหตุ (rowSpan 2)
        doc.rect(currentX + pregnantWidth + postpartumWidth + colWidths[8] + colWidths[9], currentY, colWidths[10], headerHeight * 2);
        doc.text("สาเหตุ", currentX + pregnantWidth + postpartumWidth + colWidths[8] + colWidths[9] + colWidths[10] / 2, currentY + headerHeight, { align: "center" });

        // Header Row 2 - Sub headers
        currentY += headerHeight;
        currentX = startX + colWidths[0] + colWidths[1];

        doc.setFontSize(7);
        for (let i = 0; i < 6; i++) {
          doc.rect(currentX, currentY, colWidths[i + 2], headerHeight);
          const lines = subHeaders[i].split('\n');
          const subStartY = currentY + 2;
          doc.text(lines[0], currentX + colWidths[i + 2] / 2, subStartY + 2, { align: "center" });
          doc.text(lines[1], currentX + colWidths[i + 2] / 2, subStartY + 5, { align: "center" });
          doc.text(lines[2], currentX + colWidths[i + 2] / 2, subStartY + 8, { align: "center" });
          currentX += colWidths[i + 2];
        }

        return currentY + headerHeight;
      };

      // ฟังก์ชันวาดแถวข้อมูล
      const drawDataRow = (doc, row, currentY) => {
        let currentX = startX;

        // ลำดับ
        doc.rect(currentX, currentY, colWidths[0], rowHeight);
        doc.setFont("Sarabun", "bold");
        doc.setFontSize(9);
        doc.text(row.no.toString(), currentX + colWidths[0] / 2, currentY + 7, { align: "center" });
        currentX += colWidths[0];

        // รายชื่อ
        doc.rect(currentX, currentY, colWidths[1], rowHeight);
        doc.setFont("Sarabun", "normal");
        doc.setFontSize(6.5);
        const nameLines = doc.splitTextToSize(row.name, colWidths[1] - 2);
        doc.text(nameLines[0] || row.name, currentX + colWidths[1] / 2, currentY + 7, { align: "center" });
        currentX += colWidths[1];

        // Data columns with checkmarks
        doc.setFont("Sarabun", "bold");
        doc.setFontSize(10);
        const values = [
          row.pregnant_0_12 ? "/" : "-",
          row.pregnant_13_24 ? "/" : "-",
          row.pregnant_25_plus ? "/" : "-",
          row.postpartum_0_12 ? "/" : "-",
          row.postpartum_13_24 ? "/" : "-",
          row.postpartum_25_plus ? "/" : "-"
        ];

        for (let i = 0; i < 6; i++) {
          doc.rect(currentX, currentY, colWidths[i + 2], rowHeight);
          doc.text(values[i], currentX + colWidths[i + 2] / 2, currentY + 7.5, { align: "center" });
          currentX += colWidths[i + 2];
        }

        // รับยา
        doc.rect(currentX, currentY, colWidths[8], rowHeight);
        doc.setFont("Sarabun", "normal");
        doc.setFontSize(6);
        const medStatus = getMedicineStatus(row.q1_received_medicine);
        doc.text(medStatus, currentX + colWidths[8] / 2, currentY + 7, { align: "center", maxWidth: colWidths[8] - 2 });
        currentX += colWidths[8];

        // จำนวนวันฯ
        doc.rect(currentX, currentY, colWidths[9], rowHeight);
        doc.setFontSize(5.5);
        const freqLabel = getFrequencyLabel(row.q2_frequency);
        const freqLines = doc.splitTextToSize(freqLabel, colWidths[9] - 2);
        if (freqLines.length > 1) {
          doc.text(freqLines[0], currentX + colWidths[9] / 2, currentY + 5.5, { align: "center" });
          doc.text(freqLines[1], currentX + colWidths[9] / 2, currentY + 8.5, { align: "center" });
        } else {
          doc.text(freqLabel, currentX + colWidths[9] / 2, currentY + 7, { align: "center" });
        }
        currentX += colWidths[9];

        // สาเหตุ
        doc.rect(currentX, currentY, colWidths[10], rowHeight);
        doc.setFontSize(5);
        const reason = row.q3_reason || "-";
        const reasonLines = doc.splitTextToSize(reason, colWidths[10] - 2);
        const displayLines = reasonLines.slice(0, 3);
        let textY = currentY + 3.5;
        displayLines.forEach((line, index) => {
          doc.text(line, currentX + 1, textY + (index * 2.8), { align: "left" });
        });
      };

      // วนลูปสร้างแต่ละหน้า
      for (let pageNum = 0; pageNum < totalPages; pageNum++) {
        if (pageNum > 0) {
          doc.addPage();
        }

        // เพิ่มลายน้ำ
        addWatermark(doc);

        // Header - Title
        doc.setFontSize(14);
        doc.setFont("Sarabun", "bold");
        doc.text(`แบบรายงานผลการปฏิบัติงานของ อสม. ปีงบประมาณ ${year}`, 105, 15, { align: "center" });

        doc.setFontSize(12);
        doc.setFont("Sarabun", "normal");
        doc.text(`ประจำเดือน ${month}`, 105, 22, { align: "center" });
        doc.text(name, 105, 28, { align: "center" });

        // แสดงหมายเลขหน้า
        doc.setFontSize(10);
        doc.text(`หน้า ${pageNum + 1} / ${totalPages}`, 105, 34, { align: "center" });

        // วาด Header ตาราง
        const startY = 40;
        let currentY = drawTableHeader(doc, startY);

        // ดึงข้อมูลสำหรับหน้านี้
        const startIndex = pageNum * ROWS_PER_PAGE;
        const endIndex = Math.min(startIndex + ROWS_PER_PAGE, tableData.length);
        const pageData = tableData.slice(startIndex, endIndex);

        // วาดแถวข้อมูล
        doc.setFont("Sarabun", "normal");
        doc.setFontSize(10);

        pageData.forEach((row) => {
          drawDataRow(doc, row, currentY);
          currentY += rowHeight;
        });
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
            <p className="text-gray-600 text-sm mt-2">จำนวนทั้งหมด: {new Set(tableData.map(row => row.name)).size} คน</p>
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

        {tableData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText size={48} className="mx-auto mb-3 text-gray-300" />
            <p>ไม่พบข้อมูลการประเมิน</p>
          </div>
        ) : (
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
                    colSpan={3}
                    className="border border-black py-4 px-4 font-bold text-center text-[#231d37] text-base"
                  >
                    หญิงหลังคลอด
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-black py-4 px-4 font-bold text-center text-[#231d37] text-base"
                    style={{ width: "100px" }}
                  >
                    รับยา
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-black py-4 px-4 font-bold text-center text-[#231d37] text-base"
                    style={{ width: "120px" }}
                  >
                    จำนวนวันใน 1 สัปดาห์ที่ทานยา
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-black py-4 px-4 font-bold text-center text-[#231d37] text-base"
                    style={{ width: "200px" }}
                  >
                    สาเหตุ
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
                  {/* หญิงหลังคลอด - 3 columns */}
                  <th className="border border-black py-3 px-3 font-semibold text-center text-sm text-[#231d37] leading-tight">
                    <div>หลังคลอด</div>
                    <div>ไม่เกิน 12 สัปดาห์</div>
                  </th>
                  <th className="border border-black py-3 px-3 font-semibold text-center text-sm text-[#231d37] leading-tight">
                    <div>หลังคลอด</div>
                    <div>13 - 24 สัปดาห์</div>
                  </th>
                  <th className="border border-black py-3 px-3 font-semibold text-center text-sm text-[#231d37] leading-tight">
                    <div>หลังคลอด</div>
                    <div>25 สัปดาห์ขึ้นไป</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, idx) => (
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
                      {row.pregnant_0_12 ? "✓" : "-"}
                    </td>
                    <td className="border border-black py-3 px-3 text-center text-[#231d37] font-bold text-base">
                      {row.pregnant_13_24 ? "✓" : "-"}
                    </td>
                    <td className="border border-black py-3 px-3 text-center text-[#231d37] font-bold text-base">
                      {row.pregnant_25_plus ? "✓" : "-"}
                    </td>
                    {/* หญิงหลังคลอด */}
                    <td className="border border-black py-3 px-3 text-center text-[#231d37] font-bold text-base">
                      {row.postpartum_0_12 ? "✓" : "-"}
                    </td>
                    <td className="border border-black py-3 px-3 text-center text-[#231d37] font-bold text-base">
                      {row.postpartum_13_24 ? "✓" : "-"}
                    </td>
                    <td className="border border-black py-3 px-3 text-center text-[#231d37] font-bold text-base">
                      {row.postpartum_25_plus ? "✓" : "-"}
                    </td>
                    {/* รับยา */}
                    <td className="border border-black py-3 px-3 text-center text-[#231d37] text-sm">
                      {row.q1_received_medicine === "Y" ? "ได้รับยา" : row.q1_received_medicine === "N" ? "ไม่ได้รับยา" : "-"}
                    </td>
                    {/* จำนวนวันฯ */}
                    <td className="border border-black py-3 px-3 text-center text-[#231d37] text-xs">
                      {row.q2_frequency === "A" ? "ทุกวัน" :
                       row.q2_frequency === "B" ? "5-6 วัน/สัปดาห์" :
                       row.q2_frequency === "C" ? "3-4 วัน/สัปดาห์" :
                       row.q2_frequency === "D" ? "1-2 วัน/สัปดาห์" :
                       row.q2_frequency === "E" ? "ไม่ได้ทาน" : "-"}
                    </td>
                    {/* สาเหตุ */}
                    <td className="border border-black py-3 px-3 text-left text-[#231d37] text-xs">
                      {row.q3_reason || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PregnantReportDetail;
