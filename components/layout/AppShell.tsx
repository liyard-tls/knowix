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
    <div className="fixed inset-0 max-w-md mx-auto bg-[var(--bg-base)] flex flex-col">
      <main className={`flex-1 overflow-y-auto overscroll-none${showNav ? ' pb-nav' : ''}`}>
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
