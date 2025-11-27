import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, X } from "lucide-react";

/**
 * CustomSelect - Custom dropdown select component with purple theme
 *
 * @param {Object} props
 * @param {string} props.label - Label text for the select
 * @param {string} props.value - Current selected value
 * @param {Function} props.onChange - Callback when value changes (receives event object with target.value)
 * @param {Array} props.options - Array of options (can be strings or objects with {label, value})
 * @param {string} props.placeholder - Placeholder text when no value selected
 * @param {React.Component} props.icon - Lucide icon component to display
 * @param {boolean} props.disabled - Whether the select is disabled
 * @param {string} props.className - Additional CSS classes for the container
 */
function CustomSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  icon: Icon,
  disabled,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const display = useMemo(() => {
    const found = options.find((opt) => (opt.value ?? opt) === value);
    return (found && (found.label ?? found)) || "";
  }, [options, value]);

  const cleanPlaceholder = useMemo(() => {
    return (
      placeholder?.replace(/^--\s*/, "").replace(/\s*--$/, "") || placeholder
    );
  }, [placeholder]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((v) => !v);
    setHighlightedIndex(-1);
  };

  const handleSelect = (option) => {
    onChange({ target: { value: option.value ?? option } });
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleClear = (event) => {
    event.stopPropagation();
    onChange({ target: { value: "" } });
    setIsOpen(false);
  };

  const handleKeyDown = (event) => {
    if (disabled) return;
    if (!isOpen) {
      if (
        event.key === "Enter" ||
        event.key === " " ||
        event.key === "ArrowDown"
      ) {
        event.preventDefault();
        setIsOpen(true);
      }
      return;
    }
    switch (event.key) {
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case "ArrowDown":
        event.preventDefault();
        setHighlightedIndex((prev) =>
          prev < options.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : options.length - 1
        );
        break;
      case "Enter":
        event.preventDefault();
        if (highlightedIndex >= 0) handleSelect(options[highlightedIndex]);
        break;
      default:
        break;
    }
  };

  return (
    <div
      className={`relative flex flex-col gap-1 ${className}`}
      ref={dropdownRef}
    >
      {label ? (
        <span className="text-sm font-semibold text-[#4b3b76]">{label}</span>
      ) : null}
      <div
        className={`w-full h-12 rounded-xl border-2 px-4 ${
          disabled
            ? "bg-gray-100 border-gray-200 cursor-not-allowed"
            : isOpen
            ? "border-[#7e32e2] ring-2 ring-purple-200"
            : "border-purple-200"
        } ${
          !disabled && "bg-gradient-to-r from-purple-50/80 to-violet-50/80"
        } text-gray-700 font-medium ${
          !disabled && "hover:border-purple-300 hover:shadow-sm"
        } transition-all duration-200 ${
          !disabled && "cursor-pointer"
        } flex items-center justify-between`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {Icon && (
            <Icon
              size={18}
              className={disabled ? "text-gray-400" : "text-[#7e32e2]"}
            />
          )}
          <span
            className={`truncate ${value ? "text-gray-700" : "text-gray-400"}`}
          >
            {display || cleanPlaceholder}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-lg hover:bg-red-50 transition-colors duration-200 group"
              aria-label="Clear selection"
            >
              <X size={16} className="text-red-500 group-hover:text-red-600" />
            </button>
          )}
          <ChevronDown
            size={20}
            className={`${
              disabled ? "text-gray-400" : "text-[#7e32e2]"
            } transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-xl border-2 border-purple-200 shadow-xl max-h-64 overflow-auto">
          <ul role="listbox">
            <li
              className={`px-4 py-3 cursor-pointer transition-colors ${
                !value
                  ? "bg-purple-50 text-[#7e32e2] font-semibold"
                  : "hover:bg-purple-50 text-gray-700"
              }`}
              onClick={() => handleSelect({ value: "" })}
              role="option"
            >
              {cleanPlaceholder}
            </li>
            {options.map((option, index) => (
              <li
                key={option.value || option.label || option}
                className={`px-4 py-3 cursor-pointer transition-colors ${
                  value === (option.value ?? option)
                    ? "bg-gradient-to-r from-purple-100 to-violet-100 text-[#7e32e2] font-semibold border-l-4 border-[#7e32e2]"
                    : highlightedIndex === index
                    ? "bg-purple-50 text-gray-700"
                    : "hover:bg-purple-50 text-gray-700"
                }`}
                onClick={() => handleSelect(option)}
                role="option"
                aria-selected={value === (option.value ?? option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {option.label ?? option}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CustomSelect;
