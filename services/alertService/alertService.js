// "use client"; // ถ้าใช้ใน Next.js App Router และไฟล์นี้จะถูก import ใน component

import Swal from "sweetalert2";

const BRAND_COLOR = "#6E28B7";

const baseConfirm = {
  confirmButtonText: "ตกลง",
  confirmButtonColor: BRAND_COLOR,
};

const alertService = {
  success: (title, text = "", options = {}) =>
    Swal.fire({
      icon: "success",
      title,
      text,
      ...baseConfirm,
      ...options,
    }),

  error: (title, text = "", options = {}) =>
    Swal.fire({
      icon: "error",
      title,
      text,
      ...baseConfirm,
      confirmButtonColor: "#dc3545",
      ...options,
    }),

  warning: (title, text = "", options = {}) =>
    Swal.fire({
      icon: "warning",
      title,
      text,
      ...baseConfirm,
      confirmButtonColor: "#ffc107",
      ...options,
    }),

  info: (title, text = "", options = {}) =>
    Swal.fire({
      icon: "info",
      title,
      text,
      ...baseConfirm,
      confirmButtonColor: "#17a2b8",
      ...options,
    }),

  confirm: (title, text = "", options = {}) =>
    Swal.fire({
      icon: "question",
      title,
      text,
      showCancelButton: true,
      confirmButtonText: "ตกลง",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: BRAND_COLOR,
      cancelButtonColor: "#6c757d",
      reverseButtons: true,
      ...options,
    }),

  question: (title, text = "", options = {}) =>
    Swal.fire({
      icon: "question",
      title,
      text,
      ...baseConfirm,
      ...options,
    }),

  dynamic: (type, title, text = "", options = {}) => {
    const map = {
      success: alertService.success,
      error: alertService.error,
      warning: alertService.warning,
      info: alertService.info,
      confirm: alertService.confirm,
      question: alertService.question,
    };
    const fn = map[type];
    if (!fn) {
      console.error(`Unsupported alert type: ${type}`);
      return Promise.reject(new Error(`Unsupported alert type: ${type}`));
    }
    return fn(title, text, options);
  },

  loading: (title = "กำลังดำเนินการ...", text = "", options = {}) =>
    Swal.fire({
      title,
      text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
      ...options,
    }),

  closeLoading: () => Swal.close(),

  toast: (type, title, options = {}) => {
    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
      ...options,
    });
    return Toast.fire({ icon: type, title });
  },

  input: (title, inputType = "text", options = {}) =>
    Swal.fire({
      title,
      input: inputType,
      showCancelButton: true,
      confirmButtonText: "ตกลง",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: BRAND_COLOR,
      cancelButtonColor: "#6c757d",
      inputValidator: (value) => {
        if (!value) return "กรุณากรอกข้อมูล";
      },
      ...options,
    }),

  multipleInputs: (title, inputs = [], options = {}) => {
    const inputsHtml = inputs
      .map(
        (input, i) => `
        <div style="margin-bottom:14px;text-align:left;">
          <label style="display:block;margin-bottom:4px;font-weight:600;font-size:13px;">${
            input.label
          }</label>
          <input
            id="swal-input-${i}"
            type="${input.type || "text"}"
            placeholder="${input.placeholder || ""}"
            value="${(input.value || "").replace(/"/g, "&quot;")}"
            style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:13px;"
            ${input.required ? "data-required='true'" : ""}
          />
        </div>`
      )
      .join("");

    return Swal.fire({
      title,
      html: inputsHtml,
      showCancelButton: true,
      confirmButtonText: "ตกลง",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: BRAND_COLOR,
      cancelButtonColor: "#6c757d",
      preConfirm: () => {
        const results = {};
        for (let i = 0; i < inputs.length; i++) {
          const el = document.getElementById(`swal-input-${i}`);
          const meta = inputs[i];
          if (meta.required && !el.value) {
            Swal.showValidationMessage(`กรุณากรอก ${meta.label}`);
            return false;
          }
          results[meta.name] = el.value;
        }
        return results;
      },
      ...options,
    });
  },

  progress: (title, initialValue = 0, options = {}) =>
    Swal.fire({
      title,
      html: `
        <div style="margin:18px 0;">
          <div style="background:#f0f0f0;border-radius:10px;overflow:hidden;">
            <div id="progress-bar" style="width:${initialValue}%;height:20px;background:${BRAND_COLOR};transition:width .3s;"></div>
          </div>
          <div id="progress-text" style="margin-top:8px;font-size:13px;font-weight:500;">${initialValue}%</div>
        </div>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      ...options,
    }),

  updateProgress: (value) => {
    const v = Math.min(100, Math.max(0, value));
    const bar = document.getElementById("progress-bar");
    const txt = document.getElementById("progress-text");
    if (bar && txt) {
      bar.style.width = `${v}%`;
      txt.textContent = `${v}%`;
    }
  },

  custom: (options = {}) =>
    Swal.fire({
      confirmButtonColor: BRAND_COLOR,
      ...options,
    }),
};

export default alertService;
