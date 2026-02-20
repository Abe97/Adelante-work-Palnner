'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { UserPlus, Shield, User, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Profile, UserRole } from '@/lib/database.types'
import { inviteMember, updateMemberRole, disableMember } from '@/lib/actions/team'

interface TeamViewProps {
  profiles: Profile[]
  taskCountByUser: Record<string, number>
  currentUserId: string
}

export function TeamView({ profiles, taskCountByUser, currentUserId }: TeamViewProps) {
  const [isPending, startTransition] = useTransition()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({ fullName: '', email: '' })

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteForm.fullName.trim() || !inviteForm.email.trim()) return
    startTransition(async () => {
      const result = await inviteMember(inviteForm.fullName.trim(), inviteForm.email.trim())
      if (result?.error) {
        toast.error(`Errore invito: ${result.error}`)
      } else {
        toast.success('Invito inviato! L\'utente riceverà un\'email.')
        setInviteForm({ fullName: '', email: '' })
        setInviteOpen(false)
      }
    })
  }

  function handleRoleChange(userId: string, newRole: UserRole) {
    startTransition(async () => {
      const result = await updateMemberRole(userId, newRole)
      if (result?.error) {
        toast.error('Errore aggiornamento ruolo')
      } else {
        toast.success('Ruolo aggiornato')
      }
    })
  }

  function handleDisable(userId: string, name: string) {
    if (!confirm(`Disattivare l'account di ${name}? L'utente non potrà più accedere.`)) return
    startTransition(async () => {
      const result = await disableMember(userId)
      if (result?.error) {
        toast.error('Errore disattivazione account')
      } else {
        toast.success('Account disattivato')
      }
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Team</h1>
          <p className="text-sm text-[#666666] mt-1">{profiles.length} membro{profiles.length !== 1 ? 'i' : ''}</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invita membro
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_180px_100px_100px_120px] gap-4 px-5 py-3 bg-[#F5F5F5] text-xs font-semibold text-[#666666] border-b border-gray-100">
          <span>Membro</span>
          <span>Email</span>
          <span>Ruolo</span>
          <span>Task attive</span>
          <span>Azioni</span>
        </div>

        {profiles.length === 0 && (
          <div className="py-16 text-center">
            <User className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-[#666666]">Nessun membro nel team</p>
          </div>
        )}

        {profiles.map((profile, idx) => {
          const initials = profile.full_name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
          const isCurrentUser = profile.id === currentUserId
          const activeTasks = taskCountByUser[profile.id] ?? 0

          return (
            <div
              key={profile.id}
              className={cn(
                'grid grid-cols-[1fr_180px_100px_100px_120px] gap-4 px-5 py-3.5 items-center',
                idx !== profiles.length - 1 && 'border-b border-gray-50'
              )}
            >
              {/* Avatar + nome */}
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={profile.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs bg-[#E8332A] text-white">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A] truncate">
                    {profile.full_name}
                    {isCurrentUser && <span className="ml-1.5 text-[10px] text-[#666666]">(tu)</span>}
                  </p>
                </div>
              </div>

              {/* Email */}
              <p className="text-xs text-[#666666] truncate">{profile.email}</p>

              {/* Ruolo badge */}
              <div>
                {profile.role === 'admin' ? (
                  <Badge className="bg-[#1A1A1A] text-white text-[10px] gap-1">
                    <Shield className="h-2.5 w-2.5" /> Admin
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <User className="h-2.5 w-2.5" /> Member
                  </Badge>
                )}
              </div>

              {/* Task attive */}
              <span className={cn(
                'text-sm font-semibold',
                activeTasks > 5 ? 'text-[#E8332A]' : activeTasks > 0 ? 'text-[#1A1A1A]' : 'text-[#666666]'
              )}>
                {activeTasks}
              </span>

              {/* Azioni */}
              {isCurrentUser ? (
                <span className="text-xs text-[#666666] italic">—</span>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRoleChange(
                      profile.id,
                      profile.role === 'admin' ? 'member' : 'admin'
                    )}
                    disabled={isPending}
                    className="text-xs text-[#666666] hover:text-[#1A1A1A] underline-offset-2 hover:underline transition-colors"
                  >
                    {profile.role === 'admin' ? 'Rendi member' : 'Rendi admin'}
                  </button>
                  <span className="text-gray-300">·</span>
                  <button
                    onClick={() => handleDisable(profile.id, profile.full_name)}
                    disabled={isPending}
                    className="text-xs text-[#666666] hover:text-[#E8332A] underline-offset-2 hover:underline transition-colors"
                  >
                    Disattiva
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invita un nuovo membro</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="invite-name">Nome completo *</Label>
              <Input
                id="invite-name"
                placeholder="Mario Rossi"
                value={inviteForm.fullName}
                onChange={(e) => setInviteForm((f) => ({ ...f, fullName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email *</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="mario@azienda.it"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>

            <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <p>L&apos;utente riceverà un&apos;email con il link per impostare la password e accedere all&apos;app.</p>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={isPending || !inviteForm.fullName.trim() || !inviteForm.email.trim()}
              >
                {isPending ? 'Invio...' : 'Invia invito'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
