import React, { createContext, useContext, useEffect, useState } from "react";

const DateTimeContext = createContext();

export const DateTimeProvider = ({ children }) => {
  const [currentTime, setCurrentTime] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      process.env.TZ = "Asia/Bangkok";

      const originalToLocaleString = Date.prototype.toLocaleString;
      const originalToLocaleDateString = Date.prototype.toLocaleDateString;
      const originalToLocaleTimeString = Date.prototype.toLocaleTimeString;

      Date.prototype.toLocaleString = function (
        locales = "th-TH",
        options = {}
      ) {
        return originalToLocaleString.call(this, locales, {
          timeZone: "Asia/Bangkok",
          ...options,
        });
      };

      Date.prototype.toLocaleDateString = function (
        locales = "th-TH",
        options = {}
      ) {
        return originalToLocaleDateString.call(this, locales, {
          timeZone: "Asia/Bangkok",
          ...options,
        });
      };

      Date.prototype.toLocaleTimeString = function (
        locales = "th-TH",
        options = {}
      ) {
        return originalToLocaleTimeString.call(this, locales, {
          timeZone: "Asia/Bangkok",
          ...options,
        });
      };

      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const updateCurrentTime = () => {
      setCurrentTime(getCurrentThaiDate());
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 1000);

    return () => clearInterval(interval);
  }, [isInitialized]);

  const getCurrentThaiDate = () => {
    return new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
    );
  };

  // เวลาเป็นภาษาไทย
  const getThaiDateTime = (date = currentTime) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Bangkok",
      hour12: false,
    }).format(date);
  };

  // วันที่เป็นภาษาไทย
  const getThaiDate = (date = currentTime) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Bangkok",
    }).format(date);
  };

  // เวลาเป็นภาษาไทย
  const getThaiTime = (date = currentTime) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Bangkok",
      hour12: false,
    }).format(date);
  };

  const contextValue = {
    currentTime,
    isInitialized,
    getCurrentThaiDate,
    getThaiDateTime,
    getThaiDate,
    getThaiTime,
    timezone: "Asia/Bangkok",
    locale: "th-TH",
  };

  return (
    <DateTimeContext.Provider value={contextValue}>
      {children}
    </DateTimeContext.Provider>
  );
};

export const useDateTime = () => {
  const context = useContext(DateTimeContext);
  if (!context) {
    throw new Error("useDateTime must be used within a DateTimeProvider");
  }
  return context;
};

export const withDateTime = (Component) => {
  return function DateTimeWrappedComponent(props) {
    return (
      <DateTimeProvider>
        <Component {...props} />
      </DateTimeProvider>
    );
  };
};
