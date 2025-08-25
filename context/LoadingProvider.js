import React, { createContext, useState, useContext } from "react";
import styles from "@styles/LoadingSpinner.module.scss";

export const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {children}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinnerContainer}>
            {/* Pulse ring effect */}
            <div className={styles.pulseRing}></div>

            {/* Outer spinning ring */}
            <div className={styles.spinnerOuter}></div>

            {/* Main spinning ring */}
            <div className={styles.spinner}></div>

            {/* Logo center (no movement) */}
            <div className={styles.logoContainer}>
              <img
                src="/logodb.png"
                alt="Logo"
                className={styles.logoImage}
                draggable="false"
                decoding="async"
                fetchpriority="high"
              />
            </div>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);
