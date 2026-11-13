/* ==========================================================================
   МОДУЛЬ «НАШ ВАЙБ» (БАНОЧКИ ЛЮБВИ, 10 ДЕЙСТВИЙ, ТОСКА, НАСТРОЕНИЕ, ЗАПИСКИ)
   ========================================================================== */

class VibeController {
  constructor() {
    this.container = null;
    this.currentUser = null;
    this.state = {
      stateVersion: 2, // Версия для сброса старых демо-данных
      // Баночки любви (начинаются с 0)
      hisJar: {
        level: 0,
        heartsCount: 0,
        note: "",
        lastSender: ""
      },
      herJar: {
        level: 0,
        heartsCount: 0,
        note: "",
        lastSender: ""
      },
      lastAction: null,
      hisLove: 0,
      herLove: 0,
      hisNote: "",
      herNote: "",
      currentMood: { emoji: "✨", label: "Выберите вайб", desc: "Нажмите на настроение ниже", author: "" },
      hisHeart: { bpm: 60, label: "Спокойно", emoji: "☕" },
      herHeart: { bpm: 60, label: "Спокойно", emoji: "☕" },
      moments: []
    };
    this.timerInterval = null;
  }

  async init(containerEl, currentUser) {
    this.container = containerEl;
    this.currentUser = currentUser;
    await this.loadState();
    this.render();
    this.startRelationshipTimer();
  }

  async loadState() {
    const saved = await window.storage.get("vibe_state", null);
    if (saved && saved.stateVersion === 2) {
      this.state = { ...this.state, ...saved };
    } else {
      // Сброс старых демо-данных на чистые нули
      await this.saveState();
    }
  }

  async saveState() {
    await window.storage.set("vibe_state", this.state);
  }

  /**
   * Отрисовка всей вкладки «Наш Вайб»
   */
  render() {
    if (!this.container) return;

    const hisUser = CONFIG.ALLOWED_USERS.find((u) => u.role === "him") || CONFIG.ALLOWED_USERS[0];
    const herUser = CONFIG.ALLOWED_USERS.find((u) => u.role === "her") || CONFIG.ALLOWED_USERS[1];
    const currentMiss = CONFIG.MISS_LEVELS.find((m) => m.level >= this.state.missLevel) || CONFIG.MISS_LEVELS[2];

    this.container.innerHTML = `
      <div class="space-y-4 max-w-sm mx-auto pb-6">

        <!-- Счетчик времени «Мы вместе» -->
        <div class="relative overflow-hidden bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 rounded-3xl p-5 text-white shadow-lg shadow-pink-500/20">
          <div class="absolute -right-4 -bottom-4 text-white/10 text-8xl pointer-events-none select-none">
            ❤️
          </div>
          <div class="relative z-10 text-center">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-2">
              <i data-lucide="heart" class="w-3.5 h-3.5 fill-current"></i> Мы вместе уже
            </span>
            <div id="relationship-counter" class="grid grid-cols-4 gap-2 text-center my-1.5">
              <div class="bg-white/15 backdrop-blur-md rounded-2xl py-2 px-1">
                <span id="timer-days" class="block text-2xl font-black font-mono tracking-tight leading-none">0</span>
                <span class="text-[10px] opacity-80 uppercase font-medium">дней</span>
              </div>
              <div class="bg-white/15 backdrop-blur-md rounded-2xl py-2 px-1">
                <span id="timer-hours" class="block text-2xl font-black font-mono tracking-tight leading-none">0</span>
                <span class="text-[10px] opacity-80 uppercase font-medium">часов</span>
              </div>
              <div class="bg-white/15 backdrop-blur-md rounded-2xl py-2 px-1">
                <span id="timer-minutes" class="block text-2xl font-black font-mono tracking-tight leading-none">0</span>
                <span class="text-[10px] opacity-80 uppercase font-medium">минут</span>
              </div>
              <div class="bg-white/15 backdrop-blur-md rounded-2xl py-2 px-1">
                <span id="timer-seconds" class="block text-2xl font-black font-mono tracking-tight leading-none">0</span>
                <span class="text-[10px] opacity-80 uppercase font-medium">сек</span>
              </div>
            </div>
            <p class="text-xs text-white/80 mt-2 font-medium">Каждая секунда с тобой — сокровище ✨</p>
          </div>
        </div>


        <!-- ================= БАНОЧКИ ЛЮБВИ (LOVE JARS) ================= -->
        <div class="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl p-5 rounded-3xl border border-rose-100 dark:border-zinc-800 shadow-sm space-y-4">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                <span>🫙</span>
                <span>Баночки нашей любви</span>
              </h3>
              <p class="text-[11px] text-zinc-400 mt-0.5">Вы наполняете баночку друг друга ❤️</p>
            </div>
            <span class="text-[11px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-full flex items-center gap-1">
              <span>✨</span> Love Jars
            </span>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-1">
            ${this.renderJarHTML("him", hisUser, this.state.hisJar)}
            ${this.renderJarHTML("her", herUser, this.state.herJar)}
          </div>
        </div>

        <!-- ================= СЕРДЦА В УНИСОН (РИТМ ТОСКИ) ================= -->
        ${this.renderHeartsInUnisonHTML(hisUser, herUser)}

        <!-- Шкала настроения -->
        <div class="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl p-5 rounded-3xl border border-rose-100 dark:border-zinc-800 shadow-sm space-y-3">
          <div class="flex justify-between items-center">
            <h3 class="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              <span>🎭</span>
              <span>Наш текущий вайб</span>
            </h3>
            <span class="text-2xl">${this.state.currentMood.emoji}</span>
          </div>

          <div class="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-zinc-800/60 dark:to-zinc-800/40 border border-purple-100/50 dark:border-zinc-700">
            <p class="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              <span>${this.state.currentMood.emoji}</span>
              <span>${this.state.currentMood.label}</span>
            </p>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              ${this.state.currentMood.desc}
            </p>
          </div>

          <div class="grid grid-cols-3 gap-2 pt-1">
            ${CONFIG.MOOD_PRESETS.map(
              (m) => `
              <button class="mood-choice-btn p-2.5 rounded-2xl border transition-all active:scale-95 flex flex-col items-center justify-center text-center ${
                this.state.currentMood.label === m.label
                  ? "bg-pink-100/80 dark:bg-pink-950/60 border-pink-400 text-pink-700 dark:text-pink-300"
                  : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200/70 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-pink-50/50"
              }" data-label="${m.label}">
                <span class="text-xl mb-0.5">${m.emoji}</span>
                <span class="text-[10px] font-semibold truncate w-full">${m.label}</span>
              </button>
            `
            ).join("")}
          </div>
        </div>

        <!-- Лента записочек -->
        <div class="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl p-5 rounded-3xl border border-rose-100 dark:border-zinc-800 shadow-sm space-y-3">
          <div class="flex justify-between items-center">
            <h3 class="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              <span>💌</span>
              <span>Записочки для двоих</span>
            </h3>
            <button id="btn-add-moment" class="text-xs text-pink-600 dark:text-pink-400 font-semibold hover:underline flex items-center gap-1">
              <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i> Написать
            </button>
          </div>

          <div id="moments-list" class="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            ${this.renderMomentsList()}
          </div>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    this.bindEvents();
    this.updateRelationshipTimer();
  }

  getLastActionTimeStr() {
    if (!this.state.lastAction?.timestamp) return "Только что";
    const mins = Math.floor((Date.now() - this.state.lastAction.timestamp) / (1000 * 60));
    if (mins < 1) return "Только что";
    if (mins < 60) return `${mins} мин. назад`;
    const hours = Math.floor(mins / 60);
    return `${hours} ч. назад`;
  }

  renderJarHTML(role, user, jarData) {
    const isHer = role === "her";
    const heightPercent = Math.min(100, Math.max(0, jarData.level));
    const liquidClass = isHer ? "jar-liquid-her" : "jar-liquid-his";

    const isMyJar = this.currentUser?.role === role;
    const canIFill = !isMyJar;
    const partnerName = user.partnerName || (isHer ? "Любимый" : "Любимая");

    const floatingHearts = ["💖", "💕", "✨", "💗", "❤️"];

    return `
      <div class="flex flex-col items-center">
        <div class="flex items-center gap-1.5 mb-2">
          <span class="text-sm">${user.avatar}</span>
          <div class="text-center leading-none">
            <span class="text-xs font-bold text-zinc-800 dark:text-zinc-200 block truncate">${user.name}</span>
            <span class="text-[9px] text-zinc-400 block mt-0.5">${isMyJar ? "(Твоя баночка)" : "(Наполняешь ты)"}</span>
          </div>
        </div>

