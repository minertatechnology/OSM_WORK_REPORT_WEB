import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { LogIn } from "lucide-react";
import Swal from "sweetalert2";
import { useLoading } from "@context/LoadingProvider";
import Image from "next/image";

const PRIMARY = "#6E28B7";

const PublicNavbar = ({ onLoginClick }) => {
  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      {/* Left: Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-[#7e32e2] to-[#a855f7] rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-lg">ร</span>
        </div>
        <div>
          <h1 className="text-lg font-bold" style={{ color: PRIMARY }}>
            รายงานการติดตามการได้รับยาเม็ดเสริมไอโอดีน
          </h1>
          <p className="text-xs text-gray-500">ระบบรายงานสารสนเทศสุขภาพ</p>
        </div>
      </div>

      {/* Right: Login Button */}
      <button
        onClick={onLoginClick}
        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#7e32e2] to-[#a855f7] text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
      >
        <LogIn size={18} />
        เข้าสู่ระบบ
      </button>
    </div>
  );
};

const PublicLayout = ({ children }) => {
  const router = useRouter();
  const { setLoading } = useLoading();

  const handleLoginClick = async () => {
    const { value: formValues } = await Swal.fire({
      title: "เข้าสู่ระบบ",
      html:
        '<div className="swal2-input-container">' +
        '<input id="swal-input1" class="swal2-input" placeholder="ชื่อผู้ใช้งาน">' +
        '<input id="swal-input2" class="swal2-input" type="password" placeholder="รหัสผ่าน">' +
        '</div>',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "เข้าสู่ระบบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#7e32e2",
      cancelButtonColor: "#6b7280",
      customClass: {
        popup: "swal-custom-popup",
        title: "text-xl font-bold",
      },
      preConfirm: () => {
        const username = document.getElementById("swal-input1").value;
        const password = document.getElementById("swal-input2").value;

        if (!username || !password) {
          Swal.showValidationMessage("กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน");
          return false;
        }

        return { username, password };
      },
    });

    if (formValues) {
      setLoading(true);
      try {
        // Call login API
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: formValues.username,
            password: formValues.password,
          }),
        });

        const data = await response.json();

        if (response.ok && data.access_token) {
          // Store token
          document.cookie = `token=${data.access_token}; path=/; max-age=${60 * 60 * 24 * 7}`;

          // Store user info in sessionStorage
          if (data.user) {
            sessionStorage.setItem("userInfo", JSON.stringify(data));
          }

          await Swal.fire({
            icon: "success",
            title: "เข้าสู่ระบบสำเร็จ",
            text: "ยินดีต้อนรับเข้าสู่ระบบ",
            confirmButtonColor: "#7e32e2",
            timer: 1500,
            showConfirmButton: false,
          });

          // Redirect to home page
          router.push("/");
        } else {
          throw new Error(data.message || "ไม่สามารถเข้าสู่ระบบได้");
        }
      } catch (error) {
        console.error("Login error:", error);
        Swal.fire({
          icon: "error",
          title: "เข้าสู่ระบบไม่สำเร็จ",
          text: error.message || "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง",
          confirmButtonColor: "#7e32e2",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7f2ff] via-white to-white">
      <PublicNavbar onLoginClick={handleLoginClick} />
      <main className="p-4 lg:p-6">{children}</main>
    </div>
  );
};

export default PublicLayout;
