import Cookies from "js-cookie";

/**
 * ดึง token จากหลายแหล่ง (cookies, localStorage)
 * @returns {string|null} token ที่หาเจอ
 */
export const getAuthToken = () => {
  // ลองหา token จาก cookies ก่อน
  const cookieToken = Cookies.get("token") ||
                     Cookies.get("authToken") ||
                     Cookies.get("access_token") ||
                     Cookies.get("jwt");

  if (cookieToken) {
    return cookieToken;
  }

  // ถ้าไม่เจอใน cookies ให้ลองหาใน localStorage
  if (typeof window !== "undefined") {
    const localToken = localStorage.getItem("token") ||
                      localStorage.getItem("authToken") ||
                      localStorage.getItem("access_token") ||
                      localStorage.getItem("jwt");

    if (localToken) {
      return localToken;
    }
  }

  return null;
};

/**
 * บันทึก token ลงใน cookies และ localStorage
 * @param {string} token
 */
export const saveAuthToken = (token) => {
  if (!token) return;

  // บันทึกใน cookies (expire 7 วัน)
  Cookies.set("token", token, { expires: 7 });

  // บันทึกใน localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
};

/**
 * ลบ token ออกจากทุกที่
 */
export const clearAuthToken = () => {
  // ลบจาก cookies
  Cookies.remove("token");
  Cookies.remove("authToken");
  Cookies.remove("access_token");

  // ลบจาก localStorage
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("access_token");
  }
};

/**
 * ตรวจสอบว่ามี token หรือไม่
 * @returns {boolean}
 */
export const hasAuthToken = () => {
  return !!getAuthToken();
};

/**
 * แสดงข้อมูล token ทั้งหมดที่มี (สำหรับ debug)
 */
export const debugTokens = () => {
  console.group("🔍 Token Debug Info");

  console.log("Cookies:");
  console.log("  - token:", Cookies.get("token") || "❌ Not found");
  console.log("  - authToken:", Cookies.get("authToken") || "❌ Not found");
  console.log("  - access_token:", Cookies.get("access_token") || "❌ Not found");

  if (typeof window !== "undefined") {
    console.log("\nLocalStorage:");
    console.log("  - token:", localStorage.getItem("token") || "❌ Not found");
    console.log("  - authToken:", localStorage.getItem("authToken") || "❌ Not found");
    console.log("  - access_token:", localStorage.getItem("access_token") || "❌ Not found");
  }

  const currentToken = getAuthToken();
  if (currentToken) {
    console.log("\n✅ Active Token:", currentToken.substring(0, 30) + "...");
  } else {
    console.log("\n❌ No active token found!");
  }

  console.groupEnd();
};
