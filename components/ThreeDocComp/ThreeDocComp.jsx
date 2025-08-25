import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "@components/ThreeDocComp/ThreeDocComp.module.scss";
import ThreeDocCompService from "@services/Table/ThreeDocCompService";
import Image from "next/image";

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
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.cardContent}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>🔒</span>
              <div>
                <div style={{ fontWeight: 800, color: "#7A1679" }}>ไม่มีสิทธิ์เข้าถึงหน้านี้</div>
                <div style={{ color: "#6b7280" }}>
                  กรุณาติดต่อผู้ดูแลระบบเพื่อเพิ่มสิทธิ์: {ALLOWED_ROLES.join(" / ")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- UI ---------- */
  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          รายละเอียดข้อมูล 3 หมอ รู้จักคุณ
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

        <button
          type="button"
          className={`${styles.printBtn} ${styles["printBtn--primary"]}`}
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
      <div className={styles.card} style={{ marginBottom: 16 }}>
        <div className={styles.cardContent}>
          <div className={styles.filters}>
            {[
              { key: "year", label: "ปี", opts: ["2568", "2567"] },
              { key: "month", label: "เดือน", opts: ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"] },
              { key: "week", label: "สัปดาห์", opts: ["สัปดาห์ที่ 1","สัปดาห์ที่ 2","สัปดาห์ที่ 3","สัปดาห์ที่ 4 (23/6/68-27/6/68)"] },
              { key: "healthZone", label: "เขตสุขภาพ", opts: ["ทั้งหมด", ...Array.from({length:13},(_,i)=>`เขตสุขภาพที่ ${i+1}`)], lock: "zone" },
              { key: "province", label: "จังหวัด", opts: ["","นนทบุรี","ปทุมธานี","พระนครศรีอยุธยา","อ่างทอง"], lock: "province" },
              { key: "district", label: "อำเภอ", opts: ["","เมือง","คลองหลวง","วังน้อย","ไชโย"], lock: "district" },
              { key: "subdistrict", label: "ตำบล", opts: ["","บางกระสอ","คลองหนึ่ง","ลำไทร","ชะไว"], lock: "subdistrict" },
              { key: "unit", label: "หน่วยบริการ", opts: ["","รพ.สต.ทดสอบ 1","รพ.สต.ทดสอบ 2","รพ.สต.ทดสอบ 3","รพ.สต.ทดสอบ 4"], lock: "unit" },
            ].map((f, idx) => (
              <div key={f.key + idx} className={styles.field}>
                <label className={styles.label}>{f.label}</label>
                <select
                  className={styles.select}
                  value={filters[f.key]}
                  disabled={f.lock ? isFieldLocked(lockLevel, f.lock) : false}
                  onChange={(e) => setFilters({ ...filters, [f.key]: e.target.value })}
                >
                  {f.opts.map((o) => (
                    <option key={`${f.key}-${o || "empty"}`} value={o === "" ? "" : o}>
                      {o === "" ? `เลือก${f.label}` : o}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ข้อมูลประชากร & 3 หมอ */}
      <div className={styles.card} style={{ marginBottom: 12 }}>
        <div className={styles.cardHeader}>ข้อมูลประชากร และ ข้อมูล 3 หมอรู้จักคุณ</div>
        <div className={styles.cardContent}>
          <div className={styles.kpiRow}>
            {[
              { icon: "/group.png",           label: "จำนวนประชากรในพื้นที่", value: kpiTop.population,      unit: "คน" },
              { icon: "/home_health.png",     label: "หมอประจำบ้าน",          value: kpiTop.houseDoc,        unit: "คน" },
              { icon: "/medical_services.png",label: "หมอสาธารณสุข",          value: kpiTop.publicHealthDoc, unit: "คน" },
              { icon: "/diversity_1.png",     label: "หมอครอบครัว",            value: kpiTop.familyDoc,       unit: "คน" },
            ].map((k, i) => (
              <div key={i} className={styles.kpi}>
                <div className={styles.kpiIcon} aria-hidden>
                  <Image src={k.icon} alt="" width={24} height={24} />
                </div>
                <div className={styles.kpiTitle}>{k.label}</div>
                <div className={styles.kpiValue}>
                  <span className={styles.kpiValueNum}>{numberFmt(k.value)}</span>
                </div>
                <div className={styles.kpiValueUnit}>{k.unit}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NCDs */}
      <div className={styles.card} style={{ marginBottom: 12 }}>
        <div className={styles.cardHeader}>คัดกรองโรคไม่ติดต่อเรื้อรัง (NCDs)</div>
        <div className={styles.cardContent}>
          {/* BMI */}
          <div className={styles.ncdBar} style={{ marginBottom: 10 }}>
            <div className={styles.ncdLine}>
              <div className={styles.head}>ค่า BMI</div>
              {bmiRow.map((b) => (
                <div key={b.label} className={styles.box}>
                  <div className={styles.label}>{b.label}</div>
                  <div className={styles.val}>{numberFmt(b.value)}</div>
                </div>
              ))}
            </div>
          </div>
          {/* ความดันโลหิต */}
          <div className={styles.ncdBar} style={{ marginBottom: 10 }}>
            <div className={styles.ncdLine}>
              <div className={styles.head}>ค่าความดันโลหิต</div>
              {bpRow.map((b) => (
                <div key={b.label} className={styles.box}>
                  <div className={styles.label}>{b.label}</div>
                  <div className={styles.val}>{numberFmt(b.value)}</div>
                </div>
              ))}
            </div>
          </div>
          {/* น้ำตาลในเลือด */}
          <div className={styles.ncdBar}>
            <div className={styles.ncdLine}>
              <div className={styles.head}>ค่าน้ำตาลในเลือด</div>
              {sugarRow.map((b) => (
                <div key={b.label} className={styles.box}>
                  <div className={styles.label}>{b.label}</div>
                  <div className={styles.val}>{numberFmt(b.value)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ตาราง + Donut */}
      <div className={styles.row} style={{ marginBottom: 16 }}>
        {/* ตารางซ้าย */}
        <div className={styles["col-8"]}>
          <ThreeDocCompService
            title="ข้อมูลคัดกรองผู้สูงอายุในชุมชน"
            columns={elderlyColumns}
            rows={elderlyScreens}
            numberFmt={numberFmt}
            emptyText="ไม่มีข้อมูล"
          />
        </div>

        {/* Donut ขวา */}
        <div className={styles["col-4"]}>
          <div className={`${styles.card} ${styles.cardMuted}`} style={{ height: "100%" }}>
            <div className={styles.cardHeader} style={{ color: "#6E28B7" }}>
              สัดส่วนยาเม็ดเสริมไอโอดีนของหญิงตั้งครรภ์
            </div>
            <div className={styles.cardContent}>
              <div className={styles.donutCard}>
                <div className={styles.donutWrap}>
                  <Donut data={iodineData} maxSize={260} minSize={220} thicknessRatio={0.22} />
                </div>

                <div className={`${styles.card} ${styles.cardMuted}`} style={{ marginTop: 12 }}>
                  <div className={styles.cardHeader} style={{ color: "#6E28B7" }}>
                    ยาเม็ดเสริมไอโอดีนของหญิงตั้งครรภ์
                  </div>
                  <div className={styles.cardContent}>
                    <div className={styles.legendList}>
                      {iodineData.map((d, i) => (
                        <div key={d.name} className={styles.row}>
                          <span className={styles.dot} style={{ background: PALETTE[i % PALETTE.length] }} />
                          <span className={styles.name}>{d.name}</span>
                          <span className={styles.value}>{numberFmt(d.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
