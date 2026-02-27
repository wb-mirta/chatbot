/**
 * Статические имена ячеек (cells) виртуального устройства бота.
 *
 * Используются для унифицированного доступа к данным через `dev[deviceName]/{topic}`.
 * Объявлена как `const` для обеспечения типобезопасности и предотвращения изменений.
 *
 * @since 0.4.8
 *
 **/
export const TOPICS = {

  /**
   * Контроллер включения/выключения бота.
   *
   **/
  enabled: 'enabled',

  /**
   * Контроллер режима отладки.
   * При включении активирует подробное логирование.
   *
   **/
  debug: 'debug',

  /**
   * Ячейка для входящих сообщений.
   * Содержит JSON-объект последнего входящего события (команда или колбэк).
   *
   * Только для чтения (данные читаются движком, не пользователем).
   **/
  incoming: 'incoming',

  /**
   * Ячейка для исходящих сообщений.
   * Используется для постановки сообщений в очередь отправки.
   *
   * Только для чтения (данные читаются движком, не пользователем).
   **/
  outgoing: 'outgoing',

} as const;

/**
 * Настраивает виртуальное устройство для бота.
 *
 * Создаёт устройство с заданным именем и заголовком, а также определяет
 * стандартные ячейки для управления и обмена данными:
 * - Включение/выключение
 * - Режим отладки
 * - Приём входящих сообщений
 * - Отправка исходящих сообщений
 *
 * Все ячейки создаются с поддержкой локализации (ru/en).
 *
 * @param deviceName - Уникальное имя устройства (используется в MQTT-топиках)
 * @param deviceTitle - Отображаемое название устройства в интерфейсе
 *
 * @example
 * ```ts
 * setupDevice('telegram', 'Telegram Bot');
 * ```
 *
 * После вызова в интерфейсе появится устройство "Telegram Bot" с контролами:
 * - Включен (switch)
 * - Отладка (switch)
 * - Входящее (text, readonly)
 * - Исходящее (text, readonly)
 *
 * @since 0.4.8
 *
 **/
export function setupDevice(
  deviceName: string,
  deviceTitle: WbRules.Title
) {

  defineVirtualDevice(deviceName, {
    title: deviceTitle,
    cells: {
      [TOPICS.enabled]: {
        title: {
          'en': 'Enabled',
          'ru': 'Включен',
        },
        type: 'switch',
        value: true,
        order: 1,
      },
      [TOPICS.debug]: {
        title: {
          'en': 'Debug',
          'ru': 'Отладка',
        },
        type: 'switch',
        value: false,
        order: 2,
      },
      [TOPICS.incoming]: {
        title: {
          'en': 'Incoming',
          'ru': 'Входящее',
        },
        type: 'text',
        value: '',
        readonly: true,
        order: 3,
      },
      [TOPICS.outgoing]: {
        title: {
          'en': 'Outgoing',
          'ru': 'Исходящее',
        },
        type: 'text',
        value: '',
        readonly: true,
        order: 4,
      },
    },
  });

}
