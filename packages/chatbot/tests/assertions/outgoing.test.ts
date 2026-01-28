import { assertValueIsOutgoing } from '#assertions/outgoing'

describe('Assertions: Outgoing', () => {

  describe('assertValueIsOutgoing', () => {

    it('should accept valid OutgoingRegular with required fields', () => {

      const message = {
        type: 'regular',
        chatId: 123,
        timestamp: Date.now(),
      }

      expect(() => {

        assertValueIsOutgoing(message)

      }).not.toThrow()

    })

    it('should accept OutgoingRegular with text', () => {

      const message = {
        type: 'regular',
        chatId: 123,
        text: 'Hello',
        timestamp: Date.now(),
      }

      expect(() => {

        assertValueIsOutgoing(message)

      }).not.toThrow()

    })

    it('should accept OutgoingRegular with photo', () => {

      const message = {
        type: 'regular',
        chatId: 123,
        photo: 'https://example.com/photo.jpg',
        timestamp: Date.now(),
      }

      expect(() => {

        assertValueIsOutgoing(message)

      }).not.toThrow()

    })

    it('should accept OutgoingRegular with document', () => {

      const message = {
        type: 'regular',
        chatId: 123,
        document: 'path/to/file.pdf',
        timestamp: Date.now(),
      }

      expect(() => {

        assertValueIsOutgoing(message)

      }).not.toThrow()

    })

    it('should accept OutgoingRegular with string chatId', () => {

      const message = {
        type: 'regular',
        chatId: '@username',
        text: 'Hello',
        timestamp: Date.now(),
      }

      expect(() => {

        assertValueIsOutgoing(message)

      }).not.toThrow()

    })

    it('should accept OutgoingRegular with HTML parseMode', () => {

      const message = {
        type: 'regular',
        chatId: 123,
        text: '<b>Bold</b>',
        parseMode: 'HTML',
        timestamp: Date.now(),
      }

      expect(() => {

        assertValueIsOutgoing(message)

      }).not.toThrow()

    })

    it('should accept OutgoingRegular with MarkdownV2 parseMode', () => {

      const message = {
        type: 'regular',
        chatId: 123,
        text: '*Bold*',
        parseMode: 'MarkdownV2',
        timestamp: Date.now(),
      }

      expect(() => {

        assertValueIsOutgoing(message)

      }).not.toThrow()

    })

    it('should accept OutgoingRegular with inline keyboard', () => {

      const message = {
        type: 'regular',
        chatId: 123,
        text: 'Choose',
        keyboard: {
          inline_keyboard: [[{ text: 'Button', callback_data: 'action' }]],
        },
        timestamp: Date.now(),
      }

      expect(() => {

        assertValueIsOutgoing(message)

      }).not.toThrow()

    })

    it('should accept valid OutgoingRaw', () => {

      const message = {
        type: 'raw',
        method: 'sendMessage',
        payload: { chat_id: 123, text: 'Hello' },
        timestamp: Date.now(),
      }

      expect(() => {

        assertValueIsOutgoing(message)

      }).not.toThrow()

    })

    it('should throw on null', () => {

      expect(() => {

        assertValueIsOutgoing(null)

      }).toThrow()

    })

    it('should throw on undefined', () => {

      expect(() => {

        assertValueIsOutgoing(undefined)

      }).toThrow()

    })

    it('should throw on non-object', () => {

      expect(() => {

        assertValueIsOutgoing('string')

      }).toThrow()
      expect(() => {

        assertValueIsOutgoing(123)

      }).toThrow()
      expect(() => {

        assertValueIsOutgoing(true)

      }).toThrow()

    })

    it('should throw on missing type field', () => {

      const message = {
        chatId: 123,
        timestamp: Date.now(),
      }

      expect(() => {

        assertValueIsOutgoing(message)

      }).toThrow(/type/)

    })

    it('should throw on invalid type', () => {

      const message = {
        type: 'invalid',
        chatId: 123,
        timestamp: Date.now(),
      }

      expect(() => {

        assertValueIsOutgoing(message)

      }).toThrow()

    })

    it('should throw on OutgoingRegular with missing chatId', () => {

      const message = {
        type: 'regular',
        text: 'Hello',
        timestamp: Date.now(),
      }

      expect(() => {

        assertValueIsOutgoing(message)

      }).toThrow(/chatId/)

    })

    it('should throw on OutgoingRegular with invalid chatId type', () => {

      const message = {
        type: 'regular',
        chatId: true,
        timestamp: Date.now(),
      }

      expect(() => {

        assertValueIsOutgoing(message)

      }).toThrow(/chatId/)

    })

    it('should throw on OutgoingRegular with missing timestamp', () => {

      const message = {
        type: 'regular',
        chatId: 123,
      }

      expect(() => {

        assertValueIsOutgoing(message)

      }).toThrow(/timestamp/)

    })

    it('should throw on OutgoingRegular with invalid parseMode', () => {

      const message = {
        type: 'regular',
        chatId: 123,
        parseMode: 'Invalid',
        timestamp: Date.now(),
      }

      expect(() => {

        assertValueIsOutgoing(message)

      }).toThrow(/parseMode/)

    })

    it('should throw on OutgoingRaw with missing method', () => {

      const message = {
        type: 'raw',
        payload: {},
        timestamp: Date.now(),
      }

      expect(() => {

        assertValueIsOutgoing(message)

      }).toThrow(/method/)

    })

    it('should throw on OutgoingRaw with non-string method', () => {

      const message = {
        type: 'raw',
        method: 123,
        payload: {},
        timestamp: Date.now(),
      }

      expect(() => {

        assertValueIsOutgoing(message)

      }).toThrow(/method/)

    })

    it('should throw on OutgoingRaw with missing payload', () => {

      const message = {
        type: 'raw',
        method: 'sendMessage',
        timestamp: Date.now(),
      }

      expect(() => {

        assertValueIsOutgoing(message)

      }).toThrow(/payload/)

    })

    it('should throw on OutgoingRaw with non-object payload', () => {

      const message = {
        type: 'raw',
        method: 'sendMessage',
        payload: 'not an object',
        timestamp: Date.now(),
      }

      expect(() => {

        assertValueIsOutgoing(message)

      }).toThrow(/payload/)

    })

  })

})
