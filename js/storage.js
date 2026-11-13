/* ==========================================================================
   МОДУЛЬ ХРАНИЛИЩА (TELEGRAM CLOUD STORAGE + LOCAL STORAGE FALLBACK)
   ========================================================================== */

class StorageManager {
  constructor() {
    this.tg = window.Telegram?.WebApp;
    this.hasCloudStorage = Boolean(this.tg?.CloudStorage && typeof this.tg.CloudStorage.getItem === "function");
    this.cache = new Map();
    this.listeners = new Set();
    console.log(`[StorageManager] Mode: ${this.hasCloudStorage ? "Telegram CloudStorage" : "localStorage Fallback"}`);
  }

  /**
   * Подписаться на события изменения состояния
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(key, value) {
    this.listeners.forEach((cb) => {
      try {
        cb(key, value);
      } catch (e) {
        console.error("[StorageManager] Error in listener:", e);
      }
    });
  }

  /**
   * Получить значение по ключу (Promise)
   */
  async get(key, defaultValue = null) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    try {
      let raw = null;
      if (this.hasCloudStorage) {
        raw = await new Promise((resolve) => {
          this.tg.CloudStorage.getItem(key, (err, result) => {
            if (err) {
              console.warn(`[StorageManager] CloudStorage getItem error for '${key}':`, err);
              resolve(null);
            } else {
              resolve(result);
            }
          });
        });
      }

      // Если в CloudStorage пусто или ошибка — пробуем localStorage
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
   * Записать значение по ключу (Promise)
   */
  async set(key, value) {
    this.cache.set(key, value);
    const jsonStr = JSON.stringify(value);

    // Всегда пишем в localStorage как локальный кэш
    try {
      localStorage.setItem(`app_${key}`, jsonStr);
    } catch (e) {
      console.warn("[StorageManager] localStorage write error:", e);
    }

    // Если доступен Telegram CloudStorage — пишем в облако Telegram
    if (this.hasCloudStorage) {
      await new Promise((resolve) => {
        this.tg.CloudStorage.setItem(key, jsonStr, (err, stored) => {
          if (err) {
            console.warn(`[StorageManager] CloudStorage setItem error for '${key}':`, err);
            resolve(false);
          } else {
            resolve(stored);
          }
        });
      });
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

