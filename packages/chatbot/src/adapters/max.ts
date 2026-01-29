import { useBotStore } from '#store'
import type { ActionConfig, AdapterOptions, BotAdapter } from '#types'
import { runCurlGet, runCurlPost } from '#utils/curl'
import { DEFAULT_INCOMING_LIMIT, DEFAULT_POLL_TIMEOUT } from '#constants'
import type { Subject } from '#security/types'
import { useAuthStore } from '#store/auth'

/**
 * Пользователь в MAX.
 *
 * @since 0.4.8
 *
 **/
interface MaxUser {
  /** Уникальный идентификатор пользователя */
  user_id: number
  /** Имя пользователя */
  first_name: string
  /** Фамилия (опционально) */
  last_name?: string
  /** Username (опционально) */
  username?: string
  /** Признак бота */
  is_bot: boolean
}

/**
 * Тело сообщения в MAX.
 *
 * @since 0.4.8
 *
 **/
interface MaxMessageBody {
  /** Уникальный идентификатор сообщения */
  mid: string
  /** Текст сообщения (может отсутствовать) */
  text?: string
  /** Вложения (картинки, файлы, кнопки и др.) */
  attachments?: {
    /** Тип вложения */
    type: string
    /** Данные вложения */
    payload: Record<string, unknown>
  }[]
}

/**
 * Сообщение MAX.
 *
 * @since 0.4.8
 *
 **/
interface MaxMessage {
  /** Отправитель */
  sender: MaxUser
  /** Получатель (чат) */
  recipient: {
    chat_id: number
  }
  /** Тело сообщения */
  body: MaxMessageBody
  /** Временная метка */
  timestamp: number
}

/**
 * Объект callback-запроса в MAX.
 *
 * @since 0.4.8
 *
 **/
interface MaxCallback {
  /** Временная метка */
  timestamp: number
  /** Уникальный идентификатор колбэка */
  callback_id: string
  /** Полезная нагрузка (данные кнопки) */
  payload: string
  /** Пользователь, нажавший кнопку */
  user: MaxUser
}

/**
 * Обновление: создание сообщения.
 *
 * @since 0.4.8
 *
 **/
interface MaxMessageCreatedUpdate {
  /** Тип обновления */
  update_type: 'message_created'
  /** Сообщение */
  message: MaxMessage
  /** Локаль пользователя (опционально) */
  user_locale?: string
}

/**
 * Обновление: нажатие на кнопку.
 *
 * @since 0.4.8
 *
 **/
interface MaxMessageCallbackUpdate {
  /** Тип обновления */
  update_type: 'message_callback'
  /** Данные колбэка */
  callback: MaxCallback
  /** Сообщение, к которому привязана кнопка (опционально) */
  message?: MaxMessage
  /** Локаль пользователя (опционально) */
  user_locale?: string
}

/**
 * Обновление: пользователь запустил бота.
 *
 * @since 0.4.8
 *
 **/
interface MaxBotStartedUpdate {
  /** Тип обновления */
  update_type: 'bot_started'
  /** Идентификатор чата */
  chat_id: number
  /** Пользователь, запустивший бота */
  user: MaxUser
  /** Дополнительные данные (payload) */
  payload?: string
  /** Локаль пользователя (опционально) */
  user_locale?: string
}

/**
 * Любой тип обновления от MAX.
 *
 * @since 0.4.8
 *
 **/
type MaxUpdate
  = | MaxMessageCreatedUpdate
    | MaxMessageCallbackUpdate
    | MaxBotStartedUpdate

/**
 * Ответ от метода получения обновлений.
 *
 * @since 0.4.8
 *
 **/
interface MaxUpdatesResponse {
  /** Массив обновлений */
  updates: MaxUpdate[]
  /** Маркер для следующего запроса (пагинация) */
  marker?: number
}

/**
 * Преобразует обновление MAX в объект субъекта для проверки доступа.
 *
 * @param update - Входящее обновление
 * @returns Объект Subject с полями username, chatId
 *
 * @since 0.4.8
 *
 **/
