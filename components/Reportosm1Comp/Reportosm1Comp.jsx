import React, { useState } from "react";
import { FileDown, Save, Printer } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

const Reportosm1Comp = () => {
  const [reportData, setReportData] = useState({
    month: "ธันวาคม",
    year: "2569",
    name: "",

    // 1. การส่งเสริมสุขภาพ
    pregnant_visit_new: 0,
    pregnant_under_15: 0,
    pregnant_iodine: 0,
    postpartum_visit: 0,
    mother_no_breastfeed_6m: 0,
    postpartum_iodine: 0,
    elderly_visit: 4,
    elderly_abandoned: 0,
    elderly_screening_9: 4,
    elderly_care_network: 4,
    disabled_visit: 1,

    // 2. การเฝ้าระวัง ป้องกัน และควบคุมโรค
    dengue_prevention: 10,
    flu_prevention: 10,
    ncd_screening: 0,
    iodine_advice: 10,
    reduce_sweet_salty: 10,
    survey_607_app: 0,

    // 3. การฟื้นฟูสุขภาพ
    patient_visit: 4,

    // 4. การคุ้มครองผู้บริโภค
    food_safety: 1,

    // 5. การจัดการสุขภาพชุมชนและการมีส่วนร่วม
    volunteer_activity: 1,
    health_plan: 1,

    // 6. การสนับสนุน อสค.
    bedridden_elderly: 0,
    chronic_disease_patient: 4,
    kidney_patient: 0,

    // 7. การใช้ยาอย่างสมเหตุสมผล
    medicine_knowledge: 10,
    product_surveillance: 0,

    // 8. การเข้าร่วมทีมหมอครอบครัว
    family_doctor_team: 0,
    home_improvement: 0,
    patient_support: 10,

    // 9. กิจกรรมอื่นๆ
    quit_smoking: 1,
    quit_smoking_detail: "",
    drug_rehab_followup: 0,
  });

  const handleInputChange = (field, value) => {
    setReportData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(14);
    doc.text("แบบรายงานผลการปฏิบัติงานของ อสม. ปีงบประมาณ 2569", 105, 15, { align: "center" });
    doc.setFontSize(12);
    doc.text(`ประจำเดือน ${reportData.month}`, 105, 22, { align: "center" });
    doc.text(`${reportData.name || 'นาย/นาง...'}`, 105, 28, { align: "center" });

    // Prepare all table data
    const tableData = [
      ["1.", "การส่งเสริมสุขภาพ", "", ""],
      ["1.1", "อสม. เยี่ยมให้คำแนะนำหญิงตั้งครรภ์ (รายใหม่)", "คน", reportData.pregnant_visit_new],
      ["", "- อสม. ค้นหาหญิงตั้งครรภ์อายุต่ำกว่า 15 ปี (รายใหม่)", "คน", reportData.pregnant_under_15],
      ["", "- อสม. คิดตามหญิงตั้งครรภ์ให้ได้รับยาเม็ดเสริมไอโอดีน", "คน", reportData.pregnant_iodine],
      ["1.2", "อสม.บริการเยี่ยมให้คำแนะนำหญิงหลังคลอด (รายใหม่)", "คน", reportData.postpartum_visit],
      ["", "- มารดาที่ไม่สามารถเลี้ยงดูบุตรด้วยนมแม่อย่างเดียวครบ 6 เดือน", "คน", reportData.mother_no_breastfeed_6m],
      ["", "- อสม. ติดตามหญิงหลังคลอดในนมบุตร 6 เดือน ให้ได้รับยาเม็ดเสริมไอโอดีน", "คน", reportData.postpartum_iodine],
      ["1.3", "อสม.เยี่ยมบ้านและให้คำแนะนำผู้สูงอายุด้านการดูแลสุขภาพ", "คน", reportData.elderly_visit],
      ["", "- ผู้สูงอายุที่เป็นโรคเรื้อรังและถูกทอดทิ้งอยู่เพียงลำพัง", "คน", reportData.elderly_abandoned],
      ["", "- คัดกรอง ประเมินภาวะสุขภาพผู้สูงอายุ (ภาวะถดถอย 9 ด้าน)", "คน", reportData.elderly_screening_9],
      ["", "- สร้างความรอบรู้ ให้บริการดูแลสุขภาพผู้สูงอายุ", "คน", reportData.elderly_care_network],
      ["1.4", "อสม.เยี่ยมบ้านและให้คำแนะนำผู้พิการด้านการดูแลสุขภาพ", "คน", reportData.disabled_visit],

      ["2.", "การเฝ้าระวัง ป้องกัน และควบคุมโรค", "", ""],
      ["2.1", "เฝ้าระวัง ป้องกัน ควบคุมโรคไข้เลือดออก", "ครัวเรือน", reportData.dengue_prevention],
      ["2.2", "เฝ้าระวัง ป้องกัน ควบคุมโรคไข้หวัดใหญ่", "ครัวเรือน", reportData.flu_prevention],
      ["2.3", "เฝ้าระวัง คัดกรอง ให้คำแนะนำกลุ่มเสี่ยงโรค NCDs", "คน", reportData.ncd_screening],
      ["2.4", "ให้คำแนะนำบริโภคผลิตภัณฑ์/อาหาร/เกลือที่ผสมไอโอดีน", "ครัวเรือน", reportData.iodine_advice],
      ["2.5", "ให้คำแนะนำประชาชนลดกิน หวาน อาหารมันและเค็ม", "ครัวเรือน", reportData.reduce_sweet_salty],
      ["2.6", "สำรวจป้องกันโรคในกลุ่มเป้าหมาย 607", "คน", reportData.survey_607_app],

      ["3.", "การฟื้นฟูสุขภาพ", "", ""],
      ["3.1", "เยี่ยมบ้าน ให้คำแนะนำการดูแลผู้ป่วยโรคเรื้อรัง", "ครั้ง", reportData.patient_visit],

      ["4.", "การคุ้มครองผู้บริโภค", "", ""],
      ["4.1", "เฝ้าระวังและให้คำแนะนำการบริโภคอาหารปลอดภัย", "ครั้ง", reportData.food_safety],

      ["5.", "การจัดการสุขภาพชุมชนและการมีส่วนร่วม", "", ""],
      ["5.1", "อสม.ร่วมกิจกรรมจิตอาสากับเครือข่ายอื่น", "ครั้ง", reportData.volunteer_activity],
      ["5.2", "จัดทำแผนสุขภาพ จัดกิจกรรม และประเมินผล", "ครั้ง", reportData.health_plan],

      ["6.", "การสนับสนุน อสค.", "", ""],
      ["", "(1) กลุ่มผู้สูงอายุติดบ้านติดเตียง", "คน", reportData.bedridden_elderly],
      ["", "(2) กลุ่มผู้ป่วยโรคไม่ติดต่อเรื้อรัง", "คน", reportData.chronic_disease_patient],
      ["", "(3) กลุ่มผู้ป่วยที่มีปัญหาโรคไต", "คน", reportData.kidney_patient],

      ["7.", "การใช้ยาอย่างสมเหตุสมผล", "", ""],
      ["", "(1) ให้ความรู้การใช้ยาปฏิชีวนะและสมุนไพร", "ครอบครัว", reportData.medicine_knowledge],
      ["", "(2) เฝ้าระวังและสำรวจร้านชำปลอดยาปฏิชีวนะ", "ครั้ง", reportData.product_surveillance],

      ["8.", "การเข้าร่วมทีมหมอครอบครัว", "", ""],
      ["", "ร่วมทีมหมอครอบครัว", "ครั้ง", reportData.family_doctor_team],
      ["", "(1) ช่วยปรับปรุงที่อยู่อาศัย", "ครอบครัว", reportData.home_improvement],
      ["", "(2) เสริมพลังและกำลังใจ", "ครอบครัว", reportData.patient_support],

      ["9.", "กิจกรรมอื่นๆ", "", ""],
      ["9.1", "ชวนคนเลิกบุหรี่", "คน", reportData.quit_smoking],
      ["9.2", "ติดตามผู้ผ่านการบำบัดยาเสพติด", "คน", reportData.drug_rehab_followup],
    ];

    doc.autoTable({
      startY: 35,
      head: [["ลำดับ", "กิจกรรมการปฏิบัติงาน", "หน่วยนับ", "ผลงาน"]],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 2,
        font: 'helvetica'
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 120 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20, halign: 'center' }
      }
    });

    doc.save(`รายงาน-อสม-${reportData.month}-${reportData.year}.pdf`);
  };

  const handleSave = () => {
    alert("บันทึกข้อมูลสำเร็จ");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Save className="w-6 h-6" />
            แบบรายงานผลการปฏิบัติงานของ อสม. ปีงบประมาณ 2569
          </h1>
        </div>

        <div className="p-6">
          {/* Header Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประจำเดือน
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={reportData.month}
                onChange={(e) => handleInputChange("month", e.target.value)}
              >
                <option>มกราคม</option>
                <option>กุมภาพันธ์</option>
                <option>มีนาคม</option>
                <option>เมษายน</option>
                <option>พฤษภาคม</option>
                <option>มิถุนายน</option>
                <option>กรกฎาคม</option>
                <option>สิงหาคม</option>
                <option>กันยายน</option>
                <option>ตุลาคม</option>
                <option>พฤศจิกายน</option>
                <option>ธันวาคม</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ปีงบประมาณ
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={reportData.year}
                onChange={(e) => handleInputChange("year", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อ-นามสกุล อสม.
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="นาย/นาง ชื่อ นามสกุล"
                value={reportData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>
          </div>

          {/* Main Form Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left w-20">ลำดับ</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">กิจกรรมการปฏิบัติงาน</th>
                  <th className="border border-gray-300 px-4 py-2 text-left w-32">หน่วยนับ</th>
                  <th className="border border-gray-300 px-4 py-2 text-left w-32">ผลงาน</th>
                </tr>
              </thead>
              <tbody>
                {/* 1. การส่งเสริมสุขภาพ */}
                <tr className="bg-blue-50">
                  <td className="border border-gray-300 px-4 py-2 font-bold">1.</td>
                  <td className="border border-gray-300 px-4 py-2 font-bold" colSpan={3}>
                    การส่งเสริมสุขภาพ
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">1.1</td>
                  <td className="border border-gray-300 px-4 py-2">
                    อสม. เยี่ยมให้คำแนะนำหญิงตั้งครรภ์ (รายใหม่)
                  </td>
                  <td className="border border-gray-300 px-4 py-2">คน</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.pregnant_visit_new}
                      onChange={(e) => handleInputChange("pregnant_visit_new", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2"></td>
                  <td className="border border-gray-300 px-4 py-2 pl-8">
                    - อสม. ค้นหาหญิงตั้งครรภ์อายุต่ำกว่า 15 ปี (รายใหม่)
                  </td>
                  <td className="border border-gray-300 px-4 py-2">คน</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.pregnant_under_15}
                      onChange={(e) => handleInputChange("pregnant_under_15", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2"></td>
                  <td className="border border-gray-300 px-4 py-2 pl-8">
                    - อสม. คิดตามหญิงตั้งครรภ์ให้ได้รับยาเม็ดเสริมไอโอดีน
                  </td>
                  <td className="border border-gray-300 px-4 py-2">คน</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.pregnant_iodine}
                      onChange={(e) => handleInputChange("pregnant_iodine", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">1.2</td>
                  <td className="border border-gray-300 px-4 py-2">
                    อสม.บริการเยี่ยมให้คำแนะนำหญิงหลังคลอด (รายใหม่)
                  </td>
                  <td className="border border-gray-300 px-4 py-2">คน</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.postpartum_visit}
                      onChange={(e) => handleInputChange("postpartum_visit", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2"></td>
                  <td className="border border-gray-300 px-4 py-2 pl-8">
                    - มารดาที่ไม่สามารถเลี้ยงดูบุตรด้วยนมแม่อย่างเดียวครบ 6 เดือน (รายใหม่)
                  </td>
                  <td className="border border-gray-300 px-4 py-2">คน</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.mother_no_breastfeed_6m}
                      onChange={(e) => handleInputChange("mother_no_breastfeed_6m", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2"></td>
                  <td className="border border-gray-300 px-4 py-2 pl-8">
                    - อสม. ติดตามหญิงหลังคลอดในนมบุตร 6 เดือน ให้ได้รับยาเม็ดเสริมไอโอดีน
                  </td>
                  <td className="border border-gray-300 px-4 py-2">คน</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.postpartum_iodine}
                      onChange={(e) => handleInputChange("postpartum_iodine", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">1.3</td>
                  <td className="border border-gray-300 px-4 py-2">
                    อสม.เยี่ยมบ้านและให้คำแนะนำผู้สูงอายุด้านการดูแลสุขภาพ
                  </td>
                  <td className="border border-gray-300 px-4 py-2">คน</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.elderly_visit}
                      onChange={(e) => handleInputChange("elderly_visit", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2"></td>
                  <td className="border border-gray-300 px-4 py-2 pl-8">
                    - ผู้สูงอายุที่เป็นโรคเรื้อรังและถูกทอดทิ้งอยู่เพียงลำพัง (รายใหม่)
                  </td>
                  <td className="border border-gray-300 px-4 py-2">คน</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.elderly_abandoned}
                      onChange={(e) => handleInputChange("elderly_abandoned", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2"></td>
                  <td className="border border-gray-300 px-4 py-2 pl-8">
                    - คัดกรอง ประเมินภาวะสุขภาพผู้สูงอายุ (ภาวะถดถอย 9 ด้าน)
                  </td>
                  <td className="border border-gray-300 px-4 py-2">คน</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.elderly_screening_9}
                      onChange={(e) => handleInputChange("elderly_screening_9", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2"></td>
                  <td className="border border-gray-300 px-4 py-2 pl-8">
                    - สร้างความรอบรู้ และให้บริการดูแลสุขภาพตามสภาพปัญหาภาวะถดถอยในแต่ละด้านของผู้สูงอายุ และประสานภาคีเครือข่ายในการดูแลผู้สูงอายุให้มีชีวิตความเป็นอยู่ที่ดี
                  </td>
                  <td className="border border-gray-300 px-4 py-2">คน</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.elderly_care_network}
                      onChange={(e) => handleInputChange("elderly_care_network", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">1.4</td>
                  <td className="border border-gray-300 px-4 py-2">
                    อสม.เยี่ยมบ้านและให้คำแนะนำผู้พิการด้านการดูแลสุขภาพ
                  </td>
                  <td className="border border-gray-300 px-4 py-2">คน</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.disabled_visit}
                      onChange={(e) => handleInputChange("disabled_visit", e.target.value)}
                    />
                  </td>
                </tr>

                {/* 2. การเฝ้าระวัง ป้องกัน และควบคุมโรค */}
                <tr className="bg-blue-50">
                  <td className="border border-gray-300 px-4 py-2 font-bold">2.</td>
                  <td className="border border-gray-300 px-4 py-2 font-bold" colSpan={3}>
                    การเฝ้าระวัง ป้องกัน และควบคุมโรค
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">2.1</td>
                  <td className="border border-gray-300 px-4 py-2">
                    เฝ้าระวัง ป้องกัน ควบคุมโรคไข้เลือดออก (ปิด เปลี่ยน ปล่อย ปรับปรุง ปฏิบัติเป็นนิสัย)
                  </td>
                  <td className="border border-gray-300 px-4 py-2">ครัวเรือน</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.dengue_prevention}
                      onChange={(e) => handleInputChange("dengue_prevention", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">2.2</td>
                  <td className="border border-gray-300 px-4 py-2">
                    เฝ้าระวัง ป้องกัน ควบคุมโรคไข้หวัดใหญ่ (ปิด ล้าง เลี่ยง หยุด)
                  </td>
                  <td className="border border-gray-300 px-4 py-2">ครัวเรือน</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.flu_prevention}
                      onChange={(e) => handleInputChange("flu_prevention", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">2.3</td>
                  <td className="border border-gray-300 px-4 py-2">
                    เฝ้าระวัง คัดกรอง และให้คำแนะนำกลุ่มเสี่ยงโรค (โรคเบาหวาน โรคความดันโลหิตสูง โรคมะเร็ง โรคหัวใจ โรคหลอดเลือดสมอง)
                  </td>
                  <td className="border border-gray-300 px-4 py-2">คน</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.ncd_screening}
                      onChange={(e) => handleInputChange("ncd_screening", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">2.4</td>
                  <td className="border border-gray-300 px-4 py-2">
                    ให้คำแนะนำประชาชนบริโภคผลิตภัณฑ์/อาหาร/เกลือที่ผสมไอโอดีน
                  </td>
                  <td className="border border-gray-300 px-4 py-2">ครัวเรือน</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.iodine_advice}
                      onChange={(e) => handleInputChange("iodine_advice", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">2.5</td>
                  <td className="border border-gray-300 px-4 py-2">
                    ให้คำแนะนำประชาชนลดกิน หวาน อาหารมันและเค็ม
                  </td>
                  <td className="border border-gray-300 px-4 py-2">ครัวเรือน</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.reduce_sweet_salty}
                      onChange={(e) => handleInputChange("reduce_sweet_salty", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">2.6</td>
                  <td className="border border-gray-300 px-4 py-2">
                    สำรวจ เฝ้าระวัง ป้องกันโรคในกลุ่มเป้าหมาย 607 และปักหมุดแจ้งพิกัดกลุ่มเปราะบางในแอปพลิเคชันพันภัย
                  </td>
                  <td className="border border-gray-300 px-4 py-2">คน</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.survey_607_app}
                      onChange={(e) => handleInputChange("survey_607_app", e.target.value)}
                    />
                  </td>
                </tr>

                {/* 3. การฟื้นฟูสุขภาพ */}
                <tr className="bg-blue-50">
                  <td className="border border-gray-300 px-4 py-2 font-bold">3.</td>
                  <td className="border border-gray-300 px-4 py-2 font-bold" colSpan={3}>
                    การฟื้นฟูสุขภาพ
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">3.1</td>
                  <td className="border border-gray-300 px-4 py-2">
                    เยี่ยมบ้าน ให้คำแนะนำการดูแลผู้ป่วยโรคเบาหวาน ความดันโลหิต มะเร็ง หัวใจ ฯลฯ
                  </td>
                  <td className="border border-gray-300 px-4 py-2">ครั้ง</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.patient_visit}
                      onChange={(e) => handleInputChange("patient_visit", e.target.value)}
                    />
                  </td>
                </tr>

                {/* 4. การคุ้มครองผู้บริโภค */}
                <tr className="bg-blue-50">
                  <td className="border border-gray-300 px-4 py-2 font-bold">4.</td>
                  <td className="border border-gray-300 px-4 py-2 font-bold" colSpan={3}>
                    การคุ้มครองผู้บริโภค
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">4.1</td>
                  <td className="border border-gray-300 px-4 py-2">
                    เฝ้าระวังและให้คำแนะนำการบริโภคอาหารปลอดภัย
                  </td>
                  <td className="border border-gray-300 px-4 py-2">ครั้ง</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.food_safety}
                      onChange={(e) => handleInputChange("food_safety", e.target.value)}
                    />
                  </td>
                </tr>

                {/* 5. การจัดการสุขภาพชุมชน */}
                <tr className="bg-blue-50">
                  <td className="border border-gray-300 px-4 py-2 font-bold">5.</td>
                  <td className="border border-gray-300 px-4 py-2 font-bold" colSpan={3}>
                    การจัดการสุขภาพชุมชนและการมีส่วนร่วมในแผนสุขภาพตำบล
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">5.1</td>
                  <td className="border border-gray-300 px-4 py-2">
                    อสม.ร่วมกิจกรรมจิตอาสากับเครือข่ายอื่น
                  </td>
                  <td className="border border-gray-300 px-4 py-2">ครั้ง</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.volunteer_activity}
                      onChange={(e) => handleInputChange("volunteer_activity", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">5.2</td>
                  <td className="border border-gray-300 px-4 py-2">
                    จัดทำแผนสุขภาพ จัดหางบประมาณ จัดกิจกรรมสุขภาพ และประเมินผล
                  </td>
                  <td className="border border-gray-300 px-4 py-2">ครั้ง</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.health_plan}
                      onChange={(e) => handleInputChange("health_plan", e.target.value)}
                    />
                  </td>
                </tr>

                {/* 6. การสนับสนุน อสค. */}
                <tr className="bg-blue-50">
                  <td className="border border-gray-300 px-4 py-2 font-bold">6.</td>
                  <td className="border border-gray-300 px-4 py-2 font-bold" colSpan={3}>
                    การสนับสนุนอาสาสมัครประจำครอบครัว (อสค.)
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2"></td>
                  <td className="border border-gray-300 px-4 py-2 pl-4" colSpan={3}>
                    ติดตามให้คำแนะนำ อสค. ในการดูแล อาหาร/ออกกำลังกาย/วิธีปฏิบัติ การดูแล การพยาบาล / การส่งต่อผู้ป่วยในครัวเรือน
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2"></td>
                  <td className="border border-gray-300 px-4 py-2 pl-8">
                    (1) กลุ่มผู้สูงอายุ ที่มีปัญหา ติดบ้านติดเตียง
                  </td>
                  <td className="border border-gray-300 px-4 py-2">คน</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.bedridden_elderly}
                      onChange={(e) => handleInputChange("bedridden_elderly", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2"></td>
                  <td className="border border-gray-300 px-4 py-2 pl-8">
                    (2) กลุ่มผู้ป่วยโรคไม่ติดต่อเรื้อรัง
                  </td>
                  <td className="border border-gray-300 px-4 py-2">คน</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.chronic_disease_patient}
                      onChange={(e) => handleInputChange("chronic_disease_patient", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2"></td>
                  <td className="border border-gray-300 px-4 py-2 pl-8">
                    (3) กลุ่มผู้ป่วยที่มีปัญหาโรคไต
                  </td>
                  <td className="border border-gray-300 px-4 py-2">คน</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.kidney_patient}
                      onChange={(e) => handleInputChange("kidney_patient", e.target.value)}
                    />
                  </td>
                </tr>

                {/* 7. การใช้ยาอย่างสมเหตุสมผล */}
                <tr className="bg-blue-50">
                  <td className="border border-gray-300 px-4 py-2 font-bold">7.</td>
                  <td className="border border-gray-300 px-4 py-2 font-bold" colSpan={3}>
                    การใช้ยาอย่างสมเหตุสมผล / การบริโภคผลิตภัณฑ์สุขภาพ
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2"></td>
                  <td className="border border-gray-300 px-4 py-2 pl-4">
                    (1) ให้ความรู้พื้นฐานการใช้ยาปฏิชีวนะ หรือข้อควรระวังการซื้อยากินเองสำหรับโรคหวัด/ท้องเสีย และการใช้สมุนไพรที่เสี่ยงต่อการผสมสาร สเตียรอยด์
                  </td>
                  <td className="border border-gray-300 px-4 py-2">ครอบครัว</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.medicine_knowledge}
                      onChange={(e) => handleInputChange("medicine_knowledge", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2"></td>
                  <td className="border border-gray-300 px-4 py-2 pl-4">
                    (2) เฝ้าระวังและให้คำแนะนำการบริโภคผลิตภัณฑ์สุขภาพ และร่วมสำรวจร้านชำในชุมชน เพื่อปลอดยาปฏิชีวนะ ยาชุด
                  </td>
                  <td className="border border-gray-300 px-4 py-2">ครั้ง</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.product_surveillance}
                      onChange={(e) => handleInputChange("product_surveillance", e.target.value)}
                    />
                  </td>
                </tr>

                {/* 8. การเข้าร่วมทีมหมอครอบครัว */}
                <tr className="bg-blue-50">
                  <td className="border border-gray-300 px-4 py-2 font-bold">8.</td>
                  <td className="border border-gray-300 px-4 py-2 font-bold" colSpan={3}>
                    การเข้าร่วมกับทีมหมอครอบครัว
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2"></td>
                  <td className="border border-gray-300 px-4 py-2 pl-4">
                    ร่วมเป็นทีมหมอครอบครัว ในการช่วยเหลือ ดูแลผู้ป่วย และครอบครัวในชุมชน
                  </td>
                  <td className="border border-gray-300 px-4 py-2">ครั้ง</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.family_doctor_team}
                      onChange={(e) => handleInputChange("family_doctor_team", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2"></td>
                  <td className="border border-gray-300 px-4 py-2 pl-4 font-medium" colSpan={3}>
                    กรณีเข้าร่วมทีมหมอครอบครัว อสม. ให้ความช่วยเหลือในเรื่องใด/กี่ครอบครัว
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2"></td>
                  <td className="border border-gray-300 px-4 py-2 pl-8">
                    (1) ช่วยปรับปรุงที่อยู่อาศัย และสิ่งแวดล้อมให้เอื้อต่อการดูแล การพยาบาล
                  </td>
                  <td className="border border-gray-300 px-4 py-2">ครอบครัว</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.home_improvement}
                      onChange={(e) => handleInputChange("home_improvement", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2"></td>
                  <td className="border border-gray-300 px-4 py-2 pl-8">
                    (2) เสริมพลังและกำลังใจ และเทคนิคการดูแล การพยาบาลตามปัญหาสุขภาพ ทำให้ผู้ป่วยมีกำลังใจในการดำรงชีวิต
                  </td>
                  <td className="border border-gray-300 px-4 py-2">ครอบครัว</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.patient_support}
                      onChange={(e) => handleInputChange("patient_support", e.target.value)}
                    />
                  </td>
                </tr>

                {/* 9. กิจกรรมอื่นๆ */}
                <tr className="bg-blue-50">
                  <td className="border border-gray-300 px-4 py-2 font-bold">9.</td>
                  <td className="border border-gray-300 px-4 py-2 font-bold" colSpan={3}>
                    กิจกรรมอื่นๆ
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">9.1</td>
                  <td className="border border-gray-300 px-4 py-2">
                    ชวนคนเลิกบุหรี่
                  </td>
                  <td className="border border-gray-300 px-4 py-2">คน</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.quit_smoking}
                      onChange={(e) => handleInputChange("quit_smoking", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2"></td>
                  <td className="border border-gray-300 px-4 py-2 pl-8" colSpan={3}>
                    <input
                      type="text"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      placeholder="รายละเอียด เช่น เบอร์โทรศัพท์ ที่อยู่ : สถานะ"
                      value={reportData.quit_smoking_detail}
                      onChange={(e) => handleInputChange("quit_smoking_detail", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">9.2</td>
                  <td className="border border-gray-300 px-4 py-2">
                    ร่วมกับเจ้าหน้าที่ในการติดตามผู้ผ่านการบำบัดยาเสพติดในระบบสมัครใจบำบัด โดยการสร้างกระบวนการมีส่วนร่วมของคนในชุมชน
                  </td>
                  <td className="border border-gray-300 px-4 py-2">คน</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={reportData.drug_rehab_followup}
                      onChange={(e) => handleInputChange("drug_rehab_followup", e.target.value)}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3 justify-end">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="w-5 h-5" />
              บันทึกข้อมูล
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <FileDown className="w-5 h-5" />
              Export PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Printer className="w-5 h-5" />
              พิมพ์
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default Reportosm1Comp;
