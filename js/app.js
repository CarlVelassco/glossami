/* ==========================================================================
   ГЛАВНЫЙ МОДУЛЬ ПРИЛОЖЕНИЯ (AUTH + НАВИГАЦИЯ + ИНИЦИАЛИЗАЦИЯ)
   ========================================================================== */

class App {
  constructor() {
    this.tg = window.Telegram?.WebApp;
    this.currentUser = null;
    this.activeTab = "vibe"; // 'vibe' | 'pet'
    this.isDevMode = window.CONFIG?.DEV_MODE === true;
  }

  /**
   * Точка входа — запуск приложения
   */
  async init() {
    // Сообщаем Telegram, что Mini App готово
    this.tg?.ready();
    this.tg?.expand();
    this.tg?.enableClosingConfirmation();

    // Применяем тему из Telegram (цветовая схема)
    this.applyTelegramTheme();

    // Авторизация
    const authorized = await this.authorize();

    if (!authorized) {
      this.showAccessDeniedScreen();
      return;
    }

    // Показываем главный каркас приложения
    this.renderMainApp();

    // Инициализируем хранилище и модули питомца и вайба
    await window.pet.init(document.getElementById("pet-container"));
    await window.vibe.init(document.getElementById("vibe-container"), this.currentUser);

    // Навигация по умолчанию
    this.switchTab("vibe");

    // Dev-панель (только в браузере вне Telegram)
    if (this.isDevMode && !this.tg?.initData) {
      this.renderDevPanel();
    }

    console.log(`[App] Initialized for user: ${this.currentUser.name} (ID: ${this.currentUser.id})`);
  }

  /**
   * Авторизация по Telegram ID
   */
  async authorize() {
    const tgUser = this.tg?.initDataUnsafe?.user;

    // В реальном Telegram — берём ID из initDataUnsafe
    if (tgUser?.id) {
      const found = CONFIG.ALLOWED_USERS.find((u) => u.id === tgUser.id);
      if (found) {
        this.currentUser = { ...found, telegramName: tgUser.first_name };
        return true;
      }
      return false;
    }

    // В режиме разработки (вне Telegram) — используем первого пользователя по умолчанию
    if (this.isDevMode) {
      this.currentUser = CONFIG.ALLOWED_USERS[0];
      console.warn("[App] DEV_MODE: авторизован как", this.currentUser.name);
      return true;
    }

    return false;
  }

  /**
   * Экран блокировки (доступ запрещен)
   */
  showAccessDeniedScreen() {
    const tgUser = this.tg?.initDataUnsafe?.user;
    const userId = tgUser?.id || "неизвестен";

    document.getElementById("app-root").innerHTML = `
      <div class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 text-white p-8 text-center">
        <div class="relative mb-6">
          <div class="text-7xl mb-2 select-none animate-pulse">🔒</div>
        </div>
        <h1 class="text-xl font-black mb-2 tracking-tight">Доступ закрыт</h1>
        <p class="text-zinc-400 text-sm max-w-xs mb-6 leading-relaxed">
          Это приватное место только для двоих. <br>
          Ваш Telegram ID <span class="text-zinc-200 font-mono font-bold">${userId}</span> не включён в список доступа.
        </p>
        <div class="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700 text-xs text-zinc-500 max-w-xs">
          Если вы считаете, что это ошибка — попросите владельца добавить ваш ID в файл <code class="text-zinc-300">js/config.js</code>
        </div>
      </div>
    `;
  }

  /**
   * Скелетон загрузки
   */
  renderSkeleton() {
    document.getElementById("app-root").innerHTML = `
      <div class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-rose-50 to-pink-50 dark:from-zinc-950 dark:to-zinc-900 p-8 text-center">
        <div class="text-5xl mb-4 animate-bounce">🌸</div>
        <div class="text-sm font-medium text-zinc-500 dark:text-zinc-400 animate-pulse">Открываем наш уголок...</div>
      </div>
    `;
  }

