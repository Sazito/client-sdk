/**
 * Minimal zero-dependency observable store.
 *
 * `getState` returns the current immutable snapshot; `setState` shallow-merges
 * a partial (or applies an updater) and notifies subscribers. Designed to plug
 * straight into React's `useSyncExternalStore`.
 */
export interface Store<T> {
  getState(): T;
  setState(partial: Partial<T> | ((prev: T) => Partial<T>)): void;
  subscribe(listener: () => void): () => void;
}

export function createStore<T extends object>(initialState: T): Store<T> {
  let state = initialState;
  const listeners = new Set<() => void>();

  return {
    getState() {
      return state;
    },
    setState(partial) {
      const patch = typeof partial === 'function' ? partial(state) : partial;
      state = { ...state, ...patch };
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
}
