import type { Incoming, Outgoing } from '#types';
import { defineStore } from '@mirta/store';

/**
 * Хранилище состояния бота.
 *
 * Управляет очередями сообщений, статусом подключения, статистикой ошибок
 * и правом на инициализацию хоста.
 *
 * @since 0.4.8
 *
 **/
export const useBotStore = defineStore('mirta-chatbot', {
  state: () => ({
    /** Имя файла-владельца хоста (для предотвращения дублирования) */
    hostFilename: '',
    /** Очередь входящих сообщений */
    incoming: [] as Incoming[],
    /** Очередь исходящих сообщений */
    outgoing: [] as Outgoing[],
    /** Флаг включения бота */
    isEnabled: false,
    /** Флаг активности опроса */
    isPolling: false,
    /** Флаг активности отправки */
    isSending: false,
    /** Статистика ошибок */
    stats: {
      pollErrors: 0,
      sendErrors: 0,
    },
    /** Последний обработанный update_id */
    lastUpdateId: 0,
    /** Режим отладки */
    isDebug: false,
  }),
  actions: {

    /**
     * Пытается захватить право инициализации хоста.
     *
     * Только один скрипт может быть инициализатором.
     *
     * @param filename - Имя файла скрипта
     * @returns `true`, если инициализация разрешена
     *
     **/
    claimHostOwnership(filename: string): boolean {

      // Если инициализатор стора - другой скрипт wb-rules, возвращаем false.
      if (this.hostFilename && this.hostFilename !== filename)
        return false;

      // Если инициализатор не установлен - устанавливаем его.
      if (!this.hostFilename)
        this.hostFilename = filename;

      return true;

    },

    /**
     * Добавляет входящее сообщение в очередь.
     *
     **/
    enqueueIncoming(incoming: Incoming): void {

      this.incoming.push(incoming);

    },

    /**
     * Извлекает сообщение из очереди входящих.
     *
     * @returns Сообщение или `undefined`, если очередь пуста
     *
     **/
    dequeueIncoming(): Incoming | undefined {

      return this.incoming.shift();

    },

    /**
     * Очищает очереди входящих и исходящих сообщений.
     *
     **/
    resetQueues() {

      this.incoming = [];
      this.outgoing = [];

    },

    /**
     * Добавляет исходящее сообщение в очередь.
     *
     **/
    enqueueOutgoing(outgoing: Outgoing): void {

      this.outgoing.push(outgoing);

    },

    /**
     * Извлекает сообщение из очереди исходящих.
     *
     * @returns Сообщение или `undefined`, если очередь пуста
     *
     **/
    dequeueOutgoing(): Outgoing | undefined {

      return this.outgoing.shift();

    },

    /**
     * Сбрасывает счётчик ошибок опроса.
     *
     **/
    pollSuccess() {

      this.stats.pollErrors = 0;

    },

    /**
     * Увеличивает счётчик ошибок опроса.
     *
     **/
    pollFail() {

      this.stats.pollErrors += 1;

    },

    /**
     * Сбрасывает счётчик ошибок отправки.
     *
     **/
    sendSuccess() {

      this.stats.sendErrors = 0;

    },

    /**
     * Увеличивает счётчик ошибок отправки.
     *
     **/
    sendFail() {

      this.stats.sendErrors += 1;

    },
  },
});
