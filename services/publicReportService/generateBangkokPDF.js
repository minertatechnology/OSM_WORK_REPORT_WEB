// Font paths
const FONT_PATH = "/fonts/";

// Cache for loaded fonts
let fontCache = null;

/**
 * Load TH Sarabun New fonts for jsPDF (only normal and bold)
 */
const loadFonts = async () => {
  if (fontCache) return fontCache;

  const fonts = {
    normal: `${FONT_PATH}THSarabunNew.ttf`,
    bold: `${FONT_PATH}THSarabunNewBold.ttf`,
  };

  const loadFont = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load font: ${url}`);
    const arrayBuffer = await response.arrayBuffer();
    // Convert ArrayBuffer to base64
    let binary = "";
    const bytes = new Uint8Array(arrayBuffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  try {
    const [normal, bold] = await Promise.all([
      loadFont(fonts.normal),
      loadFont(fonts.bold),
    ]);

    fontCache = { normal, bold };
    return fontCache;
  } catch (error) {
    console.error("Error loading fonts:", error);
    return null;
  }
};

// Thai month names
const THAI_MONTHS = [
  "",
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

// Shared CSS styles
const getStyles = (forPrint = true) => `
    ${forPrint ? `@page { size: A4 portrait; margin: 15mm; }` : ""}
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
    }
    body {
      font-family: 'TH Sarabun New', 'Sarabun', Tahoma, sans-serif;
      font-size: 16px;
      line-height: 1.5;
      padding: 15px;
    }
    .header { text-align: center; margin-bottom: 20px; }
    .header h2 { margin: 0; font-size: 20px; font-weight: bold; }
    .header p { margin: 5px 0 0 0; font-size: 16px; }
    .info-row { margin-bottom: 8px; }
    .section { margin-bottom: 15px; }
    .section-title { font-weight: bold; margin-bottom: 5px; }
    .section-content { padding-left: 20px; }
    .item { margin-bottom: 5px; }
    .sub-item { padding-left: 20px; }
