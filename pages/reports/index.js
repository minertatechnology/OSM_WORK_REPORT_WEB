import Layout from "@components/layout/Layout";
import ReportsMapView from "@components/ReportsMap/ReportsMapView";
import { useEffect } from "react";
import { useLoading } from "@context/LoadingProvider";

const ReportsPage = () => {
  const { setLoading } = useLoading();

  useEffect(() => {
    setLoading(true);
  }, [setLoading]);

  useEffect(() => {
    setLoading(false);
    return () => {
      setLoading(false);
    };
  }, [setLoading]);

  return <ReportsMapView />;
};

ReportsPage.getLayout = (page) => <Layout>{page}</Layout>;
export default ReportsPage;
