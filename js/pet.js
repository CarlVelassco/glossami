/* ==========================================================================
   МОДУЛЬ «НАШ ПИТОМЕЦ» (ТАМАГОЧИ ДЛЯ ДВОИХ)
   ========================================================================== */

class PetController {
  constructor() {
    this.data = { ...CONFIG.PET_DEFAULT };
    this.container = null;
    this.gameInterval = null;
    this.bubbleInterval = null;
  }

  async init(containerEl) {
    this.container = containerEl;
    await this.loadPetState();
    this.applyDecay();
    this.render();
    this.startAutoUpdate();
    this.subscribeRealtime();
  }

  /**
   * Синхронизация питомца в реальном времени
   */
  subscribeRealtime() {
    window.storage.subscribe("pet_state", (newPetData) => {
      if (!newPetData) return;
      this.data = { ...this.data, ...newPetData };
      this.updateStatsUI();
      // Если поменялся наряд или имя — обновляем рендер сцены
      this.updatePetAppearance();
    });
  }

  /**
   * Загрузка состояния из облака/хранилища
   */
  async loadPetState() {
    const saved = await window.storage.get("pet_state", null);
    if (saved) {
      this.data = { ...CONFIG.PET_DEFAULT, ...saved };
    }
  }

  /**
   * Сохранение состояния питомца
   */
  async savePetState() {
    this.data.lastUpdate = Date.now();
    await window.storage.set("pet_state", this.data);
    this.updateStatsUI();
  }

  /**
   * Расчет естественного убывания параметров со временем
   */
  applyDecay() {
    const now = Date.now();
    const last = this.data.lastUpdate || now;
    const hoursPassed = Math.max(0, (now - last) / (1000 * 60 * 60));

    if (hoursPassed > 0.05) { // если прошло больше 3 минут
      this.data.satiety = Math.max(5, Math.round(this.data.satiety - hoursPassed * CONFIG.PET_DECAY.satietyPerHour));
      this.data.happiness = Math.max(5, Math.round(this.data.happiness - hoursPassed * CONFIG.PET_DECAY.happinessPerHour));
      this.data.cleanliness = Math.max(5, Math.round(this.data.cleanliness - hoursPassed * CONFIG.PET_DECAY.cleanlinessPerHour));
      this.data.lastUpdate = now;
      this.savePetState();
    }
  }

  /**
   * Периодическое обновление
   */
  startAutoUpdate() {
    setInterval(() => {
      this.applyDecay();
      this.updateStatsUI();
    }, 60000); // каждую минуту
  }

  /**
   * Отрисовка HTML питомца
   */
  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="relative flex flex-col items-center">
        <!-- Верхняя плашка с именем питомца и кнопкой смены -->
        <div class="w-full max-w-sm flex items-center justify-between mb-2.5 px-1">
          <button id="btn-edit-pet-name" class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-white/90 dark:bg-zinc-850/90 backdrop-blur-md border border-rose-100 dark:border-zinc-750 shadow-sm active:scale-95 transition-transform hover:border-rose-300">
            <span class="text-sm">🐾</span>
            <span id="pet-display-name" class="text-xs font-black text-zinc-900 dark:text-zinc-100">${this.data.name}</span>
            <i data-lucide="edit-3" class="w-3 h-3 text-rose-500"></i>
          </button>
          <span class="text-[11px] text-zinc-400 font-medium">Наш общий комочек ❤️</span>
        </div>

