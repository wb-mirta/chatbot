import { defineStore } from '@mirta/store'
import type { Subject, SubjectField, RuleConfig, AccessMap, AuthorizationBuilder } from '#security/types'

/**
 * Состояние хранилища авторизации.
 *
 * @since 0.4.8
 *
 **/
interface AuthState extends Record<string | symbol, unknown> {

  /** Карта политик: имя → массив правил */
  readonly policies: Record<string, readonly RuleConfig[] | undefined>

}

/**
 * Проверяет доступ по карте прав.
 *
 * @param accessMap - Карта доступа (значение → разрешение или время истечения)
 * @param target - Значение субъекта (например, userId)
 * @param now - Текущее время (для проверки временных прав)
 * @returns `true` — разрешено, `false` — запрещено, `null` — правило не применимо
 *
 * @since 0.4.8
 *
 **/
function checkPermission(
  accessMap: AccessMap,
  target: string | number | undefined,
  now: number
): boolean | null {

  if (!target)
    return null

  const value = accessMap[String(target)]

  // Правило неприменимо к субъекту
  if (value === undefined)
    return null

  // Обратываем, как значение expiresAt
  if (typeof value === 'number')
    return now < value

  return value

}

/**
 * Оценивает правило на соответствие субъекту.
 *
 * @param rule - Конфигурация правила
 * @param subject - Данные пользователя и чата
 * @param now - Текущее время
 * @returns `true` — все условия совпали, `false` — не все, `null` — ни одно не применимо
 *
 * @since 0.4.8
 *
 **/
function evaluateRule(
  rule: RuleConfig,
  subject: Subject,
  now: number
): boolean | null {

  const conditions: boolean[] = []

  for (const field of Object.keys(rule) as SubjectField[]) {

    const map = rule[field]

    if (!map || Object.keys(map).length === 0)
      continue

    const checkResult = checkPermission(map, subject[field], now)

    if (checkResult === null)
      continue

    conditions.push(checkResult)

  }

  if (conditions.length === 0)
    return null

  return conditions.every(x => x)

}

/**
 * Хранилище системы авторизации.
 *
 * Управляет политиками доступа и проверяет права субъекта.
 *
 * @since 0.4.8
 *
 **/
export const useAuthStore = defineStore('mirta-chatbot-auth', {
  state: (): AuthState => ({
    policies: {},
  }),
  actions: {

    /**
     * Инициализирует политики доступа.
     *
     * @param auth - Построитель авторизации
     *
     **/
    setup(auth: AuthorizationBuilder): void {

      this.$patch({
        policies: { ...auth.build() },
      })

    },

    /**
     * Проверяет, разрешён ли доступ по указанной политике.
     *
     * - Применяет все правила `deny`: если одно сработало — `false`
     * - Затем проверяет `allow`: хотя бы одно — разрешает
     *
     * @param policyName - Имя политики
     * @param subject - Субъект доступа
     * @returns `true`, если доступ разрешён
     *
     **/
    isAllowed(policyName: string, subject: Subject): boolean {

      const rules = this.policies[policyName]

      if (!rules)
        return false

      const now = Date.now()

      let isAllowed = false

      for (const rule of rules) {

        const checkResult = evaluateRule(rule, subject, now)

        // Правило не применимо к субъекту, пропускаем.
        if (checkResult === null)
          continue

        // Сразу возвращаем false, если обнаружили запрет.
        if (!checkResult)
          return false

        isAllowed = true

      }

      return isAllowed

    },
  },
})
