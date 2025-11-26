import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Download } from "lucide-react";
import jsPDF from "jspdf";
import { font as SarabunFont } from "../../../styles/Sarabun-Regular-normal";
import { fontbold as SarabunBoldFont } from "../../../styles/Sarabun-Regular-bold";

// Mock data สำหรับตารางรายละเอียด อสม.1
const mockDetailData = [
  // 1. การส่งเสริมสุขภาพ
  { no: "1", activity: "การส่งเสริมสุขภาพ", unit: "", result: "", isMainCategory: true },
  { no: "1.1", activity: "อสม. เยี่ยมให้คำแนะนำหญิงตั้งครรภ์ (รายใหม่)", unit: "คน", result: 12 },
  { no: "", activity: "- อสม. ค้นหาหญิงตั้งครรภ์อายุต่ำกว่า 15 ปี (รายใหม่)", unit: "คน", result: 2 },
  { no: "", activity: "- อสม. ค้นหาหญิงตั้งครรภ์อายุ 15-19 ปี (รายใหม่)", unit: "คน", result: 3 },
  { no: "1.2", activity: "อสม. เยี่ยมให้คำแนะนำหญิงหลังคลอด", unit: "คน", result: 8 },
  { no: "1.3", activity: "อสม. ติดตามเด็กแรกเกิด - 5 ปี", unit: "คน", result: 25 },
  { no: "1.4", activity: "อสม. ให้บริการวางแผนครอบครัว", unit: "คน", result: 15 },

  // 2. การป้องกันโรคและควบคุมโรค
  { no: "2", activity: "การป้องกันโรคและควบคุมโรค", unit: "", result: "", isMainCategory: true },
  { no: "2.1", activity: "อสม. ค้นหาผู้ป่วยเบาหวาน (รายใหม่)", unit: "คน", result: 5 },
  { no: "2.2", activity: "อสม. ค้นหาผู้ป่วยความดันโลหิตสูง (รายใหม่)", unit: "คน", result: 7 },
  { no: "2.3", activity: "อสม. เยี่ยมผู้ป่วยเบาหวาน", unit: "คน", result: 18 },
  { no: "2.4", activity: "อสม. เยี่ยมผู้ป่วยความดันโลหิตสูง", unit: "คน", result: 22 },
  { no: "2.5", activity: "อสม. ตรวจคัดกรองวัณโรค", unit: "คน", result: 10 },

  // 3. การดูแลผู้สูงอายุ
  { no: "3", activity: "การดูแลผู้สูงอายุ", unit: "", result: "", isMainCategory: true },
  { no: "3.1", activity: "อสม. เยี่ยมผู้สูงอายุติดบ้าน/ติดเตียง", unit: "คน", result: 15 },
  { no: "3.2", activity: "อสม. ประเมินภาวะสุขภาพผู้สูงอายุ", unit: "คน", result: 35 },
  { no: "3.3", activity: "อสม. ดูแลผู้สูงอายุที่มีภาวะพึ่งพิง", unit: "คน", result: 8 },

  // 4. การส่งเสริมสุขภาพจิตและป้องกันปัญหาสุขภาพจิต
  { no: "4", activity: "การส่งเสริมสุขภาพจิตและป้องกันปัญหาสุขภาพจิต", unit: "", result: "", isMainCategory: true },
  { no: "4.1", activity: "อสม. คัดกรองภาวะซึมเศร้า", unit: "คน", result: 20 },
  { no: "4.2", activity: "อสม. เยี่ยมผู้ป่วยจิตเวช/ผู้พิการทางจิต", unit: "คน", result: 6 },

  // 5. การดูแลผู้ป่วยระยะกลาง-ระยะยาว
  { no: "5", activity: "การดูแลผู้ป่วยระยะกลาง-ระยะยาว (LTC)", unit: "", result: "", isMainCategory: true },
  { no: "5.1", activity: "อสม. เยี่ยมผู้ป่วยติดเตียง", unit: "คน", result: 12 },
  { no: "5.2", activity: "อสม. ดูแลผู้ป่วยประคับประคอง (Palliative Care)", unit: "คน", result: 3 },

  // 6. การพัฒนาศักยภาพชุมชน
  { no: "6", activity: "การพัฒนาศักยภาพชุมชน", unit: "", result: "", isMainCategory: true },
  { no: "6.1", activity: "อสม. จัดกิจกรรมส่งเสริมสุขภาพในชุมชน", unit: "ครั้ง", result: 4 },
  { no: "6.2", activity: "อสม. เข้าร่วมประชุมประจำเดือน", unit: "ครั้ง", result: 1 },
  { no: "6.3", activity: "อสม. รับการอบรม/พัฒนาศักยภาพ", unit: "ครั้ง", result: 2 },
];

