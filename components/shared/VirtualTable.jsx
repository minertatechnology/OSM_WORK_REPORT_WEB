import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

/**
 * Virtual Table Component
 * แสดงตารางขนาดใหญ่โดยใช้ Virtual Scrolling
 * จะ render เฉพาะแถวที่เห็นบนหน้าจอ ทำให้เร็วมาก!
 *
 * @param {Object} props
 * @param {Array} props.data - ข้อมูลทั้งหมด
 * @param {Array} props.columns - คอลัมน์ของตาราง
 * @param {number} props.estimateSize - ความสูงโดยประมาณของแต่ละแถว (px)
 * @param {number} props.overscan - จำนวนแถวเผื่อ render ข้างนอก viewport
 * @param {string} props.height - ความสูงของตาราง
 */
export const VirtualTable = ({
  data = [],
  columns = [],
  estimateSize = 60,
  overscan = 5,
  height = "600px",
  onRowClick,
  className = "",
  headerClassName = "",
  rowClassName = "",
  cellClassName = "",
}) => {
  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: overscan,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className={`bg-gray-50 border-b border-gray-200 ${headerClassName}`}>
        <div className="flex">
          {columns.map((column, index) => (
            <div
              key={column.key || index}
              className="px-4 py-3 text-left text-sm font-semibold text-gray-700"
              style={{ width: column.width || `${100 / columns.length}%` }}
            >
              {column.header}
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualItems.map((virtualRow) => {
            const row = data[virtualRow.index];

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                className={`absolute top-0 left-0 w-full border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  onRowClick ? "cursor-pointer" : ""
                } ${rowClassName}`}
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                onClick={() => onRowClick && onRowClick(row, virtualRow.index)}
              >
                <div className="flex">
                  {columns.map((column, colIndex) => (
                    <div
                      key={column.key || colIndex}
                      className={`px-4 py-3 text-sm text-gray-900 ${cellClassName}`}
                      style={{ width: column.width || `${100 / columns.length}%` }}
                    >
                      {column.render
                        ? column.render(row[column.key], row, virtualRow.index)
                        : row[column.key]}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      {data.length === 0 && (
        <div className="py-8 text-center text-gray-500 text-sm">
          ไม่พบข้อมูล
        </div>
      )}
    </div>
  );
};

export default VirtualTable;
