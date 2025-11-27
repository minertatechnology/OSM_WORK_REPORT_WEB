import Layout from "@components/layout/Layout";
import { useEffect, Suspense } from "react";
import { useLoading } from "@context/LoadingProvider";
import { LazyNewsComp } from "@components/shared/LazyComponents";
import { ComponentLoadingSpinner } from "@components/shared/LoadingSpinner";

const News = () => {
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
      <LazyNewsComp triggerLoading={triggerLoading} />
    </Suspense>
  );
};

News.getLayout = (page) => <Layout>{page}</Layout>;
export default News;
