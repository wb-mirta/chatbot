import { inlineKeyboard } from '#keyboard/inline';

describe('Keyboard: Inline', () => {

  describe('inlineKeyboard', () => {

    it('should create empty keyboard when no rows defined', () => {

      const keyboard = inlineKeyboard(b => b);

      expect(keyboard).toHaveProperty('inline_keyboard');
      expect(keyboard.inline_keyboard).toEqual([]);

    });

    it('should create single row with single button', () => {

      const keyboard = inlineKeyboard(b => b
        .row(r => r
          .text('Button')
        )
      );

      expect(keyboard.inline_keyboard).toHaveLength(1);
      expect(keyboard.inline_keyboard[0]).toHaveLength(1);
      expect(keyboard.inline_keyboard[0][0].text).toBe('Button');

    });

    it('should create single row with multiple buttons', () => {

      const keyboard = inlineKeyboard(b =>
        b.row((r) => {

          r.text('First');
          r.text('Second');
          r.text('Third');

        })
      );

      expect(keyboard.inline_keyboard[0]).toHaveLength(3);
      expect(keyboard.inline_keyboard[0][0].text).toBe('First');
      expect(keyboard.inline_keyboard[0][2].text).toBe('Third');

    });

    it('should create multiple rows', () => {

      const keyboard = inlineKeyboard((b) => {

        b.row(r => r.text('Row 1'));
        b.row(r => r.text('Row 2'));

      });

      expect(keyboard.inline_keyboard).toHaveLength(2);
      expect(keyboard.inline_keyboard[0][0].text).toBe('Row 1');
      expect(keyboard.inline_keyboard[1][0].text).toBe('Row 2');

    });

    it('should add callback_data to button', () => {

      const keyboard = inlineKeyboard(b =>
        b.row(r =>
          r.text('Click', btn => btn
            .callback('action_123')
          )
        )
      );

      expect(keyboard.inline_keyboard[0][0].callback_data).toBe('action_123');

    });

    it('should add URL to button', () => {

      const keyboard = inlineKeyboard(b =>
        b.row(r =>
          r.text('Visit', btn => btn
            .url('https://example.com')
          )
        )
      );

      expect(keyboard.inline_keyboard[0][0].url).toBe('https://example.com');

    });

    it('should add inline query switch to button', () => {

      const keyboard = inlineKeyboard(b =>
        b.row(r =>
          r.text('Search', btn => btn
            .switchInlineQuery('search text')
          )
        )
      );

      expect(keyboard.inline_keyboard[0][0].switch_inline_query).toBe('search text');

    });

    it('should ignore empty rows', () => {

      const keyboard = inlineKeyboard((b) => {

        b.row(r => r.text('First'));
        b.row((_r) => {
          // empty row
        });
        b.row(r => r.text('Second'));

      });

      expect(keyboard.inline_keyboard).toHaveLength(2);

    });

  });

  describe('Button styles', () => {

    it('should apply primary style to button', () => {

      const keyboard = inlineKeyboard(b =>
        b.row(r =>
          r.text('Button', btn => btn
            .style('primary')
          )
        )
      );

      expect(keyboard.inline_keyboard[0][0].style).toBe('primary');

    });

    it('should apply success style to button', () => {

      const keyboard = inlineKeyboard(b =>
        b.row(r =>
          r.text('Button', btn => btn
            .style('success')
          )
        )
      );

      expect(keyboard.inline_keyboard[0][0].style).toBe('success');

    });

    it('should apply danger style to button', () => {

      const keyboard = inlineKeyboard(b =>
        b.row(r =>
          r.text('Button', btn => btn
            .style('danger')
          )
        )
      );

      expect(keyboard.inline_keyboard[0][0].style).toBe('danger');

    });

    it('should not throw when removing style that was never set', () => {

      const keyboard = inlineKeyboard(b =>
        b.row(r =>
          r.text('Button', btn => btn
            .style('primary', false))
        )
      );

      expect(keyboard.inline_keyboard[0][0]).not.toHaveProperty('style');

    });

    it('should remove style when enabled is false', () => {

      const keyboard = inlineKeyboard(b =>
        b.row(r =>
          r.text('Button', (btn) => {

            btn.style('primary');
            btn.style('primary', false);

          })
        )
      );

      expect(keyboard.inline_keyboard[0][0]).not.toHaveProperty('style');

    });

    it('should not remove style when enabled is false but style differs', () => {

      const keyboard = inlineKeyboard(b =>
        b.row(r =>
          r.text('Button', (btn) => {

            btn.style('primary');
            btn.style('danger', false);

          })
        )
      );

      expect(keyboard.inline_keyboard[0][0].style).toBe('primary');

    });

    it('should not include style property when not set', () => {

      const keyboard = inlineKeyboard(b =>
        b.row(r =>
          r.text('Button', btn => btn
            .callback('action')
          )
        )
      );

      expect(keyboard.inline_keyboard[0][0]).not.toHaveProperty('style');

    });

    it('should not include undefined values in button object', () => {

      const keyboard = inlineKeyboard(b =>
        b.row(r =>
          r.text('Plain button')
        )
      );

      const button = keyboard.inline_keyboard[0][0];
      expect(button).toEqual({ text: 'Plain button' });
      expect(Object.keys(button)).toEqual(['text']);

    });

  });

});
