import React from "react";

/**
 * Dynamic ButtonService component
 * @param {string|ReactNode} children - Button label/text (or node)
 * @param {string} type - Button type ("button", "submit", "reset")
 * @param {string} variant - Style variant ("primary", "secondary", "danger", etc.)
 * @param {boolean} disabled - Disabled state
 * @param {boolean} loading - Loading state
 * @param {function} onClick - Click handler
 * @param {string} className - Additional className
 * @param {ReactNode} icon - Optional icon node (left side)
 * @param {ReactNode} iconRight - Optional icon node (right side)
 * @param {string} size - Button size ("sm", "md", "lg")
 * @param {object} props - Rest props
 */
const ButtonService = ({
  children,
  type = "button",
  variant = "primary",
  disabled = false,
  loading = false,
  onClick,
  className = "",
  icon,
  iconRight,
  size = "md",
  ...props
}) => {
  // Basic style sets
  const base =
    "inline-flex items-center justify-center rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-1";
  const sizeMap = {
    sm: "text-sm px-3 py-1.5 h-8",
    md: "text-base px-5 py-2 h-11",
    lg: "text-lg px-7 py-3 h-14",
  };
  const variantMap = {
    primary:
      "bg-[#2196f3] hover:bg-[#1976d2] text-white focus:ring-[#90caf9] disabled:bg-[#b3e0fc] disabled:text-white",
    secondary:
      "bg-white border border-[#2196f3] text-[#2196f3] hover:bg-[#e3f0fd] focus:ring-[#90caf9] disabled:bg-[#f7fbfe] disabled:text-[#a3a3a3]",
    danger:
      "bg-[#e74c3c] hover:bg-[#c0392b] text-white focus:ring-[#f8bbbc] disabled:bg-[#fbd6d6] disabled:text-white",
    success:
      "bg-[#1ac47c] hover:bg-[#10b06e] text-white focus:ring-[#b5f3d2] disabled:bg-[#c7eedc] disabled:text-white",
  };
  const finalClass = [
    base,
    sizeMap[size] || sizeMap.md,
    variantMap[variant] || variantMap.primary,
    className,
  ].join(" ");

  return (
    <button
      type={type}
      className={finalClass}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin mr-2 h-5 w-5 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-20"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-70"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
      ) : icon ? (
        <span className="mr-2 flex items-center">{icon}</span>
      ) : null}
      <span>{children}</span>
      {iconRight ? (
        <span className="ml-2 flex items-center">{iconRight}</span>
      ) : null}
    </button>
  );
};

export default ButtonService;
