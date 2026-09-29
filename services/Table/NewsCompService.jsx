import React from "react";
import { Eye } from "lucide-react";

const purple = "#9327e2";
const purple_light = "#EAD5FF";
const border = "#D3D4DD";
const text_gray = "#231d37";

const NewsCompService = ({ rows = [], onDetail }) => {
  return (
    <div
      style={{
        background: "#fff",
        border: `2px solid ${border}`,
        borderRadius: 14,
        boxShadow: "0 2px 8px #e3d7fa",
        overflow: "hidden",
        marginBottom: 30,
      }}
    >
      {/* Table Header */}
      <div
        style={{
          background: purple_light,
          padding: "17px 0 17px 0",
          display: "grid",
          gridTemplateColumns: "1.1fr 1.8fr 1.5fr 1.2fr",
          fontWeight: 700,
          fontSize: 17,
          color: purple,
          borderBottom: `2px solid ${border}`,
          textAlign: "left",
        }}
      >
        <div style={{ paddingLeft: 32 }}>วันที่</div>
        <div>หัวข้อ</div>
        <div>ผู้ประกาศ</div>
        <div>จัดการข้อมูล</div>
      </div>
      {/* Table Body */}
      {rows.length === 0 && (
        <div style={{ padding: "36px 0", textAlign: "center", color: "#9ca3af", fontSize: 16 }}>
          ไม่พบรายการแจ้งเตือน
        </div>
      )}
      {rows.map((item, idx) => (
        <div
          key={item.id || idx}
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1.8fr 1.5fr 1.2fr",
            alignItems: "center",
            fontSize: 16,
            fontWeight: 500,
            color: text_gray,
            borderBottom: idx < rows.length - 1 ? "1.5px solid #f3ecfd" : "none",
            background: "#fff",
            minHeight: 64,
          }}
        >
          <div style={{ paddingLeft: 32 }}>{item.date}</div>
          <div style={{ paddingRight: 16, wordBreak: "break-word" }}>{item.title}</div>
          <div style={{ paddingRight: 16, wordBreak: "break-word" }}>
            {item.creator?.name || item.author_name || "-"}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
            <button
              type="button"
              style={{
                background: "#fff",
                color: purple,
                border: `2px solid ${purple}`,
                borderRadius: 8,
                padding: "7px 22px",
                fontWeight: 700,
                fontSize: 15.5,
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                cursor: "pointer",
                boxShadow: "0 1px 4px #e3d7fa",
                transition: "all .16s",
                whiteSpace: "nowrap"
              }}
              aria-label={`ดูรายละเอียดของ ${item.title}`}
              onClick={() => onDetail && onDetail(item)}
            >
              <Eye size={20} color={purple} style={{ marginRight: 4 }} />
              ดูรายละเอียด
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NewsCompService;