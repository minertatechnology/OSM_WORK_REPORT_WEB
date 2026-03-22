import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Download, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import XLSX from 'xlsx-js-style';
import { font as SarabunFont } from "../../../styles/Sarabun-Regular-normal";
import { fontbold as SarabunBoldFont } from "../../../styles/Sarabun-Regular-bold";

const PregnantReportDetail = ({ reportData, evaluations = [] }) => {
  const router = useRouter();
  const tableRef = useRef(null);

  // Debug: ตรวจสอบ rawData
  console.log("🔍 PregnantReportDetail - reportData:", reportData);
  console.log("🔍 PregnantReportDetail - rawData:", reportData?.rawData);
  console.log("🔍 PregnantReportDetail - first_name:", reportData?.rawData?.first_name);

  // ถ้าไม่มีข้อมูล ให้ใช้ค่า default
  const name = reportData?.name || "ไม่พบข้อมูล";
  const date = reportData?.date || "";

  // แปลงข้อมูลเป็นรูปแบบตาราง (1 แถวต่อ 1 คน)
  const tableData = evaluations.map((evaluation, index) => {
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

  const handleExportExcel = () => {
    try {
      // สร้าง workbook และ worksheet
      const wb = XLSX.utils.book_new();

      // Format date with Buddhist year
      const now = new Date();
      const buddhistYear = now.getFullYear() + 543;
      const thaiDate = now.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }).replace(now.getFullYear().toString(), buddhistYear.toString());

      // Header rows before table (all must have 10 columns)
      const headerRows = [
        ["การติดตามการได้รับยาเม็ดเสริมไอโอดีน", null, null, null, null, null, null, null, null, null],
        [`วันที่: ${date || thaiDate}`, null, null, null, null, null, null, null, null, null],
        [`เจ้าหน้าที่ผู้ตรวจ: ${name}`, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null], // Empty row before table header
      ];

      // Table headers (2 rows)
      const tableHeaders = [
        // Row 1: Main headers
        [
          "ลำดับ",
          "รายชื่อ",
          "หญิงตั้งครรภ์",
          null,
          null,
          "หญิงหลังคลอด",
          null,
          "การได้รับยา",
          "วันที่ได้รับยา",
          "สาเหตุ"
        ],
        // Row 2: Sub headers
        [
          null,
          null,
          "อายุครรภ์\nไม่เกิน 12 สัปดาห์",
          "อายุครรภ์\n13 - 24 สัปดาห์",
          "อายุครรภ์\n25 สัปดาห์ขึ้นไป",
          "หลังคลอด\nไม่เกิน 12 สัปดาห์",
          "หลังคลอด\n13 - 24 สัปดาห์",
          null,
          null,
          null
        ]
      ];

      // Data rows
      const dataRows = tableData.map((row, idx) => [
        idx + 1,
        row.name,
        row.pregnant_0_12 ? "✓" : "-",
        row.pregnant_13_24 ? "✓" : "-",
        row.pregnant_25_plus ? "✓" : "-",
        row.postpartum_0_12 ? "✓" : "-",
        row.postpartum_13_24 ? "✓" : "-",
        getMedicineStatus(row.q1_received_medicine),
        getFrequencyLabel(row.q2_frequency),
        row.q3_reason || "-"
      ]);

      // Combine all rows
      const wsData = [...headerRows, ...tableHeaders, ...dataRows];

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Calculate row offsets (headerRows = 4 rows)
      const headerOffset = headerRows.length;

      // สร้าง merged cells (เหมือน table rowspan/colspan)
      ws['!merges'] = [
        // Title row merge (A1:J1)
        { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
        // Date row merge (A2:J2)
        { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
        // Name row merge (A3:J3)
        { s: { r: 2, c: 0 }, e: { r: 2, c: 9 } },
        // Table header merges (offset by headerRows.length)
        { s: { r: headerOffset + 0, c: 0 }, e: { r: headerOffset + 1, c: 0 } }, // ลำดับ (rowspan 2)
        { s: { r: headerOffset + 0, c: 1 }, e: { r: headerOffset + 1, c: 1 } }, // รายชื่อ (rowspan 2)
        { s: { r: headerOffset + 0, c: 2 }, e: { r: headerOffset + 0, c: 4 } }, // หญิงตั้งครรภ์ (colspan 3)
        { s: { r: headerOffset + 0, c: 5 }, e: { r: headerOffset + 0, c: 6 } }, // หญิงหลังคลอด (colspan 2)
        { s: { r: headerOffset + 0, c: 7 }, e: { r: headerOffset + 1, c: 7 } }, // รับยา (rowspan 2)
        { s: { r: headerOffset + 0, c: 8 }, e: { r: headerOffset + 1, c: 8 } }, // จำนวนวัน (rowspan 2)
        { s: { r: headerOffset + 0, c: 9 }, e: { r: headerOffset + 1, c: 9 } }, // สาเหตุ (rowspan 2)
      ];

      // คำนวณความกว้างคอลัมน์อัตโนมัติตามความยาวข้อความ
      const calculateColumnWidth = (colIndex) => {
        let maxWidth = 0;
        const minPixels = 15; // ค่า minimum pixels per character

        // ตรวจสอบทุกแถวในคอลัมน์นี้
        for (let rowIndex = 0; rowIndex < wsData.length; rowIndex++) {
          const cellValue = wsData[rowIndex][colIndex];
          if (cellValue) {
            // แปลงเป็น string และนับความยาว (ภาษาไทยคิดเป็น 1.5 เท่า)
            const textStr = String(cellValue);
            // นับตัวอักษรภาษาไทยและอังกฤษ
            const thaiChars = (textStr.match(/[\u0E00-\u0E7F]/g) || []).length;
            const otherChars = textStr.length - thaiChars;
            const estimatedWidth = (thaiChars * 1.5) + otherChars;
            maxWidth = Math.max(maxWidth, estimatedWidth);
          }
        }

        // คำนวณ pixels จากความยาวตัวอักษร
        let pixelWidth = maxWidth * minPixels;

        // ตั้งค่า minimum และ maximum สำหรับแต่ละคอลัมน์
        const colSettings = [
          { min: 60, max: 80 },    // 0: ลำดับ
          { min: 150, max: 300 },  // 1: รายชื่อ
          { min: 80, max: 120 },   // 2: หญิงตั้งครรภ์ 0-12
          { min: 80, max: 120 },   // 3: หญิงตั้งครรภ์ 13-24
          { min: 90, max: 130 },   // 4: หญิงตั้งครรภ์ 25+
          { min: 80, max: 120 },   // 5: หลังคลอด 0-12
          { min: 80, max: 120 },   // 6: หลังคลอด 13-24
          { min: 90, max: 130 },   // 7: การได้รับยา
          { min: 100, max: 150 },  // 8: จำนวนวัน
          { min: 150, max: 350 },  // 9: สาเหตุ
        ];

        const setting = colSettings[colIndex] || { min: 80, max: 200 };
        return Math.max(setting.min, Math.min(setting.max, pixelWidth));
      };

      // ตั้งค่าความกว้างคอลัมน์อัตโนมัติ
      const numCols = wsData[0].length;
      ws['!cols'] = [];
      for (let i = 0; i < numCols; i++) {
        ws['!cols'].push({ wpx: calculateColumnWidth(i) });
      }

      // ตั้งค่าความสูงแถว
      const totalRows = wsData.length;
      ws['!rows'] = [];
      for (let i = 0; i < totalRows; i++) {
        if (i === 0) {
          ws['!rows'].push({ hpx: 35 });  // Title row
        } else if (i === 1) {
          ws['!rows'].push({ hpx: 25 });  // Date row
        } else if (i === 2) {
          ws['!rows'].push({ hpx: 25 });  // Name row
        } else if (i === 3) {
          ws['!rows'].push({ hpx: 10 });  // Empty row
        } else if (i === headerOffset) {
          ws['!rows'].push({ hpx: 25 });  // Table Header row 1
        } else if (i === headerOffset + 1) {
          ws['!rows'].push({ hpx: 50 });  // Table Header row 2
        } else {
          ws['!rows'].push({ hpx: 30 });  // Data rows
        }
      }

      // เพิ่ม borders และ styles ให้ทุก cell
      const range = XLSX.utils.decode_range(ws['!ref']);

      // สร้าง function เพื่อเช็คว่า cell อยู่ใน merged range หรือไม่
      const getMergeInfo = (row, col) => {
        if (!ws['!merges']) return null;
        for (const merge of ws['!merges']) {
          if (row >= merge.s.r && row <= merge.e.r && col >= merge.s.c && col <= merge.e.c) {
            return merge;
          }
        }
        return null;
      };

      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });

          // สร้าง cell ถ้าไม่มี
          if (!ws[cellAddress]) {
            ws[cellAddress] = { v: "" };
          }

          const merge = getMergeInfo(R, C);

          // สร้าง style object
          const cellStyle = {
            alignment: {
              vertical: "center",
              horizontal: "center",
              wrapText: true
            },
            font: {
              name: "Tahoma",
              sz: 11
            }
          };

          // Title row (row 0): Bold, larger font, no border
          if (R === 0) {
            cellStyle.border = {};
            cellStyle.font.bold = true;
            cellStyle.font.sz = 16;
          }
          // Date row (row 1): Normal, no border
          else if (R === 1) {
            cellStyle.border = {};
            cellStyle.font.sz = 12;
          }
          // Name row (row 2): Bold, no border
          else if (R === 2) {
            cellStyle.border = {};
            cellStyle.font.bold = true;
            cellStyle.font.sz = 12;
          }
          // Empty row (row 3): no border
          else if (R === 3) {
            cellStyle.border = {};
          }
          // Table section - add borders
          else {
            const borders = {
              top: { style: "thin", color: { rgb: "FF000000" } },
              left: { style: "thin", color: { rgb: "FF000000" } },
              bottom: { style: "thin", color: { rgb: "FF000000" } },
              right: { style: "thin", color: { rgb: "FF000000" } }
            };

            // ถ้าเป็น merged cell - ลบ inner borders เฉพาะด้านที่ merge
            if (merge) {
              if (R !== merge.s.r || C !== merge.s.c) {
                borders.top = null;
                borders.left = null;
                borders.bottom = null;
                borders.right = null;
              }
            }

            const filteredBorders = {};
            for (const [key, value] of Object.entries(borders)) {
              if (value !== null) filteredBorders[key] = value;
            }
            cellStyle.border = filteredBorders;

            // Header rows (table): bold + background
            if (R < headerOffset + 2) {
              cellStyle.font.bold = true;
              cellStyle.font.sz = 10;
              cellStyle.fill = { fgColor: { rgb: "E8F4F8" } };
            }

            // Data rows: จัดรูปแบบ
            if (R >= headerOffset + 2) {
              if (C === 0) {
                cellStyle.font.bold = true;
              }
              if (C === 1 || C === 9) {
                cellStyle.alignment.horizontal = "left";
              }
            }
          }

          ws[cellAddress].s = cellStyle;
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, "รายงานการได้รับยาเสริมไอโอดีน");

      // สร้างชื่อไฟล์ - Format: PR{osm_code}_{year}.xlsx หรือ PR{first_name}_{year}.xlsx (ถ้าไม่มี osm_code)
      const currentYear = new Date().getFullYear();
      const rawData = reportData?.rawData || {};
      console.log("🔍 Excel Export - rawData:", rawData);
      console.log("🔍 Excel Export - first_name:", rawData?.first_name);
      const osmCode = rawData?.osm_code || rawData?.osmCode || rawData?.first_name || "";
      console.log("🔍 Excel Export - osmCode:", osmCode);
      XLSX.writeFile(wb, `Iodine_${osmCode}_${currentYear}.xlsx`);
    } catch (error) {
      console.error("Error generating Excel:", error);
      alert("เกิดข้อผิดพลาดในการสร้าง Excel");
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();

      // เพิ่ม Thai font
      doc.addFileToVFS("Sarabun-Regular.ttf", SarabunFont);
      doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
      doc.addFileToVFS("Sarabun-Bold.ttf", SarabunBoldFont);
      doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
      doc.setFont("Sarabun");

      // ตั้งค่าจำนวนแถวต่อหน้า
      const ROWS_PER_PAGE = 10;  // 10 แถวต่อหน้า
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
      const rowHeight = 14;      // เพิ่มจาก 12 เป็น 14
      const headerHeight = 13;   // เพิ่มจาก 11 เป็น 13
      const colWidths = [8, 25, 15, 15, 15, 15, 15, 20, 22, 40];  // เพิ่มความกว้าง
      const tableWidth = colWidths.reduce((sum, w) => sum + w, 0);
      const startX = (210 - tableWidth) / 2;

      // Sub headers for pregnant and postpartum
      const subHeaders = [
        "อายุครรภ์\nไม่เกิน\n12 สัปดาห์",
        "อายุครรภ์\n13 - 24\nสัปดาห์",
        "อายุครรภ์\n25 สัปดาห์\nขึ้นไป",
        "หลังคลอด\nไม่เกิน\n12 สัปดาห์",
        "หลังคลอด\n13 - 24\nสัปดาห์"
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
        doc.setFontSize(9);  // เปลี่ยนเป็น 9

        // ลำดับ (rowSpan 2)
        doc.rect(currentX, currentY, colWidths[0], headerHeight * 2);
        doc.text("ลำดับ", currentX + colWidths[0] / 2, currentY + headerHeight + 2, { align: "center" });
        currentX += colWidths[0];

        // รายชื่อ (rowSpan 2)
        doc.rect(currentX, currentY, colWidths[1], headerHeight * 2);
        doc.text("รายชื่อ", currentX + colWidths[1] / 2, currentY + headerHeight + 2, { align: "center" });
        currentX += colWidths[1];

        // หญิงตั้งครรภ์ (colSpan 3)
        const pregnantWidth = colWidths[2] + colWidths[3] + colWidths[4];
        doc.rect(currentX, currentY, pregnantWidth, headerHeight);
        doc.text("หญิงตั้งครรภ์", currentX + pregnantWidth / 2, currentY + 7, { align: "center" });

        // หญิงหลังคลอด (colSpan 2)
        const postpartumWidth = colWidths[5] + colWidths[6];
        doc.rect(currentX + pregnantWidth, currentY, postpartumWidth, headerHeight);
        doc.text("หญิงหลังคลอด", currentX + pregnantWidth + postpartumWidth / 2, currentY + 7, { align: "center" });

        // การได้รับยา (rowSpan 2)
        doc.rect(currentX + pregnantWidth + postpartumWidth, currentY, colWidths[7], headerHeight * 2);
        doc.text("การได้รับยา", currentX + pregnantWidth + postpartumWidth + colWidths[7] / 2, currentY + headerHeight + 2, { align: "center" });

        // วันที่ได้รับยา (rowSpan 2)
        doc.rect(currentX + pregnantWidth + postpartumWidth + colWidths[7], currentY, colWidths[8], headerHeight * 2);
        doc.text("วันที่ได้รับยา", currentX + pregnantWidth + postpartumWidth + colWidths[7] + colWidths[8] / 2, currentY + headerHeight + 2, { align: "center" });

        // สาเหตุ (rowSpan 2)
        doc.rect(currentX + pregnantWidth + postpartumWidth + colWidths[7] + colWidths[8], currentY, colWidths[9], headerHeight * 2);
        doc.text("สาเหตุ", currentX + pregnantWidth + postpartumWidth + colWidths[7] + colWidths[8] + colWidths[9] / 2, currentY + headerHeight + 2, { align: "center" });

        // Header Row 2 - Sub headers
        currentY += headerHeight;
        currentX = startX + colWidths[0] + colWidths[1];

        doc.setFont("Sarabun", "bold");
        doc.setFontSize(9);  // เปลี่ยนเป็น 9
        for (let i = 0; i < 5; i++) {
          doc.rect(currentX, currentY, colWidths[i + 2], headerHeight);
          const lines = subHeaders[i].split('\n');
          const subStartY = currentY + 3;
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
        doc.text(row.no.toString(), currentX + colWidths[0] / 2, currentY + 8, { align: "center" });
        currentX += colWidths[0];

        // รายชื่อ
        doc.rect(currentX, currentY, colWidths[1], rowHeight);
        doc.setFont("Sarabun", "bold");
        doc.setFontSize(9);
        const nameLines = doc.splitTextToSize(row.name, colWidths[1] - 2);
        doc.text(nameLines[0] || row.name, currentX + colWidths[1] / 2, currentY + 8, { align: "center" });
        currentX += colWidths[1];

        // Data columns with checkmarks
        doc.setFont("Sarabun", "bold");
        doc.setFontSize(9);
        const values = [
          row.pregnant_0_12 ? "/" : "-",
          row.pregnant_13_24 ? "/" : "-",
          row.pregnant_25_plus ? "/" : "-",
          row.postpartum_0_12 ? "/" : "-",
          row.postpartum_13_24 ? "/" : "-"
        ];

        for (let i = 0; i < 5; i++) {
          doc.rect(currentX, currentY, colWidths[i + 2], rowHeight);
          doc.text(values[i], currentX + colWidths[i + 2] / 2, currentY + 8.5, { align: "center" });
          currentX += colWidths[i + 2];
        }

        // รับยา
        doc.rect(currentX, currentY, colWidths[7], rowHeight);
        doc.setFont("Sarabun", "bold");
        doc.setFontSize(9);
        const medStatus = getMedicineStatus(row.q1_received_medicine);
        doc.text(medStatus, currentX + colWidths[7] / 2, currentY + 8, { align: "center", maxWidth: colWidths[7] - 2 });
        currentX += colWidths[7];

        // จำนวนวันฯ
        doc.rect(currentX, currentY, colWidths[8], rowHeight);
        doc.setFont("Sarabun", "bold");
        doc.setFontSize(9);
        const freqLabel = getFrequencyLabel(row.q2_frequency);
        const freqLines = doc.splitTextToSize(freqLabel, colWidths[8] - 2);
        if (freqLines.length > 1) {
          doc.text(freqLines[0], currentX + colWidths[8] / 2, currentY + 6, { align: "center" });
          doc.text(freqLines[1], currentX + colWidths[8] / 2, currentY + 10, { align: "center" });
        } else {
          doc.text(freqLabel, currentX + colWidths[8] / 2, currentY + 8, { align: "center" });
        }
        currentX += colWidths[8];

        // สาเหตุ
        doc.rect(currentX, currentY, colWidths[9], rowHeight);
        doc.setFont("Sarabun", "bold");
        doc.setFontSize(9);
        const reason = row.q3_reason || "-";
        const reasonLines = doc.splitTextToSize(reason, colWidths[9] - 2);
        const displayLines = reasonLines.slice(0, 3);
        let textY = currentY + 4;
        displayLines.forEach((line, index) => {
          doc.text(line, currentX + 1, textY + (index * 3.5), { align: "left" });
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
        doc.text(`การติดตามการได้รับยาเม็ดเสริมไอโอดีน`, 105, 15, { align: "center" });

        doc.setFontSize(12);
        doc.setFont("Sarabun", "bold");
        if (date) {
          doc.text(`วันที่: ${date}`, 105, 22, { align: "center" });
        }
        doc.text(`เจ้าหน้าที่ผู้ตรวจ: ${name}`, 105, date ? 28 : 22, { align: "center" });

        // แสดงหมายเลขหน้า
        // doc.setFontSize(10);
        // doc.text(`หน้า ${pageNum + 1} / ${totalPages}`, 105, 34, { align: "center" });

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

      // บันทึกไฟล์ - Format: PR{osm_code}_{year}.pdf หรือ PR{first_name}_{year}.pdf (ถ้าไม่มี osm_code)
      const currentYear = new Date().getFullYear();
      const rawData = reportData?.rawData || {};
      console.log("🔍 PDF Export - rawData:", rawData);
      console.log("🔍 PDF Export - first_name:", rawData?.first_name);
      const osmCode = rawData?.osm_code || rawData?.osmCode || rawData?.first_name || "";
      console.log("🔍 PDF Export - osmCode:", osmCode);
      doc.save(`Iodine_${osmCode}_${currentYear}.pdf`);
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
                  การติดตามการได้รับยาเม็ดเสริมไอโอดีน
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
              การติดตามการได้รับยาเม็ดเสริมไอโอดีน
            </h2>
            {date && <p className="text-gray-600 text-sm mb-1">วันที่: {date}</p>}
            <p className="text-gray-700 font-medium text-base">เจ้าหน้าที่ผู้ตรวจ: {name}</p>
            <p className="text-gray-600 text-sm mt-2">จำนวนทั้งหมด: {new Set(tableData.map(row => row.name)).size} คน</p>
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
                    colSpan={2}
                    className="border border-black py-4 px-4 font-bold text-center text-[#231d37] text-base"
                  >
                    หญิงหลังคลอด
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-black py-4 px-4 font-bold text-center text-[#231d37] text-base"
                    style={{ width: "130px" }}
                  >
                    การได้รับยา
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-black py-4 px-4 font-bold text-center text-[#231d37] text-base"
                    style={{ width: "120px" }}
                  >
                    วันที่ได้รับยา
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
