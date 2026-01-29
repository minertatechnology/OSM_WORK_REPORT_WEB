import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

const Toast = ({ type = "success", message, duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  const styles = {
    success: {
      bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      icon: CheckCircle,
      iconColor: "#fff"
    },
    error: {
      bg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      icon: XCircle,
      iconColor: "#fff"
    },
    warning: {
      bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      icon: AlertCircle,
      iconColor: "#fff"
    }
  };

  const config = styles[type] || styles.success;
  const Icon = config.icon;

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: `translateX(-50%) ${isVisible ? "translateY(0)" : "translateY(-100px)"}`,
        background: config.bg,
        color: "#fff",
        padding: "16px 24px",
        borderRadius: "16px",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        minWidth: "320px",
        maxWidth: "500px",
        zIndex: 10000,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? "auto" : "none"
      }}
    >
      <Icon size={24} color={config.iconColor} style={{ flexShrink: 0 }} />
      <span style={{
        flex: 1,
        fontSize: "16px",
        fontWeight: 600,
        fontFamily: "Prompt, 'Kanit', 'Roboto', sans-serif"
      }}>
        {message}
      </span>
      <button
        onClick={handleClose}
        style={{
          background: "rgba(255, 255, 255, 0.2)",
          border: "none",
          borderRadius: "8px",
          width: "32px",
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "background 0.2s",
          flexShrink: 0
        }}
        onMouseEnter={(e) => e.target.style.background = "rgba(255, 255, 255, 0.3)"}
        onMouseLeave={(e) => e.target.style.background = "rgba(255, 255, 255, 0.2)"}
      >
        <X size={18} color="#fff" />
      </button>
    </div>
  );
};

export default Toast;
