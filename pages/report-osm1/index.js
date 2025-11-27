import Layout from "@components/layout/Layout";
import { useEffect, Suspense } from "react";
import { useLoading } from "@context/LoadingProvider";
import { LazyReportOsm1Comp } from "@components/shared/LazyComponents";
import { ComponentLoadingSpinner } from "@components/shared/LoadingSpinner";

const Reportosm1 = () => {
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
      <LazyReportOsm1Comp triggerLoading={triggerLoading} />
    </Suspense>
  );
};

Reportosm1.getLayout = (page) => <Layout>{page}</Layout>;
export default Reportosm1;
