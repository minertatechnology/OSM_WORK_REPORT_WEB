/**
 * Fiscal Year Helper
 * จัดการปีงบประมาณไทย (1 ตุลาคม - 30 กันยายน)
 */

/**
 * แปลงวันที่เป็นปีงบประมาณ
 * ปีงบประมาณเริ่ม 1 ตุลาคม และสิ้นสุด 30 กันยายน
 *
 * @param {Date|string} date - วันที่ที่ต้องการแปลง
 * @returns {number} - ปีงบประมาณ (พ.ศ.)
 *
 * @example
 * getFiscalYear(new Date('2024-10-15')) // returns 2568 (เพราะอยู่ในช่วง 1 ต.ค. 2024 - 30 ก.ย. 2025)
 * getFiscalYear(new Date('2024-09-15')) // returns 2567 (เพราะอยู่ในช่วง 1 ต.ค. 2023 - 30 ก.ย. 2024)
 */
export const getFiscalYear = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed (0 = มกราคม)

  // ถ้าเดือนตุลาคม (9) หรือหลังจากนั้น = ปีงบประมาณปีหน้า
  // ถ้าเดือนก่อนตุลาคม (0-8) = ปีงบประมาณปีนี้
  const fiscalYearAD = month >= 9 ? year + 1 : year;

  // แปลงเป็น พ.ศ.
  return fiscalYearAD + 543;
};

/**
 * ดึงช่วงวันที่ของปีงบประมาณ
 *
 * @param {number} fiscalYear - ปีงบประมาณ (พ.ศ.)
 * @returns {Object} - { startDate, endDate, startDateStr, endDateStr }
 *
 * @example
 * getFiscalYearRange(2568)
 * // returns {
 * //   startDate: Date(2024-10-01),
 * //   endDate: Date(2025-09-30),
 * //   startDateStr: '2024-10-01',
 * //   endDateStr: '2025-09-30'
 * // }
 */
export const getFiscalYearRange = (fiscalYear) => {
  const fiscalYearAD = fiscalYear - 543;

  // ปีงบประมาณเริ่ม 1 ตุลาคม ของปีก่อนหน้า
  const startDate = new Date(fiscalYearAD - 1, 9, 1); // เดือน 9 = ตุลาคม
  // ปีงบประมาณสิ้นสุด 30 กันยายน ของปีปัจจุบัน
  const endDate = new Date(fiscalYearAD, 8, 30); // เดือน 8 = กันยายน

  return {
    startDate,
    endDate,
    startDateStr: formatDateToISO(startDate),
    endDateStr: formatDateToISO(endDate),
  };
};

/**
 * ดึงช่วงวันที่ของปีปฏิทิน
 *
 * @param {number} year - ปี (พ.ศ.)
 * @returns {Object} - { startDate, endDate, startDateStr, endDateStr }
 */
export const getCalendarYearRange = (year) => {
  const yearAD = year - 543;

  const startDate = new Date(yearAD, 0, 1); // 1 มกราคม
  const endDate = new Date(yearAD, 11, 31); // 31 ธันวาคม

  return {
    startDate,
    endDate,
    startDateStr: formatDateToISO(startDate),
    endDateStr: formatDateToISO(endDate),
  };
};

/**
 * ตรวจสอบว่าวันที่อยู่ในปีงบประมาณที่ระบุหรือไม่
 * รองรับ timezone โดยการแปลงวันที่ให้้อยู่ใน timezone ท้องถิ่นก่อนเปรียบเทียบ
 *
 * @param {Date|string} date - วันที่ที่ต้องการตรวจสอบ (ISO string หรือ Date object)
 * @param {number} fiscalYear - ปีงบประมาณ (พ.ศ.)
 * @returns {boolean}
 */
export const isInFiscalYear = (date, fiscalYear) => {
  const d = date instanceof Date ? date : new Date(date);
  const { startDate, endDate } = getFiscalYearRange(fiscalYear);

  // ปัดปัดปีเวลาออกเพื่อให้การเปรียบเทียบถูกต้อง
  // (ขจะแปลง ISO string เป็น local time โดยอัตโนมัติ)
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const startOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  return dateOnly >= startOnly && dateOnly <= endOnly;
};

