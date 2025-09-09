import React from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

// Thai month names and weekday short names
const TH_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];
const TH_WEEKDAYS = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];

// Format date for display (dd / mm / yyyy)
const formatDateDisplay = (date, type = "date") => {
  if (!date) return "";
  if (type === "year" && /^\d{4}/.test(date)) {
    return date.slice(0, 4);
  }
  if (type === "month" && /^\d{4}-\d{2}/.test(date)) {
    const [y, m] = date.split("-");
    return `${TH_MONTHS[parseInt(m, 10) - 1]} ${y}`;
  }
  if (type === "week") {
    return date; // Assume week label string
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split("-");
    return `${d} / ${m} / ${y}`;
  }
  return date;
};

const toDateValue = (str, type = "date") => {
  if (!str) return "";
  if (type === "year") {
    if (/^\d{4}/.test(str)) return str.slice(0, 4);
  }
  if (type === "month") {
    if (/^\d{4}-\d{2}/.test(str)) return str.slice(0, 7);
    // "มิถุนายน 2568" → "2568-06"
    const match = str.match(/([^\s]+)\s(\d{4,})/);
    if (match) {
      const y = match[2];
      const m = (TH_MONTHS.indexOf(match[1]) + 1).toString().padStart(2, "0");
      return `${y}-${m}`;
    }
  }
  if (type === "week") return str;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parts = str.split("/");
  if (parts.length === 3) {
    const [d, m, y] = parts.map((n) => n.trim());
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return str;
};

function getDaysArray(year, month) {
  const firstDay = new Date(year, month, 1);
  const startDay = (firstDay.getDay() + 6) % 7; // Monday=0
  const days = [];
  const lastDate = new Date(year, month + 1, 0).getDate();
  for (let i = 0; i < startDay; ++i) days.push(null);
  for (let date = 1; date <= lastDate; ++date) days.push(date);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

const YearPopover = ({
  show,
  value,
  onChange,
  onClose,
  min = 1900,
  max = 2100,
  anchor,
}) => {
  const currentYear = new Date().getFullYear();
  const [viewYear, setViewYear] = React.useState(
    value ? parseInt(value) : currentYear
  );

  const years = [];
  for (let y = max; y >= min; y--) years.push(y);

  React.useEffect(() => {
    if (value && /^\d{4}/.test(value)) setViewYear(parseInt(value));
  }, [value, show]);

  // Close on click outside
  const popoverRef = React.useRef(null);
  React.useEffect(() => {
    if (!show) return;
    const handle = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        (!anchor || !anchor.contains(e.target))
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [show, onClose, anchor]);

  return show ? (
    <div
      ref={popoverRef}
      className="absolute z-30 bg-white border border-[#d3e6fb] rounded-xl shadow-lg py-2 px-3 transition animate-fadein"
      style={{
        minWidth: 120,
        right: 0,
        top: "calc(100% + 2px)",
      }}
    >
      <div className="flex flex-col gap-1 max-h-[180px] overflow-auto">
        {years.map((y) => (
          <button
            key={y}
            type="button"
            className={`py-1 px-2 rounded text-left transition ${
              y === viewYear
                ? "bg-[#6E28B7] text-white font-semibold"
                : "hover:bg-[#f3f9ff] text-[#4F4F4F]"
            }`}
            onClick={() => {
              onChange && onChange(y.toString());
              onClose();
            }}
          >
            {y}
          </button>
        ))}
      </div>
    </div>
  ) : null;
};

const MonthPopover = ({
  show,
  value,
  onChange,
  onClose,
  minYear = 1900,
  maxYear = 2100,
  anchor,
}) => {
  const current = value && /^\d{4}-\d{2}/.test(value) ? value : "";
  const now = new Date();
  const viewYear = current
    ? parseInt(current.split("-")[0])
    : now.getFullYear();
  const [year, setYear] = React.useState(viewYear);

  React.useEffect(() => {
    if (current) setYear(parseInt(current.split("-")[0]));
  }, [current, show]);

  const months = Array.from({ length: 12 }, (_, idx) => idx + 1);

  const popoverRef = React.useRef(null);
  React.useEffect(() => {
    if (!show) return;
    const handle = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        (!anchor || !anchor.contains(e.target))
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [show, onClose, anchor]);

  return show ? (
    <div
      ref={popoverRef}
      className="absolute z-30 bg-white border border-[#d3e6fb] rounded-xl shadow-lg py-2 px-3 transition animate-fadein"
      style={{
        minWidth: 200,
        right: 0,
        top: "calc(100% + 2px)",
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <button
          type="button"
          className="p-1 rounded hover:bg-[#f3f9ff]"
          onClick={() => setYear((y) => y - 1)}
          disabled={year <= minYear}
        >
          <ChevronLeft className="text-[#6E28B7]" size={18} />
        </button>
        <span className="font-semibold text-[#6E28B7]">{year}</span>
        <button
          type="button"
          className="p-1 rounded hover:bg-[#f3f9ff]"
          onClick={() => setYear((y) => y + 1)}
          disabled={year >= maxYear}
        >
          <ChevronRight className="text-[#6E28B7]" size={18} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {months.map((m, idx) => (
          <button
            key={m}
            type="button"
            className={`py-1 px-3 rounded transition ${
              current === `${year}-${String(m).padStart(2, "0")}`
                ? "bg-[#6E28B7] text-white font-semibold"
                : "hover:bg-[#f3f9ff] text-[#4F4F4F]"
            }`}
            onClick={() => {
              const val = `${year}-${String(m).padStart(2, "0")}`;
              onChange && onChange(val);
              onClose();
            }}
          >
            {TH_MONTHS[idx]}
          </button>
        ))}
      </div>
    </div>
  ) : null;
};

// สำหรับ week: ใช้ select ใน inputService ดีกว่า

const dateService = ({
  value,
  onChange,
  name,
  placeholder = "dd / mm / yyyy",
  required,
  disabled,
  className = "",
  mode = "date", // "date" | "year" | "month" | "week"
  min,
  max,
  ...props
}) => {
  const [inputValue, setInputValue] = React.useState(
    formatDateDisplay(value, mode)
  );
  const [showPicker, setShowPicker] = React.useState(false);
  const iconRef = React.useRef(null);
  const wrapperRef = React.useRef(null);

  React.useEffect(() => {
    setInputValue(formatDateDisplay(value, mode));
  }, [value, mode]);

  // Handler for all pickers
  const handleChange = (val) => {
    if (onChange)
      onChange({
        target: { name, value: val },
      });
    setInputValue(formatDateDisplay(val, mode));
  };

  const inputClass =
    "w-full border border-[#6E28B7] rounded-lg px-3 py-2 text-[16px] bg-white focus:outline-none transition placeholder:text-[#b9b9b9] h-11 pr-10 select-none cursor-pointer " +
    className;

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        name={name}
        value={inputValue}
        placeholder={
          mode === "year"
            ? "เลือกปี"
            : mode === "month"
            ? "เลือกเดือน"
            : mode === "week"
            ? "เลือกสัปดาห์"
            : placeholder
        }
        required={required}
        disabled={disabled}
        readOnly
        onFocus={() => setShowPicker(true)}
        className={inputClass}
        autoComplete="off"
        {...props}
        style={{
          cursor: "pointer",
          userSelect: "none",
        }}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        aria-label="เลือกวันที่"
        ref={iconRef}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none p-0 m-0 cursor-pointer"
        style={{ zIndex: 2 }}
        onClick={() => setShowPicker((v) => !v)}
      >
        <CalendarDays className="text-[#6E28B7] w-5 h-5 pointer-events-none" />
      </button>
      {showPicker && mode === "year" && (
        <YearPopover
          show={showPicker}
          value={toDateValue(inputValue, "year")}
          onChange={(val) => {
            handleChange(val);
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
          min={min ? parseInt(min) : 1900}
          max={max ? parseInt(max) : 2100}
          anchor={iconRef.current}
        />
      )}
      {showPicker && mode === "month" && (
        <MonthPopover
          show={showPicker}
          value={toDateValue(inputValue, "month")}
          onChange={(val) => {
            handleChange(val);
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
          anchor={iconRef.current}
        />
      )}
      {/* DatePopover: สามารถเพิ่มได้ตามต้องการ */}
    </div>
  );
};

export default dateService;
