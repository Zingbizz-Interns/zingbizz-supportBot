import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: "pill" | "underline";
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ variant = "pill", label, error, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    const base =
      "w-full text-[#2D3A31] placeholder:text-[#8C9A84]/70 transition-all duration-300 focus:outline-none font-sans text-base";

    const variants = {
      pill: "rounded-full bg-[#F2F0EB] border-0 px-6 py-3 focus:ring-2 focus:ring-[#8C9A84] focus:ring-offset-0",
      underline:
        "bg-transparent border-0 border-b border-[#E6E2DA] px-2 py-3 rounded-none focus:border-[#8C9A84]",
    };

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[#2D3A31] font-sans"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${base} ${variants[variant]} ${error ? "ring-2 ring-[#C27B66]" : ""} ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-[#C27B66] font-sans">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
