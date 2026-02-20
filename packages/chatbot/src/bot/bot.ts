import { isString, useEvent, type EventRaiser } from '@mirta/basics'
import type { BotHost, Outgoing, Incoming } from '#types'
import { TOPICS } from '#host/device'
import { createMessageBuilder } from './message.builder'
import type { CommandHandler, CallbackHandler, Bot, DoneOptions, MessageBuilder } from './types'

/**
 * Создаёт функцию ответа для конкретного чата.
 *
 * Функция поддерживает несколько перегрузок:
 * - `reply(text: string)` — отправка текста
 * - `reply(text: string, setup: (b) => void)` — отправка текста с клавиатурой или разметкой
 * - `reply(message: Outgoing)` — отправка готового исходящего сообщения
 *
 * @param host - Хост бота, отвечающий за отправку сообщений
 * @param chatId - Идентификатор чата, в который будут отправляться ответы
 * @returns Функция `send`, которую можно использовать в обработчиках
 *
 * @internal Используется внутри `createBot` для привязки контекста чата
 *
 * @since 0.4.12
 *
 **/
const createSendFunc = (host: BotHost, chatId: number | string) => (textOrMessage: string | Outgoing, setup?: (b: MessageBuilder) => void) => {

  // Перегрузка: передано готовое сообщение (не строка)
  if (typeof textOrMessage !== 'string') {

    host.send(textOrMessage)
    return

  }

  // Перегрузка: только текст, без настроек
  if (!setup) {

    host.send({
      type: 'regular',
      chatId: chatId,
      text: textOrMessage,
      timestamp: Date.now(),
    })

    return

  }

  // Перегрузка: текст + настройки (клавиатура, разметка и т.д.)
  const message: Outgoing = {
    type: 'regular',
    chatId: chatId,
    text: textOrMessage,
    timestamp: Date.now(),
  }

  log.debug('[Bot] Creating message')

  // Перегрузка: (text, setup)
  const builder = createMessageBuilder(message)

  // Устанавливаем MarkdownV2 по умолчанию
  builder.parseMode('MarkdownV2')

  // Применяем пользовательские настройки
  setup(builder)

  // Отправляем сообщение через хост
  host.send(message)

}

/**
 * Создаёт экземпляр чат-бота, привязанный к хосту.
 *
 * Бот отвечает за:
 * - Инициализацию хоста
 * - Прослушивание входящих сообщений через `defineRule`
 * - Маршрутизацию команд и callback-запросов
 * - Регистрацию обработчиков через `.onCommand()` и `.onCallback()`
 * - Отправку ответов через встроенные функции
 *
 * Все обработчики типобезопасны — имена команд и колбэков выводятся из
 * параметров `TCommand` и `TCallback`, полученных из конфигурации.
 *
 * @param host - Хост бота, реализующий `BotHost` (инициализация, отправка)
 * @returns Объект `Bot` с методами для регистрации обработчиков
 *
 * @example
 * ```ts
 *   const bot = createBot(host);
 *
 *   bot.onCommand('start', (ctx, reply) => {
 *     reply('Привет!', b => b.inlineKeyboard(k => k.row(r => r.text('Кнопка', t => t.callback('click')))));
 *   });
 *
 *   bot.onCallback('click', (ctx, done) => {
 *     done('Вы нажали кнопку!');
 *   });
 * ```
 * @since 0.4.8
 *
 **/
export function createBot<
  TCommand extends string,
  TCallback extends string
>(host: BotHost): Bot<TCommand, TCallback> {

  // Инициализируем хост (запускает polling, настраивает таймеры)
  host.initialize()

  // Хранилище событий для команд и колбэков
  const commandEvents: Record<string, EventRaiser<CommandHandler>> = {}
  const callbackEvents: Record<string, EventRaiser<CallbackHandler>> = {}

  // Основное правило: реагирует на изменения во входящей очереди
  defineRule({
    whenChanged: `${host.deviceName}/${TOPICS.incoming}`,
    then: (value) => {

      // Проверяем, что значение — строка (JSON)
      if (!isString(value))
        return

      // Парсим входящее сообщение
      const context = JSON.parse(value) as Incoming

      // Обработка команды
      if (context.type === 'command') {

        if (context.command in commandEvents)
          commandEvents[context.command].raise(
            context,
            createSendFunc(host, context.chatId)
          )

      }
      // Обработка колбэка
      else {

        if (!(context.data in callbackEvents))
          return

        // Вызываем обработчики колбэка
        // `done` — функция подтверждения нажатия кнопки

        callbackEvents[context.data].raise(
          context,
          (text?: string, options?: DoneOptions) => {

            host.send({
              type: 'raw',
              method: 'answerCallbackQuery',
              payload: {
                callback_query_id: context.id,
                text,
                show_alert: options?.showAlert,
                url: options?.url,
              },
              timestamp: Date.now(),
            })

          })

      }

    },
  })

  return {

    onCommand(
      name: TCommand,
      handler: CommandHandler
    ) {

      // Лениво создаём событие
      if (!(name in commandEvents))
        commandEvents[name] = useEvent<CommandHandler>()

      commandEvents[name].on(handler)

      return this

    },

    onCallback(
      name: TCallback,
      handler: CallbackHandler
    ) {

      if (!(name in callbackEvents))
        callbackEvents[name] = useEvent<CallbackHandler>()

      callbackEvents[name].on(handler)

      return this

    },

    sendMessage(
      chatId: number | string,
      text: string,
      setup?: (builder: MessageBuilder) => void
    ) {

      const send = createSendFunc(host, chatId)
      send(text, setup)

    },
  }

}