function toSubject(update: MaxUpdate): Subject {

  switch (update.update_type) {

    case 'bot_started':
      return {
        username: update.user.username,
        chatId: update.chat_id,
      }

    case 'message_created':
      return {
        username: update.message.sender.username,
        chatId: update.message.recipient.chat_id,
      }

    case 'message_callback':
      return {
        username: update.callback.user.username,
        // TODO: Verify chatId semantics when MAX bot API becomes available
        // Using user_id as chatId - may need to use message?.recipient.chat_id
        chatId: update.callback.user.user_id,
      }

  }

}

/**
 * Проверяет, является ли значение объектом (Record).
 *
 * @param value - Проверяемое значение
 * @returns `true`, если значение — объект
 *
 * @since 0.4.8
 *
 **/
function isRecord(value: unknown): value is Record<string, unknown> {

  return typeof value === 'object' && value !== null

}

/**
 * Проверяет, является ли объект валидным ответом от MAX API.
 *
 * @param data - Проверяемые данные
 * @returns `true`, если объект соответствует MaxUpdatesResponse
 *
 * @since 0.4.8
 *
 **/
function isMaxUpdatesResponse(data: unknown): data is MaxUpdatesResponse {

  return (
    isRecord(data)
    && 'updates' in data
    && Array.isArray(data.updates)
  )

}

/**
 * Проверяет, является ли обновление событием создания сообщения.
 *
 * @param update - Обновление
 * @returns `true`, если тип обновления — message_created
 *
 * @since 0.4.8
 *
 **/
function isMessageCreated(update: MaxUpdate): update is MaxMessageCreatedUpdate {

  return update.update_type === 'message_created'

}

/**
 * Проверяет, является ли текст валидной командой (начинается с "/").
 *
 * @param text - Текст сообщения
 * @returns `true`, если текст начинается с "/"
 *
 * @since 0.4.8
 *
 **/
function isTextCommand(text?: string): text is string {

  return !!text?.startsWith('/')

}

/**
 * Проверяет, является ли обновление callback-запросом.
 *
 * @param update - Обновление
 * @returns `true`, если тип — message_callback и есть payload
 *
 * @since 0.4.8
 *
 **/
function isMessageCallback(update: MaxUpdate): update is MaxMessageCallbackUpdate {

  return (
    update.update_type === 'message_callback'
    && typeof update.callback.payload === 'string'
  )

}

/**
 * Создаёт адаптер для взаимодействия с MAX Bot API.
 *
 * Адаптер обеспечивает:
 * - Опрос обновлений через метод `/updates`
 * - Обработку команд, колбэков и запуска бота
 * - Проверку прав доступа через систему политик
 * - Постановку событий во входящую очередь
 * - Отправку сообщений с поддержкой текста, фото, документов, клавиатур
 *
 * Интеграция осуществляется через виртуальное устройство в wb-rules.
 * Поддерживается режим опроса (polling), webhook не используется.
 *
 * @param options - Конфигурация бота (токен, команды, таймауты)
 * @returns Объект, реализующий интерфейс `BotAdapter`
 *
 * @emits store.enqueueIncoming() При поступлении новой команды или колбэка
 * @emits runCurlGet() При опросе обновлений
 * @emits runCurlPost() При отправке сообщений
 *
 * @internal Данный адаптер пока не экспортируется из пакета, так как требует дополнительного тестирования.
 *
 * @since 0.4.8
 *
 **/
export function createMaxAdapter<
  TPolicy extends string,
  TCommand extends string,
  TCallback extends string
