import { createMessageBuilder } from '#bot/message.builder';
import type { OutgoingRegular } from '#types';

describe('Bot: Message Builder', () => {

  describe('createMessageBuilder', () => {

    it('should mutate message in place', () => {

      const message: Partial<OutgoingRegular> = { text: 'Hello' };
      const builder = createMessageBuilder(message);

      builder.parseMode('HTML');

      expect(message.parseMode).toBe('HTML');
      expect(message.text).toBe('Hello');

    });

    it('should set parse mode to HTML', () => {

      const message: Partial<OutgoingRegular> = {};
      const builder = createMessageBuilder(message);

      builder.parseMode('HTML');

      expect(message.parseMode).toBe('HTML');

    });

    it('should set parse mode to MarkdownV2', () => {

      const message: Partial<OutgoingRegular> = {};
      const builder = createMessageBuilder(message);

      builder.parseMode('MarkdownV2');

      expect(message.parseMode).toBe('MarkdownV2');

    });

    it('should add inline keyboard', () => {

      const message: Partial<OutgoingRegular> = {};
      const builder = createMessageBuilder(message);

      builder.inlineKeyboard(k => k
        .row(r => r
          .text('Button')
        )
      );

      expect(message.keyboard).toBeDefined();
      expect(message.keyboard).toHaveProperty('inline_keyboard');

    });

    it('should add reply keyboard', () => {

      const message: Partial<OutgoingRegular> = {};
      const builder = createMessageBuilder(message);

      builder.replyKeyboard(k => k
        .row(r => r
          .text('Option')
        )
      );

      expect(message.keyboard).toBeDefined();
      expect(message.keyboard).toHaveProperty('keyboard');

    });

    it('should remove keyboard', () => {

      const message = { keyboard: { inline_keyboard: [] } };
      const builder = createMessageBuilder(message);

      builder.removeKeyboard();

      expect(message.keyboard).toEqual({ remove_keyboard: true });

    });

    it('should support method chaining', () => {

      const message: Partial<OutgoingRegular> = {};
      const builder = createMessageBuilder(message);

      builder
        .parseMode('HTML')
        .inlineKeyboard(k => k
          .row(r => r
            .text('OK')
          )
        );

      expect(message.parseMode).toBe('HTML');
      expect(message.keyboard).toBeDefined();

    });

    it('should allow keyboard replacement', () => {

      const message: Partial<OutgoingRegular> = {};
      const builder = createMessageBuilder(message);

      builder.inlineKeyboard(k => k
        .row(r => r
          .text('First')
        )
      );
      builder.replyKeyboard(k => k
        .row(r => r
          .text('Second')
        )
      );

      expect(message.keyboard).toHaveProperty('keyboard');
      expect(message.keyboard).not.toHaveProperty('inline_keyboard');

    });

  });

});
