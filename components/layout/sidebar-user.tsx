'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/database.types'

interface SidebarUserProps {
  profile: Pick<Profile, 'full_name' | 'email' | 'avatar_url'>
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

export function SidebarUser({ profile }: SidebarUserProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="px-3 py-4 border-t border-white/10">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          {profile.avatar_url && (
            <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
          )}
          <AvatarFallback className="bg-[#E8332A] text-white text-xs font-semibold">
            {getInitials(profile.full_name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {profile.full_name}
          </p>
          <p className="text-xs text-gray-500 truncate">{profile.email}</p>
        </div>

        <button
          onClick={handleLogout}
          title="Logout"
          className="shrink-0 p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-[#2A2A2A] transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
