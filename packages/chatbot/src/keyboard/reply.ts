import type {
  ReplyKeyboardButton,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove
} from '#types'

/**
 * Билдер для настройки reply-кнопки.
 *
 * @since 0.4.8
 *
 **/
interface ReplyButtonBuilder {
  /**
   * Настраивает запрос контакта.
   **/
  requestContact(): ReplyButtonBuilder

  /**
   * Настраивает запрос геолокации.
   **/
  requestLocation(): ReplyButtonBuilder
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
  ): ReplyRowBuilder
}

/**
 * Основной билдер reply-клавиатуры.
 *
 * @since 0.4.8
 *
 **/
export interface ReplyKeyboardBuilder {
  /**
   * Добавляет строку.
   **/
  row(setup: (r: ReplyRowBuilder) => void): ReplyKeyboardBuilder
}

/**
 * Фабрика для создания клавиатуры ответа (reply keyboard).
 *
 * Позволяет создать клавиатуру с кнопками, которые могут:
 * - Запрашивать контакт
 * - Запрашивать геолокацию
 *
 * @param setup - Функция для построения строк и кнопок
 * @param options - Опции отображения клавиатуры
 * @param options.resize - Автоматически подбирать размер (по умолчанию: true)
 * @param options.oneTime - Спрятать клавиатуру после первого использования (по умолчанию: false)
 * @returns Объект клавиатуры в формате Telegram API
 *
 * @example
 * ```ts
 * replyKeyboard(k => k
 *   .row(r => r
 *     .text('Отправить контакт', t => t.requestContact())
 *   )
 * )
 * ```
 * @since 0.4.8
 *
 **/
export function replyKeyboard(
  setup: (builder: ReplyKeyboardBuilder) => void,
  options?: { resize?: boolean, oneTime?: boolean }
): ReplyKeyboardMarkup {

  // Массив строк кнопок
  const rows: ReplyKeyboardButton[][] = []

  // Билдер клавиатуры
  const builder: ReplyKeyboardBuilder = {
    /**
     * Добавляет строку кнопок.
     *
     * @param setupRow - Функция для настройки кнопок в строке
     * @returns Билдер клавиатуры (для чейнинга)
     **/
    row: (setupRow) => {

      // Кнопки текущей строки
      const buttons: ReplyKeyboardButton[] = []

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
          const button: ReplyKeyboardButton = { text: label }

          // Если есть настройки — применяем
          if (setupButton) {

            // Билдер для настройки действий кнопки
            const buttonBuilder: ReplyButtonBuilder = {
              /**
               * Настраивает кнопку для запроса контакта.
               *
               * @returns Билдер кнопки (для чейнинга)
               **/
              requestContact: () => {

                button.request_contact = true
                return buttonBuilder

              },
              /**
               * Настраивает кнопку для запроса геолокации.
               *
               * @returns Билдер кнопки (для чейнинга)
               **/
              requestLocation: () => {

                button.request_location = true
                return buttonBuilder

              },
            }
            setupButton(buttonBuilder)

          }

          // Добавляем кнопку в строку
          buttons.push(button)
          return rowBuilder

        },
      }

      // Применяем настройку строки
      setupRow(rowBuilder)
      // Сохраняем строку, если есть кнопки
      if (buttons.length > 0) {

        rows.push(buttons)

      }

      return builder

    },
  }

  // Запускаем процесс
  setup(builder)

  // Возвращаем результат
  return {
    keyboard: rows,
    resize_keyboard: options?.resize ?? true,
    one_time_keyboard: options?.oneTime ?? false,
  }

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

  return { remove_keyboard: true }

}
