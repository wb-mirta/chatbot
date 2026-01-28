# @mirta/chatbot — Telegram-бот для Wiren Board

[![en](https://img.shields.io/badge/lang-en-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/chatbot/blob/latest/packages/chatbot/README.md)
[![ru](https://img.shields.io/badge/lang-ru-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/chatbot/blob/latest/packages/chatbot/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/chatbot?style=flat-square&logo=npm)](https://www.npmjs.com/package/@mirta/chatbot)
[![NPM Downloads](https://img.shields.io/npm/dm/@mirta/chatbot?style=flat-square&logo=npm)](https://www.npmjs.com/package/@mirta/chatbot)

Управляйте вашим контроллером **через Telegram** — безопасно, просто, без лишнего кода.

Этот модуль позволяет:
- Принимать команды из чата: включить свет, открыть ворота и т.д.
- Отправлять уведомления: "Температура упала ниже 18°C"
- Ограничивать доступ: только администраторы или участники группы
- Использовать кнопки, меню, колбэки.

Работает внутри проектов на основе **[Mirta](https://github.com/wb-mirta/core)** — фреймворка для автоматизаций на базе контроллеров Wiren Board.

> 💡 Этот пакет — дополнение экосистемы Mirta.  
> Он подключается к вашему проекту и работает вместе с ним.

## 📦 Установка

Если вы ещё не используете Mirta — начните с [создания проекта](https://github.com/wb-mirta/core).

Затем добавьте функционал бота одной командой:

```bash
pnpm add @mirta/chatbot
```

## 🛠️ Быстрый старт

1. **Создайте Telegram-бота** через [@BotFather](https://t.me/BotFather) → получите токен
2. **Добавьте токен в `.env.local`** вашего проекта

```env
# Токен доступа бота
APP_TELEGRAM_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
# Ваш ID в Telegram
APP_TELEGRAM_USER=123456789
```
3. **Настройте бота** в модуле

```ts
// src/wb-rules-modules/bot-telegram.ts
import { defineTelegramBot, defineAuthorization } from '@mirta/chatbot'

const auth = defineAuthorization(a => a
  .addPolicy('admin', p => p
    .allow(r => r.userId(process.env.APP_TELEGRAM_USER))
  )
)

export const useTelegramBot = defineTelegramBot(auth, {
  deviceName: 'telegram',
  deviceTitle: 'Telegram Bot',
  token: process.env.APP_TELEGRAM_TOKEN,
  commands: {
    start: { policy: 'admin' }
  }
})
```
4. **Используйте бота в скриптах**

```ts
// src/wb-rules/bot-usage.ts
import { useTelegramBot } from '#wbm/bot-telegram'

const bot = useTelegramBot()

bot.onCommand('start', (_, reply) => {
  reply('Привет! Добро пожаловать в систему.')
})
```
5. Соберите и задеплойте проект — бот начнёт работать.

## 🔐 Политики доступа

Определите, кто может выполнять команды:

```ts
const auth = defineAuthorization(a => a
  .addPolicy('admin', p => p
    // Доступ для указанного пользователя
    .allow(r => r.userId('1234567890'))
    // Если он обращается из указанного чата
    .allow(r => r.chatId('9876543210'))
  )
  .addPolicy('subscriber', p => p
    .allow(r => r
      // Доступ для всех пользователей указанного чата
      .chatId('1009876543210')
      // Если это супергруппа
      .chatType('supergroup')
    )
  )
)
```
Правила:
- `allow` — разрешить доступ
- `deny` — запретить (имеет приоритет)

Особенности:
- Несколько `allow` в одной политике работают по принципу **«ИЛИ»**.
- Условия внутри одного `allow` — по принципу **«И»**

## 🧩 Что умеет бот

- ✅ Любые команды вроде `/start`, `/reboot`
- ✅ Колбэк-кнопки
- ✅ Inline-клавиатуры
- ✅ Отправка сообщений
- ✅ Очереди (защита от флуда)
- ⏳ Мессенджер Макс — в разработке (ограничения API)

## 📚 Где посмотреть пример?

Полный рабочий пример — в репозитории:  
👉 [`projects/chatbot-demo`](https://github.com/wb-mirta/chatbot/blob/latest/projects/chatbot-demo)

Там вы найдёте:
- Готовый модуль бота
- Скрипт с командами
- Образец конфигурации `.env` (в своих проектах используйте `.env.local`)

## ❤️ Благодарности

Спасибо, что используете Мирту!  
Вместе мы делаем автоматизации проще — для всех.
