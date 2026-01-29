import React, { useState, useEffect } from "react";
import Toast from "./Toast";

const ToastManager = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Listen for custom toast events
    const handleShowToast = (e) => {
      const { type, message, duration } = e.detail;
      const id = Date.now();
      setToasts(prev => [...prev, { id, type, message, duration }]);
    };

    window.addEventListener("showToast", handleShowToast);
    return () => window.removeEventListener("showToast", handleShowToast);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
};

// Helper function to show toast from anywhere
export const showToast = (message, type = "success", duration = 3000) => {
  const event = new CustomEvent("showToast", {
    detail: { message, type, duration }
  });
  window.dispatchEvent(event);
};

export default ToastManager;
