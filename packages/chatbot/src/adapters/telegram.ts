import { useBotStore } from '#store/index';
import type { ActionConfig, AdapterOptions, BotAdapter, Config } from '#types';
import { runCurlGet, runCurlPost, type PostBody, type PostMode } from '#utils/curl';
import { DEFAULT_INCOMING_LIMIT, DEFAULT_POLL_TIMEOUT, DEFAULT_SEND_TIMEOUT } from '#constants';
import type { Subject } from '#security/types';
import { useAuthStore } from '#store/auth';

/**
 * Тип чата в Telegram.
 *
 * @since 0.4.8
 *
 **/
type ChatType = 'private' | 'group' | 'supergroup' | 'channel';

/**
 * Описывает чат в Telegram.
 *
 * @since 0.4.8
 *
 **/
interface Chat {
  /** Уникальный идентификатор чата */
  id: number;
  /** Тип чата */
  type: ChatType;
}

/**
 * Обновление от Telegram Bot API.
 *
 * @since 0.4.8
 *
 **/
interface TelegramUpdate {
  /** Уникальный идентификатор обновления */
  update_id: number;
  /** Сообщение, если присутствует */
  message?: TelegramMessage;
  /** Данные о нажатии кнопки (callback_query), если есть */
  callback_query?: TelegramCallbackQuery;
}

/**
 * Отправитель сообщения Telegram.
 *
 * @since 0.4.8
 *
 **/
interface TelegramFrom {
  /** Уникальный идентификатор пользователя */
  id: number;
  /** Имя пользователя (если указано) */
  username?: string;
}

/**
 * Сообщение Telegram.
 *
 * @since 0.4.8
 *
 **/
interface TelegramMessage {
  /** Идентификатор сообщения */
  message_id: number;
  /** Отправитель сообщения */
  from?: TelegramFrom;
  /** Чат, в котором отправлено сообщение */
  chat: Chat;
  /** Текст сообщения (может отсутствовать) */
  text?: string;
}

/**
 * Команда в Telegram (сообщение, начинающееся с "/").
 *
 * @since 0.4.8
 *
 **/
interface TelegramTextCommand extends TelegramMessage {
  /** Текст сообщения */
  text: string;
}

/**
 * Объект, описывающий нажатие на инлайн-кнопку.
 *
 * @since 0.4.8
 *
 **/
interface TelegramCallbackQuery {
  /** Уникальный идентификатор запроса */
  id: string;
  /** Пользователь, нажавший кнопку */
  from: TelegramFrom;
  /** Сообщение, к которому привязана кнопка */
  message?: { chat: Chat; message_id: number };
  /** Данные, привязанные к кнопке (callback_data) */
  data: string;
}

/**
 * Ответ от метода getUpdates Telegram Bot API.
 *
 * @since 0.4.8
 *
 **/
interface GetUpdatesResponse {
  /** Флаг успешности запроса */
  ok: boolean;
  /** Массив обновлений */
  result: TelegramUpdate[];
}

/**
 * Проверяет, является ли объект валидным ответом от Telegram API (getUpdates).
 *
 * @param data - Проверяемые данные
 * @returns `true`, если объект соответствует формату GetUpdatesResponse
 *
 * @since 0.4.8
 *
 **/
function isGetUpdatesResponse(data: unknown): data is GetUpdatesResponse {

  return (
    typeof data === 'object'
    && data !== null
    && 'ok' in data
    && typeof data.ok === 'boolean'
    && 'result' in data
    && Array.isArray(data.result)
  );

}

/**
 * Проверяет, является ли сообщение текстовой командой (начинается с "/").
 *
 * @param message - Сообщение для проверки
 * @returns `true`, если сообщение — команда
 *
 * @since 0.4.8
 *
 **/
function isTextCommand(message?: TelegramMessage): message is TelegramTextCommand {

  return message?.text?.indexOf('/') === 0;

}

/**
 * Создаёт адаптер для взаимодействия с Telegram Bot API.
 *
 * Адаптер отвечает за:
 * - Опрос обновлений через метод `getUpdates`
 * - Обработку команд и callback-запросов
 * - Проверку прав доступа через систему политик
 * - Постановку входящих сообщений в очередь
 * - Отправку исходящих сообщений (текст, фото, документы, клавиатуры)
 *
 * Адаптер интегрируется с системой wb-rules через виртуальное устройство
 * и работает в режиме опроса (polling) без использования webhook.
 *
 * @param options - Параметры конфигурации бота
 * @returns Объект, реализующий интерфейс `BotAdapter`
 *
 * @emits store.enqueueIncoming() При получении новой команды или колбэка
 * @emits runCurlGet() При опросе обновлений
 * @emits runCurlPost() При отправке сообщений
 *
 * @since 0.4.8
 *
 **/
