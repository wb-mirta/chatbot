import { replyKeyboard, removeKeyboard } from '#keyboard/reply'

describe('Keyboard: Reply', () => {

  describe('replyKeyboard', () => {

    it('should create empty keyboard when no rows defined', () => {

      const keyboard = replyKeyboard(b => b)

      expect(keyboard).toHaveProperty('keyboard')
      expect(keyboard.keyboard).toEqual([])

    })

    it('should create single row with text button', () => {

      const keyboard = replyKeyboard(b => b
        .row(r => r
          .text('Button')
        )
      )

      expect(keyboard.keyboard).toHaveLength(1)
      expect(keyboard.keyboard[0][0].text).toBe('Button')

    })

    it('should create multiple rows', () => {

      const keyboard = replyKeyboard((b) => {

        b.row(r => r.text('Row 1'))
        b.row(r => r.text('Row 2'))

      })

      expect(keyboard.keyboard).toHaveLength(2)

    })

    it('should set oneTime keyboard flag', () => {

      const keyboard = replyKeyboard(b => b.oneTime())

      expect(keyboard.one_time_keyboard).toBe(true)

    })

    it('should set resize keyboard flag', () => {

      const keyboard = replyKeyboard(b => b
        .resize()
      )

      expect(keyboard.resize_keyboard).toBe(true)

    })

    it('should support chaining oneTime and resize', () => {

      const keyboard = replyKeyboard(b => b
        .oneTime()
        .resize()
        .row(r => r
          .text('OK')
        )
      )

      expect(keyboard.one_time_keyboard).toBe(true)
      expect(keyboard.resize_keyboard).toBe(true)

    })

    it('should add requestContact to button', () => {

      const keyboard = replyKeyboard(b => b
        .row(r => r
          .text('Share Contact', btn => btn
            .requestContact()
          )
        )
      )

      expect(keyboard.keyboard[0][0].request_contact).toBe(true)

    })

    it('should add requestLocation to button', () => {

      const keyboard = replyKeyboard(b => b
        .row(r => r
          .text('Share Location', btn => btn
            .requestLocation()
          )
        )
      )

      expect(keyboard.keyboard[0][0].request_location).toBe(true)

    })

    it('should create row with multiple buttons', () => {

      const keyboard = replyKeyboard(b => b
        .row((r) => {

          r.text('Yes')
          r.text('No')
          r.text('Maybe')

        })
      )

      expect(keyboard.keyboard[0]).toHaveLength(3)

    })

    it('should ignore empty rows', () => {

      const keyboard = replyKeyboard((b) => {

        b.row(r => r.text('Button'))
        b.row((_r) => {
          // empty row
        })

      })

      expect(keyboard.keyboard).toHaveLength(1)

    })

  })

  describe('removeKeyboard', () => {

    it('should return remove keyboard structure', () => {

      const remove = removeKeyboard()

      expect(remove).toEqual({ remove_keyboard: true })

    })

  })

})