  /**
   * Отрисовка главной оболочки приложения
   */
  renderMainApp() {
    document.getElementById("app-root").innerHTML = `
      <!-- Шапка приложения -->
      <header class="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-rose-100/60 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-sm shadow-sm shadow-rose-500/20">
            ${this.currentUser.avatar}
          </div>
          <div>
            <h1 class="text-sm font-black text-zinc-900 dark:text-zinc-100 leading-none">${CONFIG.APP_TITLE}</h1>
            <p class="text-[11px] text-zinc-400 leading-none mt-0.5">${this.currentUser.name} • онлайн</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div class="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Только для двоих
          </div>
        </div>
      </header>

      <!-- Контент вкладок -->
      <main class="pb-24 overflow-y-auto">
        <!-- Вкладка: Наш Вайб -->
        <div id="tab-vibe" class="tab-content px-4 pt-5 hidden">
          <div id="vibe-container"></div>
        </div>

        <!-- Вкладка: Питомец -->
        <div id="tab-pet" class="tab-content px-4 pt-5 hidden">
          <div id="pet-container"></div>
        </div>
      </main>

      <!-- Нижняя навигация -->
      <nav class="fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-rose-100/60 dark:border-zinc-800 px-4 pb-safe pt-2">
        <div class="max-w-sm mx-auto flex items-center justify-around gap-2">
          <!-- Таб «Наш Вайб» -->
          <button id="tab-btn-vibe" class="tab-nav-btn flex-1 flex flex-col items-center justify-center py-2 rounded-2xl transition-all gap-0.5" data-tab="vibe">
            <div class="w-7 h-7 flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span class="text-[11px] font-semibold leading-none">Наш Вайб</span>
          </button>

          <!-- Центральная кнопка быстрых сигналов -->
          <button id="tab-btn-hug-quick" class="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-purple-500 shadow-lg shadow-pink-500/30 flex items-center justify-center text-2xl active:scale-95 transition-transform" title="Наши сигналы">
            <span class="text-2xl select-none">💌</span>
            <span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-pink-400 rounded-full animate-ping opacity-75"></span>
            <span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white dark:border-zinc-900"></span>
          </button>

          <!-- Таб «Питомец» -->
          <button id="tab-btn-pet" class="tab-nav-btn flex-1 flex flex-col items-center justify-center py-2 rounded-2xl transition-all gap-0.5" data-tab="pet">
            <div class="w-7 h-7 flex items-center justify-center">
              <span class="text-xl leading-none">🐾</span>
            </div>
            <span class="text-[11px] font-semibold leading-none">Питомец</span>
          </button>
        </div>
      </nav>

      <!-- Контейнер для тостов (всплывающие уведомления) -->
      <div id="toast-container" class="fixed top-16 left-0 right-0 z-50 flex flex-col items-center gap-2 pointer-events-none px-4"></div>
    `;

    // Привязка навигации
    this.bindNavigation();
  }

