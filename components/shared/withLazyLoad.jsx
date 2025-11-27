import { Suspense } from "react";
import { ComponentLoadingSpinner } from "./LoadingSpinner";

/**
 * Higher Order Component (HOC) สำหรับ wrap component ด้วย Suspense
 * ใช้สำหรับ lazy-loaded components
 */
export const withLazyLoad = (LazyComponent, fallback = null) => {
  const WrappedComponent = (props) => (
    <Suspense fallback={fallback || <ComponentLoadingSpinner />}>
      <LazyComponent {...props} />
    </Suspense>
  );

  WrappedComponent.displayName = `withLazyLoad(${LazyComponent.displayName || LazyComponent.name || 'Component'})`;

  return WrappedComponent;
};

export default withLazyLoad;
