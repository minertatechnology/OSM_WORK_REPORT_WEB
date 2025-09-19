import React, { useState, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import {
  Home,
  Users,
  Database,
  FileText,
  BarChart2,
  UserCheck,
  Activity,
  FileCheck,
  FileSearch,
  Bell,
  Gift,
  ChevronLeft,
  CheckCircle
} from "lucide-react";
import ButtonService from "@services/ButtonService/ButtonService";
import InputService from "@services/inputService/inputService";

// MOCK DATA ใช้ role สำหรับ dropdown
export const mockList = [
  { id: 1, name: "นายกิตติพงศ์ ศรีบรรจง", role: "เจ้าหน้าที่ศูนย์สนับสนุน", position: "ศูนย์สนับสนุนบริการสุขภาพที่ 4" },
  { id: 2, name: "นางสาวณัฐธิดา สมานจิตต์", role: "เจ้าหน้าที่อำเภอ", position: "อำเภอเมืองนนทบุรี" },
  { id: 3, name: "นายปริญญา รัตนชัย", role: "เจ้าหน้าที่จังหวัด", position: "จังหวัดนนทบุรี" },
  { id: 4, name: "นางสาวพิมพ์พร วงศ์ประเสริฐ", role: "เจ้าหน้าที่สาธารณสุข", position: "สาธารณสุขจังหวัดนนทบุรี" },
  { id: 5, name: "นายธนพล เทพสุข", role: "เจ้าหน้าที่ รพ.สต.", position: "รพ.สต.ทดสอบ 1" },
  { id: 6, name: "นายศิริศร สุขสวัสดิ์", role: "เจ้าหน้าที่สาธารณสุขอำเภอ", position: "อำเภอไชโย" },
  { id: 7, name: "นายอนุชา จิตวิริยะ", role: "เจ้าหน้าที่ รพ.", position: "โรงพยาบาลนนทบุรี" },
  { id: 8, name: "นายวัชรัญญู ทองนาค", role: "เจ้าหน้าที่ อบต.", position: "อบต.ท่าทราย" },
  { id: 9, name: "นายสุริยา บังพิมพ์", role: "เจ้าหน้าที่เทศบาล", position: "เทศบาลเมืองนนทบุรี" },
  { id: 10, name: "นายสธิชา ศรีสมบูรณ์", role: "เจ้าหน้าที่พัฒนาสังคม", position: "กรมพัฒนาสังคม" },
  { id: 11, name: "นายวรุตม์ โพธิ์กลิ่น", role: "เจ้าหน้าที่ศูนย์ข้อมูล", position: "ศูนย์ข้อมูลนนทบุรี" },
  { id: 12, name: "นางสาวกมลวรรณ พิทักษ์", role: "เจ้าหน้าที่กระทรวงสาธารณสุข", position: "กระทรวงสาธารณสุข" },
  { id: 13, name: "นายปกรณ์ ทัศนีย์", role: "เจ้าหน้าที่ฝ่ายงบประมาณ", position: "ฝ่ายงบประมาณ อำเภอบางกรวย" },
  { id: 14, name: "นางสาวศิริพร ศรีบุญ", role: "เจ้าหน้าที่ฝ่ายบุคคล", position: "ฝ่ายบุคคล อำเภอปากเกร็ด" },
  { id: 15, name: "นายวชิรวิทย์ แก้วสกุล", role: "เจ้าหน้าที่ฝ่ายประชาสัมพันธ์", position: "ประชาสัมพันธ์ อำเภอบางใหญ่" },
  { id: 16, name: "นางสาวพรรณี มณีวรรณ", role: "เจ้าหน้าที่ฝ่ายแผนงาน", position: "ฝ่ายแผนงาน อำเภอบางบัวทอง" },
  { id: 17, name: "นายปฏิภาณ ขวัญเมือง", role: "เจ้าหน้าที่ฝ่ายเทคโนโลยี", position: "ฝ่ายเทคโนโลยี อำเภอไทรน้อย" },
  { id: 18, name: "นางสาววิมลรัตน์ กลิ่นขจร", role: "เจ้าหน้าที่ฝ่ายวิจัย", position: "ฝ่ายวิจัย อำเภอบางกรวย" },
  { id: 19, name: "นายพงศกร ชัยมงคล", role: "เจ้าหน้าที่ฝ่ายตรวจสอบ", position: "ฝ่ายตรวจสอบ อำเภอเมืองนนทบุรี" },
  { id: 20, name: "นางสาวปรียานุช สิมมา", role: "เจ้าหน้าที่ฝ่ายกฎหมาย", position: "ฝ่ายกฎหมาย อำเภอบางใหญ่" },
];

const PRIMARY = "#6E28B7";
const BUTTON_PURPLE = "#6E28B7";
const BUTTON_BG = "#f9f6ff";

const REPORT_OSM1_SUBMENU = [
  { id: "osm1-data", label: "ข้อมูลรายงาน อสม.1" },
  { id: "osm1-gis", label: "GIS รายงาน อสม.1" },
];
const REPORT_MOSQUITO_SUBMENU = [
  { id: "mosquito-data", label: "ข้อมูลรายงาน ลูกน้ำยุงลาย" },
  { id: "mosquito-gis", label: "GIS รายงาน ลูกน้ำยุงลาย" },
];
const OSM_POINTS_SUBMENU = [
  { id: "points-redeem", label: "กำหนดการแลกของรางวัล" },
  { id: "points-shipping", label: "การขนส่งของรางวัล" },
];

// SIDEMENU_ITEMS
const SIDEMENU_ITEMS = [
  { id: "home", label: "หน้าหลัก", icon: <Home size={22} color={PRIMARY} /> },
  { id: "user-list", label: "รายชื่อผู้ใช้งานแอปพลิเคชัน", icon: <Users size={22} color={PRIMARY} /> },
  { id: "osm-thaiphc", label: "ข้อมูล อสม. Thai Phc", icon: <Database size={22} color={PRIMARY} /> },
  {
    id: "osm1", label: "รายงาน อสม.1", icon: <FileText size={22} color={PRIMARY} />,
    children: REPORT_OSM1_SUBMENU,
  },
  {
    id: "mosquito", label: "รายงาน ลูกน้ำยุงลาย", icon: <BarChart2 size={22} color={PRIMARY} />,
    children: REPORT_MOSQUITO_SUBMENU,
  },
  { id: "elderly-screening", label: "คัดกรองผู้สูงอายุในชุมชน", icon: <UserCheck size={22} color={PRIMARY} /> },
  { id: "ncds-screening", label: "คัดกรองโรคไม่ติดต่อเรื้อรัง NCDs", icon: <Activity size={22} color={PRIMARY} /> },
  { id: "pregnant-report", label: "รายงานประเมินหญิงตั้งครรภ์", icon: <FileCheck size={22} color={PRIMARY} /> },
  {
    id: "osm-points", label: "จัดการคะแนนสะสม อสม.", icon: <Gift size={22} color={PRIMARY} />,
    children: OSM_POINTS_SUBMENU,
  },
  { id: "osm-health", label: "ผลตรวจสุขภาพ อสม.", icon: <BarChart2 size={22} color={PRIMARY} /> },
  { id: "atk-report", label: "รายงานผลตรวจ ATK", icon: <FileSearch size={22} color={PRIMARY} /> },
  { id: "news", label: "ประกาศข่าวสาร", icon: <Bell size={22} color={PRIMARY} /> },
  { id: "access-control", label: "กำหนดสิทธิ์การเข้าถึง", icon: <Users size={22} color={PRIMARY} /> },
];

// สร้าง roleOptions จาก mockList
function getRoleOptions() {
  const roles = mockList.map(x => x.role);
  return Array.from(new Set(roles)).map(role => ({ value: role, label: role }));
}

// สร้าง initial access สำหรับแต่ละ role
function getInitialAccess(roleOptions) {
  const result = {};
  roleOptions.forEach(roleObj => {
    result[roleObj.value] = {};
    SIDEMENU_ITEMS.forEach(menu => {
      result[roleObj.value][menu.id] = true;
      if (menu.children) {
        menu.children.forEach(sub => {
          result[roleObj.value][sub.id] = true;
        });
      }
    });
  });
  return result;
}

export default function ManageAccess() {
  const router = useRouter();
  const roleOptions = useMemo(getRoleOptions, []);
  const [role, setRole] = useState(roleOptions[0]?.value || "");
  const [menuAccess, setMenuAccess] = useState(getInitialAccess(roleOptions));
  const savedAccess = useRef(getInitialAccess(roleOptions));
  const savedRole = useRef(roleOptions[0]?.value || "");
  const [showSuccess, setShowSuccess] = useState(false);

  function handleMenuMainToggle(menuId, hasChildren, children) {
    const checked = !menuAccess[role][menuId];
    setMenuAccess(prev => {
      const newAccess = { ...prev };
      newAccess[role] = { ...prev[role], [menuId]: checked };
      if (hasChildren) {
        children.forEach(sub =>
          newAccess[role][sub.id] = checked
        );
      }
      return newAccess;
    });
  }

  function handleMenuSubToggle(menuId, parentId, childrenArr) {
    const checked = !menuAccess[role][menuId];
    setMenuAccess(prev => {
      const newAccess = { ...prev };
      newAccess[role] = { ...prev[role], [menuId]: checked };
      const allSubFalse = childrenArr.every(sub => !newAccess[role][sub.id]);
      newAccess[role][parentId] = !allSubFalse;
      return newAccess;
    });
  }

  function handleSave() {
    savedAccess.current = JSON.parse(JSON.stringify(menuAccess));
    savedRole.current = role;
    setShowSuccess(true);
    // เพิ่ม logic API/save ได้
  }

  function handleResetAndBack() {
    setRole(savedRole.current);
    setMenuAccess(JSON.parse(JSON.stringify(savedAccess.current)));
    router.back();
  }

  // ฟังก์ชันสำหรับ sidemenucomp: คืนเมนูที่ role นั้นมีสิทธิ์ (ตามที่ติ๊กไว้)
  function getAllowedSidemenuForRole(roleKey) {
    const access = menuAccess[roleKey];
    return SIDEMENU_ITEMS
      .filter(menu => access[menu.id])
      .map(menu => {
        if (menu.children) {
          const allowedChildren = menu.children.filter(sub => access[sub.id]);
          if (allowedChildren.length === 0) return null;
          return { ...menu, children: allowedChildren };
        }
        return menu;
      })
      .filter(Boolean);
  }

  return (
    <div style={{ padding: 32, background: BUTTON_BG, minHeight: "100vh" }}>
      <div style={{
        maxWidth: 750, margin: "0 auto", background: "#fff",
        borderRadius: 12, boxShadow: "0 2px 8px #eee", padding: 32
      }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: PRIMARY, marginBottom: 18 }}>
          จัดการสิทธิ์การเข้าถึง
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: "#231d37", fontWeight: "bold", marginBottom: 8, display: "block" }}>
            บทบาทเจ้าหน้าที่
          </label>
          <InputService
            options={roleOptions}
            value={role}
            onChange={e => setRole(e.value || e.target.value)}
            placeholder="เลือกบทบาทเจ้าหน้าที่"
            clearable={true}
          />
        </div>
        <div style={{ borderBottom: "1px solid #ede7fa", marginBottom: 18 }} />
        <div style={{ fontWeight: "bold", color: PRIMARY, fontSize: 18, marginBottom: 10 }}>เมนู</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {SIDEMENU_ITEMS.map(menu => (
            <div key={menu.id}
              style={{
                background: "#fff", border: "1.5px solid #c9b7f7", borderRadius: 10,
                padding: 16, marginBottom: 6
              }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={!!menuAccess[role][menu.id]}
                  onChange={() =>
                    menu.children
                      ? handleMenuMainToggle(menu.id, true, menu.children)
                      : handleMenuMainToggle(menu.id, false, [])
                  }
                  style={{ width: 22, height: 22, accentColor: PRIMARY, marginRight: 10 }}
                />
                <span style={{ marginRight: 10 }}>{menu.icon}</span>
                <span style={{ fontWeight: "bold", fontSize: 16, color: "#231d37" }}>{menu.label}</span>
              </div>
              {menu.children && (
                <div style={{
                  paddingLeft: 40, marginTop: 8,
                  display: "flex", flexDirection: "column", gap: 6
                }}>
                  {menu.children.map(sub => (
                    <div key={sub.id} style={{ display: "flex", alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={!!menuAccess[role][sub.id]}
                        onChange={() => handleMenuSubToggle(sub.id, menu.id, menu.children)}
                        style={{ width: 22, height: 22, accentColor: PRIMARY, marginRight: 10 }}
                      />
                      <span style={{ fontWeight: "bold", fontSize: 15, color: "#231d37" }}>{sub.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ปุ่มบันทึก และ กลับหน้าแรก */}
        <div
          style={{
            marginTop: 36,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: BUTTON_BG,
            padding: "0 24px",
            borderRadius: 12,
            minHeight: 64,
            boxSizing: "border-box",
          }}
        >
          <ButtonService
            variant="secondary"
            size="lg"
            icon={<ChevronLeft size={22} />}
            onClick={handleResetAndBack}
            style={{ fontSize: 18, fontWeight: "bold" }}
          >
            กลับหน้าแรก
          </ButtonService>
          <ButtonService
            variant="primary"
            size="lg"
            onClick={handleSave}
            style={{ fontSize: 18, fontWeight: "bold" }}
          >
            บันทึก
          </ButtonService>
        </div>
      </div>

      {/* Success Popup */}
      {showSuccess && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-[rgba(48,16,81,0.12)]"
          onClick={() => setShowSuccess(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-lg px-8 py-10 flex flex-col items-center"
            style={{
              minWidth: 340,
              maxWidth: "90vw",
              border: "2px solid #ede7fa",
              boxShadow: "0 8px 32px #c9b7f7",
            }}
            onClick={e => e.stopPropagation()}
          >
            <CheckCircle size={60} color="#05FB26" className="mb-3" />
            <div className="text-[20px] font-extrabold text-[#05FB26] mb-1">บันทึกสำเร็จ!</div>
            <div className="text-[16px] text-[#231d37] mb-4 text-center">ข้อมูลสิทธิ์การเข้าถึงถูกบันทึกเรียบร้อยแล้ว</div>
            <ButtonService
              variant="primary"
              size="md"
              onClick={() => setShowSuccess(false)}
              style={{ marginTop: 10 }}
            >
              ปิด
            </ButtonService>
          </div>
        </div>
      )}
    </div>
  );
}