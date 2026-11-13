/* ==========================================================================
   МОДУЛЬ ХРАНИЛИЩА (FIREBASE REALTIME DATABASE + LOCALSTORAGE + CLOUDSTORAGE)
   Мгновенная синхронизация в реальном времени между двумя устройствами
   ========================================================================== */

class StorageManager {
  constructor() {
    this.tg = window.Telegram?.WebApp;
    this.hasCloudStorage = Boolean(this.tg?.CloudStorage && typeof this.tg.CloudStorage.getItem === "function");
    this.cache = new Map();
    this.listeners = new Map(); // key -> Set(callbacks)
    this.firebaseDb = null;
    this.isFirebaseReady = false;

    this.initFirebase();
  }

  /**
   * Инициализация Firebase Realtime Database
   */
  initFirebase() {
    if (window.firebase && window.CONFIG?.FIREBASE?.databaseURL) {
      try {
        if (!firebase.apps || !firebase.apps.length) {
          firebase.initializeApp(window.CONFIG.FIREBASE);
        }
        this.firebaseDb = firebase.database();
        this.isFirebaseReady = true;
        console.log("[StorageManager] 🔥 Firebase Realtime Database connected!");

        // Если были отложенные подписки до готовности
        this.listeners.forEach((cbs, key) => {
          this.attachFirebaseListener(key);
        });
      } catch (err) {
        console.warn("[StorageManager] Firebase init error:", err);
      }
    } else {
      console.warn("[StorageManager] Firebase SDK or config missing. Using fallback storage.");
    }
  }

  attachFirebaseListener(key) {
    if (!this.isFirebaseReady || !this.firebaseDb) return;
    const sanitizedKey = this.sanitizeKey(key);
    const dbRef = this.firebaseDb.ref(`shared/${sanitizedKey}`);

    dbRef.on("value", (snapshot) => {
      const val = snapshot.val();
      if (val !== null && val !== undefined) {
        this.cache.set(key, val);
        try {
          localStorage.setItem(`app_${key}`, JSON.stringify(val));
        } catch (e) {}

        const cbs = this.listeners.get(key);
        if (cbs) {
          cbs.forEach((cb) => {
            try { cb(val); } catch (err) { console.error(err); }
          });
        }
      }
    });
  }

  /**
   * Подписка на изменение ключа в реальном времени (WebSockets)
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
      this.attachFirebaseListener(key);
    }
    this.listeners.get(key).add(callback);

    return () => {
      const cbs = this.listeners.get(key);
      if (cbs) cbs.delete(callback);
    };
  }

  sanitizeKey(key) {
    return key.replace(/[.#$[\]]/g, "_");
  }

  notify(key, value) {
    const cbs = this.listeners.get(key);
    if (cbs) {
      cbs.forEach((cb) => {
        try {
          cb(value);
        } catch (e) {
          console.error("[StorageManager] Error in listener:", e);
        }
      });
    }
  }

  /**
   * Получить значение по ключу (Promise)
   */
  async get(key, defaultValue = null) {
    // 1. Сначала пробуем получить свежайшие данные из Firebase
    if (this.isFirebaseReady && this.firebaseDb) {
      try {
        const sanitizedKey = this.sanitizeKey(key);
        const snapshot = await this.firebaseDb.ref(`shared/${sanitizedKey}`).once("value");
        const val = snapshot.val();
        if (val !== null && val !== undefined) {
          this.cache.set(key, val);
          return val;
        }
      } catch (e) {
        console.warn(`[StorageManager] Firebase get error for '${key}':`, e);
      }
    }

    // 2. Проверяем кэш в памяти
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // 3. Fallback: Telegram CloudStorage
    try {
      let raw = null;
      if (this.hasCloudStorage) {
        raw = await new Promise((resolve) => {
          this.tg.CloudStorage.getItem(key, (err, result) => {
            if (err) resolve(null);
            else resolve(result);
          });
        });
      }

      // 4. Fallback: localStorage
      if (raw === null || raw === undefined || raw === "") {
        raw = localStorage.getItem(`app_${key}`);
      }

      if (raw !== null && raw !== undefined && raw !== "") {
        const parsed = JSON.parse(raw);
        this.cache.set(key, parsed);
        return parsed;
      }
    } catch (e) {
      console.warn(`[StorageManager] Parse error for key '${key}':`, e);
    }

    this.cache.set(key, defaultValue);
    return defaultValue;
  }

  /**
   * Записать значение по ключу (Promise + Мгновенная синхронизация)
   */
  async set(key, value) {
    this.cache.set(key, value);
    const jsonStr = JSON.stringify(value);

    // 1. Пишем в локальный кэш
    try {
      localStorage.setItem(`app_${key}`, jsonStr);
    } catch (e) {}

    // 2. Отправляем в Firebase Realtime Database
    if (this.isFirebaseReady && this.firebaseDb) {
      try {
        const sanitizedKey = this.sanitizeKey(key);
        await this.firebaseDb.ref(`shared/${sanitizedKey}`).set(value);
      } catch (e) {
        console.warn(`[StorageManager] Firebase set error for '${key}':`, e);
      }
    }

    // 3. Сохраняем в Telegram CloudStorage
    if (this.hasCloudStorage) {
      this.tg.CloudStorage.setItem(key, jsonStr, () => {});
    }

    this.notify(key, value);
    return true;
  }

  /**
   * Пакетная загрузка нескольких ключей
   */
  async getAll(keysWithDefaults) {
    const results = {};
    for (const [key, defVal] of Object.entries(keysWithDefaults)) {
      results[key] = await this.get(key, defVal);
    }
    return results;
  }

  /**
   * Очистить кэш в памяти
   */
  clearMemoryCache() {
    this.cache.clear();
  }
}

// Экземпляр синглтона
window.storage = new StorageManager();
