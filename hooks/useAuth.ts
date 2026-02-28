'use client'

import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/context/AuthContext'

export function useAuth() {
  const { user, loading, signIn, signOut: contextSignOut } = useAuthContext()
  const router = useRouter()

  const signOut = async () => {
    await contextSignOut()
    router.push('/login')
  }

  return { user, loading, signIn, signOut }
}