        <!-- Фон сцены питомца (с динамической сменой при прогулке) -->
        <div id="pet-scene" class="relative w-full max-w-sm h-72 rounded-3xl overflow-hidden transition-all duration-700 shadow-xl border border-rose-100 dark:border-zinc-800 ${
          this.data.isWalking
            ? "bg-gradient-to-b from-sky-300 via-emerald-100 to-emerald-200 dark:from-slate-800 dark:via-emerald-950 dark:to-teal-950"
            : "bg-gradient-to-b from-rose-50 via-pink-50/60 to-purple-50 dark:from-zinc-900 dark:via-zinc-900/80 dark:to-zinc-800"
        } flex items-center justify-center">

          <!-- Декоративные элементы фона (облака / цветы / звезды) -->
          <div id="pet-scene-decor" class="absolute inset-0 pointer-events-none overflow-hidden">
            ${this.getSceneDecorHTML()}
          </div>

          <!-- Статус питомца плашка -->
          <div id="pet-status-pill" class="absolute top-3 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md shadow-sm border border-rose-200/50 dark:border-zinc-700 flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-200">
            <span class="w-2 h-2 rounded-full ${this.getMoodIndicatorColor()} animate-pulse"></span>
            <span id="pet-status-text">${this.getStatusText()}</span>
          </div>

          <!-- Интерактивный персонаж питомца -->
          <div id="pet-character-wrapper" class="relative cursor-pointer select-none transition-transform active:scale-95 duration-200">
            ${this.renderPetSVG()}
          </div>

          <!-- Контейнер для всплывающих сердечек и эффектов при клике -->
          <div id="pet-fx-container" class="absolute inset-0 pointer-events-none overflow-hidden"></div>
        </div>

        <!-- Шкалы потребностей питомца -->
        <div class="w-full max-w-sm mt-5 space-y-3 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl p-4 rounded-2xl border border-rose-100 dark:border-zinc-800 shadow-sm">
          <!-- Сытость -->
          <div>
            <div class="flex justify-between items-center text-xs font-semibold mb-1">
              <span class="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <i data-lucide="utensils" class="w-3.5 h-3.5"></i> Сытость
              </span>
              <span id="stat-satiety-text" class="text-zinc-600 dark:text-zinc-300">${this.data.satiety}%</span>
            </div>
            <div class="w-full h-2.5 bg-amber-100 dark:bg-amber-950/40 rounded-full overflow-hidden">
              <div id="stat-satiety-bar" class="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500" style="width: ${this.data.satiety}%"></div>
            </div>
          </div>

          <!-- Счастье -->
          <div>
            <div class="flex justify-between items-center text-xs font-semibold mb-1">
              <span class="flex items-center gap-1.5 text-pink-600 dark:text-pink-400">
                <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Счастье
              </span>
              <span id="stat-happiness-text" class="text-zinc-600 dark:text-zinc-300">${this.data.happiness}%</span>
            </div>
            <div class="w-full h-2.5 bg-pink-100 dark:bg-pink-950/40 rounded-full overflow-hidden">
              <div id="stat-happiness-bar" class="h-full bg-gradient-to-r from-pink-400 to-rose-400 rounded-full transition-all duration-500" style="width: ${this.data.happiness}%"></div>
            </div>
          </div>

          <!-- Чистота -->
          <div>
            <div class="flex justify-between items-center text-xs font-semibold mb-1">
              <span class="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
                <i data-lucide="droplet" class="w-3.5 h-3.5"></i> Чистота
              </span>
              <span id="stat-cleanliness-text" class="text-zinc-600 dark:text-zinc-300">${this.data.cleanliness}%</span>
            </div>
            <div class="w-full h-2.5 bg-cyan-100 dark:bg-cyan-950/40 rounded-full overflow-hidden">
              <div id="stat-cleanliness-bar" class="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full transition-all duration-500" style="width: ${this.data.cleanliness}%"></div>
            </div>
          </div>
        </div>

        <!-- Кнопки действий -->
        <div class="w-full max-w-sm grid grid-cols-5 gap-2 mt-4">
          <!-- Покормить -->
          <button id="btn-pet-feed" class="action-btn flex flex-col items-center justify-center py-2.5 px-1 bg-white dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-2xl shadow-sm border border-amber-200/60 dark:border-amber-900/40 transition-all active:scale-95">
            <span class="text-2xl mb-0.5">🍖</span>
            <span class="text-[11px] font-medium text-zinc-700 dark:text-zinc-200">Кормить</span>
          </button>

          <!-- Поиграть -->
          <button id="btn-pet-play" class="action-btn flex flex-col items-center justify-center py-2.5 px-1 bg-white dark:bg-zinc-800 hover:bg-pink-50 dark:hover:bg-pink-950/30 rounded-2xl shadow-sm border border-pink-200/60 dark:border-pink-900/40 transition-all active:scale-95">
            <span class="text-2xl mb-0.5">🎾</span>
            <span class="text-[11px] font-medium text-zinc-700 dark:text-zinc-200">Играть</span>
          </button>

          <!-- Искупать -->
          <button id="btn-pet-bath" class="action-btn flex flex-col items-center justify-center py-2.5 px-1 bg-white dark:bg-zinc-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 rounded-2xl shadow-sm border border-cyan-200/60 dark:border-cyan-900/40 transition-all active:scale-95">
            <span class="text-2xl mb-0.5">🛁</span>
            <span class="text-[11px] font-medium text-zinc-700 dark:text-zinc-200">Купать</span>
          </button>

          <!-- Гардероб -->
          <button id="btn-pet-wardrobe" class="action-btn flex flex-col items-center justify-center py-2.5 px-1 bg-white dark:bg-zinc-800 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-2xl shadow-sm border border-purple-200/60 dark:border-purple-900/40 transition-all active:scale-95">
            <span class="text-2xl mb-0.5">👒</span>
            <span class="text-[11px] font-medium text-zinc-700 dark:text-zinc-200">Наряд</span>
          </button>

          <!-- Погулять -->
          <button id="btn-pet-walk" class="action-btn flex flex-col items-center justify-center py-2.5 px-1 bg-white dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-2xl shadow-sm border border-emerald-200/60 dark:border-emerald-900/40 transition-all active:scale-95">
            <span class="text-2xl mb-0.5">${this.data.isWalking ? "🏡" : "🌳"}</span>
            <span class="text-[11px] font-medium text-zinc-700 dark:text-zinc-200">${this.data.isWalking ? "Домой" : "Гулять"}</span>
          </button>
        </div>

        <!-- Подсказка / История действий -->
        <p class="text-center text-xs text-zinc-400 mt-3 flex items-center justify-center gap-1">
          <span>💖 Нажмите на питомца, чтобы погладить</span>
        </p>
      </div>
    `;

    // Инициализация иконок
    if (window.lucide) window.lucide.createIcons();

    // Привязка обработчиков
    this.bindEvents();
  }

  /**
   * SVG отрисовка персонажа со слоями аксессуаров и мимикой
   */
  renderPetSVG() {
    const isSad = this.data.happiness < 30 || this.data.satiety < 30;
    const isSuperHappy = this.data.happiness >= 80;
    const outfit = this.data.outfit || "none";

    return `
      <div class="pet-body-breathe relative w-44 h-44 flex items-center justify-center">
        <svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-lg select-none">
          <defs>
            <radialGradient id="bodyGrad" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stop-color="#fff1f2" />
              <stop offset="60%" stop-color="#fecdd3" />
              <stop offset="100%" stop-color="#fda4af" />
            </radialGradient>
            <radialGradient id="earGrad" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stop-color="#ffe4e6" />
              <stop offset="100%" stop-color="#fb7185" />
            </radialGradient>
            <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.12"/>
            </filter>
          </defs>

          <!-- Тень под питомцем -->
          <ellipse cx="100" cy="180" rx="60" ry="12" fill="#000" opacity="0.1" class="animate-pulse" />

          <!-- Ушки -->
          <g class="pet-ears">
            <!-- Левое ушко -->
            <path d="M 52,70 C 35,25 65,10 82,50 Z" fill="url(#bodyGrad)" stroke="#fb7185" stroke-width="2" />
            <path d="M 56,65 C 45,35 65,25 76,52 Z" fill="url(#earGrad)" />

            <!-- Правое ушко -->
            <path d="M 148,70 C 165,25 135,10 118,50 Z" fill="url(#bodyGrad)" stroke="#fb7185" stroke-width="2" />
            <path d="M 144,65 C 155,35 135,25 124,52 Z" fill="url(#earGrad)" />
          </g>

          <!-- Тело питомца (круглый пушистый комочек) -->
          <circle cx="100" cy="112" r="68" fill="url(#bodyGrad)" stroke="#fb7185" stroke-width="2.5" />

          <!-- Пузико -->
          <ellipse cx="100" cy="128" rx="42" ry="34" fill="#ffffff" opacity="0.75" />

          <!-- Лапки нижние -->
          <ellipse cx="68" cy="168" rx="14" ry="10" fill="#fda4af" stroke="#fb7185" stroke-width="1.5" />
          <ellipse cx="132" cy="168" rx="14" ry="10" fill="#fda4af" stroke="#fb7185" stroke-width="1.5" />

          <!-- Глазки -->
          <g id="pet-eyes" class="${isSad ? 'opacity-90' : ''}">
            ${
              isSad
                ? `<!-- Грустные глазки -->
                   <ellipse cx="78" cy="104" rx="6" ry="6" fill="#3f3f46" />
                   <ellipse cx="122" cy="104" rx="6" ry="6" fill="#3f3f46" />
                   <!-- Слезинка -->
                   <path d="M 124,114 Q 128,122 124,124 Q 120,122 124,114" fill="#38bdf8" />
                  `
                : isSuperHappy
                ? `<!-- Радостные прищуренные глазки-дуги -->
                   <path d="M 70,105 Q 78,94 86,105" fill="none" stroke="#27272a" stroke-width="3.5" stroke-linecap="round" />
                   <path d="M 114,105 Q 122,94 130,105" fill="none" stroke="#27272a" stroke-width="3.5" stroke-linecap="round" />
                  `
                : `<!-- Обычные кавайные глазки с бликами -->
                   <g class="pet-blink">
                     <circle cx="78" cy="102" r="7" fill="#18181b" />
                     <circle cx="76" cy="99" r="2.5" fill="#ffffff" />
                     <circle cx="80" cy="104" r="1.2" fill="#ffffff" />

                     <circle cx="122" cy="102" r="7" fill="#18181b" />
                     <circle cx="120" cy="99" r="2.5" fill="#ffffff" />
                     <circle cx="124" cy="104" r="1.2" fill="#ffffff" />
                   </g>
                  `
            }
          </g>

          <!-- Румянец на щечках -->
          <ellipse cx="64" cy="115" rx="8" ry="5" fill="#f43f5e" opacity="${isSuperHappy ? '0.7' : '0.4'}" />
          <ellipse cx="136" cy="115" rx="8" ry="5" fill="#f43f5e" opacity="${isSuperHappy ? '0.7' : '0.4'}" />

          <!-- Носик -->
          <polygon points="97,112 103,112 100,116" fill="#e11d48" />

          <!-- Ротик -->
          ${
            isSad
              ? `<path d="M 94,125 Q 100,120 106,125" fill="none" stroke="#3f3f46" stroke-width="2.2" stroke-linecap="round" />`
              : isSuperHappy
              ? `<path d="M 92,118 Q 100,132 108,118 Z" fill="#e11d48" stroke="#be123c" stroke-width="1.5" />`
              : `<path d="M 94,117 Q 97,122 100,118 Q 103,122 106,117" fill="none" stroke="#3f3f46" stroke-width="2" stroke-linecap="round" />`
          }

          <!-- Передние лапки-ладошки -->
          <ellipse cx="78" cy="142" rx="10" ry="8" fill="#fff1f2" stroke="#fb7185" stroke-width="1.5" />
          <ellipse cx="122" cy="142" rx="10" ry="8" fill="#fff1f2" stroke="#fb7185" stroke-width="1.5" />

          <!-- ================= АКСЕССУАРЫ ГАРДЕРОБА ================= -->
          ${this.renderOutfitSVG(outfit)}
        </svg>
      </div>
    `;
  }

  /**
   * Отрисовка надетых вещей поверх питомца
   */
  renderOutfitSVG(outfit) {
    switch (outfit) {
      case "hat":
        return `
          <!-- Тёплая зимняя шапочка с помпоном -->
          <g id="outfit-hat">
            <path d="M 62,56 C 65,15 135,15 138,56 Z" fill="#0284c7" stroke="#0369a1" stroke-width="2" />
            <!-- Отворот шапки -->
            <rect x="58" y="52" width="84" height="14" rx="7" fill="#f0f9ff" stroke="#bae6fd" stroke-width="1.5" />
            <!-- Помпон -->
            <circle cx="100" cy="15" r="14" fill="#ffffff" stroke="#bae6fd" stroke-width="1.5" />
          </g>
        `;

      case "scarf":
        return `
          <!-- Уютный шарфик -->
          <g id="outfit-scarf">
            <path d="M 68,142 C 85,152 115,152 132,142 C 138,154 125,160 100,160 C 75,160 62,154 68,142 Z" fill="#f43f5e" stroke="#be123c" stroke-width="1.5" />
            <rect x="110" y="148" width="16" height="30" rx="4" fill="#e11d48" transform="rotate(12 110 148)" />
            <!-- Полосочки на шарфе -->
            <line x1="78" y1="147" x2="84" y2="157" stroke="#ffffff" stroke-width="2" />
            <line x1="97" y1="149" x2="103" y2="159" stroke="#ffffff" stroke-width="2" />
          </g>
        `;

      case "glasses":
        return `
          <!-- Стильные очки-сердечки -->
          <g id="outfit-glasses">
            <!-- Мостик очков -->
            <line x1="92" y1="102" x2="108" y2="102" stroke="#be185d" stroke-width="3" stroke-linecap="round" />
            <!-- Левое сердечко -->
            <path d="M 78,92 C 72,86 62,90 62,99 C 62,109 78,118 78,118 C 78,118 94,109 94,99 C 94,90 84,86 78,92 Z"
                  fill="#f43f5e" fill-opacity="0.35" stroke="#be185d" stroke-width="2.5" />
            <!-- Правое сердечко -->
            <path d="M 122,92 C 116,86 106,90 106,99 C 106,109 122,118 122,118 C 122,118 138,109 138,99 C 138,90 128,86 122,92 Z"
                  fill="#f43f5e" fill-opacity="0.35" stroke="#be185d" stroke-width="2.5" />
          </g>
        `;

      case "bow":
        return `
          <!-- Розовый бантик на ушке -->
          <g id="outfit-bow">
            <path d="M 132,45 C 145,35 155,50 142,56 Z" fill="#ec4899" stroke="#be185d" stroke-width="1.5" />
            <path d="M 132,45 C 120,35 110,50 122,56 Z" fill="#ec4899" stroke="#be185d" stroke-width="1.5" />
            <circle cx="132" cy="48" r="5" fill="#f472b6" stroke="#db2777" stroke-width="1" />
          </g>
        `;

      case "crown":
        return `
          <!-- Золотая корона -->
          <g id="outfit-crown">
            <polygon points="78,50 82,30 92,42 100,24 108,42 118,30 122,50" fill="#fbbf24" stroke="#d97706" stroke-width="2" />
            <circle cx="82" cy="28" r="2.5" fill="#ef4444" />
            <circle cx="100" cy="22" r="3" fill="#3b82f6" />
            <circle cx="118" cy="28" r="2.5" fill="#10b981" />
            <rect x="76" y="48" width="48" height="6" rx="2" fill="#f59e0b" />
          </g>
        `;

      default:
        return "";
    }
  }

  /**
   * Декоративные элементы фона сцены
   */
  getSceneDecorHTML() {
    if (this.data.isWalking) {
      return `
        <div class="absolute top-4 left-6 text-2xl animate-float">☁️</div>
        <div class="absolute top-8 right-8 text-xl animate-float-delay">⛅</div>
        <div class="absolute bottom-2 left-4 text-2xl">🌷</div>
        <div class="absolute bottom-2 left-1/4 text-2xl">🌳</div>
        <div class="absolute bottom-2 right-1/4 text-xl">🌼</div>
        <div class="absolute bottom-2 right-6 text-2xl">🌲</div>
      `;
    }
    return `
      <div class="absolute top-4 left-8 text-pink-300 dark:text-pink-600/40 opacity-70 text-sm animate-pulse">✨</div>
      <div class="absolute top-12 right-10 text-pink-400 dark:text-pink-600/40 opacity-60 text-lg animate-bounce">💖</div>
      <div class="absolute bottom-4 left-10 text-pink-200 dark:text-pink-700/30 text-xs">⭐</div>
      <div class="absolute bottom-6 right-12 text-pink-200 dark:text-pink-700/30 text-xs">✨</div>
    `;
  }

  getStatusText() {
    if (this.data.isWalking) return `${this.data.name} гуляет на свежем воздухе 🌳`;
    if (this.data.satiety < 30) return `${this.data.name} очень проголодался... 🥺`;
    if (this.data.cleanliness < 30) return `${this.data.name} испачкался, пора купаться! 🧼`;
    if (this.data.happiness < 30) return `${this.data.name} грустит без внимания 💔`;
    if (this.data.happiness >= 80 && this.data.satiety >= 80) return `${this.data.name} мурлычет от счастья! 🥰`;
    return `${this.data.name} счастлив рядом с вами ✨`;
  }

  getMoodIndicatorColor() {
    if (this.data.satiety < 30 || this.data.happiness < 30) return "bg-rose-500";
    if (this.data.cleanliness < 40) return "bg-amber-400";
    return "bg-emerald-400";
  }

  updateStatsUI() {
    const sBar = document.getElementById("stat-satiety-bar");
    const sText = document.getElementById("stat-satiety-text");
    const hBar = document.getElementById("stat-happiness-bar");
    const hText = document.getElementById("stat-happiness-text");
    const cBar = document.getElementById("stat-cleanliness-bar");
    const cText = document.getElementById("stat-cleanliness-text");
    const statusText = document.getElementById("pet-status-text");

    if (sBar && sText) {
      sBar.style.width = `${this.data.satiety}%`;
      sText.textContent = `${this.data.satiety}%`;
    }
    if (hBar && hText) {
      hBar.style.width = `${this.data.happiness}%`;
      hText.textContent = `${this.data.happiness}%`;
    }
    if (cBar && cText) {
      cBar.style.width = `${this.data.cleanliness}%`;
      cText.textContent = `${this.data.cleanliness}%`;
    }
    if (statusText) {
      statusText.textContent = this.getStatusText();
    }
  }

  /**
   * Привязка событий
   */
  bindEvents() {
    // Тап по питомцу (погладить)
    const petChar = document.getElementById("pet-character-wrapper");
    if (petChar) {
      petChar.addEventListener("click", (e) => this.handlePetTouch(e));
    }

    // Кормёжка
    document.getElementById("btn-pet-feed")?.addEventListener("click", () => this.openFeedModal());

    // Играть
    document.getElementById("btn-pet-play")?.addEventListener("click", () => this.startPlayMiniGame());

    // Купать
    document.getElementById("btn-pet-bath")?.addEventListener("click", () => this.startBathing());

    // Гардероб
    document.getElementById("btn-pet-wardrobe")?.addEventListener("click", () => this.openWardrobeModal());

    // Прогулка
    document.getElementById("btn-pet-walk")?.addEventListener("click", () => this.toggleWalk());

    // Смена имени питомца
    document.getElementById("btn-edit-pet-name")?.addEventListener("click", () => this.openEditNameModal());
  }

  /**
   * Погладить питомца
   */
  handlePetTouch(e) {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
    }

    this.data.happiness = Math.min(100, this.data.happiness + 2);
    this.savePetState();

    // Анимация подпрыгивания
    const petChar = document.getElementById("pet-character-wrapper");
    if (petChar) {
      petChar.classList.add("pet-jump");
      setTimeout(() => petChar.classList.remove("pet-jump"), 500);
    }

    // Сердечко на месте клика
    const rect = petChar.getBoundingClientRect();
    const x = e ? e.clientX - rect.left : 80;
    const y = e ? e.clientY - rect.top : 80;
    this.spawnFloatingHeart(x, y);
  }

  spawnFloatingHeart(x, y) {
    const fxContainer = document.getElementById("pet-fx-container");
    if (!fxContainer) return;

    const heart = document.createElement("div");
    heart.className = "floating-heart text-2xl select-none";
    heart.textContent = ["💖", "💕", "✨", "🌸", "🥰"][Math.floor(Math.random() * 5)];
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;

    fxContainer.appendChild(heart);
    setTimeout(() => heart.remove(), 1200);
  }

  /**
   * Модальное окно изменения имени питомца
   */
  openEditNameModal() {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }

    const suggestions = ["Булочка 🍞", "Персик 🍑", "Зефир ☁️", "Кренделёк 🥨", "Моти 🍡", "Шустрик ⚡", "Пончик 🍩", "Лучик ✨"];

    const modalHTML = `
      <div id="modal-pet-name" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in select-none">
        <div class="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-rose-100 dark:border-zinc-800 animate-slide-up">
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>✏️</span>
              <span>Имя нашего питомца</span>
            </h3>
            <button id="close-pet-name-btn" class="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <p class="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
            Придумайте кличку, которая будет отображаться у вас обоих:
          </p>

          <input id="pet-name-input" type="text" maxlength="20" class="w-full p-3 rounded-2xl bg-rose-50/50 dark:bg-zinc-800 border border-rose-200 dark:border-zinc-700 text-sm font-bold text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-400" value="${this.data.name}" placeholder="Введите имя..." />

          <!-- Быстрые милые варианты -->
          <div class="mt-3">
            <p class="text-[11px] font-semibold text-zinc-400 mb-1.5">Милые идеи:</p>
            <div class="flex flex-wrap gap-1.5">
              ${suggestions
                .map(
                  (s) => `
                <button class="name-suggestion-btn text-[11px] font-semibold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-zinc-800 text-rose-600 dark:text-rose-300 border border-rose-100 dark:border-zinc-700 hover:bg-rose-100 active:scale-95 transition-all" data-name="${s.split(" ")[0]}">
                  ${s}
                </button>
              `
                )
                .join("")}
            </div>
          </div>

          <div class="flex gap-2 mt-5">
            <button id="cancel-pet-name-btn" class="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-semibold">Отмена</button>
            <button id="save-pet-name-btn" class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold shadow-md shadow-rose-500/25 active:scale-95 transition-transform">Сохранить ❤️</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    if (window.lucide) window.lucide.createIcons();

    const modal = document.getElementById("modal-pet-name");
    const input = document.getElementById("pet-name-input");
    const closeModal = () => modal?.remove();

    document.getElementById("close-pet-name-btn")?.addEventListener("click", closeModal);
    document.getElementById("cancel-pet-name-btn")?.addEventListener("click", closeModal);
    modal?.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    // Клик по идеям подставляет имя
    modal.querySelectorAll(".name-suggestion-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = btn.getAttribute("data-name");
        if (input && name) {
          input.value = name;
          input.focus();
        }
      });
    });

    // Сохранение
    document.getElementById("save-pet-name-btn")?.addEventListener("click", () => {
      const newName = input?.value?.trim();
      if (newName) {
        this.data.name = newName;
        this.savePetState();
        this.render();

        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        }
        if (window.showToast) {
          window.showToast(`Питомец теперь откликается на имя ${newName}! 🥰`, "love");
        }
      }
      closeModal();
    });
  }

  /**
   * Модалка выбора еды
   */
  openFeedModal() {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }

    const modalHTML = `
      <div id="modal-backdrop" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
        <div class="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-rose-100 dark:border-zinc-800 animate-slide-up">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-base font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              <span>🍗 Чем угостим ${this.data.name}?</span>
            </h3>
            <button id="close-modal-btn" class="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="grid grid-cols-1 gap-2.5 max-h-72 overflow-y-auto pr-1">
            ${CONFIG.PET_FOODS.map(
              (food) => `
              <button class="food-option flex items-center justify-between p-3 rounded-2xl bg-rose-50/50 dark:bg-zinc-800/60 hover:bg-rose-100/60 dark:hover:bg-zinc-800 border border-rose-100 dark:border-zinc-700/60 transition-all active:scale-98" data-food-id="${food.id}">
                <div class="flex items-center gap-3">
                  <span class="text-3xl">${food.icon}</span>
                  <div class="text-left">
                    <p class="text-sm font-semibold text-zinc-800 dark:text-zinc-100">${food.name}</p>
                    <p class="text-[11px] text-zinc-500 dark:text-zinc-400">+${food.satiety}% сытости, +${food.happy}% счастья</p>
                  </div>
                </div>
                <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300">Дать</span>
              </button>
            `
            ).join("")}
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    if (window.lucide) window.lucide.createIcons();

    const backdrop = document.getElementById("modal-backdrop");
    const closeBtn = document.getElementById("close-modal-btn");

    const closeModal = () => backdrop?.remove();
    closeBtn?.addEventListener("click", closeModal);
    backdrop?.addEventListener("click", (e) => {
      if (e.target === backdrop) closeModal();
    });

    backdrop.querySelectorAll(".food-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        const foodId = btn.getAttribute("data-food-id");
        const food = CONFIG.PET_FOODS.find((f) => f.id === foodId);
        if (food) {
          this.feed(food);
          closeModal();
        }
      });
    });
  }

  /**
   * Кормление выбранной едой
   */
  feed(food) {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    }

    this.data.satiety = Math.min(100, this.data.satiety + food.satiety);
    this.data.happiness = Math.min(100, this.data.happiness + food.happy);
    this.savePetState();

    // Анимация еды летящей к питомцу
    const fxContainer = document.getElementById("pet-fx-container");
    if (fxContainer) {
      const foodFly = document.createElement("div");
      foodFly.className = "flying-food text-4xl select-none";
      foodFly.textContent = food.icon;
      fxContainer.appendChild(foodFly);

      setTimeout(() => {
        foodFly.remove();
        // Взрыв сердечек
        if (window.confetti) {
          window.confetti({
            particleCount: 25,
            spread: 50,
            origin: { y: 0.4 },
            colors: ["#fda4af", "#f43f5e", "#fb7185"]
          });
        }
      }, 700);
    }

    this.render();
  }

  /**
   * Мини-игра: Ловля сердечек
   */
  startPlayMiniGame() {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred("medium");
    }

    let score = 0;
    let timeLeft = 12;

    const gameOverlay = document.createElement("div");
    gameOverlay.id = "mini-game-overlay";
    gameOverlay.className = "fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex flex-col items-center justify-between p-6 select-none animate-fade-in";
    gameOverlay.innerHTML = `
      <div class="w-full flex justify-between items-center text-white">
        <div class="flex items-center gap-2">
          <span class="text-xl">🎾</span>
          <span class="font-bold text-sm">Поймай как можно больше!</span>
        </div>
        <div class="flex items-center gap-3">
          <span id="game-timer" class="px-3 py-1 bg-white/20 rounded-full font-mono font-bold text-sm">⏱️ ${timeLeft}s</span>
          <span id="game-score" class="px-3 py-1 bg-pink-500 rounded-full font-bold text-sm">Счет: 0</span>
        </div>
      </div>

      <!-- Игровое поле -->
      <div id="game-playfield" class="relative w-full max-w-sm flex-1 my-4 overflow-hidden rounded-2xl bg-white/5 border border-white/10"></div>

      <button id="exit-game-btn" class="px-6 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold">
        Завершить игру
      </button>
    `;

    document.body.appendChild(gameOverlay);
    const playfield = document.getElementById("game-playfield");
    const scoreEl = document.getElementById("game-score");
    const timerEl = document.getElementById("game-timer");

    // Спавн падающих сердечек
    const spawnTarget = () => {
      if (!playfield) return;
      const target = document.createElement("div");
      const isGolden = Math.random() < 0.2;
      target.className = `absolute cursor-pointer text-3xl select-none transform transition-transform active:scale-75 ${
        isGolden ? "animate-pulse" : ""
      }`;
      target.textContent = isGolden ? "🌟" : ["💖", "💕", "🍬", "🎾", "✨"][Math.floor(Math.random() * 5)];

      const x = Math.random() * (playfield.clientWidth - 45);
      target.style.left = `${Math.max(5, x)}px`;
      target.style.top = "-40px";

      playfield.appendChild(target);

      // Анимация падения
      let top = -40;
      const speed = 2.5 + Math.random() * 2;
      const fallTimer = setInterval(() => {
        top += speed;
        target.style.top = `${top}px`;

        if (top > playfield.clientHeight - 30) {
          clearInterval(fallTimer);
          target.remove();
        }
      }, 20);

      // Клик по сердечку
      target.addEventListener("pointerdown", () => {
        clearInterval(fallTimer);
        score += isGolden ? 3 : 1;
        scoreEl.textContent = `Счет: ${score}`;

        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred(isGolden ? "heavy" : "light");
        }

        // Эффект взрыва
        target.textContent = "💥";
        setTimeout(() => target.remove(), 150);
      });
    };

    const spawnInterval = setInterval(spawnTarget, 400);

    const countdown = setInterval(() => {
      timeLeft -= 1;
      if (timerEl) timerEl.textContent = `⏱️ ${timeLeft}s`;

      if (timeLeft <= 0) {
        endGame();
      }
    }, 1000);

    const endGame = () => {
      clearInterval(spawnInterval);
      clearInterval(countdown);

      const bonusHappy = Math.min(40, score * 2);
      this.data.happiness = Math.min(100, this.data.happiness + bonusHappy);
      this.data.satiety = Math.max(10, this.data.satiety - 5); // потратил калории в игре!
      this.savePetState();

      gameOverlay.innerHTML = `
        <div class="m-auto text-center p-8 bg-zinc-900 border border-zinc-700 rounded-3xl max-w-xs animate-scale-in text-white">
          <div class="text-5xl mb-3">🎉</div>
          <h3 class="text-xl font-bold mb-1">Отличная игра!</h3>
          <p class="text-zinc-300 text-sm mb-4">Поймано сердечек: <strong class="text-pink-400 text-lg">${score}</strong></p>
          <p class="text-xs text-pink-300 mb-6">+${bonusHappy}% к счастью питомца! 🥳</p>
          <button id="finish-game-ok" class="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold rounded-2xl shadow-lg transition-transform active:scale-95">
            Ура! ❤️
          </button>
        </div>
      `;

      if (window.confetti) {
        window.confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      }

      document.getElementById("finish-game-ok")?.addEventListener("click", () => {
        gameOverlay.remove();
        this.render();
      });
    };

    document.getElementById("exit-game-btn")?.addEventListener("click", endGame);
  }

  /**
   * Процедура купания (интерактивные пузыри и блеск)
   */
  startBathing() {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    }

    const scene = document.getElementById("pet-scene");
    if (!scene) return;

    // Спавним мыльные пузыри на 4 секунды
    let count = 0;
    const bubbleInterval = setInterval(() => {
      count++;
      const bubble = document.createElement("div");
      bubble.className = "soap-bubble select-none cursor-pointer";
      bubble.textContent = ["🫧", "🧼", "✨"][Math.floor(Math.random() * 3)];
      bubble.style.left = `${10 + Math.random() * 80}%`;
      bubble.style.bottom = "0px";
      bubble.style.fontSize = `${20 + Math.random() * 24}px`;

      scene.appendChild(bubble);

      bubble.addEventListener("click", () => {
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
        }
        bubble.textContent = "💥";
        setTimeout(() => bubble.remove(), 120);
      });

      setTimeout(() => bubble.remove(), 2500);

      if (count > 15) {
        clearInterval(bubbleInterval);
      }
    }, 200);

    // Восстановление чистоты
    this.data.cleanliness = 100;
    this.data.happiness = Math.min(100, this.data.happiness + 10);
    this.savePetState();

    setTimeout(() => {
      this.render();
    }, 2500);
  }

  /**
   * Гардероб: выбор наряда
   */
  openWardrobeModal() {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }

    const modalHTML = `
      <div id="modal-wardrobe-backdrop" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
        <div class="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-purple-100 dark:border-zinc-800 animate-slide-up">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-base font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              <span>👒 Гардероб ${this.data.name}</span>
            </h3>
            <button id="close-wardrobe-btn" class="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            ${CONFIG.PET_OUTFITS.map(
              (item) => `
              <button class="outfit-option p-3 rounded-2xl flex flex-col items-center justify-center border transition-all active:scale-95 ${
                this.data.outfit === item.id
                  ? "bg-purple-100 dark:bg-purple-950/60 border-purple-400 text-purple-700 dark:text-purple-300 shadow-sm"
                  : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-purple-50"
              }" data-outfit-id="${item.id}">
                <span class="text-3xl mb-1">${item.icon}</span>
                <span class="text-xs font-semibold">${item.name}</span>
                ${this.data.outfit === item.id ? '<span class="text-[10px] text-purple-600 dark:text-purple-300 font-bold mt-1">✓ Надето</span>' : ''}
              </button>
            `
            ).join("")}
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    if (window.lucide) window.lucide.createIcons();

    const backdrop = document.getElementById("modal-wardrobe-backdrop");
    const closeBtn = document.getElementById("close-wardrobe-btn");

    const closeModal = () => backdrop?.remove();
    closeBtn?.addEventListener("click", closeModal);
    backdrop?.addEventListener("click", (e) => {
      if (e.target === backdrop) closeModal();
    });

    backdrop.querySelectorAll(".outfit-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        const outfitId = btn.getAttribute("data-outfit-id");
        this.data.outfit = outfitId;
        this.savePetState();
        closeModal();
        this.render();

        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        }
      });
    });
  }

  /**
   * Переключение режима совместной прогулки
   */
  toggleWalk() {
    this.data.isWalking = !this.data.isWalking;
    this.data.walkingStartTime = this.data.isWalking ? Date.now() : null;

    if (this.data.isWalking) {
      this.data.happiness = Math.min(100, this.data.happiness + 15);
    }

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred("medium");
    }

    this.savePetState();
    this.render();
  }
}

// Экспорт синглтона
window.pet = new PetController();

