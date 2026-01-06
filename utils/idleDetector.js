/**
 * Idle Detector Utility
 * ตรวจจับว่าผู้ใช้ idle (ไม่ได้ใช้งาน) หรือไม่
 */

class IdleDetector {
  constructor(idleTimeout = 15 * 60 * 1000) { // Default: 15 minutes
    this.idleTimeout = idleTimeout;
    this.lastActivityTime = Date.now();
    this.isIdle = false;
    this.isPageHidden = false;
    this.listeners = [];

    this.init();
  }

  init() {
    // ตรวจจับ user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    activityEvents.forEach(event => {
      document.addEventListener(event, () => this.resetIdleTimer(), true);
    });

    // ตรวจจับการย่อ/ซ่อนหน้าต่าง
    document.addEventListener('visibilitychange', () => {
      this.isPageHidden = document.hidden;
      if (!document.hidden) {
        // เมื่อกลับมาที่หน้านี้ ให้ reset idle timer
        this.resetIdleTimer();
      }
    });

    // ตรวจจับ window blur/focus
    window.addEventListener('blur', () => {
      this.isPageHidden = true;
    });

    window.addEventListener('focus', () => {
      this.isPageHidden = false;
      this.resetIdleTimer();
    });

    // เริ่ม idle checker
    this.startIdleCheck();
  }

  resetIdleTimer() {
    this.lastActivityTime = Date.now();
    if (this.isIdle) {
      this.isIdle = false;
      this.notifyListeners('active');
    }
  }

  startIdleCheck() {
    setInterval(() => {
      const now = Date.now();
      const idleDuration = now - this.lastActivityTime;

      if (idleDuration >= this.idleTimeout && !this.isIdle) {
        this.isIdle = true;
        this.notifyListeners('idle');
      }
    }, 1000); // ตรวจสอบทุก 1 วินาที
  }

  // เพิ่ม listener สำหรับ idle state changes
  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  notifyListeners(state) {
    this.listeners.forEach(listener => listener(state));
  }

  // ตรวจสอบว่า user idle หรือไม่ (based on activity only, not page visibility)
  isUserIdle() {
    const now = Date.now();
    const idleDuration = now - this.lastActivityTime;
    // ไม่ใช้ isPageHidden เพราะการเปลี่ยนแท็บชั่วคราวไม่ควรถือว่า idle
    return idleDuration >= this.idleTimeout;
  }

  // ตรวจสอบว่าหน้าต่างถูกย่อหรือซ่อนอยู่หรือไม่
  isPageHiddenOrMinimized() {
    return this.isPageHidden || document.hidden;
  }

  // Get idle duration in milliseconds
  getIdleDuration() {
    return Date.now() - this.lastActivityTime;
  }

  // Get idle duration in minutes
  getIdleDurationInMinutes() {
    return Math.floor(this.getIdleDuration() / 60000);
  }
}

// Create singleton instance
const idleDetector = typeof window !== 'undefined' ? new IdleDetector() : null;

export default idleDetector;
