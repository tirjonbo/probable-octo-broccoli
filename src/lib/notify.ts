import "server-only";

/**
 * Заглушка уведомлений. Сейчас пишет в лог сервера.
 * Сюда подключается Telegram-бот менеджерам, SMS (Eskiz, Play Mobile) или e-mail клиенту.
 */
export function notify(event: string, payload: Record<string, unknown>) {
  console.log(`[notify] ${event}`, JSON.stringify(payload));
}
