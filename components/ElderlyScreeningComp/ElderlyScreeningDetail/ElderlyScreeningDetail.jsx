"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Download } from "lucide-react";
import jsPDF from "jspdf";
import { font as SarabunFont } from "../../../styles/Sarabun-Regular-normal";
import { fontbold as SarabunBoldFont } from "../../../styles/Sarabun-Regular-bold";

const buildFullName = (record) =>
  [record?.prefix_name_th, record?.first_name, record?.last_name].filter(Boolean).join(" ") ||
  [record?.prefix, record?.first_name, record?.last_name].filter(Boolean).join(" ") ||
  record?.citizen_id ||
  "ไม่ทราบชื่อ";

const ElderlyScreeningDetail = ({
  assessorName,
  elderlyList = [],
  elderlyCount = 0,
  onBack
}) => {
  const router = useRouter();

  const goBack = () => {
    if (onBack) return onBack();
    router.push("/elderly-screening");
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
      doc.text("รายงานผลการคัดกรองสุขภาพผู้สูงอายุในชุมชน", 148, 12, { align: "center" });

      doc.setFontSize(10);
      doc.setFont("Sarabun", "normal");
      doc.text(`ผู้ประเมิน: ${assessorName || "ไม่ระบุชื่อ"}`, 148, 18, { align: "center" });
      doc.text(`นายทะเบียน อสม.`, 148, 23, { align: "center" });

      // Define table columns - total width should be ~287mm (297mm - 10mm margins)
      // ลำดับ(8) + ชื่อ(45) + อยู่ร่วม(17) + เพศ(8) + อายุ(8) = 86mm
      // แบบคัดกรอง 16 คอลัมน์ = 201mm (16 x 12.5mm)
      // Total = 287mm

      const colWidth = 8;  // ลำดับ
      const nameWidth = 45; // ชื่อ-นามสกุล
      const livingWidth = 17; // อยู่ร่วม
      const genderWidth = 8; // เพศ
      const ageWidth = 8; // อายุ
      const assessWidth = 12.5; // แต่ละคอลัมน์แบบคัดกรอง

      // คำนวณความกว้างรวมของตาราง
      const totalTableWidth = colWidth + nameWidth + livingWidth + genderWidth + ageWidth + (assessWidth * 12);
      // Total = 8 + 45 + 17 + 8 + 8 + (12.5 * 12) = 86 + 150 = 236mm

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
        { key: "adl_status", label: "กิจวัตรประจำวัน", width: assessWidth, domain: "adl" },
        { key: "oral", label: "ช่องปาก", width: assessWidth, domain: "oral" },
      ];

      // Start table - คำนวณให้อยู่กึ่งกลาง
      const pageWidth = 297; // A4 landscape width
      const startX = (pageWidth - totalTableWidth) / 2; // จัดกึ่งกลาง
      const startY = 28;
      let currentY = startY;

      const drawHeaders = (yPos) => {
        doc.setFontSize(6);
        doc.setFont("Sarabun", "bold");
        let currentX = startX;

        // ลำดับ
        doc.rect(currentX, yPos, colWidth, 10);
        doc.text("ลำดับ", currentX + colWidth / 2, yPos + 6, { align: "center" });
        currentX += colWidth;

        // ชื่อ-นามสกุล
        doc.rect(currentX, yPos, nameWidth, 10);
        doc.text("ชื่อ-นามสกุล ผู้ประเมิน", currentX + nameWidth / 2, yPos + 6, { align: "center" });
        currentX += nameWidth;

        // ข้อมูลครัวเรือน
        householdColumns.forEach(col => {
          doc.rect(currentX, yPos, col.width, 10);
          const lines = col.label.split('\n');
          if (lines.length === 2) {
            doc.text(lines[0], currentX + col.width / 2, yPos + 4.5, { align: "center" });
            doc.text(lines[1], currentX + col.width / 2, yPos + 7.5, { align: "center" });
          } else {
            doc.text(col.label, currentX + col.width / 2, yPos + 6, { align: "center" });
          }
          currentX += col.width;
        });

        // แบบคัดกรอง
        pdfAssessmentColumns.forEach(col => {
          doc.rect(currentX, yPos, col.width, 10);
          const lines = col.label.split('\n');

          if (lines.length === 1) {
            doc.text(lines[0], currentX + col.width / 2, yPos + 6, { align: "center" });
          } else if (lines.length === 2) {
            doc.text(lines[0], currentX + col.width / 2, yPos + 4.5, { align: "center" });
            doc.text(lines[1], currentX + col.width / 2, yPos + 7.5, { align: "center" });
          } else if (lines.length === 3) {
            doc.text(lines[0], currentX + col.width / 2, yPos + 3.5, { align: "center" });
            doc.text(lines[1], currentX + col.width / 2, yPos + 6, { align: "center" });
            doc.text(lines[2], currentX + col.width / 2, yPos + 8.5, { align: "center" });
          } else if (lines.length === 4) {
            doc.text(lines[0], currentX + col.width / 2, yPos + 2.5, { align: "center" });
            doc.text(lines[1], currentX + col.width / 2, yPos + 4.5, { align: "center" });
            doc.text(lines[2], currentX + col.width / 2, yPos + 6.5, { align: "center" });
            doc.text(lines[3], currentX + col.width / 2, yPos + 8.5, { align: "center" });
          } else if (lines.length >= 5) {
            doc.text(lines[0], currentX + col.width / 2, yPos + 2, { align: "center" });
            doc.text(lines[1], currentX + col.width / 2, yPos + 3.5, { align: "center" });
            doc.text(lines[2], currentX + col.width / 2, yPos + 5, { align: "center" });
            doc.text(lines[3], currentX + col.width / 2, yPos + 6.5, { align: "center" });
            doc.text(lines[4], currentX + col.width / 2, yPos + 8, { align: "center" });
          }
          currentX += col.width;
        });
      };

      // Draw initial headers
      drawHeaders(currentY);
      currentY += 10;

      // Draw table rows
      doc.setFont("Sarabun", "normal");
      doc.setFontSize(6.5);

      elderlyList.forEach((elderly, idx) => {
        // Check if need new page
        if (currentY > 185) {
          doc.addPage();
          currentY = 10;
          drawHeaders(currentY);
          currentY += 10;
          doc.setFont("Sarabun", "normal");
          doc.setFontSize(6.5);
        }

        let currentX = startX;
        const rowHeight = 7;

        // ลำดับ
        doc.rect(currentX, currentY, colWidth, rowHeight);
        doc.text(String(idx + 1), currentX + colWidth / 2, currentY + 4.5, { align: "center" });
        currentX += colWidth;

        // ชื่อ-นามสกุล
        const fullName = buildFullName(elderly);
        doc.rect(currentX, currentY, nameWidth, rowHeight);
        const nameLines = doc.splitTextToSize(fullName, nameWidth - 2);
        doc.text(nameLines[0] || fullName, currentX + 1, currentY + 4.5);
        currentX += nameWidth;

        // ข้อมูลครัวเรือน
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
          doc.text(lines[0] || displayValue, currentX + col.width / 2, currentY + 4.5, { align: "center" });
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
          doc.text(lines[0] || value, currentX + col.width / 2, currentY + 4.5, { align: "center" });
          currentX += col.width;
        });

        currentY += rowHeight;
      });

      doc.save(`รายงานคัดกรองผู้สูงอายุ_${assessorName || "report"}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("เกิดข้อผิดพลาดในการสร้าง PDF");
    }
  };

  // ฟังก์ชันคำนวณความเสี่ยงแต่ละด้าน (ตามสูตรจาก Mobile App)
  const calculateRiskByDomain = (elderly, domain) => {
    if (!elderly) return "-";

    switch (domain) {
      case "cognitive": // ด้านที่ 1: ความคิดความจำ
        return elderly.cognitive_result === "N" ? "เสี่ยง" : "ไม่เสี่ยง";

      case "mobility": // ด้านที่ 2: การเคลื่อนไหว (2 คำถาม)
        return elderly.mobility_test === "N" || elderly.fall_history_6m === "Y" ? "เสี่ยง" : "ไม่เสี่ยง";

      case "swallowing": // ด้านที่ 3: การกลืนอาหาร (2 คำถาม)
        return elderly.weight_loss_3m === "Y" || elderly.appetite_loss === "Y" ? "เสี่ยง" : "ไม่เสี่ยง";

      case "vision": // ด้านที่ 4: การมองเห็น
        return elderly.vision_problem === "Y" ? "เสี่ยง" : "ไม่เสี่ยง";

      case "hearing": // ด้านที่ 5: การได้ยิน
        return elderly.hearing_result !== "Y" ? "เสี่ยง" : "ไม่เสี่ยง";

      case "depression": // ด้านที่ 6: ภาวะซึมเศร้า (3 คำถาม)
        return elderly.depression_symptom_2w === "Y" || elderly.boredom_symptom_2w === "Y" || elderly.suicide_thought_1m === "Y"
          ? "เสี่ยง" : "ไม่เสี่ยง";

      case "urinary": // ด้านที่ 7: การกลั้นปัสสาวะ
        return elderly.urinary_incontinence === "Y" ? "เสี่ยง" : "ไม่เสี่ยง";

      case "adl": // ด้านที่ 8: ADL
        return elderly.adl_status === "N" ? "เสี่ยง" : "ไม่เสี่ยง";

      case "oral": // ด้านที่ 9: ช่องปาก (2 คำถาม)
        return elderly.chewing_difficulty === "Y" || elderly.oral_pain === "Y" ? "เสี่ยง" : "ไม่เสี่ยง";

      default:
        return "-";
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

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#faf8ff] via-white to-[#f5f0ff] p-4 sm:p-6">
      {/* Header */}
      <div className="relative mb-6 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7e32e2] via-[#9333ea] to-[#a855f7]" />
        <div className="absolute inset-0 bg-white/5" />

        <div className="relative p-6 sm:p-8 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={goBack}
                className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl transition"
              >
                <ArrowLeft size={18} />
                <span className="font-semibold">กลับ</span>
              </button>
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Users size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">รายงานผลการคัดกรองสุขภาพผู้สูงอายุในชุมชน</h1>
                <p className="text-white/90 text-sm mt-1">
                  ผู้ประเมิน: <span className="font-bold">{assessorName || "ไม่ระบุชื่อ"}</span>
                </p>
                <p className="text-white/80 text-sm">
                  จำนวนทั้งหมด: <span className="font-bold">{elderlyCount}</span> คน
                </p>
              </div>
            </div>
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

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#f0ebff] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse" style={{ minWidth: "2000px" }}>
            <thead>
              {/* Row 1: Main Headers */}
              <tr className="bg-gradient-to-r from-[#7e32e2] to-[#a855f7]">
                <th rowSpan={2} className="border border-white/20 py-3 px-2 text-white font-semibold text-center w-12">
                  ลำดับ
                </th>
                <th rowSpan={2} className="border border-white/20 py-3 px-3 text-white font-semibold text-center min-w-[180px]">
                  ชื่อ-นามสกุล ผู้ประเมิน
                </th>
                <th colSpan={3} className="border border-white/20 py-2 px-3 text-white font-semibold text-center">
                  ข้อมูลครัวเรือน
                </th>
                <th colSpan={12} className="border border-white/20 py-2 px-3 text-white font-semibold text-center">
                  แบบคัดกรองสุขภาพผู้สูงอายุ
                </th>
              </tr>
              {/* Row 2: Sub Headers */}
              <tr className="bg-gradient-to-r from-[#8b3def] to-[#b35ff9]">
                <th className="border border-white/20 py-2 px-2 text-white font-medium text-center text-[10px] w-16">
                  ผู้สูงอายุ<br />อยู่ร่วม
                </th>
                <th className="border border-white/20 py-2 px-2 text-white font-medium text-center text-[10px] w-16">
                  เพศ
                </th>
                <th className="border border-white/20 py-2 px-2 text-white font-medium text-center text-[10px] w-16">
                  อายุ<br />(ปี)
                </th>
                {assessmentColumns.map((col) => (
                  <th key={col.key} className="border border-white/20 py-2 px-2 text-white font-medium text-center text-[10px] min-w-[60px]">
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
                  <td colSpan={17} className="py-12 text-center text-gray-500">
                    ไม่พบข้อมูลผู้สูงอายุ
                  </td>
                </tr>
              ) : (
                elderlyList.map((elderly, idx) => {
                  const fullName = buildFullName(elderly);

                  return (
                    <tr
                      key={elderly.id || elderly.citizen_id || idx}
                      className={idx % 2 === 0 ? "bg-white" : "bg-purple-50/30"}
                    >
                      <td className="border border-gray-200 py-2 px-2 text-center text-gray-700 font-medium">
                        {idx + 1}
                      </td>
                      <td className="border border-gray-200 py-2 px-3 text-gray-800 font-medium">
                        {fullName}
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
                        const textColor = isRisk ? "text-red-600 font-bold" : displayValue === "ไม่เสี่ยง" ? "text-green-600 font-semibold" : "text-gray-700";

                        return (
                          <td key={col.key} className={`border border-gray-200 py-2 px-2 text-center text-[11px] ${textColor}`}>
                            {displayValue}
                          </td>
                        );
                      })}
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
