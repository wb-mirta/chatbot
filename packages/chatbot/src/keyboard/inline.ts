import type {
  InlineKeyboardButton,
  InlineKeyboardMarkup
} from '#types'

/**
 * Билдер для настройки inline-кнопки.
 *
 * @since 0.4.8
 *
 **/
interface InlineButtonBuilder {
  /**
   * Устанавливает callback-данные.
   **/
  callback(data: string): InlineButtonBuilder

  /**
   * Устанавливает URL для перехода.
   **/
  url(url: string): InlineButtonBuilder

  /**
   * Переключает на инлайн-поиск с начальным запросом.
   **/
  switchInlineQuery(query: string): InlineButtonBuilder

  /**
   * Переключает на инлайн-поиск в текущем чате.
   **/
  switchInlineQueryCurrentChat(query: string): InlineButtonBuilder
}

/**
 * Билдер строки inline-клавиатуры.
 *
 * @since 0.4.8
 *
 **/
interface InlineRowBuilder {
  /**
   * Добавляет кнопку в строку.
   **/
  text(
    label: string,
    setup?: (b: InlineButtonBuilder) => void
  ): InlineRowBuilder
}

/**
 * Основной билдер inline-клавиатуры.
 *
 * @since 0.4.8
 *
 **/
export interface InlineKeyboardBuilder {
  /**
   * Добавляет строку.
   **/
  row(setup: (r: InlineRowBuilder) => void): InlineKeyboardBuilder
}

/**
 * Фабрика для создания inline-клавиатуры.
 *
 * Позволяет построить клавиатуру с кнопками, поддерживающими:
 * - callback-данные
 * - URL-ссылки
 * - запрос контакта или геолокации
 * - переключение в инлайн-режим
 *
 * @param setup - Функция, принимающая билдер для построения строк и кнопок
 * @returns Объект клавиатуры в формате Telegram API
 *
 * @example
 * ```ts
 * inlineKeyboard(k => k
 *   .row(r => r
 *     .text('Свет', t => t.callback('light_on'))
 *     .text('Сайт', t => t.url('https://example.com'))
 *   )
 *   .row(r => r
 *     .text('Контакт', t => t.requestContact())
 *   )
 * )
 * ```
 * @since 0.4.8
 *
 **/
export function inlineKeyboard(
  setup: (builder: InlineKeyboardBuilder) => void
): InlineKeyboardMarkup {

  // Массив строк кнопок (каждая строка — массив кнопок)
  const rows: InlineKeyboardButton[][] = []

  // Основной билдер для построения клавиатуры
  const builder: InlineKeyboardBuilder = {
    /**
     * Добавляет строку кнопок.
     *
     * @param setupRow - Функция для настройки кнопок в строке
     * @returns Текущий билдер (для чейнинга)
     **/
    row: (setupRow) => {

      // Кнопки текущей строки
      const buttons: InlineKeyboardButton[] = []

      // Билдер строки
      const rowBuilder: InlineRowBuilder = {
        /**
         * Добавляет текстовую кнопку в строку.
         *
         * @param label - Отображаемый текст кнопки
         * @param setupButton - Опциональная функция для настройки поведения кнопки
         * @returns Билдер строки (для чейнинга)
         **/
        text: (label, setupButton) => {

          // Создаём кнопку с текстом
          const button: InlineKeyboardButton = { text: label }

          // Если передана функция настройки — применяем её
          if (setupButton) {

            // Создаём билдер кнопки с методами для настройки
            const buttonBuilder: InlineButtonBuilder = {
              /**
               * Устанавливает callback-данные для кнопки.
               *
               * @param data - Данные, которые будут отправлены при нажатии
               * @returns Билдер кнопки (для чейнинга)
               **/
              callback: (data) => {

                button.callback_data = data
                return buttonBuilder

              },
              /**
               * Устанавливает URL, который откроется при нажатии.
               *
               * @param url - Ссылка для перехода
               * @returns Билдер кнопки (для чейнинга)
               **/
              url: (url) => {

                button.url = url
                return buttonBuilder

              },
              /**
               * Переключает на инлайн-поиск с начальным запросом.
               *
               * @param query - Начальный текст запроса
               * @returns Билдер кнопки (для чейнинга)
               **/
              switchInlineQuery: (query) => {

                button.switch_inline_query = query
                return buttonBuilder

              },
              /**
               * Переключает на инлайн-поиск в текущем чате.
               *
               * @param query - Начальный текст запроса
               * @returns Билдер кнопки (для чейнинга)
               **/
              switchInlineQueryCurrentChat: (query) => {

                button.switch_inline_query_current_chat = query
                return buttonBuilder

              },
            }
            // Применяем настройки к кнопке
            setupButton(buttonBuilder)

          }

          // Добавляем кнопку в строку
          buttons.push(button)
          return rowBuilder

        },
      }

      // Применяем настройку строки
      setupRow(rowBuilder)
      // Если в строке есть кнопки — добавляем её в общую сетку
      if (buttons.length > 0) {

        rows.push(buttons)

      }

      return builder

    },
  }

  // Запускаем процесс построения
  setup(builder)

  // Возвращаем результат в формате Telegram API
  return { inline_keyboard: rows }

}
