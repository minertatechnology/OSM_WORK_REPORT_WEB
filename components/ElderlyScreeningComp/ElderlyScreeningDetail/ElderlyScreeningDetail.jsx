"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, FileText, Download, MapPin, Phone, Eye } from "lucide-react";
import jsPDF from "jspdf";
import { font as SarabunFont } from "../../../styles/Sarabun-Regular-normal";
import { fontbold as SarabunBoldFont } from "../../../styles/Sarabun-Regular-bold";
import { formatThaiDate } from "@utils/dateFormatter";

const StatusBadge = ({ value }) => {
  const normalized = (value || "-").toString();
  const upper = normalized.toUpperCase();
  const isPositive = ["Y", "YES", "DONE", "AT_RISK", "PASS"].includes(upper);
  const isUnknown = normalized === "-" || normalized === "";

  const color =
    isUnknown ? "bg-gray-100 text-gray-600" : isPositive ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700";

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
      {normalized}
    </span>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3 py-2 border-b border-gray-100 last:border-b-0">
    <span className="text-sm text-gray-600">{label}</span>
    <span className="text-sm font-semibold text-[#231d37] text-right">{value || "-"}</span>
  </div>
);

const formatDate = (value) => {
  if (!value) return "-";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    const year = date.getFullYear() + 543;
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (e) {
    return "-";
  }
};

const buildFullName = (record) =>
  [record?.prefix, record?.first_name, record?.last_name].filter(Boolean).join(" ") ||
  record?.citizen_id ||
  "ไม่ทราบชื่อ";

