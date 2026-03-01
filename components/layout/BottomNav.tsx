'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, BarChart2, User } from 'lucide-react'
import { cn } from '@/lib/cn'
import { t } from '@/lib/i18n'

const navItems = [
  { href: '/dashboard', label: t.nav.home,    icon: Home },
  { href: '/courses',   label: t.nav.courses,  icon: BookOpen },
  { href: '/stats',     label: t.nav.stats,    icon: BarChart2 },
  { href: '/profile',   label: t.nav.profile,  icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-surface)] border-t border-[var(--border)]" style={{ height: 'var(--bottom-nav-height)' }}>
      <div className="flex items-stretch h-full max-w-md mx-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 transition-colors duration-[var(--duration-fast)]',
                isActive
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              )}
            >
              <Icon
                className={cn(
                  'transition-all duration-[var(--duration-fast)]',
                  isActive ? 'h-5 w-5' : 'h-5 w-5'
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
