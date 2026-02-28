'use client'

import { X, Settings, Info, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/cn'
import { t } from '@/lib/i18n'

interface SideDrawerProps {
  open: boolean
  onClose: () => void
  onSignOut?: () => void
}

export function SideDrawer({ open, onClose, onSignOut }: SideDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'fixed left-0 top-0 bottom-0 z-50 w-72',
              'bg-[var(--bg-surface)] border-r border-[var(--border)]',
              'flex flex-col'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <span className="text-lg font-semibold text-[var(--text-primary)]">{t.drawer.menu}</span>
              <button
                onClick={onClose}
                className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
                aria-label={t.drawer.closeMenu}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 p-4 flex flex-col gap-1">
              <DrawerItem icon={Settings} label={t.drawer.settings} onClick={onClose} />
              <DrawerItem icon={Info} label={t.drawer.about} onClick={onClose} />
            </nav>

            {/* Sign out */}
            <div className="p-4 border-t border-[var(--border)]">
              <button
                onClick={onSignOut}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3',
                  'rounded-[var(--radius-md)] text-[var(--error)]',
                  'hover:bg-[rgba(248,113,113,0.08)] transition-colors'
                )}
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">{t.drawer.signOut}</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function DrawerItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-3',
        'rounded-[var(--radius-md)] text-[var(--text-secondary)]',
        'hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
        'transition-colors text-sm font-medium text-left'
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {label}
    </button>
  )
}
