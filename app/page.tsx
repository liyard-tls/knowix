import { redirect } from 'next/navigation'

// Root redirect — реальна логіка auth-guard в layout'ах кожного розділу
export default function RootPage() {
  redirect('/dashboard')
}
