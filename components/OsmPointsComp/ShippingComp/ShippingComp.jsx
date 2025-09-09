"use client";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import ShippingList from "./ShippingList/ShippingList";

// Demo data (mock)
const rewards = [
  {
    id: "1",
    image: "https://cdn-icons-png.flaticon.com/512/2921/2921822.png",
    name: "ของขวัญ",
    totalCount: "1000",
    periodStart: "1/1/2568",
    periodEnd: "31/12/2568",
    claimed: "10",
  },
  {
    id: "2",
    image: "https://cdn-icons-png.flaticon.com/512/2921/2921822.png",
    name: "ของขวัญ",
    totalCount: "1000",
    periodStart: "1/1/2568",
    periodEnd: "31/12/2568",
    claimed: "10",
  },
];

const ShippingComp = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const detailsId = searchParams.get("details"); // จะได้ "1" หรือ "2" หรือ null

  // หา reward ที่เลือก
  const selectedReward = rewards.find((r) => r.id === detailsId);

  function handleCardClick(id) {
    // เปลี่ยน path พร้อม id ใน query
    router.push(`/osm-points/shipping?details=${id}`);
  }

  // ถ้ามี detailsId และเจอ reward ให้แสดง ShippingList
  if (detailsId && selectedReward) {
    return <ShippingList id={detailsId} reward={selectedReward} />;
  }

  // หน้าเลือก reward
  return (
    <div>
      {/* Header */}
      <div className="pt-8 pb-4 px-6">
        <div className="font-bold text-[#6E28B7] text-[20px]">
          รายชื่อ อสม. ที่ขอแลกของรางวัล
        </div>
      </div>
      {/* Cards */}
      <div className="flex flex-wrap gap-8 px-8">
        {rewards.map((reward) => (
          <button
            key={reward.id}
            type="button"
            className="flex flex-row items-center border border-[#dadada] rounded-xl bg-white px-7 py-5 shadow-sm transition hover:shadow-lg hover:border-[#6E28B7] cursor-pointer"
            style={{
              marginBottom: "10px",
              marginRight: "10px",
              minWidth: "420px",
              maxWidth: "480px",
              width: "100%",
              boxSizing: "border-box",
            }}
            onClick={() => handleCardClick(reward.id)}
          >
            <img
              src={reward.image}
              alt="reward"
              className="w-24 h-24 object-contain rounded-xl mr-5"
              style={{ background: "#fff" }}
            />
            <div className="flex flex-col justify-center gap-1 w-full text-left">
              <div className="font-bold text-[#231d37] text-[17px] mb-2">
                {reward.name}
              </div>
              <div className="text-[#231d37] text-[15px] font-normal leading-tight">
                จำนวนทั้งหมด
                <span style={{ display: "inline-block", width: 16 }}></span>
                <span className="font-bold">{reward.totalCount}</span> รายการ
              </div>
              <div className="text-[#231d37] text-[15px] font-normal leading-tight mb-1 flex">
                <span>ระยะเวลา</span>
                <span style={{ display: "inline-block", width: 16 }}></span>
                <span className="font-bold">
                  {reward.periodStart} - {reward.periodEnd}
                </span>
              </div>
              <div className="text-[#231d37] text-[15px] font-normal leading-tight">
                จำนวนค้างขอ
                <span style={{ display: "inline-block", width: 16 }}></span>
                <span className="font-bold">{reward.claimed}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ShippingComp;
