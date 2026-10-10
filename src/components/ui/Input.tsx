"use client";

// ورودی با برچسب متصل، پیام خطا و راهنما (فونت ۱۶px برای جلوگیری از زوم iOS)
import { forwardRef, useId, useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "./cn";

const field =
  "w-full rounded-lg border bg-ig-gray-bg px-3 text-base text-foreground placeholder:text-ig-gray outline-none transition-colors " +
  "focus:bg-white focus:border-ig-gray disabled:opacity-50";

type Common = { label?: string; error?: string; hint?: string };

export type InputProps = InputHTMLAttributes<HTMLInputElement> & Common;

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, id, ...rest },
  ref
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={fid} className="block text-sm font-semibold text-foreground">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={fid}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${fid}-err` : hint ? `${fid}-hint` : undefined}
        className={cn(field, "h-11", error ? "border-ig-red" : "border-ig-border", className)}
        {...rest}
      />
      {error ? (
        <p id={`${fid}-err`} role="alert" className="text-sm text-ig-red">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fid}-hint`} className="text-sm text-ig-gray">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default Input;

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, "type">>(function PasswordInput(
  { label, error, hint, className, id, ...rest },
  ref
) {
  const auto = useId();
  const fid = id ?? auto;
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={fid} className="block text-sm font-semibold text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={fid}
          type={show ? "text" : "password"}
          dir="ltr"
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${fid}-err` : undefined}
          className={cn(field, "h-11 pl-11 text-left", error ? "border-ig-red" : "border-ig-border", className)}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "پنهان کردن رمز" : "نمایش رمز"}
          aria-pressed={show}
          className="absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-ig-gray"
        >
          {show ? <EyeOff className="w-5 h-5" aria-hidden /> : <Eye className="w-5 h-5" aria-hidden />}
        </button>
      </div>
      {error ? (
        <p id={`${fid}-err`} role="alert" className="text-sm text-ig-red">
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-ig-gray">{hint}</p>
      ) : null}
    </div>
  );
});

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & Common>(
  function TextArea({ label, error, hint, className, id, ...rest }, ref) {
    const auto = useId();
    const fid = id ?? auto;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={fid} className="block text-sm font-semibold text-foreground">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={fid}
          aria-invalid={!!error || undefined}
          className={cn(field, "py-2.5 min-h-24 resize-none", error ? "border-ig-red" : "border-ig-border", className)}
          {...rest}
        />
        {error ? (
          <p role="alert" className="text-sm text-ig-red">
            {error}
          </p>
        ) : hint ? (
          <p className="text-sm text-ig-gray">{hint}</p>
        ) : null}
      </div>
    );
  }
);
