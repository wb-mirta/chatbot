import { defineTelegramBot, defineAuthorization } from '@mirta/chatbot'

/**
 * Конфигурация системы авторизации для Telegram-бота.
 *
 * Определяет две политики:
 * - `admin`: доступ для администраторов
 * - `subscriber`: доступ для подписчиков (например, Boosty)
 *
 * Особенности:
 * - `admin`: разрешён доступ либо по ID пользователя и чата, либо по ID чата,
 *   но с запретом для конкретного пользователя (через `deny`)
 * - `subscriber`: доступ только в супергруппе с указанным ID
 *
 * @note Правило `deny` имеет приоритет — доступ запрещён,
 *       даже если есть подходящие `allow`.
 **/
const auth = defineAuthorization(a => a
  // Политика: администраторы
  .addPolicy('admin', p => p
    // Разрешить, если: пользователь указан и находится в нужном чате
    .allow(r => r
      .userId(process.env.APP_TELEGRAM_USER)
      .chatId('123123123')
    )
    // Или: любой пользователь из чата-админки
    .allow(r => r.chatId('987654321'))
    // Запретить конкретного пользователя, даже если он в разрешённой группе
    .deny(r => r.userId('123456789'))
  )
  // Политика: подписчики Boosty (доступ только в супергруппе)
  .addPolicy('subscriber', p => p
    .allow(r => r
      .chatId('987654321')
      .chatType('supergroup')
    )
  )
)

/**
 * Функция для получения экземпляра Telegram-бота.
 *
 * Создаёт типобезопасный бот с привязкой к:
 * - Авторизации (`auth`)
 * - Конфигурации устройства (`deviceName`, `deviceTitle`)
 * - Токену бота
 * - Списку команд и колбэков с политиками доступа
 *
 * @returns Функция `useTelegramBot`, возвращающая синглтон-экземпляр бота
 *
 * @example
 * ```ts
 * const bot = useTelegramBot();
 * bot.onCommand('start', (ctx, reply) => { ... }); // Доступ только для 'admin'
 * ```
 */
export const useTelegramBot = defineTelegramBot(auth, {
  deviceName: 'telegram',
  deviceTitle: 'Telegram Bot',
  token: process.env.APP_TELEGRAM_TOKEN,
  commands: {
    start: { policy: 'admin' },
    show_keyboard: { policy: 'admin' },
    reboot: { policy: 'subscriber' },
  },
  callbacks: {
    hello: { policy: 'admin' },
  },
})
