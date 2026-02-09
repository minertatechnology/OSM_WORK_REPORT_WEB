import Layout from "@components/layout/Layout";
import PublicReportComp from "@components/PublicReportComp/PublicReportComp";
import { useEffect } from "react";
import { useLoading } from "@context/LoadingProvider";

const PublicReport = () => {
  const { setLoading } = useLoading();

  useEffect(() => {
    // Show loading when page starts loading
    setLoading(true);
  }, [setLoading]);

  useEffect(() => {
    // ปิด loading เมื่อ component mount และ render เสร็จ
    setLoading(false);

    return () => {
      setLoading(false); // ปิด loading เมื่อ component unmount
    };
  }, [setLoading]);

  return <PublicReportComp />;
};

PublicReport.getLayout = (page) => <Layout>{page}</Layout>;
export default PublicReport;
