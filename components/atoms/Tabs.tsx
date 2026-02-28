'use client'

import * as RadixTabs from '@radix-ui/react-tabs'
import { cn } from '@/lib/cn'

// ─── Root ─────────────────────────────────────────────────────
export const Tabs = RadixTabs.Root

// ─── List ─────────────────────────────────────────────────────
interface TabsListProps extends React.ComponentPropsWithoutRef<typeof RadixTabs.List> {
  className?: string
}

export function TabsList({ className, children, ...props }: TabsListProps) {
  return (
    <RadixTabs.List
      className={cn(
        'flex items-center gap-1 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] p-1',
        className
      )}
      {...props}
    >
      {children}
    </RadixTabs.List>
  )
}

// ─── Trigger ──────────────────────────────────────────────────
interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof RadixTabs.Trigger> {
  className?: string
}

export function TabsTrigger({ className, children, ...props }: TabsTriggerProps) {
  return (
    <RadixTabs.Trigger
      className={cn(
        'flex-1 px-3 py-1.5 text-sm font-medium rounded-[var(--radius-sm)] text-[var(--text-muted)]',
        'transition-all duration-[var(--duration-fast)]',
        'data-[state=active]:bg-[var(--bg-surface)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-[var(--shadow-sm)]',
        'hover:text-[var(--text-secondary)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
        className
      )}
      {...props}
    >
      {children}
    </RadixTabs.Trigger>
  )
}

// ─── Content ──────────────────────────────────────────────────
interface TabsContentProps extends React.ComponentPropsWithoutRef<typeof RadixTabs.Content> {
  className?: string
}

export function TabsContent({ className, children, ...props }: TabsContentProps) {
  return (
    <RadixTabs.Content
      className={cn('focus-visible:outline-none', className)}
      {...props}
    >
      {children}
    </RadixTabs.Content>
  )
}
