import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Download } from "lucide-react";
import jsPDF from "jspdf";
import { font as SarabunFont } from "../../../styles/Sarabun-Regular-normal";
import { fontbold as SarabunBoldFont } from "../../../styles/Sarabun-Regular-bold";

// Mock data สำหรับตารางรายละเอียด
const mockDetailData = Array.from({ length: 20 }, (_, i) => ({
  no: i + 1,
  week: `${(i % 4) + 1}`,
  house: `${100 + i}`,
  // ภาชนะนอกบ้าน
  outdoor_drinking_survey: Math.floor(Math.random() * 5),
  outdoor_drinking_found: Math.floor(Math.random() * 3),
  outdoor_usage_survey: Math.floor(Math.random() * 5),
  outdoor_usage_found: Math.floor(Math.random() * 3),
  outdoor_cement_survey: Math.floor(Math.random() * 5),
  outdoor_cement_found: Math.floor(Math.random() * 3),
  outdoor_pot_survey: Math.floor(Math.random() * 5),
  outdoor_pot_found: Math.floor(Math.random() * 3),
  outdoor_other_survey: Math.floor(Math.random() * 5),
  outdoor_other_found: Math.floor(Math.random() * 3),
  // ภาชนะในบ้าน
  indoor_drinking_survey: Math.floor(Math.random() * 5),
  indoor_drinking_found: Math.floor(Math.random() * 3),
  indoor_usage_survey: Math.floor(Math.random() * 5),
  indoor_usage_found: Math.floor(Math.random() * 3),
  indoor_cement_survey: Math.floor(Math.random() * 5),
  indoor_cement_found: Math.floor(Math.random() * 3),
  indoor_pot_survey: Math.floor(Math.random() * 5),
  indoor_pot_found: Math.floor(Math.random() * 3),
  indoor_other_survey: Math.floor(Math.random() * 5),
  indoor_other_found: Math.floor(Math.random() * 3),
  // ภาชนะอื่นๆ
  other_container: Math.floor(Math.random() * 10),
}));

