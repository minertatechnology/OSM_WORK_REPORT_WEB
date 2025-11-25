import Layout from "@components/layout/Layout";
import PregnantReportComp from "@components/PregnantReportComp/PregnantReportComp";
import { useEffect } from "react";
import { useLoading } from "@context/LoadingProvider";

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
