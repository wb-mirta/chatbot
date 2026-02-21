import { defineBotHost } from '#host/index'
import { telegramAdapter } from '#adapters/telegram'
import { createBot, type Bot } from '#bot'

import type { AuthorizationBuilder } from '#security/types'
import type { BotOptions } from '#types'

export { defineAuthorization } from '#security/authorization'
export type { MessageBuilder } from '#bot'
export type { ButtonStyle } from '#keyboard/types'

/**
 * Кэш экземпляра бота для обеспечения синглтона.
 * Инициализируется при первом вызове `useTelegramBot`.
 *
 * @since 0.4.8
 *
 **/
const instances: Record<string, object | undefined> = {}

// Polyfill для Object.entries (в случае отсутствия в среде)
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (!Object.entries) {

  Object.entries = function (obj: object) {

    const ownProps = Object.keys(obj)

    let i = ownProps.length

    const resArray = new Array(i) // preallocate the Array

    while (i--)
      resArray[i] = [ownProps[i], obj[ownProps[i]]]

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return resArray

  }

}

/**
 * Создаёт конфигурацию Telegram-бота.
 *
 * Настраивает хост с авторизацией и адаптером Telegram, возвращает фабрику для создания бота.
 * Гарантирует, что бот инициализируется только один раз (синглтон).
 *
 * @param auth - Построитель политик доступа
 * @param options - Параметры бота: токен, имя устройства, интервалы и др.
 * @returns Функция `useTelegramBot`, возвращающая экземпляр бота
 *
 * @template TPolicy — Тип имён политик доступа
 * @template TCommand — Тип поддерживаемых команд (по умолчанию: never)
 * @template TCallback — Тип обрабатываемых колбэков (по умолчанию: never)
 *
 * @example
 * ```ts
 * const useBot = defineTelegramBot(auth, {
 *   deviceName: 'telegram',
 *   deviceTitle: 'My Bot',
 *   token: '123:abc',
 * });
 *
 * // Позже, в другом модуле или скрипте:
 * const bot = useBot();
 * bot.onCommand('start', ...)
 * ```
 * @since 0.4.8
 *
 **/
export function defineTelegramBot<
  TPolicy extends string,
  TCommand extends string = never,
  TCallback extends string = never
>(
  auth: AuthorizationBuilder<TPolicy>,
  options: BotOptions<NoInfer<TPolicy>, TCommand, TCallback>
) {

  const host = defineBotHost(
    auth,
    telegramAdapter(options),
    options
  )

  return function useTelegramBot() {

    return (instances[options.deviceName] ??= createBot(host)) as Bot<TCommand, TCallback>

  }

}