/**
 * ตรวจสอบว่าวันที่อยู่ในปีปฏิทินที่ระบุหรือไม่
 * รองรับ timezone โดยการแปลงวันที่ให้้อยู่ใน timezone ท้องถิ่นก่อนเปรียบเทียบ
 *
 * @param {Date|string} date - วันที่ที่ต้องการตรวจสอบ
 * @param {number} year - ปี (พ.ศ.)
 * @returns {boolean}
 */
export const isInCalendarYear = (date, year) => {
  const d = date instanceof Date ? date : new Date(date);
  const { startDate, endDate } = getCalendarYearRange(year);

  // ปัดปัดปีเวลาออกเพื่อให้การเปรียบเทียบถูกต้อง
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const startOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  return dateOnly >= startOnly && dateOnly <= endOnly;
};

/**
 * สร้างรายการปีงบประมาณสำหรับ dropdown
 *
 * @param {number} startYear - ปีเริ่มต้น (พ.ศ.)
 * @param {number} endYear - ปีสิ้นสุด (พ.ศ.)
 * @returns {Array<{value: string, label: string}>}
 */
export const generateFiscalYearOptions = (startYear, endYear) => {
  const years = [];
  for (let year = endYear; year >= startYear; year--) {
    years.push({
      value: String(year),
      label: `${year}`,
    });
  }
  return years;
};

/**
 * สร้างรายการปีปฏิทินสำหรับ dropdown
 *
 * @param {number} startYear - ปีเริ่มต้น (พ.ศ.)
 * @param {number} endYear - ปีสิ้นสุด (พ.ศ.)
 * @returns {Array<{value: string, label: string}>}
 */
export const generateCalendarYearOptions = (startYear, endYear) => {
  return generateFiscalYearOptions(startYear, endYear);
};

/**
 * ดึงปีงบประมาณปัจจุบัน
 *
 * @returns {number} - ปีงบประมาณปัจจุบัน (พ.ศ.)
 */
export const getCurrentFiscalYear = () => {
  return getFiscalYear(new Date());
};

/**
 * ดึงปีปฏิทินปัจจุบัน
 *
 * @returns {number} - ปีปัจจุบัน (พ.ศ.)
 */
export const getCurrentCalendarYear = () => {
  const now = new Date();
  return now.getFullYear() + 543;
};

/**
 * ดึงเดือนปัจจุบัน
 *
 * @returns {string} - เดือนปัจจุบัน (01-12)
 */
export const getCurrentMonth = () => {
  const now = new Date();
  return String(now.getMonth() + 1).padStart(2, '0');
};

/**
 * ฟอร์แมตวันที่เป็น ISO string (YYYY-MM-DD)
 */
const formatDateToISO = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * กรองข้อมูลตามปีงบประมาณ
 *
 * @param {Array} data - ข้อมูลที่ต้องการกรอง
 * @param {number} fiscalYear - ปีงบประมาณ (พ.ศ.)
 * @param {string} dateField - ชื่อ field ที่เก็บวันที่ในข้อมูล
 * @returns {Array}
 */
export const filterByFiscalYear = (data, fiscalYear, dateField = 'created_at') => {
  if (!fiscalYear || !data || !Array.isArray(data)) return data;

  return data.filter(item => {
    const dateValue = item[dateField];
    if (!dateValue) return false;

    return isInFiscalYear(dateValue, fiscalYear);
  });
};

/**
 * กรองข้อมูลตามปีปฏิทิน
 *
 * @param {Array} data - ข้อมูลที่ต้องการกรอง
 * @param {number} year - ปี (พ.ศ.)
 * @param {string} dateField - ชื่อ field ที่เก็บวันที่ในข้อมูล
 * @returns {Array}
 */
export const filterByCalendarYear = (data, year, dateField = 'created_at') => {
  if (!year || !data || !Array.isArray(data)) return data;

  return data.filter(item => {
    const dateValue = item[dateField];
    if (!dateValue) return false;

    return isInCalendarYear(dateValue, year);
  });
};

