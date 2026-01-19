import React, { useState, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/router";
import {
  ChevronLeft,
  CheckCircle,
  Loader2,
  Settings,
  Shield
} from "lucide-react";
import ButtonService from "@services/buttonService/buttonService";
import InputService from "@services/inputService/inputService";
import { getPositions } from "@services/lookupService";
import {
  getMenuStructure,
  getUserMenuPermissions,
  setUserPermissions,
  getScopeLevels,
  updateMenuScope
} from "@services/menuPermissionService";

const PRIMARY = "#6E28B7";
const BUTTON_BG = "#f9f6ff";

// Scope hierarchy (from highest to lowest)
const SCOPE_HIERARCHY = {
  "country": 1,
  "area": 2,
  "province": 3,
  "district": 4,
  "subdistrict": 5,
  "village": 6
};

const SCOPE_LEVEL_NAMES = {
  "country": "ระดับประเทศ",
  "area": "ระดับเขตสุขภาพ",
  "province": "ระดับจังหวัด",
  "district": "ระดับอำเภอ",
  "subdistrict": "ระดับตำบล",
  "village": "ระดับหมู่บ้าน"
};

// สร้าง roleOptions จาก positions data
function getRoleOptions(positions) {
  if (!positions || positions.length === 0) return [];

  // เอาทุกตำแหน่ง เพราะตอนนี้ใช้ scope_level ในการกรอง
  return positions
    .filter(pos => pos.scope_level) // เฉพาะที่มี scope_level
    .map(pos => ({
      value: pos.code || pos.id,
      label: pos.name_th || pos.label || pos.position_name || pos.name || pos.id || "",
      scopeLevel: pos.scope_level
    }))
    .sort((a, b) => {
      // Sort by scope level (higher level first)
      const levelA = SCOPE_HIERARCHY[a.scopeLevel] || 999;
      const levelB = SCOPE_HIERARCHY[b.scopeLevel] || 999;
      return levelA - levelB;
    });
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

// เช็คว่า role สามารถเข้าถึงเมนูตาม scope_level ได้หรือไม่
function canAccessByScope(roleScopeLevel, menuScopeLevel) {
  if (!menuScopeLevel) return true; // ไม่มี scope restriction
  if (!roleScopeLevel) return false;

  const roleLevel = SCOPE_HIERARCHY[roleScopeLevel];
  const menuLevel = SCOPE_HIERARCHY[menuScopeLevel];

  if (roleLevel === undefined || menuLevel === undefined) return true;

  return roleLevel <= menuLevel; // ระดับสูงกว่า (เลขน้อยกว่า) สามารถเข้าถึงระดับต่ำกว่าได้
}

export default function ManageAccess() {
  const router = useRouter();
  const [positions, setPositions] = useState([]);
  const [flatMenus, setFlatMenus] = useState([]);
  const [scopeLevels, setScopeLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState("role"); // "role" or "scope"

  const roleOptions = useMemo(() => getRoleOptions(positions), [positions]);
  const [role, setRole] = useState(roleOptions[0]?.value || "");
  const [menuAccess, setMenuAccess] = useState({});
  const [menuScopes, setMenuScopes] = useState({}); // menu_code -> scope_level

  const savedAccess = useRef({});
  const savedRole = useRef("");
  const [showSuccess, setShowSuccess] = useState(false);

  // ดึงข้อมูล positions, menus และ scope levels
  useEffect(() => {
    const fetchData = async () => {
      try {
        // ดึง positions
        const positionsData = await getPositions({ limit: 100 });
        console.log("Positions data:", positionsData);
        setPositions(positionsData);

        // ดึง scope levels
        const scopeLevelsData = await getScopeLevels();
        console.log("Scope levels:", scopeLevelsData);
        setScopeLevels(scopeLevelsData.levels || []);

        // ดึง menu structure
        const menusData = await getMenuStructure();
        console.log("Menu structure:", menusData);

        // แปลงเมนูเป็น flat list
        const flat = convertMenuToFlatList(menusData);
        console.log("Flat menus:", flat);
        setFlatMenus(flat);

        // เก็บ scope_level ของแต่ละเมนู
        const scopes = {};
        flat.forEach(menu => {
          if (menu.scopeLevel) {
            scopes[menu.code] = menu.scopeLevel;
          }
        });
        setMenuScopes(scopes);

        // ตั้งค่า role เริ่มต้น
        if (roleOptions.length > 0) {
          const firstRole = roleOptions[0]?.value;
          setRole(firstRole);
        }

      } catch (error) {
        console.error("Failed to fetch data:", error);
        setPositions([]);
        setFlatMenus([]);
        setScopeLevels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // โหลด permissions เมื่อเปลี่ยน role
  useEffect(() => {
    if (!role || loading) return;

    const fetchRolePermissions = async () => {
      try {
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
        // ถ้าไม่มี permissions ให้คำนวณจาก scope_level
        const currentRole = roleOptions.find(r => r.value === role);
        if (currentRole) {
          const defaultAccess = {};
          flatMenus.forEach(menu => {
            defaultAccess[menu.code] = canAccessByScope(currentRole.scopeLevel, menu.scopeLevel);
          });
          setMenuAccess(prev => ({
            ...prev,
            [role]: defaultAccess
          }));
        }
      }
    };

    fetchRolePermissions();
  }, [role, loading, flatMenus, roleOptions]);

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

  function handleMenuScopeChange(menuCode, newScopeLevel) {
    setMenuScopes(prev => ({
      ...prev,
      [menuCode]: newScopeLevel
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (viewMode === "role") {
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
      } else {
        // บันทึก scope_level สำหรับแต่ละเมนู
        for (const [menuCode, scopeLevel] of Object.entries(menuScopes)) {
          const menu = flatMenus.find(m => m.code === menuCode);
          if (menu && menu.id) {
            await updateMenuScope(menu.id, scopeLevel);
          }
        }
      }

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

  // Get current role info
  const currentRoleInfo = useMemo(() => {
    return roleOptions.find(r => r.value === role);
  }, [role, roleOptions]);

  // สร้าง scope options สำหรับ dropdown
  const scopeOptions = useMemo(() => {
    return [
      { value: "", label: "ทุกระดับ (ไม่จำกัด)" },
      ...scopeLevels.map(level => ({
        value: level.code,
        label: `${level.name_th} / ${level.name_en}`
      }))
    ];
  }, [scopeLevels]);

  return (
    <div style={{ padding: 32, background: BUTTON_BG, minHeight: "100vh" }}>
      <div style={{
        maxWidth: 900, margin: "0 auto", background: "#fff",
        borderRadius: 12, boxShadow: "0 2px 8px #eee", padding: 32
      }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: PRIMARY, marginBottom: 18 }}>
            จัดการสิทธิ์การเข้าถึง
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <button
              onClick={() => setViewMode("role")}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: viewMode === "role" ? "2px solid #6E28B7" : "2px solid #c9b7f7",
                background: viewMode === "role" ? "#f9f6ff" : "#fff",
                color: viewMode === "role" ? "#6E28B7" : "#231d37",
                fontWeight: viewMode === "role" ? "bold" : "normal",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <Shield size={18} />
              กำหนดสิทธิ์ตามบทบาท
            </button>
            <button
              onClick={() => setViewMode("scope")}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: viewMode === "scope" ? "2px solid #6E28B7" : "2px solid #c9b7f7",
                background: viewMode === "scope" ? "#f9f6ff" : "#fff",
                color: viewMode === "scope" ? "#6E28B7" : "#231d37",
                fontWeight: viewMode === "scope" ? "bold" : "normal",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <Settings size={18} />
              กำหนดระดับการเข้าถึงเมนู
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
            <Loader2 className="animate-spin mx-auto mb-2" size={32} />
            <div>กำลังโหลดข้อมูล...</div>
          </div>
        ) : viewMode === "role" ? (
          /* Role Permission View */
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
              {currentRoleInfo && currentRoleInfo.scopeLevel && (
                <div style={{ marginTop: 8, fontSize: 14, color: "#666" }}>
                  ระดับสิทธิ์: <strong>{SCOPE_LEVEL_NAMES[currentRoleInfo.scopeLevel] || currentRoleInfo.scopeLevel}</strong>
                </div>
              )}
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
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
                      {menu.scopeLevel && (
                        <span style={{
                          fontSize: 12,
                          padding: "4px 8px",
                          borderRadius: 4,
                          background: "#f9f6ff",
                          color: PRIMARY
                        }}>
                          {SCOPE_LEVEL_NAMES[menu.scopeLevel] || menu.scopeLevel}
                        </span>
                      )}
                    </div>
                    {hasChildren && (
                      <div style={{
                        paddingLeft: 40, marginTop: 8,
                        display: "flex", flexDirection: "column", gap: 6
                      }}>
                        {submenus.map(sub => (
                          <div key={sub.code} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center" }}>
                              <input
                                type="checkbox"
                                checked={!!menuAccess[role]?.[sub.code]}
                                onChange={() => handleMenuSubToggle(sub.code, menu.code)}
                                disabled={!role}
                                style={{ width: 22, height: 22, accentColor: PRIMARY, marginRight: 10 }}
                              />
                              <span style={{ fontWeight: "bold", fontSize: 15, color: "#231d37" }}>
                                {sub.label}
                              </span>
                            </div>
                            {sub.scopeLevel && (
                              <span style={{
                                fontSize: 11,
                                padding: "3px 6px",
                                borderRadius: 4,
                                background: "#f9f6ff",
                                color: PRIMARY
                              }}>
                                {SCOPE_LEVEL_NAMES[sub.scopeLevel] || sub.scopeLevel}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Scope Level Configuration View */
          <>
            <div style={{ marginBottom: 16, padding: 16, background: "#f9f6ff", borderRadius: 8 }}>
              <div style={{ fontWeight: "bold", marginBottom: 8 }}>คำอธิบาย:</div>
              <div style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>
                กำหนดระดับขั้นต่ำที่ต้องมีเพื่อเข้าถึงเมนู เช่น ถ้ากำหนดเป็น "ระดับจังหวัด"
                ผู้ใช้ที่มีระดับ "ประเทศ" หรือ "เขตสุขภาพ" หรือ "จังหวัด" จะเห็นเมนูนี้
                แต่ผู้ใช้ระดับ "อำเภอ" หรือ "ตำบล" จะไม่เห็น
              </div>
            </div>

            <div style={{ borderBottom: "1px solid #ede7fa", marginBottom: 18 }} />
            <div style={{ fontWeight: "bold", color: PRIMARY, fontSize: 18, marginBottom: 10 }}>กำหนดระดับการเข้าถึงเมนู</div>

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
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "bold", fontSize: 16, color: "#231d37" }}>
                        {menu.label}
                      </span>
                      <select
                        value={menuScopes[menu.code] || ""}
                        onChange={(e) => handleMenuScopeChange(menu.code, e.target.value)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 6,
                          border: "1px solid #c9b7f7",
                          fontSize: 14,
                          minWidth: 200
                        }}
                      >
                        {scopeOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    {hasChildren && (
                      <div style={{
                        paddingLeft: 40, marginTop: 8,
                        display: "flex", flexDirection: "column", gap: 6
                      }}>
                        {submenus.map(sub => (
                          <div key={sub.code} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontWeight: "bold", fontSize: 15, color: "#231d37" }}>
                              {sub.label}
                            </span>
                            <select
                              value={menuScopes[sub.code] || ""}
                              onChange={(e) => handleMenuScopeChange(sub.code, e.target.value)}
                              style={{
                                padding: "6px 12px",
                                borderRadius: 6,
                                border: "1px solid #c9b7f7",
                                fontSize: 14,
                                minWidth: 200
                              }}
                            >
                              {scopeOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
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
            disabled={saving || (viewMode === "role" && !role)}
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
                {viewMode === "role" ? "ข้อมูลสิทธิ์การเข้าถึงถูกบันทึกเรียบร้อยแล้ว" : "ระดับการเข้าถึงเมนูถูกบันทึกเรียบร้อยแล้ว"}
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
