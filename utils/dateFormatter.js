/**
 * Thai Date Formatter Utilities
 * จัดการการแปลงวันที่เป็นรูปแบบภาษาไทย
 */

const THAI_MONTHS = [
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

/**
 * แปลงวันที่เป็นรูปแบบไทย: "25 มิถุนายน 2568"
 * @param {string|Date} dateValue - วันที่ที่ต้องการแปลง
 * @returns {string} วันที่ในรูปแบบไทย
 */
export const formatThaiDate = (dateValue) => {
  if (!dateValue) return "-";

  try {
    const date = new Date(dateValue);

    // ตรวจสอบว่าเป็น valid date หรือไม่
    if (isNaN(date.getTime())) return "-";

    const day = date.getDate();
    const month = THAI_MONTHS[date.getMonth()];
    const year = date.getFullYear() + 543; // แปลงเป็น พ.ศ.

    return `${day} ${month} ${year}`;
  } catch (error) {
    console.error("Error formatting Thai date:", error);
    return "-";
  }
};

/**
 * แปลงวันที่เป็นรูปแบบไทยพร้อมเวลา: "25 มิถุนายน 2568 14:30"
 * @param {string|Date} dateValue - วันที่ที่ต้องการแปลง
 * @returns {string} วันที่และเวลาในรูปแบบไทย
 */
export const formatThaiDateTime = (dateValue) => {
  if (!dateValue) return "-";

  try {
    const date = new Date(dateValue);

    if (isNaN(date.getTime())) return "-";

    const day = date.getDate();
    const month = THAI_MONTHS[date.getMonth()];
    const year = date.getFullYear() + 543;
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day} ${month} ${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error("Error formatting Thai datetime:", error);
    return "-";
  }
};

/**
 * แปลงวันที่เป็นรูปแบบไทยแบบสั้น: "25 มิ.ย. 68"
 * @param {string|Date} dateValue - วันที่ที่ต้องการแปลง
 * @returns {string} วันที่ในรูปแบบไทยแบบสั้น
 */
export const formatThaiDateShort = (dateValue) => {
  if (!dateValue) return "-";

  try {
    const date = new Date(dateValue);

    if (isNaN(date.getTime())) return "-";

    const THAI_MONTHS_SHORT = [
      "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
      "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];

    const day = date.getDate();
    const month = THAI_MONTHS_SHORT[date.getMonth()];
    const year = String(date.getFullYear() + 543).slice(-2); // เอาแค่ 2 หลักท้าย

    return `${day} ${month} ${year}`;
  } catch (error) {
    console.error("Error formatting Thai date short:", error);
    return "-";
  }
};

export default {
  formatThaiDate,
  formatThaiDateTime,
  formatThaiDateShort,
};
