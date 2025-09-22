import Layout from "@components/layout/Layout";
import GisMosquitoComp from "@components/ReportMosquitoComp/GisMosquitoComp/GisMosquitoComp";
import { useEffect, useLayoutEffect } from "react";
import { useLoading } from "@context/LoadingProvider";

const GisGisMosquito = () => {
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

  return <GisMosquitoComp triggerLoading={triggerLoading} />;
};

GisGisMosquito.getLayout = (page) => <Layout>{page}</Layout>;
export default GisGisMosquito;
