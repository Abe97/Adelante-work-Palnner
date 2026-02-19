'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Sidebar } from './sidebar'
import type { Profile } from '@/lib/database.types'

interface MobileHeaderProps {
  profile: Pick<Profile, 'full_name' | 'email' | 'avatar_url' | 'role'>
}

export function MobileHeader({ profile }: MobileHeaderProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-[#1A1A1A] border-b border-white/10 sticky top-0 z-30">
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-[#2A2A2A] transition-colors"
          aria-label="Apri menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <span className="text-base font-bold text-[#E8332A]">Aedelante</span>
          <span className="text-xs text-gray-500 ml-2 tracking-widest uppercase">
            Work Planner
          </span>
        </div>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-[280px] border-0">
          <SheetTitle className="sr-only">Menu di navigazione</SheetTitle>
          <div className="h-full">
            <Sidebar profile={profile} onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
