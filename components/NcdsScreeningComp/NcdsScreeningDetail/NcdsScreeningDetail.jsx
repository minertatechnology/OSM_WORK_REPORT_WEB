import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, FileText, Download } from "lucide-react";
import jsPDF from "jspdf";
import { font as SarabunFont } from "../../../styles/Sarabun-Regular-normal";
import { fontbold as SarabunBoldFont } from "../../../styles/Sarabun-Regular-bold";

const NcdsScreeningDetail = ({ reportData }) => {
  const router = useRouter();
  const tableRef = useRef(null);

  // ถ้าไม่มีข้อมูล ให้ใช้ค่า default
  const year = reportData?.year || "2568";
  const month = reportData?.month || "มิถุนายน";
  const name = reportData?.name || "นางสาวชุชนาถ ผดุงจิตร";
  const date = reportData?.date || "";
  const rawData = reportData?.rawData || {};

  // ฟังก์ชันแปลง JSON string เป็น object
  const parseResult = (resultString) => {
    if (!resultString) return {};
    try {
      return JSON.parse(resultString);
    } catch (e) {
      return {};
    }
  };

  // แปลงข้อมูล result ต่างๆ
  const bmiResult = parseResult(rawData.result_bmi);
  const waistResult = parseResult(rawData.result_waist);
  const bloodPressureResult = parseResult(rawData.result_blood_pressure);
  const glucoseResult = parseResult(rawData.result_glucose);
  const diabetesRiskResult = parseResult(rawData.result_diabetes_risk);
  const exerciseResult = parseResult(rawData.result_exercise);
  const sleepResult = parseResult(rawData.result_sleep);
  const depressionResult = parseResult(rawData.result_depression);
  const stressResult = parseResult(rawData.result_stress);
  const cvRiskResult = parseResult(rawData.result_cv_risk);
  const dietVegetableResult = parseResult(rawData.result_diet_vegetable);
  const dietSugarResult = parseResult(rawData.result_diet_sugar);
  const dietFatResult = parseResult(rawData.result_diet_fat);
  const dietSodiumResult = parseResult(rawData.result_diet_sodium);

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

      // Column widths - 17 columns total (เพิ่ม BMI, ปรับให้พอดีกับกระดาษ A4 แนวนอน)
      const colWidths = [8, 30, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14];
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
        "BMI",
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
        "พฤติกรรม\nบริโภค\nน้ำตาล",
        "พฤติกรรม\nบริโภค\nไขมัน",
        "พฤติกรรม\nบริโภค\nเกลือ"
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

      // Draw body row - ใช้ข้อมูลจริงจาก API
      currentY += headerHeight;
      doc.setFont("Sarabun", "normal");
      doc.setFontSize(6.5); // ลดขนาดฟอนต์จาก 7 เป็น 6.5

      currentX = startX;

      // ลำดับ
      doc.rect(currentX, currentY, colWidths[0], rowHeight);
      doc.setFont("Sarabun", "bold");
      doc.text("1", currentX + colWidths[0] / 2, currentY + 5.5, { align: "center" });
      currentX += colWidths[0];

      // รายชื่อ - แบ่งชื่อยาวเป็นหลายบรรทัด
      doc.rect(currentX, currentY, colWidths[1], rowHeight);
      doc.setFont("Sarabun", "normal");

      // แบ่งชื่อถ้ายาวเกิน
      const nameLines = [];
      if (name.length > 20) {
        const nameParts = name.split(" ");
        let line1 = nameParts[0] || "";
        let line2 = nameParts.slice(1).join(" ") || "";
        nameLines.push(line1);
        if (line2) nameLines.push(line2);
      } else {
        nameLines.push(name);
      }

      const nameLineHeight = 2.8;
      const nameTotalHeight = nameLines.length * nameLineHeight;
      const nameStartY = currentY + (rowHeight - nameTotalHeight) / 2 + nameLineHeight / 2 + 1;

      nameLines.forEach((line, idx) => {
        doc.text(line, currentX + colWidths[1] / 2, nameStartY + idx * nameLineHeight, { align: "center" });
      });

      currentX += colWidths[1];

      // Data columns - 15 columns - ใช้ข้อมูลจริง (เพิ่ม BMI)
      const values = [
        rawData.q1_has_ncds === "yes" ? "มี" : rawData.q1_has_ncds === "no" ? "ไม่มี" : "-",
        bmiResult.level_th || "-",
        waistResult.level_th || "-",
        bloodPressureResult.level_th || "-",
        glucoseResult.level_th || "-",
        diabetesRiskResult.level_th || "-",
        exerciseResult.level_th || "-",
        sleepResult.level_th || "-",
        depressionResult.level_th || "-",
        stressResult.level_th || "-",
        cvRiskResult.level_th || "-",
        dietVegetableResult.level_th || "-",
        dietSugarResult.level_th || "-",
        dietFatResult.level_th || "-",
        dietSodiumResult.level_th || "-"
      ];

      // ฟังก์ชันแบ่งข้อความยาวเป็นหลายบรรทัดแบบตัดคำภาษาไทย
      const splitThaiText = (text, maxWidth) => {
        if (!text || text === "-") return [text];

        // ถ้าข้อความสั้นมาก ให้ return เลย
        const textWidth = doc.getTextWidth(text);
        if (textWidth <= maxWidth) return [text];

        const lines = [];
        let currentLine = "";

        // แบ่งเป็นคำๆ หรือตัวอักษรถ้าไม่มีช่องว่าง
        const chars = text.split("");

        for (let i = 0; i < chars.length; i++) {
          const testLine = currentLine + chars[i];
          const width = doc.getTextWidth(testLine);

          if (width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = chars[i];
          } else {
            currentLine = testLine;
          }
        }

        if (currentLine) {
          lines.push(currentLine);
        }

        return lines;
      };

      for (let i = 0; i < 15; i++) {
        doc.rect(currentX, currentY, colWidths[i + 2], rowHeight);

        // แบ่งข้อความเป็นหลายบรรทัดถ้ายาวเกิน
        const textLines = splitThaiText(values[i], colWidths[i + 2] - 1);
        const lineHeight = 2.5;
        const totalHeight = textLines.length * lineHeight;
        const startY = currentY + (rowHeight - totalHeight) / 2 + lineHeight / 2 + 1;

        textLines.forEach((line, lineIdx) => {
          doc.text(line, currentX + colWidths[i + 2] / 2, startY + lineIdx * lineHeight, { align: "center" });
        });

        currentX += colWidths[i + 2];
      }

      currentY += rowHeight;

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
          <table className="w-full border-collapse" style={{ minWidth: "1360px" }}>
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
                  BMI
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
                <th className="border border-black py-2 px-1 font-bold text-center text-[#231d37]" style={{ fontSize: "10px", lineHeight: "1.3", width: "65px" }}>
                  พฤติกรรม<br/>บริโภค<br/>ไขมัน
                </th>
                <th className="border border-black py-2 px-1 font-bold text-center text-[#231d37]" style={{ fontSize: "10px", lineHeight: "1.3", width: "65px" }}>
                  พฤติกรรม<br/>บริโภค<br/>เกลือ
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white hover:bg-[#faf8ff] transition-colors">
                <td className="border border-black py-2 px-1 text-center font-semibold text-[#231d37]" style={{ fontSize: "11px" }}>
                  1
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37] font-medium" style={{ fontSize: "11px" }}>
                  {name}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                  {rawData.q1_has_ncds === "yes" ? "มี" : rawData.q1_has_ncds === "no" ? "ไม่มี" : "-"}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                  {bmiResult.level_th || "-"}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                  {waistResult.level_th || "-"}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                  {bloodPressureResult.level_th || "-"}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                  {glucoseResult.level_th || "-"}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                  {diabetesRiskResult.level_th || "-"}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                  {exerciseResult.level_th || "-"}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                  {sleepResult.level_th || "-"}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                  {depressionResult.level_th || "-"}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                  {stressResult.level_th || "-"}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                  {cvRiskResult.level_th || "-"}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                  {dietVegetableResult.level_th || "-"}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                  {dietSugarResult.level_th || "-"}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                  {dietFatResult.level_th || "-"}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "10px" }}>
                  {dietSodiumResult.level_th || "-"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NcdsScreeningDetail;