/**
 * แปลงวันที่แบบไทย (พ.ศ.) เป็น Date object
 * รองรับรูปแบบ: "15 ตุลาคม 2567", "15/10/2567", "2567-10-15"
 *
 * @param {string} thaiDateStr - วันที่แบบไทย
 * @returns {Date|null}
 */
export const parseThaiDate = (thaiDateStr) => {
  if (!thaiDateStr) return null;

  try {
    // ถ้าเป็นรูปแบบ "15 ตุลาคม 2567"
    const thaiMonths = {
      'มกราคม': 0, 'กุมภาพันธ์': 1, 'มีนาคม': 2, 'เมษายน': 3,
      'พฤษภาคม': 4, 'มิถุนายน': 5, 'กรกฎาคม': 6, 'สิงหาคม': 7,
      'กันยายน': 8, 'ตุลาคม': 9, 'พฤศจิกายน': 10, 'ธันวาคม': 11,
      'ม.ค.': 0, 'ก.พ.': 1, 'มี.ค.': 2, 'เม.ย.': 3,
      'พ.ค.': 4, 'มิ.ย.': 5, 'ก.ค.': 6, 'ส.ค.': 7,
      'ก.ย.': 8, 'ต.ค.': 9, 'พ.ย.': 10, 'ธ.ค.': 11
    };

    for (const [monthName, monthIndex] of Object.entries(thaiMonths)) {
      if (thaiDateStr.includes(monthName)) {
        const parts = thaiDateStr.split(' ').filter(p => p.trim());
        const day = parseInt(parts[0]);
        const year = parseInt(parts[2]) - 543; // แปลงเป็น ค.ศ.
        return new Date(year, monthIndex, day);
      }
    }

    // ถ้าเป็นรูปแบบ "15/10/2567" หรือ "2567-10-15"
    const match = thaiDateStr.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})|(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (match) {
      if (match[1]) {
        // รูปแบบ YYYY-MM-DD
        const year = parseInt(match[1]) - 543;
        const month = parseInt(match[2]) - 1;
        const day = parseInt(match[3]);
        return new Date(year, month, day);
      } else if (match[4]) {
        // รูปแบบ DD/MM/YYYY
        const day = parseInt(match[4]);
        const month = parseInt(match[5]) - 1;
        const year = parseInt(match[6]) - 543;
        return new Date(year, month, day);
      }
    }

    return null;
  } catch (error) {
    console.error('Error parsing Thai date:', error);
    return null;
  }
};

/**
 * ตรวจสอบว่าวันที่อยู่ในเดือนที่ระบุหรือไม่
 *
 * @param {Date|string} date - วันที่ที่ต้องการตรวจสอบ
 * @param {string|number} monthValue - เดือน (01-12 หรือ 1-12)
 * @returns {boolean}
 */
export const isInMonth = (date, monthValue) => {
  if (!date || !monthValue) return true; // ถ้าไม่ได้เลือกเดือนให้ผ่านทั้งหมด

  const d = date instanceof Date ? date : new Date(date);
  const dateMonth = d.getMonth() + 1; // 1-12
  const selectedMonth = parseInt(String(monthValue)); // แปลง "01" -> 1

  return dateMonth === selectedMonth;
};

/**
 * ดึงเดือนจากวันที่
 *
 * @param {Date|string} date - วันที่
 * @returns {number} - เดือน (1-12)
 */
export const getMonthFromDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return d.getMonth() + 1; // 1-12
};

/**
 * คำนวณสัปดาห์ในเดือน (1-4 หรือ 1-5)
 * แบ่งเป็น: สัปดาห์ 1 (วันที่ 1-7), สัปดาห์ 2 (วันที่ 8-14), สัปดาห์ 3 (วันที่ 15-21), สัปดาห์ 4 (วันที่ 22+)
 *
 * @param {Date|string} date - วันที่
 * @returns {number} - สัปดาห์ในเดือน (1-4)
 */
