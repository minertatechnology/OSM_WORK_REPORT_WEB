import Layout from "@components/layout/Layout";
import OsmHealthComp from "@components/OsmHealthComp/OsmHealthComp";
import { useEffect, useLayoutEffect } from "react";
import { useLoading } from "@context/LoadingProvider";

const OsmHealth = () => {
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

  return <OsmHealthComp triggerLoading={triggerLoading} />;
};

OsmHealth.getLayout = (page) => <Layout>{page}</Layout>;
export default OsmHealth;
