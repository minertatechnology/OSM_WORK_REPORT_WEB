import Layout from "@components/layout/Layout";
import { useEffect } from "react";
import { useLoading } from "@context/LoadingProvider";
import dynamic from "next/dynamic";
import { ComponentLoadingSpinner } from "@components/shared/LoadingSpinner";

// Use dynamic import with ssr: false to avoid hydration issues
const PregnantReportComp = dynamic(
  () => import("@components/PregnantReportComp/PregnantReportComp"),
  {
    ssr: false,
    loading: () => <ComponentLoadingSpinner />
  }
);

const PregnantReport = () => {
  const { setLoading } = useLoading();

  useEffect(() => {
    // Briefly show loading on mount; always clear on unmount
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 0);
    return () => {
      clearTimeout(timer);
      setLoading(false);
    };
  }, [setLoading]);

  const triggerLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return <PregnantReportComp triggerLoading={triggerLoading} />;
};

PregnantReport.getLayout = (page) => <Layout>{page}</Layout>;
export default PregnantReport;
