import type {
  ButtonBuilder,
  ButtonStyle,
  ReplyKeyboardButton,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove
} from './types';

/**
 * Билдер для настройки reply-кнопки.
 *
 * @since 0.4.8
 *
 **/
interface ReplyButtonBuilder {

  /**
   * Применяет указанный стиль к кнопке.
   *
   * @param style - Стиль кнопки: 'primary', 'success' или 'danger'.
   * @param enabled - Флаг, определяющий, должен ли стиль быть активирован.
   *                  Если не указан, считается равным `true`.
   *                  Если `false`, и текущий стиль совпадает с указанным — стиль будет снят.
   * @example
   * ```ts
   * button.style('primary'); // Устанавливает основной стиль
   * button.style('danger', false); // Снимает стиль 'danger', если он был установлен
   * ```
   * @since 0.4.12
   *
   **/
  style: (style: ButtonStyle, enabled?: boolean) => Omit<this, 'style'>;

  /**
   * Настраивает кнопку для запроса контакта.
   * @param value - Флаг включения запроса контакта.
   *
   **/
  requestContact(value?: boolean): ButtonBuilder;

  /** Настраивает кнопку для запроса геолокации.
   * @param value - Флаг включения запроса геолокации.
   *
   **/
  requestLocation(value?: boolean): ButtonBuilder;

}

/**
 * Билдер строки reply-клавиатуры.
 *
 * @since 0.4.8
 *
 **/
interface ReplyRowBuilder {
  /**
   * Добавляет кнопку в строку.
   **/
  text(
    label: string,
    setup?: (b: ReplyButtonBuilder) => void
  ): ReplyRowBuilder;
}

/**
 * Основной билдер reply-клавиатуры.
 *
 * @since 0.4.8
 *
 **/
export interface ReplyKeyboardBuilder {

  /**
   * Устанавливает, будет ли клавиатура скрыта после первого нажатия.
   *
   * @param value - Опциональный флаг. По умолчанию `true`.
   *                Если не передан — включает режим one-time.
   * @returns Текущий экземпляр билдера для продолжения цепочки вызовов.
   *
   **/
  oneTime(value?: boolean): ReplyKeyboardBuilder;

  /**
   * Устанавливает, должен ли размер клавиатуры подстраиваться под количество кнопок.
   *
   * При включении этот режим делает клавиатуру компактнее.
   *
   * @param value - Опциональный флаг. По умолчанию `true`.
   *                Если не передан — включает режим изменения размера.
   * @returns Текущий экземпляр билдера для продолжения цепочки вызовов.
   *
   **/
  resize(value?: boolean): ReplyKeyboardBuilder;

  /**
   * Добавляет строку кнопок к клавиатуре.
   *
   * Внутри строки можно добавить одну или несколько кнопок с текстом.
   *
   * @param setupRow - Функция для настройки кнопок в строке.
   * @returns Текущий экземпляр билдера для продолжения цепочки вызовов.
   *
   **/
  row(setup: (r: ReplyRowBuilder) => void): ReplyKeyboardBuilder;

}

/**
 * Фабрика для создания клавиатуры ответа (reply keyboard).
 *
 * Позволяет создать клавиатуру с кнопками, которые могут:
 * - Запрашивать контакт
 * - Запрашивать геолокацию
 *
 * @param setup - Функция для построения строк и кнопок
 * @returns Объект клавиатуры в формате Telegram API
 *
 * @example
 * ```ts
 * replyKeyboard(k => k
 *   .oneTime()
 *   .row(r => r
 *     .text('Отправить контакт', t => t.requestContact())
 *   )
 * )
 * ```
 * @since 0.4.8
 *
 **/
export function replyKeyboard(
  setup: (builder: ReplyKeyboardBuilder) => void
): ReplyKeyboardMarkup {

  let oneTime = false;
  let resize = true;

  // Массив строк кнопок
  const rows: ReplyKeyboardButton[][] = [];

  // Билдер клавиатуры
  const builder: ReplyKeyboardBuilder = {

    oneTime(value) {

      oneTime = value !== false;
      return this;

    },

    resize(value) {

      resize = value !== false;
      return this;

    },

    row: (setupRow) => {

      // Кнопки текущей строки
      const buttons: ReplyKeyboardButton[] = [];

      // Билдер строки
      const rowBuilder: ReplyRowBuilder = {
        /**
         * Добавляет текстовую кнопку.
         *
         * @param label - Отображаемый текст кнопки
         * @param setupButton - Опциональная функция для настройки кнопки
         * @returns Билдер строки (для чейнинга)
         **/
        text: (label, setupButton) => {

          // Создаём кнопку
          const button: ReplyKeyboardButton = { text: label };

          // Если есть настройки — применяем
          if (setupButton) {

            // Билдер для настройки действий кнопки
            const buttonBuilder: ReplyButtonBuilder = {

              style: (style, enabled = true) => {

                if (enabled) {

                  button.style = style;

                }
                else if (button.style === style) {

                  delete button.style;

                }

                return buttonBuilder;

              },

              requestContact: (value = true) => {

                button.request_contact = value;
                return buttonBuilder;

              },

              requestLocation: (value = true) => {

                button.request_location = value;
                return buttonBuilder;

              },

            };

            setupButton(buttonBuilder);

          }

          // Добавляем кнопку в строку
          buttons.push(button);
          return rowBuilder;

        },
      };

      // Применяем настройку строки
      setupRow(rowBuilder);

      // Сохраняем строку, если есть кнопки
      if (buttons.length > 0) {

        rows.push(buttons);

      }

      return builder;

    },
  };

  // Запускаем процесс
  setup(builder);

  // Возвращаем результат
  return {
    keyboard: rows,
    resize_keyboard: resize,
    one_time_keyboard: oneTime,
  };

}

/**
 * Создаёт команду на удаление текущей клавиатуры.
 *
 * @returns Объект для удаления клавиатуры
 *
 * @example
 * ```ts
 * reply('Клавиатура скрыта', { keyboard: removeKeyboard() })
 * ```
 * @since 0.4.8
 *
 **/
export function removeKeyboard(): ReplyKeyboardRemove {

  return { remove_keyboard: true };

}
