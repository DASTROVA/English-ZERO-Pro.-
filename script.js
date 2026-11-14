
"use strict";

/* =====================================
   ENGLISH ZERO — MAIN APPLICATION
   DASTROVA STUDIO
===================================== */

const EnglishZero = {

  /* STORAGE */
  storage: {
    get(key, fallback = null) {
      try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
      } catch (error) {
        console.warn("Storage read error:", error);
        return fallback;
      }
    },

    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn("Storage write error:", error);
      }
    }
  },

  /* USER DATA */
  getUser() {
    return this.storage.get("ez_user", {
      name: "Student",
      xp: 0,
      level: "A1",
      completedLessons: [],
      completedTests: [],
      studyDays: [],
      streak: 0,
      lastStudyDate: null,
      achievements: []
    });
  },

  saveUser(user) {
    this.storage.set("ez_user", user);
    this.updateDashboard();
  },

  /* CEFR LEVELS */
  levels: [
    { name: "A1", min: 0 },
    { name: "A2", min: 150 },
    { name: "B1", min: 400 },
    { name: "B2", min: 800 },
    { name: "C1", min: 1400 },
    { name: "C2", min: 2200 }
  ],

  getLevel(xp) {
    let current = "A1";

    for (const level of this.levels) {
      if (xp >= level.min) {
        current = level.name;
      }
    }

    return current;
  },

  /* XP */
  addXP(amount = 10) {
    const user = this.getUser();

    user.xp += Math.max(0, Number(amount) || 0);
    user.level = this.getLevel(user.xp);

    this.saveUser(user);

    this.toast(`+${amount} XP! Ajoyib natija!`, "success");
  },

  /* LESSON COMPLETION */
  completeLesson(lessonId) {
    if (!lessonId) return false;

    const user = this.getUser();

    if (user.completedLessons.includes(lessonId)) {
      this.toast("Bu dars avval yakunlangan!", "info");
      return false;
    }

    user.completedLessons.push(lessonId);
    user.xp += 20;
    user.level = this.getLevel(user.xp);

    this.saveUser(user);
    this.recordStudyDay();

    this.toast("Dars muvaffaqiyatli yakunlandi! +20 XP", "success");

    return true;
  },

  /* TEST COMPLETION */
  completeTest(testId, score, total) {
    if (!testId) return;

    const user = this.getUser();

    const percentage = total > 0
      ? Math.round((score / total) * 100)
      : 0;

    user.completedTests = user.completedTests.filter(
      test => test.id !== testId
    );

    user.completedTests.push({
      id: testId,
      score,
      total,
      percentage,
      date: new Date().toISOString()
    });

    user.xp += Math.max(0, Math.round(percentage / 5));
    user.level = this.getLevel(user.xp);

    this.saveUser(user);
    this.recordStudyDay();

    return percentage;
  },

  /* STUDY DAYS */
  recordStudyDay() {
    const user = this.getUser();
    const today = new Date().toISOString().slice(0, 10);

    if (!user.studyDays.includes(today)) {
      user.studyDays.push(today);
    }

    if (user.lastStudyDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const yesterdayString = yesterday.toISOString().slice(0, 10);

      if (user.lastStudyDate === yesterdayString) {
        user.streak += 1;
      } else {
        user.streak = 1;
      }

      user.lastStudyDate = today;
    }

    this.saveUser(user);
  },

  /* DASHBOARD */
  updateDashboard() {
    const user = this.getUser();

    const lessonCount = document.getElementById("lessonCount");
    const xpCount = document.getElementById("xpCount");
    const userLevel = document.getElementById("userLevel");
    const streakCount = document.getElementById("streakCount");

    if (lessonCount) {
      lessonCount.textContent = user.completedLessons.length;
    }

    if (xpCount) {
      xpCount.textContent = user.xp;
    }

    if (userLevel) {
      userLevel.textContent = user.level;
    }

    if (streakCount) {
      streakCount.textContent = user.streak;
    }
  },

  /* MOBILE MENU */
  initMenu() {
    const toggle = document.getElementById("menuToggle");
    const menu = document.getElementById("mobileMenu");

    if (!toggle || !menu) return;

    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("active");

      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.textContent = isOpen ? "✕" : "☰";
    });

    menu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        menu.classList.remove("active");
        toggle.textContent = "☰";
        toggle.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("click", event => {
      if (
        menu.classList.contains("active") &&
        !menu.contains(event.target) &&
        !toggle.contains(event.target)
      ) {
        menu.classList.remove("active");
        toggle.textContent = "☰";
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  },

  /* TOAST NOTIFICATIONS */
  toast(message, type = "info") {
    let container = document.getElementById("ezToastContainer");

    if (!container) {
      container = document.createElement("div");
      container.id = "ezToastContainer";

      Object.assign(container.style, {
        position: "fixed",
        bottom: "22px",
        right: "18px",
        zIndex: "9999",
        display: "grid",
        gap: "10px",
        maxWidth: "calc(100% - 36px)"
      });

      document.body.appendChild(container);
    }

    const toast = document.createElement("div");

    const background = type === "success"
      ? "#153c35"
      : type === "error"
      ? "#47252e"
      : "#1c2b45";

    Object.assign(toast.style, {
      padding: "13px 18px",
      background,
      border: "1px solid rgba(255,255,255,.12)",
      borderRadius: "12px",
      color: "#fff",
      fontSize: "12px",
      fontWeight: "700",
      boxShadow: "0 10px 30px rgba(0,0,0,.3)",
      animation: "ezToastIn .25s ease"
    });

    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
      toast.style.transition = ".25s";

      setTimeout(() => toast.remove(), 250);
    }, 2800);
  },

  /* SPEECH */
  speak(text, language = "en-US") {
    if (!("speechSynthesis" in window)) {
      this.toast("Brauzeringiz ovozli o‘qishni qo‘llab-quvvatlamaydi.", "error");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.85;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  },

  /* INITIALIZATION */
  init() {
    this.initMenu();
    this.updateDashboard();

    console.log(
      "%cENGLISH ZERO",
      "font-size:22px;font-weight:900;color:#8b70ff"
    );

    console.log("Learning platform initialized.");
  }
};

/* =====================================
   GLOBAL HELPERS
===================================== */

window.EnglishZero = EnglishZero;

window.addXP = amount => EnglishZero.addXP(amount);

window.completeLesson = id => EnglishZero.completeLesson(id);

window.speakEnglish = text => EnglishZero.speak(text);

/* =====================================
   GLOBAL STYLES FOR NOTIFICATIONS
===================================== */

const toastStyle = document.createElement("style");

toastStyle.textContent = `
@keyframes ezToastIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

document.head.appendChild(toastStyle);

/* =====================================
   START APPLICATION
===================================== */

document.addEventListener("DOMContentLoaded", () => {
  EnglishZero.init();
});