>(

  options: AdapterOptions<TPolicy, TCommand, TCallback>

): BotAdapter {

  const {
    deviceName,
    token,
    incomingLimit = DEFAULT_INCOMING_LIMIT,
    pollTimeout = DEFAULT_POLL_TIMEOUT,
    // sendTimeout = DEFAULT_SEND_TIMEOUT,
    commands,
    callbacks,
  } = options

  const store = useBotStore(deviceName)
  const authStore = useAuthStore(deviceName)

  /**
   * Обрабатывает событие "пользователь запустил бота".
   *
   * Имитирует команду `/start`.
   *
   * @param update - Объект обновления bot_started
   *
   * @since 0.4.8
   *
   **/
  function handleStart(update: MaxBotStartedUpdate) {

    // Если команды не используются - игнорируем
    if (!commands)
      return

    const command = 'start'

    const config = commands[command as TCommand] as ActionConfig<TPolicy> | undefined
    const subject: Subject = toSubject(update)

    // Если команда не существует - игнорируем
    if (!config) {

      log.warning(
        '[Max] Access to not existing "/{}" by {}',
        command,
        JSON.stringify(subject)
      )

      return

    }

    const isAllowed = authStore.isAllowed(config.policy, subject)

    // Если у субъекта нет доступа - игнорируем
    if (!isAllowed) {

      log.warning(
        '[Max] Access denied to "/{}" by {}',
        command,
        JSON.stringify(subject)
      )

      return

    }

    const username = update.user.username

    store.enqueueIncoming({
      type: 'command',
      chatId: update.chat_id,
      username,
      command: 'start',
      args: update.payload ?? '',
      messageId: '0',
      timestamp: Date.now(),
    })

  }

  /**
   * Обрабатывает текстовое сообщение, содержащее команду.
   *
   * @param update - Обновление с сообщением
   *
   * @since 0.4.8
   *
   **/
  function handleCommand(update: MaxMessageCreatedUpdate) {

    // Если команды не используются - игнорируем
    if (!commands)
      return

    if (!isTextCommand(update.message.body.text))
      return

    const { message } = update
    const { sender: from, recipient: { chat_id: chatId } } = message

    const [command, ...args] = update.message.body.text.slice(1).split(' ')

    const config = commands[command as TCommand] as ActionConfig<TPolicy> | undefined
    const subject: Subject = toSubject(update)

    // Если команда не существует - игнорируем
    if (!config) {

      log.warning(
        '[Max] Access to not existing "/{}" by {}',
        command,
        JSON.stringify(subject)
      )

      return

    }

    const isAllowed = authStore.isAllowed(config.policy, subject)

    // Если у субъекта нет доступа - игнорируем
    if (!isAllowed) {

      log.warning(
        '[Max] Access denied to "/{}" by {}',
        command,
        JSON.stringify(subject)
      )

      return

    }

    store.enqueueIncoming({
      type: 'command',
      chatId,
      username: from.username,
      command,
      args: args.join(' '),
      messageId: message.body.mid,
      timestamp: Date.now(),
    })

  }

  /**
   * Обрабатывает нажатие на инлайн-кнопку.
   *
   * @param update - Обновление с callback-запросом
   *
   * @since 0.4.8
   *
   **/
  function handleCallback(update: MaxMessageCallbackUpdate) {

    // Если команды не используются - игнорируем
    if (!callbacks)
      return

    const { callback, message } = update
    const { user: from, payload } = callback

    if (!message)
      return

    const config = callbacks[payload as TCallback] as ActionConfig<TPolicy> | undefined
    const subject: Subject = toSubject(update)

    // Если команда не существует - игнорируем
    if (!config) {

      log.warning(
        '[Max] Access to not existing callback "{}" by {}',
        payload,
        JSON.stringify(subject)
      )

      return

    }

    const isAllowed = authStore.isAllowed(config.policy, subject)

    // Если у субъекта нет доступа - игнорируем
    if (!isAllowed) {

      log.warning(
        '[Max] Access denied to callback "{}" by {}',
        payload,
        JSON.stringify(subject)
      )

      return

    }

    store.enqueueIncoming({
      type: 'callback',
      id: update.callback.callback_id,
      chatId: message.recipient.chat_id,
      data: payload,
      messageId: message.body.mid,
      timestamp: Date.now(),
      username: from.username,
    })

  }

  /**
   * Опрашивает MAX API для получения обновлений.
   *
   * Использует long polling с заданным таймаутом.
   *
   * @param resolve - Вызывается при успешной обработке
   * @param reject - Вызывается при ошибке
   *
   * @since 0.4.8
   *
   **/
  const poll: BotAdapter['poll'] = (resolve, reject) => {

    const url = 'https://platform-api.max.ru/updates?limit={}&timeout={}'
      .format(incomingLimit, pollTimeout)

    runCurlGet(url, {
      headers: {
        'Authorization': 'Bearer {}'.format(token),
      },
      exitCallback: (exitCode, output) => {

        if (exitCode !== 0 || !output) {

          log.debug(`[MAX] poll failed: exitCode=${exitCode}`)

          reject()
          return

        }

        let data: unknown

        try {

          data = JSON.parse(output)

        }
        catch (e) {

          log.debug('[MAX] Failed to parse JSON: {}', e)

          reject()
          return

        }

        if (!isMaxUpdatesResponse(data)) {

          log.debug(`[MAX] Invalid response format`)

          reject()
          return

        }

        for (const update of data.updates) {

          // --- Команда: /start, /help и т.д. ---
          if (isMessageCreated(update)) {

            handleCommand(update)

          }
          // --- Нажатие кнопки ---
          else if (isMessageCallback(update)) {

            handleCallback(update)

          }
          // --- Пользователь запустил бота ---
          else {

            handleStart(update)

          }

        }

        resolve()

      },
    })

  }

  /**
   * Создаёт exitCallback для POST-запросов к MAX API.
   *
   * @param resolve - Колбэк успеха
   * @param reject - Колбэк ошибки
   * @returns Функция обработки результата curl
   *
   * @since 0.4.8
   *
   **/
  const exitCallback: (resolve: () => void, reject: () => void) => WbRules.ExitCallback
    = (resolve, reject) => (exitCode, output, errorOutput) => {

      if (exitCode === 0 && output?.includes('"success":true')) {

        resolve()

      }
      else {

        log.debug(
          '[Max] Send failed: exitCode={}, output={}, errorOutput={}',
          exitCode,
          output,
          errorOutput
        )

        reject()

      }

    }

  /**
   * Отправляет сообщение через MAX Bot API.
   *
   * Поддерживает:
   * - Текстовые сообщения
   * - Фото и документы
   * - Клавиатуры (inline)
   * - Разметку (HTML, Markdown)
   *
   * @param outgoing - Исходящее сообщение
   * @param callbacks - Колбэки результата
   *
   * @since 0.4.8
   *
   **/
  const send: BotAdapter['send'] = (outgoing, { resolve, reject }) => {

    const { chatId, text = '', keyboard, photo, document, caption, parseMode } = outgoing

    const url = 'https://platform-api.max.ru/messages?chat_id={}'
      .format(chatId)

    const body: { text: string, format?: 'html' | 'markdown', attachments?: unknown[] } = { text }

    if (parseMode) {

      body.format = parseMode === 'HTML' ? 'html' : 'markdown'

    }

    if (keyboard) {

      body.attachments = body.attachments ?? []

      body.attachments.push({
        type: 'inline_keyboard',
        payload: keyboard,
      })

    }

    if (photo) {

      body.attachments = body.attachments ?? []
      body.attachments.push({
        type: 'image',
        payload: { url: photo },
      })

      if (caption)
        body.text = caption

    }

    if (document) {

      body.attachments = body.attachments ?? []
      body.attachments.push({
        type: 'file',
        payload: { url: document },
      })

      if (caption)
        body.text = caption

    }

    runCurlPost(url, {
      body: JSON.stringify(body),
      headers: {
        'Authorization': 'Bearer {}'.format(token),
        'Content-Type': 'application/json',
      },
      exitCallback: exitCallback(resolve, reject),

    })

  }

  /**
   * Отправляет "сырой" запрос к MAX Bot API.
   *
   * Используется для вызова любых методов, не поддерживаемых стандартными интерфейсами,
   * например: editMessage, uploadFile и др.
   *
   * @param outgoing - Метод и параметры
   * @param callbacks - Колбэки результата
   *
   * @since 0.4.8
   *
   **/
  const sendRaw: BotAdapter['sendRaw'] = (outgoing, { resolve, reject }) => {

    const { method, payload: { ...params } } = outgoing

    const url = 'https://platform-api.max.ru/{}'
      .format(method)

    runCurlPost(url, {
      body: JSON.stringify(params),
      headers: {
        'Authorization': 'Bearer {}'.format(token),
        'Content-Type': 'application/json',
      },
      exitCallback: exitCallback(resolve, reject),

    })

  }

  return { poll, send, sendRaw }

}
