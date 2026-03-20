"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { setTokens } from "@utils/tokenStorage";
import { fetchCurrentUser, clearCurrentUserCache } from "@services/authService/authService";
import { startTokenRefresh } from "@services/authService/tokenRefreshUtil";
import alertService from "@services/alertService/alertService";

// External registration URL (หน้าลงทะเบียนหลัก)
const EXTERNAL_REGISTER_URL = "https://phc-management.hss.moph.go.th/register";

// Error messages mapping
const ERROR_MESSAGES = {
  thaid_not_configured: "ระบบยังไม่ได้ตั้งค่า ThaiD Login กรุณาติดต่อผู้ดูแลระบบ",
  missing_client_id: "ข้อมูลไม่ครบถ้วน กรุณาลองใหม่อีกครั้ง",
  citizen_id_not_found: "ไม่พบบัญชีผู้ใช้ในระบบ กรุณาลงทะเบียนก่อนใช้งาน",
  user_type_not_allowed: "ประเภทผู้ใช้ไม่ได้รับอนุญาตในระบบนี้",
  user_blocked: "บัญชีผู้ใช้ถูกระงับ กรุณาติดต่อผู้ดูแลระบบ",
  user_not_in_allowlist: "ไม่มีสิทธิ์เข้าใช้งานระบบ กรุณาติดต่อผู้ดูแลระบบ",
  invalid_auth_code: "การยืนยันตัวตนไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง",
  thaid_token_exchange_failed: "การเชื่อมต่อกับ ThaiD ล้มเหลว กรุณาลองใหม่อีกครั้ง",
  thaid_network_error: "ไม่สามารถเชื่อมต่อกับระบบ ThaiD ได้ กรุณาลองใหม่อีกครั้ง",
  thaid_missing_pid: "ไม่พบข้อมูลการยืนยันตัวตน กรุณาลองใหม่อีกครั้ง",
  invalid_client: "ระบบไม่ได้รับอนุญาต กรุณาติดต่อผู้ดูแลระบบ",
  state_tampered: "การยืนยันตัวตนไม่ปลอดภัย กรุณาลองใหม่อีกครั้ง",
  internal_error: "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง",
};

// Errors that should redirect to registration page
const REDIRECT_TO_REGISTER_ERRORS = ["citizen_id_not_found", "user_not_in_allowlist"];

export default function ThaiDCallback() {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      // Wait for router to be ready
      if (!router.isReady) return;

      const params = new URLSearchParams(window.location.search);

      // Check for error from backend
      const errorParam = params.get("error");
      if (errorParam) {
        // If error requires registration, redirect to register page
        if (REDIRECT_TO_REGISTER_ERRORS.includes(errorParam)) {
          const currentOrigin = window.location.origin;
          const redirectUrl = new URL(EXTERNAL_REGISTER_URL);
          redirectUrl.searchParams.set("returnUrl", currentOrigin);

          // Forward any additional params (like citizen_id, name from ThaiD)
          params.forEach((value, key) => {
            if (key !== "error") {
              redirectUrl.searchParams.set(key, value);
            }
          });

          if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
            console.log("[ThaiD Callback] Redirecting to register:", redirectUrl.toString());
          }

          window.location.href = redirectUrl.toString();
          return;
        }

        setError(ERROR_MESSAGES[errorParam] ?? `เข้าสู่ระบบไม่สำเร็จ: ${errorParam}`);
        setLoading(false);
        return;
      }

      // Get tokens from URL
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token") || null;

      if (!accessToken) {
        setError("ไม่พบ access token กรุณาลองใหม่อีกครั้ง");
        setLoading(false);
        return;
      }

      try {
        // Store tokens
        setTokens({ accessToken, refreshToken });
        startTokenRefresh();
        clearCurrentUserCache();

        // Fetch user profile
        const profileResponse = await fetchCurrentUser({ forceRefresh: true });
        const userProfile = profileResponse?.data ?? profileResponse ?? null;

        if (userProfile) {
          // Store user info in sessionStorage
          sessionStorage.setItem("userInfo", JSON.stringify({
            user: userProfile,
            username: userProfile.citizen_id || userProfile.username || "",
            loginAt: Date.now(),
            loginMethod: "thaid",
          }));

          sessionStorage.setItem("user_type", userProfile.user_type ?? "officer");
          sessionStorage.setItem("client_id", userProfile.client_id ?? "");

          if (typeof userProfile.is_admin !== "undefined") {
            sessionStorage.setItem("is_admin", String(Boolean(userProfile.is_admin)));
          }
        }

        // Show success message and redirect
        await alertService.success(
          "เข้าสู่ระบบสำเร็จ",
          `ยินดีต้อนรับ ${userProfile?.name || userProfile?.first_name || ""}`
        );

        // Redirect to dashboard
        router.push("/home");
      } catch (err) {
        console.error("ThaiD callback error:", err);
        setError("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้ กรุณาลองใหม่อีกครั้ง");
        setLoading(false);
      }
    };

    processCallback();
  }, [router, router.isReady]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#7e32e2]/10 to-white">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <Image
              src="/Smart_Osm_Plus.png"
              alt="Smart OSM"
              width={200}
              height={48}
              className="w-[200px] h-auto"
              priority
            />
          </div>
          <div className="flex items-center justify-center space-x-3">
            <div className="w-8 h-8 border-4 border-[#7e32e2] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[#7e32e2] font-semibold text-lg">กำลังเข้าสู่ระบบ...</span>
          </div>
          <p className="text-gray-500 mt-2 text-sm">กรุณารอสักครู่</p>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white px-4">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <Image
            src="/Smart_Osm_Plus.png"
            alt="Smart OSM"
            width={200}
            height={48}
            className="w-[200px] h-auto"
            priority
          />
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">เข้าสู่ระบบไม่สำเร็จ</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full h-11 rounded-md bg-[#7e32e2] hover:bg-[#6d37b7] text-white font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7e32e2]"
          >
            กลับหน้าเข้าสู่ระบบ
          </button>
        </div>
      </div>
    </div>
  );
}
