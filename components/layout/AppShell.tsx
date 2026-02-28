'use client'

import { useState } from 'react'
import { BottomNav } from './BottomNav'
import { SideDrawer } from './SideDrawer'
import { useAuth } from '@/hooks/useAuth'

interface AppShellProps {
  children: React.ReactNode
  showNav?: boolean
}

export function AppShell({ children, showNav = true }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { signOut } = useAuth()

  return (
    <div className="relative min-h-dvh bg-[var(--bg-base)] max-w-md mx-auto">
      <main className={showNav ? 'pb-nav' : ''}>
        {children}
      </main>

      {showNav && <BottomNav />}

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSignOut={signOut}
      />
    </div>
  )
}
