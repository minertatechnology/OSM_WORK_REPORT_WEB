"use client";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import Image from "next/image";
import {
  Package,
  TruckIcon,
  Calendar,
  AlertCircle,
  Search,
  Filter,
} from "lucide-react";
import ShippingList from "./ShippingList/ShippingList";

// Demo data (mock) - ใช้รูปจริงจาก Unsplash
const rewards = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=400&h=400&fit=crop",
    name: "เสื้อโปโล OSM",
    totalCount: "50",
    periodStart: "1/1/2568",
    periodEnd: "31/12/2568",
    claimed: "5",
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&h=400&fit=crop",
    name: "กระเป๋าผ้า OSM",
    totalCount: "30",
    periodStart: "1/1/2568",
    periodEnd: "31/12/2568",
    claimed: "3",
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop",
    name: "แก้วน้ำสแตนเลส",
    totalCount: "40",
    periodStart: "1/1/2568",
    periodEnd: "31/12/2568",
    claimed: "8",
  },
  {
    id: "4",
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop",
    name: "Power Bank 10000mAh",
    totalCount: "20",
    periodStart: "1/1/2568",
    periodEnd: "31/12/2568",
    claimed: "2",
  },
];

const ShippingComp = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const detailsId = searchParams.get("details");

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // หา reward ที่เลือก
  const selectedReward = rewards.find((r) => r.id === detailsId);

  function handleCardClick(id) {
    router.push(`/osm-points/shipping?details=${id}`);
  }

  // ถ้ามี detailsId และเจอ reward ให้แสดง ShippingList
  if (detailsId && selectedReward) {
    return <ShippingList id={detailsId} reward={selectedReward} />;
  }

  // Filter rewards by search
  const filteredRewards = rewards.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats calculations
  const totalRewards = rewards.length;
  const totalPendingClaims = rewards.reduce(
    (sum, r) => sum + Number(r.claimed || 0),
    0
  );

  // หน้าเลือก reward
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#faf8ff] via-white to-[#f5f0ff] p-4 sm:p-6">
      {/* Header Section with Gradient */}
      <div className="relative mb-8 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7e32e2] via-[#9333ea] to-[#a855f7]" />
        <div className="absolute inset-0 bg-white/5" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Title & Stats */}
            <div className="text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <TruckIcon size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    รายชื่อ อสม. ที่ขอแลกของรางวัล
                  </h1>
                  <p className="text-white/80 text-sm mt-1">
                    ตรวจสอบและอนุมัติคำขอแลกของรางวัล
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
                  <Package size={18} />
                  <span className="font-semibold">{totalRewards}</span>
                  <span className="text-white/80 text-sm">รางวัลทั้งหมด</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
                  <AlertCircle size={18} />
                  <span className="font-semibold">{totalPendingClaims}</span>
                  <span className="text-white/80 text-sm">คำขอค้างอนุมัติ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <div className="relative flex-1 w-full">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="ค้นหาของรางวัล..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-[#ece1f7] bg-white focus:outline-none focus:border-[#7e32e2] focus:ring-2 focus:ring-[#7e32e2]/20 transition-all duration-200 text-[15px]"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border-2 border-[#ece1f7]">
          <Filter size={18} className="text-[#7e32e2]" />
          <span className="text-gray-600 text-sm">
            แสดง{" "}
            <span className="font-bold text-[#7e32e2]">
              {filteredRewards.length}
            </span>{" "}
            รายการ
          </span>
        </div>
      </div>

      {/* Rewards Grid */}
      {filteredRewards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-[#ece1f7]">
          <Package size={64} className="text-[#c4a8ff] mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            ไม่พบของรางวัล
          </h3>
          <p className="text-gray-400 text-center">
            {searchTerm ? "ลองค้นหาด้วยคำอื่น" : "ยังไม่มีของรางวัลในระบบ"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRewards.map((reward) => (
            <div
              key={reward.id}
              onClick={() => handleCardClick(reward.id)}
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-[#f0ebff] hover:border-[#c4a8ff] hover:-translate-y-1 cursor-pointer"
            >
              {/* Pending Badge */}
              {reward.claimed && Number(reward.claimed) > 0 && (
                <div className="absolute top-3 right-3 z-10">
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-xs shadow-lg">
                    <AlertCircle size={12} />
                    <span>รอ {reward.claimed}</span>
                  </div>
                </div>
              )}

              {/* Image Section */}
              <div className="relative h-48 bg-gradient-to-br from-[#f8f4ff] to-[#ede4ff] flex items-center justify-center overflow-hidden">
                <Image
                  src={reward.image}
                  alt={reward.name}
                  fill
                  className="object-contain p-4 group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              {/* Content Section */}
              <div className="p-4">
                {/* Title */}
                <h3 className="font-bold text-[#231d37] text-lg mb-3 line-clamp-1 group-hover:text-[#7e32e2] transition-colors">
                  {reward.name}
                </h3>

                {/* Info Grid */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Package size={14} />
                      จำนวนทั้งหมด
                    </span>
                    <span className="font-bold text-[#7e32e2]">
                      {reward.totalCount} ชิ้น
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={14} className="text-[#7e32e2]" />
                    <span className="text-xs">
                      {reward.periodStart} - {reward.periodEnd}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#f0ebff]">
                    <span className="text-gray-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      ค้างอนุมัติ
                    </span>
                    <span
                      className={`font-bold ${
                        Number(reward.claimed) > 0
                          ? "text-orange-500"
                          : "text-green-500"
                      }`}
                    >
                      {reward.claimed} คำขอ
                    </span>
                  </div>
                </div>

                {/* View Button */}
                <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7e32e2] to-[#a855f7] text-white font-semibold text-sm shadow-md hover:shadow-lg hover:from-[#6b28c9] hover:to-[#9333ea] transition-all duration-200">
                  <TruckIcon size={16} />
                  ดูรายการจัดส่ง
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShippingComp;
