import Layout from "@components/layout/layout";
import AccessControlComp from "@components/AccessControlComp/AccessControlComp";
import { useEffect, useLayoutEffect } from "react";
import { useLoading } from "@context/LoadingProvider";

const AccessControl = () => {
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

  return <AccessControlComp triggerLoading={triggerLoading} />;
};

AccessControl.getLayout = (page) => <Layout>{page}</Layout>;
export default AccessControl;
