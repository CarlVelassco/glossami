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

    // Запускаем отслеживание присутствия (онлайн / последний вход)
    this.startPresenceTracker();

    // Первый запуск — отправляем милое приветствие в бот
    await this.sendWelcomeIfFirstTime();

    // Навигация по умолчанию
    this.switchTab("vibe");

    // Dev-панель (показываем в режиме разработки или по триггеру)
    if (this.isDevMode) {
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
      const found = CONFIG.ALLOWED_USERS.find((u) => String(u.id) === String(tgUser.id));
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
    const partnerRole = this.currentUser?.role === "him" ? "her" : "him";
    const partnerUser = CONFIG.ALLOWED_USERS.find((u) => u.role === partnerRole) || { name: "Половинка", avatar: "🌸" };

    document.getElementById("app-root").innerHTML = `
      <!-- Шапка приложения с онлайн-статусом половинки -->
      <header class="sticky top-0 z-30 bg-white/85 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-rose-100/60 dark:border-zinc-800 px-4 py-2.5 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-sm shadow-sm shadow-rose-500/20">
            ${this.currentUser.avatar}
          </div>
          <div>
            <h1 class="text-xs font-black text-zinc-900 dark:text-zinc-100 leading-none">${CONFIG.APP_TITLE}</h1>
            <p class="text-[10px] text-zinc-400 leading-none mt-0.5">${this.currentUser.name}</p>
          </div>
        </div>

        <!-- Плашка присутствия партнера -->
        <div id="partner-presence-pill" class="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-rose-50/80 dark:bg-zinc-850 border border-rose-200/60 dark:border-zinc-750 transition-all select-none shadow-sm">
          <span class="text-sm">${partnerUser.avatar}</span>
          <div class="text-left leading-tight">
            <span class="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 block truncate max-w-[90px]">${partnerUser.name}</span>
            <span id="partner-presence-status" class="text-[9px] text-zinc-400 font-medium block flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-pulse"></span> Проверяем...
            </span>
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
   * Первый запуск — отправляем милую приветственную записку в бот
   */
  async sendWelcomeIfFirstTime() {
    const key = `welcome_sent_${this.currentUser.role}`;
    const alreadySent = await window.storage.get(key, false);
    if (alreadySent) return;

    const isHer = this.currentUser.role === "her";
    const hisName = CONFIG.ALLOWED_USERS.find(u => u.role === "him")?.name || "Любимый";
    const herName = CONFIG.ALLOWED_USERS.find(u => u.role === "her")?.name || "Любимая";

    // Два разных текста: для него и для неё
    const msgHer = `
🌸 <b>Привет, моя ${herName}!</b>

Я сделал нам своё маленькое уютное место — только для двоих 💕

<b>Вот что здесь есть:</b>

🫙 <b>Баночки любви</b> — я наполняю твою баночку сердечками, а ты моё. Чем больше — тем теплее на душе 🥰

💌 <b>Наши сигналы</b> — кнопка внизу. Отправь мне поцелуй, обнимашку или «хочу на ручки» одним тапом, и я сразу почувствую ❤️

🐾 <b>Питомец</b> — у нас есть общий котик! Корми его, играй с ним и одевай 🐱

⏱ <b>Счётчик</b> — показывает сколько мы вместе. Каждая секунда с тобой — сокровище ✨

<b>Как открыть приложение:</b>
Нажми кнопку <b>💌 Написать</b> рядом с полем ввода внизу — и ты сразу попадёшь в наш уголок 🏠

<i>P.S. Этот чат — только для уведомлений. Я тут не читаю сообщения 🤫 Всё общение — через приложение!</i>

С любовью, твой ${hisName} 💖
`.trim();

    const msgHim = `
💙 <b>Привет, ${hisName}!</b>

Наш уголок настроен и готов к работе 🎉

<b>Что здесь будет появляться:</b>
• 💝 Уведомления о действиях ${herName}
• 🌅 Ежедневный итог с количеством сердечек
• 🏆 Новые рекорды и круглые даты
• 💚 Статус онлайн когда ${herName} открывает приложение

Нажми <b>💌 Написать</b> рядом с полем ввода чтобы открыть приложение 🏠
`.trim();

    const text = isHer ? msgHer : msgHim;

    try {
      const r = await fetch(`https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: this.currentUser.id,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true
        })
      });
      const data = await r.json();
      if (data.ok) {
        await window.storage.set(key, true);
        console.log("[App] Welcome message sent to", this.currentUser.name);
      }
    } catch (e) {
      console.warn("[App] Could not send welcome message:", e);
    }
  }

  /**
   * Трекер присутствия — сохраняет свой статус и читает статус партнёра
   */
  async startPresenceTracker() {
    const myRole = this.currentUser?.role;
    if (!myRole) return;

    const partnerRole = myRole === "him" ? "her" : "him";
    const partnerUser = CONFIG.ALLOWED_USERS.find(u => u.role === partnerRole) || { name: "Половинка" };

    // Гендерные формы для партнёра
    const wasLabel = myRole === "him" ? "Была" : "Был";
    const onlineLabel = myRole === "him" ? "Онлайн сейчас 🟢" : "Онлайн сейчас 🟢";

    // Сохранить собственное присутствие
    const saveMyPresence = async (isOnline = true) => {
      await window.storage.set(`presence_${myRole}`, {
        name: this.currentUser.name,
        timestamp: Date.now(),
        online: isOnline
      });
    };

    // Подключение к Firebase onDisconnect (если приложение просто закрыли или свернули)
    if (window.storage?.firebaseDb) {
      try {
        const myPresenceRef = window.storage.firebaseDb.ref(`shared/presence_${myRole}`);
        myPresenceRef.onDisconnect().set({
          name: this.currentUser.name,
          timestamp: Date.now(),
          online: false
        });
      } catch (e) {
        console.warn("[App] onDisconnect setup error:", e);
      }
    }

    // Прочитать присутствие партнёра и обновить UI
    let partnerWasOnline = false;
    const renderPresenceUI = (presence) => {
      const statusEl = document.getElementById("partner-presence-status");
      if (!statusEl) return;

      if (!presence) {
        statusEl.innerHTML = `<span class="inline-block w-1.5 h-1.5 rounded-full bg-zinc-300 mr-1"></span>Ещё не заходил${myRole === "him" ? "а" : ""}`;
        partnerWasOnline = false;
        return;
      }

      const diffMs = Date.now() - presence.timestamp;
      const diffMin = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      
      // Онлайн если флаг online === true И отметка обновлена менее 3 минут назад
      const isOnlineNow = presence.online === true && diffMs < 180000;

      // Если партнёр только что пришёл онлайн в реальном времени — показываем тост
      if (isOnlineNow && !partnerWasOnline) {
        window.showToast(`💚 ${partnerUser.name} сейчас в приложении!`, "love", 3500);
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        }
      } else if (!isOnlineNow && partnerWasOnline) {
        // Партнер только что вышел
        window.showToast(`👋 ${partnerUser.name} только что вышел(ла)`, "info", 2500);
      }
      partnerWasOnline = isOnlineNow;

      if (isOnlineNow) {
        statusEl.innerHTML = `<span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1"></span>Онлайн сейчас 🟢`;
        document.getElementById("partner-presence-pill")?.classList.add("ring-2", "ring-emerald-400/50");
      } else {
        document.getElementById("partner-presence-pill")?.classList.remove("ring-2", "ring-emerald-400/50");
        if (diffMin < 1) {
          statusEl.innerHTML = `<span class="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-1"></span>Вышел(ла) только что`;
        } else if (diffMin < 60) {
          statusEl.innerHTML = `<span class="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-1"></span>${wasLabel} ${diffMin} мин. назад`;
        } else if (diffHours < 24) {
          statusEl.innerHTML = `<span class="inline-block w-1.5 h-1.5 rounded-full bg-zinc-400 mr-1"></span>${wasLabel} ${diffHours} ч. назад`;
        } else {
          const date = new Date(presence.timestamp).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
          statusEl.innerHTML = `<span class="inline-block w-1.5 h-1.5 rounded-full bg-zinc-300 mr-1"></span>${wasLabel} ${date}`;
        }
      }
    };

    // Слушаем изменение статуса партнера В РЕАЛЬНОМ ВРЕМЕНИ через сокеты Firebase
    window.storage.subscribe(`presence_${partnerRole}`, (presence) => {
      renderPresenceUI(presence);
    });

    // Запускаем немедленно
    await saveMyPresence(true);
    const initialPresence = await window.storage.get(`presence_${partnerRole}`, null);
    renderPresenceUI(initialPresence);

    // Heartbeat: обновляем своё присутствие каждые 30 сек пока приложение открыто
    setInterval(() => saveMyPresence(true), 30000);

    // Периодически обновляем надпись («X мин назад») каждую минуту
    setInterval(async () => {
      const p = await window.storage.get(`presence_${partnerRole}`, null);
      renderPresenceUI(p);
    }, 60000);

    // При сворачивании / уходе в фон — мгновенно помечаем себя как offline
    document.addEventListener("visibilitychange", async () => {
      if (document.visibilityState === "hidden") {
        await saveMyPresence(false);
      } else {
        await saveMyPresence(true);
      }
    });

    window.addEventListener("pagehide", () => {
      saveMyPresence(false);
    });
    window.addEventListener("beforeunload", () => {
      saveMyPresence(false);
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

      <div class="border-t border-zinc-800 pt-2 mt-1 flex flex-col gap-1.5">
        <button id="dev-test-welcome" class="w-full py-1.5 px-2 bg-pink-600/30 hover:bg-pink-600/50 text-pink-200 border border-pink-500/30 rounded-xl text-[11px] font-semibold text-center transition-colors">
          💌 Отправить мне приветствие
        </button>
        <button id="dev-reset-welcome" class="w-full py-1.5 px-2 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/30 rounded-xl text-[11px] font-semibold text-center transition-colors">
          🔄 Сбросить флаг приветствия
        </button>
      </div>
    `;

    document.body.appendChild(panel);

    document.getElementById("close-dev-panel")?.addEventListener("click", () => panel.remove());

    // Кнопка принудительной отправки приветствия
    document.getElementById("dev-test-welcome")?.addEventListener("click", async () => {
      const key = `welcome_sent_${this.currentUser.role}`;
      await window.storage.set(key, false);
      await this.sendWelcomeIfFirstTime();
      window.showToast("Приветствие отправлено в бот! 💌", "love");
    });

    // Кнопка сброса флага (чтобы при следующем запуске отправилось как в первый раз)
    document.getElementById("dev-reset-welcome")?.addEventListener("click", async () => {
      const keyHim = "welcome_sent_him";
      const keyHer = "welcome_sent_her";
      await window.storage.set(keyHim, false);
      await window.storage.set(keyHer, false);
      window.showToast("Флаги сброшены! При перезагрузке сработает заново.", "info");
    });

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
 * Вспомогательная функция: показ аккуратного всплывающего тоста (максимум 1 компактная плашка)
 */
window.showToast = function (text, type = "success", duration = 2000) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  // Очищаем предыдущие тосты, чтобы на экране всегда была максимум ОДНА аккуратная плашка
  container.innerHTML = "";

  const colors = {
    success: "bg-emerald-600/90 backdrop-blur-md shadow-emerald-500/20",
    error: "bg-rose-600/90 backdrop-blur-md shadow-rose-500/20",
    info: "bg-zinc-800/90 backdrop-blur-md shadow-black/20",
    love: "bg-rose-500/95 backdrop-blur-md shadow-rose-500/25"
  };

  const icons = { success: "✅", error: "❌", info: "ℹ️", love: "💖" };

  const toast = document.createElement("div");
  toast.className = `pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full text-white text-xs font-bold shadow-lg ${colors[type] || colors.success} animate-slide-down border border-white/20 select-none`;
  toast.innerHTML = `<span class="text-sm">${icons[type] || "✅"}</span><span class="truncate max-w-[240px]">${text}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("opacity-0", "transition-opacity", "duration-200");
    setTimeout(() => toast.remove(), 200);
  }, duration);
};

// Инициализация при загрузке
window.addEventListener("DOMContentLoaded", async () => {
  const app = new App();
  window.app = app;
  await app.init();
});

