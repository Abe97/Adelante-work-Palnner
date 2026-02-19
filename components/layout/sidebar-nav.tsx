'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  CheckSquare,
  Users,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/lib/database.types'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Clienti', href: '/clients', icon: Building2 },
  { label: 'Progetti', href: '/projects', icon: FolderKanban },
  { label: 'Le mie Task', href: '/my-tasks', icon: CheckSquare },
  { label: 'Team', href: '/team', icon: Users, adminOnly: true },
  { label: 'Impostazioni', href: '/settings', icon: Settings },
]

interface SidebarNavProps {
  role: UserRole
  onNavigate?: () => void
}

export function SidebarNav({ role, onNavigate }: SidebarNavProps) {
  const pathname = usePathname()

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || role === 'admin'
  )

  return (
    <nav className="flex-1 px-3 py-2 space-y-1">
      {visibleItems.map((item) => {
        const Icon = item.icon
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + '/')

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-[#E8332A] text-white'
                : 'text-gray-400 hover:bg-[#2A2A2A] hover:text-white'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
