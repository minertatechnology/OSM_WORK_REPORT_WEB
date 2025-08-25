import React from "react";
import styles from "@components/SmartOsmComp/SmartOsmComp.module.scss";

const defaultNumberFmt = (n) => (n || n === 0 ? n.toLocaleString("th-TH") : "-");

export default function SmartOsmTable({
  title = "ข้อมูลอาสาสมัครประจำหมู่บ้าน",
  rows = [],
  numberFmt = defaultNumberFmt,
}) {
  return (
    <div className={styles["osm-card"]}>
      <div className={styles["osm-card__header"]}>{title}</div>
      <div className={styles["osm-card__content"]}>
        <div className={styles["table-scroll"]}>
          <table className={`${styles["osm-table"]} ${styles["osm-table--center"]}`}>
            <thead>
              <tr>
                <th>ลำดับ</th>
                <th>รายการ</th>
                <th>เพศชาย</th>
                <th>เพศหญิง</th>
                <th>รวมทั้งหมด</th>
                <th>อสม. ตามโควตา</th>
                <th>อสม. เพิ่มไม่ได้ตามโควตา</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.province}</td>
                  <td>{numberFmt(r.male)}</td>
                  <td>{numberFmt(r.female)}</td>
                  <td>{numberFmt(r.total)}</td>
                  <td>{numberFmt(r.quota)}</td>
                  <td>{numberFmt(r.extra)}</td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "#6b7280", padding: 16 }}>
                    ไม่มีข้อมูลในขอบเขตของคุณ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
