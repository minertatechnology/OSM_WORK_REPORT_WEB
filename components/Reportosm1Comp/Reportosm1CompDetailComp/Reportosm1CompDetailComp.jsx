import React, { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Download } from "lucide-react";
import jsPDF from "jspdf";
import { font as SarabunFont } from "../../../styles/Sarabun-Regular-normal";
import { fontbold as SarabunBoldFont } from "../../../styles/Sarabun-Regular-bold";

const Reportosm1CompDetailComp = ({ reportData }) => {
  const router = useRouter();
  const tableRef = useRef(null);
  const [activityData, setActivityData] = useState([]);
  const [loading, setLoading] = useState(true);

  // ถ้าไม่มีข้อมูล ให้ใช้ค่า default
  const year = reportData?.year || "2568";
  const month = reportData?.month || "มิถุนายน";
  const name = reportData?.name || "นางสาวชบุษบก ผดุงจิตร";
  const externalUserId = reportData?.rawData?.external_user_id;
  const fiscalYear = reportData?.rawData?.fiscal_year;

  // Debug: แสดงข้อมูลที่ได้รับ
  useEffect(() => {
    console.log("🔍 reportData received:", reportData);
    console.log("🔍 externalUserId:", externalUserId);
    console.log("🔍 fiscalYear:", fiscalYear);
    console.log("🔍 rawData:", reportData?.rawData);
  }, [reportData, externalUserId, fiscalYear]);

  // Fetch activity data from API
  useEffect(() => {
    // Clear ข้อมูลเก่าก่อนเมื่อเปลี่ยนคน
    setActivityData([]);

    const fetchActivityData = async () => {
      if (!externalUserId) {
        console.log("❌ No externalUserId provided - reportData:", reportData);
        console.log("❌ rawData:", reportData?.rawData);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("🔍 Fetching activity data for:", {
          externalUserId,
          fiscalYear,
          name
        });

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_SMART_OSM_URL}/report-osm1/activity-data/all?skip=0&limit=1000`
        );
        const data = await response.json();

        console.log("📦 Total API records received:", data.length);

        // กรองข้อมูลเฉพาะของ external_user_id และ fiscal_year นี้
        const userActivities = data.filter(
          (item) =>
            item.external_user_id === externalUserId &&
            item.fiscal_year === fiscalYear
        );

        console.log("✅ Filtered activities for user:", name);
        console.log("✅ External User ID:", externalUserId);
        console.log("✅ Filtered count:", userActivities.length);
        console.log("📊 Sample data:", userActivities.slice(0, 3));

        setActivityData(userActivities);
      } catch (error) {
        console.error("❌ Error fetching activity data:", error);
        setActivityData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivityData();
  }, [externalUserId, fiscalYear, name, reportData]);

  // Mapping หน่วยนับตายตัวตามเอกสาร อสม.1 (ฉบับที่2) พ.ศ.2567
  const UNIT_MAPPING = React.useMemo(() => ({
    // ก. การส่งเสริมสุขภาพ (11 ข้อ - ทุกข้อใช้ "คน")
    "promote_health_1": "คน",
    "promote_health_2": "คน",
    "promote_health_3": "คน",
    "promote_health_4": "คน",
    "promote_health_5": "คน",
    "promote_health_6": "คน",
    "promote_health_7": "คน",
    "promote_health_8": "คน",
    "promote_health_9": "คน",
    "promote_health_10": "คน",
    "promote_health_11": "คน",
    // ข. การเฝ้าระวังป้องกันและควบคุม (7 ข้อ)
    "protect_1": "ครัวเรือน",
    "protect_2": "ครัวเรือน",
    "protect_3": "คน",
    "protect_4": "ครัวเรือน",
    "protect_5": "ครัวเรือน",
    "protect_6": "คน",
    "protect_7": "คน",
    // ค. การฟื้นฟูสุขภาพ (1 ข้อ)
    "recover_1": "ครั้ง",
    // ง. การคุ้มครองผู้บริโภค (1 ข้อ)
    "consumer_1": "ครั้ง",
    // จ. การจัดการสุขภาพชุมชน (2 ข้อ)
    "community_health_1": "ครั้ง",
    "community_health_2": "ครั้ง",
    // ฉ. การสนับสนุน อสค. (3 ข้อ - ทุกข้อใช้ "ครอบครัว")
    "family_doc_1": "ครอบครัว",
    "family_doc_2": "ครอบครัว",
    "family_doc_3": "ครอบครัว",
    // ช. การใช้ยาสมเหตุสมผล (2 ข้อ)
    "statistics_1": "ครอบครัว",
    "statistics_2": "ครั้ง",
    // ซ. การเข้าร่วมทีมหมอครอบครัว (3 ข้อ)
    "doctor_family_1": "ครั้ง",
    "doctor_family_2": "ครอบครัว",
    "doctor_family_3": "ครอบครัว",
    // ฌ. กิจกรรมอื่นๆ (1 ข้อ)
    "other_activity_1": "คน",
  }), []);

  // แปลงข้อมูลจาก API และใช้หน่วยนับจาก UNIT_MAPPING แทน
  const transformedData = React.useMemo(() => {
    if (activityData.length === 0) {
      console.log("⚠️ No activity data to transform");
      return [];
    }

    console.log("🔄 Transforming activity data...");
    console.log("📊 Total items to display:", activityData.length);

    // เรียงลำดับข้อมูลตาม order_index
    const sortedData = [...activityData].sort((a, b) => {
      const orderA = a.activity?.order_index || 0;
      const orderB = b.activity?.order_index || 0;
      return orderA - orderB;
    });

    console.log("📑 ✅ Data sorted by order_index");

    // แสดงข้อมูลทั้งหมดพร้อมหน่วยนับจาก UNIT_MAPPING
    const result = sortedData.map((item, index) => {
      const displayOrder = item.activity?.display_order || `${index + 1}`;
      const activityId = item.activity_id;
      // ใช้หน่วยนับจาก UNIT_MAPPING ตามเอกสาร อสม.1
      const fixedUnit = UNIT_MAPPING[activityId] || "-";

      return {
        no: displayOrder,
        activity: item.activity?.title || item.activity_id || "-",
        unit: fixedUnit, // ใช้หน่วยนับตายตัวตามเอกสาร
        result: item.value || 0,
        isMainCategory: false,
        category: item.category,
        activityId: item.activity_id,
        orderIndex: item.activity?.order_index || 0,
      };
    });

    console.log("✅ Transformed data rows:", result.length);
    return result;
  }, [activityData, UNIT_MAPPING]);

  // ใช้ข้อมูลจาก API เท่านั้น (ไม่ fallback ไปใช้ mock data)
  const displayData = loading ? [] : transformedData;

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

      displayData.forEach((row) => {
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
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7e32e2]"></div>
                      <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
                    </div>
                  </td>
                </tr>
              ) : displayData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileText size={48} className="text-gray-300" />
                      <p className="text-gray-500">ไม่พบข้อมูล</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayData.map((row, idx) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reportosm1CompDetailComp;
