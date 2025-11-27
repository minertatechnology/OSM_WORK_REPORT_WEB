import Layout from "@components/layout/Layout";
import { useEffect, Suspense } from "react";
import { useLoading } from "@context/LoadingProvider";
import { LazyPregnantReportComp } from "@components/shared/LazyComponents";
import { ComponentLoadingSpinner } from "@components/shared/LoadingSpinner";

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

  return (
    <Suspense fallback={<ComponentLoadingSpinner />}>
      <LazyPregnantReportComp triggerLoading={triggerLoading} />
    </Suspense>
  );
};

PregnantReport.getLayout = (page) => <Layout>{page}</Layout>;
export default PregnantReport;
