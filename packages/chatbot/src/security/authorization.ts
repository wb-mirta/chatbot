import type { AuthorizationBuilder, RuleConfig } from './types';
import { createPolicy, type Policy } from './policy';

/**
 * Интерфейс конфигуратора системы авторизации.
 *
 * Позволяет последовательно добавлять политики доступа с использованием инкрементальной типизации.
 * Каждое добавление политики расширяет объединённый тип `TPolicy`, что обеспечивает типобезопасность
 * при использовании имён политик в других частях системы (например, в командах бота).
 *
 * @template TPolicy — Текущее объединение всех имён политик (выводится автоматически)
 *
 * @example
 * ```ts
 * const auth = defineAuthorization(a => a
 *   .addPolicy('admin', p => p.allow(r => r.userId('123')))
 *   .addPolicy('subscribers', p => p.allow(r => r.chatId('987')))
 * )
 * // Тип: Authorization<'admin' | 'subscribers'>
 * ```
 * @since 0.4.8
 *
 **/
export interface Authorization<TPolicy extends string = never> {

  /**
   * Добавляет новую политику доступа в систему.
   *
   * @param name - Уникальное имя политики (например, 'admin', 'subscriber')
   * @param setup - Функция-конфигуратор, определяющая правила политики
   * @returns Новый экземпляр `Authorization` с обновлённым типом `TPolicy`
   *
   * @remarks
   * Используется цепочка вызовов. Каждое имя политики добавляется в общий тип,
   * что позволяет потом проверять корректность ссылок на политики в других частях приложения.
   *
   **/
  addPolicy<TName extends string>(
    name: TName,
    setup: (p: Policy) => Policy
  ): Authorization<TPolicy | TName>;

}

/**
 * Создаёт сервис авторизации с поддержкой типобезопасных политик.
 *
 * Функция использует **инкрементальную типизацию**, чтобы:
 * - Собирать имена политик из `.addPolicy(...)`
 * - Гарантировать, что только объявленные политики могут быть использованы
 * - Предотвращать опечатки и ошибки в именах политик на этапе компиляции
 *
 * @param setup - Функция, принимающая конфигуратор `Authorization` и возвращающая настроенное определение
 * @returns Объект, содержащий метод `.build()`, возвращающий записи политик `{ policyName: rules[] }`
 *
 * @template TPolicy — Выведенный тип объединения всех имён политик
 *
 * @example
 * ```ts
 * const auth = defineAuthorization(a => a
 *   .addPolicy('team', p => p
 *     // Разрешить доступ всем участникам группы
 *     .allow(r => r.chatId('123456789'))
 *     // Но запретить конкретного пользователя, даже если он в группе
 *     .deny(r => r.userId('999888777'))
 *   )
 * )
 * ```
 *
 * @since 0.4.8
 *
 **/
export function defineAuthorization<
  TPolicy extends string
>(
  setup: (authorization: Authorization) => Authorization<TPolicy>
): AuthorizationBuilder<TPolicy> {

  const definition: AuthorizationBuilder<TPolicy> = {

    build() {

      const policies: Record<string, readonly RuleConfig[]> = {};

      const authorization: Authorization<string> = {

        addPolicy(name, setupPolicy) {

          policies[name] = createPolicy(setupPolicy);

          return this;

        },

      };

      setup(authorization);

      return policies;

    },

  };

  return definition;

}
