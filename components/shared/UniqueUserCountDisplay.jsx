import React from "react";
import { Users } from "lucide-react";

/**
 * Unique User Count Display Component
 * แสดงจำนวน อสม. ที่ส่งรายงาน (Unique Users) ตามช่วงเวลา
 * @param { menuName, string
 * @param { count: number
 * @param { uniqueType: "yearly" | "monthly"
 * @param { loading: boolean = false
 */
const UniqueUserCountDisplay = ({ menuName, count, uniqueType = loading }) => {
  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to to-purple-600 rounded-xl px-4 py-3 shadow-lg">
      <Users size={20} className="text-white" />
      <div className="flex-1">
        <span className="text-white/90 font-medium">
          {menuName} ({uniqueType === "yearly" ? "รายปี" : "รายเดือน"})
        </span>
        <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to to-blue-600 bg-clip-text text-transparent">
          {count.toLocaleString("th-TH")}
        </span>
        <span className="text-white/70 text-sm">
          {uniqueType === "monthly" ? "(รายเดือน)" : "(รายปี)"}
        </span>
      </div>
    </div>
  );
};

export default UniqueUserCountDisplay;
