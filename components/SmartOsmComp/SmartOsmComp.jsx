// components/SmartOsmComp/SmartOsmComp.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import styles from "./SmartOsmComp.module.scss";
import SmartOsmTable from "@services/Table/SmartOsmService";

// ⬇️ โหลดแผนที่แบบ client-only เพื่อกัน runtime error ของ Highcharts บน SSR
const MapThailandService = dynamic(
  () => import("@services/MapThailand/MapThailandService"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: 340,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#666",
          fontSize: 14,
        }}
      >
        กำลังโหลดแผนที่…
      </div>
    ),
  }
);

// ⬇️ สิทธิ์ / การมองเห็น
import {
  ALLOWED_ROLES,
  readInfoFromCookie,
  roleToLockLevel,
  isFieldLocked,
  getVisibilityByRole,
} from "@utils/access";

/* ---------- ตัวนิยามฟิลด์ ---------- */
const FILTER_DEFS = [
  { key: "year",       label: "ปี",        opts: ["2568", "2567"] },
  {
    key: "month",
    label: "เดือน",
    opts: [
      "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
      "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
    ],
  },
  { key: "week",       label: "สัปดาห์",     opts: ["สัปดาห์ที่ 1","สัปดาห์ที่ 2","สัปดาห์ที่ 3","สัปดาห์ที่ 4 (23/6/68-27/6/68)"] },
  { key: "healthZone", label: "เขตสุขภาพ",  opts: ["ทั้งหมด", ...Array.from({ length: 13 }, (_, i) => `เขตสุขภาพที่ ${i + 1}`)], lock: "zone" },
  { key: "province",   label: "จังหวัด",     opts: ["","นนทบุรี","ปทุมธานี","พระนครศรีอยุธยา","อ่างทอง"], lock: "province" },
  { key: "district",   label: "อำเภอ",       opts: ["","เมือง","คลองหลวง","วังน้อย","ไชโย"],                 lock: "district" },
  { key: "subdistrict",label: "ตำบล",        opts: ["","บางกระสอ","คลองหนึ่ง","ลำไทร","ชะไว"],               lock: "subdistrict" },
  { key: "unit",       label: "หน่วยบริการ", opts: ["","รพ.สต.ทดสอบ 1","รพ.สต.ทดสอบ 2","รพ.สต.ทดสอบ 3","รพ.สต.ทดสอบ 4"], lock: "unit" },
];

const DATE_FIELDS = new Set(["year", "month", "week"]);

/* ---------- สีชาร์ต ---------- */
const PALETTE = [
  "#4B0082", "#5A2BA6", "#6C49D9", "#8B7CF2", "#C79BFE",
  "#F3A1E6", "#FFA6D2", "#FF7CB5", "#FF59A2", "#E6409F",
  "#C5299F", "#A41E90", "#7A1679",
];

