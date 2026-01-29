import { inlineKeyboard } from '#keyboard/inline'

describe('Keyboard: Inline', () => {

  describe('inlineKeyboard', () => {

    it('should create empty keyboard when no rows defined', () => {

      const keyboard = inlineKeyboard(b => b)

      expect(keyboard).toHaveProperty('inline_keyboard')
      expect(keyboard.inline_keyboard).toEqual([])

    })

    it('should create single row with single button', () => {

      const keyboard = inlineKeyboard(b => b
        .row(r => r
          .text('Button')
        )
      )

      expect(keyboard.inline_keyboard).toHaveLength(1)
      expect(keyboard.inline_keyboard[0]).toHaveLength(1)
      expect(keyboard.inline_keyboard[0][0].text).toBe('Button')

    })

    it('should create single row with multiple buttons', () => {

      const keyboard = inlineKeyboard(b =>
        b.row((r) => {

          r.text('First')
          r.text('Second')
          r.text('Third')

        })
      )

      expect(keyboard.inline_keyboard[0]).toHaveLength(3)
      expect(keyboard.inline_keyboard[0][0].text).toBe('First')
      expect(keyboard.inline_keyboard[0][2].text).toBe('Third')

    })

    it('should create multiple rows', () => {

      const keyboard = inlineKeyboard((b) => {

        b.row(r => r.text('Row 1'))
        b.row(r => r.text('Row 2'))

      })

      expect(keyboard.inline_keyboard).toHaveLength(2)
      expect(keyboard.inline_keyboard[0][0].text).toBe('Row 1')
      expect(keyboard.inline_keyboard[1][0].text).toBe('Row 2')

    })

    it('should add callback_data to button', () => {

      const keyboard = inlineKeyboard(b =>
        b.row(r =>
          r.text('Click', btn => btn
            .callback('action_123')
          )
        )
      )

      expect(keyboard.inline_keyboard[0][0].callback_data).toBe('action_123')

    })

    it('should add URL to button', () => {

      const keyboard = inlineKeyboard(b =>
        b.row(r =>
          r.text('Visit', btn => btn
            .url('https://example.com')
          )
        )
      )

      expect(keyboard.inline_keyboard[0][0].url).toBe('https://example.com')

    })

    it('should add inline query switch to button', () => {

      const keyboard = inlineKeyboard(b =>
        b.row(r =>
          r.text('Search', btn => btn
            .switchInlineQuery('search text')
          )
        )
      )

      expect(keyboard.inline_keyboard[0][0].switch_inline_query).toBe('search text')

    })

    it('should ignore empty rows', () => {

      const keyboard = inlineKeyboard((b) => {

        b.row(r => r.text('First'))
        b.row((_r) => {
          // empty row
        })
        b.row(r => r.text('Second'))

      })

      expect(keyboard.inline_keyboard).toHaveLength(2)

    })

  })

})
