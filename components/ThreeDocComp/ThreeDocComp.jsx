import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Building2,
  Users,
  Home,
  Heart,
  UserCheck,
  ChevronDown,
  X,
} from "lucide-react";

// ⬇️ เรียกใช้ยูทิลสิทธิ์จาก @utils/access
import {
  ALLOWED_ROLES,
  readInfoFromCookie,
  roleToLockLevel,
  isFieldLocked,
} from "@utils/access";

const numberFmt = (n) => (n || n === 0 ? n.toLocaleString("th-TH") : "-");
const PALETTE = ["#4B0082", "#DA70D6"];

const elderlyColumns = [
  { key: "id",     label: "ลำดับ",              align: "center", width: "40px" },
  { key: "name",   label: "คัดกรองผู้สูงอายุ", align: "left",   width: "70px" },
  { key: "normal", label: "ปกติ",               align: "center", width: "40px" },
  { key: "risk",   label: "เสี่ยง/มีปัญหา",     align: "center", width: "40px" },
  { key: "total",  label: "รวมทั้งหมด",         align: "center", width: "40px" },
];

/* ---------- CustomSelect Component ---------- */
function CustomSelect({ value, onChange, options, placeholder, icon: Icon, disabled = false }) {
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

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setHighlightedIndex(-1);
    }
  };

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setHighlightedIndex(-1);
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
        if (highlightedIndex >= 0) {
          handleSelect(options[highlightedIndex]);
        }
        break;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`w-full h-12 px-4 rounded-xl border-2 ${
          disabled
            ? "border-gray-200 bg-gray-50 cursor-not-allowed"
            : isOpen
            ? "border-[#7e32e2] ring-2 ring-purple-200"
            : "border-purple-200"
        } bg-gradient-to-r from-purple-50/80 to-violet-50/80 text-gray-700 font-medium hover:border-purple-300 hover:shadow-sm transition-all duration-200 cursor-pointer flex items-center justify-between`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={18} className={disabled ? "text-gray-400" : "text-[#7e32e2]"} />}
          <span className={value ? "text-gray-700" : "text-gray-400"}>
            {value || placeholder}
          </span>
        </div>
        <ChevronDown
          size={20}
          className={`${disabled ? "text-gray-400" : "text-[#7e32e2]"} transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border-2 border-purple-200 shadow-xl max-h-64 overflow-auto">
          <ul role="listbox">
            <li
              className={`px-4 py-3 cursor-pointer transition-colors ${
                !value
                  ? "bg-purple-50 text-[#7e32e2] font-semibold"
                  : "hover:bg-purple-50 text-gray-700"
              }`}
              onClick={() => handleSelect("")}
              role="option"
            >
              {placeholder}
            </li>
            {options.map((option, index) => (
              <li
                key={option}
                className={`px-4 py-3 cursor-pointer transition-colors ${
                  value === option
                    ? "bg-gradient-to-r from-purple-100 to-violet-100 text-[#7e32e2] font-semibold border-l-4 border-[#7e32e2]"
                    : highlightedIndex === index
                    ? "bg-purple-50 text-gray-700"
                    : "hover:bg-purple-50 text-gray-700"
                }`}
                onClick={() => handleSelect(option)}
                role="option"
                aria-selected={value === option}
              >
                {option}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------- Donut ---------- */
function Donut({ data, maxSize = 300, minSize = 200, thicknessRatio = 0.22 }) {
  const ref = useRef(null);
  const [size, setSize] = useState(maxSize);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const apply = (w) => setSize(Math.max(minSize, Math.min(maxSize, Math.floor(w))));
    apply(el.clientWidth);
    const ro = new ResizeObserver((e) => {
      const w = e[0]?.contentRect?.width;
      if (w) apply(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxSize, minSize]);

  const total = data.reduce((a, b) => a + b.value, 0);
  const radius = size / 2;
  const thickness = Math.max(24, Math.floor(size * thicknessRatio));
  const r = radius - thickness / 2 - 6;
  const C = 2 * Math.PI * r;

  let acc = 0;
  const arcs = data.map((d, i) => {
    const pct = total ? d.value / total : 0;
    const dash = `${pct * C} ${C}`;
    const off = -acc * C;
    acc += pct;
    return { dash, off, color: PALETTE[i % PALETTE.length] };
  });

  return (
    <div ref={ref} style={{ width: "100%", display: "grid", placeItems: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`translate(${radius}, ${radius})`}>
          <circle r={r} cx={0} cy={0} fill="none" stroke="#F3E8FF" strokeWidth={thickness} />
          {arcs.map((a, i) => (
            <circle
              key={i}
              r={r}
              cx={0}
              cy={0}
              fill="none"
              stroke={a.color}
              strokeWidth={thickness}
              strokeDasharray={a.dash}
              strokeDashoffset={a.off}
              transform="rotate(-90)"
            />
          ))}
        </g>
      </svg>
      <div style={{ position: "relative", marginTop: -size }}>
        <div
          style={{
            width: size,
            height: size,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: Math.max(18, Math.floor(size * 0.13)), color: "#6E28B7" }}>
            {numberFmt(total)}
          </div>
          <div style={{ fontWeight: 700, color: "#6E28B7" }}>Case</div>
        </div>
      </div>
    </div>
  );
}

export default function ThreeDocComp() {
  /* ---------- สิทธิ์ ---------- */
  const [{ scope }, setAuth] = useState({ roles: [], scope: {} });
  const [hasAccess, setHasAccess] = useState(false);
  const [activeRole, setActiveRole] = useState("");
  const [lockLevel, setLockLevel] = useState("deny");

  useEffect(() => {
    const { roles, scope } = readInfoFromCookie();
    const mainRole = (roles || []).find((r) => ALLOWED_ROLES.includes(r)) || "";
    setAuth({ roles: roles || [], scope: scope || {} });
    setHasAccess(!!mainRole);
    setActiveRole(mainRole);
    setLockLevel(roleToLockLevel(mainRole));
  }, []);

  /* ---------- ฟิลเตอร์ ---------- */
  const [filters, setFilters] = useState({
    year: "2568",
    month: "มิถุนายน",
    week: "สัปดาห์ที่ 4 (23/6/68-27/6/68)",
    healthZone: "ทั้งหมด",
    province: "",
    district: "",
    subdistrict: "",
    unit: "",
  });

  useEffect(() => {
    if (!hasAccess) return;
    setFilters((prev) => {
      const next = { ...prev };
      if (lockLevel === "zone" && scope.zone) next.healthZone = scope.zone;
      if (["province", "district", "subdistrict", "unit"].includes(lockLevel) && scope.zone) next.healthZone = scope.zone;
      if (["province", "district", "subdistrict", "unit"].includes(lockLevel) && scope.province) next.province = scope.province;
      if (["district", "subdistrict", "unit"].includes(lockLevel) && scope.district) next.district = scope.district;
      if (["subdistrict", "unit"].includes(lockLevel) && scope.subdistrict) next.subdistrict = scope.subdistrict;
      if (["unit"].includes(lockLevel) && scope.unit) next.unit = scope.unit;
      return next;
    });
  }, [hasAccess, lockLevel, scope]);

  /* ---------- ข้อมูล mock ---------- */
  const kpiTop = useMemo(
    () => ({ population: 6142, houseDoc: 179, publicHealthDoc: 7, familyDoc: 1 }),
    []
  );

  const bmiRow = [
    { label: "ผอม", value: 34235 },
    { label: "ปกติ", value: 308132 },
    { label: "น้ำหนักเกิน", value: 229411 },
    { label: "อ้วน", value: 343040 },
    { label: "อ้วนมาก", value: 132949 },
  ];
  const bpRow = [
    { label: "ปกติ", value: 555793 },
    { label: "เริ่มสูง", value: 296238 },
    { label: "สูง", value: 170753 },
    { label: "สูงมาก", value: 23980 },
  ];
  const sugarRow = [
    { label: "ปกติ", value: 731861 },
    { label: "เสี่ยง", value: 228986 },
    { label: "ป่วย", value: 86984 },
  ];
  const elderlyScreens = [
    "ด้านการคัดกรองทั่วไป",
    "ด้านการเคลื่อนไหวร่างกาย",
    "ด้านการทดสอบการหายใจ",
    "ด้านการมองเห็น",
    "ด้านการได้ยิน",
    "ด้านภาวะซึมเศร้า",
    "ด้านการกลืนอาหาร",
    "ด้านการปฏิบัติกิจวัตร ประจำวัน",
    "ช่องปาก",
  ].map((name, i) => ({ id: i + 1, name, normal: 100, risk: 0, total: 100 }));

  const iodineData = [
    { name: "ได้รับ", value: 80 },
    { name: "ไม่ได้รับ", value: 20 },
  ];

  /* ---------- Gate ไม่มีสิทธิ์ ---------- */
  if (!hasAccess) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-[#faf8ff] via-white to-[#f5f0ff] p-4 sm:p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-[#ece1f7] p-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <div className="text-xl font-bold text-[#7e32e2]">ไม่มีสิทธิ์เข้าถึงหน้านี้</div>
              <div className="text-gray-600 mt-1">
                กรุณาติดต่อผู้ดูแลระบบเพื่อเพิ่มสิทธิ์: {ALLOWED_ROLES.join(" / ")}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- UI ---------- */
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#faf8ff] via-white to-[#f5f0ff] p-4 sm:p-6">
      {/* Header Section with Gradient */}
      <div className="relative mb-6 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7e32e2] via-[#9333ea] to-[#a855f7]" />
        <div className="absolute inset-0 bg-white/5" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Title */}
            <div className="text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Heart size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    รายละเอียดข้อมูล 3 หมอ รู้จักคุณ
                  </h1>
                  <p className="text-white/80 text-sm mt-1">
                    ข้อมูลประชากรและคัดกรองโรคไม่ติดต่อเรื้อรัง (NCDs)
                  </p>
                </div>
              </div>

              {activeRole && (
                <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
                  <UserCheck size={16} />
                  <span className="text-sm font-semibold">บทบาท: {activeRole}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#ece1f7] p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              ปี
            </label>
            <CustomSelect
              value={filters.year}
              onChange={(val) => setFilters({ ...filters, year: val })}
              options={["2568", "2567"]}
              placeholder="เลือกปี"
              icon={Calendar}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              เดือน
            </label>
            <CustomSelect
              value={filters.month}
              onChange={(val) => setFilters({ ...filters, month: val })}
              options={["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"]}
              placeholder="เลือกเดือน"
              icon={Calendar}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              สัปดาห์
            </label>
            <CustomSelect
              value={filters.week}
              onChange={(val) => setFilters({ ...filters, week: val })}
              options={["สัปดาห์ที่ 1","สัปดาห์ที่ 2","สัปดาห์ที่ 3","สัปดาห์ที่ 4 (23/6/68-27/6/68)"]}
              placeholder="เลือกสัปดาห์"
              icon={Calendar}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              เขตสุขภาพ
            </label>
            <CustomSelect
              value={filters.healthZone}
              onChange={(val) => setFilters({ ...filters, healthZone: val })}
              options={["ทั้งหมด", ...Array.from({length:13},(_,i)=>`เขตสุขภาพที่ ${i+1}`)]}
              placeholder="เลือกเขตสุขภาพ"
              icon={MapPin}
              disabled={isFieldLocked(lockLevel, "zone")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              จังหวัด
            </label>
            <CustomSelect
              value={filters.province}
              onChange={(val) => setFilters({ ...filters, province: val })}
              options={["นนทบุรี","ปทุมธานี","พระนครศรีอยุธยา","อ่างทอง"]}
              placeholder="เลือกจังหวัด"
              icon={MapPin}
              disabled={isFieldLocked(lockLevel, "province")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              อำเภอ
            </label>
            <CustomSelect
              value={filters.district}
              onChange={(val) => setFilters({ ...filters, district: val })}
              options={["เมือง","คลองหลวง","วังน้อย","ไชโย"]}
              placeholder="เลือกอำเภอ"
              icon={MapPin}
              disabled={isFieldLocked(lockLevel, "district")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              ตำบล
            </label>
            <CustomSelect
              value={filters.subdistrict}
              onChange={(val) => setFilters({ ...filters, subdistrict: val })}
              options={["บางกระสอ","คลองหนึ่ง","ลำไทร","ชะไว"]}
              placeholder="เลือกตำบล"
              icon={MapPin}
              disabled={isFieldLocked(lockLevel, "subdistrict")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              หน่วยบริการ
            </label>
            <CustomSelect
              value={filters.unit}
              onChange={(val) => setFilters({ ...filters, unit: val })}
              options={["รพ.สต.ทดสอบ 1","รพ.สต.ทดสอบ 2","รพ.สต.ทดสอบ 3","รพ.สต.ทดสอบ 4"]}
              placeholder="เลือกหน่วยบริการ"
              icon={Building2}
              disabled={isFieldLocked(lockLevel, "unit")}
            />
          </div>
        </div>
      </div>

      {/* ข้อมูลประชากร & 3 หมอ */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#ece1f7] p-6 mb-6">
        <h2 className="text-xl font-bold text-[#231d37] mb-4">ข้อมูลประชากร และ ข้อมูล 3 หมอรู้จักคุณ</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Users, label: "จำนวนประชากรในพื้นที่", value: kpiTop.population, unit: "คน", color: "#7e32e2" },
            { icon: Home, label: "หมอประจำบ้าน", value: kpiTop.houseDoc, unit: "คน", color: "#9333ea" },
            { icon: Heart, label: "หมอสาธารณสุข", value: kpiTop.publicHealthDoc, unit: "คน", color: "#a855f7" },
            { icon: UserCheck, label: "หมอครอบครัว", value: kpiTop.familyDoc, unit: "คน", color: "#c084fc" },
          ].map((k, i) => (
            <div key={i} className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-white shadow-sm">
                  <k.icon size={24} style={{ color: k.color }} />
                </div>
                <div className="text-sm font-medium text-gray-700">{k.label}</div>
              </div>
              <div className="flex items-baseline gap-1">
                <div className="text-2xl font-bold text-[#7e32e2]">{numberFmt(k.value)}</div>
                <div className="text-sm text-gray-600">{k.unit}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NCDs */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#ece1f7] p-6 mb-6">
        <h2 className="text-xl font-bold text-[#231d37] mb-4">คัดกรองโรคไม่ติดต่อเรื้อรัง (NCDs)</h2>

        {/* BMI */}
        <div className="mb-4">
          <div className="text-sm font-semibold text-gray-700 mb-2">ค่า BMI</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {bmiRow.map((b) => (
              <div key={b.label} className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 text-center">
                <div className="text-sm text-gray-600 mb-1">{b.label}</div>
                <div className="text-lg font-bold text-[#7e32e2]">{numberFmt(b.value)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ความดันโลหิต */}
        <div className="mb-4">
          <div className="text-sm font-semibold text-gray-700 mb-2">ค่าความดันโลหิต</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {bpRow.map((b) => (
              <div key={b.label} className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 text-center">
                <div className="text-sm text-gray-600 mb-1">{b.label}</div>
                <div className="text-lg font-bold text-[#7e32e2]">{numberFmt(b.value)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* น้ำตาลในเลือด */}
        <div>
          <div className="text-sm font-semibold text-gray-700 mb-2">ค่าน้ำตาลในเลือด</div>
          <div className="grid grid-cols-3 gap-3">
            {sugarRow.map((b) => (
              <div key={b.label} className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 text-center">
                <div className="text-sm text-gray-600 mb-1">{b.label}</div>
                <div className="text-lg font-bold text-[#7e32e2]">{numberFmt(b.value)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ตาราง + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ตารางซ้าย */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-[#ece1f7] overflow-hidden">
            <div className="bg-gradient-to-r from-[#7e32e2] to-[#a855f7] px-6 py-4">
              <h3 className="text-lg font-bold text-white">ข้อมูลคัดกรองผู้สูงอายุในชุมชน</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-purple-50">
                  <tr>
                    {elderlyColumns.map((col) => (
                      <th
                        key={col.key}
                        className="px-4 py-3 text-sm font-semibold text-gray-700"
                        style={{ textAlign: col.align }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {elderlyScreens.map((row, idx) => (
                    <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-purple-50/30"}>
                      <td className="px-4 py-3 text-center text-gray-600">{row.id}</td>
                      <td className="px-4 py-3 text-gray-700">{row.name}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{numberFmt(row.normal)}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{numberFmt(row.risk)}</td>
                      <td className="px-4 py-3 text-center font-semibold text-[#7e32e2]">{numberFmt(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Donut ขวา */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg border border-[#ece1f7] p-6">
            <h3 className="text-lg font-bold text-[#7e32e2] mb-4">
              สัดส่วนยาเม็ดเสริมไอโอดีนของหญิงตั้งครรภ์
            </h3>
            <Donut data={iodineData} maxSize={260} minSize={220} thicknessRatio={0.22} />

            <div className="mt-6 space-y-3">
              {iodineData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between p-3 rounded-xl bg-purple-50">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ background: PALETTE[i % PALETTE.length] }}
                    />
                    <span className="font-medium text-gray-700">{d.name}</span>
                  </div>
                  <span className="font-bold text-[#7e32e2]">{numberFmt(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