const ElderlyScreeningDetail = ({
  assessorId,
  assessorName,
  elderlyList = [],
  elderlyCount = 0,
  record, // Keep for backward compatibility
  onBack
}) => {
  const router = useRouter();
  const [selectedElderly, setSelectedElderly] = useState(null);

  const goBack = () => {
    if (selectedElderly) {
      setSelectedElderly(null);
      return;
    }
    if (onBack) return onBack();
    router.push("/elderly-screening");
  };

  // If an individual elderly person is selected from the list, show their detail
  if (selectedElderly) {
    const fullName = buildFullName(selectedElderly);
    const elderlyRecord = selectedElderly;

    const handleExportPDF = () => {
      try {
        const doc = new jsPDF();
        doc.addFileToVFS("Sarabun-Regular.ttf", SarabunFont);
        doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
        doc.addFileToVFS("Sarabun-Bold.ttf", SarabunBoldFont);
        doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
        doc.setFont("Sarabun");

        doc.setFontSize(16);
        doc.setFont("Sarabun", "bold");
        doc.text("ข้อมูลคัดกรองผู้สูงอายุในชุมชน", 105, 15, { align: "center" });

        doc.setFontSize(12);
        doc.setFont("Sarabun", "normal");
        doc.text(`ชื่อ: ${fullName}`, 14, 28);
        doc.text(`เลขบัตร: ${elderlyRecord.citizen_id || "-"}`, 14, 36);
        doc.text(`สถานะ: ${elderlyRecord.overall_status || elderlyRecord.screening_status || "-"}`, 14, 44);
        doc.text(`บันทึกเมื่อ: ${formatDate(elderlyRecord.created_at)}`, 14, 52);

        doc.save(`elderly_screening_${elderlyRecord.id || elderlyRecord.citizen_id || "detail"}.pdf`);
      } catch (error) {
        console.error("Error generating PDF:", error);
        alert("เกิดข้อผิดพลาดในการสร้าง PDF");
      }
    };

    const socialFields = [
      { key: "permission_level", label: "สิทธิ์การเข้าถึง" },
      { key: "living_arrangement", label: "การอยู่ร่วม" },
      { key: "social_living_with_care", label: "มีผู้ดูแล" },
      { key: "social_house_safety", label: "บ้านปลอดภัย" },
      { key: "social_income_sufficiency", label: "รายได้เพียงพอ" },
    ];

    const healthFields = [
      { key: "cognitive_result", label: "ความคิด/ความทรงจำ" },
      { key: "mobility_test", label: "การเคลื่อนไหว" },
      { key: "fall_history_6m", label: "ประวัติหกล้ม 6 เดือน" },
      { key: "weight_loss_3m", label: "น้ำหนักลด > 3 เดือน" },
      { key: "appetite_loss", label: "ความอยากอาหารลด" },
      { key: "vision_problem", label: "ปัญหาการมองเห็น" },
      { key: "hearing_result", label: "ปัญหาการได้ยิน" },
      { key: "depression_symptom_2w", label: "อาการซึมเศร้า 2 สัปดาห์" },
      { key: "boredom_symptom_2w", label: "อาการเบื่อ 2 สัปดาห์" },
      { key: "suicide_thought_1m", label: "ความคิดทำร้ายตนเอง" },
      { key: "urinary_incontinence", label: "กลั้นปัสสาวะไม่ได้" },
      { key: "adl_status", label: "ADL Status" },
      { key: "chewing_difficulty", label: "เคี้ยวอาหารลำบาก" },
      { key: "oral_pain", label: "ปวดในช่องปาก" },
    ];

    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-[#faf8ff] via-white to-[#f5f0ff] p-4 sm:p-6">
        <div className="relative mb-8 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#7e32e2] via-[#9333ea] to-[#a855f7]" />
          <div className="absolute inset-0 bg-white/5" />

          <div className="relative p-6 sm:p-8 text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl transition"
                >
                  <ArrowLeft size={18} />
                  <span className="font-semibold">กลับ</span>
                </button>
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Users size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">รายละเอียดการคัดกรองผู้สูงอายุ</h1>
                  <p className="text-white/80 text-sm mt-1">{fullName}</p>
                </div>
              </div>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-white text-[#7e32e2] font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition"
              >
                <Download size={18} />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-[#f0ebff] p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="text-[#7e32e2]" size={18} />
              <h2 className="text-lg font-bold text-[#231d37]">ข้อมูลพื้นฐาน</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="ชื่อ-นามสกุล" value={fullName} />
              <InfoRow label="เลขบัตรประชาชน" value={elderlyRecord.citizen_id} />
              <InfoRow label="เพศ" value={elderlyRecord.gender || "-"} />
              <InfoRow label="อายุ" value={elderlyRecord.age ? `${elderlyRecord.age} ปี` : "-"} />
              <InfoRow label="เบอร์โทร" value={elderlyRecord.phone} />
              <InfoRow label="สิทธิ์การเข้าถึง" value={elderlyRecord.permission_level} />
              <InfoRow label="สถานะการคัดกรอง" value={elderlyRecord.screening_status} />
              <InfoRow label="ภาพรวม" value={elderlyRecord.overall_status} />
              <InfoRow label="สร้างเมื่อ" value={formatDate(elderlyRecord.created_at)} />
              <InfoRow label="อัพเดตเมื่อ" value={formatDate(elderlyRecord.updated_at)} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-[#f0ebff] p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="text-[#7e32e2]" size={18} />
              <h2 className="text-lg font-bold text-[#231d37]">ที่อยู่</h2>
            </div>
            <div className="space-y-2">
              <InfoRow label="บ้านเลขที่" value={elderlyRecord.house_no} />
              <InfoRow label="หมู่" value={elderlyRecord.moo} />
              <InfoRow label="ซอย" value={elderlyRecord.soi} />
              <InfoRow label="ถนน" value={elderlyRecord.road} />
              <InfoRow label="จังหวัด" value={elderlyRecord.province_name} />
              <InfoRow label="อำเภอ" value={elderlyRecord.district_name} />
              <InfoRow label="ตำบล" value={elderlyRecord.subdistrict_name} />
              <InfoRow label="รหัสไปรษณีย์" value={elderlyRecord.postal_code} />
              <InfoRow label="Latitude" value={elderlyRecord.latitude} />
              <InfoRow label="Longitude" value={elderlyRecord.longitude} />
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <Phone size={16} className="text-[#7e32e2]" />
              External User ID: {elderlyRecord.external_user_id || "-"}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-2xl shadow-lg border border-[#f0ebff] p-6">
          <h2 className="text-lg font-bold text-[#231d37] mb-4">ผลการคัดกรองตามหัวข้อ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {socialFields.map((field) => (
              <div key={field.key} className="flex items-center justify-between bg-purple-50/60 border border-purple-100 rounded-xl px-3 py-2">
                <span className="text-sm text-[#231d37] font-medium">{field.label}</span>
                <StatusBadge value={elderlyRecord[field.key]} />
              </div>
            ))}
            {healthFields.map((field) => (
              <div key={field.key} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-3 py-2">
                <span className="text-sm text-gray-700">{field.label}</span>
                <StatusBadge value={elderlyRecord[field.key]} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Main view: Show list of all elderly assessed by this assessor
  if (assessorId) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-[#faf8ff] via-white to-[#f5f0ff] p-4 sm:p-6">
        <div className="relative mb-8 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#7e32e2] via-[#9333ea] to-[#a855f7]" />
          <div className="absolute inset-0 bg-white/5" />

          <div className="relative p-6 sm:p-8 text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl transition"
                >
                  <ArrowLeft size={18} />
                  <span className="font-semibold">กลับ</span>
                </button>
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Users size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">รายการผู้สูงอายุที่ประเมิน</h1>
                  <p className="text-white/80 text-sm mt-1">
                    ผู้ประเมิน: {assessorName || `User ${assessorId?.substring(0, 8)}`}
                  </p>
                  <p className="text-white/90 text-sm mt-1">
                    จำนวนทั้งหมด: <span className="font-bold">{elderlyCount}</span> คน
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-[#f0ebff] p-6">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="text-[#7e32e2]" size={20} />
            <h2 className="text-xl font-bold text-[#231d37]">รายการผู้สูงอายุทั้งหมด</h2>
          </div>

          {elderlyList.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">ไม่พบข้อมูลผู้สูงอายุ</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[15px] border-separate" style={{ borderSpacing: 0 }}>
                <thead>
                  <tr className="bg-gradient-to-r from-[#7e32e2] to-[#a855f7] text-white">
                    <th className="py-4 px-4 font-semibold text-center text-white rounded-tl-xl">ลำดับ</th>
                    <th className="py-4 px-4 font-semibold text-left text-white">ชื่อ-นามสกุล</th>
                    <th className="py-4 px-4 font-semibold text-center text-white">เลขบัตรประชาชน</th>
                    <th className="py-4 px-4 font-semibold text-center text-white">วันที่บันทึก</th>
                    <th className="py-4 px-4 font-semibold text-center text-white">สถานะ</th>
                    <th className="py-4 px-4 font-semibold text-center text-white rounded-tr-xl">รายละเอียด</th>
                  </tr>
                </thead>
                <tbody>
                  {elderlyList.map((elderly, idx) => {
                    const fullName = buildFullName(elderly);
                    const thaiDate = formatThaiDate(elderly.created_at || elderly.date);

                    return (
                      <tr
                        key={elderly.id || elderly.citizen_id || idx}
                        className={`${
                          idx % 2 === 0 ? "bg-white" : "bg-purple-50/30"
                        } hover:bg-purple-50 transition-colors`}
                      >
                        <td className="py-4 px-4 text-center font-medium text-gray-600">
                          {idx + 1}
                        </td>
                        <td className="py-4 px-4 font-medium text-[#231d37]">
                          {fullName}
                        </td>
                        <td className="py-4 px-4 text-center text-gray-600">
                          {elderly.citizen_id || "-"}
                        </td>
                        <td className="py-4 px-4 text-center text-gray-700">
                          {thaiDate}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <StatusBadge value={elderly.overall_status || elderly.screening_status} />
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7e32e2] to-[#9333ea] text-white font-semibold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                            onClick={() => setSelectedElderly(elderly)}
                          >
                            <Eye size={16} />
                            ดูรายละเอียด
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback: No data
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#faf8ff] via-white to-[#f5f0ff] p-6">
      <p className="text-gray-700 font-semibold mb-4">ไม่พบข้อมูล</p>
      <button
        onClick={goBack}
        className="flex items-center gap-2 px-4 py-2 bg-[#7e32e2] text-white rounded-xl shadow hover:shadow-md transition"
      >
        <ArrowLeft size={18} />
        กลับ
      </button>
    </div>
  );
};

export default ElderlyScreeningDetail;
