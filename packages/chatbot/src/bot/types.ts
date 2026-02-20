/* eslint-disable @typescript-eslint/unified-signatures */

import type { InlineKeyboardBuilder, ReplyKeyboardBuilder } from '#keyboard'
import type { Outgoing, IncomingCommand, IncomingCallback } from '#types'

/**
 * Минимальный интерфейс построителя сообщения.
 *
 * @since 0.4.12
 *
 **/
export interface MinimalMessageBuilder {

  /**
   * Устанавливает режим разметки текста.
   *
   * Поддерживаемые режимы:
   * - `'HTML'` — разметка в стиле HTML
   * - `'MarkdownV2'` — разметка в стиле Markdown (Telegram)
   *
   * @param mode - Режим разметки
   * @returns Текущий экземпляр билдера для построения цепочки вызовов
   **/
  parseMode(mode: 'HTML' | 'MarkdownV2'): this

}

/**
 * Интерфейс построителя сообщения.
 *
 * Позволяет форматировать исходящее сообщение с использованием:
 * - Инлайн-клавиатур
 * - Reply-клавиатур
 * - Специального режима разметки (HTML, MarkdownV2)
 * - Удаления текущей клавиатуры
 *
 * @example
 * ```ts
 * reply('Выберите действие:', b => b
 *   .inlineKeyboard(k => {
 *     k.row(r => r
 *       .text('Включить свет', t => t
 *         .callback('light_on')
 *       )
 *     )
 *   })
 * })
 * ```
 * @since 0.4.12
 *
 **/
export interface MessageBuilder extends MinimalMessageBuilder {

  /**
   * Добавляет inline-клавиатуру, которая отображается в чате
   * под сообщением бота.
   *
   * После вызова этого метода другие методы установки клавиатуры
   * становятся недоступны, так как Telegram не поддерживает
   * их одновременное использование.
   *
   * @param setup - Функция для настройки структуры клавиатуры
   * @returns Объект с ограниченным интерфейсом (только `parseMode`)
   *
   **/
  inlineKeyboard(setup: (k: InlineKeyboardBuilder) => void): MinimalMessageBuilder

  /**
   * Добавляет reply-клавиатуру, которая предлагает пользователю
   * готовые варианты ответа.
   *
   * После вызова этого метода другие методы установки клавиатуры
   * становятся недоступны, так как Telegram не поддерживает
   * их одновременное использование.
   *
   * @param setup - Функция для настройки кнопок клавиатуры
   * @returns Объект с ограниченным интерфейсом (только `parseMode`)
   *
   **/
  replyKeyboard(setup: (k: ReplyKeyboardBuilder) => void): MinimalMessageBuilder

  /**
   * Добавляет команду удаления текущей клавиатуры.
   *
   * Полезно для очистки интерфейса после действий.
   *
   * После вызова этого метода другие методы установки клавиатуры
   * становятся недоступны, так как Telegram не поддерживает
   * их одновременное использование.
   *
   * @returns Объект с ограниченным интерфейсом (только `parseMode`)
   *
   **/
  removeKeyboard(): MinimalMessageBuilder

}

/**
 * Функция отправки ответа в чат.
 *
 * Поддерживает три перегрузки:
 * 1. `reply(text: string)` — простой текст
 * 2. `reply(text: string, setup: (b) => void)` — текст с клавиатурой или разметкой
 * 3. `reply(outgoing: Outgoing)` — готовый объект исходящего сообщения
 *
 * Является основным способом взаимодействия с пользователем в обработчике.
 *
 * @since 0.4.8
 *
 **/
export interface ReplyFunc {

  /**
   * Отправляет текстовое сообщение.
   *
   * @param text - Текст сообщения
   *
   **/
  (text: string): void

  /**
   * Отправляет текстовое сообщение с дополнительными элементами интерфейса.
   *
   * @param text - Текст сообщения
   * @param setup - Функция для настройки клавиатуры, разметки и т.д.
   *
   **/
  (text: string, setup: (builder: MessageBuilder) => void): void

  /**
   * Отправляет готовое исходящее сообщение.
   *
   * Полезно для сложных сценариев, когда нужно отправить фото, документ или вызвать метод API.
   *
   * @param outgoing - Объект исходящего сообщения
   *
   **/
  (outgoing: Outgoing): void

}

/**
 * Обработчик команды.
 *
 * Вызывается при получении команды от пользователя (например, `/start`).
 *
 * @param context - Объект входящей команды (чат, пользователь, аргументы)
 * @param reply - Функция для отправки ответа
 *
 * @example
 * ```ts
 * const handler: CommandHandler = (ctx, reply) => {
 *   reply(`Привет, ${ctx.username}!`);
 * };
 * ```
 * @since 0.4.8
 *
 **/
