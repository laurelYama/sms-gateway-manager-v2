"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

// Implémentation légère sans Radix, compatible avec l’API shadcn

type AccordionProps = {
  type?: "single" | "multiple"
  collapsible?: boolean
  defaultValue?: string
  className?: string
  children: React.ReactNode
}

export function Accordion({ defaultValue, className, children }: AccordionProps) {
  // Injecte la prop defaultOpen dans les AccordionItem dont la value == defaultValue
  const enhanced = React.Children.map(children, (child: any) => {
    if (!React.isValidElement(child)) return child
    if (child.type?.displayName === "AccordionItem" && child.props?.value) {
      const defaultOpen = child.props.value === defaultValue
      return React.cloneElement(child, { defaultOpen })
    }
    return child
  })
  return <div className={cn("w-full", className)}>{enhanced}</div>
}

type AccordionItemProps = {
  value?: string
  defaultOpen?: boolean
  className?: string
  children: React.ReactNode
}

export const AccordionItem = Object.assign(
  function AccordionItem({ defaultOpen, className, children }: AccordionItemProps) {
    return (
      <details className={cn("group border-b border-transparent", className)} open={defaultOpen}>
        {children}
      </details>
    )
  },
  { displayName: "AccordionItem" }
)

type TriggerProps = React.HTMLAttributes<HTMLDivElement> & { className?: string; children: React.ReactNode }
export function AccordionTrigger({ className, children, ...props }: TriggerProps) {
  return (
    <summary
      className={cn(
        "flex list-none cursor-pointer items-center justify-between py-2 text-sm font-medium transition-all",
        "focus:outline-none",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180" />
    </summary>
  )
}

type ContentProps = React.HTMLAttributes<HTMLDivElement> & { className?: string; children: React.ReactNode }
export function AccordionContent({ className, children, ...props }: ContentProps) {
  return (
    <div className={cn("overflow-hidden text-sm", className)} {...props}>
      <div className="pt-0 pb-2">{children}</div>
    </div>
  )
}