`;

/**
 * Get HTML body content for Page 1 (Sections 1-6)
 */
const getPage1Body = (monthLabel, yearLabel) => `
  <div class="header">
    <h2>แบบรายงานผลการปฏิบัติงานอาสาสมัครสาธารณสุขกรุงเทพมหานคร</h2>
    <p>ประจำเดือน ${monthLabel} พ.ศ. ${yearLabel}</p>
  </div>

  <div class="info-row">
    <strong>ชื่อ - สกุล อสม.</strong> ......................................................................................................................................................................................................
  </div>
  <div class="info-row">
    <strong>ชุมชน</strong> .................................... <strong>แขวง</strong> .................................... <strong>เขต</strong> ................................... <strong>กทม.</strong> <strong>ศบส.</strong> ....................................
  </div>

  <div class="section">
    <div class="section-title">๑. การดูแลหญิงตั้งครรภ์</div>
    <div class="section-content">
      <div class="item" style="display: flex; justify-content: space-between;"><span>๑.๑ จำนวนหญิงตั้งครรภ์ในพื้นที่รับผิดชอบ ...................................................................................................................</span> <span>คน</span></div>
      <div class="item" style="display: flex; justify-content: space-between;"><span>๑.๒ ให้คำแนะนำหญิงตั้งครรภ์ในการปฏิบัติตัว ..............................................................................................................</span> <span>คน</span></div>
      <div class="item" style="display: flex; justify-content: space-between;"><span>๑.๓ จำนวนหญิงตั้งครรภ์ (รายใหม่) อายุมากกว่า ๒๐ ปี ................. คน อายุต่ำกว่า ๒๐ ปี .............................................</span> <span>คน</span></div>
      <div class="item" style="display: flex; justify-content: space-between;"><span>๑.๔ หญิงตั้งครรภ์รายใหม่ฝากครรภ์ครั้งแรกก่อนหรือเท่ากับ ๑๒ สัปดาห์ ......................................................................</span> <span>คน</span></div>
      <div class="item" style="display: flex; justify-content: space-between;"><span>๑.๕ ส่งต่อหญิงตั้งครรภ์ที่มีอาการผิดปกติไปยังสถานบริการสาธารณสุข ........................................................................</span> <span>คน</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">๒. การดูแลหญิงหลังคลอด</div>
    <div class="section-content">
      <div class="item" style="display: flex; justify-content: space-between;"><span>๒.๑ จำนวนหญิงหลังคลอดในพื้นที่รับผิดชอบ ................................................................................................................</span> <span>คน</span></div>
      <div class="item" style="display: flex; justify-content: space-between;"><span>๒.๒ เยี่ยมและให้คำแนะนำหญิงหลังคลอด .....................................................................................................................</span> <span>คน</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">๓. การดูแลเด็กแรกเกิด - ๖ ปี <span style="font-weight: normal;">(จำนวนเด็กแรกเกิด ๖ เดือน ............ คน จำนวนเด็กแรกเกิด - ๖ ปี............คน)</span></div>
    <div class="section-content">
      <div class="item" style="display: flex; justify-content: space-between;"><span>๓.๑ เลี้ยงลูกด้วยนมแม่อย่างเดียว (เด็กแรกเกิด - ๖ เดือน) .............................................................................................</span> <span>คน</span></div>
      <div class="item" style="display: flex; justify-content: space-between;"><span>๓.๒ ส่งเสริมการเล่านิทานให้เด็กแรกเกิด - ๖ ปี ..............................................................................................................</span> <span>คน</span></div>
      <div class="item" style="display: flex; justify-content: space-between;"><span>๓.๓ จำนวนเด็กแรกเกิด - ๖ ปี ที่มีพัฒนาการไม่สมวัย.....................................................................................................</span> <span>คน</span></div>
      <div class="item" style="display: flex; justify-content: flex-end;"><span>ให้คำแนะนำในการเลี้ยงดู ....................................................................... </span> <span> คน</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">๔. การให้คำแนะนำเรื่องการสื่อสารสุขภาวะทางเพศ</div>
    <div class="section-content">
      <div class="item" style="display: flex; justify-content: space-between;"><span>๔.๑ จำนวนครัวเรือนที่มีบัตรหลานเป็นวัยรุ่น (อายุ ๑๐ - ๑๙ ปี)............................................................................</span> <span>ครัวเรือน</span></div>
      <div class="item" style="display: flex; justify-content: space-between;"><span>๔.๒ จำนวนผู้ปกครองที่ดูแลบัตรหลานเป็นวัยรุ่น (อายุ ๑๐ - ๑๙ ปี) ..............................................................................</span> <span>คน</span></div>
      <div class="item" style="display: flex; justify-content: space-between;"><span>๔.๓ จำนวนวัยรุ่น (อายุ ๑๐ - ๑๙ ปี) ..............................................................................................................................</span> <span>คน</span></div>
      <div class="item" style="display: flex; justify-content: space-between;"><span>๔.๔ จำนวนผู้ปกครองที่ อสส. แนะนำช่องทาง หรือสื่อในการสื่อสารสุขภาวะทางเพศ ....................................................</span> <span>คน</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">๕. การดูแลผู้สูงอายุ</div>
    <div class="section-content">
      <div class="item" style="display: flex; justify-content: space-between;"><span>๕.๑ จำนวนผู้สูงอายุในพื้นที่รับผิดชอบ .....................................คน ป่วยเป็นโรคไม่ติดต่อเรื้อรัง.....................................</span> <span>คน</span></div>
      <div class="item" style="display: flex; justify-content: space-between;"><span>๕.๒ จำนวนผู้สูงอายุ สุขภาพกลุ่มที่ ๑.............................คน กลุ่มที่ ๒.............................คน กลุ่มที่ ๓............................</span> <span>คน</span></div>
      <div class="item" style="display: flex; justify-content: space-between;"><span>๕.๓ เยี่ยมบ้านและให้คำแนะนำเรื่องการดูแลสุขภาพผู้สูงอายุ..........................................คน ........................................</span> <span>ครั้ง</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">๖. การดูแลคนพิการ</div>
    <div class="section-content">
      <div class="item" style="display: flex; justify-content: space-between;"><span>๖.๑ จำนวนคนพิการในพื้นที่รับผิดชอบ ........................................................................................................................</span> <span>คน</span></div>
      <div class="item" style="display: flex; justify-content: space-between;"><span>๖.๒ เยี่ยมบ้านและให้คำแนะนำเรื่องการดูแลสุขภาพคนพิการ ....................................... คน .......................................</span> <span>ครั้ง</span></div>
      <div class="item" style="display: flex; justify-content: space-between;"><span>๖.๓ ทำกิจกรรมให้การสนับสนุนคนพิการ .............................................................. คน ................................................</span> <span>ครั้ง</span></div>
      <div class="item" style="display: flex; justify-content: space-between;"><span>๖.๔ จำนวนคนพิการรายใหม่ที่ได้รับการขึ้นทะเบียน .....................................................................................................</span> <span>คน</span></div>
    </div>
  </div>