export const getWeekOfMonth = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const dayOfMonth = d.getDate();

  if (dayOfMonth <= 7) return 1;
  if (dayOfMonth <= 14) return 2;
  if (dayOfMonth <= 21) return 3;
  return 4; // วันที่ 22 ขึ้นไป
};

/**
 * ตรวจสอบว่าวันที่อยู่ในสัปดาห์ที่ระบุของเดือนหรือไม่
 *
 * @param {Date|string} date - วันที่ที่ต้องการตรวจสอบ
 * @param {string|number} weekValue - สัปดาห์ (1-4)
 * @returns {boolean}
 */
export const isInWeekOfMonth = (date, weekValue) => {
  if (!date || !weekValue) return true; // ถ้าไม่ได้เลือกสัปดาห์ให้ผ่านทั้งหมด

  const d = date instanceof Date ? date : new Date(date);
  const weekOfMonth = getWeekOfMonth(d);
  const selectedWeek = parseInt(String(weekValue)); // แปลง "1" -> 1

  return weekOfMonth === selectedWeek;
};

/**
 * คำนวณปีที่แสดงสำหรับเดือนที่เลือก (ใช้สำหรับปีงบประมาณ)
 * ถ้าเป็นเดือน ต.ค.-ธ.ค. จะเป็นปีก่อนหน้า 1 ปี
 *
 * @param {number} fiscalYear - ปีงบประมาณ (พ.ศ.)
 * @param {string} monthValue - เดือน (01-12)
 * @returns {number} - ปีที่ควรแสดง (พ.ศ.)
 *
 * @example
 * getDisplayYearForFiscalMonth(2569, "10") // returns 2568 (ตุลาคม)
 * getDisplayYearForFiscalMonth(2569, "01") // returns 2569 (มกราคม)
 */
export const getDisplayYearForFiscalMonth = (fiscalYear, monthValue) => {
  if (!monthValue || monthValue === "0") return fiscalYear;

  const monthNum = parseInt(String(monthValue));

  // เดือน ต.ค. (10) - ธ.ค. (12) = ปีก่อนหน้า
  if (monthNum >= 10) {
    return fiscalYear - 1;
  }

  // เดือน ม.ค. (1) - ก.ย. (9) = ปีเดียวกัน
  return fiscalYear;
};

/**
 * สร้างรายการสัปดาห์สำหรับเดือนที่เลือก
 *
 * @param {number} year - ปี (พ.ศ.)
 * @param {number} month - เดือน (1-12)
 * @returns {Array<{value: string, label: string}>}
 */
export const generateWeekOptionsForMonth = (year, month) => {
  if (!year || !month) {
    // ถ้าไม่ได้เลือกปี/เดือน ให้ใช้ค่าทั่วไป
    return [
      { label: "สัปดาห์ 1", value: "1" },
      { label: "สัปดาห์ 2", value: "2" },
      { label: "สัปดาห์ 3", value: "3" },
      { label: "สัปดาห์ 4", value: "4" },
    ];
  }

  const yearAD = year - 543;
  const monthIndex = month - 1; // แปลงเป็น 0-indexed

  // หาวันสุดท้ายของเดือน
  const lastDay = new Date(yearAD, monthIndex + 1, 0).getDate();

  const weeks = [
    { label: "สัปดาห์ 1", value: "1" },
    { label: "สัปดาห์ 2", value: "2" },
    { label: "สัปดาห์ 3", value: "3" },
    { label: `สัปดาห์ 4`, value: "4" },
  ];

  return weeks;
};

export default {
  getFiscalYear,
  getFiscalYearRange,
  getCalendarYearRange,
  isInFiscalYear,
  isInCalendarYear,
  generateFiscalYearOptions,
  generateCalendarYearOptions,
  getCurrentFiscalYear,
  getCurrentCalendarYear,
  getCurrentMonth,
  filterByFiscalYear,
  filterByCalendarYear,
  parseThaiDate,
  isInMonth,
  getMonthFromDate,
  getWeekOfMonth,
  isInWeekOfMonth,
  generateWeekOptionsForMonth,
  getDisplayYearForFiscalMonth,
};
