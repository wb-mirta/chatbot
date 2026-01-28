/**
 * Базовый интерфейс для входящих сообщений.
 *
 * @since 0.4.8
 *
 **/
export interface IncomingBase {
  /** ID чата */
  chatId: number
  /** Уникальный идентификатор сообщения */
  messageId: string
  /** Username пользователя (если есть) */
  username?: string
  /** Время получения (метка времени) */
  timestamp: number
}

/**
 * Входящая команда (например, `/start`, `/help`).
 *
 * @since 0.4.8
 *
 **/
export interface IncomingCommand extends IncomingBase {
  type: 'command'
  /** Имя команды без слеша */
  command: string
  /** Аргументы команды (оставшаяся часть строки) */
  args: string
}

/**
 * Входящий callback-запрос (нажатие кнопки).
 *
 * @since 0.4.8
 *
 */
export interface IncomingCallback extends IncomingBase {
  type: 'callback'
  /** Уникальный ID запроса (для подтверждения) */
  id: string
  /** Данные, привязанные к кнопке */
  data: string
}

/**
 * Тип объединения всех входящих событий.
 *
 * @since 0.4.8
 *
 **/
export type Incoming = IncomingCommand | IncomingCallback

/**
 * Общий контекст исходящего сообщения.
 *
 * @since 0.4.8
 *
 **/
export interface OutgoingContext {
  /** Время создания сообщения */
  timestamp: number
}

/**
 * Стандартное исходящее сообщение (текст, фото, документ и т.д.).
 *
 * @since 0.4.8
 *
 **/
export interface OutgoingRegular extends OutgoingContext {
  type: 'regular'
  /** ID чата, куда отправлять */
  chatId: number | string
  /** Текст сообщения */
  text?: string
  /** Встроенная клавиатура */
  keyboard?: KeyboardMarkup
  /** URL фото */
  photo?: string
  /** URL документа */
  document?: string
  /** Подпись к медиа */
  caption?: string
  /** Режим разметки: HTML или MarkdownV2 */
  parseMode?: 'HTML' | 'MarkdownV2'
}

/**
 * "Сырой" запрос к API мессенджера (напр. answerCallbackQuery).
 *
 * @since 0.4.8
 *
 **/
export interface OutgoingRaw extends OutgoingContext {
  type: 'raw'
  /** Название метода API */
  method: string
  /** Параметры вызова */
  payload: Record<string, unknown>
}

/**
 * Тип объединения всех исходящих сообщений.
 *
 * @since 0.4.8
 *
 **/
export type Outgoing = OutgoingRegular | OutgoingRaw

/**
 * Интерфейс хоста бота — точка интеграции с системой.
 *
 * @since 0.4.8
 *
 **/
export interface BotHost {
  /** Имя виртуального устройства */
  readonly deviceName: string
  /** Инициализация хоста (запуск таймеров, очередей) */
  initialize(): void
  /** Постановка сообщения в очередь на отправку */
  send(outgoing: Outgoing): void
}

/**
 * Конфигурация действия (команды или колбэка) с политикой доступа.
 *
 * @since 0.4.8
 *
 **/
export interface ActionConfig<TPolicy> {
  /** Имя политики авторизации */
  policy: TPolicy
  /** Описание действия (для справки) */
  description?: string
}

/**
 * Универсальный тип конфигурации: карта имени действия → настройки.
 *
 * @since 0.4.8
 *
 **/
export type Config<TPolicy extends string, TValue extends string>
  = Record<TValue, ActionConfig<TPolicy>>

/**
 * Параметры бота: общая конфигурация для создания экземпляра.
 *
 * @template TPolicy — Тип политик доступа
 * @template TCommand — Тип поддерживаемых команд
 * @template TCallback — Тип поддерживаемых колбэков
 *
 * @since 0.4.8
 *
 **/
export interface BotOptions<
  TPolicy extends string,
  TCommand extends string,
  TCallback extends string
> {

  /** Имя виртуального устройства */
  deviceName: string
  /** Отображаемое название в интерфейсе */
  deviceTitle: WbRules.Title
  /** Токен авторизации в API мессенджера */
  token: string
  /** Интервал опроса обновлений (мс) */
  pollInterval?: number
  /** Интервал публикации в MQTT (мс) */
  mqttInterval?: number
  /** Таймаут опроса (сек) */
  pollTimeout?: number
  /** Таймаут отправки (сек) */
  sendTimeout?: number
  /** Макс. кол-во обновлений за раз */
  incomingLimit?: number
  /** Конфигурация команд */
  commands?: Config<TPolicy, TCommand>
  /** Конфигурация колбэков */
  callbacks?: Config<TPolicy, TCallback>

}

// =============================================================================
// 🧩 Интерфейсы для адаптеров
// =============================================================================

/**
 * Общие параметры для адаптера мессенджера.
 *
 * @since 0.4.8
 *
 **/
export interface AdapterOptions {
  /** Лимит обновлений */
  incomingLimit?: number
  /** Таймаут опроса */
  pollTimeout?: number
  /** Таймаут отправки */
  sendTimeout?: number
}

/**
 * Фабрика создания адаптера.
 *
 * @since 0.4.8
 *
 **/
export type BotAdapterFactory = (deviceName: string) => BotAdapter

/**
 * Единый интерфейс для всех адаптеров мессенджеров.
 *
 * Реализуется для Telegram, MAX и других платформ.
 *
 * @since 0.4.8
 *
 **/
export interface BotAdapter {

  /**
   * Опрашивает API на предмет новых сообщений.
   * @param resolve — при успехе
   * @param reject — при ошибке
   *
   **/
  poll: (resolve: () => void, reject: () => void) => void

  /** Отправляет сообщение через мессенджер. */
  send: (regular: OutgoingRegular, context: { resolve: () => void, reject: () => void }) => void

  /** Отправляет произвольный запрос к API. */
  sendRaw: (raw: OutgoingRaw, context: { resolve: () => void, reject: () => void }) => void

}

/**
 * Кнопка инлайн-клавиатуры.
 *
 * @since 0.4.8
 *
 **/
export interface InlineKeyboardButton {
  text: string
  callback_data?: string
  url?: string
  request_contact?: boolean
  request_location?: boolean
  switch_inline_query?: string
  switch_inline_query_current_chat?: string
  login_url?: {
    url: string
    forward_text?: string
    bot_username?: string
    request_write_access?: boolean
  }
  callback_game?: Record<string, unknown>
  pay?: boolean
}

/**
 * Структура инлайн-клавиатуры (массив строк кнопок).
 *
 * @since 0.4.8
 *
 **/
export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][]
}

/**
 * Кнопка reply-клавиатуры.
 *
 * @since 0.4.8
 *
 **/
export interface ReplyKeyboardButton {
  text: string
  request_contact?: boolean
  request_location?: boolean
}

/**
 * Структура reply-клавиатуры.
 *
 * @since 0.4.8
 *
 **/
export interface ReplyKeyboardMarkup {
  keyboard: ReplyKeyboardButton[][]
  resize_keyboard?: boolean
  one_time_keyboard?: boolean
  selective?: boolean
}

/**
 * Команда удаления текущей клавиатуры.
 *
 * @since 0.4.8
 *
 **/
export interface ReplyKeyboardRemove {
  remove_keyboard: true
  selective?: boolean
}

/**
 * Объединение всех типов клавиатур.
 *
 * @since 0.4.8
 *
 **/
export type KeyboardMarkup = InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove
