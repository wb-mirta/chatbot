import { useTelegramBot } from '#wbm/bot-telegram'

const bot = useTelegramBot()

bot.onCommand('start', (_context, reply) => {

  log.debug('Preparing answer')

  reply('Выберите вариант', b => b
    .inlineKeyboard(k => k
      // Строка клавиатуры
      .row(r => r
        .text('Канал на Дзене', t => t
          .url('https://dzen.ru/wihome')
        )
        .text('Репозиторий', t => t
          .url('https://github.com/wb-mirta/core')
        )
      )
      // Строка клавиатуры
      .row(r => r
        .text('Официальный чат Wiren Board', t => t
          .url('https://t.me/wirenboard')
        )
      )
      .row(r => r
        .text('Say "Hello!"', t => t
          .callback('hello')
        )
      )
    )
  )

})

bot.onCommand('show_keyboard', (_context, reply) => {

  log.debug('Preparing answer')

  reply('Выберите вариант', b => b
    .replyKeyboard(k => k
      .oneTime()
      // Строка клавиатуры
      .row(r => r
        .text('Привет!')
        .text('Как дела?')
      ))
  )

})

bot.onCallback('hello', (context, done) => {

  done('Hello!')

  bot.sendMessage(context.chatId, 'Hello _again_', b => b
    .inlineKeyboard(k => k
      .row(r => r
        .text('Повтор', t => t
          .callback('hello')
        )
      )
    ))

})
