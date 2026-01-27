# @mirta/chatbot — Telegram Bot for Wiren Board

[![en](https://img.shields.io/badge/lang-en-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/chatbot/blob/latest/packages/chatbot/README.md)
[![ru](https://img.shields.io/badge/lang-ru-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/chatbot/blob/latest/packages/chatbot/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/chatbot?style=flat-square&logo=npm)](https://www.npmjs.com/package/@mirta/chatbot)
[![NPM Downloads](https://img.shields.io/npm/dm/@mirta/chatbot?style=flat-square&logo=npm)](https://www.npmjs.com/package/@mirta/chatbot)

Control your Wiren Board **via Telegram** — securely, simply, with no extra code.

This module allows you to:
- Accept commands from chat: turn on lights, open gates, etc.
- Send notifications: "Temperature dropped below 18°C"
- Restrict access: admins only or specific group members
- Use buttons, menus, and callbacks

Works inside projects based on **[Mirta](https://github.com/wb-mirta/core)** — a framework for automation on Wiren Board controllers.

> 💡 This package is an extension of the Mirta ecosystem.  
> It integrates directly into your project and works alongside it.

## 📦 Installation

If you're not yet using Mirta — start by [creating a project](https://github.com/wb-mirta/core).

Then add the bot functionality with one command:

```bash
pnpm add @mirta/chatbot
```

## 🚀 Quick Start

1. **Create a Telegram bot** via [@BotFather](https://t.me/BotFather) → get your token
2. **Add the token to `.env.local`** in your project:

```env
# Bot access token
APP_TELEGRAM_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
# Your Telegram user ID
APP_TELEGRAM_USER=123456789
```

3. **Configure the bot** in a module:

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

4. **Use the bot in your scripts**:

```ts
// src/wb-rules/bot-usage.ts
import { useTelegramBot } from '#wbm/bot-telegram'

const bot = useTelegramBot()

bot.onCommand('start', (_, reply) => {
  reply('Hello! Welcome to the system.')
})
```

5. Build and deploy your project — the bot will start working.

## 🔐 Access Policies

Define who can execute commands:

```ts
const auth = defineAuthorization(a => a
  .addPolicy('admin', p => p
    // Access for specific user
    .allow(r => r.userId('1234567890'))
    // Or if request comes from specific chat
    .allow(r => r.chatId('9876543210'))
  )
  .addPolicy('subscriber', p => p
    .allow(r => r
      // Access for all users in specified chat
      .chatId('1009876543210')
      // If it's a supergroup
      .chatType('supergroup')
    )
  )
)
```

Rules:
- `allow` — permit access
- `deny` — deny access (has higher priority)

Behavior:
- Multiple `allow` calls in one policy are combined with **OR**
- Conditions within a single `allow` are combined with **AND**

## 🧩 Bot Features

- ✅ Any commands like `/start`, `/reboot`
- ✅ Callback buttons
- ✅ Inline keyboards
- ✅ Sending messages
- ✅ Message queues (flood protection)
- ⏳ Max Messenger — in development (API restrictions)

## 📚 Where to see an example?

A complete working example is available in the repository:  
👉 [`projects/chatbot-demo`](https://github.com/wb-mirta/chatbot/blob/latest/projects/chatbot-demo)

There you’ll find:
- Ready-to-use bot module
- Script with command handlers
- Sample `.env` configuration (use `.env.local` in your own projects)

## ❤️ Thank You

Thank you for using Mirta!  
Together we make automation simpler — for everyone.
