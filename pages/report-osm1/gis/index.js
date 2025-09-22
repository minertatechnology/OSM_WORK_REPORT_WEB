import Layout from "@components/layout/Layout";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useLoading } from "@context/LoadingProvider";

// Dynamically import GisComp with SSR disabled
const GisComp = dynamic(() => import("@components/Reportosm1Comp/GisComp/GisComp"), {
  ssr: false,
  loading: () => <div>Loading map...</div>
});

const Gis = () => {
  const { setLoading } = useLoading();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return <GisComp triggerLoading={triggerLoading} />;
};

Gis.getLayout = (page) => <Layout>{page}</Layout>;
export default Gis;