  /**
   * Привязка событий нижней навигации
   */
  bindNavigation() {
    document.querySelectorAll(".tab-nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-tab");
        this.switchTab(tab);
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.selectionChanged();
        }
      });
    });

    // Центральная кнопка снизу: открытие всплывающего окна сигналов
    document.getElementById("tab-btn-hug-quick")?.addEventListener("click", () => {
      window.vibe?.openActionsModal?.();
    });
  }

  /**
   * Переключение вкладок
   */
  switchTab(tabName) {
    this.activeTab = tabName;

    // Скрываем все вкладки
    document.querySelectorAll(".tab-content").forEach((el) => {
      el.classList.add("hidden");
    });

    // Показываем нужную
    const tabEl = document.getElementById(`tab-${tabName}`);
    if (tabEl) {
      tabEl.classList.remove("hidden");
      // Анимация появления
      tabEl.classList.add("animate-fade-in");
      setTimeout(() => tabEl.classList.remove("animate-fade-in"), 300);
    }

    // Обновляем стили кнопок навигации
    document.querySelectorAll(".tab-nav-btn").forEach((btn) => {
      const isActive = btn.getAttribute("data-tab") === tabName;
      btn.classList.toggle("text-rose-600", isActive);
      btn.classList.toggle("dark:text-rose-400", isActive);
      btn.classList.toggle("bg-rose-50/80", isActive);
      btn.classList.toggle("dark:bg-rose-950/40", isActive);
      btn.classList.toggle("text-zinc-400", !isActive);
      btn.classList.toggle("dark:text-zinc-500", !isActive);
    });
  }

  /**
   * Применение цветовой схемы Telegram (тёмная/светлая)
   */
  applyTelegramTheme() {
    const colorScheme = this.tg?.colorScheme || "light";
    if (colorScheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Слушаем смену темы внутри Telegram
    this.tg?.onEvent("themeChanged", () => {
      const scheme = this.tg?.colorScheme || "light";
      document.documentElement.classList.toggle("dark", scheme === "dark");
    });
  }

  /**
   * Dev-панель для тестирования вне Telegram
   */
  renderDevPanel() {
    const panel = document.createElement("div");
    panel.id = "dev-panel";
    panel.className = "fixed top-14 right-3 z-50 bg-zinc-900 border border-zinc-700 rounded-2xl p-3 shadow-xl text-xs text-white flex flex-col gap-2 w-48";
    panel.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <span class="font-bold text-zinc-300 flex items-center gap-1.5">
          <span>🛠️</span> DEV MODE
        </span>
        <button id="close-dev-panel" class="text-zinc-500 hover:text-white leading-none text-base">✕</button>
      </div>
      <p class="text-zinc-500 text-[10px]">Вы в браузере (вне Telegram). Переключайтесь между пользователями для тестирования:</p>
      ${CONFIG.ALLOWED_USERS.map(
        (u) => `
        <button class="dev-switch-user w-full px-2.5 py-2 rounded-xl text-left transition-colors ${
          this.currentUser?.id === u.id
            ? "bg-rose-500 text-white"
            : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
        }" data-user-id="${u.id}">
          <span class="mr-1.5">${u.avatar}</span> ${u.name}
          ${this.currentUser?.id === u.id ? ' <span class="text-[10px] opacity-80">← вы</span>' : ""}
        </button>
      `
      ).join("")}
    `;

    document.body.appendChild(panel);

    document.getElementById("close-dev-panel")?.addEventListener("click", () => panel.remove());

    panel.querySelectorAll(".dev-switch-user").forEach((btn) => {
      btn.addEventListener("click", () => {
        const uid = parseInt(btn.getAttribute("data-user-id"), 10);
        this.currentUser = CONFIG.ALLOWED_USERS.find((u) => u.id === uid);
        window.vibe.currentUser = this.currentUser;
        panel.remove();
        this.renderDevPanel();
        this.renderMainApp();
        this.switchTab(this.activeTab);
        window.pet.container = document.getElementById("pet-container");
        window.vibe.container = document.getElementById("vibe-container");
        window.pet.render();
        window.vibe.render();
        console.log(`[DEV] Переключился на: ${this.currentUser.name}`);
      });
    });
  }
}

/**
 * Вспомогательная функция: показ всплывающего тоста
 */
window.showToast = function (text, type = "success", duration = 2800) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const colors = {
    success: "bg-emerald-500 shadow-emerald-500/30",
    error: "bg-rose-500 shadow-rose-500/30",
    info: "bg-blue-500 shadow-blue-500/30",
    love: "bg-pink-500 shadow-pink-500/30"
  };

  const icons = { success: "✅", error: "❌", info: "ℹ️", love: "💖" };

  const toast = document.createElement("div");
  toast.className = `pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-white text-sm font-semibold shadow-lg ${colors[type] || colors.success} animate-slide-down`;
  toast.innerHTML = `<span>${icons[type] || "✅"}</span><span>${text}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("opacity-0", "transition-opacity", "duration-300");
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

// Инициализация при загрузке
window.addEventListener("DOMContentLoaded", async () => {
  const app = new App();
  window.app = app;
  await app.init();
});

