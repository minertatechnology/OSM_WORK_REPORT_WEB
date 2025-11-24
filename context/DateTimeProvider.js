import React, { createContext, useContext, useEffect, useState } from "react";

const DateTimeContext = createContext();

export const DateTimeProvider = ({ children }) => {
  const [currentTime, setCurrentTime] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      process.env.TZ = "Asia/Bangkok";
      setIsInitialized(true);
    }
  }, []);

  // ไม่ต้อง update ทุกวินาที - ให้คำนวณตอนเรียกใช้แทน
  useEffect(() => {
    if (!isInitialized) return;
    // Set initial time only
    setCurrentTime(getCurrentThaiDate());
  }, [isInitialized]);

  const getCurrentThaiDate = () => {
    return new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
    );
  };

  // เวลาเป็นภาษาไทย - คำนวณ real-time
  const getThaiDateTime = (date) => {
    const targetDate = date || getCurrentThaiDate();
    if (!targetDate) return "";
    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Bangkok",
      hour12: false,
    }).format(targetDate);
  };

  // วันที่เป็นภาษาไทย - คำนวณ real-time
  const getThaiDate = (date) => {
    const targetDate = date || getCurrentThaiDate();
    if (!targetDate) return "";
    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Bangkok",
    }).format(targetDate);
  };

  // เวลาเป็นภาษาไทย - คำนวณ real-time
  const getThaiTime = (date) => {
    const targetDate = date || getCurrentThaiDate();
    if (!targetDate) return "";
    return new Intl.DateTimeFormat("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Bangkok",
      hour12: false,
    }).format(targetDate);
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
