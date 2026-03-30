import { type TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

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
        <textarea
          ref={ref}
          id={inputId}
          className={`w-full rounded-2xl bg-[#F2F0EB] px-6 py-4 text-[#2D3A31] placeholder:text-[#8C9A84]/70 font-sans text-base transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#8C9A84] resize-none ${error ? "ring-2 ring-[#C27B66]" : ""} ${className}`}
          aria-invalid={!!error}
          {...props}
        />
        {error && (
          <p className="text-sm text-[#C27B66] font-sans">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
