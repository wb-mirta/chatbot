import type { RuleConfig } from './types';
import { createRule, type Rule } from './rule';

/**
 * Конфигуратор политики доступа.
 *
 * Позволяет определить правила, кто может (`allow`) и кто не может (`deny`) выполнить действие.
 * Поддерживает цепочку вызовов для удобного построения политики.
 *
 * Особенности:
 * - Все правила `deny`, соответствующие субъекту, **незамедлительно блокируют доступ**, независимо от `allow`
 * - Порядок объявления правил не влияет на приоритет: любое подходящее `deny` — запрет
 * - Доступ разрешается, только если:
 *   - Есть хотя бы одно подходящее `allow` (логическое "ИЛИ")
 *   - Ни одно `deny` не применилось к субъекту
 * - Внутри одного `allow` работает логическое "И".
 *
 * @example
 * ```ts
 * const policy = createPolicy(p => p
 *   .allow(r => r.chatId('123456789')) // Разрешить всем в чате
 *   .deny(r => r.userId('999888777'))  // Запретить конкретного пользователя
 * )
 * ```
 * @since 0.4.8
 *
 **/
export interface Policy {
  /**
   * Добавляет правило разрешения.
   *
   * Условия внутри правила объединяются через "И".
   *
   **/
  allow(setup: (rule: Rule) => void): Policy;

  /**
   * Добавляет правило запрета.
   *
   * Имеет приоритет над `allow`. Внутренние условия — через "И".
   *
   **/
  deny(setup: (rule: Rule) => void): Policy;

}

/**
 * Создаёт массив правил доступа.
 *
 * @param setup - Конфигурация политики
 * @returns Массив сконфигурированных правил
 *
 * @internal
 *
 * @since 0.4.8
 *
 **/
export function createPolicy(
  setup: (policy: Policy) => void
): RuleConfig[] {

  const rules: RuleConfig[] = [];

  setup({

    allow(setupRule) {

      rules.push(
        createRule('allow', setupRule)
      );

      return this;

    },

    deny(setupRule) {

      rules.push(
        createRule('deny', setupRule)
      );

      return this;

    },

  });

  return rules;

}
