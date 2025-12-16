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

  // โครงสร้างข้อมูลหัวข้อกิจกรรมตามเอกสาร PDF - แบบรายงานผลการปฏิบัติงานของ อสม.
  const ACTIVITY_STRUCTURE = React.useMemo(() => [
    // 1. การส่งเสริมสุขภาพ
    {
      no: "1.",
      activity: "การส่งเสริมสุขภาพ",
      unit: "",
      isMainCategory: true,
      activityId: "promote_health"
    },
    {
      no: "1.1",
      activity: "อสม. เยี่ยมให้คําแนะนําหญิงตั้งครรภ์ (รายใหม่)",
      unit: "คน",
      activityId: "promote_health_1"
    },
    {
      no: "-",
      activity: "อสม. ค้นหาหญิงตั้งครรภ์อายุต่ำกว่า ๑๕ ปี (รายใหม่)",
      unit: "คน",
      activityId: "promote_health_2"
    },
    {
      no: "-",
      activity: "อสม. ติดตามหญิงตั้งครรภ์ให้ได้รับยาเม็ดเสริมไอโอดีน",
      unit: "คน",
      activityId: "promote_health_3"
    },
    {
      no: "1.2",
      activity: "อสม.บริการเยี่ยมให้คำแนะนำหญิงหลังคลอด (รายใหม่)",
      unit: "คน",
      activityId: "promote_health_4"
    },
    {
      no: "-",
      activity: "มารดาที่ไม่สามารถเลี้ยงดูบุตรด้วยนมแม่อย่างเดียวครบ 6 เดือน (รายใหม่)",
      unit: "คน",
      activityId: "promote_health_5"
    },
    {
      no: "-",
      activity: "อสม. ติดตามหญิงหลังคลอดในนมบุตร 6 เดือน ให้ได้รับยาเม็ดเสริมไอโอดีน",
      unit: "คน",
      activityId: "promote_health_6"
    },
    {
      no: "1.3",
      activity: "อสม.เยี่ยมบ้านและให้คำแนะนำผู้สูงอายุด้านการดูแลสุขภาพ",
      unit: "คน",
      activityId: "promote_health_7"
    },
    {
      no: "-",
      activity: "ผู้สูงอายุที่เป็นโรคเรื้อรังและถูกทอดทิ้งอยู่เพียงลำพัง (รายใหม่)",
      unit: "คน",
      activityId: "promote_health_8"
    },
    {
      no: "-",
      activity: "คัดกรอง ประเมินภาวะสุขภาพผู้สูงอายุ (ภาวะถดถอย 9 ด้าน)",
      unit: "คน",
      activityId: "promote_health_9"
    },
    {
      no: "-",
      activity: "สร้างความรอบรู้ และให้บริการดูแลสุขภาพตามสภาพปัญหาภาวะถดถอยในแต่ละด้านของผู้สูงอายุ และประสานภาคีเครือข่ายในการดูแลผู้สูงอายุให้มีชีวิตความเป็นอยู่ที่ดี",
      unit: "คน",
      activityId: "promote_health_10"
    },
    {
      no: "1.4",
      activity: "อสม.เยี่ยมบ้านและให้คำแนะนำผู้พิการด้านการดูแลสุขภาพ",
      unit: "คน",
      activityId: "promote_health_11"
    },
    // 2. การเฝ้าระวัง ป้องกัน และควบคุมโรค
    {
      no: "2.",
      activity: "การเฝ้าระวัง ป้องกัน และควบคุมโรค",
      unit: "",
      isMainCategory: true,
      activityId: "protect"
    },
    {
      no: "2.1",
      activity: "เฝ้าระวัง ป้องกัน ควบคุมโรคไข้เลือดออก (ปิด เปลี่ยน ปล่อย ปรับปรุง ปฏิบัติเป็นนิสัย)",
      unit: "ครัวเรือน",
      activityId: "protect_1"
    },
    {
      no: "2.2",
      activity: "เฝ้าระวัง ป้องกัน ควบคุมโรคไข้หวัดใหญ่ (ปิด ล้าง เลี่ยง หยุด)",
      unit: "ครัวเรือน",
      activityId: "protect_2"
    },
    {
      no: "2.3",
      activity: "เฝ้าระวัง คัดกรอง และให้คำแนะนำกลุ่มเสี่ยงโรค (โรคเบาหวาน โรคความดันโลหิตสูง โรคมะเร็ง โรคหัวใจ โรคหลอดเลือดสมอง)",
      unit: "คน",
      activityId: "protect_3"
    },
    {
      no: "2.4",
      activity: "ให้คำแนะนำประชาชนบริโภคผลิตภัณฑ์/อาหาร/เกลือที่ผสมไอโอดีน",
      unit: "ครัวเรือน",
      activityId: "protect_4"
    },
    {
      no: "2.5",
      activity: "ให้คำแนะนำประชาชนลดกิน หวาน อาหารมันและเค็ม",
      unit: "ครัวเรือน",
      activityId: "protect_5"
    },
    {
      no: "2.6",
      activity: "สำรวจ เฝ้าระวัง ป้องกันโรคในกลุ่มเป้าหมาย 607 และปักหมุดแจ้งพิกัดกลุ่มเปราะบางในแอปพลิเคชันพันภัย",
      unit: "คน",
      activityId: "protect_6"
    },
    // 3. การฟื้นฟูสุขภาพ
    {
      no: "3.",
      activity: "การฟื้นฟูสุขภาพ",
      unit: "",
      isMainCategory: true,
      activityId: "recover"
    },
    {
      no: "3.1",
      activity: "เยี่ยมบ้าน ให้คำแนะนำการดูแลผู้ป่วยโรคเบาหวาน ความดันโลหิต มะเร็ง หัวใจ ฯลฯ",
      unit: "ครั้ง",
      activityId: "recover_1"
    },
    // 4. การคุ้มครองผู้บริโภค
    {
      no: "4.",
      activity: "การคุ้มครองผู้บริโภค",
      unit: "",
      isMainCategory: true,
      activityId: "consumer"
    },
    {
      no: "4.1",
      activity: "เฝ้าระวังและให้คำแนะนำการบริโภคอาหารปลอดภัย",
      unit: "ครั้ง",
      activityId: "consumer_1"
    },
    // 5. การจัดการสุขภาพชุมชนและการมีส่วนร่วมในแผนสุขภาพตำบล
    {
      no: "5",
      activity: "การจัดการสุขภาพชุมชนและการมีส่วนร่วมในแผนสุขภาพตำบล",
      unit: "",
      isMainCategory: true,
      activityId: "community_health"
    },
    {
      no: "5.1",
      activity: "อสม.ร่วมกิจกรรมจิตอาสากับเครือข่ายอื่น",
      unit: "ครั้ง",
      activityId: "community_health_1"
    },
    {
      no: "5.2",
      activity: "จัดทำแผนสุขภาพ จัดหางบประมาณ จัดกิจกรรมสุขภาพ และประเมินผล",
      unit: "ครั้ง",
      activityId: "community_health_2"
    },
    // 6. การสนับสนุนอาสาสมัครประจำครอบครัว (อสค.)
    {
      no: "6.",
      activity: "การสนับสนุนอาสาสมัครประจำครอบครัว (อสค.)",
      unit: "",
      isMainCategory: true,
      activityId: "family_doc"
    },
    {
      no: "",
      activity: "ติดตามให้คำแนะนำ อสค. ในการดูแล อาหาร/ออกกำลังกาย/วิธีปฏิบัติ การดูแล การพยาบาล / การส่งต่อ ผู้ป่วยในครัวเรือน",
      unit: "",
      isMainCategory: false,
      activityId: null
    },
    {
      no: "(1)",
      activity: "กลุ่มผู้สูงอายุ ที่มีปัญหา ติดบ้านติดเตียง",
      unit: "คน",
      activityId: "family_doc_1"
    },
    {
      no: "(2)",
      activity: "กลุ่มผู้ป่วยโรคไม่ติดต่อเรื้อรัง",
      unit: "คน",
      activityId: "family_doc_2"
    },
    {
      no: "(3)",
      activity: "กลุ่มผู้ป่วยที่มีปัญหาโรคไต",
      unit: "คน",
      activityId: "family_doc_3"
    },
    // 7. การใช้ยาอย่างสมเหตุสมผล / การบริโภคผลิตภัณฑ์สุขภาพ
    {
      no: "7.",
      activity: "การใช้ยาอย่างสมเหตุสมผล / การบริโภคผลิตภัณฑ์สุขภาพ",
      unit: "",
      isMainCategory: true,
      activityId: "statistics"
    },
    {
      no: "(1)",
      activity: "ให้ความรู้พื้นฐานการใช้ยาปฎิชีวนะ หรือข้อควรระวังการซื้อยากินเองสำหรับโรคหวัด/ท้องเสีย และการใช้สมุนไพรที่เสี่ยงต่อการผสมสาร สเตียรอยด์",
      unit: "ครอบครัว",
      activityId: "statistics_1"
    },
    {
      no: "(2)",
      activity: "เฝ้าระวังและให้คำแนะนำการบริโภคผลิตภัณฑ์สุขภาพ และร่วมสำรวจร้านชำในชุมชน เพื่อปลอดยาปฏิชีวนะ ยาชุด",
      unit: "ครั้ง",
      activityId: "statistics_2"
    },
    // 8. การเข้าร่วมกับทีมหมอครอบครัว
    {
      no: "8.",
      activity: "การเข้าร่วมกับทีมหมอครอบครัว",
      unit: "",
      isMainCategory: true,
      activityId: "doctor_family"
    },
    {
      no: "-",
      activity: "ร่วมเป็นทีมหมอครอบครัว ในการช่วยเหลือ ดูแลผู้ป่วย และครอบครัวในชุมชน",
      unit: "ครั้ง",
      activityId: "doctor_family_1"
    },
    {
      no: "",
      activity: "กรณีเข้าร่วมทีมหมอครอบครัว อสม. ให้ความช่วยเหลือในเรื่องใด/กี่ครอบครัว",
      unit: "",
      isMainCategory: false,
      activityId: null
    },
    {
      no: "(1)",
      activity: "ช่วยปรับปรุงที่อยู่อาศัย และสิ่งแวดล้อมให้เอื้อต่อการดูแล การพยาบาล",
      unit: "ครอบครัว",
      activityId: "doctor_family_2"
    },
    {
      no: "(2)",
      activity: "เสริมพลังและกำลังใจ และเทคนิคการดูแล การพยาบาลตามปัญหาสุขภาพ ทำให้ผู้ป่วยมีกำลังใจในการดำรงชีวิต",
      unit: "ครอบครัว",
      activityId: "doctor_family_3"
    },
    // 9. กิจกรรมอื่นๆ
    {
      no: "9.",
      activity: "กิจกรรมอื่นๆ",
      unit: "",
      isMainCategory: true,
      activityId: "other_activity"
    },
    {
      no: "9.1",
      activity: "ชวนคนเลิกบุหรี่",
      unit: "คน",
      activityId: "other_activity_1"
    },
    {
      no: "9.2",
      activity: "ร่วมกับเจ้าหน้าที่ในการติดตามผู้ผ่านการบำบัดยาเสพติดในระบบสมัครใจบำบัด โดยการสร้างกระบวนการมีส่วนร่วมของคนในชุมชน",
      unit: "คน",
      activityId: "other_activity_2"
    }
  ], []);

  // แปลงข้อมูลจาก API โดยใช้โครงสร้างจากเอกสาร และดึงเฉพาะจำนวนจาก API
  const transformedData = React.useMemo(() => {
    console.log("🔄 Transforming data with document structure...");

    // สร้าง Map จากข้อมูล API เพื่อหา value ตาม activityId
    const activityValueMap = new Map();
    activityData.forEach((item) => {
      activityValueMap.set(item.activity_id, item.value || 0);
    });

    console.log("📊 Activity values from API:", Object.fromEntries(activityValueMap));

    // ใช้โครงสร้างจากเอกสาร และ map ค่าจาก API
    const result = ACTIVITY_STRUCTURE.map((item) => {
      // ถ้ามี activityId ให้ดึงค่าจาก API
      const resultValue = item.activityId ? (activityValueMap.get(item.activityId) || 0) : "";

      return {
        no: item.no,
        activity: item.activity,
        unit: item.unit,
        result: resultValue,
        isMainCategory: item.isMainCategory || false,
        activityId: item.activityId,
      };
    });

    console.log("✅ Transformed data rows:", result.length);
    return result;
  }, [activityData, ACTIVITY_STRUCTURE]);

  // แสดงข้อมูลตามโครงสร้างเอกสารเสมอ (ไม่ว่า API จะมีข้อมูลหรือไม่)
  const displayData = transformedData;

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
      const rowHeight = 7;

      // กำหนดความกว้างของแต่ละคอลัมน์
      const colWidths = {
        no: 12,
        activity: 138,
        unit: 25,
        result: 15,
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

        // กำหนด font ตามประเภทแถว
        if (row.isMainCategory) {
          doc.setFont("Sarabun", "bold");
        } else {
          doc.setFont("Sarabun", "normal");
        }
        doc.setFontSize(11);

        // ลำดับและกิจกรรมรวมกัน
        let noIndent = 0;
        let activityIndent = 0;

        if (row.isMainCategory) {
          noIndent = 0;
          activityIndent = 0;
        } else if (row.no && (row.no.includes(".") && !row.no.startsWith("(") && row.no !== "-")) {
          // หัวข้อย่อยระดับ 1 (1.1, 1.2)
          noIndent = 3;
          activityIndent = 3;
        } else if (row.no === "-") {
          // หัวข้อย่อยระดับ 2 (-)
          noIndent = 3;
          activityIndent = 3;
        } else if (row.no && row.no.startsWith("(")) {
          // หัวข้อย่อยระดับ 3 ((1), (2))
          noIndent = 12;
          activityIndent = 12;
        } else if (row.no === "") {
          // หัวข้อคำอธิบาย
          noIndent = 6;
          activityIndent = 6;
        }

        // ลำดับ
        doc.rect(dataX, currentY, colWidths.no, rowHeight);
        if (row.no) {
          doc.text(row.no, dataX + 2 + noIndent, currentY + 5);
        }
        dataX += colWidths.no;

        // กิจกรรม
        doc.rect(dataX, currentY, colWidths.activity, rowHeight);
        const actParts = doc.splitTextToSize(row.activity, colWidths.activity - activityIndent - 4);
        doc.text(actParts[0], dataX + 2 + activityIndent, currentY + 5);
        dataX += colWidths.activity;

        // หน่วยนับ
        doc.setFont("Sarabun", "normal");
        doc.rect(dataX, currentY, colWidths.unit, rowHeight);
        if (row.unit) {
          doc.text(row.unit, dataX + colWidths.unit / 2, currentY + 5, { align: "center" });
        }
        dataX += colWidths.unit;

        // ผลงาน
        doc.rect(dataX, currentY, colWidths.result, rowHeight);
        if (row.result !== "" && row.result !== undefined && row.result !== 0) {
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
    <div className="w-full min-h-screen bg-gray-50">
      {/* Simple Header */}
      <div className="bg-white border-b border-gray-300 p-4 mb-4">
        <button
          onClick={() => router.push("/report-osm1/data")}
          className="flex items-center gap-2 px-3 py-2 mb-3 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">กลับ</span>
        </button>
      </div>

      {/* Document style */}
      <div className="max-w-[900px] mx-auto px-4 pb-8">
        <div ref={tableRef} className="bg-white shadow-sm">
          {/* Header with Report Info and Export Button */}
          <div className="pt-8 pb-6 px-6">
            {/* Report Info - Center aligned */}
            <div className="text-center mb-6">
              <h2 className="font-bold text-black text-base mb-2">
                แบบรายงานการปฏิบัติงานของ อสม.
              </h2>
              <p className="text-black text-sm mb-1">
                ประจำเดือน {month} พ.ศ. {year}
              </p>
              <p className="text-black text-sm">ชื่อ-นามสกุล: {name}</p>
            </div>

            {/* Export Button - Center */}
            <div className="flex justify-center mb-6">
              <button
                onClick={handleExportPDF}
                className="export-button flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7e32e2] to-[#9333ea] text-white font-medium rounded-lg hover:opacity-90 transition-opacity text-sm"
              >
                <Download size={16} />
                Export PDF
              </button>
            </div>

            {/* Table Header */}
            <div className="flex py-2 px-3 bg-white border-b border-t border-black">
              <div className="w-16 font-bold text-center text-black text-sm flex-shrink-0">
                ลำดับ
              </div>
              <div className="flex-1 font-bold text-center text-black text-sm">
                กิจกรรมการปฏิบัติงาน
              </div>
              <div className="w-24 font-bold text-center text-black text-sm flex-shrink-0">
                หน่วยนับ
              </div>
              <div className="w-20 font-bold text-center text-black text-sm flex-shrink-0">
                ผลงาน
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            {loading ? (
              <div className="py-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7e32e2]"></div>
                  <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
                </div>
              </div>
            ) : (
              displayData.map((row, idx) => {
                // กำหนด indent level ตามประเภทของแถว
                let indentStyle = "";
                let noWidth = "w-16";

                if (row.isMainCategory) {
                  // หมวดหมู่หลัก (1. 2. 3. ...)
                  indentStyle = "";
                  noWidth = "w-16";
                } else if (row.no && (row.no.includes(".") && !row.no.startsWith("(") && row.no !== "-")) {
                  // หัวข้อย่อยระดับ 1 (1.1, 1.2, 2.1, ...)
                  indentStyle = "ml-6";
                  noWidth = "w-14";
                } else if (row.no === "-") {
                  // หัวข้อย่อยระดับ 2 (ขึ้นต้นด้วย -)
                  indentStyle = "ml-6";
                  noWidth = "w-14";
                } else if (row.no && row.no.startsWith("(")) {
                  // หัวข้อย่อยระดับ 3 ((1), (2), (3))
                  indentStyle = "ml-20";
                  noWidth = "w-8";
                } else if (row.no === "") {
                  // หัวข้อคำอธิบายพิเศษ (ไม่มีเลขลำดับ)
                  indentStyle = "ml-12";
                  noWidth = "w-12";
                }

                return (
                  <div key={idx} className="flex py-1 px-3 border-b border-gray-100 hover:bg-gray-50">
                    <div className={`${noWidth} text-black text-sm flex-shrink-0 ${row.isMainCategory ? "font-bold" : ""}`}>
                      {row.no}
                    </div>
                    <div className={`flex-1 text-black text-sm ${indentStyle} ${row.isMainCategory ? "font-bold" : ""}`}>
                      {row.activity}
                    </div>
                    <div className="w-24 text-center text-black text-sm flex-shrink-0">
                      {row.unit}
                    </div>
                    <div className="w-20 text-center text-black text-sm flex-shrink-0">
                      {row.result !== "" && row.result !== undefined && row.result !== 0 ? row.result : ""}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reportosm1CompDetailComp;