        <div class="relative w-full max-w-[145px] flex flex-col items-center">
          <div class="jar-cork"></div>
          <div class="jar-neck"></div>

          <div id="jar-${role}" class="love-jar-glass w-full h-48 select-none ${canIFill ? 'cursor-pointer active:scale-95' : 'cursor-default opacity-95'}" data-role="${role}" data-can-fill="${canIFill}">
            <div class="jar-glare"></div>
            <div id="jar-drop-zone-${role}" class="absolute inset-0 pointer-events-none z-20 flex justify-center"></div>
            <div id="jar-liquid-${role}" class="jar-liquid ${liquidClass}" style="height: ${heightPercent}%;"></div>

            <div class="absolute inset-0 pointer-events-none overflow-hidden z-10">
              ${
                jarData.heartsCount > 0
                  ? `<span class="jar-heart-particle" style="left: 20%; bottom: 15%; animation-delay: 0s;">${floatingHearts[0]}</span>
                     <span class="jar-heart-particle" style="right: 22%; bottom: 35%; animation-delay: 0.8s;">${floatingHearts[1]}</span>
                     <span class="jar-heart-particle" style="left: 35%; bottom: 55%; animation-delay: 1.6s;">${floatingHearts[2]}</span>
                     <span class="jar-heart-particle" style="right: 30%; bottom: 20%; animation-delay: 2.2s;">${floatingHearts[3]}</span>`
                  : ""
              }
            </div>

            <div class="absolute inset-x-2 bottom-3 z-20 flex flex-col items-center text-center">
              <div class="px-2 py-1 rounded-xl bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md shadow-sm border border-white/60 dark:border-zinc-700/60 max-w-[90%]">
                <p class="text-[10px] font-black text-zinc-800 dark:text-zinc-100 leading-tight">
                  <span id="jar-level-text-${role}">${jarData.level}%</span>
                </p>
                <p class="text-[9px] text-zinc-500 dark:text-zinc-400 font-medium">
                  <span id="jar-count-${role}">${jarData.heartsCount}</span> 💖
                </p>
              </div>
            </div>
          </div>
        </div>

        ${
          canIFill
            ? `<button class="btn-drop-heart w-full mt-2.5 py-1.5 px-2 rounded-xl text-white font-bold text-xs shadow-md shadow-rose-500/25 transition-all active:scale-95 flex items-center justify-center gap-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600" data-role="${role}">
                 <span>Подарить</span>
                 <span>💖</span>
               </button>`
            : `<div class="w-full mt-2.5 py-1.5 px-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 text-center">
                 <span class="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 block leading-tight">
                   Наполняет ${partnerName} ✨
                 </span>
               </div>`
        }

