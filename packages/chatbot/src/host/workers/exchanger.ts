import { isString } from '@mirta/basics'
import { DEFAULT_MQTT_INTERVAL, DEFAULT_POLL_INTERVAL, DEFAULT_SEND_INTERVAL } from '#constants'
import { TOPICS } from '#host/device'
import { createExponentialBackoff } from '#resilence/exponential-backoff'
import { useBotStore } from '#store'
import type { BotAdapter, Outgoing } from '#types'

/**
 * Параметры настройки обмена данными между ботом и внешним API.
 *
 * @since 0.4.8
 *
 **/
export interface ExchangeOptions {

  /**
   * Интервал опроса входящих обновлений (в миллисекундах).
   *
   * Значение по умолчанию — {@link DEFAULT_POLL_INTERVAL}
   *
   **/
  pollInterval?: number

  /**
   * Интервал отправки исходящих сообщений (в миллисекундах).
   *
   * Значение по умолчанию — {@link DEFAULT_SEND_INTERVAL}
   *
   */
  sendInterval?: number

  /**
   * Интервал публикации входящих сообщений в MQTT (в миллисекундах).
   *
   * Значение по умолчанию — {@link DEFAULT_MQTT_INTERVAL}
   *
   **/
  mqttInterval?: number

}

/**
 * Настраивает асинхронный движок обмена данными для бота.
 *
 * Реализует три независимых потока обработки:
 * 1. **Poll** — опрос внешнего API (Telegram/MAX) на наличие новых сообщений
 * 2. **Send** — отправка исходящих сообщений из очереди
 * 3. **MQTT** — публикация входящих сообщений в виртуальное устройство
 *
 * Также обрабатывает:
 * - Включение/выключение бота через control `enabled`
 * - Режим отладки через control `debug`
 * - Экспоненциальную задержку при ошибках (повышает устойчивость)
 * - Сброс очередей при остановке
 *
 * @param deviceName - Имя виртуального устройства (идентификатор бота)
 * @param adapter - Адаптер взаимодействия с внешним API (Telegram/MAX)
 * @param options - Параметры интервалов опроса и отправки
 *
 * @internal Эта функция вызывается только внутри `defineBotHost` и не предназначена для прямого использования.
 *
 * @example
 * ```ts
 * setupExchanger('telegram', telegramAdapter(options), {
 *   pollInterval: 5000,
 *   sendInterval: 1000,
 *   mqttInterval: 200
 * });
 * ```
 * @since 0.4.8
 *
 **/
