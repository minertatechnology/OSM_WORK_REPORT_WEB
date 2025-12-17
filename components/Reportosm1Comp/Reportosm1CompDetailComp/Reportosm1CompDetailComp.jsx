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
      no: "5.",
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

  // ดึงข้อมูล note จาก other_activity_1
  const smokeData = React.useMemo(() => {
    const otherActivity1 = activityData.find(item => item.activity_id === "other_activity_1");

    if (!otherActivity1) {
      return [];
    }

    // ลองทั้ง notes และ note
    const noteField = otherActivity1.notes || otherActivity1.note;

    if (!noteField) {
      return [];
    }

    try {
      const noteData = JSON.parse(noteField);
      return Array.isArray(noteData) ? noteData : [];
    } catch (error) {
      console.error("❌ Error parsing note data:", error);
      return [];
    }
  }, [activityData]);

  // แปลงข้อมูลจาก API โดยใช้โครงสร้างจากเอกสาร และดึงเฉพาะจำนวนจาก API
  const transformedData = React.useMemo(() => {
    console.log("🔄 Transforming data with document structure...");

    // สร้าง Map จากข้อมูล API เพื่อหา value ตาม activityId
    const activityValueMap = new Map();
    activityData.forEach((item) => {
      activityValueMap.set(item.activity_id, item.value || 0);
    });

    console.log("📊 Activity values from API:", Object.fromEntries(activityValueMap));
    console.log("📊 smokeData count:", smokeData.length);

    // นับจำนวนจาก smokeData สำหรับ 9.1
    const smokeCount = smokeData.length;

    // ใช้โครงสร้างจากเอกสาร และ map ค่าจาก API
    const result = ACTIVITY_STRUCTURE.map((item) => {
      let resultValue = "";

      // กรณีพิเศษสำหรับ other_activity_1 และ other_activity_2
      if (item.activityId === "other_activity_1") {
        // ข้อ 9.1 แสดงจำนวนที่นับจาก notes (smokeData.length)
        resultValue = smokeCount;
      } else if (item.activityId === "other_activity_2") {
        // ข้อ 9.2 แสดงค่า value จาก other_activity_1
        resultValue = activityValueMap.get("other_activity_1") || 0;
      } else if (item.activityId) {
        // กรณีปกติ
        resultValue = activityValueMap.get(item.activityId) || 0;
      }

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
  }, [activityData, ACTIVITY_STRUCTURE, smokeData]);

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
      doc.setFontSize(16);
      doc.setFont("Sarabun", "bold");
      doc.text("แบบรายงานการปฏิบัติงานของ อสม.", 105, 18, { align: "center" });

      doc.setFontSize(13);
      doc.setFont("Sarabun", "normal");
      doc.text(`ประจำเดือน ${month} พ.ศ. ${year}`, 105, 26, { align: "center" });

      doc.setFontSize(12);
      doc.text(`ชื่อ-นามสกุล: ${name}`, 105, 33, { align: "center" });

      // Table settings
      const margin = 15;
      const startX = margin;
      let startY = 42;
      const rowHeight = 6;

      // กำหนดความกว้างของแต่ละคอลัมน์
      const colWidths = {
        no: 20,
        activity: 130,
        unit: 25,
        result: 15,
      };

      // วาดตาราง Header (ไม่มีกรอบ)
      doc.setFont("Sarabun", "bold");
      doc.setFontSize(12);

      let currentX = startX;

      // ลำดับ
      doc.text("ลำดับ", currentX, startY);
      currentX += colWidths.no;

      // กิจกรรมการปฏิบัติงาน
      doc.text("กิจกรรมการปฏิบัติงาน", currentX, startY);
      currentX += colWidths.activity;

      // หน่วยนับ
      doc.text("หน่วยนับ", currentX + 5, startY);
      currentX += colWidths.unit;

      // ผลงาน
      doc.text("ผลงาน", currentX + 3, startY);

      // วาดข้อมูลในตาราง
      doc.setFont("Sarabun", "normal");
      doc.setFontSize(10);

      let currentY = startY + 5;
      const maxRowsPerPage = 38;
      let rowCount = 0;

      displayData.forEach((row) => {
        // ถ้าเต็มหน้าให้สร้างหน้าใหม่
        if (rowCount >= maxRowsPerPage) {
          doc.addPage();
          currentY = 25;
          rowCount = 0;

          // วาด header ใหม่ (ไม่มีกรอบ)
          doc.setFont("Sarabun", "bold");
          doc.setFontSize(12);

          let headerX = startX;
          doc.text("ลำดับ", headerX, currentY);
          headerX += colWidths.no;

          doc.text("กิจกรรมการปฏิบัติงาน", headerX, currentY);
          headerX += colWidths.activity;

          doc.text("หน่วยนับ", headerX + 5, currentY);
          headerX += colWidths.unit;

          doc.text("ผลงาน", headerX + 3, currentY);

          currentY += 8;
          doc.setFont("Sarabun", "normal");
          doc.setFontSize(10);
        }

        let dataX = startX;

        // กำหนด font ตามประเภทแถว
        if (row.isMainCategory) {
          doc.setFont("Sarabun", "bold");
          doc.setFontSize(14);
        } else {
          doc.setFont("Sarabun", "normal");
          doc.setFontSize(10);
        }

        // กำหนด indent เฉพาะตัวเลขลำดับ (ตรงตามหน้าหลัก)
        let noIndent = 0;

        if (row.isMainCategory) {
          // หมวดหมู่หลัก (1., 2., 3., ...) - ไม่ indent
          noIndent = 0;
        } else if (row.no && (row.no.includes(".") && !row.no.startsWith("(") && row.no !== "-")) {
          // หัวข้อย่อยระดับ 1 (1.1, 1.2, 2.1, ...) - indent 4mm (ml-16 ~ 16px ~ 4mm)
          noIndent = 4;
        } else if (row.no === "-") {
          // หัวข้อย่อยระดับ 2 (-) - indent 6mm (ml-24 ~ 24px ~ 6mm)
          noIndent = 6;
        } else if (row.no && row.no.startsWith("(")) {
          // หัวข้อย่อยระดับ 3 ((1), (2), (3)) - indent 6mm (ml-24 ~ 24px ~ 6mm)
          noIndent = 6;
        } else if (row.no === "") {
          // หัวข้อคำอธิบายพิเศษ (ไม่มีเลขลำดับ) - indent 4mm
          noIndent = 4;
        }

        // ลำดับ (ไม่มีกรอบ)
        if (row.no) {
          doc.text(row.no, dataX + noIndent, currentY);
        }
        dataX += colWidths.no;

        // กิจกรรม (ไม่มีกรอบ, ไม่ indent)
        const actParts = doc.splitTextToSize(row.activity, colWidths.activity - 2);
        doc.text(actParts[0], dataX, currentY);
        dataX += colWidths.activity;

        // หน่วยนับ (ไม่มีกรอบ)
        doc.setFont("Sarabun", "normal");
        doc.setFontSize(10);
        if (row.unit) {
          doc.text(row.unit, dataX + 8, currentY);
        }
        dataX += colWidths.unit;

        // ผลงาน (ไม่มีกรอบ)
        if (row.result !== "" && row.result !== undefined && row.result !== 0) {
          doc.text(String(row.result), dataX + 5, currentY);
        }

        currentY += rowHeight;
        rowCount++;

        // แสดงรายละเอียดสำหรับ Activity 9.1 (other_activity_1)
        if (row.activityId === "other_activity_1" && smokeData.length > 0) {
          // เพิ่มระยะห่าง
          currentY += 2;

          smokeData.forEach((item, idx) => {
            // ตรวจสอบว่าเต็มหน้าหรือไม่
            if (rowCount >= maxRowsPerPage) {
              doc.addPage();
              currentY = 25;
              rowCount = 0;

              // วาด header ใหม่
              doc.setFont("Sarabun", "bold");
              doc.setFontSize(12);

              let headerX = startX;
              doc.text("ลำดับ", headerX, currentY);
              headerX += colWidths.no;

              doc.text("กิจกรรมการปฏิบัติงาน", headerX, currentY);
              headerX += colWidths.activity;

              doc.text("หน่วยนับ", headerX + 5, currentY);
              headerX += colWidths.unit;

              doc.text("ผลงาน", headerX + 3, currentY);

              currentY += 8;
              doc.setFont("Sarabun", "normal");
              doc.setFontSize(10);
            }

            const status = item["สถานะการสูบบุหรี่"] === "smoke" ? "สูบ" : "ไม่สูบ";
            const detailText = `ลำดับ: ${idx + 1}, ชื่อ: ${item["ชื่อ"] || "-"}, เบอร์โทรศัพท์: ${item["เบอร์โทรศัพท์"] || "-"}, บ้านเลขที่: ${item["บ้านเลขที่"] || "-"}, สถานะ: ${status}`;

            doc.setFont("Sarabun", "normal");
            doc.setFontSize(8);

            // วาดข้อความรายละเอียด - เริ่มต้นที่คอลัมน์กิจกรรม (ตรงกับ pl-16)
            const detailParts = doc.splitTextToSize(detailText, colWidths.activity + colWidths.unit + colWidths.result - 10);
            detailParts.forEach((part, partIdx) => {
              if (partIdx === 0) {
                doc.text(part, startX + colWidths.no, currentY);
              } else {
                currentY += 3.5;
                rowCount++;
                if (rowCount >= maxRowsPerPage) {
                  doc.addPage();
                  currentY = 25;
                  rowCount = 0;

                  // วาด header ใหม่
                  doc.setFont("Sarabun", "bold");
                  doc.setFontSize(12);

                  let headerX = startX;
                  doc.text("ลำดับ", headerX, currentY);
                  headerX += colWidths.no;

                  doc.text("กิจกรรมการปฏิบัติงาน", headerX, currentY);
                  headerX += colWidths.activity;

                  doc.text("หน่วยนับ", headerX + 5, currentY);
                  headerX += colWidths.unit;

                  doc.text("ผลงาน", headerX + 3, currentY);

                  currentY += 8;
                  doc.setFont("Sarabun", "normal");
                  doc.setFontSize(8);
                }
                doc.text(part, startX + colWidths.no, currentY);
              }
            });

            currentY += 4;
            rowCount++;
          });

          // เพิ่มระยะห่างหลังข้อมูล note ก่อนข้อ 9.2
          currentY += 3;
        }
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
                // กำหนด indent สำหรับลำดับและกิจกรรม
                let noIndent = "";
                let activityIndent = "";

                if (row.isMainCategory) {
                  // หมวดหมู่หลัก (1., 2., 3., ...)
                  noIndent = "pl-0";
                  activityIndent = "";
                } else if (row.no && (row.no.includes(".") && !row.no.startsWith("(") && row.no !== "-")) {
                  // หัวข้อย่อยระดับ 1 (1.1, 1.2, 2.1, ...)
                  noIndent = "pl-4";
                  activityIndent = "";
                } else if (row.no === "-") {
                  // หัวข้อย่อยระดับ 2 (-)
                  noIndent = "pl-6";
                  activityIndent = "";
                } else if (row.no && row.no.startsWith("(")) {
                  // หัวข้อย่อยระดับ 3 ((1), (2), (3))
                  noIndent = "pl-6";
                  activityIndent = "";
                } else if (row.no === "") {
                  // หัวข้อคำอธิบายพิเศษ
                  noIndent = "pl-4";
                  activityIndent = "";
                }

                // กำหนดขนาดตัวอักษร
                const isSubItem = row.no && (row.no.includes(".") && !row.no.startsWith("(") && row.no !== "-");
                const isLevel2 = row.no === "-";
                const isLevel3 = row.no && row.no.startsWith("(");
                const isEmptyNo = row.no === "";

                let fontSize = "";
                let noFontSize = "";

                if (row.isMainCategory) {
                  fontSize = "text-base";
                  noFontSize = "text-lg";
                } else if (isSubItem || isLevel2 || isLevel3 || isEmptyNo) {
                  fontSize = "text-sm";
                  noFontSize = "text-sm";
                } else {
                  fontSize = "text-sm";
                  noFontSize = "text-sm";
                }

                return (
                  <React.Fragment key={idx}>
                    <div className={`flex px-3 border-b border-gray-100 hover:bg-gray-50 ${row.isMainCategory ? "py-2" : "py-1.5"}`}>
                      <div className={`w-16 flex-shrink-0 ${noIndent} ${row.isMainCategory ? "font-bold" : ""} ${noFontSize} text-black`}>
                        {row.no}
                      </div>
                      <div className={`flex-1 ${row.isMainCategory ? "font-bold" : ""} ${fontSize} text-black ${activityIndent}`}>
                        {row.activity}
                      </div>
                      <div className={`w-24 text-center flex-shrink-0 ${row.isMainCategory ? "font-bold" : ""} ${fontSize} text-black`}>
                        {row.unit}
                      </div>
                      <div className={`w-20 text-center flex-shrink-0 ${row.isMainCategory ? "font-bold" : ""} ${fontSize} text-black`}>
                        {row.result !== "" && row.result !== undefined && row.result !== 0 ? row.result : ""}
                      </div>
                    </div>

                    {/* แสดงรายละเอียดข้อมูลสำหรับ Activity 9.1 - แสดงเป็นแถวเดียว */}
                    {row.activityId === "other_activity_1" && smokeData.length > 0 && (
                      <div className="px-3 py-3 border-b border-gray-200">
                        <div className="pl-16">
                          {smokeData.map((item, index) => {
                            const status = item["สถานะการสูบบุหรี่"] === "smoke" ? "สูบ" : "ไม่สูบ";
                            return (
                              <div key={index} className="text-xs text-gray-600 mb-1.5">
                                <span className="font-medium">ลำดับ:</span> {index + 1}, <span className="font-medium">ชื่อ:</span> {item["ชื่อ"] || "-"}, <span className="font-medium">เบอร์โทรศัพท์:</span> {item["เบอร์โทรศัพท์"] || "-"}, <span className="font-medium">บ้านเลขที่:</span> {item["บ้านเลขที่"] || "-"}, <span className="font-medium">สถานะ:</span> {status}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </React.Fragment>
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