/* ---------- pie mock ของแต่ละรายงาน ---------- */
const PIE_BY_REPORT = {
  osm1: [
    { name: "เขตสุขภาพที่ 1", value: 132000 },
    { name: "เขตสุขภาพที่ 2", value: 70000 },
    { name: "เขตสุขภาพที่ 3", value: 60000 },
    { name: "เขตสุขภาพที่ 4", value: 65000 },
    { name: "เขตสุขภาพที่ 5", value: 75000 },
    { name: "เขตสุขภาพที่ 6", value: 72000 },
    { name: "เขตสุขภาพที่ 7", value: 102000 },
    { name: "เขตสุขภาพที่ 8", value: 104000 },
    { name: "เขตสุขภาพที่ 9", value: 125000 },
    { name: "เขตสุขภาพที่ 10", value: 85000 },
    { name: "เขตสุขภาพที่ 11", value: 80000 },
    { name: "เขตสุขภาพที่ 12", value: 63000 },
    { name: "เขตสุขภาพที่ 13", value: 1000 },
  ],
  larvae: [
    { name: "เขตสุขภาพที่ 1", value: 88000 },
    { name: "เขตสุขภาพที่ 2", value: 91000 },
    { name: "เขตสุขภาพที่ 3", value: 54000 },
    { name: "เขตสุขภาพที่ 4", value: 76000 },
    { name: "เขตสุขภาพที่ 5", value: 69000 },
    { name: "เขตสุขภาพที่ 6", value: 81000 },
    { name: "เขตสุขภาพที่ 7", value: 70000 },
    { name: "เขตสุขภาพที่ 8", value: 62000 },
    { name: "เขตสุขภาพที่ 9", value: 97000 },
    { name: "เขตสุขภาพที่ 10", value: 58000 },
    { name: "เขตสุขภาพที่ 11", value: 64000 },
    { name: "เขตสุขภาพที่ 12", value: 52000 },
    { name: "เขตสุขภาพที่ 13", value: 900 },
  ],
  health: [
    { name: "เขตสุขภาพที่ 1", value: 101000 },
    { name: "เขตสุขภาพที่ 2", value: 82000 },
    { name: "เขตสุขภาพที่ 3", value: 91000 },
    { name: "เขตสุขภาพที่ 4", value: 73000 },
    { name: "เขตสุขภาพที่ 5", value: 58000 },
    { name: "เขตสุขภาพที่ 6", value: 64000 },
    { name: "เขตสุขภาพที่ 7", value: 87000 },
    { name: "เขตสุขภาพที่ 8", value: 94000 },
    { name: "เขตสุขภาพที่ 9", value: 60000 },
    { name: "เขตสุขภาพที่ 10", value: 68000 },
    { name: "เขตสุขภาพที่ 11", value: 72000 },
    { name: "เขตสุขภาพที่ 12", value: 61000 },
    { name: "เขตสุขภาพที่ 13", value: 1200 },
  ],
};

/* ---------- ตาราง mock ---------- */
const TABLE_BY_REPORT = {
  osm1: [
    { id: 1, province: "นนทบุรี", male: 100, female: 80, total: 180, quota: 200, extra: 20, zone: "เขตสุขภาพที่ 4", district: "เมือง", subdistrict: "บางกระสอ", unit: "รพ.สต.ทดสอบ 1" },
    { id: 2, province: "ปทุมธานี", male: 100, female: 80, total: 180, quota: 200, extra: 20, zone: "เขตสุขภาพที่ 4", district: "คลองหลวง", subdistrict: "คลองหนึ่ง", unit: "รพ.สต.ทดสอบ 2" },
    { id: 3, province: "พระนครศรีอยุธยา", male: 100, female: 80, total: 180, quota: 200, extra: 20, zone: "เขตสุขภาพที่ 4", district: "วังน้อย", subdistrict: "ลำไทร", unit: "รพ.สต.ทดสอบ 3" },
    { id: 4, province: "อ่างทอง",   male: 100, female: 80, total: 180, quota: 200, extra: 20, zone: "เขตสุขภาพที่ 4", district: "ไชโย",  subdistrict: "ชะไว",   unit: "รพ.สต.ทดสอบ 4" },
  ],
  larvae: [
    { id: 1, province: "นนทบุรี",  male: 90, female: 95, total: 185, quota: 210, extra: 10, zone: "เขตสุขภาพที่ 4", district: "เมือง",  subdistrict: "บางกระสอ", unit: "รพ.สต.ทดสอบ 1" },
    { id: 2, province: "ปทุมธานี", male: 80, female: 92, total: 172, quota: 200, extra: 15, zone: "เขตสุขภาพที่ 4", district: "คลองหลวง", subdistrict: "คลองหนึ่ง", unit: "รพ.สต.ทดสอบ 2" },
    { id: 3, province: "พระนครศรีอยุธยา", male: 94, female: 85, total: 179, quota: 200, extra: 12, zone: "เขตสุขภาพที่ 4", district: "วังน้อย", subdistrict: "ลำไทร", unit: "รพ.สต.ทดสอบ 3" },
    { id: 4, province: "อ่างทอง",   male: 87, female: 88, total: 175, quota: 195, extra: 11, zone: "เขตสุขภาพที่ 4", district: "ไชโย",  subdistrict: "ชะไว",   unit: "รพ.สต.ทดสอบ 4" },
  ],
  health: [
    { id: 1, province: "นนทบุรี",  male: 120, female: 110, total: 230, quota: 240, extra: 5, zone: "เขตสุขภาพที่ 4", district: "เมือง",  subdistrict: "บางกระสอ", unit: "รพ.สต.ทดสอบ 1" },
    { id: 2, province: "ปทุมธานี", male: 108, female: 102, total: 210, quota: 220, extra: 6, zone: "เขตสุขภาพที่ 4", district: "คลองหลวง", subdistrict: "คลองหนึ่ง", unit: "รพ.สต.ทดสอบ 2" },
    { id: 3, province: "พระนครศรีอยุธยา", male: 98,  female: 105, total: 203, quota: 220, extra: 4, zone: "เขตสุขภาพที่ 4", district: "วังน้อย", subdistrict: "ลำไทร", unit: "รพ.สต.ทดสอบ 3" },
    { id: 4, province: "อ่างทอง",   male: 103, female: 99,  total: 202, quota: 215, extra: 7, zone: "เขตสุขภาพที่ 4", district: "ไชโย",  subdistrict: "ชะไว",   unit: "รพ.สต.ทดสอบ 4" },
  ],
};

