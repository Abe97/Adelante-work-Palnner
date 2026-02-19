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

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, avatar_url, role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const safeProfile = profile as Pick<
    Profile,
    'full_name' | 'email' | 'avatar_url' | 'role'
  >

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F5]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-[280px] shrink-0 h-screen sticky top-0">
        <Sidebar profile={safeProfile} />
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <MobileHeader profile={safeProfile} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
