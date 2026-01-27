import { DEFAULT_MQTT_INTERVAL, DEFAULT_POLL_INTERVAL, DEFAULT_SEND_INTERVAL } from '#constants'
import type { AuthorizationBuilder } from '#security/types'
import { useBotStore, useAuthStore } from '#store'
import type { BotAdapter, BotHost, Outgoing } from '#types'
import { setupDevice, TOPICS } from './device'
import { setupExchanger } from './workers/exchanger'

/**
 * Параметры конфигурации хоста бота.
 *
 * Определяет основные настройки виртуального устройства, токен, интервалы опроса
 * и дополнительные параметры безопасности и производительности.
 *
 * @since 0.4.8
 *
 **/
export interface BotOptions {

  /**
   * Уникальное имя виртуального устройства.
   * Используется как идентификатор в MQTT-топиках и хранилище.
   *
   **/
  deviceName: string

  /**
   * Отображаемое название устройства в интерфейсе Wiren Board.
   *
   **/
  deviceTitle: WbRules.Title

  /**
   * Токен доступа к API бота (например, Telegram Bot API).
   **/
  token: string

  /**
   * Интервал опроса входящих обновлений (в миллисекундах).
   *
   * По умолчанию — {@link DEFAULT_POLL_INTERVAL}
   *
   **/
  pollInterval?: number

  /**
   * Интервал отправки исходящих сообщений (в миллисекундах).
   *
   * По умолчанию — {@link DEFAULT_SEND_INTERVAL}
   *
   **/
  sendInterval?: number

  /**
   * Интервал публикации входящих сообщений в MQTT (в миллисекундах).
   *
   * По умолчанию — {@link DEFAULT_MQTT_INTERVAL}
   *
   **/
  mqttInterval?: number

  /**
   * Таймаут ожидания ответа при опросе (в секундах).
   *
   * По умолчанию — {@link DEFAULT_POLL_TIMEOUT}
   *
   **/
  pollTimeout?: number

  /**
   * Таймаут ожидания отправки сообщения (в секундах).
   *
   * По умолчанию — {@link DEFAULT_SEND_TIMEOUT}
   *
   **/
  sendTimeout?: number

  /**
   * Максимальное количество обновлений, получаемых за один запрос.
   *
   * По умолчанию — {@link DEFAULT_INCOMING_LIMIT}
   *
   **/
  incomingLimit?: number

}

/**
 * Глобальный флаг, указывающий, была ли уже инициализирована система бота.
 *
 * Гарантирует, что инициализация `defineBotHost` произойдёт только один раз
 * за время жизни процесса wb-rules, даже если функция вызывается из нескольких скриптов.
 *
 **/
let isInitialized = false

/**
 * Создаёт и настраивает хост бота — ядро системы, управляющее жизненным циклом.
 *
 * Хост отвечает за:
 * - Инициализацию виртуального устройства
 * - Настройку системы авторизации
 * - Запуск движка обмена данными (опрос, отправка, MQTT)
 * - Обеспечение синглтон-поведения (один экземпляр на систему)
 *
 * Хост является связующим звеном между адаптером (Telegram/MAX), системой прав
 * и окружением wb-rules. Он гарантирует, что все компоненты работают согласованно.
 *
 * @param auth - Построитель системы авторизации с политиками доступа
 * @param adapter - Адаптер для взаимодействия с внешним API (например, Telegram)
 * @param options - Конфигурационные параметры бота
 * @returns Объект `BotHost`, реализующий интерфейс инициализации и отправки
 *
 * @example
 * ```ts
 * const host = defineBotHost(auth, telegramAdapter(options), {
 *   deviceName: 'telegram',
 *   deviceTitle: 'Telegram Bot',
 *   token: '123:abc'
 * });
 * ```
 * @remarks
 * Только первый скрипт, вызвавший `defineBotHost`, становится владельцем хоста
 * (через `claimHostOwnership`). Остальные получают тот же экземпляр без повторной инициализации.
 *
 * @since 0.4.8
 *
 **/
export function defineBotHost(
  auth: AuthorizationBuilder,
  adapter: BotAdapter,
  options: BotOptions
): BotHost {

  const {
    deviceName,
    deviceTitle,
    pollInterval = DEFAULT_POLL_INTERVAL,
    sendInterval = DEFAULT_SEND_INTERVAL,
    mqttInterval = DEFAULT_MQTT_INTERVAL,
  } = options

  // Хранилище состояния, привязанное к устройству
  const store = useBotStore(deviceName)

  /**
   * Инициализирует хост бота.
   *
   * Выполняется один раз за сессию. Проверяет, не был ли хост уже инициализирован,
   * и убеждается, что текущий скрипт — владелец хоста (чтобы избежать дублирования).
   *
   **/
  function initialize() {

    if (isInitialized)
      return

    isInitialized = true

    // Повторная инициализация только при перезагрузке скрипта wb-rules,
    // в котором хост был впервые проинициализирован.
    //
    if (!store.claimHostOwnership(__filename))
      return

    const authStore = useAuthStore(deviceName)

    authStore.setup(auth)

    // Создаём виртуальное устройство
    setupDevice(deviceName, deviceTitle)

    // Настройка приёма и отправки сообщений
    setupExchanger(deviceName, adapter, {
      pollInterval: pollInterval,
      sendInterval: sendInterval,
      mqttInterval: mqttInterval,
    })

  }

  /**
   * Помещает исходящее сообщение в очередь на отправку.
   *
   * Сообщение публикуется в ячейку `outgoing` виртуального устройства,
   * откуда оно будет обработано `setupExchanger`.
   *
   * @param outgoing - Объект исходящего сообщения
   *
   **/
  function send(outgoing: Outgoing): void {

    dev[`${deviceName}/${TOPICS.outgoing}`] = JSON.stringify(outgoing)

  }

  return {

    deviceName,
    initialize,
    send,

  }

}
