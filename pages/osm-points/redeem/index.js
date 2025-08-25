import Layout from "@components/layout/layout";
import RedeemComp from "@components/OsmPointsComp/RedeemComp/RedeemComp";
import { useEffect, useLayoutEffect } from "react";
import { useLoading } from "@context/LoadingProvider";

const Redeem = () => {
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

  return <RedeemComp triggerLoading={triggerLoading} />;
};

Redeem.getLayout = (page) => <Layout>{page}</Layout>;
export default Redeem;
