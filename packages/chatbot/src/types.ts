import type { KeyboardMarkup } from '#keyboard/types';

/**
 * Базовый интерфейс для входящих сообщений.
 *
 * @since 0.4.8
 *
 **/
export interface IncomingBase {
  /** ID чата */
  chatId: number;
  /** Уникальный идентификатор сообщения */
  messageId: string;
  /** Username пользователя (если есть) */
  username?: string;
  /** Время получения (метка времени) */
  timestamp: number;
}

/**
 * Входящая команда (например, `/start`, `/help`).
 *
 * @since 0.4.8
 *
 **/
export interface IncomingCommand extends IncomingBase {
  type: 'command';
  /** Имя команды без слеша */
  command: string;
  /** Аргументы команды (оставшаяся часть строки) */
  args: string;
}

/**
 * Входящий callback-запрос (нажатие кнопки).
 *
 * @since 0.4.8
 *
 */
export interface IncomingCallback extends IncomingBase {
  type: 'callback';
  /** Уникальный ID запроса (для подтверждения) */
  id: string;
  /** Данные, привязанные к кнопке */
  data: string;
}

/**
 * Тип объединения всех входящих событий.
 *
 * @since 0.4.8
 *
 **/
export type Incoming = IncomingCommand | IncomingCallback;

/**
 * Общий контекст исходящего сообщения.
 *
 * @since 0.4.8
 *
 **/
export interface OutgoingContext {
  /** Время создания сообщения */
  timestamp: number;
}

/**
 * Стандартное исходящее сообщение (текст, фото, документ и т.д.).
 *
 * @since 0.4.8
 *
 **/
export interface OutgoingRegular extends OutgoingContext {
  type: 'regular';
  /** ID чата, куда отправлять */
  chatId: number | string;
  /** Текст сообщения */
  text?: string;
  /** Встроенная клавиатура */
  keyboard?: KeyboardMarkup;
  /** URL фото */
  photo?: string;
  /** URL документа */
  document?: string;
  /** Подпись к медиа */
  caption?: string;
  /** Режим разметки: HTML или MarkdownV2 */
  parseMode?: 'HTML' | 'MarkdownV2';
}

/**
 * "Сырой" запрос к API мессенджера (напр. answerCallbackQuery).
 *
 * @since 0.4.8
 *
 **/
export interface OutgoingRaw extends OutgoingContext {
  type: 'raw';
  /** Название метода API */
  method: string;
  /** Параметры вызова */
  payload: Record<string, unknown>;
}

/**
 * Тип объединения всех исходящих сообщений.
 *
 * @since 0.4.8
 *
 **/
export type Outgoing = OutgoingRegular | OutgoingRaw;

/**
 * Интерфейс хоста бота — точка интеграции с системой.
 *
 * @since 0.4.8
 *
 **/
export interface BotHost {
  /** Имя виртуального устройства */
  readonly deviceName: string;
  /** Инициализация хоста (запуск таймеров, очередей) */
  initialize(): void;
  /** Постановка сообщения в очередь на отправку */
  send(outgoing: Outgoing): void;
}

/**
 * Конфигурация действия (команды или колбэка) с политикой доступа.
 *
 * @since 0.4.8
 *
 **/
export interface ActionConfig<TPolicy> {
  /** Имя политики авторизации */
  policy: TPolicy;
  /** Описание действия (для справки) */
  description?: string;
}

/**
 * Универсальный тип конфигурации: карта имени действия → настройки.
 *
 * @since 0.4.8
 *
 **/
export type Config<TPolicy extends string, TValue extends string>
  = Record<TValue, ActionConfig<TPolicy>>;

export interface HostOptions {

  /** Имя виртуального устройства */
  deviceName: string;

  /** Название устройства в интерфейсе Wiren Board. */
  deviceTitle: WbRules.Title;

  /**
   * Интервал опроса входящих обновлений (в миллисекундах).
   *
   * По умолчанию — {@link DEFAULT_POLL_INTERVAL}
   *
   **/
  pollInterval?: number;

  /**
   * Интервал отправки исходящих сообщений (в миллисекундах).
   *
   * По умолчанию — {@link DEFAULT_SEND_INTERVAL}
   *
   **/
  sendInterval?: number;

  /**
   * Интервал публикации входящих сообщений в MQTT (в миллисекундах).
   *
   * По умолчанию — {@link DEFAULT_MQTT_INTERVAL}
   *
   **/
  mqttInterval?: number;

}

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
export interface AdapterOptions<
  TPolicy extends string,
  TCommand extends string,
  TCallback extends string
> {

  /** Имя виртуального устройства */
  deviceName: string;

  /** Токен авторизации в API мессенджера */
  token: string;

  /** Таймаут опроса (сек) */
  pollTimeout?: number;

  /** Таймаут отправки (сек) */
  sendTimeout?: number;

  /**
   * Максимальное количество обновлений, получаемых за один запрос.
   *
   * По умолчанию — {@link DEFAULT_INCOMING_LIMIT}
   *
   **/
  incomingLimit?: number;

  /** Конфигурация команд */
  commands?: Config<TPolicy, TCommand>;

  /** Конфигурация колбэков */
  callbacks?: Config<TPolicy, TCallback>;

}

export type BotOptions<
  TPolicy extends string,
  TCommand extends string,
  TCallback extends string
> = AdapterOptions<TPolicy, TCommand, TCallback> & HostOptions;

/**
 * Фабрика создания адаптера.
 *
 * @since 0.4.8
 *
 **/
export type BotAdapterFactory = (deviceName: string) => BotAdapter;

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
  poll: (resolve: () => void, reject: () => void) => void;

  /** Отправляет сообщение через мессенджер. */
  send: (regular: OutgoingRegular, context: { resolve: () => void; reject: () => void }) => void;

  /** Отправляет произвольный запрос к API. */
  sendRaw: (raw: OutgoingRaw, context: { resolve: () => void; reject: () => void }) => void;

}