`;

/**
 * Get HTML body content for Page 2 (Sections 7-12 + Signatures)
 */
const getPage2Body = (monthLabel, yearLabel) => `
  <div class="header" style="margin-top: 0;">
    <h2>แบบรายงานผลการปฏิบัติงานอาสาสมัครสาธารณสุขกรุงเทพมหานคร</h2>
    <p>ประจำเดือน ${monthLabel} พ.ศ. ${yearLabel}</p>
  </div>

  <div class="section">
    <div class="section-title">๗. การเฝ้าระวัง ป้องกัน และควบคุมโรค</div>
    <div class="section-content">
      <div class="item" style="display: flex; justify-content: space-between;"><span>๗.๑ เฝ้าระวัง ป้องกัน และควบคุมโรคไข้เลือดออก...............................................................................................</span> <span>ครัวเรือน</span></div>
      <div class="item" style="display: flex; justify-content: space-between;"><span>๗.๒ เฝ้าระวัง ป้องกัน และควบคุมโรคไข้หวัดใหญ่................................................................................................</span> <span>ครัวเรือน</span></div>
      <div class="item" style="display: flex; justify-content: space-between;"><span>๗.๓ เฝ้าระวัง คัดกรอง และให้คำแนะนำกลุ่มเสี่ยงโรคไม่ติดต่อเรื้อรัง ...................................................................</span> <span>ครัวเรือน</span></div>
      <div class="item" style="display: flex; justify-content: space-between;"><span>๗.๔ เฝ้าระวัง คัดกรอง และค้นหากลุ่มเสี่ยงด้านสุขภาพจิต ..................................................................................</span> <span>ครัวเรือน</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">๘. การจัดการสุขภาพชุมชนและการมีส่วนร่วมในแผนสุขภาพตำบล</div>
    <div class="section-content">
      <div class="item" style="display: flex; justify-content: space-between;"><span>๘.๑ เยี่ยมบ้าน ให้คำแนะนำการดูแลผู้ป่วยโรคไม่ติดต่อเรื้อรัง (ทุกกลุ่มอายุ)..................................................................</span> <span>ครั้ง</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">๙. การปฏิบัติงานชวนผู้สูบบุหรี่/บุหรี่ไฟฟ้าให้เลิกสูบ</div>
    <div class="section-content">
      <div class="item" style="display: flex; justify-content: space-between;"><span>๙.๑ เชิญชวนผู้สูบบุหรี่/บุหรี่ไฟฟ้าให้เลิกสูบบุหรี่ จำนวน................................................................................................</span> <span>คน</span></div>
      <div class="item" style="display: flex; justify-content: space-between;"><span>๙.๒ ผู้สูบบุหรี่/บุหรี่ไฟฟ้าที่เลิกสูบได้ (อย่างน้อย ๖ เดือน) จำนวน..................................................................................</span> <span>คน</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">๑๐. การเข้าร่วมกับทีมหมอครอบครัว</div>
    <div class="section-content">
      <div class="item" style="display: flex; justify-content: space-between;"><span>๑๐.๑ จำนวน อสค. ที่ได้รับมอบหมายให้ดูแล..................................................................................................................</span> <span>คน</span></div>
      <div class="item">๑๐.๒ ติดตามให้คำแนะนำ อสค. ในการดูแล อาหาร/ออกกำลังกาย/วิธีปฏิบัติการดูแล/การพยาบาล/การส่งต่อผู้ป่วยในครอบครัว</div>
      <div class="sub-item" style="display: flex; justify-content: space-between;"><span>(๑) กลุ่มผู้สูงอายุที่มีปัญหาติดบ้าน ติดเตียง................................................................................................................</span> <span>คน</span></div>
      <div class="sub-item" style="display: flex; justify-content: space-between;"><span>(๒) กลุ่มผู้ป่วยโรคไม่ติดต่อเรื้อรัง...............................................................................................................................</span> <span>คน</span></div>
      <div class="sub-item" style="display: flex; justify-content: space-between;"><span>(๓) กลุ่มที่มีปัญหาโรคไต............................................................................................................................................</span> <span>คน</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">๑๑. การเข้าร่วมทีมหมอครอบครัว</div>
    <div class="section-content">
      <div class="item" style="display: flex; justify-content: space-between;"><span>๑๑.๑ ร่วมเป็นทีมหมอครอบครัว ในการช่วยเหลือดูแลผู้ป่วย และครอบครัวในชุมชน....................................................</span> <span>ครั้ง</span></div>
      <div class="item" style="display: flex; justify-content: space-between;"><span>๑๑.๒ ช่วยปรับปรุงที่อยู่อาศัย และสิ่งแวดล้อมให้เอื้อต่อการดูแล/การพยาบาล.....................................................</span> <span>ครัวเรือน</span></div>
      <div class="item" style="display: flex; justify-content: space-between;"><span>๑๑.๓ เสริมพลังและกำลังใจ และเทคนิคการดูแล การพยาบาลตามปัญหาสุขภาพ................................................</span> <span>ครัวเรือน</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">๑๒. งานอื่น ๆ ตามสภาพปัญหาชุมชน</div>
    <div class="section-content">
      <div class="item">.............................................................................................................................................................................................</div>
      <div class="item">.............................................................................................................................................................................................</div>
    </div>
  </div>

  <div style="display: flex; justify-content: flex-end; margin-top: 30px;">
    <div style="text-align: center;">
      <div>ลงชื่อ (อสส.)...................................................ผู้รายงาน</div>
      <div>(....................................................)</div>
      <div>ผู้รายงาน</div>
    </div>
  </div>

  <div style="display: flex; justify-content: space-between; margin-top: 40px;">
    <div style="text-align: center;">
      <div>ลงชื่อ....................................................ผู้รับรอง</div>
      <div>(....................................................)</div>
      <div>เจ้าหน้าที่สาธารณสุข</div>
    </div>
    <div style="text-align: center;">
      <div>ลงชื่อ....................................................ผู้รับรอง</div>
      <div>(....................................................)</div>
      <div>ประธานชมนมอาสาสมัครสาธารณสุขกรุงเทพมหานคร</div>
      <div>ระดับศูนย์บริการสาธารณสุข</div>
    </div>
  </div>
