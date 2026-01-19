import React, { useState, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/router";
import {
  ChevronLeft,
  CheckCircle,
  Loader2
} from "lucide-react";
import ButtonService from "@services/buttonService/buttonService";
import InputService from "@services/inputService/inputService";
import { getPositions } from "@services/lookupService";
import {
  getMenuStructure,
  getUserMenuPermissions,
  setUserPermissions
} from "@services/menuPermissionService";
import { useIsClient } from "@hooks/useIsClient";

const PRIMARY = "#6E28B7";
const BUTTON_BG = "#f9f6ff";

// สร้าง roleOptions จาก positions data
function getRoleOptions(positions) {
  if (!positions || positions.length === 0) return [];

  return positions
    .filter(pos => pos.code !== 'DIR') // กรอง Director ออก
    .map(pos => ({
      value: pos.code || pos.id,
      label: pos.name_th || pos.label || pos.position_name || pos.name || pos.id || ""
    }));
}

// แปลงเมนูจาก API เป็นรูปแบบที่ใช้งานได้
function convertMenuToFlatList(menus, result = [], level = 0, parentInfo = null) {
  menus.forEach(menu => {
    const menuItem = {
      id: menu.id,
      code: menu.code,
      label: menu.name_th,
      nameTh: menu.name_th,
      path: menu.path,
      icon: menu.icon,
      parentCode: parentInfo?.code || null,
      parentId: parentInfo?.id || null,
      level: level,
      hasChildren: menu.children && menu.children.length > 0,
      children: menu.children || [],
      scopeLevel: menu.scope_level || null
    };
    result.push(menuItem);

    if (menu.children && menu.children.length > 0) {
      convertMenuToFlatList(menu.children, result, level + 1, { id: menu.id, code: menu.code });
    }
  });

  return result;
}

export default function ManageAccess() {
  const router = useRouter();
  const isClient = useIsClient();
  const [positions, setPositions] = useState([]);
  const [flatMenus, setFlatMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const roleOptions = useMemo(() => getRoleOptions(positions), [positions]);
  const [role, setRole] = useState("");
  const [menuAccess, setMenuAccess] = useState({});

  const savedAccess = useRef({});
  const savedRole = useRef("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Mark component as mounted (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ดึงข้อมูล positions, menus และ scope levels
  useEffect(() => {
    if (!isClient || !isMounted) return;

    const fetchData = async () => {
      try {
        // ดึง positions
        const positionsData = await getPositions({ limit: 100 });
        console.log("Positions data:", positionsData);
        setPositions(positionsData);

        // ดึง menu structure
        const menusData = await getMenuStructure();
        console.log("Menu structure:", menusData);

        // แปลงเมนูเป็น flat list
        const flat = convertMenuToFlatList(menusData);
        console.log("Flat menus:", flat);
        setFlatMenus(flat);

        // ตั้งค่า role เริ่มต้น (หลังจากได้ positionsData แล้ว)
        const options = getRoleOptions(positionsData);
        if (options.length > 0) {
          const firstRole = options[0]?.value;
          setRole(firstRole);
        }

      } catch (error) {
        console.error("Failed to fetch data:", error);
        setPositions([]);
        setFlatMenus([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isClient, isMounted]);

  // โหลด permissions เมื่อเปลี่ยน role
  useEffect(() => {
    if (!role || loading) return;

    const fetchRolePermissions = async () => {
      try {
        // Initialize menuAccess for this role first
        setMenuAccess(prev => ({
          ...prev,
          [role]: prev[role] || {}
        }));

        const permissionsData = await getUserMenuPermissions(role);
        console.log(`Permissions for role ${role}:`, permissionsData);

        if (permissionsData.menus && permissionsData.menus.length > 0) {
          const access = {};
          permissionsData.menus.forEach(menu => {
            access[menu.code] = menu.can_view;
          });

          setMenuAccess(prev => ({
            ...prev,
            [role]: access
          }));
          savedAccess.current = {
            ...savedAccess.current,
            [role]: access
          };
        }
      } catch (error) {
        console.error(`Failed to fetch permissions for role ${role}:`, error);
        // Initialize with all unchecked if no permissions
        const defaultAccess = {};
        flatMenus.forEach(menu => {
          defaultAccess[menu.code] = false;
        });
        setMenuAccess(prev => ({
          ...prev,
          [role]: defaultAccess
        }));
      }
    };

    fetchRolePermissions();
  }, [role, loading, flatMenus]);

  // ดึงเฉพาะเมนูหลัก (ไม่ใช่ submenu)
  const mainMenus = useMemo(() => {
    return flatMenus.filter(m => m.level === 0);
  }, [flatMenus]);

  function handleMenuMainToggle(menuId, hasChildren) {
    if (!menuAccess[role]) {
      console.warn(`Role "${role}" not found in menuAccess`);
      return;
    }

    const checked = !menuAccess[role][menuId];
    setMenuAccess(prev => {
      const newAccess = { ...prev };
      newAccess[role] = { ...prev[role], [menuId]: checked };

      // Toggle all children
      if (hasChildren) {
        flatMenus.forEach(menu => {
          if (menu.parentCode === menuId) {
            newAccess[role][menu.code] = checked;
          }
        });
      }

      return newAccess;
    });
  }

  function handleMenuSubToggle(menuId, parentId) {
    if (!menuAccess[role]) {
      console.warn(`Role "${role}" not found in menuAccess`);
      return;
    }

    const checked = !menuAccess[role][menuId];
    setMenuAccess(prev => {
      const newAccess = { ...prev };
      newAccess[role] = { ...prev[role], [menuId]: checked };

      // Check if all siblings are unchecked
      const siblings = flatMenus.filter(m => m.parentCode === parentId);
      const allUnchecked = siblings.every(s => !newAccess[role][s.code]);
      newAccess[role][parentId] = !allUnchecked;

      return newAccess;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      // บันทึก permissions สำหรับ role
      const permissions = {};
      flatMenus.forEach(menu => {
        const hasAccess = menuAccess[role]?.[menu.code] || false;
        permissions[menu.code] = {
          can_view: hasAccess,
          can_create: false,
          can_edit: false,
          can_delete: false,
          can_export: false
        };
      });

      await setUserPermissions({
        user_id: role,
        permissions: permissions
      });

      // บันทึก permissions ลง localStorage สำหรับใช้ใน SideMenuComp
      const flatPermissions = {};
      flatMenus.forEach(menu => {
        flatPermissions[menu.code] = permissions[menu.code].can_view;
      });
      localStorage.setItem('menu_permissions', JSON.stringify(flatPermissions));
      console.log("Saved permissions to localStorage:", flatPermissions);

      savedAccess.current = JSON.parse(JSON.stringify(menuAccess));
      savedRole.current = role;
      setShowSuccess(true);
    } catch (error) {
      console.error("Failed to save:", error);
      alert("บันทึกไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  }

  function handleResetAndBack() {
    setRole(savedRole.current);
    setMenuAccess(JSON.parse(JSON.stringify(savedAccess.current)));
    router.back();
  }

  function getSubmenus(parentCode) {
    return flatMenus.filter(m => m.parentCode === parentCode);
  }

  return (
    <div style={{ padding: 32, background: BUTTON_BG, minHeight: "100vh" }} suppressHydrationWarning>
      <div style={{
        maxWidth: 900, margin: "0 auto", background: "#fff",
        borderRadius: 12, boxShadow: "0 2px 8px #eee", padding: 32
      }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: PRIMARY, marginBottom: 18 }}>
            จัดการสิทธิ์การเข้าถึงเมนู
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
            <Loader2 className="animate-spin mx-auto mb-2" size={32} />
            <div>กำลังโหลดข้อมูล...</div>
          </div>
        ) : (
          <>
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
              {mainMenus.map(menu => {
                const submenus = getSubmenus(menu.code);
                const hasChildren = submenus.length > 0;

                return (
                  <div key={menu.code}
                    style={{
                      background: "#fff", border: "1.5px solid #c9b7f7", borderRadius: 10,
                      padding: 16, marginBottom: 6
                    }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={!!menuAccess[role]?.[menu.code]}
                        onChange={() => handleMenuMainToggle(menu.code, hasChildren)}
                        disabled={!role}
                        style={{ width: 22, height: 22, accentColor: PRIMARY, marginRight: 10 }}
                      />
                      <span style={{ fontWeight: "bold", fontSize: 16, color: "#231d37" }}>
                        {menu.label}
                      </span>
                    </div>
                    {hasChildren && (
                      <div style={{
                        paddingLeft: 32, marginTop: 8,
                        display: "flex", flexDirection: "column", gap: 6
                      }}>
                        {submenus.map(sub => (
                          <div key={sub.code} style={{ display: "flex", alignItems: "center" }}>
                            <input
                              type="checkbox"
                              checked={!!menuAccess[role]?.[sub.code]}
                              onChange={() => handleMenuSubToggle(sub.code, menu.code)}
                              disabled={!role}
                              style={{ width: 20, height: 20, accentColor: PRIMARY, marginRight: 10 }}
                            />
                            <span style={{ fontWeight: "500", fontSize: 15, color: "#231d37" }}>
                              {sub.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

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
            disabled={saving || !role}
            style={{ fontSize: 18, fontWeight: "bold" }}
          >
            {saving ? (
              <>
                <Loader2 size={20} className="animate-spin mr-2" />
                กำลังบันทึก...
              </>
            ) : (
              "บันทึก"
            )}
          </ButtonService>
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
              <div className="text-[16px] text-[#231d37] mb-4 text-center">
                ข้อมูลสิทธิ์การเข้าถึงถูกบันทึกเรียบร้อยแล้ว
              </div>
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
    </div>
  );
}
