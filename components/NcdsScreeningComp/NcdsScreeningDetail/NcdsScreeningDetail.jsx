import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, FileText, Download, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import XLSX from 'xlsx-js-style';
import { font as SarabunFont } from "../../../styles/Sarabun-Regular-normal";
import { fontbold as SarabunBoldFont } from "../../../styles/Sarabun-Regular-bold";

const NcdsScreeningDetail = ({ reportData }) => {
  const router = useRouter();
  const tableRef = useRef(null);

  // ถ้าไม่มีข้อมูล ให้ใช้ค่า default
  const name = reportData?.name || "นางสาวชุชนาถ ผดุงจิตร";
  const date = reportData?.date || "";
  const rawData = reportData?.rawData || {};

  // ใช้ count_by_citizen_id จากข้อมูลที่ได้จาก backend
  const countByCitizenId = rawData?.count_by_citizen_id || 1;

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

      // ฟังก์ชันสำหรับวาดลายน้ำโลโก้ (Landscape)
      const addWatermark = (doc) => {
        const watermarkImage = "/Smart_Osm_Plus.png";
        const imgWidth = 150;
        const imgHeight = 100;

        // คำนวณตำแหน่งกึ่งกลางหน้ากระดาษ (Landscape: 297x210)
        const centerX = 297 / 2;
        const centerY = 210 / 2;

        // คำนวณตำแหน่งให้โลโก้อยู่กึ่งกลางพอดี
        const x = centerX - (imgWidth / 2);
        const y = centerY - (imgHeight / 2);

        // บันทึกสถานะปัจจุบัน
        doc.saveGraphicsState();

        // ตั้งค่าความโปร่งใส
        doc.setGState(new doc.GState({ opacity: 0.10 }));

        // วาดรูป
        doc.addImage(watermarkImage, 'PNG', x, y, imgWidth, imgHeight, '', 'NONE', 0);

        // คืนสถานะ
        doc.restoreGraphicsState();
      };

      // ตั้งค่าตาราง
      const startX = 12;
      const startY = 28;
      const rowHeight = 11;
      const headerHeight = 18;
      const ROWS_PER_PAGE = 9;

      // Column widths - 18 columns total (เพิ่มคอลัมน์ จำนวนครั้งที่)
      // รวมทั้งหมด = 273mm (เหลือ margin ซ้ายขวา 12mm ต้นท้าย)
      const colWidths = [10, 15, 30, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15];

      const headers = [
        "ลำดับ",
        "จำนวน\nครั้งที่",
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

      // ฟังก์ชันวาด header ตาราง
      const drawTableHeader = (currentY) => {
        doc.setFont("Sarabun", "bold");
        doc.setFontSize(7.5);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);

        let currentX = startX;
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
        return currentY + headerHeight;
      };

      // ฟังก์ชันวาดแถวข้อมูล
      const drawDataRow = (currentY, rowIndex, rowData, rowName, count) => {
        doc.setFont("Sarabun", "normal");
        doc.setFontSize(7);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);

        let currentX = startX;

        // ลำดับ
        doc.rect(currentX, currentY, colWidths[0], rowHeight);
        doc.setFont("Sarabun", "bold");
        doc.text(String(rowIndex), currentX + colWidths[0] / 2, currentY + 5.5, { align: "center" });
        currentX += colWidths[0];

        // จำนวนครั้งที่
        doc.rect(currentX, currentY, colWidths[1], rowHeight);
        doc.setFont("Sarabun", "normal");
        doc.text(String(count), currentX + colWidths[1] / 2, currentY + 5.5, { align: "center" });
        currentX += colWidths[1];

        // รายชื่อ - แบ่งชื่อยาวเป็นหลายบรรทัด
        doc.rect(currentX, currentY, colWidths[2], rowHeight);
        doc.setFont("Sarabun", "bold");

        // แบ่งชื่อถ้ายาวเกิน
        const nameLines = [];
        if (rowName.length > 20) {
          const nameParts = rowName.split(" ");
          let line1 = nameParts[0] || "";
          let line2 = nameParts.slice(1).join(" ") || "";
          nameLines.push(line1);
          if (line2) nameLines.push(line2);
        } else {
          nameLines.push(rowName);
        }

        const nameLineHeight = 2.8;
        const nameTotalHeight = nameLines.length * nameLineHeight;
        const nameStartY = currentY + (rowHeight - nameTotalHeight) / 2 + nameLineHeight / 2 + 1;

        nameLines.forEach((line, idx) => {
          doc.text(line, currentX + colWidths[2] / 2, nameStartY + idx * nameLineHeight, { align: "center" });
        });

        currentX += colWidths[2];

        // Data columns - 15 columns
        for (let i = 0; i < 15; i++) {
          doc.rect(currentX, currentY, colWidths[i + 3], rowHeight);

          // แบ่งข้อความเป็นหลายบรรทัดถ้ายาวเกิน
          const textLines = splitThaiText(rowData[i], colWidths[i + 3] - 1);
          const lineHeight = 2.5;
          const totalHeight = textLines.length * lineHeight;
          const textStartY = currentY + (rowHeight - totalHeight) / 2 + lineHeight / 2 + 1;

          textLines.forEach((line, lineIdx) => {
            doc.text(line, currentX + colWidths[i + 3] / 2, textStartY + lineIdx * lineHeight, { align: "center" });
          });

          currentX += colWidths[i + 3];
        }

        return currentY + rowHeight;
      };

      // เตรียมข้อมูลตาราง - รองรับหลายรายการ
      const tableData = reportData?.items || [{
        name: name,
        rawData: rawData,
        bmiResult: bmiResult,
        waistResult: waistResult,
        bloodPressureResult: bloodPressureResult,
        glucoseResult: glucoseResult,
        diabetesRiskResult: diabetesRiskResult,
        exerciseResult: exerciseResult,
        sleepResult: sleepResult,
        depressionResult: depressionResult,
        stressResult: stressResult,
        cvRiskResult: cvRiskResult,
        dietVegetableResult: dietVegetableResult,
        dietSugarResult: dietSugarResult,
        dietFatResult: dietFatResult,
        dietSodiumResult: dietSodiumResult
      }];

      // คำนวณจำนวนหน้าทั้งหมด
      const totalPages = Math.ceil(tableData.length / ROWS_PER_PAGE);

      // สร้างหน้า landscape แรก
      doc.addPage('a4', 'landscape');
      doc.deletePage(1);

      // วนลูปสร้างแต่ละหน้า
      for (let pageNum = 0; pageNum < totalPages; pageNum++) {
        // เพิ่มหน้าใหม่ถ้าไม่ใช่หน้าแรก
        if (pageNum > 0) {
          doc.addPage('a4', 'landscape');
        }

        // เพิ่มลายน้ำ
        addWatermark(doc);

        // Add title on each page
        doc.setFontSize(14);
        doc.setFont("Sarabun", "bold");
        doc.text(`แบบรายงานการคัดกรองโรคไม่ติดต่อเรื้อรัง (NCDs)`, 148.5, 10, { align: "center" });

        // แสดงวันที่ถ้ามี
        if (date) {
          doc.setFontSize(8);
          doc.setFont("Sarabun", "normal");
          doc.text(`วันที่: ${date}`, 148.5, 16, { align: "center" });
        }

        // แสดงหมายเลขหน้า
        // doc.setFontSize(10);
        // doc.text(`หน้า ${pageNum + 1} / ${totalPages}`, 280, 10, { align: "right" });

        // วาด header ตาราง
        let currentY = drawTableHeader(startY);

        // คำนวณข้อมูลสำหรับหน้านี้
        const startIndex = pageNum * ROWS_PER_PAGE;
        const endIndex = Math.min(startIndex + ROWS_PER_PAGE, tableData.length);
        const pageData = tableData.slice(startIndex, endIndex);

        // วาดแถวข้อมูลสำหรับหน้านี้
        pageData.forEach((item, idx) => {
          const globalIndex = startIndex + idx + 1;

          // แปลงข้อมูล result สำหรับแต่ละรายการ
          const itemRawData = item.rawData || rawData;
          const itemBmiResult = item.bmiResult || parseResult(itemRawData.result_bmi);
          const itemWaistResult = item.waistResult || parseResult(itemRawData.result_waist);
          const itemBloodPressureResult = item.bloodPressureResult || parseResult(itemRawData.result_blood_pressure);
          const itemGlucoseResult = item.glucoseResult || parseResult(itemRawData.result_glucose);
          const itemDiabetesRiskResult = item.diabetesRiskResult || parseResult(itemRawData.result_diabetes_risk);
          const itemExerciseResult = item.exerciseResult || parseResult(itemRawData.result_exercise);
          const itemSleepResult = item.sleepResult || parseResult(itemRawData.result_sleep);
          const itemDepressionResult = item.depressionResult || parseResult(itemRawData.result_depression);
          const itemStressResult = item.stressResult || parseResult(itemRawData.result_stress);
          const itemCvRiskResult = item.cvRiskResult || parseResult(itemRawData.result_cv_risk);
          const itemDietVegetableResult = item.dietVegetableResult || parseResult(itemRawData.result_diet_vegetable);
          const itemDietSugarResult = item.dietSugarResult || parseResult(itemRawData.result_diet_sugar);
          const itemDietFatResult = item.dietFatResult || parseResult(itemRawData.result_diet_fat);
          const itemDietSodiumResult = item.dietSodiumResult || parseResult(itemRawData.result_diet_sodium);

          const rowData = [
            itemRawData.q1_has_ncds === "yes" ? "มี" : itemRawData.q1_has_ncds === "no" ? "ไม่มี" : "-",
            itemBmiResult.level_th || "-",
            itemWaistResult.level_th || "-",
            itemBloodPressureResult.level_th || "-",
            itemGlucoseResult.level_th || "-",
            itemDiabetesRiskResult.level_th || "-",
            itemExerciseResult.level_th || "-",
            itemSleepResult.level_th || "-",
            itemDepressionResult.level_th || "-",
            itemStressResult.level_th || "-",
            itemCvRiskResult.level_th || "-",
            itemDietVegetableResult.level_th || "-",
            itemDietSugarResult.level_th || "-",
            itemDietFatResult.level_th || "-",
            itemDietSodiumResult.level_th || "-"
          ];

          currentY = drawDataRow(currentY, globalIndex, rowData, item.name || name, countByCitizenId);
        });
      }

      // บันทึกไฟล์
      const now = new Date();
      const fileNameDate = now.toISOString().split('T')[0];
      doc.save(`รายงานคัดกรอง_NCDs_${fileNameDate}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("เกิดข้อผิดพลาดในการสร้าง PDF");
    }
  };

  const handleExportExcel = () => {
    try {
      // สร้าง workbook และ worksheet
      const wb = XLSX.utils.book_new();

      // Header
      const headers = [
        "ลำดับ",
        "จำนวนครั้งที่",
        "รายชื่อ",
        "พฤติกรรมเสี่ยงโรคไม่ติดต่อเรื้อรัง",
        "BMI",
        "ภาวะอ้วนลงพุง",
        "ระดับความดันโลหิต",
        "ระดับน้ำตาลในเลือด",
        "ความเสี่ยงการเกิดโรคเบาหวาน",
        "กิจกรรมทางกายเหนื่อยกว่าปกติ",
        "ประเมินการนอนหลับ",
        "คัดกรองภาวะซึมเศร้า2Q",
        "ประเมินความเครียดST-5",
        "ความเสี่ยงต่อการเกิดโรคหัวใจและหลอดเลือด",
        "พฤติกรรมบริโภคผัก",
        "พฤติกรรมบริโภคน้ำตาล",
        "พฤติกรรมบริโภคไขมัน",
        "พฤติกรรมบริโภคเกลือ"
      ];

      // Data row
      const rowData = [
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

      const wsData = [
        headers,
        [1, countByCitizenId, name, ...rowData]
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // คำนวณความกว้างคอลัมน์อัตโนมัติตามความยาวข้อความ
      const calculateColumnWidth = (colIndex) => {
        let maxWidth = 0;
        const minPixels = 14;

        for (let rowIndex = 0; rowIndex < wsData.length; rowIndex++) {
          const cellValue = wsData[rowIndex][colIndex];
          if (cellValue) {
            const textStr = String(cellValue);
            const thaiChars = (textStr.match(/[\u0E00-\u0E7F]/g) || []).length;
            const otherChars = textStr.length - thaiChars;
            const estimatedWidth = (thaiChars * 1.4) + otherChars;
            maxWidth = Math.max(maxWidth, estimatedWidth);
          }
        }

        let pixelWidth = maxWidth * minPixels;

        // Min/max settings for each column
        const colSettings = [
          { min: 50, max: 60 },    // 0: ลำดับ
          { min: 120, max: 200 },  // 1: รายชื่อ
          { min: 100, max: 130 },  // 2-16: ข้อมูลต่างๆ
        ];

        const setting = colIndex === 0 ? colSettings[0] :
                        colIndex === 1 ? colSettings[1] :
                        colSettings[2];
        return Math.max(setting.min, Math.min(setting.max, pixelWidth));
      };

      // ตั้งค่าความกว้างคอลัมน์
      const numCols = wsData[0].length;
      ws['!cols'] = [];
      for (let i = 0; i < numCols; i++) {
        ws['!cols'].push({ wpx: calculateColumnWidth(i) });
      }

      // ตั้งค่าความสูงแถว
      ws['!rows'] = [
        { hpx: 35 },  // Header row
        { hpx: 30 },  // Data row
      ];

      // เพิ่ม borders และ styles
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellAddress]) {
            ws[cellAddress] = { v: "" };
          }

          const cellStyle = {
            border: {
              top: { style: "thin", color: { rgb: "FF000000" } },
              left: { style: "thin", color: { rgb: "FF000000" } },
              bottom: { style: "thin", color: { rgb: "FF000000" } },
              right: { style: "thin", color: { rgb: "FF000000" } }
            },
            alignment: {
              vertical: "center",
              horizontal: "center",
              wrapText: true
            },
            font: {
              name: "Tahoma",
              sz: 10
            }
          };

          ws[cellAddress].s = cellStyle;

          // Header row: ทำให้ตัวหนาและเพิ่มสีพื้นหลัง
          if (R === 0) {
            ws[cellAddress].s.font.bold = true;
            ws[cellAddress].s.font.sz = 9;
            ws[cellAddress].s.fill = { fgColor: { rgb: "E8F4F8" } };
          }

          // Data row: รายชื่อ - จัดซ้าย
          if (R === 1 && C === 1) {
            ws[cellAddress].s.alignment.horizontal = "left";
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, "รายงานคัดกรอง NCDs");

      // สร้างชื่อไฟล์
      const now = new Date();
      const fileNameDate = now.toISOString().split('T')[0];
      XLSX.writeFile(wb, `รายงานคัดกรอง_NCDs_${fileNameDate}.xlsx`);
    } catch (error) {
      console.error("Error generating Excel:", error);
      alert("เกิดข้อผิดพลาดในการสร้าง Excel");
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
              แบบรายงานการคัดกรองโรคไม่ติดต่อเรื้อรัง (NCDs)
            </h2>
            {date && <p className="text-gray-600 text-sm mb-1">วันที่: {date}</p>}
            <p className="text-gray-700 font-medium text-base">{name}</p>
          </div>

          {/* Export Buttons - Right top - Hide in PDF */}
          <div className="flex gap-3">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-5 py-3 !bg-green-500 hover:!bg-green-600 text-white font-bold rounded-xl shadow-lg hover:shadow-green-500/30 hover:scale-[1.02] transition-all duration-200 text-base border-2 border-green-400"
              style={{ backgroundColor: '#10b981', borderColor: '#34d399' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
            >
              <FileSpreadsheet size={20} />
              Export Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="export-button flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#7e32e2] to-[#9333ea] text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 text-base"
            >
              <Download size={20} />
              Export PDF
            </button>
          </div>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full border-collapse" style={{ minWidth: "1360px" }}>
            <thead>
              <tr className="bg-white">
                <th className="border border-black py-2 px-1 font-bold text-center text-[#231d37]" style={{ width: "30px", fontSize: "11px" }}>
                  ลำดับ
                </th>
                <th className="border border-black py-2 px-1 font-bold text-center text-[#231d37]" style={{ width: "50px", fontSize: "11px" }}>
                  จำนวนครั้งที่
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
                <td className="border border-black py-2 px-1 text-center text-[#231d37]" style={{ fontSize: "11px" }}>
                  {countByCitizenId}
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