export function telegramAdapter<
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
    sendTimeout = DEFAULT_SEND_TIMEOUT,
    commands = {} as Config<TPolicy, TCommand>,
    callbacks = {} as Config<TPolicy, TCallback>,
  } = options;

  const store = useBotStore(deviceName);
  const authStore = useAuthStore(deviceName);

  /**
   * Обрабатывает текстовую команду, начинающуюся с "/".
   *
   * @param message - Входящее сообщение с командой
   *
   * @since 0.4.8
   *
   **/
  function handleCommand(message: TelegramTextCommand) {

    const { text, from, chat, message_id } = message;

    const [rawCommand, ...args] = text.slice(1).split(' ');
    const command = rawCommand.split('@')[0];

    const config = commands[command as TCommand] as ActionConfig<TPolicy> | undefined;

    const subject: Subject = {
      userId: from?.id,
      username: from?.username,
      chatId: chat.id,
      chatType: chat.type,
    };

    // Если команда не существует - игнорируем
    if (!config) {

      log.warning(
        '[Telegram] Rejected unknown "/{}" from {}',
        command,
        JSON.stringify(subject)
      );

      return;

    }

    const isAllowed = authStore.isAllowed(config.policy, subject);

    // Если у субъекта нет доступа - игнорируем
    if (!isAllowed) {

      log.warning(
        '[Telegram] Access denied to "/{}" from {}',
        command,
        JSON.stringify(subject)
      );

      return;

    }

    // Постановка команды в очередь на обработку
    store.enqueueIncoming({
      type: 'command',
      chatId: chat.id,
      username: from?.username,
      command,
      args: args.join(' '),
      messageId: message_id.toString(),
      timestamp: Date.now(),
    });

  }

  /**
   * Обрабатывает нажатие на инлайн-кнопку.
   *
   * @param query - Объект callback_query
   *
   * @since 0.4.8
   *
   **/
  function handleCallback(query: TelegramCallbackQuery) {

    const { message, data, from } = query;

    const config = callbacks[data as TCallback] as ActionConfig<TPolicy> | undefined;

    if (!message) {

      log.warning(
        '[Telegram] Rejected callback "{}" from {}: no message context (inline mode)',
        data,
        JSON.stringify({ userId: from.id, username: from.username })
      );

      return;

    }

    const subject: Subject = {
      userId: from.id,
      username: from.username,
      chatId: message.chat.id,
      chatType: message.chat.type,
    };

    // Если callback не существует - игнорируем
    if (!config) {

      log.warning(
        '[Telegram] Rejected unknown "{}" from {}',
        data,
        JSON.stringify(subject)
      );

      return;

    }

    const isAllowed = authStore.isAllowed(config.policy, subject);

    // Если у субъекта нет доступа - игнорируем
    if (!isAllowed) {

      log.warning(
        '[Telegram] Access denied to "{}" by {}',
        data,
        JSON.stringify(subject)
      );

      return;

    }

    // Постановка колбэка в очередь
    store.enqueueIncoming({
      type: 'callback',
      id: query.id,
      chatId: message.chat.id,
      data,
      messageId: message.message_id.toString(),
      timestamp: Date.now(),
      username: from.username,
    });

  }

  /**
   * Опрашивает Telegram API методом getUpdates.
   *
   * Результат обрабатывается асинхронно через exitCallback.
   * Обновления фильтруются по последнему обработанному update_id.
   *
   * @param resolve - Вызывается при успешной обработке
   * @param reject - Вызывается при ошибке
   *
   * @since 0.4.8
   *
   **/
  const poll: BotAdapter['poll'] = (resolve, reject) => {

    const nextUpdateId = store.lastUpdateId + 1;

    const url = 'https://api.telegram.org/bot{}/getUpdates?limit={}&timeout={}&offset={}'
      .format(token, incomingLimit, pollTimeout, nextUpdateId);

    store.isPolling = true;

    if (store.isDebug)
      log.debug('[Telegram] Polling: timeout={}', pollTimeout);

    runCurlGet(url, {

      timeout: pollTimeout,

      exitCallback: (exitCode, output, errorOutput) => {

        if (exitCode !== 0 || !output) {

          log.debug('[Telegram] Poll failed: exitCode={}, output={}, error={}', exitCode, output, errorOutput);

          reject();
          return;

        }

        let data: unknown;

        try {

          data = JSON.parse(output);

        }
        catch (e: unknown) {

          log.debug('[Telegram] Failed to parse JSON: {}', e);

          reject();
          return;

        }

        if (!isGetUpdatesResponse(data)) {

          log.debug(`[Telegram] Invalid response format from getUpdates`);
          log.debug(JSON.stringify(data));

          reject();
          return;

        }

        if (!data.ok) {

          log.debug('[Telegram] API error: {}', output);

          reject();
          return;

        }

        if (!store.isEnabled) {

          resolve();
          return;

        }

        let lastUpdateId: number | undefined;

        for (const update of data.result) {

          if (isTextCommand(update.message)) {

            // Обработка команды: /command args
            handleCommand(update.message);

          }
          else if (update.callback_query) {

            // Обработка нажатия кнопки (callback_query)
            handleCallback(update.callback_query);

          }

          lastUpdateId = update.update_id;

        }

        if (lastUpdateId)
          store.lastUpdateId = lastUpdateId;

        resolve();

      },

    });

  };

  /**
   * Создаёт exitCallback для POST-запросов к Telegram API.
   *
   * @param resolve - Колбэк успеха
   * @param reject - Колбэк ошибки
   * @returns Функция для обработки результата curl
   *
   * @since 0.4.8
   *
   **/
  const sendExitCallback: (resolve: () => void, reject: () => void) => WbRules.ExitCallback
    = (resolve, reject) => (exitCode, output, errorOutput) => {

      if (exitCode === 0 && output?.includes('"ok":true')) {

        resolve();

      }
      else {

        log.debug(
          '[Telegram] Send failed: exitCode={}, output={}, errorOutput={}',
          exitCode,
          output,
          errorOutput
        );

        reject();

      }

    };

  /**
   * Отправляет сообщение через Telegram Bot API.
   *
   * Поддерживает:
   * - Текстовые сообщения
   * - Фото с подписью
   * - Документы с подписью
   * - Клавиатуры (reply и inline)
   * - Разметку (MarkdownV2, HTML)
   *
   * @param outgoing - Объект исходящего сообщения
   * @param callbacks - Колбэки успеха и ошибки
   *
   * @since 0.4.8
   *
   **/
  const send: BotAdapter['send'] = (outgoing, { resolve, reject }) => {

    const { chatId, text = '', keyboard, photo, document, caption, parseMode } = outgoing;

    let url: string;
    let mode: PostMode | undefined;

    const body: PostBody = {
      chat_id: chatId.toString(),
    };

    if (photo) {

      if (store.isDebug)
        log.debug('[Telegram] Sending photo');

      mode = 'multipart';
      url = 'https://api.telegram.org/bot{}/sendPhoto'.format(token);

      body.photo = photo;

      if (caption)
        body.caption = caption;

    }
    else if (document) {

      if (store.isDebug)
        log.debug('[Telegram] Sending document');

      mode = 'multipart';
      url = 'https://api.telegram.org/bot{}/sendDocument'.format(token);

      body.document = document;

      if (caption)
        body.caption = caption;

    }
    else {

      if (store.isDebug)
        log.debug('[Telegram] Sending text');

      url = 'https://api.telegram.org/bot{}/sendMessage'.format(token);

      body.text = text;

    }

    if (parseMode)
      body.parse_mode = parseMode === 'HTML' ? 'HTML' : 'MarkdownV2';

    if (keyboard)
      body.reply_markup = JSON.stringify(keyboard);

    runCurlPost(url, {
      mode,
      body,
      exitCallback: sendExitCallback(resolve, reject),
      timeout: sendTimeout,
    });

  };

  /**
   * Отправляет "сырой" запрос к Telegram Bot API.
   *
   * Используется для вызова любых методов, не поддерживаемых стандартными интерфейсами,
   * например: editMessage, uploadFile и др.
   *
   * @param outgoing - Объект с методом и параметрами
   * @param callbacks - Колбэки успеха и ошибки
   *
   **/
  const sendRaw: BotAdapter['sendRaw'] = (outgoing, { resolve, reject }) => {

    const { method, payload: { ...params } } = outgoing;

    runCurlPost(
      'https://api.telegram.org/bot{}/{}'.format(token, method),
      {
        body: JSON.stringify(params),
        headers: {
          'Content-Type': 'application/json',
        },
        exitCallback: sendExitCallback(resolve, reject),
        timeout: sendTimeout,
      }
    );

  };

  return { poll, send, sendRaw };

}
