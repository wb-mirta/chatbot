import { createMessageBuilder } from '#bot/message.builder'

describe('Bot: Message Builder', () => {

  describe('createMessageBuilder', () => {

    it('should mutate message in place', () => {

      const message: Record<string, string> = { text: 'Hello' }
      const builder = createMessageBuilder(message)

      builder.parseMode('HTML')

      expect(message.parseMode).toBe('HTML')

    })

    it('should set parse mode to HTML', () => {

      const message: Record<string, string> = {}
      const builder = createMessageBuilder(message)

      builder.parseMode('HTML')

      expect(message.parseMode).toBe('HTML')

    })

    it('should set parse mode to MarkdownV2', () => {

      const message: Record<string, string> = {}
      const builder = createMessageBuilder(message)

      builder.parseMode('MarkdownV2')

      expect(message.parseMode).toBe('MarkdownV2')

    })

    it('should add inline keyboard', () => {

      const message: Record<string, string> = {}
      const builder = createMessageBuilder(message)

      builder.inlineKeyboard(k => k
        .row(r => r
          .text('Button')
        )
      )

      expect(message.keyboard).toBeDefined()
      expect(message.keyboard).toHaveProperty('inline_keyboard')

    })

    it('should add reply keyboard', () => {

      const message: Record<string, string> = {}
      const builder = createMessageBuilder(message)

      builder.replyKeyboard(k => k
        .row(r => r
          .text('Option')
        )
      )

      expect(message.keyboard).toBeDefined()
      expect(message.keyboard).toHaveProperty('keyboard')

    })

    it('should remove keyboard', () => {

      const message = { keyboard: { inline_keyboard: [] } }
      const builder = createMessageBuilder(message)

      builder.removeKeyboard()

      expect(message.keyboard).toEqual({ remove_keyboard: true })

    })

    it('should support method chaining', () => {

      const message: Record<string, string> = {}
      const builder = createMessageBuilder(message)

      builder
        .parseMode('HTML')
        .inlineKeyboard(k => k
          .row(r => r
            .text('OK')
          )
        )

      expect(message.parseMode).toBe('HTML')
      expect(message.keyboard).toBeDefined()

    })

    it('should allow keyboard replacement', () => {

      const message: Record<string, string> = {}
      const builder = createMessageBuilder(message)

      builder.inlineKeyboard(k => k
        .row(r => r
          .text('First')
        )
      )
      builder.replyKeyboard(k => k
        .row(r => r
          .text('Second')
        )
      )

      expect(message.keyboard).toHaveProperty('keyboard')
      expect(message.keyboard).not.toHaveProperty('inline_keyboard')

    })

  })

})
