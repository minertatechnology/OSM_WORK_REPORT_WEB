import Layout from "@components/layout/Layout";
import ElderlyScreeningComp from "@components/ElderlyScreeningComp/ElderlyScreeningComp";
import { useEffect, useLayoutEffect } from "react";
import { useLoading } from "@context/LoadingProvider";

const ElderlyScreening = () => {
  const { setLoading } = useLoading();

  useLayoutEffect(() => {
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
