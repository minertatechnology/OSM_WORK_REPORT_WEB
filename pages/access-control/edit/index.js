import Layout from "@components/layout/Layout";
import ManageAccess from "@components/AccessControlComp/edit/ManageAccess";
import { useEffect, useLayoutEffect } from "react";
import { useLoading } from "@context/LoadingProvider";

const AccessControlEdit = () => {
  const { setLoading } = useLoading();

  useLayoutEffect(() => {
    setLoading(true);
  }, [setLoading]);

  useEffect(() => {
    setLoading(false);

    return () => {
      setLoading(false);
    };
  }, [setLoading]);

  const triggerLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return <ManageAccess triggerLoading={triggerLoading} />;
};

AccessControlEdit.getLayout = (page) => <Layout>{page}</Layout>;
export default AccessControlEdit;