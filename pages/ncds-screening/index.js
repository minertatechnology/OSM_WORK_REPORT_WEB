import Layout from "@components/layout/layout";
import NcdsScreeningComp from "@components/NcdsScreeningComp/NcdsScreeningComp";
import { useEffect, useLayoutEffect } from "react";
import { useLoading } from "@context/LoadingProvider";

const NcdsScreening = () => {
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

  return <NcdsScreeningComp triggerLoading={triggerLoading} />;
};

NcdsScreening.getLayout = (page) => <Layout>{page}</Layout>;
export default NcdsScreening;
