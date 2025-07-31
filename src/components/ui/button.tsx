import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 aria-invalid:ring-red-500",
  {
    variants: {
      variant: {
        default:
          "border-2 border-blue-500 bg-transparent text-blue-400 hover:border-blue-400 hover:text-blue-300",
        destructive:
          "border-2 border-red-500 bg-transparent text-red-400 hover:border-red-400 hover:text-red-300",
        outline:
          "border-2 border-gray-600 bg-transparent text-gray-200 hover:border-gray-500 hover:text-gray-300",
        secondary:
          "border-2 border-gray-500 bg-transparent text-gray-300 hover:border-gray-400 hover:text-gray-200",
        ghost:
          "text-gray-300 hover:text-gray-200 bg-transparent",
        link: "text-blue-500 dark:text-blue-400 underline-offset-4 hover:underline decoration-2",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
        lg: "h-12 rounded-md px-6 has-[>svg]:px-4 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