const ReportMosquitoCompDetailComp = ({ reportData }) => {
  const router = useRouter();
  const tableRef = useRef(null);

  // ถ้าไม่มีข้อมูล ให้ใช้ค่า default
  const year = reportData?.year || "2568";
  const month = reportData?.month || "มิถุนายน";
  const week = reportData?.week || "สัปดาห์ที่ 1";
  const name = reportData?.name || "รายงานลูกน้ำยุงลาย บ้านเหนือ หมู่ 3 ต.ในเมือง อ.เมือง";

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF('portrait', 'mm', 'a4'); // เปลี่ยนเป็น portrait (แนวตั้ง)

      // เพิ่ม Thai font
      doc.addFileToVFS("Sarabun-Regular.ttf", SarabunFont);
      doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
      doc.addFileToVFS("Sarabun-Bold.ttf", SarabunBoldFont);
      doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
      doc.setFont("Sarabun");

      // Header - Title
      doc.setFontSize(11);
      doc.setFont("Sarabun", "bold");
      doc.text(`รายละเอียดการสำรวจลูกน้ำยุงลาย ปี ${year}`, 105, 10, { align: "center" });

      doc.setFontSize(8);
      doc.setFont("Sarabun", "normal");
      doc.text(`ประจำเดือน ${month} ${week}`, 105, 15, { align: "center" });

      const nameParts = doc.splitTextToSize(name, 180);
      let yPos = 19;
      nameParts.forEach((line) => {
        doc.text(line, 105, yPos, { align: "center" });
        yPos += 3.5;
      });

      // Table settings - แนวตั้ง A4 มีความกว้าง 210mm
      // ใช้พื้นที่ 200mm (เว้นข้างละ 5mm) เพื่อให้ตารางเต็มกระดาษ
      const margin = 5; // เว้นซ้าย-ขวาเท่ากัน

      const startX = margin;
      let startY = yPos + 2;
      const rowHeight = 5;

      // กำหนดความกว้างของแต่ละคอลัมน์ให้เต็มพื้นที่ 200mm
      const colWidths = {
        no: 10,       // ลำดับ
        week: 10,     // สัปดาห์
        house: 14,    // บ้านเลขที่
        data: 7.6     // คอลัมน์ข้อมูลแต่ละช่อง (สำรวจ/พบ) - 20 columns x 7.6 = 152mm
      };

      // คำนวณ: 10 + 10 + 14 + (7.6 * 20) + 11.4 = 197.4mm (พอดีกับ 200mm)

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.15);

      // วาดตาราง Header แถวที่ 1
      doc.setFont("Sarabun", "bold");
      doc.setFontSize(7);

      let currentX = startX;

      // ลำดับ
      doc.rect(currentX, startY, colWidths.no, rowHeight * 3);
      doc.text("ลำดับ", currentX + colWidths.no / 2, startY + 8, { align: "center" });
      currentX += colWidths.no;

      // สัปดาห์
      doc.rect(currentX, startY, colWidths.week, rowHeight * 3);
      doc.text("สัปดาห์", currentX + colWidths.week / 2, startY + 8, { align: "center" });
      currentX += colWidths.week;

      // บ้านเลขที่
      doc.rect(currentX, startY, colWidths.house, rowHeight * 3);
      doc.text("บ้านเลขที่", currentX + colWidths.house / 2, startY + 8, { align: "center" });
      currentX += colWidths.house;

      // ภาชนะนอกบ้าน
      const outdoorWidth = colWidths.data * 10;
      doc.rect(currentX, startY, outdoorWidth, rowHeight);
      doc.setFontSize(6.5);
      doc.text("จำนวนภาชนะนอกบ้าน (สำรวจ/พบลูกน้ำ)", currentX + outdoorWidth / 2, startY + 3, { align: "center" });

      // ภาชนะในบ้าน
      const indoorWidth = colWidths.data * 10;
      doc.rect(currentX + outdoorWidth, startY, indoorWidth, rowHeight);
      doc.text("จำนวนภาชนะภายในบ้าน (สำรวจ/พบลูกน้ำ)", currentX + outdoorWidth + indoorWidth / 2, startY + 3, { align: "center" });

      // ภาชนะอื่นๆ
      const otherWidth = colWidths.data * 1.5;
      doc.rect(currentX + outdoorWidth + indoorWidth, startY, otherWidth, rowHeight * 3);
      doc.setFontSize(6);
      doc.text("ภาชนะ", currentX + outdoorWidth + indoorWidth + otherWidth / 2, startY + 7, { align: "center" });
      doc.text("อื่น ๆ", currentX + outdoorWidth + indoorWidth + otherWidth / 2, startY + 9.5, { align: "center" });

      // แถวที่ 2: ประเภทภาชนะ
      doc.setFontSize(5.5);
      const containerTypes = ["โอ่งน้ำดื่ม", "โอ่งน้ำใช้", "บ่อซีเมนต์ขนาดใหญ่", "ที่รองกระถาง", "ภาชนะอื่น ๆ"];

      let containerX = startX + colWidths.no + colWidths.week + colWidths.house;

      // ภาชนะนอกบ้าน
      containerTypes.forEach((type) => {
        doc.rect(containerX, startY + rowHeight, colWidths.data * 2, rowHeight);
        const typeParts = doc.splitTextToSize(type, colWidths.data * 2 - 0.5);
        let typeY = startY + rowHeight + 2.5;
        typeParts.forEach((part) => {
          doc.text(part, containerX + colWidths.data, typeY, { align: "center" });
          typeY += 1.8;
        });
        containerX += colWidths.data * 2;
      });

      // ภาชนะในบ้าน
      containerTypes.forEach((type) => {
        doc.rect(containerX, startY + rowHeight, colWidths.data * 2, rowHeight);
        const typeParts = doc.splitTextToSize(type, colWidths.data * 2 - 0.5);
        let typeY = startY + rowHeight + 2.5;
        typeParts.forEach((part) => {
          doc.text(part, containerX + colWidths.data, typeY, { align: "center" });
          typeY += 1.8;
        });
        containerX += colWidths.data * 2;
      });

      // แถวที่ 3: สำรวจ/พบ
      doc.setFontSize(5);
      let surveyX = startX + colWidths.no + colWidths.week + colWidths.house;

      // ภาชนะนอกบ้าน + ภาชนะในบ้าน (5 types x 2 sections)
      for (let i = 0; i < 10; i++) {
        doc.rect(surveyX, startY + rowHeight * 2, colWidths.data, rowHeight);
        doc.text("สำรวจ", surveyX + colWidths.data / 2, startY + rowHeight * 2 + 3, { align: "center" });
        surveyX += colWidths.data;

        doc.rect(surveyX, startY + rowHeight * 2, colWidths.data, rowHeight);
        doc.text("พบ", surveyX + colWidths.data / 2, startY + rowHeight * 2 + 3, { align: "center" });
        surveyX += colWidths.data;
      }

      // วาดข้อมูลในตาราง
      doc.setFont("Sarabun", "normal");
      doc.setFontSize(6);

      let currentY = startY + rowHeight * 3;
      const maxRowsPerPage = 23; // จำนวนแถวต่อหน้า (แนวตั้งใส่ได้มากกว่า)
      let rowCount = 0;

      mockDetailData.forEach((row) => {
        // ถ้าเต็มหน้าให้สร้างหน้าใหม่
        if (rowCount >= maxRowsPerPage) {
          doc.addPage();
          currentY = 10;
          rowCount = 0;

          // วาด header ใหม่แบบย่อ
          doc.setFont("Sarabun", "bold");
          doc.setFontSize(6.5);

          let headerX = startX;
          doc.rect(headerX, currentY, colWidths.no, rowHeight);
          doc.text("ลำดับ", headerX + colWidths.no / 2, currentY + 3.5, { align: "center" });
          headerX += colWidths.no;

          doc.rect(headerX, currentY, colWidths.week, rowHeight);
          doc.text("สัปดาห์", headerX + colWidths.week / 2, currentY + 3.5, { align: "center" });
          headerX += colWidths.week;

          doc.rect(headerX, currentY, colWidths.house, rowHeight);
          doc.text("บ้านเลขที่", headerX + colWidths.house / 2, currentY + 3.5, { align: "center" });
          headerX += colWidths.house;

          // header คอลัมน์ข้อมูล
          doc.setFontSize(5);
          const shortHeaders = ["ดื่ม", "ใช้", "ซีเมนต์", "กระถาง", "อื่นๆ"];

          // นอกบ้าน
          shortHeaders.forEach(() => {
            doc.rect(headerX, currentY, colWidths.data, rowHeight);
            doc.text("ส.", headerX + colWidths.data / 2, currentY + 2.5, { align: "center" });
            headerX += colWidths.data;
            doc.rect(headerX, currentY, colWidths.data, rowHeight);
            doc.text("พ.", headerX + colWidths.data / 2, currentY + 2.5, { align: "center" });
            headerX += colWidths.data;
          });

          // ในบ้าน
          shortHeaders.forEach(() => {
            doc.rect(headerX, currentY, colWidths.data, rowHeight);
            doc.text("ส.", headerX + colWidths.data / 2, currentY + 2.5, { align: "center" });
            headerX += colWidths.data;
            doc.rect(headerX, currentY, colWidths.data, rowHeight);
            doc.text("พ.", headerX + colWidths.data / 2, currentY + 2.5, { align: "center" });
            headerX += colWidths.data;
          });

          // อื่นๆ
          doc.rect(headerX, currentY, otherWidth, rowHeight);
          doc.text("อื่นๆ", headerX + otherWidth / 2, currentY + 3.5, { align: "center" });

          currentY += rowHeight;
          doc.setFont("Sarabun", "normal");
          doc.setFontSize(6);
        }

        let dataX = startX;

        // ลำดับ
        doc.rect(dataX, currentY, colWidths.no, rowHeight);
        doc.text(String(row.no), dataX + colWidths.no / 2, currentY + 3.5, { align: "center" });
        dataX += colWidths.no;

        // สัปดาห์
        doc.rect(dataX, currentY, colWidths.week, rowHeight);
        doc.text(row.week, dataX + colWidths.week / 2, currentY + 3.5, { align: "center" });
        dataX += colWidths.week;

        // บ้านเลขที่
        doc.rect(dataX, currentY, colWidths.house, rowHeight);
        doc.text(row.house, dataX + colWidths.house / 2, currentY + 3.5, { align: "center" });
        dataX += colWidths.house;

        // ข้อมูลภาชนะนอกบ้าน
        const outdoorData = [
          row.outdoor_drinking_survey, row.outdoor_drinking_found,
          row.outdoor_usage_survey, row.outdoor_usage_found,
          row.outdoor_cement_survey, row.outdoor_cement_found,
          row.outdoor_pot_survey, row.outdoor_pot_found,
          row.outdoor_other_survey, row.outdoor_other_found,
        ];

        // ข้อมูลภาชนะในบ้าน
        const indoorData = [
          row.indoor_drinking_survey, row.indoor_drinking_found,
          row.indoor_usage_survey, row.indoor_usage_found,
          row.indoor_cement_survey, row.indoor_cement_found,
          row.indoor_pot_survey, row.indoor_pot_found,
          row.indoor_other_survey, row.indoor_other_found,
        ];

        // วาดข้อมูลนอกบ้าน
        outdoorData.forEach((val) => {
          doc.rect(dataX, currentY, colWidths.data, rowHeight);
          doc.text(String(val), dataX + colWidths.data / 2, currentY + 3.5, { align: "center" });
          dataX += colWidths.data;
        });

        // วาดข้อมูลในบ้าน
        indoorData.forEach((val) => {
          doc.rect(dataX, currentY, colWidths.data, rowHeight);
          doc.text(String(val), dataX + colWidths.data / 2, currentY + 3.5, { align: "center" });
          dataX += colWidths.data;
        });

        // ภาชนะอื่นๆ
        doc.rect(dataX, currentY, otherWidth, rowHeight);
        doc.text(String(row.other_container), dataX + otherWidth / 2, currentY + 3.5, { align: "center" });

        currentY += rowHeight;
        rowCount++;
      });

      // แถวรวม
      doc.setFont("Sarabun", "bold");
      doc.setFontSize(7);
      let sumX = startX;

      // เช็คว่าต้องขึ้นหน้าใหม่หรือไม่
      if (currentY + rowHeight > 280) {
        doc.addPage();
        currentY = 10;
      }

      doc.rect(sumX, currentY, colWidths.no + colWidths.week + colWidths.house, rowHeight);
      doc.text("รวมทั้งหมด", sumX + (colWidths.no + colWidths.week + colWidths.house) / 2, currentY + 3.5, { align: "center" });
      sumX += colWidths.no + colWidths.week + colWidths.house;

      // คำนวณผลรวม
      const sums = {
        outdoor_drinking_survey: mockDetailData.reduce((sum, r) => sum + r.outdoor_drinking_survey, 0),
        outdoor_drinking_found: mockDetailData.reduce((sum, r) => sum + r.outdoor_drinking_found, 0),
        outdoor_usage_survey: mockDetailData.reduce((sum, r) => sum + r.outdoor_usage_survey, 0),
        outdoor_usage_found: mockDetailData.reduce((sum, r) => sum + r.outdoor_usage_found, 0),
        outdoor_cement_survey: mockDetailData.reduce((sum, r) => sum + r.outdoor_cement_survey, 0),
        outdoor_cement_found: mockDetailData.reduce((sum, r) => sum + r.outdoor_cement_found, 0),
        outdoor_pot_survey: mockDetailData.reduce((sum, r) => sum + r.outdoor_pot_survey, 0),
        outdoor_pot_found: mockDetailData.reduce((sum, r) => sum + r.outdoor_pot_found, 0),
        outdoor_other_survey: mockDetailData.reduce((sum, r) => sum + r.outdoor_other_survey, 0),
        outdoor_other_found: mockDetailData.reduce((sum, r) => sum + r.outdoor_other_found, 0),
        indoor_drinking_survey: mockDetailData.reduce((sum, r) => sum + r.indoor_drinking_survey, 0),
        indoor_drinking_found: mockDetailData.reduce((sum, r) => sum + r.indoor_drinking_found, 0),
        indoor_usage_survey: mockDetailData.reduce((sum, r) => sum + r.indoor_usage_survey, 0),
        indoor_usage_found: mockDetailData.reduce((sum, r) => sum + r.indoor_usage_found, 0),
        indoor_cement_survey: mockDetailData.reduce((sum, r) => sum + r.indoor_cement_survey, 0),
        indoor_cement_found: mockDetailData.reduce((sum, r) => sum + r.indoor_cement_found, 0),
        indoor_pot_survey: mockDetailData.reduce((sum, r) => sum + r.indoor_pot_survey, 0),
        indoor_pot_found: mockDetailData.reduce((sum, r) => sum + r.indoor_pot_found, 0),
        indoor_other_survey: mockDetailData.reduce((sum, r) => sum + r.indoor_other_survey, 0),
        indoor_other_found: mockDetailData.reduce((sum, r) => sum + r.indoor_other_found, 0),
        other_container: mockDetailData.reduce((sum, r) => sum + r.other_container, 0),
      };

      const sumValues = [
        sums.outdoor_drinking_survey, sums.outdoor_drinking_found,
        sums.outdoor_usage_survey, sums.outdoor_usage_found,
        sums.outdoor_cement_survey, sums.outdoor_cement_found,
        sums.outdoor_pot_survey, sums.outdoor_pot_found,
        sums.outdoor_other_survey, sums.outdoor_other_found,
        sums.indoor_drinking_survey, sums.indoor_drinking_found,
        sums.indoor_usage_survey, sums.indoor_usage_found,
        sums.indoor_cement_survey, sums.indoor_cement_found,
        sums.indoor_pot_survey, sums.indoor_pot_found,
        sums.indoor_other_survey, sums.indoor_other_found,
      ];

      doc.setFontSize(6);
      sumValues.forEach((val) => {
        doc.rect(sumX, currentY, colWidths.data, rowHeight);
        doc.text(String(val), sumX + colWidths.data / 2, currentY + 3.5, { align: "center" });
        sumX += colWidths.data;
      });

      // ภาชนะอื่นๆ รวม
      doc.rect(sumX, currentY, otherWidth, rowHeight);
      doc.text(String(sums.other_container), sumX + otherWidth / 2, currentY + 3.5, { align: "center" });

      // บันทึกไฟล์
      doc.save(`รายละเอียดลูกน้ำยุงลาย_${month}_${year}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("เกิดข้อผิดพลาดในการสร้าง PDF");
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#faf8ff] via-white to-[#f5f0ff]">
      {/* Header Section with Gradient */}
      <div className="relative mb-8 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7e32e2] via-[#9333ea] to-[#a855f7]" />
        <div className="absolute inset-0 bg-white/5" />

        <div className="relative p-6 sm:p-8">
          <div className="text-white">
            <button
              onClick={() => router.push("/report-mosquito/data")}
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
                  รายละเอียดการสำรวจลูกน้ำยุงลาย
                </h1>
                <p className="text-white/80 text-sm mt-1">
                  ตรวจสอบรายละเอียดการสำรวจภาชนะและลูกน้ำยุงลาย
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
              รายละเอียดการสำรวจลูกน้ำยุงลาย ปี {year}
            </h2>
            <p className="text-gray-700 font-medium text-base mb-1">
              ประจำเดือน {month} {week}
            </p>
            <p className="text-gray-700 font-medium text-base">{name}</p>
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
          <table className="w-full border-collapse text-xs">
            <thead>
              {/* Row 1: Main headers */}
              <tr className="bg-white">
                <th rowSpan={3} className="border border-black py-2 px-2 font-bold text-center text-[#231d37]">
                  ลำดับ
                </th>
                <th rowSpan={3} className="border border-black py-2 px-2 font-bold text-center text-[#231d37]">
                  สัปดาห์
                </th>
                <th rowSpan={3} className="border border-black py-2 px-2 font-bold text-center text-[#231d37]">
                  บ้านเลขที่
                </th>
                <th colSpan={10} className="border border-black py-2 px-2 font-bold text-center text-[#231d37]">
                  จำนวนภาชนะนอกบ้าน (สำรวจ/พบลูกน้ำ)
                </th>
                <th colSpan={10} className="border border-black py-2 px-2 font-bold text-center text-[#231d37]">
                  จำนวนภาชนะภายในบ้าน (สำรวจ/พบลูกน้ำ)
                </th>
                <th rowSpan={3} className="border border-black py-2 px-2 font-bold text-center text-[#231d37]">
                  ภาชนะอื่น ๆ
                </th>
              </tr>
              {/* Row 2: Container types */}
              <tr className="bg-white">
                {/* ภาชนะนอกบ้าน */}
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">
                  โอ่งน้ำดื่ม
                </th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">
                  โอ่งน้ำใช้
                </th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">
                  บ่อซีเมนต์ขนาดใหญ่
                </th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">
                  ที่รองกระถาง
                </th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">
                  ภาชนะอื่น ๆ
                </th>
                {/* ภาชนะในบ้าน */}
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">
                  โอ่งน้ำดื่ม
                </th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">
                  โอ่งน้ำใช้
                </th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">
                  บ่อซีเมนต์ขนาดใหญ่
                </th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">
                  ที่รองกระถาง
                </th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">
                  ภาชนะอื่น ๆ
                </th>
              </tr>
              {/* Row 3: สำรวจ/พบ */}
              <tr className="bg-white">
                {/* ภาชนะนอกบ้าน - 5 types x 2 columns */}
                {[...Array(5)].map((_, i) => (
                  <React.Fragment key={`outdoor-${i}`}>
                    <th className="border border-black py-1 px-1 font-medium text-center text-[#231d37]">สำรวจ</th>
                    <th className="border border-black py-1 px-1 font-medium text-center text-[#231d37]">พบ</th>
                  </React.Fragment>
                ))}
                {/* ภาชนะในบ้าน - 5 types x 2 columns */}
                {[...Array(5)].map((_, i) => (
                  <React.Fragment key={`indoor-${i}`}>
                    <th className="border border-black py-1 px-1 font-medium text-center text-[#231d37]">สำรวจ</th>
                    <th className="border border-black py-1 px-1 font-medium text-center text-[#231d37]">พบ</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockDetailData.map((row) => (
                <tr key={row.no} className="bg-white hover:bg-[#faf8ff] transition-colors">
                  <td className="border border-black py-2 px-2 text-center font-semibold text-[#231d37]">
                    {row.no}
                  </td>
                  <td className="border border-black py-2 px-2 text-center text-[#231d37]">
                    {row.week}
                  </td>
                  <td className="border border-black py-2 px-2 text-center text-[#231d37]">
                    {row.house}
                  </td>
                  {/* ภาชนะนอกบ้าน */}
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_drinking_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_drinking_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_usage_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_usage_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_cement_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_cement_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_pot_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_pot_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_other_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_other_found}</td>
                  {/* ภาชนะในบ้าน */}
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_drinking_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_drinking_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_usage_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_usage_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_cement_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_cement_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_pot_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_pot_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_other_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_other_found}</td>
                  {/* ภาชนะอื่น ๆ */}
                  <td className="border border-black py-2 px-2 text-center text-[#231d37] font-semibold">
                    {row.other_container}
                  </td>
                </tr>
              ))}
              {/* Summary Row */}
              <tr className="bg-[#f5f0ff] font-bold">
                <td colSpan={3} className="border border-black py-2 px-2 text-center text-[#231d37]">
                  รวมทั้งหมด
                </td>
                {/* ภาชนะนอกบ้าน */}
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">
                  {mockDetailData.reduce((sum, r) => sum + r.outdoor_drinking_survey, 0)}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">
                  {mockDetailData.reduce((sum, r) => sum + r.outdoor_drinking_found, 0)}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">
                  {mockDetailData.reduce((sum, r) => sum + r.outdoor_usage_survey, 0)}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">
                  {mockDetailData.reduce((sum, r) => sum + r.outdoor_usage_found, 0)}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">
                  {mockDetailData.reduce((sum, r) => sum + r.outdoor_cement_survey, 0)}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">
                  {mockDetailData.reduce((sum, r) => sum + r.outdoor_cement_found, 0)}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">
                  {mockDetailData.reduce((sum, r) => sum + r.outdoor_pot_survey, 0)}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">
                  {mockDetailData.reduce((sum, r) => sum + r.outdoor_pot_found, 0)}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">
                  {mockDetailData.reduce((sum, r) => sum + r.outdoor_other_survey, 0)}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">
                  {mockDetailData.reduce((sum, r) => sum + r.outdoor_other_found, 0)}
                </td>
                {/* ภาชนะในบ้าน */}
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">
                  {mockDetailData.reduce((sum, r) => sum + r.indoor_drinking_survey, 0)}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">
                  {mockDetailData.reduce((sum, r) => sum + r.indoor_drinking_found, 0)}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">
                  {mockDetailData.reduce((sum, r) => sum + r.indoor_usage_survey, 0)}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">
                  {mockDetailData.reduce((sum, r) => sum + r.indoor_usage_found, 0)}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">
                  {mockDetailData.reduce((sum, r) => sum + r.indoor_cement_survey, 0)}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">
                  {mockDetailData.reduce((sum, r) => sum + r.indoor_cement_found, 0)}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">
                  {mockDetailData.reduce((sum, r) => sum + r.indoor_pot_survey, 0)}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">
                  {mockDetailData.reduce((sum, r) => sum + r.indoor_pot_found, 0)}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">
                  {mockDetailData.reduce((sum, r) => sum + r.indoor_other_survey, 0)}
                </td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">
                  {mockDetailData.reduce((sum, r) => sum + r.indoor_other_found, 0)}
                </td>
                {/* ภาชนะอื่น ๆ */}
                <td className="border border-black py-2 px-2 text-center text-[#231d37]">
                  {mockDetailData.reduce((sum, r) => sum + r.other_container, 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportMosquitoCompDetailComp;
