export const getCurrentThaiDate = () => {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
  );
};

export const formatThaiDateShort = (date) => {
  if (!date) return "";
  return new Intl.DateTimeFormat("th-TH", {
    year: "2-digit",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(new Date(date));
};

export const formatThaiDateLong = (date) => {
  if (!date) return "";
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(new Date(date));
};


export const formatThaiTime = (date, showSeconds = true) => {
  if (!date) return "";
  const options = {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
    hour12: false,
  };

  if (showSeconds) {
    options.second = "2-digit";
  }

  return new Intl.DateTimeFormat("th-TH", options).format(new Date(date));
};


export const formatThaiDateTime = (date, showSeconds = false) => {
  if (!date) return "";
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
    hour12: false,
  };

  if (showSeconds) {
    options.second = "2-digit";
  }

  return new Intl.DateTimeFormat("th-TH", options).format(new Date(date));
};


export const formatDateDDMMYYYY = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const thaiDate = new Date(
    d.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
  );

  const day = String(thaiDate.getDate()).padStart(2, "0");
  const month = String(thaiDate.getMonth() + 1).padStart(2, "0");
  const year = thaiDate.getFullYear();

  return `${day}/${month}/${year}`;
};


export const formatDateYYYYMMDD = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const thaiDate = new Date(
    d.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
  );

  const year = thaiDate.getFullYear();
  const month = String(thaiDate.getMonth() + 1).padStart(2, "0");
  const day = String(thaiDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


export const formatDateTimeYYYYMMDDHHmmss = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const thaiDate = new Date(
    d.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
  );

  const year = thaiDate.getFullYear();
  const month = String(thaiDate.getMonth() + 1).padStart(2, "0");
  const day = String(thaiDate.getDate()).padStart(2, "0");
  const hours = String(thaiDate.getHours()).padStart(2, "0");
  const minutes = String(thaiDate.getMinutes()).padStart(2, "0");
  const seconds = String(thaiDate.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};


export const formatTime12Hour = (date) => {
  if (!date) return "";
  return new Intl.DateTimeFormat("th-TH", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
    hour12: true,
  }).format(new Date(date));
};


export const getThaiDayName = (date, short = false) => {
  if (!date) return "";
  return new Intl.DateTimeFormat("th-TH", {
    weekday: short ? "short" : "long",
    timeZone: "Asia/Bangkok",
  }).format(new Date(date));
};


export const getThaiMonthName = (date, short = false) => {
  if (!date) return "";
  return new Intl.DateTimeFormat("th-TH", {
    month: short ? "short" : "long",
    timeZone: "Asia/Bangkok",
  }).format(new Date(date));
};


export const calculateAge = (birthDate) => {
  if (!birthDate) return 0;
  const today = getCurrentThaiDate();
  const birth = new Date(birthDate);
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1;
  }
  return age;
};

export const getDaysDifference = (date1, date2) => {
  if (!date1 || !date2) return 0;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};


export const isToday = (date) => {
  if (!date) return false;
  const today = getCurrentThaiDate();
  const checkDate = new Date(date);

  return (
    today.getFullYear() === checkDate.getFullYear() &&
    today.getMonth() === checkDate.getMonth() &&
    today.getDate() === checkDate.getDate()
  );
};


export const isYesterday = (date) => {
  if (!date) return false;
  const yesterday = new Date(getCurrentThaiDate());
  yesterday.setDate(yesterday.getDate() - 1);
  const checkDate = new Date(date);

  return (
    yesterday.getFullYear() === checkDate.getFullYear() &&
    yesterday.getMonth() === checkDate.getMonth() &&
    yesterday.getDate() === checkDate.getDate()
  );
};


export const formatRelativeDate = (date) => {
  if (!date) return "";

  if (isToday(date)) {
    return "วันนี้";
  }

  if (isYesterday(date)) {
    return "เมื่อวาน";
  }

  const tomorrow = new Date(getCurrentThaiDate());
  tomorrow.setDate(tomorrow.getDate() + 1);
  const checkDate = new Date(date);

  if (
    tomorrow.getFullYear() === checkDate.getFullYear() &&
    tomorrow.getMonth() === checkDate.getMonth() &&
    tomorrow.getDate() === checkDate.getDate()
  ) {
    return "พรุ่งนี้";
  }

  return formatThaiDateLong(date);
};

export const toDateTimeLocalValue = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const thaiDate = new Date(
    d.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
  );

  const year = thaiDate.getFullYear();
  const month = String(thaiDate.getMonth() + 1).padStart(2, "0");
  const day = String(thaiDate.getDate()).padStart(2, "0");
  const hours = String(thaiDate.getHours()).padStart(2, "0");
  const minutes = String(thaiDate.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};


export const toDateInputValue = (date) => {
  if (!date) return "";
  return formatDateYYYYMMDD(date);
};
