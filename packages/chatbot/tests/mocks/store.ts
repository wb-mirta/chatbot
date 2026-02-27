type StateFactory = () => Record<string, unknown>;
type StoreActions = Record<string, (...args: unknown[]) => unknown>;

interface DefineStoreOptions {
  state: StateFactory;
  actions: StoreActions;
}

type DefineStore = (id: string, options: DefineStoreOptions) => () => Record<string, unknown>;

/**
 * Единый мок для `@mirta/store`, эмулирующий defineStore с поддержкой $patch и $reset.
 */
export const mockDefineStore = vi.fn<DefineStore>((_name, config) => {

  return () => {

    const state = config.state();

    const $patch = (partialState: Partial<Record<string, unknown>>) => {

      Object.assign(state, partialState);

    };

    return Object.assign(state, config.actions, {
      $patch,
      $reset: () => {

        Object.assign(state, config.state());

      },
    });

  };

});
