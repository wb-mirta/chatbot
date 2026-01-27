/**
 * Тип доступа: разрешено/запрещено или временная метка.
 *
 * @since 0.4.8
 *
 **/
export type Access = boolean | number

/**
 * Карта доступа: соответствие между значением параметра и правом доступа.
 *
 * @since 0.4.8
 *
 **/
export type AccessMap = Record<string, Access | undefined>

/**
 * Субъект доступа — информация о пользователе и чате.
 *
 * @since 0.4.8
 *
 **/
export interface Subject {
  /** ID пользователя */
  userId?: number
  /** Имя пользователя */
  username?: string
  /** ID чата */
  chatId?: number
  /** Тип чата */
  chatType?: 'private' | 'group' | 'supergroup' | 'channel'
}

/**
 * Доступные поля субъекта для проверки.
 *
 * @since 0.4.8
 *
 **/
export type SubjectField = Expand<keyof Subject>

/**
 * Конфигурация правила доступа.
 * Сопоставляет поле субъекта с набором допустимых значений.
 *
 * @since 0.4.8
 *
 **/
export type RuleConfig<TValue = Readonly<AccessMap>> = Partial<Record<SubjectField, TValue>>

/**
 * Функция проверки условия доступа.
 *
 * @since 0.4.8
 *
 **/
export type Requirement = (subject: Subject) => boolean

/**
 * Политика доступа — функция, определяющая, разрешён ли доступ.
 *
 * @since 0.4.8
 *
 **/
export type Policy = (subject: Subject) => boolean

/**
 * Преобразует объединение строковых или числовых литералов в тип с ключами-литералами.
 *
 * @example
 * type T = Literalized<'a' | 'b'>; // { a: 'a', b: 'b' }
 *
 * @since 0.4.8
 *
 **/
export type Literalized<TValue extends string | number>
  = { [K in TValue]: K }

/**
 * Построитель системы авторизации.
 *
 * Создаёт типобезопасную конфигурацию политик.
 *
 * @template TPolicy — Объединение имён политик
 * @since 0.4.8
 *
 **/
export interface AuthorizationBuilder<TPolicy extends string = never> {

  /**
   * Формирует объект политик.
   * @returns Запись: имя политики → массив правил
   *
   **/
  build(): Record<TPolicy, readonly RuleConfig[]>

}
