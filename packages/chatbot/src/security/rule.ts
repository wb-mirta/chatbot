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
export type Rule = Record<SubjectField, (...values: NonEmptyArray<string>) => Rule>

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

  function addValues(field: SubjectField, values: NonEmptyArray<string>) {

    config[field] ??= {}

    for (const value of values)
      config[field][value] = isAllow

    return rule

  }

  const rule: Rule = {

    userId: (...values) => addValues('userId', values),

    username: (...values) => addValues('username', values),

    chatId: (...values) => addValues('chatId', values),

    chatType: (...values) => addValues('chatType', values),

  }

  // Выполняем настройку
  setup(rule)

  // Возвращаем готовую конфигурацию
  return config

}
