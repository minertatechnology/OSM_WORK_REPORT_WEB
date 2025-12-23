import dynamic from "next/dynamic";
import { Suspense } from "react";
import Layout from "@components/layout/Layout";

// Dynamic import โดยปิด SSR เพื่อแก้ปัญหา hydration mismatch
const PregnantReportComp = dynamic(
  () => import("@components/PregnantReportComp/PregnantReportComp"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }
);

// Use dynamic import with ssr: false to avoid hydration issues
const PregnantReportComp = dynamic(
  () => import("@components/PregnantReportComp/PregnantReportComp"),
  {
    ssr: false,
    loading: () => <ComponentLoadingSpinner />
  }
);

const PregnantReport = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    }>
      <PregnantReportComp />
    </Suspense>
  );
};

PregnantReport.getLayout = (page) => <Layout>{page}</Layout>;
export default PregnantReport;
