import type { OutgoingRegular } from '#types'
import { inlineKeyboard, replyKeyboard, removeKeyboard } from '#keyboard/index'
import type { KeyboardReplyBuilder } from './types'

/**
 * Создаёт построитель ответа, привязанный к конкретному исходящему сообщению.
 *
 * Позволяет пошагово форматировать сообщение: добавлять клавиатуры, устанавливать разметку,
 * удалять текущую клавиатуру. Все изменения применяются непосредственно к переданному объекту `message`.
 *
 * Используется внутри `createBot` для реализации функции `reply`.
 *
 * @param message - Объект исходящего сообщения (частично заполненный)
 * @returns Объект `ReplyBuilder`, позволяющий модифицировать сообщение
 *
 * @internal Функция предназначена для внутреннего использования в ядре бота
 *
 * @example
 * ```ts
 * const message: OutgoingRegular = { text: 'Привет', chatId: 123456 };
 * const builder = createReplyBuilder(message);
 *
 * builder.inlineKeyboard(k => {
 *   k.row(r => r.text('Нажми меня', t => t.callback('click')));
 * });
 *
 * // Теперь message содержит клавиатуру
 * ```
 * @since 0.4.8
 *
 **/
export function createReplyBuilder(message: Partial<OutgoingRegular>): KeyboardReplyBuilder {

  const builder: KeyboardReplyBuilder = {

    /**
     * Добавляет инлайн-клавиатуру к сообщению.
     *
     * @param setup - Функция для построения структуры клавиатуры
     * @returns Текущий экземпляр билдера (для цепочки вызовов)
     *
     **/
    inlineKeyboard(setup) {

      message.keyboard = inlineKeyboard(setup)
      return this

    },

    /**
     * Добавляет стандартную (reply) клавиатуру к сообщению.
     *
     * @param setup - Функция для настройки кнопок
     * @param options - Параметры отображения:
     * @returns Текущий экземпляр билдера
     *
     **/
    replyKeyboard(setup) {

      message.keyboard = replyKeyboard(setup)
      return this

    },

    /**
     * Устанавливает команду удаления текущей клавиатуры.
     *
     * После отправки сообщения клавиатура будет скрыта у пользователя.
     *
     * @returns Текущий экземпляр билдера
     *
     **/
    removeKeyboard() {

      message.keyboard = removeKeyboard()

      return this

    },

    /**
     * Устанавливает режим разметки текста.
     *
     * Поддерживает:
     * - `'HTML'` — для HTML-разметки
     * - `'MarkdownV2'` — для Markdown (Telegram)
     *
     * @param mode - Режим разметки
     * @returns Текущий экземпляр билдера
     *
     **/
    parseMode(mode) {

      message.parseMode = mode

      return this

    },

  }

  return builder

}
