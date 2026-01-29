import { createExponentialBackoff } from '#resilience/exponential-backoff'

describe('Resilience: Exponential Backoff', () => {

  describe('createExponentialBackoff', () => {

    it('should return base delay for zero attempts', () => {

      const backoff = createExponentialBackoff({ delay: 100, maxAttempts: 5 })

      expect(backoff(0)).toBe(100)

    })

    it('should return exponentially increasing delay', () => {

      const backoff = createExponentialBackoff({ delay: 100, maxAttempts: 5 })

      expect(backoff(0)).toBe(100) // 100 * 2^0 = 100
      expect(backoff(1)).toBe(200) // 100 * 2^1 = 200
      expect(backoff(2)).toBe(400) // 100 * 2^2 = 400
      expect(backoff(3)).toBe(800) // 100 * 2^3 = 800

    })

    it('should cap at maxAttempts', () => {

      const backoff = createExponentialBackoff({ delay: 100, maxAttempts: 3 })

      expect(backoff(3)).toBe(800) // 100 * 2^3
      expect(backoff(4)).toBe(800) // capped at maxAttempts
      expect(backoff(10)).toBe(800) // capped at maxAttempts

    })

    it('should normalize negative attempts to zero', () => {

      const backoff = createExponentialBackoff({ delay: 100, maxAttempts: 5 })

      expect(backoff(-1)).toBe(100)
      expect(backoff(-10)).toBe(100)

    })

    it('should handle fractional attempts by flooring', () => {

      const backoff = createExponentialBackoff({ delay: 100, maxAttempts: 5 })

      expect(backoff(1.7)).toBe(200) // floor(1.7) = 1, 2^1 = 2
      expect(backoff(2.9)).toBe(400) // floor(2.9) = 2, 2^2 = 4

    })

    it('should work with different base delays', () => {

      const backoff = createExponentialBackoff({ delay: 50, maxAttempts: 3 })

      expect(backoff(0)).toBe(50)
      expect(backoff(1)).toBe(100)
      expect(backoff(2)).toBe(200)

    })

    it('should work with maxAttempts of 1', () => {

      const backoff = createExponentialBackoff({ delay: 100, maxAttempts: 1 })

      expect(backoff(0)).toBe(100)
      expect(backoff(1)).toBe(200)
      expect(backoff(2)).toBe(200) // capped

    })

    it('should work with maxAttempts of 0', () => {

      const backoff = createExponentialBackoff({ delay: 100, maxAttempts: 0 })

      expect(backoff(0)).toBe(100)
      expect(backoff(1)).toBe(100) // capped immediately

    })

    it('should handle large attempt numbers', () => {

      const backoff = createExponentialBackoff({ delay: 1, maxAttempts: 10 })

      expect(backoff(10)).toBe(1024) // 1 * 2^10
      expect(backoff(100)).toBe(1024) // capped at maxAttempts

    })

  })

})
