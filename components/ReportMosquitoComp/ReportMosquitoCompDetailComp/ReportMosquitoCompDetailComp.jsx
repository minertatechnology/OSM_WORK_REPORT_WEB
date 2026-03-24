import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Download, Loader2, AlertCircle } from "lucide-react";
import jsPDF from "jspdf";
import { font as SarabunFont } from "../../../styles/Sarabun-Regular-normal";
import { fontbold as SarabunBoldFont } from "../../../styles/Sarabun-Regular-bold";
import {
  fetchMosquitoLarvaeReports,
  transformReportData,
} from "@services/mosquitoLarvaeService/mosquitoLarvaeService";

const ReportMosquitoCompDetailComp = ({ reportData }) => {
  const router = useRouter();
  const tableRef = useRef(null);

  // API states
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ถ้าไม่มีข้อมูล ให้ใช้ค่า default
  const year = reportData?.year || "2568";
  const month = reportData?.month || "มิถุนายน";
  const week = reportData?.week || "สัปดาห์ที่ 1";
  const name = reportData?.name || "รายงานลูกน้ำยุงลาย บ้านเหนือ หมู่ 3 ต.ในเมือง อ.เมือง";
  const householdId = reportData?.householdId;
  const externalUserId = reportData?.userId; // external_user_id จาก userId

  // ดึงชื่อผู้รับผิดชอบจาก rawData (OSM user data)
  // rawData มี prefix_name_th, first_name, last_name
  const rawData = reportData?.rawData || {};
  const prefixName = rawData?.prefix_name_th || "";
  const firstNameFromData = rawData?.first_name || "";
  const lastNameFromData = rawData?.last_name || "";

  // สร้างชื่อเต็ม: prefix + first_name + last_name (เช่น "นาง Atthaphon Songpoon")
  const responsiblePersonName = prefixName && firstNameFromData
    ? `${prefixName}${firstNameFromData} ${lastNameFromData}`.trim()
    : "";

  // ใช้ first_name สำหรับ filename (ถ้าไม่มี osm_code)
  const firstName = firstNameFromData;

  const osmCode = rawData?.osm_code || rawData?.osmCode || firstName || "";

  // Fetch reports when component mounts
  useEffect(() => {
    const loadReports = async () => {
      if (!householdId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await fetchMosquitoLarvaeReports({
          skip: 0,
          limit: 1000,
        });

        const transformedData = transformReportData(data);

        // Filter reports by household_id
        const filteredReports = transformedData.filter(
          (report) => report.householdId === householdId
        );

        setReports(filteredReports);
      } catch (err) {
        console.error("Error loading reports:", err);
        setError("ไม่สามารถโหลดข้อมูลรายงานได้");
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [householdId]);

  // Transform API reports to table format
  const transformToTableFormat = (apiReports) => {
    return apiReports.map((report) => {
      const notes = report.notes || { inside: [], outside: [] };

      // Extract data from notes
      const getContainerValue = (array, name, field) => {
        const item = array.find(item => item.name === name);
        return item ? (item[field] || 0) : 0;
      };

      return {
        week: String(report.weekNumber),
        house: report.household?.house_number || '-',
        moo: report.household?.village_number || '-',
        // ภาชนะนอกบ้าน (outside) - 12 ประเภท (รวมภาชนะอื่นๆ)
        outdoor_drinking_survey: getContainerValue(notes.outside, 'โอ่งน้ำดื่ม', 'total'),
        outdoor_drinking_found: getContainerValue(notes.outside, 'โอ่งน้ำดื่ม', 'found'),
        outdoor_usage_survey: getContainerValue(notes.outside, 'โอ่งน้ำใช้', 'total'),
        outdoor_usage_found: getContainerValue(notes.outside, 'โอ่งน้ำใช้', 'found'),
        outdoor_cement_survey: getContainerValue(notes.outside, 'บ่อซีเมนต์', 'total'),
        outdoor_cement_found: getContainerValue(notes.outside, 'บ่อซีเมนต์', 'found'),
        outdoor_antstand_survey: getContainerValue(notes.outside, 'ที่รองกันมด', 'total'),
        outdoor_antstand_found: getContainerValue(notes.outside, 'ที่รองกันมด', 'found'),
        outdoor_pot_survey: getContainerValue(notes.outside, 'จานรองกระถาง', 'total'),
        outdoor_pot_found: getContainerValue(notes.outside, 'จานรองกระถาง', 'found'),
        outdoor_pond_survey: getContainerValue(notes.outside, 'อ่างบัว/ไม้น้ำ', 'total'),
        outdoor_pond_found: getContainerValue(notes.outside, 'อ่างบัว/ไม้น้ำ', 'found'),
        outdoor_tire_survey: getContainerValue(notes.outside, 'ยางรถยนต์เก่า', 'total'),
        outdoor_tire_found: getContainerValue(notes.outside, 'ยางรถยนต์เก่า', 'found'),
        outdoor_leaf_survey: getContainerValue(notes.outside, 'กาบใบพืช', 'total'),
        outdoor_leaf_found: getContainerValue(notes.outside, 'กาบใบพืช', 'found'),
        outdoor_unused_survey: getContainerValue(notes.outside, 'ภาชนะที่ไม่ใช้', 'total'),
        outdoor_unused_found: getContainerValue(notes.outside, 'ภาชนะที่ไม่ใช้', 'found'),
        outdoor_animal_survey: getContainerValue(notes.outside, 'น้ำเลี้ยงสัตว์', 'total'),
        outdoor_animal_found: getContainerValue(notes.outside, 'น้ำเลี้ยงสัตว์', 'found'),
        outdoor_fridge_survey: getContainerValue(notes.outside, 'ที่รองน้ำตู้เย็น/เครื่องทำน้ำเย็น', 'total'),
        outdoor_fridge_found: getContainerValue(notes.outside, 'ที่รองน้ำตู้เย็น/เครื่องทำน้ำเย็น', 'found'),
        outdoor_other_survey: report.otherContainers || 0,
        outdoor_other_found: 0, // ภาชนะอื่นๆนอกบ้าน
        // ภาชนะในบ้าน (inside) - 11 ประเภท (รวมภาชนะอื่นๆ)
        indoor_drinking_survey: getContainerValue(notes.inside, 'โอ่งน้ำดื่ม', 'total'),
        indoor_drinking_found: getContainerValue(notes.inside, 'โอ่งน้ำดื่ม', 'found'),
        indoor_usage_survey: getContainerValue(notes.inside, 'โอ่งน้ำใช้', 'total'),
        indoor_usage_found: getContainerValue(notes.inside, 'โอ่งน้ำใช้', 'found'),
        indoor_antstand_survey: getContainerValue(notes.inside, 'ที่รองกันมด', 'total'),
        indoor_antstand_found: getContainerValue(notes.inside, 'ที่รองกันมด', 'found'),
        indoor_pot_survey: getContainerValue(notes.inside, 'จานรองกระถาง', 'total'),
        indoor_pot_found: getContainerValue(notes.inside, 'จานรองกระถาง', 'found'),
        indoor_pond_survey: getContainerValue(notes.inside, 'อ่างบัว/ไม้น้ำ', 'total'),
        indoor_pond_found: getContainerValue(notes.inside, 'อ่างบัว/ไม้น้ำ', 'found'),
        indoor_tire_survey: getContainerValue(notes.inside, 'ยางรถยนต์เก่า', 'total'),
        indoor_tire_found: getContainerValue(notes.inside, 'ยางรถยนต์เก่า', 'found'),
        indoor_leaf_survey: getContainerValue(notes.inside, 'กาบใบพืช', 'total'),
        indoor_leaf_found: getContainerValue(notes.inside, 'กาบใบพืช', 'found'),
        indoor_unused_survey: getContainerValue(notes.inside, 'ภาชนะที่ไม่ใช้', 'total'),
        indoor_unused_found: getContainerValue(notes.inside, 'ภาชนะที่ไม่ใช้', 'found'),
        indoor_animal_survey: getContainerValue(notes.inside, 'น้ำเลี้ยงสัตว์', 'total'),
        indoor_animal_found: getContainerValue(notes.inside, 'น้ำเลี้ยงสัตว์', 'found'),
        indoor_fridge_survey: getContainerValue(notes.inside, 'ที่รองน้ำตู้เย็น/เครื่องทำน้ำเย็น', 'total'),
        indoor_fridge_found: getContainerValue(notes.inside, 'ที่รองน้ำตู้เย็น/เครื่องทำน้ำเย็น', 'found'),
        indoor_other_survey: 0, // ภาชนะอื่นๆในบ้าน
        indoor_other_found: 0,
      };
    });
  };

  // Use real data from API only (no mock data)
  const tableData = reports.length > 0 ? transformToTableFormat(reports) : [];
  const displayData = tableData; // For backward compatibility with existing code

  // ฟังก์ชันคำนวณปี, เดือน, สัปดาห์จากข้อมูลรายงานจริง
  const getReportPeriod = () => {
    if (reports.length === 0) {
      return { year: "2568", month: "มิถุนายน", week: "สัปดาห์ที่ 1" };
    }

    // ดึงข้อมูลวันที่จากรายงานแรก
    const firstReport = reports[0];
    const reportDate = firstReport.report_date || firstReport.createdAt;

    if (!reportDate) {
      return { year: "2568", month: "มิถุนายน", week: "สัปดาห์ที่ 1" };
    }

    const date = new Date(reportDate);

    // คำนวณปี พ.ศ. (เพิ่ม 543 จาก ค.ศ.)
    const thaiYear = date.getFullYear() + 543;

    // คำนวณเดือนไทย
    const thaiMonths = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    const thaiMonth = thaiMonths[date.getMonth()];

    // คำนวณสัปดาห์ในเดือน - เริ่มนับจากวันที่ 1 (สูงสุด 4 สัปดาห์)
    const dayOfMonth = date.getDate();
    const weekOfMonth = Math.min(Math.ceil(dayOfMonth / 7), 4);

    return {
      year: String(thaiYear),
      month: thaiMonth,
      week: `สัปดาห์ที่ ${weekOfMonth}`
    };
  };

  // ดึงข้อมูลปี, เดือน จากวันที่บันทึกของรายงานจริง สำหรับแสดงผลในหน้าเว็บ
  const { year: displayYear, month: displayMonth } = getReportPeriod();

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');

      // ดึงข้อมูลปี, เดือน จากวันที่บันทึกของรายงาน
      const { year: reportYear, month: reportMonth } = getReportPeriod();

      // เพิ่ม Thai font
      doc.addFileToVFS("Sarabun-Regular.ttf", SarabunFont);
      doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
      doc.addFileToVFS("Sarabun-Bold.ttf", SarabunBoldFont);
      doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
      doc.setFont("Sarabun");

      // Add watermark function
      const addWatermark = (doc) => {
        const watermarkImage = "/Smart_Osm_Plus.png";
        const imgWidth = 150;
        const imgHeight = 100;
        const centerX = 297 / 2;
        const centerY = 210 / 2;
        const x = centerX - (imgWidth / 2);
        const y = centerY - (imgHeight / 2);
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.10 }));
        doc.addImage(watermarkImage, 'PNG', x, y, imgWidth, imgHeight, '', 'NONE', 0);
        doc.restoreGraphicsState();
      };

      // ภาชนะนอกบ้าน - 12 ประเภท
      const outdoorContainerTypes = [
        "โอ่งน้ำดื่ม", "โอ่งน้ำใช้", "บ่อซีเมนต์", "รองกันมด",
        "รองกระถาง", "อ่างบัว", "ยางเก่า", "กาบพืช", "ภาชนะที่ไม่ใช้",
        "น้ำสัตว์", "รองตู้เย็น", "ภาชนะอื่นๆ"
      ];

      // ภาชนะในบ้าน - 11 ประเภท
      const indoorContainerTypes = [
        "โอ่งน้ำดื่ม", "โอ่งน้ำใช้", "รองกันมด",
        "รองกระถาง", "อ่างบัว", "ยางเก่า", "กาบพืช", "ภาชนะที่ไม่ใช้",
        "น้ำสัตว์", "รองตู้เย็น", "ภาชนะอื่นๆ"
      ];

      // ============================================
      // หน้า 1: ภาชนะนอกบ้าน
      // ============================================
      const colWidthsOutdoor = {
        week: 10,
        moo: 10,
        house: 12,
        data: 10 // 12 ประเภท x 2 คอลัมน์ = 24 คอลัมน์
      };

      const rowHeight = 8;
      const startX = 10;

      // วาด Header สำหรับภาชนะนอกบ้าน
      const drawOutdoorHeader = (startY) => {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.15);
        doc.setFont("Sarabun", "bold");
        doc.setFontSize(9);

        let currentX = startX;

        // แถวที่ 1: หัวตารางหลัก
        // สัปดาห์
        doc.rect(currentX, startY, colWidthsOutdoor.week, rowHeight * 2);
        doc.text("สัปดาห์", currentX + colWidthsOutdoor.week / 2, startY + rowHeight + 2, { align: "center" });
        currentX += colWidthsOutdoor.week;

        // หมู่ที่
        doc.rect(currentX, startY, colWidthsOutdoor.moo, rowHeight * 2);
        doc.text("หมู่ที่", currentX + colWidthsOutdoor.moo / 2, startY + rowHeight + 2, { align: "center" });
        currentX += colWidthsOutdoor.moo;

        // บ้านเลขที่
        doc.rect(currentX, startY, colWidthsOutdoor.house, rowHeight * 2);
        doc.text("บ้านเลขที่", currentX + colWidthsOutdoor.house / 2, startY + rowHeight + 2, { align: "center" });
        currentX += colWidthsOutdoor.house;

        // ภาชนะนอกบ้าน - Header รวม
        const outdoorWidth = colWidthsOutdoor.data * 24;
        doc.setFillColor(255, 248, 220);
        doc.rect(currentX, startY, outdoorWidth, rowHeight, 'FD');
        doc.text("จำนวนภาชนะนอกบ้าน (สำรวจ/พบลูกน้ำ)", currentX + outdoorWidth / 2, startY + 5, { align: "center" });

        // แถวที่ 2: ประเภทภาชนะ
        currentX = startX + colWidthsOutdoor.week + colWidthsOutdoor.moo + colWidthsOutdoor.house;
        outdoorContainerTypes.forEach((type) => {
          doc.rect(currentX, startY + rowHeight, colWidthsOutdoor.data * 2, rowHeight);
          doc.text(type, currentX + colWidthsOutdoor.data, startY + rowHeight + 5, { align: "center" });
          currentX += colWidthsOutdoor.data * 2;
        });

        return startY + rowHeight * 2;
      };

      // วาดแถวข้อมูลภาชนะนอกบ้าน
      const drawOutdoorDataRow = (row, currentY) => {
        doc.setFont("Sarabun", "bold");
        doc.setFontSize(9);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.15);

        let dataX = startX;

        // สัปดาห์
        doc.rect(dataX, currentY, colWidthsOutdoor.week, rowHeight);
        doc.text(row.week, dataX + colWidthsOutdoor.week / 2, currentY + 5.5, { align: "center" });
        dataX += colWidthsOutdoor.week;

        // หมู่ที่
        doc.rect(dataX, currentY, colWidthsOutdoor.moo, rowHeight);
        doc.text(row.moo, dataX + colWidthsOutdoor.moo / 2, currentY + 5.5, { align: "center" });
        dataX += colWidthsOutdoor.moo;

        // บ้านเลขที่
        doc.rect(dataX, currentY, colWidthsOutdoor.house, rowHeight);
        doc.text(row.house, dataX + colWidthsOutdoor.house / 2, currentY + 5.5, { align: "center" });
        dataX += colWidthsOutdoor.house;

        // ข้อมูลภาชนะนอกบ้าน
        const outdoorData = [
          row.outdoor_drinking_survey, row.outdoor_drinking_found,
          row.outdoor_usage_survey, row.outdoor_usage_found,
          row.outdoor_cement_survey, row.outdoor_cement_found,
          row.outdoor_antstand_survey, row.outdoor_antstand_found,
          row.outdoor_pot_survey, row.outdoor_pot_found,
          row.outdoor_pond_survey, row.outdoor_pond_found,
          row.outdoor_tire_survey, row.outdoor_tire_found,
          row.outdoor_leaf_survey, row.outdoor_leaf_found,
          row.outdoor_unused_survey, row.outdoor_unused_found,
          row.outdoor_animal_survey, row.outdoor_animal_found,
          row.outdoor_fridge_survey, row.outdoor_fridge_found,
          row.outdoor_other_survey, row.outdoor_other_found,
        ];

        outdoorData.forEach((val) => {
          doc.rect(dataX, currentY, colWidthsOutdoor.data, rowHeight);
          doc.text(String(val), dataX + colWidthsOutdoor.data / 2, currentY + 5.5, { align: "center" });
          dataX += colWidthsOutdoor.data;
        });

        return currentY + rowHeight;
      };

      // วาดแถวรวมภาชนะนอกบ้าน
      const drawOutdoorSummaryRow = (currentY) => {
        doc.setFont("Sarabun", "bold");
        doc.setFontSize(9);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.15);

        let sumX = startX;

        doc.rect(sumX, currentY, colWidthsOutdoor.week + colWidthsOutdoor.moo + colWidthsOutdoor.house, rowHeight);
        doc.text("รวมทั้งหมด", sumX + (colWidthsOutdoor.week + colWidthsOutdoor.moo + colWidthsOutdoor.house) / 2, currentY + 5.5, { align: "center" });
        sumX += colWidthsOutdoor.week + colWidthsOutdoor.moo + colWidthsOutdoor.house;

        const sumValues = [
          displayData.reduce((sum, r) => sum + r.outdoor_drinking_survey, 0),
          displayData.reduce((sum, r) => sum + r.outdoor_drinking_found, 0),
          displayData.reduce((sum, r) => sum + r.outdoor_usage_survey, 0),
          displayData.reduce((sum, r) => sum + r.outdoor_usage_found, 0),
          displayData.reduce((sum, r) => sum + r.outdoor_cement_survey, 0),
          displayData.reduce((sum, r) => sum + r.outdoor_cement_found, 0),
          displayData.reduce((sum, r) => sum + r.outdoor_antstand_survey, 0),
          displayData.reduce((sum, r) => sum + r.outdoor_antstand_found, 0),
          displayData.reduce((sum, r) => sum + r.outdoor_pot_survey, 0),
          displayData.reduce((sum, r) => sum + r.outdoor_pot_found, 0),
          displayData.reduce((sum, r) => sum + r.outdoor_pond_survey, 0),
          displayData.reduce((sum, r) => sum + r.outdoor_pond_found, 0),
          displayData.reduce((sum, r) => sum + r.outdoor_tire_survey, 0),
          displayData.reduce((sum, r) => sum + r.outdoor_tire_found, 0),
          displayData.reduce((sum, r) => sum + r.outdoor_leaf_survey, 0),
          displayData.reduce((sum, r) => sum + r.outdoor_leaf_found, 0),
          displayData.reduce((sum, r) => sum + r.outdoor_unused_survey, 0),
          displayData.reduce((sum, r) => sum + r.outdoor_unused_found, 0),
          displayData.reduce((sum, r) => sum + r.outdoor_animal_survey, 0),
          displayData.reduce((sum, r) => sum + r.outdoor_animal_found, 0),
          displayData.reduce((sum, r) => sum + r.outdoor_fridge_survey, 0),
          displayData.reduce((sum, r) => sum + r.outdoor_fridge_found, 0),
          displayData.reduce((sum, r) => sum + r.outdoor_other_survey, 0),
          displayData.reduce((sum, r) => sum + r.outdoor_other_found, 0),
        ];

        sumValues.forEach((val) => {
          doc.rect(sumX, currentY, colWidthsOutdoor.data, rowHeight);
          doc.text(String(val), sumX + colWidthsOutdoor.data / 2, currentY + 5.5, { align: "center" });
          sumX += colWidthsOutdoor.data;
        });
      };

      // ============================================
      // หน้า 2: ภาชนะในบ้าน
      // ============================================
      const colWidthsIndoor = {
        week: 10,
        moo: 10,
        house: 12,
        data: 11 // 11 ประเภท x 2 คอลัมน์ = 22 คอลัมน์
      };

      // วาด Header สำหรับภาชนะในบ้าน
      const drawIndoorHeader = (startY) => {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.15);
        doc.setFont("Sarabun", "bold");
        doc.setFontSize(9);

        let currentX = startX;

        // แถวที่ 1: หัวตารางหลัก
        // สัปดาห์
        doc.rect(currentX, startY, colWidthsIndoor.week, rowHeight * 2);
        doc.text("สัปดาห์", currentX + colWidthsIndoor.week / 2, startY + rowHeight + 2, { align: "center" });
        currentX += colWidthsIndoor.week;

        // หมู่ที่
        doc.rect(currentX, startY, colWidthsIndoor.moo, rowHeight * 2);
        doc.text("หมู่ที่", currentX + colWidthsIndoor.moo / 2, startY + rowHeight + 2, { align: "center" });
        currentX += colWidthsIndoor.moo;

        // บ้านเลขที่
        doc.rect(currentX, startY, colWidthsIndoor.house, rowHeight * 2);
        doc.text("บ้านเลขที่", currentX + colWidthsIndoor.house / 2, startY + rowHeight + 2, { align: "center" });
        currentX += colWidthsIndoor.house;

        // ภาชนะในบ้าน - Header รวม
        const indoorWidth = colWidthsIndoor.data * 22;
        doc.setFillColor(230, 240, 255);
        doc.rect(currentX, startY, indoorWidth, rowHeight, 'FD');
        doc.text("จำนวนภาชนะภายในบ้าน (สำรวจ/พบลูกน้ำ)", currentX + indoorWidth / 2, startY + 5, { align: "center" });

        // แถวที่ 2: ประเภทภาชนะ
        currentX = startX + colWidthsIndoor.week + colWidthsIndoor.moo + colWidthsIndoor.house;
        indoorContainerTypes.forEach((type) => {
          doc.rect(currentX, startY + rowHeight, colWidthsIndoor.data * 2, rowHeight);
          doc.text(type, currentX + colWidthsIndoor.data, startY + rowHeight + 5, { align: "center" });
          currentX += colWidthsIndoor.data * 2;
        });

        return startY + rowHeight * 2;
      };

      // วาดแถวข้อมูลภาชนะในบ้าน
      const drawIndoorDataRow = (row, currentY) => {
        doc.setFont("Sarabun", "bold");
        doc.setFontSize(9);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.15);

        let dataX = startX;

        // สัปดาห์
        doc.rect(dataX, currentY, colWidthsIndoor.week, rowHeight);
        doc.text(row.week, dataX + colWidthsIndoor.week / 2, currentY + 5.5, { align: "center" });
        dataX += colWidthsIndoor.week;

        // หมู่ที่
        doc.rect(dataX, currentY, colWidthsIndoor.moo, rowHeight);
        doc.text(row.moo, dataX + colWidthsIndoor.moo / 2, currentY + 5.5, { align: "center" });
        dataX += colWidthsIndoor.moo;

        // บ้านเลขที่
        doc.rect(dataX, currentY, colWidthsIndoor.house, rowHeight);
        doc.text(row.house, dataX + colWidthsIndoor.house / 2, currentY + 5.5, { align: "center" });
        dataX += colWidthsIndoor.house;

        // ข้อมูลภาชนะในบ้าน
        const indoorData = [
          row.indoor_drinking_survey, row.indoor_drinking_found,
          row.indoor_usage_survey, row.indoor_usage_found,
          row.indoor_antstand_survey, row.indoor_antstand_found,
          row.indoor_pot_survey, row.indoor_pot_found,
          row.indoor_pond_survey, row.indoor_pond_found,
          row.indoor_tire_survey, row.indoor_tire_found,
          row.indoor_leaf_survey, row.indoor_leaf_found,
          row.indoor_unused_survey, row.indoor_unused_found,
          row.indoor_animal_survey, row.indoor_animal_found,
          row.indoor_fridge_survey, row.indoor_fridge_found,
          row.indoor_other_survey, row.indoor_other_found,
        ];

        indoorData.forEach((val) => {
          doc.rect(dataX, currentY, colWidthsIndoor.data, rowHeight);
          doc.text(String(val), dataX + colWidthsIndoor.data / 2, currentY + 5.5, { align: "center" });
          dataX += colWidthsIndoor.data;
        });

        return currentY + rowHeight;
      };

      // วาดแถวรวมภาชนะในบ้าน
      const drawIndoorSummaryRow = (currentY) => {
        doc.setFont("Sarabun", "bold");
        doc.setFontSize(9);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.15);

        let sumX = startX;

        doc.rect(sumX, currentY, colWidthsIndoor.week + colWidthsIndoor.moo + colWidthsIndoor.house, rowHeight);
        doc.text("รวมทั้งหมด", sumX + (colWidthsIndoor.week + colWidthsIndoor.moo + colWidthsIndoor.house) / 2, currentY + 5.5, { align: "center" });
        sumX += colWidthsIndoor.week + colWidthsIndoor.moo + colWidthsIndoor.house;

        const sumValues = [
          displayData.reduce((sum, r) => sum + r.indoor_drinking_survey, 0),
          displayData.reduce((sum, r) => sum + r.indoor_drinking_found, 0),
          displayData.reduce((sum, r) => sum + r.indoor_usage_survey, 0),
          displayData.reduce((sum, r) => sum + r.indoor_usage_found, 0),
          displayData.reduce((sum, r) => sum + r.indoor_antstand_survey, 0),
          displayData.reduce((sum, r) => sum + r.indoor_antstand_found, 0),
          displayData.reduce((sum, r) => sum + r.indoor_pot_survey, 0),
          displayData.reduce((sum, r) => sum + r.indoor_pot_found, 0),
          displayData.reduce((sum, r) => sum + r.indoor_pond_survey, 0),
          displayData.reduce((sum, r) => sum + r.indoor_pond_found, 0),
          displayData.reduce((sum, r) => sum + r.indoor_tire_survey, 0),
          displayData.reduce((sum, r) => sum + r.indoor_tire_found, 0),
          displayData.reduce((sum, r) => sum + r.indoor_leaf_survey, 0),
          displayData.reduce((sum, r) => sum + r.indoor_leaf_found, 0),
          displayData.reduce((sum, r) => sum + r.indoor_unused_survey, 0),
          displayData.reduce((sum, r) => sum + r.indoor_unused_found, 0),
          displayData.reduce((sum, r) => sum + r.indoor_animal_survey, 0),
          displayData.reduce((sum, r) => sum + r.indoor_animal_found, 0),
          displayData.reduce((sum, r) => sum + r.indoor_fridge_survey, 0),
          displayData.reduce((sum, r) => sum + r.indoor_fridge_found, 0),
          displayData.reduce((sum, r) => sum + r.indoor_other_survey, 0),
          displayData.reduce((sum, r) => sum + r.indoor_other_found, 0),
        ];

        sumValues.forEach((val) => {
          doc.rect(sumX, currentY, colWidthsIndoor.data, rowHeight);
          doc.text(String(val), sumX + colWidthsIndoor.data / 2, currentY + 5.5, { align: "center" });
          sumX += colWidthsIndoor.data;
        });
      };

      // ============================================
      // สร้าง PDF - หน้า 1: ภาชนะนอกบ้าน
      // ============================================
      addWatermark(doc);

      // Header
      doc.setFontSize(14);
      doc.setFont("Sarabun", "bold");
      doc.text(`รายละเอียดการสำรวจลูกน้ำยุงลาย ปี ${reportYear}`, 148.5, 15, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("Sarabun", "bold");
      doc.text(`ประจำเดือน ${reportMonth}`, 148.5, 22, { align: "center" });

      let yPos = 28;
      if (responsiblePersonName) {
        doc.text(`ผู้รับผิดชอบ: ${responsiblePersonName}`, 148.5, yPos, { align: "center" });
        yPos += 6;
      }

      doc.text(name, 148.5, yPos, { align: "center" });
      yPos += 6;

      // วาดตารางภาชนะนอกบ้าน
      let currentY = drawOutdoorHeader(yPos + 2);
      displayData.forEach((row) => {
        currentY = drawOutdoorDataRow(row, currentY);
      });
      drawOutdoorSummaryRow(currentY);

      // ============================================
      // สร้าง PDF - หน้า 2: ภาชนะในบ้าน
      // ============================================
      doc.addPage();
      addWatermark(doc);

      // Header
      doc.setFontSize(14);
      doc.setFont("Sarabun", "bold");
      doc.text(`รายละเอียดการสำรวจลูกน้ำยุงลาย ปี ${reportYear}`, 148.5, 15, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("Sarabun", "bold");
      doc.text(`ประจำเดือน ${reportMonth}`, 148.5, 22, { align: "center" });

      yPos = 28;
      if (responsiblePersonName) {
        doc.text(`ผู้รับผิดชอบ: ${responsiblePersonName}`, 148.5, yPos, { align: "center" });
        yPos += 6;
      }

      doc.text(name, 148.5, yPos, { align: "center" });
      yPos += 6;

      // วาดตารางภาชนะในบ้าน
      currentY = drawIndoorHeader(yPos + 2);
      displayData.forEach((row) => {
        currentY = drawIndoorDataRow(row, currentY);
      });
      drawIndoorSummaryRow(currentY);

      // บันทึกไฟล์
      const nowMosquito = new Date();
      const dayMosquito = String(nowMosquito.getDate()).padStart(2, '0');
      const monthMosquito = String(nowMosquito.getMonth() + 1).padStart(2, '0');
      const yearMosquito = nowMosquito.getFullYear();
      const dateStrMosquito = `${dayMosquito}-${monthMosquito}-${yearMosquito}`;
      const code = osmCode || "";
      doc.save(`Mosquito_${code}_${dateStrMosquito}.pdf`);
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

      {/* Error Alert */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="text-red-800 font-semibold mb-1">เกิดข้อผิดพลาด</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition"
          >
            โหลดใหม่
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={48} className="text-[#7e32e2] animate-spin mb-4" />
          <p className="text-gray-500 font-medium">กำลังโหลดข้อมูลรายงาน...</p>
        </div>
      )}

      {/* Table PDF-style */}
      {!loading && (
      <div ref={tableRef} className="bg-white shadow-lg border border-[#f0ebff] overflow-hidden rounded-lg">
        {/* Header with Report Info and Export Button */}
        <div className="flex items-start justify-between p-6 border-b border-[#ece1f7]">
          {/* Report Info - Center aligned */}
          <div className="flex-1 text-center">
            <h2 className="font-bold text-[#231d37] text-lg mb-2">
              รายละเอียดการสำรวจลูกน้ำยุงลาย ปี {displayYear}
            </h2>
            <p className="text-gray-700 font-medium text-base mb-1">
              ประจำเดือน {displayMonth}
            </p>
            {responsiblePersonName && (
              <p className="text-gray-700 font-medium text-base mb-1">
                ผู้รับผิดชอบ: {responsiblePersonName}
              </p>
            )}
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
                  สัปดาห์
                </th>
                <th rowSpan={3} className="border border-black py-2 px-2 font-bold text-center text-[#231d37]">
                  หมู่ที่
                </th>
                <th rowSpan={3} className="border border-black py-2 px-2 font-bold text-center text-[#231d37]">
                  บ้านเลขที่
                </th>
                <th colSpan={24} className="border border-black border-r-4 border-r-orange-600 py-2 px-2 font-bold text-center text-[#231d37] bg-orange-50">
                  จำนวนภาชนะนอกบ้าน (สำรวจ/พบลูกน้ำ)
                </th>
                <th colSpan={22} className="border border-black border-r-4 border-r-blue-600 py-2 px-2 font-bold text-center text-[#231d37] bg-blue-50">
                  จำนวนภาชนะภายในบ้าน (สำรวจ/พบลูกน้ำ)
                </th>
              </tr>
              {/* Row 2: Container types */}
              <tr className="bg-white">
                {/* ภาชนะนอกบ้าน - 12 ประเภท */}
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">โอ่งน้ำดื่ม</th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">โอ่งน้ำใช้</th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">บ่อซีเมนต์</th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">ที่รองกันมด</th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">จานรองกระถาง</th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">อ่างบัว/ไม้น้ำ</th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">ยางรถยนต์เก่า</th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">กาบใบพืช</th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">ภาชนะที่ไม่ใช้</th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">น้ำเลี้ยงสัตว์</th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">ที่รองน้ำตู้เย็น/เครื่องทำน้ำเย็น</th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">ภาชนะอื่นๆ</th>
                {/* ภาชนะในบ้าน - 11 ประเภท */}
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">โอ่งน้ำดื่ม</th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">โอ่งน้ำใช้</th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">ที่รองกันมด</th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">จานรองกระถาง</th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">อ่างบัว/ไม้น้ำ</th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">ยางรถยนต์เก่า</th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">กาบใบพืช</th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">ภาชนะที่ไม่ใช้</th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">น้ำเลี้ยงสัตว์</th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">ที่รองน้ำตู้เย็น/เครื่องทำน้ำเย็น</th>
                <th colSpan={2} className="border border-black py-2 px-1 font-semibold text-center text-[#231d37]">ภาชนะอื่นๆ</th>
              </tr>
              {/* Row 3: สำรวจ/พบ */}
              <tr className="bg-white">
                {/* ภาชนะนอกบ้าน - 12 types x 2 columns */}
                {[...Array(12)].map((_, i) => (
                  <React.Fragment key={`outdoor-${i}`}>
                    <th className="border border-black py-1 px-1 font-medium text-center text-[#231d37]">สำรวจ</th>
                    <th className="border border-black py-1 px-1 font-medium text-center text-[#231d37]">พบ</th>
                  </React.Fragment>
                ))}
                {/* ภาชนะในบ้าน - 11 types x 2 columns */}
                {[...Array(11)].map((_, i) => (
                  <React.Fragment key={`indoor-${i}`}>
                    <th className="border border-black py-1 px-1 font-medium text-center text-[#231d37]">สำรวจ</th>
                    <th className="border border-black py-1 px-1 font-medium text-center text-[#231d37]">พบ</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, index) => (
                <tr key={index} className="bg-white hover:bg-[#faf8ff] transition-colors">
                  <td className="border border-black py-2 px-2 text-center text-[#231d37]">
                    {row.week}
                  </td>
                  <td className="border border-black py-2 px-2 text-center text-[#231d37]">
                    {row.moo}
                  </td>
                  <td className="border border-black py-2 px-2 text-center text-[#231d37]">
                    {row.house}
                  </td>
                  {/* ภาชนะนอกบ้าน - 12 ประเภท (รวมภาชนะอื่นๆ) */}
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_drinking_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_drinking_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_usage_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_usage_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_cement_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_cement_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_antstand_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_antstand_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_pot_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_pot_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_pond_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_pond_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_tire_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_tire_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_leaf_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_leaf_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_unused_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_unused_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_animal_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_animal_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_fridge_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_fridge_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_other_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.outdoor_other_found}</td>
                  {/* ภาชนะในบ้าน - 11 ประเภท (รวมภาชนะอื่นๆ) */}
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_drinking_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_drinking_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_usage_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_usage_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_antstand_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_antstand_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_pot_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_pot_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_pond_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_pond_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_tire_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_tire_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_leaf_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_leaf_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_unused_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_unused_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_animal_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_animal_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_fridge_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_fridge_found}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_other_survey}</td>
                  <td className="border border-black py-2 px-1 text-center text-[#231d37]">{row.indoor_other_found}</td>
                </tr>
              ))}
              {/* Summary Row */}
              <tr className="bg-[#f5f0ff] font-bold">
                <td colSpan={3} className="border border-black py-2 px-2 text-center text-[#231d37]">
                  รวมทั้งหมด
                </td>
                {/* ภาชนะนอกบ้าน - 12 ประเภท (รวมภาชนะอื่นๆ) */}
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.outdoor_drinking_survey, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.outdoor_drinking_found, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.outdoor_usage_survey, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.outdoor_usage_found, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.outdoor_cement_survey, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.outdoor_cement_found, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.outdoor_antstand_survey, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.outdoor_antstand_found, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.outdoor_pot_survey, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.outdoor_pot_found, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.outdoor_pond_survey, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.outdoor_pond_found, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.outdoor_tire_survey, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.outdoor_tire_found, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.outdoor_leaf_survey, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.outdoor_leaf_found, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.outdoor_unused_survey, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.outdoor_unused_found, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.outdoor_animal_survey, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.outdoor_animal_found, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.outdoor_fridge_survey, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.outdoor_fridge_found, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.outdoor_other_survey, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.outdoor_other_found, 0)}</td>
                {/* ภาชนะในบ้าน - 11 ประเภท (รวมภาชนะอื่นๆ) */}
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.indoor_drinking_survey, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.indoor_drinking_found, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.indoor_usage_survey, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.indoor_usage_found, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.indoor_antstand_survey, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.indoor_antstand_found, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.indoor_pot_survey, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.indoor_pot_found, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.indoor_pond_survey, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.indoor_pond_found, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.indoor_tire_survey, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.indoor_tire_found, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.indoor_leaf_survey, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.indoor_leaf_found, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.indoor_unused_survey, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.indoor_unused_found, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.indoor_animal_survey, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.indoor_animal_found, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.indoor_fridge_survey, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.indoor_fridge_found, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.indoor_other_survey, 0)}</td>
                <td className="border border-black py-2 px-1 text-center text-[#231d37]">{displayData.reduce((sum, r) => sum + r.indoor_other_found, 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
};

export default ReportMosquitoCompDetailComp;