export type CommandHandler = (
  context: IncomingCommand,
  reply: ReplyFunc
) => void

/**
 * Параметры для подтверждения нажатия кнопки.
 *
 * @since 0.4.8
 *
 **/
export interface DoneOptions {

  /**
   * Показать всплывающее уведомление (алерт)
   * @default false
   *
   **/
  showAlert?: boolean

  /**
   * URL для перехода после нажатия
   *
   **/
  url?: string

  /**
   * Время кэширования результата (в секундах)
   *
   **/
  cacheTime?: number

}

/**
 * Функция подтверждения нажатия кнопки.
 *
 * Используется в обработчиках колбэков для ответа на нажатие инлайн-кнопки.
 * Может использоваться без параметров (простое подтверждение) или с текстом/настройками.
 *
 * @example
 * ```ts
 * done(); // Подтвердить нажатие без уведомления
 * done('Свет включён!'); // Показать сообщение
 * done('Ошибка', { showAlert: true }); // Показать всплывающее окно
 * ```
 *
 * @since 0.4.8
 *
 **/
export interface DoneCallbackFunc {

  /**
   * Подтверждает нажатие кнопки без дополнительного уведомления.
   *
   **/
  (): void

  /**
   * Подтверждает нажатие и показывает пользователю текстовое уведомление.
   *
   * @param text - Текст уведомления
   * @param options - Дополнительные параметры отображения
   *
   **/
  (text: string, options?: DoneOptions): void

}

/**
 * Обработчик callback-запроса.
 *
 * Вызывается при нажатии пользователем на инлайн-кнопку.
 *
 * @param context - Объект входящего колбэка (идентификатор, данные, чат)
 * @param done - Функция для подтверждения нажатия
 *
 * @example
 * ```ts
 * const handler: CallbackHandler = (ctx, done) => {
 *   log('Нажата кнопка:', ctx.data);
 *   done('Действие выполнено!');
 * };
 * ```
 * @since 0.4.8
 *
 **/
export type CallbackHandler = (
  context: IncomingCallback,
  done: DoneCallbackFunc
) => void

/**
 * Основной интерфейс чат-бота.
 *
 * Предоставляет методы для регистрации обработчиков команд и колбэков,
 * а также для отправки сообщений.
 *
 * Экземпляр `Bot` создаётся через `createBot()` и привязывается к хосту.
 *
 * @typeParam TCommand - Список допустимых команд (выводится из конфигурации)
 * @typeParam TCallback - Список допустимых колбэков (выводится из конфигурации)
 *
 * @example
 * ```ts
 * const bot = createBot(host);
 *
 * bot.onCommand('start', (ctx, reply) => {
 *   reply('Добро пожаловать!');
 * });
 *
 * bot.onCallback('toggle', (ctx, done) => {
 *   done('Переключено');
 * });
 * ```
 * @since 0.4.8
 *
 **/
export interface Bot<
  TCommand extends string,
  TCallback extends string
> {
  /**
   * Регистрирует обработчик команды.
   *
   * @param name - Имя команды (например, 'start')
   * @param handler - Функция, вызываемая при получении команды
   * @returns Текущий экземпляр бота (для цепочки вызовов)
   *
   * @example
   * ```ts
   * bot.onCommand('help', (ctx, reply) => {
   *   reply('Доступные команды: /start, /status');
   * });
   * ```
   **/
  onCommand(
    name: TCommand,
    handler: CommandHandler
  ): Bot<TCommand, TCallback>

  /**
   * Регистрирует обработчик callback-запроса (нажатие кнопки).
   *
   * @param name - Идентификатор колбэка (например, 'volume_up')
   * @param handler - Функция, вызываемая при нажатии
   * @returns Текущий экземпляр бота
   *
   * @example
   * ```ts
   * bot.onCallback('toggle_light', (ctx, done) => {
   *   // ... переключение света ...
   *   done('Свет переключен');
   * });
   * ```
   **/
  onCallback(
    name: TCallback,
    handler: CallbackHandler
  ): Bot<TCommand, TCallback>

  /**
   * Отправляет текстовое сообщение указанному пользователю.
   *
   * @param chatId - Идентификатор чата
   * @param text - Текст сообщения
   * @param setup - Функция для настройки клавиатуры, разметки и т.д.
   *
   **/
  sendMessage(chatId: number, text: string, setup?: (builder: MessageBuilder) => void): void

  /**
   * Отправляет текстовое сообщение пользователю по username.
   *
   * @param username - Имя пользователя (например, '@username')
   * @param text - Текст сообщения
   * @param setup - Функция для настройки клавиатуры, разметки и т.д.
   *
   **/
  sendMessage(username: string, text: string, setup?: (builder: MessageBuilder) => void): void

}
