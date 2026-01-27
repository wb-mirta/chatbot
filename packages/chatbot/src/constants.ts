/**
 * Максимальное количество обновлений, получаемых за один запрос.
 *
 * @since 0.4.8
 *
 **/
export const DEFAULT_INCOMING_LIMIT = 10

/**
 * Интервал опроса входящих обновлений (в миллисекундах).
 *
 * @since 0.4.8
 *
 **/
export const DEFAULT_POLL_INTERVAL = 400

/**
 * Интервал отправки исходящих сообщений (в миллисекундах).
 *
 * @since 0.4.8
 *
 **/
export const DEFAULT_SEND_INTERVAL = 100

/**
 * Интервал публикации сообщений во внутреннюю шину (MQTT, в мс).
 *
 * @since 0.4.8
 *
 **/
export const DEFAULT_MQTT_INTERVAL = 100

/**
 * Таймаут ожидания обновлений при опросе (в секундах).
 * Используется в long-polling запросах.
 *
 * @since 0.4.8
 *
 **/
export const DEFAULT_POLL_TIMEOUT = 60

/**
 * Таймаут отправки одного сообщения (в секундах).
 *
 * @since 0.4.8
 *
 **/
export const DEFAULT_SEND_TIMEOUT = 15
