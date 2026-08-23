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
  batch<R>(callback: () => R): R;
}

export function createStore<T extends object>(initialState: T): Store<T> {
  let state = initialState;
  const listeners = new Set<() => void>();
  let batchDepth = 0;
  let pendingNotification = false;

  function notify(): void {
    if (batchDepth > 0) {
      pendingNotification = true;
      return;
    }
    listeners.forEach((listener) => listener());
  }

  function finishBatch(): void {
    batchDepth -= 1;
    if (batchDepth === 0 && pendingNotification) {
      pendingNotification = false;
      listeners.forEach((listener) => listener());
    }
  }

  return {
    getState() {
      return state;
    },
    setState(partial) {
      const patch = typeof partial === 'function' ? partial(state) : partial;
      state = { ...state, ...patch };
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    batch<R>(callback: () => R): R {
      batchDepth += 1;
      try {
        const result = callback();
        if (result && typeof (result as unknown as PromiseLike<unknown>).then === 'function') {
          return Promise.resolve(result).finally(finishBatch) as R;
        }
        finishBatch();
        return result;
      } catch (error) {
        finishBatch();
        throw error;
      }
    }
  };
}
