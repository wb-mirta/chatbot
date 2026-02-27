import { DEFAULT_MQTT_INTERVAL, DEFAULT_POLL_INTERVAL, DEFAULT_SEND_INTERVAL } from '#constants';
import type { AuthorizationBuilder } from '#security/types';
import { useBotStore, useAuthStore } from '#store';
import type { BotAdapter, BotHost, HostOptions, Outgoing } from '#types';
import { setupDevice, TOPICS } from './device';
import { setupExchanger } from './exchanger';

/**
 * Глобальный флаг, указывающий, была ли уже инициализирована система бота.
 *
 * Гарантирует, что инициализация `defineBotHost` произойдёт только один раз
 * за время жизни процесса wb-rules, даже если функция вызывается из нескольких скриптов.
 *
 **/
let isInitialized = false;

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
  options: HostOptions
): BotHost {

  const {
    deviceName,
    deviceTitle,
    pollInterval = DEFAULT_POLL_INTERVAL,
    sendInterval = DEFAULT_SEND_INTERVAL,
    mqttInterval = DEFAULT_MQTT_INTERVAL,
  } = options;

  // Хранилище состояния, привязанное к устройству
  const store = useBotStore(deviceName);

  /**
   * Инициализирует хост бота.
   *
   * Выполняется один раз за сессию. Проверяет, не был ли хост уже инициализирован,
   * и убеждается, что текущий скрипт — владелец хоста (чтобы избежать дублирования).
   *
   **/
  function initialize() {

    if (isInitialized)
      return;

    isInitialized = true;

    // Повторная инициализация только при перезагрузке скрипта wb-rules,
    // в котором хост был впервые проинициализирован.
    //
    if (!store.claimHostOwnership(__filename))
      return;

    const authStore = useAuthStore(deviceName);

    authStore.setup(auth);

    // Создаём виртуальное устройство
    setupDevice(deviceName, deviceTitle);

    // Настройка приёма и отправки сообщений
    setupExchanger(deviceName, adapter, {
      pollInterval: pollInterval,
      sendInterval: sendInterval,
      mqttInterval: mqttInterval,
    });

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

    dev[`${deviceName}/${TOPICS.outgoing}`] = JSON.stringify(outgoing);

  }

  return {

    deviceName,
    initialize,
    send,

  };

}
