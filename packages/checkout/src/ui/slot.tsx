'use client';

import {
  cloneElement,
  isValidElement,
  type ReactNode,
  type ReactElement,
  type HTMLAttributes
} from 'react';

/**
 * When `asChild` is true, merges the parent's props onto the single React child
 * element instead of rendering a wrapper element — the same pattern Radix UI /
 * shadcn/ui uses. Class names and event handlers are merged; all other props
 * from the parent win (child props act as defaults).
 */
export function Slot({
  children,
  ...slotProps
}: HTMLAttributes<HTMLElement> & { children?: ReactNode }) {
  if (!isValidElement(children)) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Slot] Must receive exactly one valid React element as child.');
    }
    return <>{children}</>;
  }

  const child = children as ReactElement<Record<string, unknown>>;
  const childProps = child.props as Record<string, unknown>;

  const mergedClassName =
    [slotProps.className, childProps.className].filter(Boolean).join(' ') || undefined;

  // Merge event handlers: call both if both exist.
  const merged: Record<string, unknown> = { ...childProps, ...slotProps };
  if (mergedClassName) merged.className = mergedClassName;

  for (const key of Object.keys(childProps)) {
    if (key.startsWith('on') && typeof childProps[key] === 'function' && typeof (slotProps as Record<string, unknown>)[key] === 'function') {
      const slotHandler = (slotProps as Record<string, unknown>)[key] as (...a: unknown[]) => void;
      const childHandler = childProps[key] as (...a: unknown[]) => void;
      merged[key] = (...args: unknown[]) => {
        slotHandler(...args);
        childHandler(...args);
      };
    }
  }

  return cloneElement(child, merged);
}
