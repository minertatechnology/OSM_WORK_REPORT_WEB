import Layout from "@components/layout/Layout";
import { useEffect, Suspense } from "react";
import { useLoading } from "@context/LoadingProvider";
import { LazyReportMosquitoComp } from "@components/shared/LazyComponents";
import { ComponentLoadingSpinner } from "@components/shared/LoadingSpinner";

const ReportMosquito = () => {
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

  const triggerLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <Suspense fallback={<ComponentLoadingSpinner />}>
      <LazyReportMosquitoComp triggerLoading={triggerLoading} />
    </Suspense>
  );
};

ReportMosquito.getLayout = (page) => <Layout>{page}</Layout>;
export default ReportMosquito;