export function setupExchanger(
  deviceName: string,
  adapter: BotAdapter,
  options: ExchangeOptions
): void {

  const store = useBotStore(deviceName)

  // Сброс флагов при повторной инициализации
  store.isPolling = false
  store.isSending = false

  const {
    pollInterval = DEFAULT_POLL_INTERVAL,
    sendInterval = DEFAULT_SEND_INTERVAL,
    mqttInterval = DEFAULT_MQTT_INTERVAL,
  } = options

  const pollTimerName = `${deviceName}_poll`
  const sendTimerName = `${deviceName}_send`
  const mqttTimerName = `${deviceName}_mqtt`

  // Экспоненциальная задержка при ошибках (до 6 попыток)
  const pollBackoffInterval = createExponentialBackoff({
    delay: pollInterval,
    maxAttempts: 6,
  })

  // Экспоненциальная задержка при ошибках (до 6 попыток)
  const sendBackoffInterval = createExponentialBackoff({
    delay: sendInterval,
    maxAttempts: 6,
  })

  /**
   * Вызывается при успешном опросе обновлений.
   *
   **/
  function pollResolved() {

    const hasErrors = store.stats.pollErrors > 0

    store.pollSuccess()

    if (hasErrors)
      log.debug('Errors gone. Poll delay restored to {} ms', pollInterval)

    store.isPolling = false

    if (store.isEnabled)
      startTicker(pollTimerName, pollInterval)

  }

  /**
   * Вызывается при ошибке опроса обновлений.
   * Увеличивает интервал с экспоненциальной задержкой.
   *
   **/
  function pollRejected() {

    store.pollFail()

    const pollDelay = pollBackoffInterval(store.stats.pollErrors)
    log.debug('Error detected. Poll delay increased to {} ms', pollDelay)

    store.isPolling = false

    if (store.isEnabled)
      startTicker(pollTimerName, pollDelay)

  }

  // === Правило: Опрос входящих обновлений ===
  defineRule(pollTimerName, {
    when: () => timers[pollTimerName].firing && !store.isPolling,
    then: () => {

      if (store.isDebug)
        log.debug('[Bot] Polling')

      store.isPolling = true

      adapter.poll(
        pollResolved,
        pollRejected
      )

    },
  })

  /**
   * Вызывается при успешной отправке сообщения.
   *
   **/
  function sendResolved() {

    const hasErrors = store.stats.sendErrors > 0

    store.sendSuccess()

    if (hasErrors)
      log.debug('Errors gone. Poll delay restored to {} ms', sendInterval)

    store.isSending = false

    if (store.isEnabled)
      startTicker(sendTimerName, sendInterval)

  }

  /**
   * Вызывается при ошибке отправки сообщения.
   * Увеличивает интервал с экспоненциальной задержкой.
   *
   **/
  function sendRejected() {

    store.sendFail()

    const sendDelay = sendBackoffInterval(store.stats.sendErrors)
    log.debug('Error detected. Send delay increased to {} ms', sendDelay)

    store.isSending = false

    if (store.isEnabled)
      startTicker(sendTimerName, sendDelay)

  }

  // === Правило: Отправка исходящих сообщений ===
  defineRule(sendTimerName, {
    when: () => timers[sendTimerName].firing && !store.isSending,
    then: () => {

      const outgoing = store.dequeueOutgoing()

      if (!outgoing)
        return

      store.isSending = true

      if (store.isDebug)
        log.debug('[Bot] Sending')

      switch (outgoing.type) {

        case 'raw':
          adapter.sendRaw(outgoing, {
            resolve: sendResolved,
            reject: sendRejected,
          })
          break

        case 'regular':
          adapter.send(outgoing, {
            resolve: sendResolved,
            reject: sendRejected,
          })
          break

      }

    },
  })

  // === Правило: Приём нового исходящего сообщения через MQTT ===
  defineRule(`${deviceName}_outgoing`, {
    whenChanged: `${deviceName}/${TOPICS.outgoing}`,
    then: (newValue) => {

      if (!store.isEnabled)
        return

      if (!isString(newValue))
        return

      const outgoing = JSON.parse(newValue) as Outgoing

      store.enqueueOutgoing(outgoing)

    },
  })

  // === Правило: Публикация входящих сообщений в MQTT ===
  defineRule(mqttTimerName, {
    when: () => timers[mqttTimerName].firing,
    then: () => {

      const incoming = store.dequeueIncoming()

      if (incoming)
        dev[`${deviceName}/${TOPICS.incoming}`] = JSON.stringify(incoming)

    },
  })

  // === Правило: Обработка включения/выключения бота ===
  defineRule(`${deviceName}_enable`, {
    whenChanged: `${deviceName}/${TOPICS.enabled}`,
    then: (newValue) => {

      if (newValue) {

        if (store.isDebug)
          log.debug('[Bot] Enabled')

        store.isEnabled = true

        startTicker(pollTimerName, pollBackoffInterval(store.stats.pollErrors))
        startTicker(sendTimerName, pollBackoffInterval(store.stats.sendErrors))
        startTicker(mqttTimerName, mqttInterval)

      }
      else {

        store.isEnabled = false

        timers[pollTimerName].stop()
        timers[sendTimerName].stop()
        timers[mqttTimerName].stop()

        // Очищаем входящую очередь при остановке бота.
        store.resetQueues()

        if (store.isDebug)
          log.debug('[Bot] Disabled')

      }

    },
  })

  // Инициализация режима отладки
  if (dev[`${deviceName}/${TOPICS.debug}`]) {

    log.debug(`[Bot] ${deviceName} initialized`)
    store.isDebug = true

  }

  // Восстановление состояния:
  // если бот был включён ранее — возобновляем работу.
  //
  if (dev[`${deviceName}/${TOPICS.enabled}`]) {

    store.isEnabled = true
    startTicker(pollTimerName, pollInterval)
    startTicker(sendTimerName, sendInterval)
    startTicker(mqttTimerName, mqttInterval)

  }

}
