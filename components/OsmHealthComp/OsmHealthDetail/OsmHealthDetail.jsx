import React from "react";
import jsPDF from "jspdf";
import { font as SarabunFont } from "@styles/Sarabun-Regular-normal";
import { fontbold as SarabunBoldFont } from "@styles/Sarabun-Regular-bold";
import { getUserByExternalId } from "@services/oauth2Service";

/**
 * Format วันที่เป็นรูปแบบไทย DD/MM/YYYY
 */
const formatThaiDateShort = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear() + 543;
  return `${day}/${month}/${year}`;
};

/**
 * คำนวณอายุจาก birth_date
 */
const calculateAgeFromBirthDate = (birthDate) => {
  if (!birthDate) return "";
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age.toString();
};

/**
 * วาดเช็คบ็อกพร้อมเครื่องหมาย /
 */
const drawCheckbox = (doc, x, y, size, checked) => {
  doc.setLineWidth(0.3);
  doc.rect(x, y, size, size);
  if (checked) {
    doc.setFont("Sarabun", "normal");
    doc.setFontSize(12);
    doc.text("/", x + size / 2, y + size - 1, { align: "center" });
    doc.setFont("Sarabun", "normal");
  }
};

/**
 * Export health record to PDF
 */
export const exportHealthRecordToPDF = async (record) => {
  if (!record) {
    console.error("No record data provided");
    return;
  }

  // ดึงข้อมูล OSM จาก API
  let osmData = null;
  if (record.external_user_id) {
    try {
      osmData = await getUserByExternalId(record.external_user_id);
      console.log("OSM Data fetched:", osmData);
    } catch (error) {
      console.error("Failed to fetch OSM data:", error);
    }
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // เพิ่ม Thai font
  doc.addFileToVFS("Sarabun-Regular.ttf", SarabunFont);
  doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
  doc.addFileToVFS("Sarabun-Bold.ttf", SarabunBoldFont);
  doc.addFont("Sarabun-Bold.ttf", "Sarabun", "normal");
  doc.setFont("Sarabun", "normal");

  const pageWidth = 210;
  const margin = 15;
  let y = 15;
  const checkboxSize = 3.5;

  // Title - จัดกึ่งกลาง
  doc.setFontSize(16);
  doc.setFont("Sarabun", "normal");
  doc.text("แบบบันทึกผลการตรวจสุขภาพ อสม.", pageWidth / 2, y, { align: "center" });
  y += 7;

  // ===== ข้อมูลทั่วไป =====
  doc.setFontSize(14);
  doc.setFont("Sarabun", "normal");
  doc.text("ข้อมูลทั่วไป", margin, y);
  y += 6;

  doc.setFontSize(12);
  doc.setFont("Sarabun", "normal");

  // แถว 1: เลขบัตรประชาชน วัน/เดือน/ปีเกิด อายุ
  const idCard = osmData?.citizen_id || record.id_card || "";
  const birthDate = osmData?.birth_date || "";
  const age = calculateAgeFromBirthDate(birthDate);

  doc.text(`เลขบัตรประจำตัวประชาชน  ${idCard}`, margin, y);
  doc.text(`วัน/เดือน/ปีเกิด  ${formatThaiDateShort(birthDate)}`, margin + 75, y);
  doc.text(`อายุ  ${age}`, margin + 135, y);
  y += 6;

  // แถว 2: คำนำหน้า + ชื่อ + นามสกุล
  const prefix = osmData?.prefix_name_th || record.prefix || "";
  const firstName = osmData?.first_name || record.first_name || "";
  const lastName = osmData?.last_name || record.last_name || "";
  const maritalStatus = osmData?.marital_status || record.marital_status || "";

  // คำนำหน้า
  const isNai = prefix === "นาย";
  const isNang = prefix === "นาง";
  const isNangsao = prefix === "นางสาว";

  drawCheckbox(doc, margin, y - 3, checkboxSize, isNai);
  doc.text("นาย", margin + 5, y);
  drawCheckbox(doc, margin + 15, y - 3, checkboxSize, isNang);
  doc.text("นาง", margin + 20, y);
  drawCheckbox(doc, margin + 32, y - 3, checkboxSize, isNangsao);
  doc.text("นางสาว", margin + 37, y);

  // ชื่อ-นามสกุล
  doc.text(`ชื่อ  ${firstName}`, margin + 55, y);
  doc.text(`นามสกุล  ${lastName}`, margin + 85, y);

  // สถานภาพ
  const isSingle = maritalStatus === "single";
  const isMarried = maritalStatus === "married";
  const isDivorced = maritalStatus === "divorced";

  doc.text("สถานภาพ", margin + 125, y);
  drawCheckbox(doc, margin + 140, y - 3, checkboxSize, isSingle);
  doc.text("โสด", margin + 145, y);
  drawCheckbox(doc, margin + 155, y - 3, checkboxSize, isMarried);
  doc.text("สมรส", margin + 160, y);
  drawCheckbox(doc, margin + 175, y - 3, checkboxSize, isDivorced);
  doc.text("หย่าร้าง", margin + 180, y);
  y += 6;

  // แถว 3: ที่อยู่ปัจจุบัน
  doc.text(`ที่อยู่ปัจจุบัน  เลขที่  ${osmData?.address_number || ""}`, margin, y);
  doc.text(`หมู่ที่  ${osmData?.village_no || ""}`, margin + 45, y);
  doc.text(`ตรอก/ซอย  ${osmData?.alley || ""}`, margin + 70, y);
  doc.text(`ถนน  ${osmData?.street || ""}`, margin + 110, y);
  y += 6;

  doc.text(`ตำบล/แขวง  ${osmData?.subdistrict_name_th || ""}`, margin, y);
  doc.text(`อำเภอ/เขต  ${osmData?.district_name_th || ""}`, margin + 60, y);
  doc.text(`จังหวัด  ${osmData?.province_name_th || ""}`, margin + 110, y);
  doc.text(`รหัสไปรษณีย์  ${osmData?.postal_code || ""}`, margin + 140, y);
  y += 6;

  // ===== ประวัติสุขภาพ =====
  doc.setFont("Sarabun", "normal");
  doc.text(`ประวัติสุขภาพ โรคประจำตัว  ${record.chronic_diseases || "-"}`, margin, y);
  doc.text(`ประวัติแพ้ยา  ${record.drug_allergies || "-"}`, margin + 70, y);
  doc.text(`ประวัติแพ้อาหาร  ${record.food_allergies || "-"}`, margin + 125, y);
  y += 7;


  // ===== ประวัติครอบครัว =====
  doc.setFont("Sarabun", "normal");
  doc.setFontSize(14);
  doc.text("ประวัติครอบครัว (บิดา/มารดา/ญาติสายตรงป่วยหรือเสียชีวิตด้วยโรคดังต่อไปนี้หรือไม่)", margin, y);
  y += 6;

  doc.setFont("Sarabun", "normal");
  const familyHistory = [
    { label: "โรคมะเร็ง", value: record.family_history_cancer },
    { label: "โรคเบาหวาน", value: record.family_history_diabetes },
    { label: "โรคความดันโลหิตสูง", value: record.family_history_hypertension },
    { label: "โรคหัวใจหลอดเลือด", value: record.family_history_cvd },
    { label: "โรคหลอดเลือดสมอง", value: record.family_history_stroke },
  ];

  // แสดงข้อ 1-5 แบบ 2 คอลัมน์ (ข้อ 1-2 แถวเดียว, ข้อ 3-4 แถวเดียว, ข้อ 5 แถวใหม่)
  for (let i = 0; i < familyHistory.length; i++) {
    const item = familyHistory[i];
    const hasYes = item.value === "yes";
    const hasNo = item.value === "no";
    const hasUnknown = item.value === "unknown";

    // คอลัมน์ซ้าย (ข้อ 1, 3, 5)
    if (i % 2 === 0) {
      doc.text(`${i + 1}. ${item.label}`, margin, y);
      drawCheckbox(doc, margin + 40, y - 3, checkboxSize, hasYes);
      doc.text("มี", margin + 45, y);
      drawCheckbox(doc, margin + 53, y - 3, checkboxSize, hasNo);
      doc.text("ไม่มี", margin + 58, y);
      drawCheckbox(doc, margin + 68, y - 3, checkboxSize, hasUnknown);
      doc.text("ไม่ทราบ", margin + 73, y);
    }
    // คอลัมน์ขวา (ข้อ 2, 4)
    else {
      doc.text(`${i + 1}. ${item.label}`, margin + 100, y);
      drawCheckbox(doc, margin + 140, y - 3, checkboxSize, hasYes);
      doc.text("มี", margin + 145, y);
      drawCheckbox(doc, margin + 153, y - 3, checkboxSize, hasNo);
      doc.text("ไม่มี", margin + 158, y);
      drawCheckbox(doc, margin + 168, y - 3, checkboxSize, hasUnknown);
      doc.text("ไม่ทราบ", margin + 173, y);
      y += 5;
    }
  }
  // ถ้าเป็นข้อสุดท้ายและเป็นคอลัมน์ซ้าย ต้องขึ้นบรรทัดใหม่
  if (familyHistory.length % 2 !== 0) {
    y += 5;
  }
  y += 5;

  // ===== ประเมินและคัดกรองสุขภาพ =====
  doc.setFont("Sarabun", "normal");
  doc.setFontSize(14);
  doc.text(`ประเมินและคัดกรองตนเอง ความดันโลหิต ${record.blood_pressure_systolic || "-"} / ${record.blood_pressure_diastolic || "-"}  น้ำหนัก  ${record.weight || "-"}  กก.  ส่วนสูง  ${record.height || "-"}  ซม.  ดัชนีมวลกาย (BMI)  ${record.bmi ? record.bmi.toFixed(2) : "-"}  รอบเอว  ${record.waist || "-"}  ซม.`, margin, y);
  y += 6;



  // คำอธิบายความดันโลหิต
  doc.setFontSize(12);
  doc.text("- ความดันโลหิต ค่าปกติคือ 120 - 129/80 - 84 กรณีมากกว่า 139/89 ปรับเปลี่ยนพฤติกรรมพบแพทย์เพื่อตรวจวินิจฉัยโรคความดันโลหิตสูง", margin, y);
  y += 5;
  doc.text("- ดัชนีมวลกาย ค่าปกติคือ 18.50 - 22.90 กรณีต่ำกว่า 18.50 หมายถึง ผอม กรณีมากกว่า 22.90 หมายถึง อวบ - อ้วน", margin, y);
  y += 5;
  doc.text("- รอบเอว เพศชาย ไม่ควรเกิน 90 ซม. หรือ 35.4 นิ้ว / เพศหญิง ไม่ควรเกิน 80 ซม. หรือ 31.5 นิ้ว", margin, y);
  y += 5;

  doc.setFontSize(12);
  // 1. ตรวจเต้านมด้วยตนเอง
  doc.text("1. ตรวจเต้านมด้วยตนเอง (เฉพาะเพศหญิง)", margin, y);
  drawCheckbox(doc, margin + 80, y - 3, checkboxSize, true);
  doc.text("ปกติ", margin + 85, y);
  drawCheckbox(doc, margin + 100, y - 3, checkboxSize, false);
  doc.text(`ผิดปกติ ระบุ  ${record.bse_result || "-"}`, margin + 105, y);
  y += 5;

  doc.setFontSize(12);
  doc.text("- กรณีพบความผิดปกติ >> พบแพทย์ ultrasound/ mammogram >> ตรวจชิ้นเนื้อ >> วินิจฉัยโรคมะเร็งเต้านม >> รักษาด้วยยา/ผ่าตัด", margin, y);
  y += 5;

  doc.setFontSize(12);
  // 2. Thai CV risk score
  doc.text("2. ตรวจประเมินความเสี่ยงโรคเส้นเลือดหัวใจและหลอดเลือด", margin, y);
  const cvLow = record.cv_risk_score === "low";
  const cvMid = record.cv_risk_score === "mid";
  const cvHigh = record.cv_risk_score === "high";
  y += 5;

  drawCheckbox(doc, margin + 5, y - 3, checkboxSize, cvLow);
  doc.text("เสี่ยงต่ำ", margin + 10, y);
  drawCheckbox(doc, margin + 30, y - 3, checkboxSize, cvMid);
  doc.text("เสี่ยงปานกลาง", margin + 35, y);
  drawCheckbox(doc, margin + 63, y - 3, checkboxSize, cvHigh);
  doc.text("เสี่ยงสูง", margin + 68, y);
  drawCheckbox(doc, margin + 85, y - 3, checkboxSize, false);
  doc.text("เสี่ยงสูงมาก", margin + 90, y);
  drawCheckbox(doc, margin + 110, y - 3, checkboxSize, false);
  doc.text("เสี่ยงอันตราย", margin + 115 , y);
  y += 5;

  doc.setFontSize(12);
  doc.text("- กรณีพบความเสี่ยงสูง/สูงมาก/อันตราย >> ปรับเปลี่ยนพฤติกรรม >> พบแพทย์", margin, y);
  y += 5;

  doc.setFontSize(12);
  // 3. คัดกรองภาวะเครียด
  doc.text("3. คัดกรองภาวะเครียด (ST-5)", margin, y);
  const stressNormal = record.stress_level === "normal";
  const stressMid = record.stress_level === "mid";
  const stressHigh = record.stress_level === "high";

  drawCheckbox(doc, margin + 50, y - 3, checkboxSize, stressNormal);
  doc.text("ไม่มีความเครียด", margin + 55, y);
  drawCheckbox(doc, margin + 80, y - 3, checkboxSize, stressMid);
  doc.text("เครียดปานกลาง", margin + 85, y);
  drawCheckbox(doc, margin + 110, y - 3, checkboxSize, stressHigh);
  doc.text("เครียดสูง", margin + 115, y);
  y += 5;


  doc.setFontSize(12);
  doc.text("- กรณีมีภาวะเครียดสูง >> รับคำปรึกษาจากบุคลากรสาธารณสุข >> คัดกรองโรคซึมเศร้าด้วยแบบคัดกรอง 2Q", margin, y);
  y += 5;

  doc.setFontSize(12);
  // 4. คัดกรองภาวะซึมเศร้า
  doc.text("4. คัดกรองภาวะซึมเศร้า (2Q)", margin, y);
  const depressionOk = record.depression_2q === "ok";
  const depressionAbnormal = record.depression_2q === "abnormal";

  drawCheckbox(doc, margin + 50, y - 3, checkboxSize, depressionOk);
  doc.text("ปกติ", margin + 55, y);
  drawCheckbox(doc, margin + 80, y - 3, checkboxSize, depressionAbnormal);
  doc.text("เสี่ยงเป็นโรคซึมเศร้า", margin + 85, y);
  y += 5;

  doc.setFontSize(12);
  doc.text("- กรณีเสี่ยงภาวะซึมเศร้า >> รับคำปรึกษาจากบุคลากรสาธารณสุข >> คัดกรองโรคซึมเศร้าด้วยแบบคัดกรอง 9Q", margin, y);
  y += 7;

  // ===== ผลตรวจทางห้องปฏิบัติการ =====
  doc.setFont("Sarabun", "normal");
  doc.setFontSize(14);
  doc.text("ผลตรวจทางห้องปฏิบัติการ (อสม. อายุ 35 ปีขึ้นไป)", margin, y);
  y += 6;

  doc.setFont("Sarabun", "normal");
  doc.setFontSize(12);
  doc.text(`1. ระดับน้ำตาลในเลือดหลังอดอาหารอย่างน้อย 8 ชั่วโมง  ${record.fasting_blood_sugar || "-"}  mg/dl   (ค่าปกติอยู่ระหว่าง 75-100 mg/dl)`, margin, y);
  y += 5;

  doc.setFontSize(12);
  doc.text("- กรณีค่ามากกว่า 100 mg/dl >> ปรับเปลี่ยนพฤติกรรม >> พบแพทย์เพื่อตรวจวินิจฉัยโรคเบาหวาน", margin, y);
  y += 5;

  doc.setFontSize(12);
  doc.text("2. ตรวจอุจจาระ (เฉพาะพื้นที่เสี่ยงโรคพยาธิใบไม้ในตับ)", margin, y);
  const stoolNormal = record.stool_result === "normal";
  const stoolAbnormal = record.stool_result === "abnormal";

  drawCheckbox(doc, margin + 90, y - 3, checkboxSize, stoolNormal);
  doc.text("ปกติ", margin + 95, y);
  drawCheckbox(doc, margin + 110, y - 3, checkboxSize, stoolAbnormal);
  doc.text(`ผิดปกติ ระบุ`, margin + 115, y);
  y += 5;

  doc.setFontSize(12);
  doc.text("- กรณีพบไข่หรือตัวอ่อนพยาธิใบไม้ตับ >> พบแพทย์เพื่อรับยา >> Praziquantel >> ultrasound มะเร็งท่อน้ำดี >> วินิจฉัยมะเร็งท่อน้ำดี", margin, y);
  y += 5;
  doc.text("  >> รักษาด้วยยา/ผ่าตัด", margin, y);
  y += 6;

  doc.setFontSize(12);
  doc.text("3. ตรวจอุจจาระคัดกรองมะเร็งลำไส้ใหญ่ (สำหรับผู้มีอายุ 50 - 70 ปี)", margin, y);
  const fitNeg = record.fit_result === "neg";
  const fitPos = record.fit_result === "pos";
  drawCheckbox(doc, margin + 100, y - 3, checkboxSize, fitNeg);
  doc.text("ผลเป็นลบ", margin + 105, y);
  drawCheckbox(doc, margin + 130, y - 3, checkboxSize, fitPos);
  doc.text(`ผลเป็นบวก ระบุ`, margin + 135, y);
  y += 5;

  doc.setFontSize(12);
  doc.text("- กรณีมีผลบวก >> พบแพทย์ >> Colonoscopy >> ตรวจชิ้นเนื้อ >> วินิจฉัยโรคมะเร็งลำไส้ใหญ่ >> รักษาด้วยยา/ผ่าตัด", margin, y);
  y += 5;

  // Check if need new page before item 4
  if (y > 235) {
    doc.addPage();
    y = 25;
  }

  doc.setFontSize(12);
  doc.text("4. ตรวจคัดกรองมะเร็งปากมดลูกด้วยวิธี HPV DNA Test (เพศหญิงอายุ 35 - 60 ปี)", margin, y);
  const hpvNeg = record.hpv_result === "neg";
  const hpvPos = record.hpv_result === "pos";
  drawCheckbox(doc, margin + 100, y - 3, checkboxSize, hpvNeg);
  doc.text("ผลเป็นลบ", margin + 105, y);
  drawCheckbox(doc, margin + 130, y - 3, checkboxSize, hpvPos);
  doc.text(`ผลเป็นบวก ระบุ`, margin + 135, y);
  y += 5;


  doc.setFontSize(12);
  doc.text("- กรณีมีผลบวก >> พบแพทย์ >> Colposcopy >> ตรวจชิ้นเนื้อ >> วินิจฉัยโรคมะเร็งปากมดลูก >> รักษาด้วยยา/ผ่าตัด", margin, y);
  y += 7;

  // Check if need new page
  if (y > 250) {
    doc.addPage();
    y = 25;
  }

  // ===== สำหรับ อสม. อายุ 60 ปีขึ้นไป =====
  doc.setFont("Sarabun", "normal");
  doc.setFontSize(14);
  doc.text("สำหรับ อสม. อายุ 60 ปีขึ้นไป (Community screening)", margin, y);
  y += 6;
doc.setFontSize(12);
  doc.setFont("Sarabun", "normal");
  doc.text("1. ข้อมูลเชิงสังคม", margin, y);
  y += 6;

  doc.setFont("Sarabun", "normal");

  // 1.1 การอยู่อาศัย
  const livingWithCare = record.living_with_care || "";
  const hasCare = livingWithCare === "hasCare";
  const alone = livingWithCare === "alone";

  doc.text("   1. การอยู่อาศัย หรือ ผู้ดูแลเมื่อเจ็บป่วย", margin, y);
  y += 5;

  drawCheckbox(doc, margin + 5, y - 3, checkboxSize, hasCare);
  doc.text("ไม่ได้อยู่คนเดียว หรือ มีคนดูแลเมื่อเจ็บป่วย", margin + 10, y);
  y += 5;

  drawCheckbox(doc, margin + 5, y - 3, checkboxSize, alone);
  doc.text("อยู่คนเดียว หรือ ไม่มีคนดูแลเมื่อเจ็บป่วย", margin + 10, y);
  y += 6;

  // เส้นคั่นระหว่างข้อ 1 และ 2
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // 1.2 สิ่งแวดล้อมที่อยู่อาศัย
  const houseSafety = record.house_safety || "";
  const isSafe = houseSafety === "safe";
  const isUnsafe = houseSafety === "unsafe";

  doc.text("   2. ลักษณะที่อยู่อาศัย", margin, y);
  y += 5;

  drawCheckbox(doc, margin + 5, y - 3, checkboxSize, isSafe);
  doc.text("มั่นคงแข็งแรง หรือ ไม่มั่นคงแต่ไม่มีผลต่อความปลอดภัยในชีวิตและสุขภาพ", margin + 10, y);
  y += 5;

  drawCheckbox(doc, margin + 5, y - 3, checkboxSize, isUnsafe);
  doc.text("ไม่มีที่อยู่อาศัย หรือ มีที่อยู่อาศัยแต่ไม่ปลอดภัยต่อชีวิตและสุขภาพ", margin + 10, y);
  y += 6;

  // เส้นคั่นระหว่างข้อ 2 และ 3
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // 1.3 ความเพียงพอของรายได้
  const incomeSufficiency = record.income_sufficiency || "";
  const isEnough = incomeSufficiency === "enough";
  const isNotEnough = incomeSufficiency === "notEnough";

  doc.text("   3. ความเพียงพอของรายได้ในการดำเนินชีวิตประจำวัน", margin, y);
  y += 5;

  drawCheckbox(doc, margin + 5, y - 3, checkboxSize, isEnough);
  doc.text("เพียงพอ", margin + 10, y);
  y += 5;

  drawCheckbox(doc, margin + 5, y - 3, checkboxSize, isNotEnough);
  doc.text("ไม่เพียงพอ", margin + 10, y);
  y += 8;

  // Footer - วันที่
  const footerY = 285;
  doc.setFontSize(12);
  doc.text(`วันที่พิมพ์: ${formatThaiDateShort(new Date())}`, margin, footerY);
  doc.text(`ข้อมูล ณ วันที่: ${formatThaiDateShort(record.updated_at)}`, pageWidth - margin, footerY, { align: "right" });

  // Save PDF
  const fileName = `health_record_${record.id_card || record.id || "unknown"}_${Date.now()}.pdf`;
  doc.save(fileName);
};

export default {
  exportHealthRecordToPDF,
};
