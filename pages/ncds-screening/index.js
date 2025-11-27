import Layout from "@components/layout/Layout";
import { useEffect, Suspense } from "react";
import { useLoading } from "@context/LoadingProvider";
import { LazyNcdsScreeningComp } from "@components/shared/LazyComponents";
import { ComponentLoadingSpinner } from "@components/shared/LoadingSpinner";

const NcdsScreening = () => {
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
      <LazyNcdsScreeningComp triggerLoading={triggerLoading} />
    </Suspense>
  );
};

NcdsScreening.getLayout = (page) => <Layout>{page}</Layout>;
export default NcdsScreening;
