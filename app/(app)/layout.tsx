import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileHeader } from '@/components/layout/mobile-header'
import type { Profile } from '@/lib/database.types'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('full_name, email, avatar_url, role')
    .eq('id', user.id)
    .single()

  // Do NOT redirect if profile is missing — it may not exist yet (trigger delay,
  // RLS policy, first login). Use a safe fallback so the layout always renders.
  const profile = (profileRaw as Pick<Profile, 'full_name' | 'email' | 'avatar_url' | 'role'> | null) ?? {
    full_name: user.email?.split('@')[0] ?? 'Utente',
    email: user.email ?? '',
    avatar_url: null,
    role: 'member' as const,
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F5]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-[280px] shrink-0 h-screen sticky top-0">
        <Sidebar profile={profile} />
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <MobileHeader profile={profile} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
