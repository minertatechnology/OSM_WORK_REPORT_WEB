import React from "react";
import styles from "@components/ThreeDocComp/ThreeDocComp.module.scss";

const defaultNumberFmt = (n) =>
  typeof n === "number" ? n.toLocaleString("th-TH") : n ?? "-";

export default function ThreeDocCompService({
  title = "ข้อมูลคัดกรองผู้สูงอายุในชุมชน",
  columns = [],
  rows = [],
  numberFmt = defaultNumberFmt,
  emptyText = "ไม่มีข้อมูล",
}) {
  const hasRows = Array.isArray(rows) && rows.length > 0;

  const renderCell = (val) => {
    if (typeof val === "number") return numberFmt(val);
    return val ?? "-";
  };

  return (
    <div className={styles.card} style={{ height: "100%" }}>
      <div className={styles.cardHeader}>{title}</div>
      <div className={styles.cardContent}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {columns.map((c) => {
                  const thStyle = {
                    textAlign: c.align || "center",
                    ...(c.width ? { width: c.width, minWidth: c.width, maxWidth: c.width } : null),
                  };
                  return (
                    <th key={c.key} style={thStyle}>
                      {c.label}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {hasRows ? (
                rows.map((row, idx) => (
                  <tr key={row.id ?? idx}>
                    {columns.map((c, ci) => {
                      const tdStyle = {
                        textAlign: c.align || "center",
                        ...(c.width ? { width: c.width, minWidth: c.width, maxWidth: c.width } : null),
                        // กันล้นให้คอลัมน์ text โดยเฉพาะ column "name"
                        ...(c.key === "name"
                          ? { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
                          : null),
                      };
                      return <td key={c.key} style={tdStyle}>{renderCell(row[c.key])}</td>;
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={Math.max(columns.length, 1)}
                    style={{ textAlign: "center", color: "#6b7280", padding: 16 }}
                  >
                    {emptyText}
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
