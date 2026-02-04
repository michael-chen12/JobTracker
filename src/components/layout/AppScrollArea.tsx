"use client"

import * as React from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface AppScrollAreaProps {
  children: React.ReactNode
  className?: string
}

export function AppScrollArea({ children, className }: AppScrollAreaProps) {
  return (
    <ScrollArea
      className={cn("h-[100dvh] w-full", className)}
      viewportClassName="overflow-x-hidden md:overflow-x-auto"
      showHorizontal={false}
    >
      <div className="min-h-[100dvh] w-full">{children}</div>
    </ScrollArea>
  )
}
