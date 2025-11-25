import Layout from "@components/layout/Layout";
import ThreeDocComp from "@components/ThreeDocComp/ThreeDocComp";
import { useEffect } from "react";
import { useLoading } from "@context/LoadingProvider";

const ThreeDoc = () => {
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

  return <ThreeDocComp triggerLoading={triggerLoading} />;
};

ThreeDoc.getLayout = (page) => <Layout>{page}</Layout>;
export default ThreeDoc;
