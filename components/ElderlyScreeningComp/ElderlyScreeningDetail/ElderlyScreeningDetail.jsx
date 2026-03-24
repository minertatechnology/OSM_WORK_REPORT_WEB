"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Download, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import XLSX from 'xlsx-js-style';
import { font as SarabunFont } from "../../../styles/Sarabun-Regular-normal";
import { fontbold as SarabunBoldFont } from "../../../styles/Sarabun-Regular-bold";

const buildFullName = (record) =>
  [record?.prefix_name_th, record?.first_name, record?.last_name].filter(Boolean).join(" ") ||
  [record?.prefix, record?.first_name, record?.last_name].filter(Boolean).join(" ") ||
  record?.citizen_id ||
  "ไม่ทราบชื่อ";

const buildLocationText = (record) => {
  const parts = [];

  // จังหวัด
  if (record?.province_name) {
    parts.push(`จ.${record.province_name}`);
  } else if (record?.location_data?.region) {
    parts.push(`จ.${record.location_data.region}`);
  }

  // อำเภอ (ในกรุงเทพฯ คือ "เขต" - ลบคำว่า "เขต" ออกเพื่อไม่ให้ซ้ำซ้อน)
  if (record?.district_name) {
    parts.push(`อ.${record.district_name}`);
  } else if (record?.location_data?.city) {
    // ลบคำว่า "เขต" หรือ "อำเภอ" ออกจากชื่อ
    let district = record.location_data.city.replace(/^(เขต|อำเภอ)\s*/, "");
    parts.push(`อ.${district}`);
  }

  // ตำบล (ในกรุงเทพฯ คือ "แขวง" - ลบคำว่า "แขวง" ออกเพื่อไม่ให้ซ้ำซ้อน)
  if (record?.subdistrict_name) {
    parts.push(`ต.${record.subdistrict_name}`);
  } else if (record?.location_data?.district) {
    // ลบคำว่า "แขวง" หรือ "ตำบล" ออกจากชื่อ
    let subdistrict = record.location_data.district.replace(/^(แขวง|ตำบล)\s*/, "");
    parts.push(`ต.${subdistrict}`);
  }

  // หมู่ที่
  if (record?.moo) {
    parts.push(`ม.${record.moo}`);
  }

  return parts.length > 0 ? parts.join(" ") : null;
};

