import { mockDefineStore } from '../mocks/store'

vi.mock('@mirta/store', () => ({
  defineStore: mockDefineStore,
}))

const { useAuthStore } = await import('#store/index')

describe('Store: Auth', () => {

  let store: ReturnType<typeof useAuthStore>

  beforeEach(() => {

    store = useAuthStore()
    store.$reset()

  })

  describe('useAuthStore', () => {

    describe('setup', () => {

      it('should initialize policies from authorization builder', () => {

        const mockAuth = {
          build: () => ({
            admin: [{ userId: { '123': true } }],
            user: [{ chatType: { private: true } }],
          }),
        }

        store.setup(mockAuth)

        expect(store.policies).toHaveProperty('admin')
        expect(store.policies.admin).toEqual([{ userId: { '123': true } }])
        expect(store.policies).toHaveProperty('user')

      })

      it('should handle empty authorization builder', () => {

        const mockAuth = { build: () => ({}) }
        store.setup(mockAuth)
        expect(store.policies).toEqual({})

      })

    })

    describe('isAllowed', () => {

      it('should return false for non-existent policy', () => {

        const result = store.isAllowed('nonexistent', { userId: 123 })
        expect(result).toBe(false)

      })

      it('should return false when policy has empty rules', () => {

        const mockAuth = { build: () => ({ empty: [] }) }
        store.setup(mockAuth)
        const result = store.isAllowed('empty', { userId: 123 })
        expect(result).toBe(false)

      })

      describe('basic rule matching', () => {

        beforeEach(() => {

          const mockAuth = {
            build: () => ({
              admin: [{ userId: { '123': true } }],
              moderator: [
                { userId: { '456': true } },
                { username: { john_doe: true } },
              ],
              subscriber: [{ chatType: { private: true, group: true } }],
              blocked: [{ userId: { '999': false } }],
            }),
          }
          store.setup(mockAuth)

        })

        it('should allow matching userId', () => {

          expect(store.isAllowed('admin', { userId: 123 })).toBe(true)

        })

        it('should deny non-matching userId', () => {

          expect(store.isAllowed('admin', { userId: 456 })).toBe(false)

        })

        it('should allow matching username', () => {

          expect(store.isAllowed('moderator', { username: 'john_doe' })).toBe(true)

        })

        it('should allow matching chatType', () => {

          expect(store.isAllowed('subscriber', { chatType: 'private' })).toBe(true)

        })

        it('should deny when no rules match', () => {

          expect(store.isAllowed('admin', { userId: 999 })).toBe(false)

        })

        it('should handle multiple matching rules', () => {

          expect(store.isAllowed('moderator', { userId: 456 })).toBe(true)

        })

        it('should handle deny rules', () => {

          expect(store.isAllowed('blocked', { userId: 999 })).toBe(false)

        })

        it('should handle subject with multiple fields', () => {

          expect(
            store.isAllowed('subscriber', { userId: 123, chatType: 'group' })
          ).toBe(true)

        })

        it('should handle missing subject fields', () => {

          expect(store.isAllowed('admin', {})).toBe(false)

        })

        it('should handle chatId matching', () => {

          const mockAuth = {
            build: () => ({
              chat_admin: [{ chatId: { '100': true } }],
            }),
          }
          store.setup(mockAuth)
          expect(store.isAllowed('chat_admin', { chatId: 100 })).toBe(true)

        })

      })

      describe('deny vs allow priority', () => {

        beforeEach(() => {

          const mockAuth = {
            build: () => ({
              mixed_policy: [
                { userId: { '123': true } }, // allow
                { userId: { '123': false } }, // deny — должен перевесить
              ],
            }),
          }
          store.setup(mockAuth)

        })

        it('should deny access if a deny rule matches, even after allow', () => {

          expect(store.isAllowed('mixed_policy', { userId: 123 })).toBe(false)

        })

      })

      describe('rules with null (not applicable)', () => {

        beforeEach(() => {

          const mockAuth = {
            build: () => ({
              partial_policy: [
                { userId: { '999': true } }, // не подходит
                { username: { 'test': false } }, // не подходит
                { chatType: { group: true } }, // подходит
              ],
            }),
          }
          store.setup(mockAuth)

        })

        it('should allow if only one rule applies and it is allow', () => {

          expect(store.isAllowed('partial_policy', { chatType: 'group' })).toBe(true)

        })

        it('should ignore rules that do not apply to subject', () => {

          expect(store.isAllowed('partial_policy', { chatType: 'channel' })).toBe(false)

        })

      })

    })

  })

})
