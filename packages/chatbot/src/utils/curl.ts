/**
 * Описание файла для отправки в multipart-запросе.
 *
 * @since 0.4.8
 *
 **/
interface FileField {
  /** Путь к файлу на диске */
  file: string;
  /** Имя файла (опционально) */
  filename?: string;
  /** MIME-тип (опционально) */
  contentType?: string;
}

/**
 * Режим отправки тела запроса.
 * - `'data'` — как обычные параметры (`-d`)
 * - `'multipart'` — как файлы и поля (`-F`)
 *
 * @since 0.4.8
 *
 **/
export type PostMode = 'data' | 'multipart';

/**
 * Тело POST-запроса: строка, массив строк или объект с данными/файлами.
 *
 * @since 0.4.8
 *
 **/
export type PostBody = string | string[] | Record<string, string | FileField>;

/**
 * Параметры для GET-запроса.
 *
 * @since 0.4.8
 *
 **/
interface GetOptions {

  /** HTTP-заголовки */
  headers?: Record<string, string>;

  /** Таймаут в секундах */
  timeout?: number;

  /** Колбэк завершения процесса */
  exitCallback?: WbRules.ExitCallback;

}

/**
 * Параметры для POST-запроса.
 *
 * @since 0.4.5
 *
 **/
interface PostOptions extends GetOptions {
  /** Режим отправки */
  mode?: PostMode;
  /** Тело запроса */
  body?: PostBody;
}

/**
 * Формирует аргументы команды curl.
 *
 * @param mode - HTTP-метод (GET/POST)
 * @param url - URL-адрес
 * @param options - Опции запроса
 * @returns Массив аргументов для spawn
 *
 * @since 0.4.8
 *
 **/
function createArgs(mode: 'GET' | 'POST', url: string, options: GetOptions | undefined): string[] {

  const { timeout, headers } = options ?? {};

  const args = [url, '-X', mode, '-sL']; // , '--fail-with-body'] // Требует версии curl 7.76.0

  if (timeout)
    args.push('-m', timeout.toString());

  if (headers) {

    for (const [name, value] of Object.entries(headers))
      args.push('-H', `${name}: ${value}`);

  }

  return args;

}

/**
 * Выполняет GET-запрос через curl.
 *
 * @param url - URL для запроса
 * @param options - Опции (заголовки, таймаут, колбэк)
 *
 * @since 0.4.8
 *
 **/
export function runCurlGet(
  url: string,
  options?: GetOptions
): void {

  const args = createArgs('GET', url, options);

  curl(args, options?.exitCallback);

}

/**
 * Выполняет POST-запрос через curl.
 *
 * @param url - URL для запроса
 * @param options - Опции (режим, тело, заголовки, колбэк)
 *
 * @since 0.4.8
 *
 **/
export function runCurlPost(
  url: string,
  options?: PostOptions
): void {

  const { mode = 'data', body, exitCallback } = options ?? {};

  const args = createArgs('POST', url, options);

  if (body) {

    if (mode === 'multipart') {

      appendMultipart(args, body);

    }
    else {

      appendData(args, body);

    }

  }

  curl(args, exitCallback);

}

/**
 * Запускает команду curl.
 *
 * @param args - Аргументы команды
 * @param exitCallback - Колбэк завершения
 *
 * @since 0.4.8
 *
 **/
function curl(args: string[], exitCallback?: WbRules.ExitCallback) {

  const spawnOptions: WbRules.SpawnOptions = {
    captureOutput: true,
    captureErrorOutput: true,
    exitCallback: exitCallback,
  };

  spawn('curl', args, spawnOptions);

}

/**
 * Добавляет multipart-поля в аргументы curl.
 *
 * @param args - Массив аргументов
 * @param body - Тело запроса с файлами и данными
 *
 * @since 0.4.8
 *
 **/
function appendMultipart(
  args: string[],
  body: PostBody
): void {

  if (typeof body === 'string') {

    args.push('-F', body);

  }
  else if (Array.isArray(body)) {

    body.forEach(x => args.push('-F', x));

  }
  else {

    for (const [name, value] of Object.entries(body)) {

      if (typeof value === 'object' && 'file' in value) {

        let part = `${name}=@${value.file}`;

        if (value.filename)
          part += `;filename=${value.filename}`;

        if (value.contentType)
          part += `;type=${value.contentType}`;

        args.push('-F', part);

      }
      else {

        args.push('-F', `${name}=${value}`);

      }

    }

  }

}

/**
 * Добавляет data-параметры в аргументы curl.
 *
 * @param args - Массив аргументов
 * @param body - Тело запроса
 *
 * @since 0.4.8
 *
 **/
function appendData(
  args: string[],
  body: PostBody
): void {

  if (typeof body === 'string') {

    args.push('-d', body);

  }
  else if (Array.isArray(body)) {

    body.forEach(x => args.push('-d', x));

  }
  else {

    for (const [name, value] of Object.entries(body)) {

      if (typeof value === 'object')
        throw new Error('[post] Multipart format required');

      args.push('-d', `${encodeURIComponent(name)}=${encodeURIComponent(value)}`);

    }

  }

}
