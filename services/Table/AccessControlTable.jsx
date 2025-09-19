import React from "react";
import { Eye, User, Phone, BadgePercent, IdCard, Calendar, Home, Locate, Landmark, Building2, MapPin } from "lucide-react";
import ButtonService from "@services/ButtonService/ButtonService";

// MODAL COMPONENT
export function AccessControlDetailModal({ open, onClose, data }) {
  if (!open || !data) return null;
  return (
    <div className="fixed inset-0 z-[9999] bg-[rgba(48,16,81,0.15)] flex items-center justify-center">
      <div className="bg-white rounded-[20px] shadow-[0_5px_32px_#c9b7f7] w-[540px] max-w-[96vw] flex flex-col overflow-hidden">
        <div className="px-7 pt-7 pb-3 border-b border-[#ede7fa]">
          <span className="text-[22px] font-extrabold text-[#7e32e2]">รายละเอียด</span>
        </div>
        <div className="px-7 py-0 bg-white">
          <div className="grid grid-cols-2 gap-x-8 pt-6 pb-2">
            <div>
              <div className="flex items-center gap-2 text-[#7e32e2] text-[15.5px] font-bold mb-1"><User size={18} color="#7e32e2" />ชื่อ-นามสกุล</div>
              <div className="text-[#231d37] text-[16.5px] font-semibold mb-2">{data.name}</div>
              <div className="flex items-center gap-2 text-[#7e32e2] text-[15.5px] font-bold mb-1 mt-3"><Phone size={18} color="#7e32e2" />เบอร์โทรศัพท์</div>
              <div className="text-[#231d37] text-[16.5px] font-semibold mb-2">{data.phone}</div>
              <div className="flex items-center gap-2 text-[#7e32e2] text-[15.5px] font-bold mb-1 mt-3"><BadgePercent size={18} color="#7e32e2" />ตำแหน่ง</div>
              <div className="text-[#231d37] text-[16.5px] font-semibold mb-2">{data.position}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-[#7e32e2] text-[15.5px] font-bold mb-1"><IdCard size={18} color="#7e32e2" />เลขประจำตัวประชาชน</div>
              <div className="text-[#231d37] text-[16.5px] font-semibold mb-2">{data.citizenId}</div>
              <div className="flex items-center gap-2 text-[#7e32e2] text-[15.5px] font-bold mb-1 mt-3"><Calendar size={18} color="#7e32e2" />วัน/เดือน/ปี เกิด</div>
              <div className="text-[#231d37] text-[16.5px] font-semibold mb-2">{data.birth}</div>
            </div>
          </div>
          <div className="border-t border-[#ede7fa] mt-3 mb-2" />
          <div className="text-[#7e32e2] font-extrabold text-[17px] pt-3 pb-2">ที่อยู่</div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
            <div>
              <div className="flex items-center gap-2 text-[#7e32e2] text-[15.5px] font-bold mb-1"><Home size={18} color="#7e32e2" />บ้านเลขที่</div>
              <div className="text-[#231d37] text-[16.5px] font-semibold mb-1">{data.address.house}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-[#7e32e2] text-[15.5px] font-bold mb-1"><Home size={18} color="#7e32e2" />ซอย</div>
              <div className="text-[#231d37] text-[16.5px] font-semibold mb-1">{data.address.alley}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-[#7e32e2] text-[15.5px] font-bold mb-1"><Locate size={18} color="#7e32e2" />หมู่ที่</div>
              <div className="text-[#231d37] text-[16.5px] font-semibold mb-1">{data.address.village}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-[#7e32e2] text-[15.5px] font-bold mb-1"><Locate size={18} color="#7e32e2" />ชื่อหมู่บ้าน / ชุมชน</div>
              <div className="text-[#231d37] text-[16.5px] font-semibold mb-1">{data.address.community}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-[#7e32e2] text-[15.5px] font-bold mb-1"><Landmark size={18} color="#7e32e2" />จังหวัด</div>
              <div className="text-[#231d37] text-[16.5px] font-semibold mb-1">{data.address.province}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-[#7e32e2] text-[15.5px] font-bold mb-1"><Building2 size={18} color="#7e32e2" />อำเภอ</div>
              <div className="text-[#231d37] text-[16.5px] font-semibold mb-1">{data.address.district}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-[#7e32e2] text-[15.5px] font-bold mb-1"><MapPin size={18} color="#7e32e2" />ตำบล</div>
              <div className="text-[#231d37] text-[16.5px] font-semibold mb-1">{data.address.subdistrict}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-[#7e32e2] text-[15.5px] font-bold mb-1"><MapPin size={18} color="#7e32e2" />รหัสไปรษณีย์</div>
              <div className="text-[#231d37] text-[16.5px] font-semibold mb-1">{data.address.zipcode}</div>
            </div>
          </div>
        </div>
        <div className="bg-white px-7 py-5 text-right border-t border-[#ede7fa]">
          <ButtonService
        type="button"
        variant="secondary"
        size="md"
        className="bg-white text-[#7e32e2] border-2 border-[#c9b7f7] text-[16.5px] font-bold rounded-[12px] px-[34px] py-[7px] cursor-pointer transition hover:bg-violet-100"
        onClick={onClose}
        style={{
            fontSize: 16.5,
            fontWeight: "bold",
            borderRadius: 12,
            paddingLeft: 34,
            paddingRight: 34,
            paddingTop: 7,
            paddingBottom: 7,
            border: "2px solid #c9b7f7",
            background: "#fff",
            color: "#7e32e2",
        }}
        >
        ปิด
        </ButtonService>
        </div>
      </div>
    </div>
  );
}

// TABLE COMPONENT
export default function AccessControlTable({
  rows = [],
  onDetail,
}) {
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailData, setDetailData] = React.useState(null);

  // เมื่อกดดูรายละเอียด
  const handleDetail = (item) => {
    setDetailData(item);
    setDetailOpen(true);
  };

  // ปิด modal
  const handleCloseDetail = () => {
    setDetailOpen(false);
    setDetailData(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-x-auto border border-violet-100 relative">
      <table className="w-full min-w-[680px] border-separate border-spacing-0 text-[15px]">
        <thead>
          <tr>
            <th className="w-[70px] text-center bg-[#eadcff] text-[#231d37] font-bold text-[16px] py-3 px-3 border-b-2 border-[#ede7fa]">ลำดับ</th>
            <th className="text-left bg-[#eadcff] text-[#231d37] font-bold text-[16px] py-3 px-3 border-b-2 border-[#ede7fa]">รายชื่อ</th>
            <th className="text-left bg-[#eadcff] text-[#231d37] font-bold text-[16px] py-3 px-3 border-b-2 border-[#ede7fa]">บทบาทเจ้าหน้าที่</th>
            <th className="text-left bg-[#eadcff] text-[#231d37] font-bold text-[16px] py-3 px-3 border-b-2 border-[#ede7fa]">ตำแหน่ง</th>
            <th className="w-[170px] text-center bg-[#eadcff] text-[#231d37] font-bold text-[16px] py-3 px-3 border-b-2 border-[#ede7fa]">ดูรายละเอียด</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center text-gray-400 py-16">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Eye size={36} color="#d1c3f7" />
                  <span className="text-[15.5px] font-medium">ไม่พบข้อมูลเจ้าหน้าที่</span>
                </div>
              </td>
            </tr>
          ) : (
            rows.map((item, idx) => (
              <tr
                key={item.id ?? idx}
                className={`transition-all duration-150 hover:bg-[#f9f6ff] focus-within:bg-[#ede7fa]`}
                tabIndex={0}
              >
                <td className="text-center py-2 px-3 border-b border-[#ede7fa] font-medium">{item.no ?? idx + 1}</td>
                <td className="text-left py-2 px-3 border-b border-[#ede7fa] text-[#231d37] font-semibold">{item.name}</td>
                <td className="text-left py-2 px-3 border-b border-[#ede7fa]">{item.role}</td>
                <td className="text-left py-2 px-3 border-b border-[#ede7fa]">{item.position}</td>
                <td className="text-center py-[10px] px-2 border-b border-[#eee] bg-white">
                <ButtonService
                type="button"
                variant="secondary"
                size="md"
                icon={<Eye size={20} color="#7e32e2" />}
                className="border-2 border-[#7e32e2] bg-white text-[#7e32e2] px-4 py-2 rounded-[8px] font-bold text-[15px] flex items-center gap-2 transition hover:bg-[#ede2fb]"
                aria-label={`ดูรายละเอียดของ ${item.name}`}
                onClick={() => {
                    handleDetail(item);
                    if (typeof onDetail === "function") onDetail(item);
                }}
                style={{
                    boxShadow: "0 1px 4px #e3d7fa",
                    color: "#7e32e2",
                    fontSize: 15,
                    fontWeight: "bold",
                    borderRadius: 8,
                    background: "#fff",
                    border: "2px solid #7e32e2",
                    gap: 8,
                    display: "inline-flex",
                    alignItems: "center",
                    whiteSpace: "nowrap" // บังคับให้อยู่บรรทัดเดียว
                }}
                >
                ดูรายละเอียด
                </ButtonService>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {/* Modal สำหรับรายละเอียด ป๊อปอัพ */}
      <AccessControlDetailModal
        open={detailOpen}
        onClose={handleCloseDetail}
        data={detailData}
      />
      {/* Responsive scrollbar for mobile */}
      <style jsx>{`
        div::-webkit-scrollbar {
          height: 6px;
        }
        div::-webkit-scrollbar-thumb {
          background: #ede7fa;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}