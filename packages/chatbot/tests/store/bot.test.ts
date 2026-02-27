import { mockDefineStore } from '../mocks/store';

vi.mock('@mirta/store', () => ({
  defineStore: mockDefineStore,
}));

const { useBotStore } = await import('#store/index');

describe('Store: Bot', () => {

  let store: ReturnType<typeof useBotStore>;

  beforeEach(() => {

    store = useBotStore();
    store.$reset();

  });

  describe('useBotStore', () => {

    describe('claimHostOwnership', () => {

      it('should claim ownership when no owner exists', () => {

        const result = store.claimHostOwnership('script1.js');

        expect(result).toBe(true);
        expect(store.hostFilename).toBe('script1.js');

      });

      it('should allow same owner to claim again', () => {

        store.claimHostOwnership('script1.js');
        const result = store.claimHostOwnership('script1.js');

        expect(result).toBe(true);
        expect(store.hostFilename).toBe('script1.js');

      });

      it('should deny different owner', () => {

        store.claimHostOwnership('script1.js');
        const result = store.claimHostOwnership('script2.js');

        expect(result).toBe(false);
        expect(store.hostFilename).toBe('script1.js');

      });

    });

    describe('incoming queue', () => {

      it('should enqueue incoming command', () => {

        const incoming = {
          type: 'command' as const,
          chatId: 123,
          messageId: 'msg1',
          command: 'start',
          args: '',
          timestamp: Date.now(),
        };

        store.enqueueIncoming(incoming);

        expect(store.incoming).toHaveLength(1);
        expect(store.incoming[0]).toEqual(incoming);

      });

      it('should dequeue incoming in FIFO order', () => {

        const incoming1 = {
          type: 'command' as const,
          chatId: 123,
          messageId: 'msg1',
          command: 'start',
          args: '',
          timestamp: Date.now(),
        };
        const incoming2 = {
          type: 'callback' as const,
          chatId: 456,
          messageId: 'msg2',
          id: 'cb1',
          data: 'action',
          timestamp: Date.now(),
        };

        store.enqueueIncoming(incoming1);
        store.enqueueIncoming(incoming2);

        const first = store.dequeueIncoming();
        const second = store.dequeueIncoming();

        expect(first).toEqual(incoming1);
        expect(second).toEqual(incoming2);
        expect(store.incoming).toHaveLength(0);

      });

      it('should return undefined when queue is empty', () => {

        const result = store.dequeueIncoming();
        expect(result).toBeUndefined();

      });

    });

    describe('outgoing queue', () => {

      it('should enqueue outgoing message', () => {

        const outgoing = {
          type: 'regular' as const,
          chatId: 123,
          text: 'Hello',
          timestamp: Date.now(),
        };

        store.enqueueOutgoing(outgoing);

        expect(store.outgoing).toHaveLength(1);
        expect(store.outgoing[0]).toEqual(outgoing);

      });

      it('should dequeue outgoing in FIFO order', () => {

        const outgoing1 = {
          type: 'regular' as const,
          chatId: 123,
          text: 'First',
          timestamp: Date.now(),
        };
        const outgoing2 = {
          type: 'raw' as const,
          method: 'sendMessage',
          payload: { chat_id: 456 },
          timestamp: Date.now(),
        };

        store.enqueueOutgoing(outgoing1);
        store.enqueueOutgoing(outgoing2);

        const first = store.dequeueOutgoing();
        const second = store.dequeueOutgoing();

        expect(first).toEqual(outgoing1);
        expect(second).toEqual(outgoing2);
        expect(store.outgoing).toHaveLength(0);

      });

      it('should return undefined when queue is empty', () => {

        const result = store.dequeueOutgoing();
        expect(result).toBeUndefined();

      });

    });

    describe('resetQueues', () => {

      it('should clear both incoming and outgoing queues', () => {

        store.enqueueIncoming({
          type: 'command',
          chatId: 123,
          messageId: 'msg1',
          command: 'start',
          args: '',
          timestamp: Date.now(),
        });
        store.enqueueOutgoing({
          type: 'regular',
          chatId: 123,
          text: 'Hello',
          timestamp: Date.now(),
        });

        store.resetQueues();

        expect(store.incoming).toHaveLength(0);
        expect(store.outgoing).toHaveLength(0);

      });

    });

    describe('poll statistics', () => {

      it('should reset poll errors on success', () => {

        store.stats.pollErrors = 3;
        store.pollSuccess();

        expect(store.stats.pollErrors).toBe(0);

      });

      it('should increment poll errors on failure', () => {

        store.pollFail();
        store.pollFail();

        expect(store.stats.pollErrors).toBe(2);

      });

    });

    describe('send statistics', () => {

      it('should reset send errors on success', () => {

        store.stats.sendErrors = 5;
        store.sendSuccess();

        expect(store.stats.sendErrors).toBe(0);

      });

      it('should increment send errors on failure', () => {

        store.sendFail();
        store.sendFail();
        store.sendFail();

        expect(store.stats.sendErrors).toBe(3);

      });

    });

    describe('state flags', () => {

      it('should initialize with default state', () => {

        expect(store.isEnabled).toBe(false);
        expect(store.isPolling).toBe(false);
        expect(store.isSending).toBe(false);
        expect(store.isDebug).toBe(false);
        expect(store.lastUpdateId).toBe(0);

      });

      it('should allow state mutation', () => {

        store.isEnabled = true;
        store.isDebug = true;
        store.lastUpdateId = 12345;

        expect(store.isEnabled).toBe(true);
        expect(store.isDebug).toBe(true);
        expect(store.lastUpdateId).toBe(12345);

      });

    });

    describe('hostFilename', () => {

      it('should initialize as empty string', () => {

        expect(store.hostFilename).toBe('');

      });

    });

    describe('stats', () => {

      it('should initialize with zero errors', () => {

        expect(store.stats.pollErrors).toBe(0);
        expect(store.stats.sendErrors).toBe(0);

      });

    });

  });

});
