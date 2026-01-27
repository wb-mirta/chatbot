import type { AccessMap, RuleConfig, SubjectField } from '#security/types'

type NonEmptyArray<TValue> = [TValue, ...TValue[]]

/**
 * Билдер для построения условия доступа.
 * Поддерживает:
 * - userId
 * - username
 * - chatId
 * - chatType
 *
 * @since 0.4.8
 *
 **/
export type Rule<TMethod = SubjectField> = Record<SubjectField, (...values: NonEmptyArray<string>) => Rule<TMethod>>

/**
 * Фабрика для создания функции проверки доступа.
 *
 * Принимает функцию-настройщик, которая использует билдер
 * для определения условий. Возвращает предикат: (ctx) => boolean
 *
 * @param setup - Функция-билдер
 * @returns Правило проверки
 *
 * @since 0.4.8
 *
 **/
export function createRule(

  type: 'allow' | 'deny',
  setup: (rule: Rule) => void

): RuleConfig {

  const isAllow = type === 'allow'

  const config: RuleConfig<AccessMap> = {}

  const rule: Rule = {

    userId(...values) {

      config.userId ??= {}

      for (const value of values)
        config.userId[value] = isAllow

      return rule

    },

    username(...values) {

      config.username ??= {}

      for (const value of values)
        config.username[value] = isAllow

      return rule

    },

    chatId(...values) {

      config.chatId ??= {}

      for (const value of values)
        config.chatId[value] = isAllow

      return rule

    },

    chatType(...values) {

      config.chatType ??= {}

      for (const value of values)
        config.chatType[value] = isAllow

      return rule

    },

  }

  // Выполняем настройку
  setup(rule)

  // Возвращаем готовую конфигурацию
  return config

}