`;

/**
 * Get complete HTML document for Bangkok Report
 * @param {Object} filters - Filter object containing month and fiscalYear
 * @returns {string} Complete HTML document
 */
const getBangkokReportHTML = (filters = {}) => {
  const monthLabel = filters.month
    ? THAI_MONTHS[parseInt(filters.month)]
    : ".....................................................";
  const yearLabel = "....................";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>แบบรายงานผลการปฏิบัติงานอาสาสมัครสาธารณสุขกรุงเทพมหานคร</title>
  <style>${getStyles(true)}</style>
</head>
<body>
${getPage1Body(monthLabel, yearLabel)}
  <div style="page-break-before: always;"></div>
${getPage2Body(monthLabel, yearLabel)}
</body>
</html>`;
};

/**
 * Generate Bangkok PDF Report using print dialog (supports Thai fonts natively)
 * @param {Object} filters - Filter object containing month and fiscalYear
 * @param {string} filters.month - Month number (1-12)
 * @param {string} filters.fiscalYear - Fiscal year (Buddhist era)
 */
const generateBangkokPDF = (filters = {}) => {
  const printContent = getBangkokReportHTML(filters);

  // Open print window
  const printWindow = window.open("", "_blank", "width=800,height=600");
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = function () {
      printWindow.print();
    };
  } else {
    alert("กรุณาอนุญาต popup เพื่อเปิดหน้าพิมพ์รายงาน");
  }
};

/**
 * Download Bangkok PDF Report - Direct download using jspdf with TH Sarabun New font
 * @param {Object} filters - Filter object containing month and fiscalYear
 * @param {string} filters.month - Month number (1-12)
 * @param {string} filters.fiscalYear - Fiscal year (Buddhist era)
 */
