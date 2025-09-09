"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, Lock, User2, X } from "lucide-react";
import alertService from "@services/alertService/alertService";

// ฟังก์ชันจำลอง login (รองรับ 6 roles)
function fakeLoginRequest({ username, password }) {
  // สิทธิ์ภาษาอังกฤษสำหรับ zone และ province
  const ZONE_PERMISSIONS = {};
  for (let i = 1; i <= 13; i++) {
    ZONE_PERMISSIONS[`zone${i}`] = `ZONE_${i}`;
  }

  const PROVINCE_PERMISSIONS = {
    กรุงเทพมหานคร: "PROVINCE_BANGKOK",
    นนทบุรี: "PROVINCE_NONTHABURI",
    ปทุมธานี: "PROVINCE_PATHUMTHANI",
    // ... เพิ่มจังหวัดอื่นๆตามต้องการ
  };

  const USERS = {
    admin: {
      displayName: "ผู้ดูแล สบส.",
      roles: ["สบส.", "ADMIN"],
      scope: {},
      permissions: ["ADMIN"],
    },
    zone1: {
      displayName: "เจ้าหน้าที่ เขตสุขภาพที่ 1",
      roles: ["เขต"],
      scope: { zone: "เขตสุขภาพที่ 1" },
      permissions: [ZONE_PERMISSIONS.zone1],
    },
    provnon: {
      displayName: "เจ้าหน้าที่ จังหวัดนนทบุรี",
      roles: ["จังหวัด"],
      scope: { zone: "เขตสุขภาพที่ 4", province: "นนทบุรี" },
      permissions: [ZONE_PERMISSIONS.zone4, PROVINCE_PERMISSIONS["นนทบุรี"]],
    },
    distklong: {
      displayName: "เจ้าหน้าที่ อำเภอคลองหลวง",
      roles: ["อำเภอ"],
      scope: {
        zone: "เขตสุขภาพที่ 4",
        province: "ปทุมธานี",
        district: "คลองหลวง",
      },
      permissions: [ZONE_PERMISSIONS.zone4, PROVINCE_PERMISSIONS["ปทุมธานี"]],
    },
    subbangkrasor: {
      displayName: "เจ้าหน้าที่ ตำบลบางกระสอ",
      roles: ["ตำบล"],
      scope: {
        zone: "เขตสุขภาพที่ 4",
        province: "นนทบุรี",
        district: "เมือง",
        subdistrict: "บางกระสอ",
      },
      permissions: [ZONE_PERMISSIONS.zone4, PROVINCE_PERMISSIONS["นนทบุรี"]],
    },
    unitrph1: {
      displayName: "เจ้าหน้าที่ รพสต.ทดสอบ 1",
      roles: ["รพสต."],
      scope: {
        zone: "เขตสุขภาพที่ 4",
        province: "นนทบุรี",
        district: "เมือง",
        subdistrict: "บางกระสอ",
        unit: "รพสต.ทดสอบ 1",
      },
      permissions: [ZONE_PERMISSIONS.zone4, PROVINCE_PERMISSIONS["นนทบุรี"]],
    },
  };

  return new Promise((resolve) => {
    setTimeout(() => {
      const acct = USERS[username?.toLowerCase?.()];
      if (!acct || password !== "1234") {
        return resolve({
          success: false,
          message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
        });
      }
      const loginResult = {
        success: true,
        user: { name: acct.displayName || username },
        auth: {
          roles: acct.roles,
          ...acct.scope,
          permissions: acct.permissions,
        },
      };
      // --- บันทึกลง sessionStorage ---
      try {
        sessionStorage.setItem("user", JSON.stringify(loginResult));
        console.log(
          "[fakeLoginRequest] Saved login info to sessionStorage:",
          loginResult
        );
      } catch (err) {
        console.error(
          "[fakeLoginRequest] Failed to save to sessionStorage:",
          err
        );
      }
      return resolve(loginResult);
    }, 600);
  });
}
// Thai ID Modal
function ThaiIdModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-2 py-8">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-xs w-full p-6 text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 rounded-full p-1 outline-none focus:ring-2 focus:ring-[#7e32e2]"
          aria-label="ปิด"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="mb-2 mt-2">
          <div className="font-bold text-lg text-[#7e32e2]">
            เข้าสู่ระบบด้วย Thai ID
          </div>
          <div className="text-[#7e32e2] text-sm font-medium mb-4">
            ระบบ Smart อสม.
          </div>
        </div>
        <div className="flex items-center justify-center mb-3">
          <Image
            src="/thaiid-qr.png"
            alt="Thai ID QR"
            width={180}
            height={180}
            className="rounded-lg border border-gray-200 shadow"
            priority
          />
        </div>
        <div className="border-t border-gray-200 my-2" />
        <div className="text-[12px] text-[#7e32e2] font-medium leading-relaxed pt-1">
          คิวอาร์โค้ดนี้เป็นสื่อที่พัฒนาบนทางดิจิทัล ออกโดย
          <br />
          กรมการปกครอง กระทรวงมหาดไทย
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ username: "", password: "" });
  const [showThaiId, setShowThaiId] = useState(false);

  function validate() {
    let err = { username: "", password: "" };
    if (!username.trim()) err.username = "กรุณากรอกข้อมูล";
    if (!password.trim()) err.password = "กรุณากรอกข้อมูล";
    setErrors(err);
    return !err.username && !err.password;
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (!validate()) {
      alertService.error("กรอกข้อมูลไม่ครบถ้วน", "กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    try {
      setLoading(true);
      alertService.loading("กำลังเข้าสู่ระบบ...", "กรุณารอสักครู่");
      const res = await fakeLoginRequest({ username, password });
      alertService.closeLoading();
      if (res.success) {
        // เก็บ userInfo และ role ลง sessionStorage
        sessionStorage.setItem(
          "userInfo",
          JSON.stringify({
            user: res.user,
            auth: res.auth,
            username,
            remember,
            loginAt: Date.now(),
          })
        );
        alertService.success(
          "เข้าสู่ระบบสำเร็จ",
          `ยินดีต้อนรับ ${res.user?.name || username}\n[บทบาท: ${
            res.auth.roles[0]
          }]`
        );
        setTimeout(() => {
          window.location.href = "/home"; // ไปหน้า /home หลัง login สำเร็จ
        }, 1200);
      } else {
        alertService.error(
          "เข้าสู่ระบบไม่สำเร็จ",
          res.message || "กรุณาลองใหม่อีกครั้ง"
        );
      }
    } catch (err) {
      alertService.closeLoading();
      alertService.error(
        "เกิดข้อผิดพลาด",
        err.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-stretch bg-white">
      {/* Left: Just the image fully covered */}
      <div className="hidden md:block relative flex-1 min-h-screen">
        <Image
          src="/bgworkreport.png"
          alt="Welcome Smart อสม."
          fill
          priority
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
      </div>
      {/* Right */}
      <div className="flex flex-col justify-center flex-1 px-5 py-12 bg-white min-h-screen">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="flex items-center justify-center mb-7 select-none">
            <Image
              src="/logoworkreport.png"
              alt="Smart อสม."
              width={528}
              height={128}
              priority
              className="w-[528px] h-auto"
            />
          </div>
          {/* Form */}
          <form className="space-y-5" autoComplete="on" onSubmit={handleLogin}>
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block font-semibold text-gray-700 mb-1"
              >
                บัญชีผู้ใช้
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <User2 className="w-5 h-5" />
                </span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="ระบุบัญชีผู้ใช้"
                  className={`w-full rounded-md h-11 pl-10 pr-3 border ${
                    errors.username
                      ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-300 text-red-600 placeholder:text-red-400"
                      : "border-gray-300 focus:border-[#7e32e2] focus:ring-2 focus:ring-[#7e32e2]/20 text-gray-700 placeholder:text-gray-400"
                  } outline-none transition disabled:opacity-70`}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </div>
              {errors.username && (
                <p className="text-xs text-red-600 mt-1">{errors.username}</p>
              )}
            </div>
            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block font-semibold text-gray-700 mb-1"
              >
                รหัสผ่าน
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="ระบุรหัสผ่าน"
                  className={`w-full rounded-md h-11 pl-10 pr-10 border ${
                    errors.password
                      ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-300 text-red-600 placeholder:text-red-400"
                      : "border-gray-300 focus:border-[#7e32e2] focus:ring-2 focus:ring-[#7e32e2]/20 text-gray-700 placeholder:text-gray-400"
                  } outline-none transition disabled:opacity-70`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#7e32e2] focus:outline-none"
                  tabIndex={-1}
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">{errors.password}</p>
              )}
            </div>
            {/* Remember */}
            <div className="flex items-center space-x-2 pt-1">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#7e32e2] focus:ring-[#7e32e2]"
                disabled={loading}
              />
              <label
                htmlFor="remember"
                className="text-gray-600 select-none cursor-pointer"
              >
                จดจำรหัสผ่าน
              </label>
            </div>
            {/* Buttons */}
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-md bg-[#7e32e2] hover:bg-[#6d37b7] active:bg-[#5c229a] transition text-white font-semibold shadow-md shadow-[#7e32e2]/20 hover:shadow-lg hover:shadow-[#7e32e2]/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7e32e2] disabled:opacity-60"
              >
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </button>
              <button
                type="button"
                disabled={loading}
                className="w-full h-11 rounded-md border border-[#7e32e2] text-[#7e32e2] hover:bg-[#7e32e2]/5 flex items-center justify-center space-x-2 font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7e32e2] disabled:opacity-60"
                onClick={() => setShowThaiId(true)}
              >
                <Image
                  src="/thaiidlogo.png"
                  alt="Thai ID Logo"
                  width={26}
                  height={26}
                  className="w-6 h-6 object-contain"
                />
                <span>Thai ID</span>
              </button>
            </div>
          </form>
        </div>
      </div>
      {/* Responsive: show left panel on mobile as fixed background */}
      <div className="md:hidden fixed inset-0 z-[-1]">
        <Image
          src="/bgworkreport.png"
          alt="Welcome Smart อสม."
          fill
          priority
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
      </div>
      {/* Thai ID Modal */}
      <ThaiIdModal open={showThaiId} onClose={() => setShowThaiId(false)} />
    </div>
  );
}
