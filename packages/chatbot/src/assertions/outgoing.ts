import type { Outgoing, OutgoingRaw, OutgoingRegular } from '#types'

/**
 * Проверяет, является ли значение валидным объектом Record.
 *
 * @since 0.4.8
 * @internal
 *
 **/
function isRecord(value: unknown): value is Record<string, unknown> {

  return typeof value === 'object' && value !== null

}

/**
 * Проверяет валидность OutgoingRaw и выбрасывает исключение при ошибке.
 *
 * @param value - Проверяемое значение
 * @throws {Error} Если value не является валидным OutgoingRaw
 *
 * @internal
 * @since 0.4.8
 *
 **/
function assertIsOutgoingRaw(value: unknown): asserts value is OutgoingRaw {

  if (!isRecord(value))
    throw new Error('Expected object, got'.format(typeof value))

  if (Array.isArray(value))
    throw new Error('Expected object, got array')

  if (value.type !== 'raw')
    throw new Error('Expected type="raw", got {}'.format(String(value.type)))

  if (typeof value.method !== 'string' || value.method.length === 0)
    throw new Error('Expected non-empty "method" string, got {}'.format(typeof value.method))

  if (!isRecord(value.payload))
    throw new Error('Expected "payload" to be an object, got {}'.format(typeof value.payload))

  if (Array.isArray(value.payload))
    throw new Error('Expected object, got array')

  if (typeof value.timestamp !== 'number')
    throw new Error('Expected "timestamp" to be a number, got {}'.format(typeof value.timestamp))

}

/**
 * Проверяет валидность OutgoingRegular и выбрасывает исключение при ошибке.
 *
 * @param value - Проверяемое значение
 * @throws {Error} Если value не является валидным OutgoingRegular
 *
 * @since 0.4.8
 * @internal
 *
 **/
function assertIsOutgoingRegular(value: unknown): asserts value is OutgoingRegular {

  if (!isRecord(value))
    throw new Error('Expected object, got'.format(typeof value))

  if (Array.isArray(value))
    throw new Error('Expected object, got array')

  if (value.type !== 'regular')
    throw new Error('Expected type="regular", got {}'.format(String(value.type)))

  if (typeof value.chatId !== 'number' && typeof value.chatId !== 'string')
    throw new Error('Expected "chatId" to be a number or string, got {}'.format(typeof value.chatId))

  if (typeof value.timestamp !== 'number')
    throw new Error('Expected "timestamp" to be a number, got {}'.format(typeof value.timestamp))

  // === Опциональные поля ===

  if (value.text !== undefined && typeof value.text !== 'string')
    throw new Error('Expected "text" to be a string, got {}'.format(typeof value.text))

  if (value.photo !== undefined && typeof value.photo !== 'string')
    throw new Error('Expected "photo" to be a string, got {}'.format(typeof value.photo))

  if (value.document !== undefined && typeof value.document !== 'string')
    throw new Error('Expected "document" to be a string, got {}'.format(typeof value.document))

  if (value.caption !== undefined && typeof value.caption !== 'string')
    throw new Error('Expected "caption" to be a string, got {}'.format(typeof value.caption))

  if (
    value.parseMode !== undefined
    && value.parseMode !== 'HTML'
    && value.parseMode !== 'MarkdownV2'
  ) {

    throw new Error(
      'Expected "parseMode" to be "HTML" or "MarkdownV2", got {}'.format(JSON.stringify(value.parseMode))
    )

  }

  if (value.keyboard !== undefined && !isRecord(value.keyboard))
    throw new Error('Expected "keyboard" to be an object, got {}'.format(typeof value.keyboard))

}

/**
 * Assertion-функция для проверки валидности Outgoing.
 *
 * Гарантирует, что объект соответствует типу Outgoing
 * и содержит все обязательные поля с корректными типами.
 * Выбрасывает исключение с детальным сообщением при несоответствии.
 *
 * @param value - Проверяемое значение
 * @throws {Error} Если value не является валидным Outgoing
 *
 * @example
 * ```ts
 * const parsed = JSON.parse(payload)
 * try {
 *   assertValueIsOutgoing(parsed)
 *   store.enqueueOutgoing(parsed) // TypeScript знает, что parsed это Outgoing
 * } catch (error) {
 *   log.error('Invalid outgoing: {}', error)
 * }
 * ```
 * @since 0.4.8
 *
 **/
export function assertValueIsOutgoing(value: unknown): asserts value is Outgoing {

  if (!isRecord(value))
    throw new Error('Expected an object, got {}'.format(typeof value))

  const type = value.type

  if (type !== 'raw' && type !== 'regular') {

    throw new Error(
      'Expected type to be "raw" or "regular", got {}'.format(String(type))
    )

  }

  if (type === 'raw') {

    assertIsOutgoingRaw(value)

  }
  else {

    assertIsOutgoingRegular(value)

  }

}
