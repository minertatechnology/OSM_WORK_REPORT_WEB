import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { User2, Lock, Eye, EyeOff, X } from "lucide-react";
import alertService from "@services/alertService/alertService";
// ⬇️ เพิ่มเติม: เรียกใช้ยูทิลเขียนคุกกี้สิทธิ์
import { setInfoCookie } from "@utils/access";

const REMEMBER_KEY = "rememberLogin"; // localStorage key

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({ username: "", password: "" });
  const [showThaiIdModal, setShowThaiIdModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // โหลดค่าที่เคยจำไว้
  useEffect(() => {
    try {
      const saved = typeof window !== "undefined" && localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data?.username) {
          setUsername(data.username);
          setRememberMe(true);
        }
        // หาก “ยืนยันจะเก็บ password” ให้คลายคอมเมนต์ด้านล่าง พร้อมคำเตือนความปลอดภัย
        // if (data?.password) setPassword(data.password);
      }
    } catch (e) {
      console.warn("Cannot parse rememberLogin:", e);
    }
  }, []);

  const validate = () => {
    const newErrors = { username: "", password: "" };
    if (!username.trim()) newErrors.username = "กรุณากรอกข้อมูล";
    if (!password.trim()) newErrors.password = "กรุณากรอกข้อมูล";
    setErrors(newErrors);
    return !newErrors.username && !newErrors.password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      const firstErrorField = (!username.trim() && "username") || (!password.trim() && "password");
      if (firstErrorField) document.getElementById(firstErrorField)?.focus();
      return;
    }

    try {
      setIsSubmitting(true);
      alertService.loading("กำลังเข้าสู่ระบบ...", "กรุณารอสักครู่");

      const res = await fakeLoginRequest({ username, password });

      alertService.closeLoading();

      if (res.success) {
        // Remember — เก็บเฉพาะ username (ปลอดภัยกว่า)
        if (rememberMe) {
          localStorage.setItem(
            REMEMBER_KEY,
            JSON.stringify({
              username,
              // หากต้องการเก็บ password (ไม่แนะนำ) → เพิ่ม field ด้านล่าง
              // password, // ⚠️ เสี่ยงต่อ XSS / ผู้ใช้ร่วมเครื่อง
              savedAt: Date.now(),
            })
          );
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }

        // ⬇️ เขียนคุกกี้ roles/scope สำหรับหน้า dashboard อื่น ๆ
        //    access.js ควรรับ (authObject, userObject, maxAgeSeconds?)
        setInfoCookie(res.auth, res.user);

        await alertService.success("เข้าสู่ระบบสำเร็จ", `ยินดีต้อนรับ ${res.user?.name || username}`);
        window.location.href = "/smart-osm";
      } else {
        alertService.error("เข้าสู่ระบบไม่สำเร็จ", res.message || "กรุณาลองใหม่อีกครั้ง");
      }
    } catch (err) {
      alertService.closeLoading();
      alertService.error("เกิดข้อผิดพลาด", err.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsSubmitting(false);
    }
  };

  const usernameError = !!errors.username;
  const passwordError = !!errors.password;

  return (
    <>
      <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden text-sm">
        {/* พื้นหลัง */}
        <Image
          src="/bg.jpg"
          alt="Background"
          fill
          priority
          className="object-cover object-center -z-10"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-purple-800/60 to-fuchsia-700/60 backdrop-blur-[2px]" />

        <div className="relative z-10 w-full px-4 py-10 md:py-0">
          <div className="mx-auto w-full max-w-[520px] bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-purple-100 p-10">
            {/* โลโก้ + ข้อความ */}
            <div className="flex flex-col items-center mb-8 select-none">
              <div className="flex items-center space-x-3">
                <Image
                  src="/logodb.png"
                  alt="Logo Icon"
                  width={72}
                  height={48}
                  priority
                  className="w-auto h-12"
                />
                <h1 className="text-3xl font-extrabold tracking-wide leading-none">
                  <span className="bg-gradient-to-r from-[#7c2de9] via-[#7e32e2] to-[#8a3dd9] bg-clip-text text-transparent">
                    ASH
                  </span>
                  <span className="text-[#000d63]">BORD</span>
                </h1>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
              {/* Username */}
              <div className="space-y-1">
                <label htmlFor="username" className="font-medium text-gray-700">
                  บัญชีผู้ใช้
                </label>
                <div className="relative">
                  <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${usernameError ? "text-red-500" : "text-gray-400"}`}>
                    <User2 className="w-4 h-4" />
                  </span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    placeholder="ระบุบัญชีผู้ใช้"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errors.username) setErrors((prev) => ({ ...prev, username: "" }));
                    }}
                    onBlur={() => {
                      if (!username.trim() && !errors.username) {
                        setErrors((prev) => ({ ...prev, username: "กรุณากรอกข้อมูล" }));
                      }
                    }}
                    className={`w-full rounded-md h-10 bg-white pl-9 pr-3 outline-none transition border ${
                      usernameError
                        ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-300 text-red-600 placeholder:text-red-400"
                        : "border-gray-300 focus:border-[#6E28B7] focus:ring-2 focus:ring-[#6E28B7]/30 text-gray-700 placeholder:text-gray-400"
                    } disabled:opacity-60`}
                    disabled={isSubmitting}
                  />
                </div>
                {usernameError && <p className="text-xs text-red-600 -mt-0.5">{errors.username}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label htmlFor="password" className="font-medium text-gray-700">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${passwordError ? "text-red-500" : "text-gray-400"}`}>
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="ระบุรหัสผ่าน"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                    }}
                    onBlur={() => {
                      if (!password.trim() && !errors.password) {
                        setErrors((prev) => ({ ...prev, password: "กรุณากรอกข้อมูล" }));
                      }
                    }}
                    className={`w-full rounded-md h-10 bg-white pl-9 pr-10 outline-none transition border ${
                      passwordError
                        ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-300 text-red-600 placeholder:text-red-400"
                        : "border-gray-300 focus:border-[#6E28B7] focus:ring-2 focus:ring-[#6E28B7]/30 text-gray-700 placeholder:text-gray-400"
                    } disabled:opacity-60`}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className={`absolute inset-y-0 right-0 pr-3 flex items-center transition ${
                      passwordError ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-gray-600"
                    } disabled:cursor-not-allowed`}
                    aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && <p className="text-xs text-red-600 -mt-0.5">{errors.password}</p>}
              </div>

              {/* Remember */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#6E28B7] focus:ring-[#6E28B7]"
                  disabled={isSubmitting}
                />
                <label htmlFor="remember" className="text-gray-600 select-none cursor-pointer">
                  จดจำรหัสผ่าน
                </label>
              </div>

              {/* Buttons */}
              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-md bg-[#6E28B7] hover:bg-[#5f1fa3] active:bg-[#541b90] disabled:opacity-70 disabled:cursor-not-allowed text-white font-medium shadow-md shadow-[#6E28B7]/30 hover:shadow-lg hover:shadow-[#6E28B7]/45 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6E28B7]"
                >
                  {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowThaiIdModal(true)}
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-md border border-[#6E28B7] text-[#6E28B7] hover:bg-[#6E28B7]/5 flex items-center justify-center space-x-2 font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6E28B7] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Image src="/thaiidlogo.png" alt="Thai ID Logo" width={24} height={24} className="w-6 h-6 object-contain" />
                  <span>Thai ID</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {showThaiIdModal && <ThaiIdModal onClose={() => setShowThaiIdModal(false)} />}
      </div>
    </>
  );
}

/* -------- ThaiIdModal -------- */
function ThaiIdModal({ onClose }) {
  const { current: closeBtnRef } = useRef(null);
  const handleKey = useCallback((e) => { if (e.key === "Escape") onClose(); }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    // closeBtnRef?.focus(); // ถ้าต้องการโฟกัสปุ่มปิด
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const handleBackdropClick = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog" aria-modal="true" aria-labelledby="thaiid-title"
    >
      <div className="relative w-full max-w-[540px] bg-white rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#6E28B7]"
          aria-label="ปิด"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-10 pt-8 pb-10 text-center">
          <h2 id="thaiid-title" className="text-xl font-semibold text-[#6E28B7] mb-1">เข้าสู่ระบบด้วย Thai ID</h2>
          <p className="text-sm text-[#6E28B7]/80 mb-6">ระบบ Dashboard</p>
          <div className="flex items-center justify-center mb-8">
            <div className="p-3 bg-white border border-gray-200 rounded-md shadow-sm">
              <Image src="/thaiid-qr.png" alt="Thai ID QR Code" width={230} height={230} className="w-[230px] h-[230px] object-contain" priority />
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-200" />
        <div className="px-8 py-6 text-center">
          <p className="text-[11px] leading-relaxed text-[#3b2d64] font-medium">
            คิวอาร์โค้ดนี้เป็นสื่อที่พัฒนาบนทางดิจิทัล ออกโดย
            <br />
            กรมการปกครอง กระทรวงมหาดไทย
          </p>
        </div>
      </div>

      <style jsx>{`
        .animate-fadeIn { animation: fadeIn 0.2s ease; }
        @keyframes fadeIn {
          from { transform: translateY(8px); opacity: 0; }
          to   { transform: translateY(0);  opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* -------- ฟังก์ชันจำลองเรียก API (รองรับหลายโรล) -------- */
/**
 * password ของทุกบัญชีคือ "1234"
 * ตัวอย่างบัญชี:
 *  - admin         → roles: ["สบส"]
 *  - zone1         → roles: ["เขต"], scope: เขตสุขภาพที่ 1
 *  - zone4         → roles: ["เขต"], scope: เขตสุขภาพที่ 4
 *  - prov-non      → roles: ["จังหวัด"], scope: นนทบุรี (เขต 4)
 *  - dist-klong    → roles: ["อำเภอ"],  scope: ปทุมธานี/คลองหลวง (เขต 4)
 *  - sub-bangkrasor→ roles: ["ตำบล"],   scope: เมือง/บางกระสอ (นนทบุรี, เขต 4)
 *  - unit-rph1     → roles: ["รพสต"],  scope: รพ.สต.ทดสอบ 1 (เมือง/บางกระสอ, นนทบุรี, เขต 4)
 *  - error         → จำลอง server error
 */
function fakeLoginRequest({ username, password }) {
  const USERS = {
    admin: {
      displayName: "Administrator",
      roles: ["สบส"],
      scope: {},
    },
    zone1: {
      displayName: "ผู้ใช้ เขตสุขภาพที่ 1",
      roles: ["เขต"],
      scope: { zone: "เขตสุขภาพที่ 1" },
    },
    zone4: {
      displayName: "ผู้ใช้ เขตสุขภาพที่ 4",
      roles: ["เขต"],
      scope: { zone: "เขตสุขภาพที่ 4" },
    },
    "prov-non": {
      displayName: "เจ้าหน้าที่จังหวัดนนทบุรี",
      roles: ["จังหวัด"],
      scope: { zone: "เขตสุขภาพที่ 4", province: "นนทบุรี" },
    },
    "dist-klong": {
      displayName: "เจ้าหน้าที่อำเภอคลองหลวง",
      roles: ["อำเภอ"],
      scope: { zone: "เขตสุขภาพที่ 4", province: "ปทุมธานี", district: "คลองหลวง" },
    },
    "sub-bangkrasor": {
      displayName: "เจ้าหน้าที่ตำบลบางกระสอ",
      roles: ["ตำบล"],
      scope: { zone: "เขตสุขภาพที่ 4", province: "นนทบุรี", district: "เมือง", subdistrict: "บางกระสอ" },
    },
    "unit-rph1": {
      displayName: "รพ.สต.ทดสอบ 1",
      roles: ["รพสต"],
      scope: { zone: "เขตสุขภาพที่ 4", province: "นนทบุรี", district: "เมือง", subdistrict: "บางกระสอ", unit: "รพ.สต.ทดสอบ 1" },
    },
  };

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (username === "error") {
        return reject(new Error("Server error simulated"));
      }
      const acct = USERS[username?.toLowerCase?.()] || null;
      if (!acct || password !== "1234") {
        return resolve({ success: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
      }
      return resolve({
        success: true,
        user: { name: acct.displayName || username },
        auth: {
          roles: acct.roles,
          zone: acct.scope.zone || "",
          province: acct.scope.province || "",
          district: acct.scope.district || "",
          subdistrict: acct.scope.subdistrict || "",
          unit: acct.scope.unit || "",
        },
      });
    }, 600);
  });
}