/* ---------- KPI ---------- */
const KPI_BY_REPORT = {
  osm1: { report: 474000 },
  larvae: { report: 300000 },
  health: { report: 300000 },
};

/* ---------- format number ---------- */
const numberFmt = (n) => (n || n === 0 ? n.toLocaleString("th-TH") : "-");

/* ---------- Donut (responsive) ---------- */
const Donut = ({
  data,
  maxSize = 360,
  minSize = 220,
  thicknessRatio = 0.22,
  palette = PALETTE,
  padding = 8,
}) => {
  const containerRef = useRef(null);
  const [size, setSize] = useState(maxSize);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    const el = containerRef.current;
    const apply = (w) =>
      setSize(Math.max(minSize, Math.min(maxSize, Math.floor(w))));
    apply(el.clientWidth);
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w) apply(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxSize, minSize]);

  const total = data.reduce((a, b) => a + b.value, 0);
  const radius = size / 2;
  const thickness = Math.max(24, Math.floor(size * thicknessRatio));
  const r = Math.max(0, radius - padding - thickness / 2);
  const circumference = 2 * Math.PI * r;

  let acc = 0;
  const arcs = data.map((d, idx) => {
    const pct = total ? d.value / total : 0;
    const strokeDasharray = `${pct * circumference} ${circumference}`;
    const strokeDashoffset = -acc * circumference;
    acc += pct;
    return {
      strokeDasharray,
      strokeDashoffset,
      color: palette[idx % palette.length],
    };
  });

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        maxWidth: maxSize,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div style={{ position: "relative", width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ display: "block" }}
        >
          <g transform={`translate(${radius}, ${radius})`}>
            <circle
              r={r}
              cx={0}
              cy={0}
              fill="transparent"
              stroke="#F3E8FF"
              strokeWidth={thickness}
            />
            {arcs.map((a, i) => (
              <circle
                key={i}
                r={r}
                cx={0}
                cy={0}
                fill="transparent"
                stroke={a.color}
                strokeWidth={thickness}
                strokeDasharray={a.strokeDasharray}
                strokeDashoffset={a.strokeDashoffset}
                transform="rotate(-90)"
                strokeLinecap="butt"
              />
            ))}
          </g>
        </svg>

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontSize: Math.max(20, Math.floor(size * 0.1)),
              fontWeight: 800,
              color: "#6E28B7",
            }}
          >
            {numberFmt(total)}
          </div>
          <div
            style={{
              color: "#6E28B7",
              fontWeight: 600,
              fontSize: Math.max(12, Math.floor(size * 0.08)),
            }}
          >
            รายการ
          </div>
        </div>
      </div>
    </div>
  );
};

