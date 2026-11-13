/* ==========================================================================
   МОДУЛЬ УВЕДОМЛЕНИЙ ЧЕРЕЗ TELEGRAM BOT API (ZERO-BACKEND PUSH)
   ========================================================================== */

class NotifierService {
  constructor() {
    this.lastSentTimes = new Map();
    this.cooldownMs = 3000; // защита от спама (минимум 3 секунды между пушами)
  }

  /**
   * Отправка Push-уведомления партнеру в Telegram через официальный Bot API
   */
  async notifyPartner(action, senderUser) {
    if (!CONFIG.BOT_TOKEN || CONFIG.BOT_TOKEN.trim() === "") {
      console.log("[Notifier] BOT_TOKEN не указан в config.js. Push пропущен (только экранная анимация).");
      return false;
    }

    const partnerRole = senderUser.role === "him" ? "her" : "him";
    const partner = CONFIG.ALLOWED_USERS.find((u) => u.role === partnerRole);

    if (!partner || !partner.id) {
      console.warn("[Notifier] Не найден Telegram ID партнера.");
      return false;
    }

    // Проверка кулдауна
    const now = Date.now();
    const lastSent = this.lastSentTimes.get(action.id) || 0;
    if (now - lastSent < this.cooldownMs) {
      console.log("[Notifier] Кулдаун на отправку действия", action.id);
      return false;
    }
    this.lastSentTimes.set(action.id, now);

    // Формируем текст сообщения
    const messageTemplate = action.botMessage || "{emoji} {sender} отправил(а) тебе сигнал!";
    const formattedText = messageTemplate
      .replace(/{sender}/g, senderUser.name)
      .replace(/{emoji}/g, action.emoji);

    const fullMessage = `<b>${formattedText}</b>\n\n<i>Отправлено из «Наш Уголок ❤️»</i>`;

    const apiUrl = `https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/sendMessage`;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: partner.id,
          text: fullMessage,
          parse_mode: "HTML",
          disable_web_page_preview: true
        })
      });

      const data = await response.json();
      if (data.ok) {
        if (window.showToast) {
          window.showToast(`Уведомление отправлено ${partner.name} в Telegram 📲`, "success", 2000);
        }
        return true;
      } else {
        console.warn("[Notifier] Telegram Bot API ошибка:", data.description);
        // Если пользователь еще не запускал бота
        if (data.description?.includes("chat not found") || data.description?.includes("bot was blocked")) {
          if (window.showToast) {
            window.showToast(`${partner.name} нужно нажать /start в боте для получения пушей!`, "info", 3500);
          }
        }
        return false;
      }
    } catch (err) {
      console.warn("[Notifier] Ошибка сетевого запроса:", err);
      return false;
    }
  }
}

window.notifier = new NotifierService();

