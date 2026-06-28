'use client';

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from 'react';
import { Slot } from './slot';

function cx(...parts: Array<string | false | undefined | null>): string {
  return parts.filter(Boolean).join(' ');
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  block?: boolean;
  loading?: boolean;
  asChild?: boolean;
}

export function Button({
  variant = 'primary',
  block,
  loading,
  asChild,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const props = {
    className: cx('szc-btn', `szc-btn--${variant}`, block && 'szc-btn--block', className),
    disabled: disabled || loading,
    'aria-busy': loading || undefined,
    ...rest,
  };

  if (asChild) {
    return <Slot {...props}>{children}</Slot>;
  }

  return (
    <button type="button" {...props}>
      {loading ? <Spinner /> : null}
      <span>{children}</span>
    </button>
  );
}

export interface SpinnerProps {
  asChild?: boolean;
  className?: string;
  children?: ReactNode;
}

export function Spinner({ asChild, className, children }: SpinnerProps = {}) {
  if (asChild && children) {
    return <Slot className={cx('szc-spinner', className)}>{children}</Slot>;
  }
  return <span className={cx('szc-spinner', className)} aria-hidden="true">{children}</span>;
}

export interface ProductPlaceholderProps {
  asChild?: boolean;
  className?: string;
  children?: ReactNode;
}

export function ProductPlaceholder({ asChild, className, children }: ProductPlaceholderProps = {}) {
  const props = { className: cx('szc-product-placeholder', className) };

  if (asChild && children) {
    return <Slot {...props}>{children}</Slot>;
  }

  return (
    <span {...props}>
      {children ?? (
        <svg viewBox="0 0 64 64" width="30" height="30" fill="none" aria-hidden="true">
          <path
            d="M32 12 49 21.5v21L32 52 15 42.5v-21L32 12Z"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinejoin="round"
          />
          <path
            d="m15 21.5 17 9.5 17-9.5M32 31v21"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  optionalLabel?: string;
  asChild?: boolean;
}

export function FieldLabel({
  label,
  required,
  optionalLabel
}: {
  label: string;
  required?: boolean;
  optionalLabel?: string;
}) {
  return (
    <span className="szc-field__label">
      {label}
      {!required && optionalLabel ? (
        <span className="szc-field__optional">({optionalLabel})</span>
      ) : null}
    </span>
  );
}

export function Field({ label, id, className, error, required, optionalLabel, asChild, children, ...rest }: FieldProps) {
  const inputProps = {
    id,
    required,
    className: cx('szc-input', error && 'szc-input--error', className),
    ...rest,
  };

  return (
    <label className="szc-field" htmlFor={id}>
      <FieldLabel label={label} required={required} optionalLabel={optionalLabel} />
      {asChild && children
        ? <Slot {...inputProps}>{children as ReactNode}</Slot>
        : <input {...inputProps} />
      }
      {error ? <span className="szc-field__error">{error}</span> : null}
    </label>
  );
}

export interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  optionalLabel?: string;
  asChild?: boolean;
}

export function TextAreaField({ label, id, className, error, required, optionalLabel, asChild, children, ...rest }: TextAreaFieldProps) {
  const inputProps = {
    id,
    required,
    className: cx('szc-input', 'szc-textarea', error && 'szc-input--error', className),
    ...rest,
  };

  return (
    <label className="szc-field" htmlFor={id}>
      <FieldLabel label={label} required={required} optionalLabel={optionalLabel} />
      {asChild && children
        ? <Slot {...inputProps as Record<string, unknown>}>{children as ReactNode}</Slot>
        : <textarea {...inputProps} />
      }
      {error ? <span className="szc-field__error">{error}</span> : null}
    </label>
  );
}

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: ReactNode;
  optionalLabel?: string;
}

export function SelectField({ label, id, className, children, required, optionalLabel, ...rest }: SelectFieldProps) {
  return (
    <label className="szc-field" htmlFor={id}>
      <FieldLabel label={label} required={required} optionalLabel={optionalLabel} />
      <select id={id} required={required} className={cx('szc-input', 'szc-select', className)} {...rest}>
        {children}
      </select>
    </label>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('szc-card', className)}>{children}</div>;
}

export interface SectionTitleProps {
  children: ReactNode;
  asChild?: boolean;
  className?: string;
}

export function SectionTitle({ children, asChild, className }: SectionTitleProps) {
  const props = { className: cx('szc-section-title', className) };
  if (asChild && children) {
    return <Slot {...props}>{children}</Slot>;
  }
  return <h3 {...props}>{children}</h3>;
}

export interface ErrorBannerProps {
  message: string;
  asChild?: boolean;
  children?: ReactNode;
  className?: string;
}

export function ErrorBanner({ message, asChild, children, className }: ErrorBannerProps) {
  const props = {
    className: cx('szc-error', className),
    role: 'alert' as const,
  };

  if (asChild && children) {
    return <Slot {...props}>{children}</Slot>;
  }

  return <div {...props}>{message}</div>;
}