const Reportosm1CompDetailComp = ({ reportData }) => {
  const router = useRouter();
  const tableRef = useRef(null);

  // ถ้าไม่มีข้อมูล ให้ใช้ค่า default
  const year = reportData?.year || "2568";
  const month = reportData?.month || "มิถุนายน";
  const name = reportData?.name || "นางสาวชบุษบก ผดุงจิตร";

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF('portrait', 'mm', 'a4');

      // เพิ่ม Thai font
      doc.addFileToVFS("Sarabun-Regular.ttf", SarabunFont);
      doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
      doc.addFileToVFS("Sarabun-Bold.ttf", SarabunBoldFont);
      doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
      doc.setFont("Sarabun");

      // Header - Title
      doc.setFontSize(14);
      doc.setFont("Sarabun", "normal");
      doc.text("แบบรายงานการปฏิบัติงานของ อสม.", 105, 15, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("Sarabun", "normal");
      doc.text(`ประจำเดือน ${month} พ.ศ. ${year}`, 105, 22, { align: "center" });

      doc.setFontSize(12);
      doc.text(`ชื่อ-นามสกุล: ${name}`, 105, 28, { align: "center" });

      // Table settings
      const margin = 10;
      const startX = margin;
      let startY = 35;
      const rowHeight = 8;

      // กำหนดความกว้างของแต่ละคอลัมน์
      const colWidths = {
        no: 15,
        activity: 130,
        unit: 25,
        result: 20,
      };

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);

      // วาดตาราง Header
      doc.setFont("Sarabun", "normal");
      doc.setFontSize(11);

      let currentX = startX;

      // ลำดับ
      doc.rect(currentX, startY, colWidths.no, rowHeight);
      doc.text("ลำดับ", currentX + colWidths.no / 2, startY + 5, { align: "center" });
      currentX += colWidths.no;

      // กิจกรรมการปฏิบัติงาน
      doc.rect(currentX, startY, colWidths.activity, rowHeight);
      doc.text("กิจกรรมการปฏิบัติงาน", currentX + colWidths.activity / 2, startY + 5, { align: "center" });
      currentX += colWidths.activity;

      // หน่วยนับ
      doc.rect(currentX, startY, colWidths.unit, rowHeight);
      doc.text("หน่วยนับ", currentX + colWidths.unit / 2, startY + 5, { align: "center" });
      currentX += colWidths.unit;

      // ผลงาน
      doc.rect(currentX, startY, colWidths.result, rowHeight);
      doc.text("ผลงาน", currentX + colWidths.result / 2, startY + 5, { align: "center" });

      // วาดข้อมูลในตาราง
      doc.setFont("Sarabun", "normal");
      doc.setFontSize(11);

      let currentY = startY + rowHeight;
      const maxRowsPerPage = 30;
      let rowCount = 0;

      mockDetailData.forEach((row) => {
        // ถ้าเต็มหน้าให้สร้างหน้าใหม่
        if (rowCount >= maxRowsPerPage) {
          doc.addPage();
          currentY = 10;
          rowCount = 0;

          // วาด header ใหม่
          doc.setFont("Sarabun", "normal");
          doc.setFontSize(11);

          let headerX = startX;
          doc.rect(headerX, currentY, colWidths.no, rowHeight);
          doc.text("ลำดับ", headerX + colWidths.no / 2, currentY + 5, { align: "center" });
          headerX += colWidths.no;

          doc.rect(headerX, currentY, colWidths.activity, rowHeight);
          doc.text("กิจกรรมการปฏิบัติงาน", headerX + colWidths.activity / 2, currentY + 5, { align: "center" });
          headerX += colWidths.activity;

          doc.rect(headerX, currentY, colWidths.unit, rowHeight);
          doc.text("หน่วยนับ", headerX + colWidths.unit / 2, currentY + 5, { align: "center" });
          headerX += colWidths.unit;

          doc.rect(headerX, currentY, colWidths.result, rowHeight);
          doc.text("ผลงาน", headerX + colWidths.result / 2, currentY + 5, { align: "center" });

          currentY += rowHeight;
          doc.setFont("Sarabun", "normal");
          doc.setFontSize(11);
        }

        let dataX = startX;

        // ใช้ font size เท่ากันหมด
        doc.setFont("Sarabun", "normal");
        doc.setFontSize(11);

        // ลำดับ
        doc.rect(dataX, currentY, colWidths.no, rowHeight);
        if (row.no) {
          doc.text(row.no, dataX + colWidths.no / 2, currentY + 5, { align: "center" });
        }
        dataX += colWidths.no;

        // กิจกรรม
        doc.rect(dataX, currentY, colWidths.activity, rowHeight);
        const actParts = doc.splitTextToSize(row.activity, colWidths.activity - 3);
        doc.text(actParts[0], dataX + 2, currentY + 5);
        dataX += colWidths.activity;

        // หน่วยนับ
        doc.rect(dataX, currentY, colWidths.unit, rowHeight);
        if (row.unit) {
          doc.text(row.unit, dataX + colWidths.unit / 2, currentY + 5, { align: "center" });
        }
        dataX += colWidths.unit;

        // ผลงาน
        doc.rect(dataX, currentY, colWidths.result, rowHeight);
        if (row.result !== "" && row.result !== undefined) {
          doc.text(String(row.result), dataX + colWidths.result / 2, currentY + 5, { align: "center" });
        }

        currentY += rowHeight;
        rowCount++;
      });

      // บันทึกไฟล์
      doc.save(`รายงาน_อสม1_${month}_${year}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("เกิดข้อผิดพลาดในการสร้าง PDF");
    }
  };

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Header Section with Gradient */}
      <div className="relative mb-8 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7e32e2] via-[#9333ea] to-[#a855f7]" />
        <div className="absolute inset-0 bg-white/5" />

        <div className="relative p-6 sm:p-8">
          <div className="text-white">
            <button
              onClick={() => router.push("/report-osm1/data")}
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
                  รายละเอียดรายงาน อสม.1
                </h1>
                <p className="text-white/80 text-sm mt-1">
                  แบบรายงานการปฏิบัติงานของ อสม. ประจำเดือน
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table PDF-style */}
      <div ref={tableRef} className="bg-white shadow-lg border border-gray-300 overflow-hidden rounded-lg">
        {/* Header with Report Info and Export Button */}
        <div className="flex items-start justify-between p-6 border-b border-gray-300">
          {/* Report Info - Center aligned */}
          <div className="flex-1 text-center">
            <h2 className="font-bold text-black text-xl mb-2">
              แบบรายงานการปฏิบัติงานของ อสม.
            </h2>
            <p className="text-black font-medium text-base mb-1">
              ประจำเดือน {month} พ.ศ. {year}
            </p>
            <p className="text-black font-medium text-base">ชื่อ-นามสกุล: {name}</p>
          </div>

          {/* Export Button - Right top */}
          <button
            onClick={handleExportPDF}
            className="export-button flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#7e32e2] to-[#9333ea] text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 text-base"
          >
            <Download size={20} />
            Export PDF
          </button>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-white">
                <th className="border border-black py-3 px-3 font-bold text-center text-black w-[100px]">
                  ลำดับ
                </th>
                <th className="border border-black py-3 px-3 font-bold text-center text-black">
                  กิจกรรมการปฏิบัติงาน
                </th>
                <th className="border border-black py-3 px-3 font-bold text-center text-black w-[120px]">
                  หน่วยนับ
                </th>
                <th className="border border-black py-3 px-3 font-bold text-center text-black w-[100px]">
                  ผลงาน
                </th>
              </tr>
            </thead>
            <tbody>
              {mockDetailData.map((row, idx) => (
                <tr
                  key={idx}
                  className="bg-white hover:bg-gray-50 transition-colors"
                >
                  <td className={`border border-black py-2 px-3 text-center ${
                    row.isMainCategory ? "font-bold" : "font-semibold"
                  } text-black`}>
                    {row.no}
                  </td>
                  <td className={`border border-black py-2 px-3 ${
                    row.isMainCategory ? "font-bold" : ""
                  } text-black`}>
                    {row.activity}
                  </td>
                  <td className="border border-black py-2 px-3 text-center text-black">
                    {row.unit}
                  </td>
                  <td className="border border-black py-2 px-3 text-center text-black font-semibold">
                    {row.result !== "" && row.result !== undefined ? row.result : ""}
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

export default Reportosm1CompDetailComp;