        <button class="btn-read-jar-note w-full mt-1.5 p-2 rounded-xl bg-rose-50/60 dark:bg-zinc-800/40 hover:bg-rose-100/60 border border-rose-100/60 dark:border-zinc-700/50 text-left transition-all active:scale-98" data-role="${role}">
          <div class="flex items-center justify-between text-[10px] text-zinc-400 mb-0.5">
            <span class="flex items-center gap-1 text-rose-500 font-semibold">
              <i data-lucide="scroll" class="w-3 h-3"></i> Записка
            </span>
            <span class="text-[9px] text-zinc-400">${canIFill ? "написать ✍️" : "прочесть 💌"}</span>
          </div>
          <p id="jar-note-text-${role}" class="text-[11px] font-medium text-zinc-700 dark:text-zinc-200 line-clamp-2 italic">
            ${jarData.note ? `"${jarData.note}"` : (canIFill ? "Оставить первую записку ✍️" : "Здесь пока пусто 💌")}
          </p>
        </button>
      </div>
    `;
  }

  /**
   * Отрисовка блока «Сердца в унисон»
   */
  renderHeartsInUnisonHTML(hisUser, herUser) {
    const isUnison = this.state.hisHeart.bpm === this.state.herHeart.bpm;
    const isHim = this.currentUser?.role === "him";

    const hisDuration = (60 / this.state.hisHeart.bpm).toFixed(2) + "s";
    const herDuration = (60 / this.state.herHeart.bpm).toFixed(2) + "s";

    return `
      <div id="unison-card" class="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl p-5 rounded-3xl border border-rose-100 dark:border-zinc-800 shadow-sm transition-all duration-500 ${
        isUnison ? "unison-card-glow bg-gradient-to-b from-rose-50/90 via-pink-50/70 to-amber-50/40 dark:from-zinc-900/90 dark:via-zinc-900 dark:to-rose-950/30" : ""
      } space-y-4">

        <!-- Шапка блока -->
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              <span class="text-rose-500 animate-pulse">💓</span>
              <span>Ритм наших сердец</span>
            </h3>
            <p class="text-[11px] text-zinc-400 mt-0.5">Пульс тоски и биения сердец для двоих</p>
          </div>
          ${
            isUnison
              ? `<span class="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-pink-500 text-white font-black text-[10px] tracking-wide shadow-md shadow-rose-500/30 flex items-center gap-1 animate-pulse">
                   <span>✨</span> СЛИЛИСЬ В ОДНО
                 </span>`
              : `<span class="text-xs text-zinc-400 font-semibold flex items-center gap-1">
                   <span>Два сердца</span>
                 </span>`
          }
        </div>

        ${
          isUnison
            ? `<!-- ================= ЕДИНОЕ СЛИВШЕЕСЯ СЕРДЦЕ ================= -->
               <div class="flex flex-col items-center justify-center py-4 px-2 text-center animate-unison-merge relative">
                 <!-- Золотисто-розовые расходящиеся волны пульса -->
                 <div class="relative w-32 h-32 flex items-center justify-center my-1">
                   <div class="unison-pulse-wave" style="--bpm-duration: ${hisDuration};"></div>
                   <div class="unison-pulse-wave" style="--bpm-duration: ${hisDuration}; animation-delay: -0.3s;"></div>

                   <!-- Одно большое сияющее сердце -->
                   <div class="unison-big-heart-beat text-7xl select-none cursor-pointer filter drop-shadow-2xl" style="--bpm-duration: ${hisDuration};" data-heart-unison="true" title="Тапните, чтобы переключить ритм">
                     💖
                   </div>
                 </div>

                 <!-- Имена пары -->
                 <div class="flex items-center justify-center gap-2 mt-2">
                   <span class="text-xs font-black text-zinc-800 dark:text-zinc-100 flex items-center gap-1">
                     <span>${hisUser.avatar}</span> <span>${hisUser.name}</span>
                   </span>
                   <span class="text-rose-500 font-black text-sm">✦</span>
                   <span class="text-xs font-black text-zinc-800 dark:text-zinc-100 flex items-center gap-1">
                     <span>${herUser.avatar}</span> <span>${herUser.name}</span>
                   </span>
                 </div>

                 <!-- Показатель пульса -->
                 <div class="mt-2 px-3 py-1 rounded-full bg-white/80 dark:bg-zinc-800/80 border border-rose-200 dark:border-rose-900/60 inline-flex items-center gap-1.5 shadow-sm">
                   <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                   <span class="text-xs font-black text-rose-600 dark:text-rose-300">${this.state.hisHeart.bpm} BPM</span>
                   <span class="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">• ${this.state.hisHeart.label}</span>
                 </div>

                 <p class="text-xs text-rose-500 font-bold mt-2">
                   ✨ Невероятно! Ваши сердца слились в одно и бьются в унисон! ✨
                 </p>

                 <!-- Кнопки управления своим ритмом -->
                 <div class="w-full max-w-xs mt-4 pt-3 border-t border-rose-100/70 dark:border-zinc-800 flex flex-col items-center">
                   <p class="text-[10px] text-zinc-400 mb-1.5">Твой ритм (нажми, чтобы изменить):</p>
                   <div class="grid grid-cols-4 gap-1.5 w-full">
                     ${CONFIG.HEART_RATES.map(
                       (rate) => `
                       <button class="btn-set-bpm py-1.5 px-1 rounded-xl flex flex-col items-center transition-all active:scale-95 ${
                         (isHim ? this.state.hisHeart.bpm : this.state.herHeart.bpm) === rate.bpm
                           ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/25"
                           : "bg-white/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-rose-100/60"
                       }" data-bpm="${rate.bpm}" data-role="${isHim ? 'him' : 'her'}" title="${rate.desc}">
                         <span class="text-sm leading-none">${rate.emoji}</span>
                         <span class="text-[9px] font-bold mt-0.5 leading-none">${rate.bpm}</span>
                       </button>
                     `
                     ).join("")}
                   </div>
                 </div>
               </div>`
            : `<!-- ================= ДВА РАЗДЕЛЬНЫХ СЕРДЦА ================= -->
               <div class="grid grid-cols-2 gap-3 pt-1">

                 <!-- Левое сердце (Его) -->
                 <div class="flex flex-col items-center p-3 rounded-2xl bg-rose-50/40 dark:bg-zinc-800/40 border border-rose-100/60 dark:border-zinc-700/50 text-center relative overflow-hidden transition-all">
                   <span class="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1 mb-2">
                     <span>${hisUser.avatar}</span>
                     <span class="truncate">${hisUser.name}</span>
                   </span>

                   <!-- Пульсирующее сердце -->
                   <div class="relative w-20 h-20 flex items-center justify-center my-1">
                     <div class="heart-pulse-ring" style="--bpm-duration: ${hisDuration};"></div>
                     <div class="heart-beat-active text-5xl select-none filter drop-shadow-md cursor-pointer active:scale-90 transition-transform" style="--bpm-duration: ${hisDuration};" data-heart-role="him">
                       ❤️
                     </div>
                   </div>

                   <!-- BPM -->
                   <div class="mt-1">
                     <span class="text-sm font-black text-rose-500 leading-none">${this.state.hisHeart.bpm}</span>
                     <span class="text-[10px] text-zinc-400 uppercase font-semibold">BPM</span>
                     <p class="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 truncate mt-0.5">${this.state.hisHeart.label}</p>
                   </div>

                   <!-- Кнопки -->
                   <div class="w-full mt-2.5 pt-2 border-t border-rose-100/60 dark:border-zinc-700/40">
                     ${
                       isHim
                         ? `<div class="grid grid-cols-4 gap-1">
                              ${CONFIG.HEART_RATES.map(
                                (rate) => `
                                <button class="btn-set-bpm p-1 rounded-xl flex flex-col items-center transition-all active:scale-95 ${
                                  this.state.hisHeart.bpm === rate.bpm
                                    ? "bg-rose-500 text-white shadow-sm shadow-rose-500/30"
                                    : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-rose-100/60"
                                }" data-bpm="${rate.bpm}" data-role="him" title="${rate.desc}">
                                  <span class="text-xs leading-none">${rate.emoji}</span>
                                  <span class="text-[8px] font-bold mt-0.5 leading-none">${rate.bpm}</span>
                                </button>
                              `
                              ).join("")}
                            </div>`
                         : `<p class="text-[10px] text-zinc-400 italic">Настраивает ${hisUser.name}</p>`
                     }
                   </div>
                 </div>

                 <!-- Правое сердце (Её) -->
                 <div class="flex flex-col items-center p-3 rounded-2xl bg-pink-50/40 dark:bg-zinc-800/40 border border-pink-100/60 dark:border-zinc-700/50 text-center relative overflow-hidden transition-all">
                   <span class="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1 mb-2">
                     <span>${herUser.avatar}</span>
                     <span class="truncate">${herUser.name}</span>
                   </span>

                   <!-- Пульсирующее сердце -->
                   <div class="relative w-20 h-20 flex items-center justify-center my-1">
                     <div class="heart-pulse-ring" style="--bpm-duration: ${herDuration};"></div>
                     <div class="heart-beat-active text-5xl select-none filter drop-shadow-md cursor-pointer active:scale-90 transition-transform" style="--bpm-duration: ${herDuration};" data-heart-role="her">
                       💖
                     </div>
                   </div>

                   <!-- BPM -->
                   <div class="mt-1">
                     <span class="text-sm font-black text-pink-500 leading-none">${this.state.herHeart.bpm}</span>
                     <span class="text-[10px] text-zinc-400 uppercase font-semibold">BPM</span>
                     <p class="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 truncate mt-0.5">${this.state.herHeart.label}</p>
                   </div>

                   <!-- Кнопки -->
                   <div class="w-full mt-2.5 pt-2 border-t border-pink-100/60 dark:border-zinc-700/40">
                     ${
                       !isHim
                         ? `<div class="grid grid-cols-4 gap-1">
                              ${CONFIG.HEART_RATES.map(
                                (rate) => `
                                <button class="btn-set-bpm p-1 rounded-xl flex flex-col items-center transition-all active:scale-95 ${
                                  this.state.herHeart.bpm === rate.bpm
                                    ? "bg-pink-500 text-white shadow-sm shadow-pink-500/30"
                                    : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-pink-100/60"
                                }" data-bpm="${rate.bpm}" data-role="her" title="${rate.desc}">
                                  <span class="text-xs leading-none">${rate.emoji}</span>
                                  <span class="text-[8px] font-bold mt-0.5 leading-none">${rate.bpm}</span>
                                </button>
                              `
                              ).join("")}
                            </div>`
                         : `<p class="text-[10px] text-zinc-400 italic">Настраивает ${herUser.name}</p>`
                     }
                   </div>
                 </div>

               </div>`
        }

      </div>
    `;
  }

  renderMomentsList() {
    if (!this.state.moments || this.state.moments.length === 0) {
      return `
        <div class="text-center py-6 text-zinc-400 text-xs">
          <p class="text-2xl mb-1">🕊️</p>
          <p>Пока нет записок. Оставьте первое милое послание!</p>
        </div>
      `;
    }

    return this.state.moments
      .slice(0, 10)
      .map((m) => {
        const timeStr = new Date(m.timestamp).toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit"
        });
        return `
          <div class="p-3 rounded-2xl bg-rose-50/40 dark:bg-zinc-800/40 border border-rose-100/60 dark:border-zinc-700/40 flex items-start gap-2.5 animate-fade-in">
            <span class="text-2xl mt-0.5">${m.emoji || "💌"}</span>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-center mb-0.5">
                <span class="text-xs font-bold text-zinc-800 dark:text-zinc-200">${m.author}</span>
                <span class="text-[10px] text-zinc-400">${timeStr}</span>
              </div>
              <p class="text-xs text-zinc-600 dark:text-zinc-300 break-words">${m.text}</p>
            </div>
          </div>
        `;
      })
      .join("");
  }

  bindEvents() {
    // Клик по баночке
    this.container.querySelectorAll(".love-jar-glass").forEach((el) => {
      el.addEventListener("click", () => {
        const role = el.getAttribute("data-role");
        const canFill = el.getAttribute("data-can-fill") === "true";

        if (canFill) {
          this.dropHeartIntoJar(role);
        } else {
          const partnerUser = CONFIG.ALLOWED_USERS.find((u) => u.role !== role) || { name: "Твоя половинка" };
          if (window.showToast) {
            window.showToast(`Твою баночку наполняет ${partnerUser.name} ❤️`, "info");
          }
          if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred("warning");
          }
        }
      });
    });

    // Клик по кнопке «Подарить 💖»
    this.container.querySelectorAll(".btn-drop-heart").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const role = btn.getAttribute("data-role");
        this.dropHeartIntoJar(role);
      });
    });

    // Чтение / редактирование записки в баночке
    this.container.querySelectorAll(".btn-read-jar-note").forEach((btn) => {
      btn.addEventListener("click", () => {
        const role = btn.getAttribute("data-role");
        this.openJarNoteModal(role);
      });
    });

    // Управление ритмом сердец (Сердца в унисон)
    this.container.querySelectorAll(".btn-set-bpm").forEach((btn) => {
      btn.addEventListener("click", () => {
        const bpm = parseInt(btn.getAttribute("data-bpm"), 10);
        const role = btn.getAttribute("data-role");
        this.setHeartRate(role, bpm);
      });
    });

    // Тап по сердцу (переключение ритма по кругу для своего сердца)
    this.container.querySelectorAll("[data-heart-role]").forEach((heartEl) => {
      heartEl.addEventListener("click", () => {
        const role = heartEl.getAttribute("data-heart-role");
        if (this.currentUser?.role === role) {
          const currentBpm = role === "him" ? this.state.hisHeart.bpm : this.state.herHeart.bpm;
          const rates = CONFIG.HEART_RATES;
          const idx = rates.findIndex((r) => r.bpm === currentBpm);
          const nextRate = rates[(idx + 1) % rates.length];
          this.setHeartRate(role, nextRate.bpm);
        } else {
          const partnerName = role === "him" ? "Любимого" : "Любимой";
          const bpm = role === "him" ? this.state.hisHeart.bpm : this.state.herHeart.bpm;
          if (window.showToast) {
            window.showToast(`Сердце ${partnerName} бьётся со скоростью ${bpm} BPM 💓`, "love");
          }
        }
      });
    });

    // Тап по единому слившемуся сердцу
    this.container.querySelectorAll("[data-heart-unison]").forEach((unisonEl) => {
      unisonEl.addEventListener("click", () => {
        const role = this.currentUser?.role || "him";
        const currentBpm = role === "him" ? this.state.hisHeart.bpm : this.state.herHeart.bpm;
        const rates = CONFIG.HEART_RATES;
        const idx = rates.findIndex((r) => r.bpm === currentBpm);
        const nextRate = rates[(idx + 1) % rates.length];
        this.setHeartRate(role, nextRate.bpm);
      });
    });

    // Настроение
    this.container.querySelectorAll(".mood-choice-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const label = btn.getAttribute("data-label");
        const found = CONFIG.MOOD_PRESETS.find((m) => m.label === label);
        if (found) {
          this.setMood(found);
        }
      });
    });

    // Моменты
    document.getElementById("btn-add-moment")?.addEventListener("click", () => {
      this.openAddMomentModal();
    });
  }

  /**
   * Всплывающее окно со всеми 10 сигналами (Bottom Sheet)
   */
  openActionsModal() {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }

    // Удаляем предыдущую шторку, если была
    const existing = document.getElementById("modal-actions-sheet");
    if (existing) existing.remove();

    const sheetHTML = `
      <div id="modal-actions-sheet" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-0 animate-fade-in select-none">
        <div id="sheet-content" class="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-[32px] p-5 pb-safe shadow-2xl border-t border-rose-100 dark:border-zinc-800 animate-sheet-up max-h-[85vh] flex flex-col touch-none">

          <!-- Интерактивная ручка-ползунок для свайпа вниз -->
          <div id="sheet-drag-zone" class="w-full pt-1 pb-3 flex justify-center cursor-pointer">
            <div id="sheet-drag-handle" class="w-14 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full transition-all hover:bg-zinc-400 dark:hover:bg-zinc-600"></div>
          </div>

          <!-- Шапка шторки без крестика -->
          <div class="px-1 mb-3">
            <h3 class="text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>💌</span>
              <span>Наши сигналы</span>
            </h3>
            <p class="text-xs text-zinc-400 mt-0.5">Выберите прикосновение или смахните шторку вниз</p>
          </div>

          <!-- Сетка 10 действий -->
          <div class="grid grid-cols-2 gap-2.5 overflow-y-auto pr-1 py-1 touch-auto">
            ${CONFIG.ACTIONS.map(
              (act) => `
              <button class="sheet-action-item p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-rose-50 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 text-left transition-all active:scale-95 flex items-center gap-3 shadow-sm" data-action-id="${act.id}">
                <div class="w-10 h-10 rounded-2xl bg-gradient-to-br ${act.bg} text-white flex items-center justify-center text-xl shadow-sm flex-shrink-0">
                  ${act.emoji}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate leading-tight">${act.title}</p>
                  <p class="text-[10px] text-zinc-400 truncate mt-0.5 leading-tight">${act.desc}</p>
                </div>
              </button>
            `
            ).join("")}
          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", sheetHTML);
    if (window.lucide) window.lucide.createIcons();

    const backdrop = document.getElementById("modal-actions-sheet");
    const content = document.getElementById("sheet-content");
    const dragZone = document.getElementById("sheet-drag-zone");

    const closeSheet = () => {
      content?.classList.remove("animate-sheet-up");
      content?.classList.add("animate-sheet-down");
      backdrop?.classList.add("opacity-0", "transition-opacity", "duration-200");
      setTimeout(() => backdrop?.remove(), 220);
    };

    // Закрытие по клику на затемненный фон
    backdrop?.addEventListener("click", (e) => {
      if (e.target === backdrop) closeSheet();
    });

    // Клик по ползунку сразу закрывает шторку
    dragZone?.addEventListener("click", () => closeSheet());

    // Интерактивный жест свайпа/перетягивания шторки вниз (Drag to dismiss)
    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    const handlePointerDown = (e) => {
      startY = e.clientY;
      currentY = startY;
      isDragging = true;
      if (content) content.style.transition = "none";
    };

    const handlePointerMove = (e) => {
      if (!isDragging || !content) return;
      currentY = e.clientY;
      const diffY = currentY - startY;
      if (diffY > 0) {
        // Тянем вниз с плавным сопротивлением
        content.style.transform = `translateY(${diffY}px)`;
      }
    };

    const handlePointerUp = () => {
      if (!isDragging || !content) return;
      isDragging = false;
      const diffY = currentY - startY;

      if (diffY > 60) {
        // Смахнули вниз — закрываем
        closeSheet();
      } else {
        // Не дотянули — плавно возвращаем на место
        content.style.transition = "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)";
        content.style.transform = "translateY(0)";
      }
    };

    // Привязываем свайп на верхнюю зону шторки
    dragZone?.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    backdrop.querySelectorAll(".sheet-action-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const actId = btn.getAttribute("data-action-id");
        const action = CONFIG.ACTIONS.find((a) => a.id === actId);
        closeSheet();
        if (action) {
          setTimeout(() => this.triggerAction(action), 150);
        }
      });
    });
  }

  /**
   * Запуск выбранного действия из 10
   */
  async triggerAction(action) {
    const sender = this.currentUser || { name: "Любимый" };

    // 1. Тактильная отдача Telegram Haptic
    if (window.Telegram?.WebApp?.HapticFeedback) {
      if (action.haptic === "heavy") {
        window.Telegram.WebApp.HapticFeedback.impactOccurred("heavy");
      } else if (action.haptic === "medium") {
        window.Telegram.WebApp.HapticFeedback.impactOccurred("medium");
      } else if (action.haptic === "rigid") {
        window.Telegram.WebApp.HapticFeedback.impactOccurred("rigid");
      } else if (action.haptic === "warning") {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("warning");
      } else if (action.haptic === "error") {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
        setTimeout(() => window.Telegram.WebApp.HapticFeedback.impactOccurred("heavy"), 150);
      } else {
        window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
      }
    }

    // 2. Сохраняем последнее действие в облако
    this.state.lastAction = {
      id: action.id,
      emoji: action.emoji,
      title: action.title,
      senderName: sender.name,
      timestamp: Date.now()
    };
    this.saveState();

    // 3. Полноэкранный визуальный эффект
    this.showActionAnimation(action, sender.name);

    // 4. Отправка Push-уведомления партнеру через Bot API
    if (window.notifier) {
      await window.notifier.notifyPartner(action, sender);
    }
  }

  /**
   * Полноэкранные анимации для каждого действия
   */
  showActionAnimation(action, senderName) {
    const overlay = document.createElement("div");
    overlay.className = "fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-white text-center animate-fade-in backdrop-blur-md select-none";

    let contentHTML = "";

    switch (action.id) {
      case "kiss":
        overlay.classList.add("bg-rose-500/85");
        contentHTML = `
          <div class="relative w-48 h-48 flex items-center justify-center">
            <span class="text-8xl kiss-mark-anim">💋</span>
            <span class="text-6xl kiss-mark-anim" style="top: 10px; left: 10px; animation-delay: 0.15s;">💋</span>
            <span class="text-5xl kiss-mark-anim" style="bottom: 10px; right: 10px; animation-delay: 0.3s;">💋</span>
          </div>
          <h2 class="text-2xl font-black mt-4">${senderName} целует тебя!</h2>
          <p class="text-sm text-pink-100 mt-1">Сладкий чмок прямо в щёчку 💖</p>
        `;
        if (window.confetti) window.confetti({ particleCount: 30, spread: 60, origin: { y: 0.5 } });
        break;

      case "hug":
        overlay.classList.add("bg-pink-500/85");
        contentHTML = `
          <div class="text-8xl mb-3 animate-bounce">🤗</div>
          <h2 class="text-2xl font-black mb-1">${senderName} крепко обнимает!</h2>
          <p class="text-sm text-pink-100">Тепло, уют и нежность сквозь расстояние ✨</p>
        `;
        if (window.confetti) window.confetti({ particleCount: 40, spread: 70 });
        break;

      case "pat":
        overlay.classList.add("bg-amber-500/85");
        contentHTML = `
          <div class="text-8xl mb-3 animate-bounce">💆‍♀️</div>
          <h2 class="text-2xl font-black mb-1">${senderName} нежно гладит по голове</h2>
          <p class="text-sm text-amber-100">Всё будет хорошо, отдохни немножко 🌸</p>
        `;
        break;

      case "bite":
        overlay.classList.add("bg-orange-500/85");
        contentHTML = `
          <div class="text-8xl mb-3 transform hover:rotate-12 transition-transform animate-pulse">😼</div>
          <h2 class="text-2xl font-black mb-1">ХВАТЬ! Игривый КУСЬ!</h2>
          <p class="text-sm text-orange-100">${senderName} сделал(а) тебе нежный кусь за щёчку 🦷</p>
        `;
        break;

      case "tickle":
        overlay.classList.add("bg-teal-500/85");
        contentHTML = `
          <div class="text-8xl mb-3 shake-screen">🪶</div>
          <h2 class="text-2xl font-black mb-1">Щекотка! 🤭</h2>
          <p class="text-sm text-teal-100">${senderName} щекочет тебя! Срочно улыбайся! ✨</p>
        `;
        break;

      case "pout":
        overlay.classList.add("bg-sky-600/85");
        contentHTML = `
          <div class="relative flex flex-col items-center">
            <span class="text-7xl mb-1">🌧️</span>
            <span class="text-6xl animate-pulse">🥺</span>
          </div>
          <h2 class="text-2xl font-black mt-2">${senderName} немного дуется...</h2>
          <p class="text-sm text-sky-100 mt-1">Требуется порция внимания, поцелуй и сладость! 🍬</p>
        `;
        break;

      case "hands":
        overlay.classList.add("bg-indigo-600/85");
        contentHTML = `
          <div class="text-8xl mb-3 animate-bounce">🧸</div>
          <h2 class="text-2xl font-black mb-1">Хочу на ручки!</h2>
          <p class="text-sm text-indigo-100">${senderName} просит взять на ручки и укутать пледом 💖</p>
        `;
        break;

      case "sleepy":
        overlay.classList.add("bg-slate-900/90");
        contentHTML = `
          <div class="text-8xl mb-3">🌙</div>
          <div class="text-3xl mb-2">⭐ 🥱 ⭐</div>
          <h2 class="text-2xl font-black mb-1">Сладких снов...</h2>
          <p class="text-sm text-indigo-200">${senderName} засыпает и шлёт сонный чмок ✨</p>
        `;
        break;

      case "support":
        overlay.classList.add("bg-gradient-to-br", "from-amber-500/90", "to-rose-500/90");
        contentHTML = `
          <div class="text-8xl mb-3 animate-spin" style="animation-duration: 8s;">✨</div>
          <h2 class="text-2xl font-black mb-1">Ты со всем справишься!</h2>
          <p class="text-sm text-amber-100">${senderName} верит в тебя всем сердцем! Ты умничка 💖</p>
        `;
        if (window.confetti) window.confetti({ particleCount: 60, spread: 80 });
        break;

      case "urgent_call":
        overlay.classList.add("bg-red-600/90", "siren-pulse");
        contentHTML = `
          <div class="text-8xl mb-3 animate-bounce">🚨</div>
          <div class="text-5xl mb-2">📞 💖</div>
          <h2 class="text-2xl font-black mb-1">СРОЧНЫЙ СОЗВОН!</h2>
          <p class="text-sm text-red-100 max-w-xs">${senderName} безумно соскучился(лась)! Набери скорее!</p>
        `;
        break;

      default:
        overlay.classList.add("bg-pink-500/85");
        contentHTML = `
          <div class="text-8xl mb-3">${action.emoji}</div>
          <h2 class="text-2xl font-black mb-1">${action.title}</h2>
          <p class="text-sm text-pink-100">${senderName} отправил(а) тебе сигнал любви!</p>
        `;
    }

    overlay.innerHTML = contentHTML;
    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.classList.add("opacity-0", "transition-opacity", "duration-400");
      setTimeout(() => overlay.remove(), 400);
    }, 2100);
  }

  dropHeartIntoJar(role) {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred("medium");
    }

    const jarKey = role === "her" ? "herJar" : "hisJar";
    const jar = this.state[jarKey];

    jar.heartsCount += 1;
    jar.level = Math.min(200, jar.level + 5);
    jar.lastSender = this.currentUser ? this.currentUser.name : "Любимый";

    if (role === "her") {
      this.state.herLove = jar.level;
    } else {
      this.state.hisLove = jar.level;
    }

    this.saveState();

    const dropZone = document.getElementById(`jar-drop-zone-${role}`);
    if (dropZone) {
      const dropHeart = document.createElement("div");
      dropHeart.className = "drop-heart-anim absolute text-3xl select-none";
      dropHeart.textContent = ["💖", "💕", "💗", "❤️", "✨"][Math.floor(Math.random() * 5)];
      dropZone.appendChild(dropHeart);
      setTimeout(() => dropHeart.remove(), 750);
    }

    const liquid = document.getElementById(`jar-liquid-${role}`);
    const lvlText = document.getElementById(`jar-level-text-${role}`);
    const cntText = document.getElementById(`jar-count-${role}`);

    if (liquid) liquid.style.height = `${Math.min(100, jar.level)}%`;
    if (lvlText) lvlText.textContent = `${jar.level}%`;
    if (cntText) cntText.textContent = jar.heartsCount;

    if (jar.level >= 100 && jar.heartsCount % 5 === 0 && window.confetti) {
      window.confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.6 },
        colors: ["#fda4af", "#f43f5e", "#be185d"]
      });
    }
  }

  openJarNoteModal(role) {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }

    const jarKey = role === "her" ? "herJar" : "hisJar";
    const jar = this.state[jarKey];
    const user = CONFIG.ALLOWED_USERS.find((u) => u.role === role) || CONFIG.ALLOWED_USERS[0];
    const isMyJar = this.currentUser?.role === role;

    const modalHTML = `
      <div id="modal-jar-note" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
        <div class="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-rose-100 dark:border-zinc-800 animate-slide-up">
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-base font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              <span>📜</span>
              <span>${isMyJar ? `Послание для тебя от ${user.partnerName}` : `Твоя записка для ${user.name}`}</span>
            </h3>
            <button id="close-jar-note" class="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          ${
            isMyJar
              ? `<div class="p-4 rounded-2xl bg-rose-50/70 dark:bg-zinc-800/80 border border-rose-200/70 dark:border-zinc-700 my-2">
                   <p class="text-sm text-zinc-800 dark:text-zinc-100 italic leading-relaxed">
                     "${jar.note || 'Здесь пока нет записки, но скоро она появится ❤️'}"
                   </p>
                 </div>
                 <p class="text-[11px] text-zinc-400 text-center mt-2">Эту записку для тебя написал(а) ${user.partnerName} 🌸</p>
                 <div class="mt-4">
                   <button id="close-jar-note-btn" class="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-md shadow-rose-500/25">Закрыть 💖</button>
                 </div>`
              : `<p class="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                   Напишите нежные слова или признание, которое ${user.name} увидит в своей баночке:
                 </p>
                 <textarea id="jar-note-input" rows="3" class="w-full p-3 rounded-2xl bg-rose-50/50 dark:bg-zinc-800 border border-rose-200 dark:border-zinc-700 text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-400" placeholder="Ты делаешь каждый мой день особенным...">${jar.note || ""}</textarea>
                 <div class="flex gap-2 mt-4">
                   <button id="cancel-jar-note" class="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-semibold">Отмена</button>
                   <button id="save-jar-note" class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-semibold shadow-md shadow-rose-500/30">Вложить в баночку 💌</button>
                 </div>`
          }
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    if (window.lucide) window.lucide.createIcons();

    const modal = document.getElementById("modal-jar-note");
    const closeModal = () => modal?.remove();

    document.getElementById("close-jar-note")?.addEventListener("click", closeModal);
    document.getElementById("close-jar-note-btn")?.addEventListener("click", closeModal);
    document.getElementById("cancel-jar-note")?.addEventListener("click", closeModal);
    modal?.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    document.getElementById("save-jar-note")?.addEventListener("click", () => {
      const val = document.getElementById("jar-note-input")?.value?.trim();
      if (val) {
        jar.note = val;
        if (role === "her") {
          this.state.herNote = val;
        } else {
          this.state.hisNote = val;
        }
        this.saveState();
        this.render();

        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        }
      }
      closeModal();
    });
  }

  setMissLevel(val) {
    this.state.missLevel = val;
    this.state.missAuthor = this.currentUser ? this.currentUser.name : "Любимый человек";
    this.saveState();

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }

    const currentMiss = CONFIG.MISS_LEVELS.find((m) => m.level >= val) || CONFIG.MISS_LEVELS[2];
    const lvlText = document.getElementById("miss-current-level");
    const titleText = document.getElementById("miss-title-text");
    const authorText = document.getElementById("miss-author-text");

    if (lvlText) lvlText.innerHTML = `<span>${currentMiss.emoji}</span> <span>${val}%</span>`;
    if (titleText) titleText.textContent = currentMiss.title;
    if (authorText) authorText.textContent = `Обновлено: ${this.state.missAuthor}`;

    if (val === 100 && window.confetti) {
      window.confetti({ particleCount: 50, spread: 80, colors: ["#f43f5e", "#fda4af"] });
    }
  }

  /**
   * Установка ритма сердца (Сердца в унисон)
   */
  setHeartRate(role, bpm) {
    const rate = CONFIG.HEART_RATES.find((r) => r.bpm === bpm) || CONFIG.HEART_RATES[1];

    if (role === "him") {
      this.state.hisHeart = { bpm: rate.bpm, label: rate.label, emoji: rate.emoji };
    } else {
      this.state.herHeart = { bpm: rate.bpm, label: rate.label, emoji: rate.emoji };
    }

    const isUnison = this.state.hisHeart.bpm === this.state.herHeart.bpm;

    if (window.Telegram?.WebApp?.HapticFeedback) {
      if (isUnison) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
      } else {
        window.Telegram.WebApp.HapticFeedback.selectionChanged();
      }
    }

    if (isUnison && window.confetti) {
      window.confetti({
        particleCount: 50,
        spread: 75,
        origin: { y: 0.55 },
        colors: ["#fda4af", "#fbbf24", "#f43f5e"]
      });
    }

    this.saveState();
    this.render();
  }

  setMood(mood) {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    }

    this.state.currentMood = {
      ...mood,
      author: this.currentUser ? this.currentUser.name : "Любимый"
    };

    this.saveState();
    this.render();
  }

  openAddMomentModal() {
    const emojis = ["💌", "✨", "☕", "🍕", "🥰", "🌸", "🌙", "🎉"];
    let selectedEmoji = "💌";

    const modalHTML = `
      <div id="modal-moment" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
        <div class="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-rose-100 dark:border-zinc-800 animate-slide-up">
          <h3 class="text-base font-bold text-zinc-800 dark:text-zinc-100 mb-3 flex items-center gap-2">
            <span>💌</span>
            <span>Новая записочка</span>
          </h3>

          <div class="flex gap-2 mb-3 overflow-x-auto py-1">
            ${emojis.map((em) => `<button class="moment-em-btn text-2xl p-1.5 rounded-xl border border-transparent hover:bg-pink-50" data-em="${em}">${em}</button>`).join("")}
          </div>

          <textarea id="moment-text-input" rows="3" class="w-full p-3 rounded-2xl bg-rose-50/50 dark:bg-zinc-800 border border-rose-200 dark:border-zinc-700 text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-400" placeholder="Что на душе? Поделись моментом..."></textarea>

          <div class="flex gap-2 mt-4">
            <button id="cancel-moment" class="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-semibold">Отмена</button>
            <button id="save-moment" class="flex-1 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold shadow-md shadow-pink-500/30">Оставить</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    const modal = document.getElementById("modal-moment");

    modal.querySelectorAll(".moment-em-btn").forEach((b) => {
      b.addEventListener("click", () => {
        selectedEmoji = b.getAttribute("data-em");
        modal.querySelectorAll(".moment-em-btn").forEach((x) => x.classList.remove("border-pink-500", "bg-pink-100"));
        b.classList.add("border-pink-500", "bg-pink-100");
      });
    });

    document.getElementById("cancel-moment")?.addEventListener("click", () => modal.remove());
    document.getElementById("save-moment")?.addEventListener("click", () => {
      const text = document.getElementById("moment-text-input")?.value?.trim();
      if (text) {
        const newMoment = {
          id: Date.now(),
          author: this.currentUser ? this.currentUser.name : "Любимый",
          text,
          emoji: selectedEmoji,
          timestamp: Date.now()
        };
        this.state.moments = [newMoment, ...(this.state.moments || [])];
        this.saveState();
        this.render();

        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        }
      }
      modal.remove();
    });
  }

  startRelationshipTimer() {
    this.updateRelationshipTimer();
    this.timerInterval = setInterval(() => {
      this.updateRelationshipTimer();
    }, 1000);
  }

  updateRelationshipTimer() {
    const startDate = new Date(CONFIG.RELATIONSHIP_START_DATE).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - startDate);

    const seconds = Math.floor((diff / 1000) % 60);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    const elDays = document.getElementById("timer-days");
    const elHours = document.getElementById("timer-hours");
    const elMins = document.getElementById("timer-minutes");
    const elSecs = document.getElementById("timer-seconds");

    if (elDays) elDays.textContent = days;
    if (elHours) elHours.textContent = hours;
    if (elMins) elMins.textContent = minutes;
    if (elSecs) elSecs.textContent = seconds;
  }
}

window.vibe = new VibeController();
