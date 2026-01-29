import { mockDefineStore } from '../mocks/store'

vi.mock('@mirta/store', () => ({
  defineStore: mockDefineStore,
}))

vi.mock('#assertions/outgoing', () => ({
  assertValueIsOutgoing: vi.fn(),
}))

import { setupExchanger } from '#host/exchanger'
import { useBotStore } from '#store/index'
import type { BotAdapter } from '#types'

// Константы
import { DEFAULT_POLL_INTERVAL } from '#constants'

global.startTicker = vi.fn()
global.timers = {}

describe('Worker: Exchanger', () => {

  const deviceName = 'testbot'

  let store: ReturnType<typeof useBotStore>
  let adapter: BotAdapter

  beforeEach(() => {

    // Сбрасываем моки
    vi.clearAllMocks()

    store = useBotStore()
    store.$reset()

    // Мок адаптера
    adapter = {
      poll: vi.fn(),
      send: vi.fn(),
      sendRaw: vi.fn(),
    } as unknown as BotAdapter

    // Мок таймеров
    global.timers[`${deviceName}_poll`] = { firing: true, stop: vi.fn() }
    global.timers[`${deviceName}_send`] = { firing: true, stop: vi.fn() }
    global.timers[`${deviceName}_mqtt`] = { firing: true, stop: vi.fn() }

  })

  it('should initialize with default options', () => {

    setupExchanger(deviceName, adapter, {})

    expect(store.isPolling).toBe(false)
    expect(store.isSending).toBe(false)

  })

  it('should apply default intervals', () => {

    setupExchanger(deviceName, adapter, {})

    expect(global.defineRule).toHaveBeenCalledWith(`${deviceName}_poll`, expect.any(Object))
    expect(global.startTicker).toHaveBeenCalledWith(
      `${deviceName}_poll`,
      DEFAULT_POLL_INTERVAL
    )

  })

  it('should handle custom intervals', () => {

    const options = {
      pollInterval: 3000,
      sendInterval: 600,
      mqttInterval: 100,
    }

    setupExchanger(deviceName, adapter, options)

    expect(global.startTicker).toHaveBeenCalledWith(`${deviceName}_poll`, 3000)
    expect(global.startTicker).toHaveBeenCalledWith(`${deviceName}_send`, 600)
    expect(global.startTicker).toHaveBeenCalledWith(`${deviceName}_mqtt`, 100)

  })

})
