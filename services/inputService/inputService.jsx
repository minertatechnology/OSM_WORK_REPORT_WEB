import React from "react";

/**
 * Dynamic input/select/textarea component
 * @param {string} placeholder - Placeholder text
 * @param {string} value - Current value
 * @param {function} onChange - Change handler (e.target.value)
 * @param {array} options - Optional array for select menu. If not provided, renders input
 * @param {boolean} multiline - If true, renders textarea (multi-row input)
 * @param {number} rows - Row count for textarea (default: 3)
 * @param {string} name - Optional name attribute
 * @param {boolean} disabled - Optional disabled attribute
 * @param {boolean} optionWithIcon - If true, use custom dropdown with icon support (default: false)
 * @param {boolean} clearable - If true, show clear (x) button for select/input when value is selected
 * @param {object} style - Custom style object
 */
const InputService = ({
  placeholder = "",
  value = "",
  onChange,
  options,
  multiline = false,
  rows = 3,
  name,
  disabled,
  optionWithIcon = false,
  clearable = true,
  style = {},
  ...props
}) => {
  // เพิ่ม class สำหรับ disabled
  const baseClass =
    "w-full border border-[#2991e8] rounded-lg px-3 py-2 text-[15px] md:text-[16px] bg-white focus:outline-none transition placeholder:text-[#b9b9b9]";
  const inputClass = `${baseClass} h-11 text-[18px]`;
  const selectClass = `${baseClass} h-11 pr-14 appearance-none text-[18px]`;

  // Small arrow SVG size: width="13" height="8"
  const smallArrowSVG = `<svg width="13" height="8" viewBox="0 0 13 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.5 8L0.573593 0.5L12.4264 0.5L6.5 8Z" fill="#2991e8"/></svg>`;

  // Custom X icon SVG (rounded and modern)
  const customXSVG = (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
      <circle cx="8.5" cy="8.5" r="8" fill="#f7d8d8" />
      <path
        d="M6.6 6.6L10.4 10.4M10.4 6.6L6.6 10.4"
        stroke="#e74c3c"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );

  const dropdownListClass =
    "absolute z-20 left-0 right-0 bg-white shadow-lg rounded-xl mt-1 border border-[#e5e7eb] max-h-60 overflow-auto animate-fadein";

  const textareaClass =
    baseClass +
    " resize-none min-h-[70px] max-h-[200px] leading-[1.6] text-[15px]";

  const [showDropdown, setShowDropdown] = React.useState(false);
  const selectRef = React.useRef(null);

  React.useEffect(() => {
    if (!Array.isArray(options)) return;
    const handleClick = (e) => {
      if (selectRef.current && !selectRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [options]);

  // ฟังก์ชันสำหรับ clear ค่าใน select (และ input)
  const handleClear = (e) => {
    e.stopPropagation();
    if (typeof onChange === "function") {
      onChange({
        target: { value: "", name },
        value: "",
      });
    }
    setShowDropdown(false);
  };

  // สไตล์สำหรับ disabled
  const disabledStyle = disabled
    ? {
        background: "#f3f4f6",
        color: "#a3a3a3 !important", // <<--- เพิ่ม !important
      }
    : {};

  // เพิ่ม class สำหรับ disabled
  const disabledClass = disabled ? " opacity-60" : "";

  if (multiline) {
    return (
      <textarea
        className={textareaClass + disabledClass}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        name={name}
        disabled={disabled}
        {...props}
        style={{
          ...disabledStyle,
          ...style,
          boxSizing: "border-box",
        }}
      />
    );
  }

  if (Array.isArray(options) && options.length > 0) {
    const selected =
      options.find((opt) => opt.value === value) || options[0] || {};
    const isClearable =
      clearable &&
      typeof onChange === "function" &&
      value !== "" &&
      selected.value !== undefined &&
      selected.value !== "" &&
      options.findIndex((opt) => opt.value === value) > 0;

    // ใช้ flex และ absolute arrow ขวาสุด, x icon ชิด arrow
    return (
      <div
        className={"relative select-none" + disabledClass}
        tabIndex={0}
        ref={selectRef}
      >
        <button
          type="button"
          className={
            selectClass +
            " flex items-center !text-[#111] cursor-pointer relative pr-12" +
            disabledClass
          }
          onClick={() => setShowDropdown((s) => !s)}
          disabled={disabled}
          style={{
            ...disabledStyle,
            ...style,
            textOverflow: style?.textOverflow || "ellipsis",
            overflow: style?.overflow || "hidden",
            whiteSpace: style?.whiteSpace || "nowrap",
          }}
        >
          {/* Content row: [label, icon, x, arrow] */}
          <span className="flex-1 truncate text-left" style={{
            textOverflow: style?.textOverflow || "ellipsis",
            overflow: style?.overflow || "hidden",
            whiteSpace: style?.whiteSpace || "nowrap",
          }}>
            {selected.label ||
              (typeof selected === "string" ? selected : placeholder)}
          </span>
          {selected.icon && (
            <span className="ml-2 flex-shrink-0 flex items-center">
              {selected.icon}
            </span>
          )}
          {/* X (clear) icon - absolute, right before arrow */}
          {isClearable && (
            <span
              className="absolute top-1/2 right-10 -translate-y-1/2 flex items-center cursor-pointer"
              style={{
                width: 24,
                height: 24,
                zIndex: 11,
              }}
              onClick={handleClear}
              tabIndex={-1}
              title="ลบข้อมูล"
            >
              {customXSVG}
            </span>
          )}
          {/* arrow absolute ขวาสุด */}
          <span
            className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center pointer-events-none"
            style={{
              width: 16,
              height: 16,
            }}
            aria-hidden="true"
            dangerouslySetInnerHTML={{
              __html: smallArrowSVG,
            }}
          />
        </button>
        {showDropdown && !disabled && (
          <ul className={dropdownListClass}>
            {options.map((opt, idx) => {
              const isObj = typeof opt === "object";
              // const isSelected = value === (isObj ? opt.value : opt);
              return (
                <li
                  key={isObj ? opt.value ?? idx : idx}
                  className={`px-4 py-2 flex items-center gap-2 text-[#111] hover:bg-[#f1f6ff] cursor-pointer ${
                    idx === 0
                      ? "rounded-t-xl"
                      : idx === options.length - 1
                      ? "rounded-b-xl"
                      : ""
                  }`}
                  onClick={() => {
                    if (!disabled) {
                      onChange({
                        target: { value: isObj ? opt.value : opt, name },
                        value: isObj ? opt.value : opt,
                      });
                      setShowDropdown(false);
                    }
                  }}
                >
                  <span className="flex-1 flex items-center gap-2 truncate">
                    {isObj && opt.icon && (
                      <span className="mr-2">{opt.icon}</span>
                    )}
                    <span>{isObj ? opt.label : opt}</span>
                  </span>
                  {/* No tick icon */}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  // input ธรรมดา (ถ้า clearable และ value ไม่ว่าง ให้โชว์ icon x)
  const isClearableInput =
    clearable && typeof onChange === "function" && value !== "" && !disabled;

  return (
    <div className={"relative w-full" + disabledClass}>
      <input
        className={inputClass + disabledClass}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        name={name}
        disabled={disabled}
        {...props}
        style={{
          ...disabledStyle,
          ...style,
        }}
      />
      {isClearableInput && (
        <span
          className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center cursor-pointer"
          style={{
            width: 24,
            height: 24,
            zIndex: 10,
          }}
          onClick={handleClear}
          tabIndex={-1}
          title="ลบข้อมูล"
        >
          {customXSVG}
        </span>
      )}
    </div>
  );
};

export default InputService;
