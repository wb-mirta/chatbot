/**
 * Маркерный тип для завершения цепочки вызовов в билдере кнопки клавиатуры.
 *
 * @since 0.4.8
 *
 **/
export type ButtonBuilder = object

/**
 * Кнопка инлайн-клавиатуры.
 *
 * @since 0.4.8
 *
 **/
export interface InlineKeyboardButton {
  text: string
  callback_data?: string
  url?: string
  request_contact?: boolean
  request_location?: boolean
  switch_inline_query?: string
  switch_inline_query_current_chat?: string
  login_url?: {
    url: string
    forward_text?: string
    bot_username?: string
    request_write_access?: boolean
  }
  callback_game?: Record<string, unknown>
  pay?: boolean
}

/**
 * Структура инлайн-клавиатуры (массив строк кнопок).
 *
 * @since 0.4.8
 *
 **/
export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][]
}

/**
 * Кнопка reply-клавиатуры.
 *
 * @since 0.4.8
 *
 **/
export interface ReplyKeyboardButton {
  text: string
  request_contact?: boolean
  request_location?: boolean
}

/**
 * Структура reply-клавиатуры.
 *
 * @since 0.4.8
 *
 **/
export interface ReplyKeyboardMarkup {
  keyboard: ReplyKeyboardButton[][]
  resize_keyboard?: boolean
  one_time_keyboard?: boolean
  selective?: boolean
}

/**
 * Команда удаления текущей клавиатуры.
 *
 * @since 0.4.8
 *
 **/
export interface ReplyKeyboardRemove {
  remove_keyboard: true
  selective?: boolean
}

/**
 * Объединение всех типов клавиатур.
 *
 * @since 0.4.8
 *
 **/
export type KeyboardMarkup = InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove
