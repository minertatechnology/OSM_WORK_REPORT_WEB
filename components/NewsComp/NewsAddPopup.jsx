import React, { useState, useEffect, useRef } from "react";
import InputService from "@services/inputService/inputService";
import ButtonService from "@services/buttonService/buttonService";
import {
  getHealthAreas,
  getProvinces,
  getDistricts,
  getSubdistricts,
  getHealthServices,
} from "@services/lookupService";

const purple = "#9327e2";
const border = "#c9b7f7";
const text_gray = "#231d37";
const gray_placeholder = "#b3b3b3";
const red = "#ff4158";

const getRoleType = (auth) => {
  if (!auth || !auth.roles || !auth.roles.length) return "sobos";
  const role = auth.roles[0];
  if (role === "สบส.") return "sobos";
  if (role === "เขต") return "zone";
  if (role === "จังหวัด") return "province";
  if (role === "อำเภอ") return "district";
  if (role === "ตำบล") return "subdistrict";
  return "sobos";
};

function getStyledOptions(options) {
  return options.map(opt => ({
    ...opt,
    style: opt.value === "" ? { color: gray_placeholder } : { color: text_gray }
  }));
}

function normalizeLookupItems(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.data?.items)) return raw.data.items;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

function buildLookupOptions(raw, placeholder) {
  const items = normalizeLookupItems(raw);
  const mapped = items
    .map(item => ({
      value:
        item?.code ||
        item?.id ||
        item?.value ||
        item?.province_code ||
        item?.district_code ||
        item?.subdistrict_code ||
        "",
      label:
        item?.name_th ||
        item?.name ||
        item?.label ||
        item?.title ||
        item?.province_name_th ||
        item?.province_name ||
        item?.district_name_th ||
        item?.district_name ||
        item?.subdistrict_name_th ||
        item?.subdistrict_name ||
        "",
    }))
    .filter(opt => opt.value && opt.label);

  return [
    { value: "", label: placeholder },
    { value: "all", label: "ทั้งหมด" },
    ...mapped,
  ];
}

function getInitialState(auth) {
  const roleType = getRoleType(auth);
  let healthZone = "", province = "", amphur = "", subdistrict = "", serviceUnit = "";
  if (auth) {
    if (roleType === "zone") healthZone = auth.zone || "";
    if (roleType === "province") {
      healthZone = auth.zone || "";
      province = auth.province || "";
    }
    if (roleType === "district") {
      healthZone = auth.zone || "";
      province = auth.province || "";
      amphur = auth.amphur || "";
    }
    if (roleType === "subdistrict") {
      healthZone = auth.zone || "";
      province = auth.province || "";
      amphur = auth.amphur || "";
      subdistrict = auth.subdistrict || "";
    }
  }
  return {
    healthZone,
    province,
    amphur,
    subdistrict,
    serviceUnit,
    title: "",
    detail: "",
    validate: false,
  };
}

