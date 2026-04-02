import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// buttonVariants exported for use by alert-dialog and other shadcn primitives
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-sans text-sm uppercase tracking-widest transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C9A84] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[#2D3A31] text-white hover:bg-[#3d5245]",
        secondary: "border border-[#8C9A84] text-[#8C9A84] hover:bg-[#8C9A84] hover:text-white",
        // shadcn-compat aliases used internally by alert-dialog etc.
        default: "bg-[#2D3A31] text-white hover:bg-[#3d5245]",
        destructive: "bg-[#C27B66] text-white hover:bg-[#b06a55]",
        outline: "border border-[#E6E2DA] text-[#2D3A31] hover:bg-[#F2F0EB]",
        ghost: "hover:bg-[#F2F0EB] text-[#2D3A31]",
        link: "text-[#2D3A31] underline-offset-4 hover:underline",
      },
      size: {
        sm: "px-5 py-2 text-xs min-h-[36px]",
        md: "px-8 py-3 min-h-[44px]",
        lg: "px-10 py-4 text-base min-h-[52px]",
        default: "px-8 py-3 min-h-[44px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button };
