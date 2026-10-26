import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-10 px-4 py-2",
  {
    variants: {
      variant: {
        default: "bg-marine-900 text-white hover:bg-marine-700",
        outline:
          "border border-sand-300 bg-white text-marine-900 hover:bg-sand-100",
        coral: "bg-coral-600 text-white hover:bg-coral-700",
        ghost: "text-marine-900 hover:bg-sand-200",
      },
    },
    defaultVariants: { variant: "default" },
  },
);
export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
