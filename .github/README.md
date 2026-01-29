# Mirta Chatbot

[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/wb-mirta/chatbot/build.yml?branch=latest&logo=github&style=flat-square)](https://github.com/wb-mirta/chatbot/actions/workflows/build.yml)
[![GitHub Repo Stars](https://img.shields.io/github/stars/wb-mirta/chatbot?color=594ae2&style=flat-square&logo=github)](https://github.com/wb-mirta/chatbot/stargazers)
[![GitHub Last Commit](https://img.shields.io/github/last-commit/wb-mirta/chatbot?color=594ae2&style=flat-square&logo=github)](https://github.com/wb-mirta/chatbot)
[![NPM Downloads](https://img.shields.io/npm/dm/@mirta/chatbot?style=flat-square&logo=npm)](https://npmjs.com/package/@mirta/chatbot)
[![pkg.pr.new](https://pkg.pr.new/badge/wb-mirta/chatbot?style=flat-square&color=555)](https://pkg.pr.new/~/wb-mirta/chatbot)

Здесь разрабатывается модуль **`@mirta/chatbot`** — готовое решение, чтобы управлять контроллером Wiren Board **через Telegram**.

Чат-бот позволяет:
- Принимать команды из чата — включить свет, проверить температуру и т.д.
- Ограничивать доступ по политикам — определённые пользователи, указанные чаты
- Отправлять уведомления

Модуль работает внутри проектов на основе **[Mirta](https://github.com/wb-mirta/core)** — фреймворка для автоматизаций.

## Начало работы

Просто добавьте пакет в свой проект Mirta:

```bash
pnpm add @mirta/chatbot
```
Настройте бота, указав токен и политики доступа — и он сразу заработает.

Подробнее о настройке — в [документации пакета](https://github.com/wb-mirta/chatbot/blob/latest/packages/chatbot/README.ru.md)

### 🗂️ Структура репозитория

Это **монорепозиторий** — он содержит несколько проектов:

#### 1. [`packages/chatbot`](https://github.com/wb-mirta/chatbot/blob/latest/packages/chatbot/README.md) — ядро бота
- Готовый модуль для подключения
- Работает только внутри проектов Mirta
- Публикуется в npm как [`@mirta/chatbot`](https://www.npmjs.com/package/@mirta/chatbot)
- Включает авторизацию, обработку команд, защиту от флуда

#### 2. [`projects/chatbot-demo`](https://github.com/wb-mirta/chatbot/blob/latest/projects/chatbot-demo/README.md) — живой пример
- Полностью рабочий проект Mirta
- Показывает, как использовать бота в реальных условиях
- Подходит для тестирования и отладки новых функций
- Легко собрать и задеплоить на контроллер

### 🔧 Хотите внести вклад?

Отлично! Этот репозиторий — открытая площадка для развития бота.

Клонируйте, запустите `chatbot-demo`, проверьте изменения — и отправьте Pull Request.

Подробная инструкция по настройке тестового стенда — в [руководстве по запуску примера](https://github.com/wb-mirta/chatbot/blob/latest/projects/chatbot-demo/README.md).

### 🌐 Будут ли другие мессенджеры?

Сейчас реализован **Telegram**, потому что он открыт для всех.

Внутри уже есть заготовка для **Max**, но её развитие приостановлено — создание ботов пока ограничено политикой платформы.  
Как только появится возможность — мы продолжим.

### ❤️ Благодарности

Спасибо, что используете Мирту!  
Вместе мы делаем автоматизации проще — для всех.