export default function SmartOsmComp() {
  /* ---------- สิทธิ์ ---------- */
  const [{ scope }, setAuth] = useState({ roles: [], scope: {} });
  const [hasAccess, setHasAccess] = useState(false);
  const [lockLevel, setLockLevel] = useState("deny");
  const [activeRole, setActiveRole] = useState("");
  const [visibility, setVisibility] = useState(getVisibilityByRole(""));

  useEffect(() => {
    const { roles: r, scope: s } = readInfoFromCookie();
    const mainRole = (r || []).find((x) => ALLOWED_ROLES.includes(x)) || "";
    setAuth({ roles: r || [], scope: s || {} });
    setHasAccess(!!mainRole);
    setActiveRole(mainRole);
    setLockLevel(roleToLockLevel(mainRole));
    setVisibility(getVisibilityByRole(mainRole));
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
      if (
        ["province", "district", "subdistrict", "unit"].includes(lockLevel) &&
        scope.zone
      )
        next.healthZone = scope.zone;
      if (
        ["province", "district", "subdistrict", "unit"].includes(lockLevel) &&
        scope.province
      )
        next.province = scope.province;
      if (["district", "subdistrict", "unit"].includes(lockLevel) && scope.district)
        next.district = scope.district;
      if (["subdistrict", "unit"].includes(lockLevel) && scope.subdistrict)
        next.subdistrict = scope.subdistrict;
      if (["unit"].includes(lockLevel) && scope.unit) next.unit = scope.unit;
      return next;
    });
  }, [hasAccess, lockLevel, scope]);

  /* ---------- รายงานที่สลับได้ ---------- */
  const REPORTS = [
    { key: "osm1", label: "รายงาน อสม. 1" },
    { key: "larvae", label: "รายงานลูกน้ำยุงลาย" },
    { key: "health", label: "รายงานบันทึกสุขภาพ อสม." },
  ];
  const [activeReport, setActiveReport] = useState("osm1");

  /* ---------- ชุดข้อมูลตามรายงานที่เลือก ---------- */
  const pieData = useMemo(
    () => PIE_BY_REPORT[activeReport] || [],
    [activeReport]
  );
  const rawRows = useMemo(
    () => TABLE_BY_REPORT[activeReport] || [],
    [activeReport]
  );

  /* ---------- แผนที่: map ค่าเป็น key=ชื่อเขตสุขภาพ ---------- */
  const zoneData = useMemo(
    () =>
      Object.fromEntries(
        (pieData || []).map(({ name, value }) => [name, value])
      ),
    [pieData]
  );
  const [activeZone, setActiveZone] = useState("");

  /* ---------- กรองตารางตามสิทธิ์ ---------- */
  const tableRows = useMemo(() => {
    return rawRows.filter((row) => {
      if (lockLevel === "zone" && scope.zone) return row.zone === scope.zone;
      if (lockLevel === "province" && scope.province)
        return row.province === scope.province;
      if (lockLevel === "district" && scope.district)
        return (
          row.district === scope.district &&
          row.province === (scope.province || row.province)
        );
      if (lockLevel === "subdistrict" && scope.subdistrict)
        return (
          row.subdistrict === scope.subdistrict &&
          row.district === (scope.district || row.district) &&
          row.province === (scope.province || row.province)
        );
      if (lockLevel === "unit" && scope.unit)
        return (
          row.unit === scope.unit &&
          row.subdistrict === (scope.subdistrict || row.subdistrict) &&
          row.district === (scope.district || row.district) &&
          row.province === (scope.province || row.province)
        );
      return true;
    });
  }, [rawRows, lockLevel, scope]);

  /* ---------- ส่วน UI ---------- */
  if (!hasAccess) {
    return (
      <div className={styles["smart-osm"]}>
        <div className={styles["osm-card"]}>
          <div className={styles["osm-card__content"]}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>🔒</span>
              <div>
                <div style={{ fontWeight: 800, color: "#7A1679" }}>
                  ไม่มีสิทธิ์เข้าถึงหน้านี้
                </div>
                <div style={{ color: "#6b7280" }}>
                  กรุณาติดต่อผู้ดูแลระบบเพื่อเพิ่มสิทธิ์:{" "}
                  {ALLOWED_ROLES.join(" / ")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles["smart-osm"]}>
      {/* Header + Badge Role */}
      <div className={styles["smart-osm__header"]}>
        <div className={styles["smart-osm__header-title"]}>
          รายละเอียดข้อมูลรายงาน Smart อสม.
          {activeRole && (
            <span
              style={{
                marginLeft: 10,
                fontSize: 12,
                padding: "4px 8px",
                background: "#F5E6FF",
                color: "#5A2BA6",
                borderRadius: 999,
                border: "1px solid #EAD9FF",
                verticalAlign: "middle",
              }}
              title={`บทบาท: ${activeRole}`}
            >
              บทบาท: {activeRole}
            </span>
          )}
        </div>

        {/* ปุ่ม PDF (ยังไม่ผูกแอ็กชัน ตามที่ขอ) */}
        <button
          type="button"
          className={`${styles["osm-btn"]} ${styles["osm-btn--primary"]}`}
          disabled
          title="ฟีเจอร์กำลังพัฒนา"
        >
          <Image
            src="/PDF.png"
            alt="PDF icon"
            width={20}
            height={20}
            className={styles.icon}
          />
          <span style={{ marginLeft: 8 }}>พิมพ์รายงาน PDF</span>
        </button>
      </div>

      {/* Filters */}
      <div className={styles["osm-card"]} style={{ marginBottom: 16 }}>
        <div className={styles["osm-card__content"]}>
          <div className={styles["filter-grid"]}>
            {FILTER_DEFS.map((f) => (
              <div key={f.key} className={styles["filter-item"]}>
                <label className={styles["osm-form__label"]}>{f.label}</label>
                <select
                  className={[
                    styles["osm-form__select"],
                    DATE_FIELDS.has(f.key)
                      ? styles["osm-form__select--calendar"]
                      : styles["osm-form__select--caret"],
                  ].join(" ")}
                  value={filters[f.key]}
                  disabled={f.lock ? isFieldLocked(lockLevel, f.lock) : false}
                  onChange={(e) =>
                    setFilters({ ...filters, [f.key]: e.target.value })
                  }
                >
                  {f.opts.map((o, idx) => (
                    <option key={`${f.key}-${idx}`} value={o === "" ? "" : o}>
                      {o === "" ? `เลือก${f.label}` : o}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI (คลิกเพื่อสลับรายงาน) */}
      <div className={styles["osm-row"]} style={{ marginBottom: 16 }}>
        {REPORTS.map((r) => (
          <div key={r.key} className={styles["osm-col-4"]}>
            <div
              className={styles["osm-card"]}
              onClick={() => setActiveReport(r.key)}
              style={{ cursor: "pointer" }}
              title={`ดู ${r.label}`}
            >
              <div className={styles["osm-card__content"]}>
                <div className={styles["kpi__title"]}>{r.label}</div>
                <div className={styles["kpi__value"]}>
                  <span className={styles["kpi__value-num"]}>
                    {numberFmt(KPI_BY_REPORT[r.key]?.report ?? 0)}
                  </span>
                  <span
                    style={{ color: "#6E28B7" }}
                    className={styles["kpi__value-unit"]}
                  >
                    รายงาน
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* แท็บใต้ KPI */}
      <div className="mb-3" style={{ borderBottom: "1px solid #eee" }}>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {REPORTS.map((r) => (
            <button
              key={r.key}
              onClick={() => setActiveReport(r.key)}
              style={{
                padding: "10px 6px",
                fontWeight: 700,
                color: activeReport === r.key ? "#212584" : "#6b7280",
                borderBottom:
                  activeReport === r.key
                    ? "3px solid #212584"
                    : "3px solid transparent",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map + Donut */}
      <div className={styles["osm-row"]} style={{ marginBottom: 16 }}>
        {visibility.showMap && (
          <div className={styles["osm-col-6"]}>
          <div className={styles["osm-card"]} style={{ height: "100%" }}>
            <div className={styles["osm-card__header"]}>แผนภาพ</div>
            <div className={styles["osm-card__content"]}>
              <MapThailandService
                dataByZone={zoneData}
                selectedZone={activeZone}
                onSelectZone={(z) => {
                  setActiveZone(z);
                  setFilters((p) => ({ ...p, healthZone: z || "ทั้งหมด" }));
                }}
                height={560}
                showLegend
              />
            </div>
          </div>
        </div>
        )}

        <div
          className={
            visibility.showMap ? styles["osm-col-6"] : styles["osm-col-full"]
          }
        >
          <div className={styles["osm-card"]} style={{ height: "100%" }}>
            <div className={styles["osm-card__header"]}>สัดส่วนข้อมูล</div>

            <div className={styles["osm-card__content"]}>
              {visibility.showMap ? (
                // โหมดมีแผนที่: โดนัทบน + legend ล่าง
                <>
                  <div className={styles["donut__wrap"]}>
                    <Donut
                      data={pieData}
                      maxSize={330}
                      minSize={300}
                      thicknessRatio={0.18}
                    />
                    <div className={styles["donut__summary"]}>
                      ข้อมูล{" "}
                      {REPORTS.find((r) => r.key === activeReport)?.label || ""}
                    </div>
                  </div>

                  <div className={styles["donut__legend"]}>
                    {pieData.map((d, i) => (
                      <div
                        key={`${d.name}-${i}`}
                        className={styles["donut__legend-item"]}
                      >
                        <span
                          className={styles["donut__legend-item-swatch"]}
                          style={{
                            background: PALETTE[i % PALETTE.length],
                          }}
                        />
                        <span>{d.name}</span>
                        <span className={styles["donut__legend-item-value"]}>
                          {numberFmt(d.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                // โหมดไม่มีแผนที่: โดนัทซ้าย + สรุป/legend ขวา
                <div className={styles.noMapRow}>
                  <section className={styles.noMapLeft}>
                    <div className={styles["donut__wrap"]}>
                      <Donut
                        data={pieData}
                        maxSize={420}
                        minSize={300}
                        thicknessRatio={0.18}
                      />
                    </div>
                  </section>

                  <section className={styles.noMapRight}>
                    <div className={styles["donut__summaryRight"]}>
                      ข้อมูล{" "}
                      {REPORTS.find((r) => r.key === activeReport)?.label || ""}
                    </div>
                    <div className={styles["donut__legend"]}>
                      {pieData.map((d, i) => (
                        <div
                          key={`${d.name}-${i}`}
                          className={styles["donut__legend-item"]}
                        >
                          <span
                            className={styles["donut__legend-item-swatch"]}
                            style={{
                              background: PALETTE[i % PALETTE.length],
                            }}
                          />
                          <span>{d.name}</span>
                          <span className={styles["donut__legend-item-value"]}>
                            {numberFmt(d.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ตาราง */}
      <SmartOsmTable
        title="ข้อมูลอาสาสมัครประจำหมู่บ้าน"
        rows={tableRows}
        numberFmt={numberFmt}
      />
    </div>
  );
}
