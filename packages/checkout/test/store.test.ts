import { describe, expect, it, vi } from 'vitest';
import { createStore } from '../src/core/store';

describe('createStore', () => {
  it('merges partial state and notifies subscribers', () => {
    const store = createStore({ a: 1, b: 2 });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.setState({ a: 10 });
    expect(store.getState()).toEqual({ a: 10, b: 2 });
    expect(listener).toHaveBeenCalledTimes(1);

    store.setState((prev) => ({ b: prev.b + 1 }));
    expect(store.getState()).toEqual({ a: 10, b: 3 });

    unsubscribe();
    store.setState({ a: 0 });
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