const ElderlyScreeningDetail = ({
  assessorId,
  assessorName,
  osmCode,
  elderlyList = [],
  elderlyCount = 0,
  onBack
}) => {
  const router = useRouter();

  const goBack = () => {
    if (onBack) return onBack();
    router.push("/elderly-screening");
  };

  // ฟังก์ชันคำนวณความเสี่ยงแต่ละด้าน (ตามสูตรจาก Mobile App)
  const calculateRiskByDomain = (elderly, domain) => {
    if (!elderly) return "-";

    switch (domain) {
      case "cognitive": // ด้านที่ 1: ความคิดความจำ
        return elderly.cognitive_result === "N" ? "เสี่ยง" : "ปกติ";

      case "mobility": // ด้านที่ 2: การเคลื่อนไหว (2 คำถาม)
        return elderly.mobility_test === "N" || elderly.fall_history_6m === "Y" ? "เสี่ยง" : "ปกติ";

      case "swallowing": // ด้านที่ 3: การกลืนอาหาร (2 คำถาม)
        return elderly.weight_loss_3m === "Y" || elderly.appetite_loss === "Y" ? "เสี่ยง" : "ปกติ";

      case "vision": // ด้านที่ 4: การมองเห็น
        return elderly.vision_problem === "Y" ? "เสี่ยง" : "ปกติ";

      case "hearing": // ด้านที่ 5: การได้ยิน
        return elderly.hearing_result !== "Y" ? "เสี่ยง" : "ปกติ";

      case "depression": // ด้านที่ 6: ภาวะซึมเศร้า (3 คำถาม)
        return elderly.depression_symptom_2w === "Y" || elderly.boredom_symptom_2w === "Y" || elderly.suicide_thought_1m === "Y"
          ? "เสี่ยง" : "ปกติ";

      case "urinary": // ด้านที่ 7: การกลั้นปัสสาวะ
        return elderly.urinary_incontinence === "Y" ? "เสี่ยง" : "ปกติ";

      case "adl": // ด้านที่ 8: ADL
        return elderly.adl_status === "N" ? "เสี่ยง" : "ปกติ";

      case "oral": // ด้านที่ 9: ช่องปาก (2 คำถาม)
        return elderly.chewing_difficulty === "Y" || elderly.oral_pain === "Y" ? "เสี่ยง" : "ปกติ";

      default:
        return "-";
    }
  };

  // ฟังก์ชันแสดงผลการประเมินรวมจาก API
  const getOverallResult = (elderly) => {
    if (!elderly || !elderly.overall_status) return "-";

    // overall_status จาก API: "at_risk" = เสี่ยง, "normal" = ปกติ
    if (elderly.overall_status === "at_risk") return "เสี่ยง";
    if (elderly.overall_status === "normal") return "ปกติ";

    return elderly.overall_status;
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF("landscape", "mm", "a4");
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

      // เพิ่มลายน้ำ
      addWatermark(doc);

      // Header
      doc.setFontSize(14);
      doc.setFont("Sarabun", "bold");
      doc.text("รายงานผลการประเมินสุขภาพผู้สูงอายุในชุมชน", 148, 12, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("Sarabun", "bold");
      doc.text(`ผู้คัดกรอง: ${assessorName || "ไม่ระบุชื่อ"}`, 148, 18, { align: "center" });
      // doc.text(`นายทะเบียน อสม.`, 148, 23, { align: "center" });

      // Define table columns - total width should fit A4 landscape (297mm)
      // ลดความกว้างให้พอดีกับหน้ากระดาษ

      const colWidth = 10;  // ลำดับ
      const nameWidth = 48; // ชื่อ-นามสกุล
      const livingWidth = 18; // อยู่ร่วม
      const genderWidth = 10; // เพศ
      const ageWidth = 10; // อายุ
      const assessWidth = 12; // แต่ละคอลัมน์แบบคัดกรอง
      const sumbynumWidth = 14; // คอลัมน์จำนวนครั้งที่
      const resultWidth = 16; // คอลัมน์ผลการประเมิน

      // คำนวณความกว้างรวมของตาราง: 10+48+18+10+10+(12*12)+14+16 = 270mm
      const totalTableWidth = colWidth + nameWidth + livingWidth + genderWidth + ageWidth + (assessWidth * 12) + sumbynumWidth + resultWidth;

      const householdColumns = [
        { key: "living_arrangement", label: "ผู้สูงอายุ\nอยู่ร่วม", width: livingWidth },
        { key: "gender", label: "เพศ", width: genderWidth },
        { key: "age", label: "อายุ\n(ปี)", width: ageWidth },
      ];

      const pdfAssessmentColumns = [
        { key: "social_living_with_care", label: "มีผู้ดูแล", width: assessWidth, domain: null },
        { key: "social_house_safety", label: "บ้าน\nปลอดภัย", width: assessWidth, domain: null },
        { key: "social_income_sufficiency", label: "รายได้\nเพียงพอ", width: assessWidth, domain: null },
        { key: "cognitive_result", label: "ความคิด/\nความจำ", width: assessWidth, domain: "cognitive" },
        { key: "mobility", label: "การ\nเคลื่อน\nไหว", width: assessWidth, domain: "mobility" },
        { key: "swallowing", label: "การกลืน\nอาหาร", width: assessWidth, domain: "swallowing" },
        { key: "vision_problem", label: "การ\nมองเห็น", width: assessWidth, domain: "vision" },
        { key: "hearing_result", label: "การ\nได้ยิน", width: assessWidth, domain: "hearing" },
        { key: "depression", label: "ภาวะ\nซึมเศร้า", width: assessWidth, domain: "depression" },
        { key: "urinary_incontinence", label: "กลั้น\nปัสสาวะ", width: assessWidth, domain: "urinary" },
        { key: "adl_status", label: "กิจวัตร\nประจำวัน", width: assessWidth, domain: "adl" },
        { key: "oral", label: "ช่องปาก", width: assessWidth, domain: "oral" },
      ];

      // Start table - คำนวณให้อยู่กึ่งกลาง
      const pageWidth = 297; // A4 landscape width
      const startX = (pageWidth - totalTableWidth) / 2; // จัดกึ่งกลาง
      const startY = 28;
      let currentY = startY;

      const drawHeaders = (yPos) => {
        doc.setFont("Sarabun", "bold");
        doc.setFontSize(9);  // เปลี่ยนเป็น 9
        let currentX = startX;

        const headerHeight = 17; // เพิ่มจาก 14 เป็น 17

        // ========== Row 1: Main Headers ==========
        // ลำดับ (rowSpan=2)
        doc.rect(currentX, yPos, colWidth, headerHeight * 2);
        doc.text("ลำดับ", currentX + colWidth / 2, yPos + 11, { align: "center" });
        currentX += colWidth;

        // ชื่อ-นามสกุล (rowSpan=2)
        doc.rect(currentX, yPos, nameWidth, headerHeight * 2);
        doc.text("ชื่อ-นามสกุล", currentX + nameWidth / 2, yPos + 11, { align: "center" });
        currentX += nameWidth;

        // ข้อมูลเชิงสังคม (colSpan=3)
        const householdHeaderWidth = livingWidth + genderWidth + ageWidth;
        doc.rect(currentX, yPos, householdHeaderWidth, headerHeight);
        doc.text("ข้อมูลเชิงสังคม", currentX + householdHeaderWidth / 2, yPos + 11, { align: "center" });
        currentX += householdHeaderWidth;

        // แบบคัดกรองสุขภาพผู้สูงอายุ (colSpan=12)
        const assessHeaderWidth = assessWidth * 12;
        doc.rect(currentX, yPos, assessHeaderWidth, headerHeight);
        doc.text("แบบคัดกรองสุขภาพผู้สูงอายุ", currentX + assessHeaderWidth / 2, yPos + 11, { align: "center" });
        currentX += assessHeaderWidth;

        // จำนวนครั้งที่ (rowSpan=2)
        doc.rect(currentX, yPos, sumbynumWidth, headerHeight * 2);
        doc.text("จำนวน", currentX + sumbynumWidth / 2, yPos + 9, { align: "center" });
        doc.text("ครั้งที่", currentX + sumbynumWidth / 2, yPos + 13, { align: "center" });
        currentX += sumbynumWidth;

        // ผลการประเมิน (rowSpan=2)
        doc.rect(currentX, yPos, resultWidth, headerHeight * 2);
        doc.text("ผลการ", currentX + resultWidth / 2, yPos + 9, { align: "center" });
        doc.text("ประเมิน", currentX + resultWidth / 2, yPos + 13, { align: "center" });

        // ========== Row 2: Sub Headers ==========
        let row2Y = yPos + headerHeight;
        currentX = startX + colWidth + nameWidth; // เริ่มหลังจาก ลำดับและชื่อ

        // ข้อมูลเชิงสังคม sub headers
        householdColumns.forEach(col => {
          doc.rect(currentX, row2Y, col.width, headerHeight);
          const lines = col.label.split('\n');
          if (lines.length === 2) {
            doc.text(lines[0], currentX + col.width / 2, row2Y + 7, { align: "center" });
            doc.text(lines[1], currentX + col.width / 2, row2Y + 12, { align: "center" });
          } else {
            doc.text(col.label, currentX + col.width / 2, row2Y + 11, { align: "center" });
          }
          currentX += col.width;
        });

        // แบบคัดกรอง sub headers
        pdfAssessmentColumns.forEach(col => {
          doc.rect(currentX, row2Y, col.width, headerHeight);
          const lines = col.label.split('\n');

          if (lines.length === 1) {
            doc.text(lines[0], currentX + col.width / 2, row2Y + 11, { align: "center" });
          } else if (lines.length === 2) {
            doc.text(lines[0], currentX + col.width / 2, row2Y + 7, { align: "center" });
            doc.text(lines[1], currentX + col.width / 2, row2Y + 12, { align: "center" });
          } else if (lines.length === 3) {
            doc.text(lines[0], currentX + col.width / 2, row2Y + 5, { align: "center" });
            doc.text(lines[1], currentX + col.width / 2, row2Y + 9, { align: "center" });
            doc.text(lines[2], currentX + col.width / 2, row2Y + 13, { align: "center" });
          }
          currentX += col.width;
        });

        return headerHeight * 2; // คืนค่าความสูงรวมของ header (2 แถว)
      };

      // Draw initial headers
      const headerHeight = drawHeaders(currentY);
      currentY += headerHeight;

      // Draw table rows
      doc.setFont("Sarabun", "bold");
      doc.setFontSize(9);  // เปลี่ยนเป็น bold ขนาด 9

      elderlyList.forEach((elderly, idx) => {
        // Check if need new page
        if (currentY > 170) {
          doc.addPage();
          addWatermark(doc);
          currentY = 10;
          const newHeaderHeight = drawHeaders(currentY);
          currentY += newHeaderHeight;
          doc.setFont("Sarabun", "bold");
          doc.setFontSize(9);
        }

        let currentX = startX;
        const rowHeight = 11; // เพิ่มจาก 9 เป็น 11

        // ลำดับ
        doc.rect(currentX, currentY, colWidth, rowHeight);
        doc.text(String(idx + 1), currentX + colWidth / 2, currentY + 6.5, { align: "center" });
        currentX += colWidth;

        // ชื่อ-นามสกุล
        const fullName = buildFullName(elderly);
        const citizenId = elderly?.citizen_id || "";
        const nameWithId = citizenId ? `${fullName} (${citizenId})` : fullName;
        const locationText = buildLocationText(elderly);
        doc.rect(currentX, currentY, nameWidth, rowHeight);
        // แสดงชื่อ, เลขบัตร และที่อยู่ในคอลัมน์เดียวกัน
        if (locationText) {
          doc.text(nameWithId, currentX + 1, currentY + 5);
          doc.setFontSize(7);
          doc.text(locationText, currentX + 1, currentY + 9);
          doc.setFontSize(9);
        } else {
          const nameLines = doc.splitTextToSize(nameWithId, nameWidth - 2);
          doc.text(nameLines[0] || nameWithId, currentX + 1, currentY + 6.5);
        }
        currentX += nameWidth;

        // ข้อมูลเชิงสังคม
        householdColumns.forEach(col => {
          doc.rect(currentX, currentY, col.width, rowHeight);
          let displayValue = "-";
          if (col.key === "gender") {
            // ตรวจสอบทั้ง "male"/"female" และ "M"/"F"
            const gender = String(elderly.gender || "").toLowerCase();
            if (gender === "male" || gender === "m" || gender === "ชาย") {
              displayValue = "ชาย";
            } else if (gender === "female" || gender === "f" || gender === "หญิง") {
              displayValue = "หญิง";
            } else {
              displayValue = elderly.gender || "-";
            }
          } else if (col.key === "age") {
            displayValue = elderly.age || "-";
          } else {
            displayValue = formatValue(elderly[col.key], col.key);
          }
          const lines = doc.splitTextToSize(String(displayValue), col.width - 1);
          doc.text(lines[0] || displayValue, currentX + col.width / 2, currentY + 6.5, { align: "center" });
          currentX += col.width;
        });

        // แบบคัดกรอง
        pdfAssessmentColumns.forEach(col => {
          doc.rect(currentX, currentY, col.width, rowHeight);

          // ถ้ามี domain ให้คำนวณความเสี่ยง ถ้าไม่มีให้แสดงค่าตามปกติ
          const value = col.domain
            ? calculateRiskByDomain(elderly, col.domain)
            : formatValue(elderly[col.key], col.key);

          const lines = doc.splitTextToSize(String(value), col.width - 1);
          doc.text(lines[0] || value, currentX + col.width / 2, currentY + 6.5, { align: "center" });
          currentX += col.width;
        });

        // จำนวนครั้งที่
        doc.rect(currentX, currentY, sumbynumWidth, rowHeight);
        const sumbynum = elderly.sumbynum || elderly.sum_by_num || 1;
        doc.text(String(sumbynum), currentX + sumbynumWidth / 2, currentY + 6.5, { align: "center" });
        currentX += sumbynumWidth;

        // ผลการประเมิน
        doc.rect(currentX, currentY, resultWidth, rowHeight);
        const overallResult = getOverallResult(elderly);
        doc.text(overallResult, currentX + resultWidth / 2, currentY + 6.5, { align: "center" });

        currentY += rowHeight;
      });

      // Save PDF - Format: Elderly{osm_code}_{DD-MM-YYYY}.pdf
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const dateStr = `${day}-${month}-${year}`;
      const code = osmCode || reportData?.first_name || "";
      doc.save(`Elderly_${code}_${dateStr}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("เกิดข้อผิดพลาดในการสร้าง PDF");
    }
  };

  // กำหนดคอลัมน์ตามรูป - แสดงผลความเสี่ยงแต่ละด้าน
  const assessmentColumns = [
    { key: "social_living_with_care", label: "ข้อมูลการคัดกรองผู้สูงอายุ\nมีผู้ดูแล", domain: null },
    { key: "social_house_safety", label: "ลักษณะที่อยู่อาศัย", domain: null },
    { key: "social_income_sufficiency", label: "ความเพียงพอของรายได้", domain: null },
    { key: "cognitive_result", label: "ความคิด/ความจำ", domain: "cognitive" },
    { key: "mobility", label: "ความสามารถทางการเคลื่อนไหว", domain: "mobility" },
    { key: "swallowing", label: "การกลืนอาหาร", domain: "swallowing" },
    { key: "vision_problem", label: "ด้านการมองเห็น", domain: "vision" },
    { key: "hearing_result", label: "ด้านการได้ยิน", domain: "hearing" },
    { key: "depression", label: "ภาวะซึมเศร้า", domain: "depression" },
    { key: "urinary_incontinence", label: "กลั้นปัสสาวะไม่ได้", domain: "urinary" },
    { key: "adl_status", label: "กิจวัตรประจำวัน", domain: "adl" },
    { key: "oral", label: "ช่องปาก", domain: "oral" },
  ];

  const formatValue = (value, fieldKey = "") => {
    if (!value || value === "" || value === "-") return "-";

    const str = String(value).toUpperCase();

    // ผู้สูงอายุอยู่กับใคร (living_arrangement): Y=อยู่คนเดียว, N=อยู่มากกว่า 1 คน
    if (fieldKey === "living_arrangement") {
      if (str === "Y") return "อยู่คนเดียว";
      if (str === "N") return "อยู่มากกว่า 1 คน";
    }

    // ลักษณะที่อยู่อาศัย (social_house_safety): Y=ไม่ปลอดภัย, N=มั่นคงแข็งแรง
    if (fieldKey === "social_house_safety") {
      if (str === "Y") return "ไม่ปลอดภัย";
      if (str === "N") return "มั่นคงแข็งแรง";
    }

    // รายได้ (social_income_sufficiency): Y=ไม่เพียงพอ, N=เพียงพอ
    if (fieldKey === "social_income_sufficiency") {
      if (str === "Y") return "ไม่เพียงพอ";
      if (str === "N") return "เพียงพอ";
    }

    // ผู้ดูแล (social_living_with_care): Y=ไม่มีผู้ดูแล, N=มีผู้ดูแล
    if (fieldKey === "social_living_with_care") {
      if (str === "Y") return "ไม่มีผู้ดูแล";
      if (str === "N") return "มีผู้ดูแล";
    }

    // ถ้าไม่ใช่ Y/N ให้แสดงค่าเดิม
    return value;
  };

  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      const subHeaders = [
        "ผู้สูงอายุ\nอยู่ร่วม",
        "เพศ",
        "อายุ\n(ปี)",
        "มีผู้ดูแล",
        "บ้าน\nปลอดภัย",
        "รายได้\nเพียงพอ",
        "ความคิด/\nความจำ",
        "การ\nเคลื่อน\nไหว",
        "การกลืน\nอาหาร",
        "การ\nมองเห็น",
        "การ\nได้ยิน",
        "ภาวะ\nซึมเศร้า",
        "กลั้น\nปัสสาวะ",
        "กิจวัตรประจำวัน",
        "ช่องปาก",
        "จำนวนครั้งที่",
        "ผลการประเมิน"
      ];

      const numCols = 19;

      // Header rows before table
      const headerRows = [
        ["รายงานผลการประเมินสุขภาพผู้สูงอายุในชุมชน", ...Array(numCols - 1).fill(null)],
        [`ผู้คัดกรอง: ${assessorName || "ไม่ระบุชื่อ"}`, ...Array(numCols - 1).fill(null)],
        [...Array(numCols).fill(null)], // Empty row
      ];

      const wsData = [
        ...headerRows,
        // Row 1: Main headers (row index 0 in Excel)
        [
          "ลำดับ",                                // 0
          "ชื่อ-นามสกุล",                         // 1
          "ข้อมูลเชิงสังคม",                      // 2
          null,                                    // 3
          null,                                    // 4
          "แบบคัดกรองสุขภาพผู้สูงอายุ",        // 5
          null, null, null, null, null, null,      // 6-11 (6 nulls)
          null, null, null, null, null,            // 12-16 (5 nulls)
          "จำนวนครั้งที่",                        // 17
          "ผลการ\nประเมิน"                       // 18
        ],
        // Row 2: Sub headers (row index 1 in Excel)
        [
          null,                                    // 0 - merged
          null,                                    // 1 - merged
          ...subHeaders,                           // 2-17 (16 elements)
          null                                     // 18 - merged
        ],
        // Data rows
        ...elderlyList.map((elderly, idx) => {
          const fullName = buildFullName(elderly);
          const citizenId = elderly?.citizen_id || "";
          const nameWithId = citizenId ? `${fullName} (${citizenId})` : fullName;
          const locationText = buildLocationText(elderly);
          const nameWithLocation = locationText ? `${nameWithId}\n${locationText}` : nameWithId;

          // ข้อมูลเชิงสังคม
          const livingValue = formatValue(elderly.living_arrangement, "living_arrangement");
          const genderValue = elderly.gender === "male" ? "ชาย" : elderly.gender === "female" ? "หญิง" : elderly.gender || "-";
          const ageValue = elderly.age || "-";

          // แบบคัดกรอง
          const assessmentValues = assessmentColumns.map(col => {
            return col.domain
              ? calculateRiskByDomain(elderly, col.domain)
              : formatValue(elderly[col.key], col.key);
          });

          // จำนวนครั้งที่
          const sumbynum = elderly.sumbynum || elderly.sum_by_num || 1;

          // ผลการประเมิน
          const overallResult = getOverallResult(elderly);

          return [
            idx + 1,
            nameWithLocation,
            livingValue,
            genderValue,
            ageValue,
            ...assessmentValues,
            sumbynum,
            overallResult
          ];
        })
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // ตั้งค่า range ของ worksheet ให้ครบ 19 columns (A-S)
      // 3 header rows (title, evaluator, empty) + 2 table header rows + data rows
      const headerOffset = 3; // header rows before table
      const totalRows = elderlyList.length + headerOffset + 2;
      ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: totalRows - 1, c: 18 } });

      // สร้าง merged cells
      ws['!merges'] = [
        // Header rows (title, evaluator, empty)
        { s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } }, // Title row
        { s: { r: 1, c: 0 }, e: { r: 1, c: numCols - 1 } }, // Evaluator row
        // Table header merges (offset by headerOffset)
        { s: { r: headerOffset + 0, c: 0 }, e: { r: headerOffset + 1, c: 0 } }, // ลำดับ
        { s: { r: headerOffset + 0, c: 1 }, e: { r: headerOffset + 1, c: 1 } }, // ชื่อ-นามสกุล
        { s: { r: headerOffset + 0, c: 2 }, e: { r: headerOffset + 0, c: 4 } }, // ข้อมูลเชิงสังคม
        { s: { r: headerOffset + 0, c: 5 }, e: { r: headerOffset + 0, c: 16 } }, // แบบคัดกรอง
        { s: { r: headerOffset + 0, c: 17 }, e: { r: headerOffset + 1, c: 17 } }, // จำนวนครั้งที่
        { s: { r: headerOffset + 0, c: 18 }, e: { r: headerOffset + 1, c: 18 } }, // ผลการประเมิน
      ];

      // คำนวณความกว้างคอลัมน์
      const colSettings = [
        { min: 50, max: 70 },    // 0: ลำดับ
        { min: 200, max: 300 },  // 1: ชื่อ-นามสกุล (เพิ่มความกว้างสำหรับแสดงที่อยู่)
        { min: 80, max: 100 },   // 2: ผู้สูงอายุอยู่ร่วม
        { min: 50, max: 70 },    // 3: เพศ
        { min: 50, max: 70 },    // 4: อายุ
        { min: 70, max: 90 },    // 5-16: แบบคัดกรอง (12 columns)
        { min: 70, max: 90 },
        { min: 70, max: 90 },
        { min: 70, max: 90 },
        { min: 70, max: 90 },
        { min: 70, max: 90 },
        { min: 70, max: 90 },
        { min: 70, max: 90 },
        { min: 70, max: 90 },
        { min: 70, max: 90 },
        { min: 70, max: 90 },
        { min: 70, max: 90 },
        { min: 60, max: 80 },    // 17: จำนวนครั้งที่
        { min: 80, max: 100 },   // 18: ผลการประเมิน
      ];

      ws['!cols'] = [];
      for (let i = 0; i < numCols; i++) {
        const setting = colSettings[i] || { min: 70, max: 100 };
        ws['!cols'].push({ wpx: setting.min });
      }

      // ตั้งค่าความสูงแถว
      ws['!rows'] = [];
      for (let i = 0; i < totalRows; i++) {
        if (i === 0) {
          ws['!rows'].push({ hpx: 35 });  // Title row
        } else if (i === 1) {
          ws['!rows'].push({ hpx: 25 });  // Evaluator row
        } else if (i === 2) {
          ws['!rows'].push({ hpx: 10 });  // Empty row
        } else if (i === headerOffset) {
          ws['!rows'].push({ hpx: 30 });  // Table header row 1
        } else if (i === headerOffset + 1) {
          ws['!rows'].push({ hpx: 60 });  // Table header row 2
        } else {
          ws['!rows'].push({ hpx: 40 });  // Data rows
        }
      }

      // เพิ่ม borders และ styles
      const range = XLSX.utils.decode_range(ws['!ref']);

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

          if (!ws[cellAddress]) {
            ws[cellAddress] = { v: "" };
          }

          const merge = getMergeInfo(R, C);

          // Header rows (0-2): Title, Evaluator, Empty - no borders
          if (R <= 2) {
            ws[cellAddress].s = {
              alignment: {
                vertical: "center",
                horizontal: "center",
                wrapText: true
              },
              font: {
                name: "Tahoma",
                sz: R === 0 ? 14 : 11,
                bold: R === 0
              }
            };
            continue;
          }

          const cellStyle = {
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

          const borders = {
            top: { style: "thin", color: { rgb: "FF000000" } },
            left: { style: "thin", color: { rgb: "FF000000" } },
            bottom: { style: "thin", color: { rgb: "FF000000" } },
            right: { style: "thin", color: { rgb: "FF000000" } }
          };

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
          ws[cellAddress].s = cellStyle;

          // Table header rows (3-4)
          if (R >= headerOffset && R <= headerOffset + 1) {
            ws[cellAddress].s.font.bold = true;
            ws[cellAddress].s.font.sz = 9;
            ws[cellAddress].s.fill = { fgColor: { rgb: "E8F4F8" } };
          }

          // Data rows - ชื่อ-นามสกุล จัดซ้าย
          if (R >= headerOffset + 2 && C === 1) {
            ws[cellAddress].s.alignment.horizontal = "left";
          }

          // สีสำหรับผลการประเมิน
          if (R >= headerOffset + 2) {
            const cellValue = ws[cellAddress].v;
            if (cellValue === "เสี่ยง") {
              ws[cellAddress].s.font.color = { rgb: "FF0000" };
              ws[cellAddress].s.font.bold = true;
            } else if (cellValue === "ปกติ") {
              ws[cellAddress].s.font.color = { rgb: "008000" };
              ws[cellAddress].s.font.bold = true;
            }
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, "รายงานคัดกรองผู้สูงอายุ");

      // Save Excel - Format: Elderly{osm_code}_{DD-MM-YYYY}.xlsx
      const nowExcel = new Date();
      const dayExcel = String(nowExcel.getDate()).padStart(2, '0');
      const monthExcel = String(nowExcel.getMonth() + 1).padStart(2, '0');
      const yearExcel = nowExcel.getFullYear();
      const dateStrExcel = `${dayExcel}-${monthExcel}-${yearExcel}`;
      const codeExcel = osmCode || "";
      XLSX.writeFile(wb, `Elderly_${codeExcel}_${dateStrExcel}.xlsx`);
    } catch (error) {
      console.error("Error generating Excel:", error);
      alert("เกิดข้อผิดพลาดในการสร้าง Excel");
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#faf8ff] via-white to-[#f5f0ff] p-4 sm:p-6">
      {/* Header */}
      <div className="relative mb-6 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7e32e2] via-[#9333ea] to-[#a855f7]" />

        <div className="relative p-6 sm:p-8 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={goBack}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl transition"
              >
                <ArrowLeft size={18} />
                <span className="font-semibold">กลับ</span>
              </button>
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                <Users size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">รายงานผลการประเมินสุขภาพผู้สูงอายุในชุมชน</h1>
                <p className="text-white/95 text-sm mt-1">
                  ผู้คัดกรอง: <span className="font-bold">{assessorName || "ไม่ระบุชื่อ"}</span>
                </p>
                <p className="text-white/95 text-sm">
                  จำนวนทั้งหมด: <span className="font-bold">{elderlyCount}</span> คน
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2 !bg-green-500 hover:!bg-green-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition"
                style={{ backgroundColor: '#10b981' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
              >
                <FileSpreadsheet size={18} />
                Export Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-white text-[#7e32e2] font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition"
              >
                <Download size={18} />
                ดาวน์โหลด PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#f0ebff] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse" style={{ minWidth: "2000px" }}>
            <thead>
              {/* Row 1: Main Headers */}
              <tr className="bg-[#7e32e2]">
                <th rowSpan={2} className="border border-white/30 py-3 px-2 text-white font-semibold text-center w-12">
                  ลำดับ
                </th>
                <th rowSpan={2} className="border border-white/30 py-3 px-3 text-white font-semibold text-center min-w-[180px]">
                  ชื่อ-นามสกุล
                </th>
                <th colSpan={3} className="border border-white/30 py-2 px-3 text-white font-semibold text-center">
                  ข้อมูลเชิงสังคม
                </th>
                <th colSpan={12} className="border border-white/30 py-2 px-3 text-white font-semibold text-center">
                  แบบคัดกรองสุขภาพผู้สูงอายุ
                </th>
                <th rowSpan={2} className="border border-white/30 py-3 px-2 text-white font-semibold text-center min-w-[70px]">
                  จำนวนครั้งที่
                </th>
                <th rowSpan={2} className="border border-white/30 py-3 px-2 text-white font-semibold text-center min-w-[80px]">
                  ผลการประเมิน
                </th>
              </tr>
              {/* Row 2: Sub Headers */}
              <tr className="bg-[#7e32e2]">
                <th className="border border-white/30 py-2 px-2 text-white font-medium text-center text-[10px] w-16">
                  ผู้สูงอายุ<br />อยู่ร่วม
                </th>
                <th className="border border-white/30 py-2 px-2 text-white font-medium text-center text-[10px] w-16">
                  เพศ
                </th>
                <th className="border border-white/30 py-2 px-2 text-white font-medium text-center text-[10px] w-16">
                  อายุ<br />(ปี)
                </th>
                {assessmentColumns.map((col) => (
                  <th key={col.key} className="border border-white/30 py-2 px-2 text-white font-medium text-center text-[10px] min-w-[60px]">
                    {col.label.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        {i < col.label.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {elderlyList.length === 0 ? (
                <tr>
                  <td colSpan={19} className="py-12 text-center text-gray-500">
                    ไม่พบข้อมูลผู้สูงอายุ
                  </td>
                </tr>
              ) : (
                elderlyList.map((elderly, idx) => {
                  const fullName = buildFullName(elderly);
                  const citizenId = elderly?.citizen_id || "";
                  const nameWithId = citizenId ? `${fullName} (${citizenId})` : fullName;
                  const locationText = buildLocationText(elderly);

                  return (
                    <tr
                      key={elderly.id || elderly.citizen_id || idx}
                      className={idx % 2 === 0 ? "bg-white" : "bg-purple-50/30"}
                    >
                      <td className="border border-gray-200 py-2 px-2 text-center text-gray-700 font-medium">
                        {idx + 1}
                      </td>
                      <td className="border border-gray-200 py-2 px-3 text-gray-800">
                        <div className="font-medium">{nameWithId}</div>
                        {locationText && <div className="text-[10px] text-gray-500 mt-0.5">{locationText}</div>}
                      </td>
                      <td className="border border-gray-200 py-2 px-2 text-center text-gray-700 text-[11px]">
                        {formatValue(elderly.living_arrangement, "living_arrangement")}
                      </td>
                      <td className="border border-gray-200 py-2 px-2 text-center text-gray-700 text-[11px]">
                        {elderly.gender === "male" ? "ชาย" : elderly.gender === "female" ? "หญิง" : elderly.gender || "-"}
                      </td>
                      <td className="border border-gray-200 py-2 px-2 text-center text-gray-700 text-[11px]">
                        {elderly.age || "-"}
                      </td>
                      {assessmentColumns.map((col) => {
                        // ถ้ามี domain ให้คำนวณความเสี่ยง ถ้าไม่มีให้แสดงค่าตามปกติ
                        const displayValue = col.domain
                          ? calculateRiskByDomain(elderly, col.domain)
                          : formatValue(elderly[col.key], col.key);

                        // กำหนดสีตามผลลัพธ์
                        const isRisk = displayValue === "เสี่ยง";
                        const textColor = isRisk ? "text-red-600 font-bold" : displayValue === "ปกติ" ? "text-green-600 font-semibold" : "text-gray-700";

                        return (
                          <td key={col.key} className={`border border-gray-200 py-2 px-2 text-center text-[11px] ${textColor}`}>
                            {displayValue}
                          </td>
                        );
                      })}
                      {/* คอลัมน์จำนวนครั้งที่ */}
                      <td className="border border-gray-200 py-2 px-2 text-center text-gray-700 text-[11px]">
                        {elderly.sumbynum || elderly.sum_by_num || 1}
                      </td>
                      {/* คอลัมน์ผลการประเมิน */}
                      {(() => {
                        const overallResult = getOverallResult(elderly);
                        const isOverallRisk = overallResult === "เสี่ยง";
                        const overallTextColor = isOverallRisk ? "text-red-600 font-bold" : "text-green-600 font-semibold";
                        return (
                          <td className={`border border-gray-200 py-2 px-2 text-center text-[11px] ${overallTextColor}`}>
                            {overallResult}
                          </td>
                        );
                      })()}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Summary */}
      {/* <div className="mt-4 bg-white rounded-xl shadow border border-[#f0ebff] p-4">
        <div className="text-sm text-gray-600">
          <p className="mb-2">
            <span className="font-semibold">หมายเหตุ:</span>
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>มี = พบปัญหาหรือมีความเสี่ยง</li>
            <li>ไม่มี = ไม่พบปัญหา หรือผ่านการประเมิน</li>
            <li>สิทธิประโยชน์: แสดงสิทธิ์การรักษาพยาบาลของผู้สูงอายุ</li>
          </ul>
        </div>
      </div> */}
    </div>
  );
};

export default ElderlyScreeningDetail;
