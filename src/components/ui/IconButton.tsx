"use client";

// دکمه آیکنی؛ aria-label الزامی است
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  "aria-label": string;
};

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, type = "button", ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center w-11 h-11 rounded-full text-foreground transition-colors",
        "hover:bg-ig-gray-bg active:scale-90 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ig-blue",
        className
      )}
      {...rest}
    />
  );
});

export default IconButton;
