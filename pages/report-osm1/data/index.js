import Layout from "@components/layout/Layout";
import Reportosm1DataComp from "@components/Reportosm1Comp/Reportosm1DataComp/Reportosm1DataComp";
import { useEffect } from "react";
import { useLoading } from "@context/LoadingProvider";

const Reportosm1Data = () => {
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

  return <Reportosm1DataComp triggerLoading={triggerLoading} />;
};

Reportosm1Data.getLayout = (page) => <Layout>{page}</Layout>;
export default Reportosm1Data;
