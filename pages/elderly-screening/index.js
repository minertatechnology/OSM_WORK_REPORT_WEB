import Layout from "@components/layout/Layout";
import { useEffect } from "react";
import { useLoading } from "@context/LoadingProvider";
import dynamic from "next/dynamic";
import { ComponentLoadingSpinner } from "@components/shared/LoadingSpinner";

// ใช้ dynamic import แบบ no SSR เพื่อป้องกัน hydration error
const ElderlyScreeningComp = dynamic(
  () => import("@components/ElderlyScreeningComp/ElderlyScreeningComp"),
  {
    ssr: false,
    loading: () => <ComponentLoadingSpinner />,
  }
);

const ElderlyScreening = () => {
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

  return <ElderlyScreeningComp triggerLoading={triggerLoading} />;
};

ElderlyScreening.getLayout = (page) => <Layout>{page}</Layout>;
export default ElderlyScreening;
