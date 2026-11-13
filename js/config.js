/* ==========================================================================
   КОНФИГУРАЦИЯ ПРИВАТНОГО TELEGRAM MINI APP «НАШ УГОЛОК»
   ========================================================================== */

const CONFIG = {
  // Название вашего уголка
  APP_TITLE: "Наш Уголок ❤️",

  // Токен вашего Telegram-бота из @BotFather (для отправки Push-уведомлений партнеру)
  BOT_TOKEN: "9039695636:AAFu8_mT2fxJ29cvR3XeT6YpkNzRn2r1U00",

  // Дата начала ваших отношений (год, месяц, день, часы, минуты)
  RELATIONSHIP_START_DATE: "2026-09-15T21:36:00",

  // Белый список пользователей (Telegram ID).
  // Только эти два аккаунта получат доступ в приложение.
  ALLOWED_USERS: [
    {
      id: 923013813,
      name: "Любимый",
      partnerName: "Любимая",
      role: "him",
      avatar: "👨‍💻",
      loveLabel: "Баночка Его любви"
    },
    {
      id: 7918071171,
      name: "Любимая",
      partnerName: "Любимый",
      role: "her",
      avatar: "🌸",
      loveLabel: "Баночка Её любви"
    }
  ],

  // Режим разработки (в браузере вне Telegram)
  DEV_MODE: false,

  // Конфигурация Firebase Realtime Database для мгновенной синхронизации двоих
  FIREBASE: {
    apiKey: "AIzaSyCp8lZJciOazUugia3rd0IML5CS6BT3ky8",
    authDomain: "mylove-11c4c.firebaseapp.com",
    databaseURL: "https://mylove-11c4c-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "mylove-11c4c",
    storageBucket: "mylove-11c4c.firebasestorage.app",
    messagingSenderId: "743091752980",
    appId: "1:743091752980:web:0a8f229b183c521f00d701",
    measurementId: "G-77DSMMZP43"
  },

  // ==========================================================================
  // 10 ИНТЕРАКТИВНЫХ ДЕЙСТВИЙ И СИГНАЛОВ
  // ==========================================================================
  ACTIONS: [
    {
      id: "kiss",
      emoji: "💋",
      title: "Поцелуй",
      desc: "Сладкий поцелуйчик",
      bg: "from-rose-500 to-pink-500",
      haptic: "medium",
      botMessage: "💋 {sender} отправил(а) тебе нежный поцелуй!",
      screenAnim: "kiss"
    },
    {
      id: "hug",
      emoji: "🤗",
      title: "Крепкие обнимашки",
      desc: "Тёплое объятие сквозь километры",
      bg: "from-pink-500 to-rose-400",
      haptic: "heavy",
      botMessage: "🤗 {sender} крепко-крепко обнимает тебя и шлет тепло!",
      screenAnim: "hug"
    },
    {
      id: "pat",
      emoji: "💆‍♀️",
      title: "Погладить по головке",
      desc: "Ласка и забота, когда устал(а)",
      bg: "from-amber-400 to-orange-400",
      haptic: "light",
      botMessage: "💆‍♀️ {sender} нежно гладит тебя по голове: ты со всем справишься!",
      screenAnim: "pat"
    },
    {
      id: "bite",
      emoji: "😼",
      title: "Кусь!",
      desc: "Игривый кусь за щёчку",
      bg: "from-orange-500 to-amber-500",
      haptic: "rigid",
      botMessage: "😼 Хвать! {sender} сделал(а) тебе дерзкий игривый кусь! 🦷",
      screenAnim: "bite"
    },
    {
      id: "tickle",
      emoji: "🪶",
      title: "Пощекотать",
      desc: "Серия щекочущих прикосновений",
      bg: "from-emerald-400 to-teal-500",
      haptic: "light",
      botMessage: "🪶 {sender} пытается тебя пощекотать! Улыбнись! 🤭",
      screenAnim: "tickle"
    },
    {
      id: "pout",
      emoji: "🥺",
      title: "Дуюсь / Обидка",
      desc: "Маленькая обидка, нужно внимание",
      bg: "from-sky-400 to-blue-500",
      haptic: "warning",
      botMessage: "🥺 {sender} немного дуется... Срочно требуется порция внимания и вкусняшка! 🌧️🍬",
      screenAnim: "pout"
    },
    {
      id: "hands",
      emoji: "🧸",
      title: "Хочу на ручки",
      desc: "Сигнал пожалеть и укутать",
      bg: "from-purple-400 to-indigo-500",
      haptic: "soft",
      botMessage: "🧸 {sender} хочет на ручки! Срочно нужны обнимашки и тепло.",
      screenAnim: "hands"
    },
    {
      id: "sleepy",
      emoji: "🥱",
      title: "Хочу с тобой поспать",
      desc: "Слипаются глазки, сладких снов",
      bg: "from-indigo-500 to-violet-600",
      haptic: "light",
      botMessage: "🥱 {sender} засыпает и шлёт тебе сонный поцелуй перед сном 🌙✨",
      screenAnim: "sleepy"
    },
    {
      id: "support",
      emoji: "✨",
      title: "Ты справишься!",
      desc: "Лучи веры и мощная поддержка",
      bg: "from-yellow-400 to-amber-500",
      haptic: "success",
      botMessage: "✨ {sender} верит в тебя всем сердцем! Ты со всем справишься, ты умничка! 💖",
      screenAnim: "support"
    },
    {
      id: "urgent_call",
      emoji: "🚨",
      title: "Срочно нужен созвон!",
      desc: "Очень соскучился(лась), набери",
      bg: "from-red-500 to-rose-600",
      haptic: "error",
      botMessage: "🚨 ВНИМАНИЕ! {sender} очень сильно скучает и просит срочный созвон! 📞💖",
      screenAnim: "call"
    }
  ],

  // Параметры питомца по умолчанию
  PET_DEFAULT: {
    name: "Пися",
    type: "cat",
    satiety: 85,
    happiness: 90,
    cleanliness: 95,
    outfit: "none",
    isWalking: false,
    walkingStartTime: null,
    lastUpdate: Date.now()
  },

  PET_DECAY: {
    satietyPerHour: 5,
    happinessPerHour: 4,
    cleanlinessPerHour: 3
  },

  PET_FOODS: [
    { id: "cookie", name: "Печенька", icon: "🍪", satiety: +15, happy: +5 },
    { id: "cake", name: "Любимый десерт", icon: "🍰", satiety: +25, happy: +10 },
    { id: "strawberry", name: "Клубничка", icon: "🍓", satiety: +10, happy: +10 },
    { id: "pizza", name: "Пицца на двоих", icon: "🍕", satiety: +30, happy: +15 },
    { id: "bubbletea", name: "Бабл-ти", icon: "🧋", satiety: +15, happy: +20 }
  ],

  PET_OUTFITS: [
    { id: "none", name: "Без ничего", icon: "✨" },
    { id: "hat", name: "Тёплая шапочка", icon: "🧢" },
    { id: "scarf", name: "Уютный шарфик", icon: "🧣" },
    { id: "glasses", name: "Очки-сердечки", icon: "👓" },
    { id: "bow", name: "Розовый бантик", icon: "🎀" },
    { id: "crown", name: "Корона принцессы", icon: "👑" }
  ],

  // Пресеты ритма сердца для «Сердца в унисон»
  HEART_RATES: [
    { bpm: 60, emoji: "☕", label: "Спокойно", desc: "Рядом в мыслях", duration: "1.0s" },
    { bpm: 90, emoji: "💌", label: "Трепет", desc: "Вспоминаю с улыбкой", duration: "0.67s" },
    { bpm: 125, emoji: "🥺", label: "Скучаю", desc: "Очень не хватает тебя", duration: "0.48s" },
    { bpm: 160, emoji: "🔥", label: "Зашкаливает", desc: "Сердце выскакивает из груди!", duration: "0.375s" }
  ],

  MOOD_PRESETS: [
    { emoji: "☕", label: "Уютно и тепло", desc: "Пьем чай и греемся" },
    { emoji: "✨", label: "Энергия на максимуме", desc: "Готовы покорять мир" },
    { emoji: "🥰", label: "Полное счастье", desc: "Летаю в облаках от любви" },
    { emoji: "😴", label: "Хочу спатки", desc: "Нужен мягкий пледик и сонный звонок" },
    { emoji: "🧸", label: "Хочу на ручки", desc: "Срочно требуются обнимашки" },
    { emoji: "💪", label: "В работе / Делах", desc: "Продуктивно тружусь" }
  ],

  MISS_LEVELS: [
    { level: 20, emoji: "💭", title: "Рядом в мыслях", color: "text-blue-400" },
    { level: 40, emoji: "💌", title: "Вспоминаю с улыбкой", color: "text-indigo-400" },
    { level: 60, emoji: "🥺", title: "Очень не хватает тебя", color: "text-pink-400" },
    { level: 80, emoji: "💔", title: "Сильно-сильно скучаю", color: "text-rose-500" },
    { level: 100, emoji: "😭💖", title: "Скучаю безумно, срочно нужен созвон!", color: "text-red-500" }
  ],

  // Круглые даты для особых поздравлений (в днях)
  MILESTONE_DAYS: [7, 14, 21, 30, 50, 60, 75, 100, 150, 200, 250, 300, 365, 500, 730]
};

window.CONFIG = CONFIG;
