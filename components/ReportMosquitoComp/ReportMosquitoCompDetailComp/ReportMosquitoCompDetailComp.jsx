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
    return apiReports.map((report, index) => {
      const notes = report.notes || { inside: [], outside: [] };

      // Extract data from notes
      const getContainerValue = (array, name, field) => {
        const item = array.find(item => item.name === name);
        return item ? (item[field] || 0) : 0;
      };

      return {
        no: index + 1,
        week: String(report.weekNumber),
        house: report.household?.house_number || '-',
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

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4'); // เปลี่ยนเป็น landscape (แนวนอน) เพื่อรองรับภาชนะ 11 ประเภท

      // เพิ่ม Thai font
      doc.addFileToVFS("Sarabun-Regular.ttf", SarabunFont);
      doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
      doc.addFileToVFS("Sarabun-Bold.ttf", SarabunBoldFont);
      doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
      doc.setFont("Sarabun");

      // ตั้งค่าจำนวนแถวต่อหน้า
      const ROWS_PER_PAGE = 10;
      const totalPages = Math.ceil(displayData.length / ROWS_PER_PAGE);

      // Add watermark function
      const addWatermark = (doc) => {
        const watermarkImage = "/Smart_Osm_Plus.png";
        const imgWidth = 150;
        const imgHeight = 100;

        // Landscape: 297x210
        const centerX = 297 / 2;
        const centerY = 210 / 2;

        const x = centerX - (imgWidth / 2);
        const y = centerY - (imgHeight / 2);

        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.10 }));
        doc.addImage(watermarkImage, 'PNG', x, y, imgWidth, imgHeight, '', 'NONE', 0);
        doc.restoreGraphicsState();
      };

      // Table settings - แนวนอน A4 มีความกว้าง 297mm
      const colWidths = {
        no: 6,        // ลำดับ
        week: 7,      // สัปดาห์
        house: 9,     // บ้านเลขที่
        data: 5.6     // คอลัมน์ข้อมูลแต่ละช่อง (สำรวจ/พบ) - 46 columns x 5.6 = 257.6mm
      };

      // คำนวณความกว้างตาราง: 6 + 7 + 9 + (5.6 * 46) = 279.6mm
      const tableWidth = colWidths.no + colWidths.week + colWidths.house + (colWidths.data * 46);
      const margin = (297 - tableWidth) / 2; // คำนวณ margin ให้ตารางอยู่กลาง
      const startX = margin;
      const rowHeight = 5;

      const outdoorContainerTypes = [
        "โอ่งน้ำดื่ม", "โอ่งน้ำใช้", "บ่อซีเมนต์", "รองกันมด",
        "รองกระถาง", "อ่างบัว", "ยางเก่า", "กาบพืช", "ภาชนะที่ไม่ใช้",
        "น้ำสัตว์", "รองตู้เย็น", "ภาชนะอื่นๆ"
      ]; // 12 ประเภท

      const indoorContainerTypes = [
        "โอ่งน้ำดื่ม", "โอ่งน้ำใช้", "รองกันมด",
        "รองกระถาง", "อ่างบัว", "ยางเก่า", "กาบพืช", "ภาชนะที่ไม่ใช้",
        "น้ำสัตว์", "รองตู้เย็น", "ภาชนะอื่นๆ"
      ]; // 11 ประเภท

      // ฟังก์ชันวาด Header ตาราง
      const drawTableHeader = (startY) => {
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

        // ภาชนะนอกบ้าน - 12 ประเภท x 2 คอลัมน์ = 24 คอลัมน์
        const outdoorWidth = colWidths.data * 24;
        doc.setFillColor(255, 248, 220); // สีพื้นหลังส้มอ่อน
        doc.rect(currentX, startY, outdoorWidth, rowHeight, 'FD');
        doc.setFontSize(6.5);
        doc.text("จำนวนภาชนะนอกบ้าน (สำรวจ/พบลูกน้ำ)", currentX + outdoorWidth / 2, startY + 3, { align: "center" });

        // ภาชนะในบ้าน - 11 ประเภท x 2 คอลัมน์ = 22 คอลัมน์
        const indoorWidth = colWidths.data * 22;
        doc.setFillColor(230, 240, 255); // สีพื้นหลังฟ้าอ่อน
        doc.rect(currentX + outdoorWidth, startY, indoorWidth, rowHeight, 'FD');
        doc.text("จำนวนภาชนะภายในบ้าน (สำรวจ/พบลูกน้ำ)", currentX + outdoorWidth + indoorWidth / 2, startY + 3, { align: "center" });

        // เส้นแบ่งหนาระหว่างนอกบ้านกับในบ้าน
        doc.setLineWidth(0.5);
        doc.line(currentX + outdoorWidth, startY, currentX + outdoorWidth, startY + rowHeight * 3);
        doc.setLineWidth(0.15);

        // แถวที่ 2: ประเภทภาชนะ
        doc.setFontSize(4.5);
        let containerX = startX + colWidths.no + colWidths.week + colWidths.house;

        // ภาชนะนอกบ้าน - 12 ประเภท
        outdoorContainerTypes.forEach((type) => {
          doc.rect(containerX, startY + rowHeight, colWidths.data * 2, rowHeight);
          const typeParts = doc.splitTextToSize(type, colWidths.data * 2 - 0.5);
          let typeY = startY + rowHeight + 2.5;
          typeParts.forEach((part) => {
            doc.text(part, containerX + colWidths.data, typeY, { align: "center" });
            typeY += 1.8;
          });
          containerX += colWidths.data * 2;
        });

        // ภาชนะในบ้าน - 11 ประเภท
        indoorContainerTypes.forEach((type) => {
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
        doc.setFontSize(4.5);
        let surveyX = startX + colWidths.no + colWidths.week + colWidths.house;

        // ภาชนะนอกบ้าน (12 types)
        for (let i = 0; i < 12; i++) {
          doc.rect(surveyX, startY + rowHeight * 2, colWidths.data, rowHeight);
          doc.text("สำรวจ", surveyX + colWidths.data / 2, startY + rowHeight * 2 + 3, { align: "center" });
          surveyX += colWidths.data;

          doc.rect(surveyX, startY + rowHeight * 2, colWidths.data, rowHeight);
          doc.text("พบ", surveyX + colWidths.data / 2, startY + rowHeight * 2 + 3, { align: "center" });
          surveyX += colWidths.data;
        }

        // ภาชนะในบ้าน (11 types)
        for (let i = 0; i < 11; i++) {
          doc.rect(surveyX, startY + rowHeight * 2, colWidths.data, rowHeight);
          doc.text("สำรวจ", surveyX + colWidths.data / 2, startY + rowHeight * 2 + 3, { align: "center" });
          surveyX += colWidths.data;

          doc.rect(surveyX, startY + rowHeight * 2, colWidths.data, rowHeight);
          doc.text("พบ", surveyX + colWidths.data / 2, startY + rowHeight * 2 + 3, { align: "center" });
          surveyX += colWidths.data;
        }

        return startY + rowHeight * 3;
      };

      // ฟังก์ชันวาดแถวข้อมูล
      const drawDataRow = (row, currentY) => {
        doc.setFont("Sarabun", "normal");
        doc.setFontSize(6.5);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.15);

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

        // ข้อมูลภาชนะนอกบ้าน - 12 ประเภท (รวมภาชนะอื่นๆ)
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

        // ข้อมูลภาชนะในบ้าน - 11 ประเภท (รวมภาชนะอื่นๆ)
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

        return currentY + rowHeight;
      };

      // ฟังก์ชันวาดแถวรวม
      const drawSummaryRow = (currentY) => {
        doc.setFont("Sarabun", "bold");
        doc.setFontSize(7);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.15);

        let sumX = startX;

        doc.rect(sumX, currentY, colWidths.no + colWidths.week + colWidths.house, rowHeight);
        doc.text("รวมทั้งหมด", sumX + (colWidths.no + colWidths.week + colWidths.house) / 2, currentY + 3.5, { align: "center" });
        sumX += colWidths.no + colWidths.week + colWidths.house;

        // คำนวณผลรวม - นอกบ้าน 12 ประเภท + ในบ้าน 11 ประเภท
        const sumValues = [
          // ภาชนะนอกบ้าน - 12 ประเภท (รวมภาชนะอื่นๆ)
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
          // ภาชนะในบ้าน - 11 ประเภท (รวมภาชนะอื่นๆ)
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

        doc.setFontSize(6);
        sumValues.forEach((val) => {
          doc.rect(sumX, currentY, colWidths.data, rowHeight);
          doc.text(String(val), sumX + colWidths.data / 2, currentY + 3.5, { align: "center" });
          sumX += colWidths.data;
        });
      };

      // วนลูปสร้างแต่ละหน้า
      for (let pageNum = 0; pageNum < totalPages; pageNum++) {
        // เพิ่มหน้าใหม่ถ้าไม่ใช่หน้าแรก
        if (pageNum > 0) {
          doc.addPage();
        }

        // Add watermark
        addWatermark(doc);

        // Header - Title
        doc.setFontSize(12);
        doc.setFont("Sarabun", "bold");
        doc.text(`รายละเอียดการสำรวจลูกน้ำยุงลาย ปี ${year}`, 148.5, 10, { align: "center" });

        doc.setFontSize(9);
        doc.setFont("Sarabun", "normal");
        doc.text(`ประจำเดือน ${month} ${week}`, 148.5, 16, { align: "center" });

        const nameParts = doc.splitTextToSize(name, 180);
        let yPos = 21;
        nameParts.forEach((line) => {
          doc.text(line, 148.5, yPos, { align: "center" });
          yPos += 4;
        });

        // แสดงหมายเลขหน้า
        doc.setFontSize(10);
        doc.text(`หน้า ${pageNum + 1} / ${totalPages}`, 280, 10, { align: "right" });

        // วาด Header ตาราง
        const startY = yPos + 2;
        let currentY = drawTableHeader(startY);

        // คำนวณข้อมูลสำหรับหน้านี้
        const startIndex = pageNum * ROWS_PER_PAGE;
        const endIndex = Math.min(startIndex + ROWS_PER_PAGE, displayData.length);
        const pageData = displayData.slice(startIndex, endIndex);

        // วาดแถวข้อมูลสำหรับหน้านี้
        pageData.forEach((row) => {
          currentY = drawDataRow(row, currentY);
        });

        // วาดแถวรวมเฉพาะหน้าสุดท้าย
        if (pageNum === totalPages - 1) {
          drawSummaryRow(currentY);
        }
      }

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
              {displayData.map((row) => (
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