export default function NewsAddPopup({
  open,
  onClose,
  onSubmit,
  mode = "add",
  data = null,
  onDelete,
  auth
}) {
  const isMounted = useRef(false);

  const [roleType, setRoleType] = useState(getRoleType(auth));
  const [form, setForm] = useState(mode === "detail" && data
    ? {
      healthZone: data.healthZone || "",
      province: data.province || "",
      amphur: data.amphur || "",
      subdistrict: data.subdistrict || "",
      serviceUnit: data.serviceUnit || "",
      title: data.title || "",
      detail: data.detail || "",
      validate: false,
    }
    : getInitialState(auth)
  );
  const [showConfirm, setShowConfirm] = useState(false);

  // States สำหรับข้อมูลจาก API
  const [healthZones, setHealthZones] = useState([{ value: "", label: "เลือกเขตสุขภาพ" }, { value: "all", label: "ทั้งหมด" }]);
  const [provinces, setProvinces] = useState([{ value: "", label: "เลือกจังหวัด" }, { value: "all", label: "ทั้งหมด" }]);
  const [amphurs, setAmphurs] = useState([{ value: "", label: "เลือกอำเภอ" }, { value: "all", label: "ทั้งหมด" }]);
  const [subdistricts, setSubdistricts] = useState([{ value: "", label: "เลือกตำบล" }, { value: "all", label: "ทั้งหมด" }]);
  const [healthServices, setHealthServices] = useState([{ value: "", label: "เลือกหน่วยบริการ" }, { value: "all", label: "ทั้งหมด" }]);

  // Loading states
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingAmphurs, setLoadingAmphurs] = useState(false);
  const [loadingSubdistricts, setLoadingSubdistricts] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);

  // Track mount status
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // โหลดข้อมูล Health Areas และ Provinces เมื่อ component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // โหลดเขตสุขภาพ
        const healthAreasData = await getHealthAreas({ limit: 100 });
        if (isMounted.current) {
          setHealthZones(buildLookupOptions(healthAreasData, "เลือกเขตสุขภาพ"));
        }

        // โหลดจังหวัด
        if (isMounted.current) {
          setLoadingProvinces(true);
        }
        const provincesData = await getProvinces({ limit: 100 });
        if (isMounted.current) {
          setProvinces(buildLookupOptions(provincesData, "เลือกจังหวัด"));
          setLoadingProvinces(false);
        }
      } catch (error) {
        console.error("Failed to load initial data:", error);
        if (isMounted.current) {
          setLoadingProvinces(false);
        }
      }
    };

    if (open) {
      loadInitialData();
    }
  }, [open]);

  // เมื่อเขตสุขภาพเป็น "all" ให้ตั้งค่าระดับด้านล่างเป็น "all" ด้วย
  useEffect(() => {
    if (form.healthZone === "all" && isMounted.current) {
      setForm(f => ({ ...f, province: "all", amphur: "all", subdistrict: "all", serviceUnit: "all" }));
    }
  }, [form.healthZone]);

  // เมื่อจังหวัดเป็น "all" ให้ตั้งค่าระดับด้านล่างเป็น "all" ด้วย
  useEffect(() => {
    if (form.province === "all" && isMounted.current) {
      setForm(f => ({ ...f, amphur: "all", subdistrict: "all", serviceUnit: "all" }));
    }
  }, [form.province]);

  // เมื่ออำเภอเป็น "all" ให้ตั้งค่าระดับด้านล่างเป็น "all" ด้วย
  useEffect(() => {
    if (form.amphur === "all" && isMounted.current) {
      setForm(f => ({ ...f, subdistrict: "all", serviceUnit: "all" }));
    }
  }, [form.amphur]);

  // เมื่อตำบลเป็น "all" ให้ตั้งค่าระดับด้านล่างเป็น "all" ด้วย
  useEffect(() => {
    if (form.subdistrict === "all" && isMounted.current) {
      setForm(f => ({ ...f, serviceUnit: "all" }));
    }
  }, [form.subdistrict]);

  // โหลดอำเภอเมื่อเลือกจังหวัด
  useEffect(() => {
    const loadAmphurs = async () => {
      if (!form.province || form.province === "" || form.province === "all") {
        if (isMounted.current) {
          setAmphurs([{ value: "", label: "เลือกอำเภอ" }, { value: "all", label: "ทั้งหมด" }]);
        }
        return;
      }

      try {
        if (isMounted.current) {
          setLoadingAmphurs(true);
        }
        const amphursData = await getDistricts(form.province);
        if (isMounted.current) {
          setAmphurs(buildLookupOptions(amphursData, "เลือกอำเภอ"));
        }
      } catch (error) {
        console.error("Failed to load amphurs:", error);
        if (isMounted.current) {
          setAmphurs([{ value: "", label: "เลือกอำเภอ" }, { value: "all", label: "ทั้งหมด" }]);
        }
      } finally {
        if (isMounted.current) {
          setLoadingAmphurs(false);
        }
      }
    };

    loadAmphurs();
  }, [form.province]);

  // โหลดตำบลเมื่อเลือกอำเภอ
  useEffect(() => {
    const loadSubdistricts = async () => {
      if (!form.amphur || form.amphur === "" || form.amphur === "all") {
        if (isMounted.current) {
          setSubdistricts([{ value: "", label: "เลือกตำบล" }, { value: "all", label: "ทั้งหมด" }]);
        }
        return;
      }

      try {
        if (isMounted.current) {
          setLoadingSubdistricts(true);
        }
        const subdistrictsData = await getSubdistricts(form.amphur);
        if (isMounted.current) {
          setSubdistricts(buildLookupOptions(subdistrictsData, "เลือกตำบล"));
        }
      } catch (error) {
        console.error("Failed to load subdistricts:", error);
        if (isMounted.current) {
          setSubdistricts([{ value: "", label: "เลือกตำบล" }, { value: "all", label: "ทั้งหมด" }]);
        }
      } finally {
        if (isMounted.current) {
          setLoadingSubdistricts(false);
        }
      }
    };

    loadSubdistricts();
  }, [form.amphur]);

  // โหลดหน่วยบริการเมื่อเลือกตำบล
  useEffect(() => {
    const loadHealthServices = async () => {
      if (!form.subdistrict || form.subdistrict === "" || form.subdistrict === "all") {
        if (isMounted.current) {
          setHealthServices([{ value: "", label: "เลือกหน่วยบริการ" }, { value: "all", label: "ทั้งหมด" }]);
        }
        return;
      }

      try {
        if (isMounted.current) {
          setLoadingServices(true);
        }
        const servicesData = await getHealthServices({
          province_code: form.province,
          district_code: form.amphur,
          subdistrict_code: form.subdistrict,
        });
        if (isMounted.current) {
          setHealthServices(buildLookupOptions(servicesData, "เลือกหน่วยบริการ"));
        }
      } catch (error) {
        console.error("Failed to load health services:", error);
        if (isMounted.current) {
          setHealthServices([{ value: "", label: "เลือกหน่วยบริการ" }, { value: "all", label: "ทั้งหมด" }]);
        }
      } finally {
        if (isMounted.current) {
          setLoadingServices(false);
        }
      }
    };

    loadHealthServices();
  }, [form.subdistrict, form.province, form.amphur]);

  useEffect(() => {
    if (!isMounted.current) return;

    setRoleType(getRoleType(auth));
    if (mode === "detail" && data) {
      setForm({
        healthZone: data.healthZone || "",
        province: data.province || "",
        amphur: data.amphur || "",
        subdistrict: data.subdistrict || "",
        serviceUnit: data.serviceUnit || "",
        title: data.title || "",
        detail: data.detail || "",
        validate: false,
      });
    } else {
      setForm(getInitialState(auth));
    }
    setShowConfirm(false); // reset confirm on open/close/change
  }, [auth, open, mode, data]);

  const {
    healthZone,
    province,
    amphur,
    subdistrict,
    serviceUnit,
    title,
    detail,
    validate,
  } = form;

  // เงื่อนไข disabled
  const isSobos = roleType === "sobos";
  const isHealthZoneNotSelected = isSobos && (!healthZone || healthZone === "");
  const isAllZone = healthZone === "all";
  const forceDisableAll = isAllZone;

  const isDisableProvince =
    forceDisableAll ||
    ["zone", "province", "district", "subdistrict"].includes(roleType) ||
    (isSobos && isHealthZoneNotSelected);

  const isDisableAmphur =
    forceDisableAll ||
    ["zone", "province", "district", "subdistrict"].includes(roleType) ||
    !province ||
    province === "all" ||
    (isSobos && isHealthZoneNotSelected);

  const isDisableSubdistrict =
    forceDisableAll ||
    ["zone", "province", "district", "subdistrict"].includes(roleType) ||
    !amphur ||
    amphur === "all" ||
    (isSobos && isHealthZoneNotSelected);

  const isDisableServiceUnit =
    forceDisableAll ||
    ["zone", "province", "district", "subdistrict"].includes(roleType) ||
    !subdistrict ||
    subdistrict === "all" ||
    (isSobos && isHealthZoneNotSelected);

  const isDisableTitle = forceDisableAll || (isSobos && isHealthZoneNotSelected);

  // เมื่อเป็นโหมด detail ทุกช่อง disabled
  const allDisabled = mode === "detail";

  // เงื่อนไข required สำหรับแต่ละ field
  const isRequiredProvince = !forceDisableAll && !(isSobos && isHealthZoneNotSelected) && !allDisabled;
  const isRequiredAmphur = !forceDisableAll && !(isSobos && isHealthZoneNotSelected) && !allDisabled;
  const isRequiredSubdistrict = !forceDisableAll && !(isSobos && isHealthZoneNotSelected) && !allDisabled;
  const isRequiredServiceUnit = !forceDisableAll && !(isSobos && isHealthZoneNotSelected) && !allDisabled;
  const isRequiredTitle = !forceDisableAll && !(isSobos && isHealthZoneNotSelected) && !allDisabled;

  // error สีแดง (เฉพาะโหมดเพิ่ม)
  const errorProvince = !allDisabled && validate && (!province || province === "");
  const errorAmphur = !allDisabled && validate && (!amphur || amphur === "");
  const errorSubdistrict = !allDisabled && validate && (!subdistrict || subdistrict === "");
  const errorServiceUnit = !allDisabled && validate && (!serviceUnit || serviceUnit === "");
  const errorTitle = !allDisabled && validate && (!title || title === "");

  // สี label
  function labelColor(val, disabled, error) {
    if (error) return red;
    if (disabled) return gray_placeholder;
    return text_gray;
  }
  // สี input border
  function inputBorder(val, disabled, error) {
    if (error) return `2px solid ${red}`;
    if (disabled) return `1.5px solid #ececec`;
    return `1.5px solid ${border}`;
  }

  function isCanSubmit() {
    if (mode === "detail") return false;
    if (isSobos && (!healthZone || healthZone === "")) return false;
    if (healthZone === "all") return true;
    if (province === "all") return true;
    if (amphur === "all") return true;
    if (subdistrict === "all") return true;
    if (serviceUnit === "all") return true;
    if (
      [healthZone, province, amphur, subdistrict, serviceUnit, title].every(
        v => v && v !== ""
      )
    ) {
      return true;
    }
    return false;
  }

  function handleClose() {
    setForm(getInitialState(auth));
    setRoleType(getRoleType(auth));
    setShowConfirm(false);
    if (onClose) onClose();
  }

  function handleSubmit(e) {
    e.preventDefault();
    setForm(f => ({ ...f, validate: true }));
    if (!isCanSubmit()) {
      return;
    }

    console.log("=== handleSubmit Debug ===");
    console.log("Form values:", { healthZone, province, amphur, subdistrict, serviceUnit });

    // เอาทุกระดับมาเสมอ ไม่ว่าจะเป็นค่าปกติหรือ "all"
    // เช่น amphur = "all" ก็เอามา แต่ label จะเป็น "ทั้งหมด"

    const selectedHealthZone = healthZones.find(hz => hz.value === healthZone) || null;
    const selectedProvince = provinces.find(p => p.value === province) || null;
    const selectedAmphur = amphurs.find(a => a.value === amphur) || null;
    const selectedSubdistrict = subdistricts.find(sd => sd.value === subdistrict) || null;
    const selectedServiceUnit = healthServices.find(su => su.value === serviceUnit) || null;

    console.log("Selected data:", {
      selectedHealthZone: selectedHealthZone ? { code: selectedHealthZone.value, name_th: selectedHealthZone.label } : null,
      selectedProvince: selectedProvince ? { code: selectedProvince.value, name_th: selectedProvince.label } : null,
      selectedAmphur: selectedAmphur ? { code: selectedAmphur.value, name_th: selectedAmphur.label } : null,
      selectedSubdistrict: selectedSubdistrict ? { code: selectedSubdistrict.value, name_th: selectedSubdistrict.label } : null,
      selectedServiceUnit: selectedServiceUnit ? { id: selectedServiceUnit.value, name_th: selectedServiceUnit.label } : null,
    });

    if (onSubmit) {
      onSubmit({
        healthZone: healthZone,
        healthZoneData: selectedHealthZone ? { code: selectedHealthZone.value, name_th: selectedHealthZone.label } : null,
        province: province,
        provinceData: selectedProvince ? { code: selectedProvince.value, name_th: selectedProvince.label } : null,
        amphur: amphur,
        amphurData: selectedAmphur ? { code: selectedAmphur.value, name_th: selectedAmphur.label } : null,
        subdistrict: subdistrict,
        subdistrictData: selectedSubdistrict ? { code: selectedSubdistrict.value, name_th: selectedSubdistrict.label } : null,
        serviceUnit: serviceUnit,
        serviceUnitData: selectedServiceUnit ? { id: selectedServiceUnit.value, name_th: selectedServiceUnit.label } : null,
        title,
        detail
      });
    }

    setTimeout(() => {
      setForm(getInitialState(auth));
      setRoleType(getRoleType(auth));
    }, 0);
  }

  // เพิ่ม popup confirm ลบ
  function handleDelete() {
    setShowConfirm(true);
  }
  function handleConfirmDelete() {
    setShowConfirm(false);
    if (onDelete) onDelete(data);
    handleClose();
  }
  function handleCancelDelete() {
    setShowConfirm(false);
  }

  if (!open) return null;

  return (
    <div style={{
      position: "fixed",
      zIndex: 9999,
      left: 0,
      top: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(30, 20, 40, 0.18)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      {/* Confirm Delete Popup */}
      {showConfirm && (
        <div style={{
          position: "fixed",
          left: 0, top: 0,
          width: "100vw", height: "100vh",
          background: "rgba(30, 20, 40, 0.25)",
          zIndex: 10001,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 8px 32px #ffd2d8",
            minWidth: 340,
            maxWidth: 400,
            padding: "36px 32px 24px 32px",
            textAlign: "center",
            border: `2px solid ${red}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}>
            <div style={{ marginBottom: 18 }}>
              <span style={{
                display: "inline-block",
                background: "#fff",
                borderRadius: "50%",
                border: `4px solid ${red}`,
                width: 64,
                height: 64,
                marginBottom: 10,
                lineHeight: "64px",
              }}>
                <span style={{
                  display: "inline-block",
                  fontSize: 36,
                  color: red,
                  verticalAlign: "middle",
                  marginTop: 8,
                  fontWeight: "bold"
                }}>!</span>
              </span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 20, color: red, marginBottom: 8 }}>
              คุณต้องการลบข้อมูลหรือไม่?
            </div>
            <div style={{ fontWeight: 500, fontSize: 15, color: "#a72a2a", marginBottom: 16 }}>
              ข้อมูลนี้จะถูกลบอย่างถาวรและไม่สามารถกู้คืนได้
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 10 }}>
              <ButtonService
                type="button"
                variant="secondary"
                size="md"
                style={{
                  background: "#fff",
                  color: red,
                  fontWeight: 600,
                  fontSize: 17,
                  borderRadius: 10,
                  border: `1.5px solid #dadada`,
                  padding: "8px 32px",
                  boxShadow: "0 2px 8px #ffd2d8",
                  cursor: "pointer"
                }}
                onClick={handleCancelDelete}
              >
                ปิด
              </ButtonService>
              <ButtonService
                type="button"
                variant="danger"
                size="md"
                style={{
                  background: red,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 17,
                  borderRadius: 10,
                  border: "none",
                  padding: "8px 32px",
                  boxShadow: "0 2px 8px #ffd2d8",
                  cursor: "pointer"
                }}
                onClick={handleConfirmDelete}
              >
                ยืนยันการลบ
              </ButtonService>
            </div>
          </div>
        </div>
      )}
      {/* Main Popup */}
      <form
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 8px 32px #d1c7ee",
          padding: "36px 44px 30px 44px",
          minWidth: 440,
          maxWidth: 520,
          width: "100%",
          fontFamily: "Prompt, 'Kanit', 'Roboto', sans-serif"
        }}
        onSubmit={mode === "add" ? handleSubmit : e => e.preventDefault()}
      >
        <div style={{
          fontWeight: 800,
          fontSize: 24,
          color: purple,
          marginBottom: 28,
          textAlign: "left",
          letterSpacing: "0.5px"
        }}>
          {mode === "add" ? "เพิ่มข่าวสาร" : "รายละเอียดข่าวสาร"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 18px", marginBottom: 0 }}>
          {/* เขตสุขภาพ */}
          <div style={{ gridColumn: "1 / 3" }}>
            <div style={{
              fontWeight: 600, fontSize: 16, marginBottom: 6,
              color: labelColor(healthZone, allDisabled || ["zone", "province", "district", "subdistrict"].includes(roleType), false)
            }}>
              เขตสุขภาพ
            </div>
            <InputService
              type="select"
              options={getStyledOptions(healthZones)}
              value={healthZone}
              onChange={e => !allDisabled && setForm(f => ({ ...f, healthZone: e.value || e.target.value }))}
              disabled={allDisabled || ["zone", "province", "district", "subdistrict"].includes(roleType)}
              style={{
                width: "100%",
                border: inputBorder(healthZone, allDisabled || ["zone", "province", "district", "subdistrict"].includes(roleType), false),
                borderRadius: 10,
                fontSize: 17,
                padding: "12px 20px",
                fontWeight: 500,
                color: (!healthZone || healthZone === "") ? gray_placeholder : text_gray,
                background: "#f6f2ff",
                transition: "border-color .2s"
              }}
            />
          </div>
          {/* จังหวัด */}
          <div>
            <div style={{
              fontWeight: 600, fontSize: 16, marginBottom: 6,
              color: labelColor(province, allDisabled || isDisableProvince, errorProvince)
            }}>
              จังหวัด {errorProvince && <span style={{ color: red, fontSize: 13 }}> * ต้องกรอก</span>}
            </div>
            <InputService
              type="select"
              options={getStyledOptions(provinces)}
              value={province}
              onChange={e => !allDisabled && setForm(f => ({ ...f, province: e.value || e.target.value }))}
              disabled={allDisabled || isDisableProvince}
              required={isRequiredProvince}
              style={{
                width: "100%",
                border: inputBorder(province, allDisabled || isDisableProvince, errorProvince),
                borderRadius: 10,
                fontSize: 17,
                padding: "12px 20px",
                fontWeight: 500,
                color: (!province || province === "") ? gray_placeholder : text_gray,
                background: "#f6f2ff",
                transition: "border-color .2s"
              }}
            />
          </div>
          {/* อำเภอ */}
          <div>
            <div style={{
              fontWeight: 600, fontSize: 16, marginBottom: 6,
              color: labelColor(amphur, allDisabled || isDisableAmphur, errorAmphur)
            }}>
              อำเภอ {errorAmphur && <span style={{ color: red, fontSize: 13 }}> * ต้องกรอก</span>}
            </div>
            <InputService
              type="select"
              options={getStyledOptions(amphurs)}
              value={amphur}
              onChange={e => !allDisabled && setForm(f => ({ ...f, amphur: e.value || e.target.value }))}
              disabled={allDisabled || isDisableAmphur}
              required={isRequiredAmphur}
              style={{
                width: "100%",
                border: inputBorder(amphur, allDisabled || isDisableAmphur, errorAmphur),
                borderRadius: 10,
                fontSize: 17,
                padding: "12px 20px",
                fontWeight: 500,
                color: (!amphur || amphur === "") ? gray_placeholder : text_gray,
                background: "#f6f2ff",
                transition: "border-color .2s"
              }}
            />
          </div>
          {/* ตำบล */}
          <div>
            <div style={{
              fontWeight: 600, fontSize: 16, marginBottom: 6,
              color: labelColor(subdistrict, allDisabled || isDisableSubdistrict, errorSubdistrict)
            }}>
              ตำบล {errorSubdistrict && <span style={{ color: red, fontSize: 13 }}> * ต้องกรอก</span>}
            </div>
            <InputService
              type="select"
              options={getStyledOptions(subdistricts)}
              value={subdistrict}
              onChange={e => !allDisabled && setForm(f => ({ ...f, subdistrict: e.value || e.target.value }))}
              disabled={allDisabled || isDisableSubdistrict}
              required={isRequiredSubdistrict}
              style={{
                width: "100%",
                border: inputBorder(subdistrict, allDisabled || isDisableSubdistrict, errorSubdistrict),
                borderRadius: 10,
                fontSize: 17,
                padding: "12px 20px",
                fontWeight: 500,
                color: (!subdistrict || subdistrict === "") ? gray_placeholder : text_gray,
                background: "#f6f2ff",
                transition: "border-color .2s"
              }}
            />
          </div>
          {/* หน่วยบริการ */}
          <div>
            <div style={{
              fontWeight: 600, fontSize: 16, marginBottom: 6,
              color: labelColor(serviceUnit, allDisabled || isDisableServiceUnit, errorServiceUnit)
            }}>
              หน่วยบริการ {errorServiceUnit && <span style={{ color: red, fontSize: 13 }}> * ต้องกรอก</span>}
            </div>
            <InputService
              type="select"
              options={getStyledOptions(healthServices)}
              value={serviceUnit}
              onChange={e => !allDisabled && setForm(f => ({ ...f, serviceUnit: e.value || e.target.value }))}
              disabled={allDisabled || isDisableServiceUnit}
              required={isRequiredServiceUnit}
              style={{
                width: "100%",
                border: inputBorder(serviceUnit, allDisabled || isDisableServiceUnit, errorServiceUnit),
                borderRadius: 10,
                fontSize: 17,
                padding: "12px 20px",
                fontWeight: 500,
                color: (!serviceUnit || serviceUnit === "") ? gray_placeholder : text_gray,
                background: "#f6f2ff",
                transition: "border-color .2s"
              }}
            />
          </div>
        </div>
        {/* หัวข้อ */}
        <div style={{ marginTop: 22 }}>
          <div style={{
            fontWeight: 600, fontSize: 16, marginBottom: 6,
            color: labelColor(title, allDisabled || isDisableTitle, errorTitle)
          }}>
            หัวข้อ {errorTitle && <span style={{ color: red, fontSize: 13 }}> * ต้องกรอก</span>}
          </div>
          <InputService
            type="text"
            value={title}
            onChange={e => !allDisabled && setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="ระบุข้อมูล"
            disabled={allDisabled || isDisableTitle}
            required={isRequiredTitle}
            style={{
              width: "100%",
              border: inputBorder(title, allDisabled || isDisableTitle, errorTitle),
              borderRadius: 10,
              fontSize: 17,
              padding: "12px 20px",
              fontWeight: 500,
              color: (!title || title === "") ? gray_placeholder : text_gray,
              background: "#f6f2ff",
              transition: "border-color .2s"
            }}
          />
        </div>
        {/* รายละเอียด */}
        <div style={{ marginTop: 22 }}>
          <div style={{
            fontWeight: 600, fontSize: 16, marginBottom: 6,
            color: labelColor(detail, false, false)
          }}>
            รายละเอียด
          </div>
          <InputService
            type="text"
            value={detail}
            onChange={e => !allDisabled && setForm(f => ({ ...f, detail: e.target.value }))}
            placeholder="ระบุข้อมูล"
            disabled={allDisabled}
            style={{
              width: "100%",
              border: inputBorder(detail, false, false),
              borderRadius: 10,
              fontSize: 17,
              padding: "12px 20px",
              fontWeight: 500,
              color: (!detail || detail === "") ? gray_placeholder : text_gray,
              background: "#f6f2ff",
              transition: "border-color .2s"
            }}
          />
        </div>
        {/* ปุ่ม */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: 24,
          marginTop: 38,
        }}>
          {mode === "add" ? (
            <>
              <ButtonService
                type="button"
                variant="secondary"
                size="md"
                style={{
                  background: "#fff",
                  color: purple,
                  fontWeight: 700,
                  fontSize: 19,
                  borderRadius: 12,
                  border: `1.5px solid ${purple}`,
                  padding: "10px 44px",
                  boxShadow: "0 2px 8px #e3d7fa",
                  cursor: "pointer"
                }}
                onClick={handleClose}
              >
                ปิด
              </ButtonService>
              <ButtonService
                type="submit"
                variant="primary"
                size="md"
                disabled={!isCanSubmit()}
                style={{
                  background: !isCanSubmit() ? "#eee" : purple,
                  color: !isCanSubmit() ? "#aaa" : "#fff",
                  fontWeight: 700,
                  fontSize: 19,
                  borderRadius: 12,
                  border: "none",
                  padding: "10px 44px",
                  boxShadow: "0 2px 8px #e3d7fa",
                  cursor: !isCanSubmit() ? "not-allowed" : "pointer"
                }}
              >
                เพิ่มข่าวสาร
              </ButtonService>
            </>
          ) : (
            <>
              <ButtonService
                type="button"
                variant="danger"
                size="md"
                style={{
                  background: "#fff",
                  color: red,
                  fontWeight: 700,
                  fontSize: 19,
                  borderRadius: 12,
                  border: `1.5px solid ${red}`,
                  padding: "10px 44px",
                  boxShadow: "0 2px 8px #ffd2d8",
                  cursor: "pointer"
                }}
                onClick={handleDelete}
              >
                ลบข้อมูล
              </ButtonService>
              <ButtonService
                type="button"
                variant="secondary"
                size="md"
                style={{
                  background: "#fff",
                  color: purple,
                  fontWeight: 700,
                  fontSize: 19,
                  borderRadius: 12,
                  border: `1.5px solid ${purple}`,
                  padding: "10px 44px",
                  boxShadow: "0 2px 8px #e3d7fa",
                  cursor: "pointer"
                }}
                onClick={handleClose}
              >
                ปิด
              </ButtonService>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