const downloadBangkokPDF = async (filters = {}) => {
  // Dynamic import
  const { jsPDF } = await import("jspdf");

  // Generate filename
  const monthLabel = filters.month
    ? THAI_MONTHS[parseInt(filters.month)]
    : "report";
  const filename = `รายงานอสม.กรุงเทพ_${monthLabel}.pdf`;

  // Get month/year for content
  const monthLabelText = filters.month
    ? THAI_MONTHS[parseInt(filters.month)]
    : ".....................................................";
  const yearLabelText = "....................";

  try {
    // Load fonts
    const fonts = await loadFonts();

    // Warn if fonts failed to load
    if (!fonts) {
      console.warn("Failed to load Thai fonts, PDF will use fallback font");
    }

    // Create PDF - A4 size
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Add fonts to jsPDF
    if (fonts) {
      pdf.addFileToVFS("THSarabunNew.ttf", fonts.normal);
      pdf.addFileToVFS("THSarabunNewBold.ttf", fonts.bold);
      pdf.addFont("THSarabunNew.ttf", "THSarabunNew", "normal");
      pdf.addFont("THSarabunNewBold.ttf", "THSarabunNew", "bold");
    }

    // Helper function to set font (with fallback)
    const setFont = (bold = false) => {
      if (fonts) {
        pdf.setFont("THSarabunNew", bold ? "bold" : "normal");
      } else {
        // Fallback to helvetica (default jsPDF font)
        pdf.setFont("helvetica", bold ? "bold" : "normal");
      }
    };

    // Page dimensions
    const pageWidth = 210;
    const margin = 15;

    // Helper function to add text with right-aligned unit
    const addLineWithUnit = (text, y, unit, bold = false) => {
      pdf.setFontSize(16);
      setFont(bold);
      pdf.text(text, margin, y);
      pdf.text(unit, pageWidth - margin, y, { align: "right" });
    };

    let y = margin + 10;

    // ===== PAGE 1 =====

    // Header
    pdf.setFontSize(20);
    setFont(true);
    pdf.text(
      "แบบรายงานผลการปฏิบัติงานอาสาสมัครสาธารณสุขกรุงเทพมหานคร",
      pageWidth / 2,
      y,
      { align: "center" },
    );
    y += 10;
    pdf.setFontSize(16);
    setFont(false);
    pdf.text(
      `ประจำเดือน ${monthLabelText} พ.ศ. ${yearLabelText}`,
      pageWidth / 2,
      y,
      { align: "center" },
    );
    y += 12;

    // Info rows
    pdf.setFontSize(16);
    setFont(false);
    pdf.text(
      "ชื่อ - สกุล อสม. .........................................................................................................................................................................",
      margin,
      y,
    );
    y += 8;
    pdf.text(
      "ชุมชน .................................... แขวง .................................... เขต ................................... กทม. ศบส. ....................................",
      margin,
      y,
    );
    y += 12;

    // Section 1
    pdf.setFontSize(16);
    setFont(true);
    pdf.text("๑. การดูแลหญิงตั้งครรภ์", margin, y);
    setFont(false);
    y += 8;

    addLineWithUnit(
      "    ๑.๑ จำนวนหญิงตั้งครรภ์ในพื้นที่รับผิดชอบ ...................................................................................................................",
      y,
      "คน",
    );
    y += 7;
    addLineWithUnit(
      "    ๑.๒ ให้คำแนะนำหญิงตั้งครรภ์ในการปฏิบัติตัว ..............................................................................................................",
      y,
      "คน",
    );
    y += 7;
    addLineWithUnit(
      "    ๑.๓ จำนวนหญิงตั้งครรภ์ (รายใหม่) อายุมากกว่า ๒๐ ปี ............................. คน อายุต่ำกว่า ๒๐ ปี ...............................",
      y,
      "คน",
    );
    y += 7;
    addLineWithUnit(
      "    ๑.๔ หญิงตั้งครรภ์รายใหม่ฝากครรภ์ครั้งแรกก่อนหรือเท่ากับ ๑๒ สัปดาห์ ....................................................................",
      y,
      "คน",
    );
    y += 7;
    addLineWithUnit(
      "    ๑.๕ ส่งต่อหญิงตั้งครรภ์ที่มีอาการผิดปกติไปยังสถานบริการสาธารณสุข ........................................................................",
      y,
      "คน",
    );
    y += 10;

    // Section 2
    setFont(true);
    pdf.text("๒. การดูแลหญิงหลังคลอด", margin, y);
    setFont(false);
    y += 8;

    addLineWithUnit(
      "    ๒.๑ จำนวนหญิงหลังคลอดในพื้นที่รับผิดชอบ ................................................................................................................",
      y,
      "คน",
    );
    y += 7;
    addLineWithUnit(
      "    ๒.๒ เยี่ยมและให้คำแนะนำหญิงหลังคลอด .....................................................................................................................",
      y,
      "คน",
    );
    y += 10;

    // Section 3
    setFont(true);
    pdf.text(
      "๓. การดูแลเด็กแรกเกิด - ๖ ปี (จำนวนเด็กแรกเกิด ๖ เดือน ............ คน จำนวนเด็กแรกเกิด - ๖ ปี ............ คน)",
      margin,
      y,
    );
    setFont(false);
    y += 8;

    addLineWithUnit(
      "    ๓.๑ เลี้ยงลูกด้วยนมแม่อย่างเดียว (เด็กแรกเกิด - ๖ เดือน) .............................................................................................",
      y,
      "คน",
    );
    y += 7;
    addLineWithUnit(
      "    ๓.๒ ส่งเสริมการเล่านิทานให้เด็กแรกเกิด - ๖ ปี ..............................................................................................................",
      y,
      "คน",
    );
    y += 7;
    addLineWithUnit(
      "    ๓.๓ จำนวนเด็กแรกเกิด - ๖ ปี ที่มีพัฒนาการไม่สมวัย ....................................................................................................",
      y,
      "คน",
    );
    y += 7;
    pdf.text(
      "                ให้คำแนะนำในการเลี้ยงดู ........................................................................................................... ",
      margin + 20,
      y,
    );
    pdf.text("คน", pageWidth - margin, y, { align: "right" });
    y += 10;

    // Section 4
    setFont(true);
    pdf.text("๔. การให้คำแนะนำเรื่องการสื่อสารสุขภาวะทางเพศ", margin, y);
    setFont(false);
    y += 8;

    addLineWithUnit(
      "    ๔.๑ จำนวนครัวเรือนที่มีบัตรหลานเป็นวัยรุ่น (อายุ ๑๐ - ๑๙ ปี) .........................................................................",
      y,
      "ครัวเรือน",
    );
    y += 7;
    addLineWithUnit(
      "    ๔.๒ จำนวนผู้ปกครองที่ดูแลบัตรหลานเป็นวัยรุ่น (อายุ ๑๐ - ๑๙ ปี) ............................................................................",
      y,
      "คน",
    );
    y += 7;
    addLineWithUnit(
      "    ๔.๓ จำนวนวัยรุ่น (อายุ ๑๐ - ๑๙ ปี) .............................................................................................................................",
      y,
      "คน",
    );
    y += 7;
    addLineWithUnit(
      "    ๔.๔ จำนวนผู้ปกครองที่ อสส. แนะนำช่องทาง หรือสื่อในการสื่อสารสุขภาวะทางเพศ ..................................................",
      y,
      "คน",
    );
    y += 10;

    // Section 5
    setFont(true);
    pdf.text("๕. การดูแลผู้สูงอายุ", margin, y);
    setFont(false);
    y += 8;

    addLineWithUnit(
      "    ๕.๑ จำนวนผู้สูงอายุในพื้นที่รับผิดชอบ ...........................................คน ป่วยเป็นโรคไม่ติดต่อเรื้อรัง ...............................",
      y,
      "คน",
    );
    y += 7;
    addLineWithUnit(
      "    ๕.๒ จำนวนผู้สูงอายุ สุขภาพกลุ่มที่ ๑ ........................... คน กลุ่มที่ ๒ ........................... คน กลุ่มที่ ๓ .......................",
      y,
      "คน",
    );
    y += 7;
    addLineWithUnit(
      "    ๕.๓ เยี่ยมบ้านและให้คำแนะนำเรื่องการดูแลสุขภาพผู้สูงอายุ ........................................... คน ....................................",
      y,
      "ครั้ง",
    );
    y += 10;

    // Section 6
    setFont(true);
    pdf.text("๖. การดูแลคนพิการ", margin, y);
    setFont(false);
    y += 8;

    addLineWithUnit(
      "    ๖.๑ จำนวนคนพิการในพื้นที่รับผิดชอบ ..........................................................................................................................",
      y,
      "คน",
    );
    y += 7;
    addLineWithUnit(
      "    ๖.๒ เยี่ยมบ้านและให้คำแนะนำเรื่องการดูแลสุขภาพคนพิการ ....................................... คน ........................................",
      y,
      "ครั้ง",
    );
    y += 7;
    addLineWithUnit(
      "    ๖.๓ ทำกิจกรรมให้การสนับสนุนคนพิการ .................................................................... คน ...........................................",
      y,
      "ครั้ง",
    );
    y += 7;
    addLineWithUnit(
      "    ๖.๔ จำนวนคนพิการรายใหม่ที่ได้รับการขึ้นทะเบียน .......................................................................................................",
      y,
      "คน",
    );

    // ===== PAGE 2 =====
    pdf.addPage();
    y = margin + 10;

    // Header
    pdf.setFontSize(20);
    setFont(true);
    pdf.text(
      "แบบรายงานผลการปฏิบัติงานอาสาสมัครสาธารณสุขกรุงเทพมหานคร",
      pageWidth / 2,
      y,
      { align: "center" },
    );
    y += 10;
    pdf.setFontSize(16);
    setFont(false);
    pdf.text(
      `ประจำเดือน ${monthLabelText} พ.ศ. ${yearLabelText}`,
      pageWidth / 2,
      y,
      { align: "center" },
    );
    y += 12;

    // Section 7
    pdf.setFontSize(16);
    setFont(true);
    pdf.text("๗. การเฝ้าระวัง ป้องกัน และควบคุมโรค", margin, y);
    setFont(false);
    y += 8;

    addLineWithUnit(
      "    ๗.๑ เฝ้าระวัง ป้องกัน และควบคุมโรคไข้เลือดออก ...............................................................................................",
      y,
      "ครัวเรือน",
    );
    y += 7;
    addLineWithUnit(
      "    ๗.๒ เฝ้าระวัง ป้องกัน และควบคุมโรคไข้หวัดใหญ่ ................................................................................................",
      y,
      "ครัวเรือน",
    );
    y += 7;
    addLineWithUnit(
      "    ๗.๓ เฝ้าระวัง คัดกรอง และให้คำแนะนำกลุ่มเสี่ยงโรคไม่ติดต่อเรื้อรัง ...................................................................",
      y,
      "ครัวเรือน",
    );
    y += 7;
    addLineWithUnit(
      "    ๗.๔ เฝ้าระวัง คัดกรอง และค้นหากลุ่มเสี่ยงด้านสุขภาพจิต ..................................................................................",
      y,
      "ครัวเรือน",
    );
    y += 10;

    // Section 8
    setFont(true);
    pdf.text(
      "๘. การจัดการสุขภาพชุมชนและการมีส่วนร่วมในแผนสุขภาพตำบล",
      margin,
      y,
    );
    setFont(false);
    y += 8;

    addLineWithUnit(
      "    ๘.๑ เยี่ยมบ้าน ให้คำแนะนำการดูแลผู้ป่วยโรคไม่ติดต่อเรื้อรัง (ทุกกลุ่มอายุ) .................................................................",
      y,
      "ครั้ง",
    );
    y += 10;

    // Section 9
    setFont(true);
    pdf.text(
      "๙. การปฏิบัติงานชวนผู้สูบบุหรี่/บุหรี่ไฟฟ้าให้เลิกสูบ",
      margin,
      y,
    );
    setFont(false);
    y += 8;

    addLineWithUnit(
      "    ๙.๑ เชิญชวนผู้สูบบุหรี่/บุหรี่ไฟฟ้าให้เลิกสูบบุหรี่ จำนวน .............................................................................................",
      y,
      "คน",
    );
    y += 7;
    addLineWithUnit(
      "    ๙.๒ ผู้สูบบุหรี่/บุหรี่ไฟฟ้าที่เลิกสูบได้ (อย่างน้อย ๖ เดือน) จำนวน ..............................................................................",
      y,
      "คน",
    );
    y += 10;

    // Section 10
    setFont(true);
    pdf.text("๑๐. การเข้าร่วมกับทีมหมอครอบครัว", margin, y);
    setFont(false);
    y += 8;

    addLineWithUnit(
      "    ๑๐.๑ จำนวน อสค. ที่ได้รับมอบหมายให้ดูแล ...............................................................................................................",
      y,
      "คน",
    );
    y += 7;
    pdf.text(
      "    ๑๐.๒ ติดตามให้คำแนะนำ อสค. ในการดูแล อาหาร/ออกกำลังกาย/วิธีปฏิบัติการดูแล/การพยาบาล/การส่งต่อผู้ป่วย",
      margin,
      y,
    );
    y += 7;
    pdf.text("        ในครอบครัว", margin, y);
    y += 7;
    addLineWithUnit(
      "        (๑) กลุ่มผู้สูงอายุที่มีปัญหาติดบ้าน ติดเตียง ...............................................................................................................",
      y,
      "คน",
    );
    y += 7;
    addLineWithUnit(
      "        (๒) กลุ่มผู้ป่วยโรคไม่ติดต่อเรื้อรัง ...............................................................................................................................",
      y,
      "คน",
    );
    y += 7;
    addLineWithUnit(
      "        (๓) กลุ่มที่มีปัญหาโรคไต ..........................................................................................................................................",
      y,
      "คน",
    );
    y += 10;

    // Section 11
    setFont(true);
    pdf.text("๑๑. การเข้าร่วมทีมหมอครอบครัว", margin, y);
    setFont(false);
    y += 8;

    addLineWithUnit(
      "    ๑๑.๑ ร่วมเป็นทีมหมอครอบครัว ในการช่วยเหลือดูแลผู้ป่วย และครอบครัวในชุมชน ..................................................",
      y,
      "ครั้ง",
    );
    y += 7;
    addLineWithUnit(
      "    ๑๑.๒ ช่วยปรับปรุงที่อยู่อาศัย และสิ่งแวดล้อมให้เอื้อต่อการดูแล/การพยาบาล ..................................................",
      y,
      "ครัวเรือน",
    );
    y += 7;
    addLineWithUnit(
      "    ๑๑.๓ เสริมพลังและกำลังใจ และเทคนิคการดูแล การพยาบาลตามปัญหาสุขภาพ ..............................................",
      y,
      "ครัวเรือน",
    );
    y += 10;

    // Section 12
    setFont(true);
    pdf.text("๑๒. งานอื่น ๆ ตามสภาพปัญหาชุมชน", margin, y);
    setFont(false);
    y += 8;

    pdf.text(
      "    .............................................................................................................................................................................................",
      margin,
      y,
    );
    y += 7;
    pdf.text(
      "    .............................................................................................................................................................................................",
      margin,
      y,
    );
    y += 20;

    // Signature - Reporter (right aligned)
    pdf.text(
      "ลงชื่อ (อสส.) ................................................... ผู้รายงาน",
      pageWidth - margin,
      y,
      { align: "right" },
    );
    y += 7;
    pdf.text(
      "(....................................................)",
      pageWidth - margin - 13,
      y,
      { align: "right" },
    );
    y += 7;

    y += 8;

    // Signatures - Left and Right
    const leftX = margin + 40;
    const rightX = pageWidth - margin - 40;

    // Left signature
    const sigY = y;
    pdf.text(
      "ลงชื่อ .................................................... ผู้รับรอง",
      leftX,
      sigY,
      { align: "center" },
    );
    pdf.text(
      "(....................................................)",
      leftX,
      sigY + 7,
      { align: "center" },
    );
    pdf.text("เจ้าหน้าที่สาธารณสุข", leftX, sigY + 14, { align: "center" });

    // Right signature
    pdf.text(
      "ลงชื่อ .................................................... ผู้รับรอง",
      rightX,
      sigY,
      { align: "center" },
    );
    pdf.text(
      "(....................................................)",
      rightX,
      sigY + 7,
      { align: "center" },
    );
    pdf.text("ประธานชมนมอาสาสมัครสาธารณสุขกรุงเทพมหานคร", rightX, sigY + 14, {
      align: "center",
    });
    pdf.text("ระดับศูนย์บริการสาธารณสุข", rightX, sigY + 21, { align: "center" });

    // Download
    pdf.save(filename);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("เกิดข้อผิดพลาดในการสร้าง PDF กรุณาลองใหม่อีกครั้ง");
  }
};

export { generateBangkokPDF, downloadBangkokPDF };
export default generateBangkokPDF;
