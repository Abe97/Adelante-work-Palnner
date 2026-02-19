import { SidebarNav } from './sidebar-nav'
import { SidebarUser } from './sidebar-user'
import type { Profile } from '@/lib/database.types'

interface SidebarProps {
  profile: Pick<Profile, 'full_name' | 'email' | 'avatar_url' | 'role'>
  onNavigate?: () => void
}

export function Sidebar({ profile, onNavigate }: SidebarProps) {
  return (
    <div className="flex flex-col h-full bg-[#1A1A1A]">
      {/* Logo */}
      <div className="px-6 py-6 shrink-0">
        <h1 className="text-xl font-bold">
          <span className="text-[#E8332A]">Aedelante</span>
        </h1>
        <p className="text-xs font-medium text-gray-500 tracking-widest uppercase mt-0.5">
          Work Planner
        </p>
      </div>

      {/* Nav */}
      <SidebarNav role={profile.role} onNavigate={onNavigate} />

      {/* User */}
      <SidebarUser profile={profile} />
    </div>
  )
}
