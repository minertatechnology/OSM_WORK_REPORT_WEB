import React from "react";
import styles from "@styles/LoadingSpinner.module.scss";

// ✨ ใช้ Loading Design เดิมที่มีอยู่แล้ว (สวยมาก!)
// มี Logo + Spinner + Pulse Ring Effect
const LoadingCore = () => (
  <div className={styles.spinnerContainer}>
    {/* Pulse ring effect */}
    <div className={styles.pulseRing}></div>

    {/* Outer spinning ring */}
    <div className={styles.spinnerOuter}></div>

    {/* Main spinning ring */}
    <div className={styles.spinner}></div>

    {/* Logo center (no movement) */}
    <div className={styles.logoContainer}>
      <img
        src="/logoloading.png"
        alt="Logo"
        className={styles.logoImage}
        draggable="false"
        decoding="async"
        fetchpriority="high"
      />
    </div>
  </div>
);

// สำหรับ component ทั่วไป (ใช้ใน content area)
export const LoadingSpinner = ({ message = "กำลังโหลด..." }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px]">
    <LoadingCore />
    {message && <p className="mt-6 text-gray-600 text-sm">{message}</p>}
  </div>
);

// สำหรับ Full Page Loading (มี overlay)
export const FullPageLoadingSpinner = ({ message = "กำลังโหลด..." }) => (
  <div className={styles.loadingOverlay}>
    <div className="flex flex-col items-center">
      <LoadingCore />
      {message && <p className="mt-6 text-gray-700 text-base font-medium">{message}</p>}
    </div>
  </div>
);

// สำหรับ Component ย่อย ๆ (ไม่มี message)
export const ComponentLoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <LoadingCore />
  </div>
);

export default LoadingSpinner;
