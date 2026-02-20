'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { User, Lock, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import type { Profile } from '@/lib/database.types'
import { updateProfile, changePassword } from '@/lib/actions/profile'

interface SettingsViewProps {
  profile: Profile
}

export function SettingsView({ profile }: SettingsViewProps) {
  const [isPending, startTransition] = useTransition()

  // Profile form
  const [fullName, setFullName] = useState(profile.full_name)
  const [profileDirty, setProfileDirty] = useState(false)

  // Password form
  const [pwForm, setPwForm] = useState({
    current: '',
    next: '',
    confirm: '',
  })
  const [pwError, setPwError] = useState<string | null>(null)

  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !profileDirty) return
    startTransition(async () => {
      const result = await updateProfile(fullName)
      if (result?.error) {
        toast.error(`Errore: ${result.error}`)
      } else {
        toast.success('Profilo aggiornato!')
        setProfileDirty(false)
      }
    })
  }

  function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    setPwError(null)
    if (pwForm.next !== pwForm.confirm) {
      setPwError('Le password non corrispondono')
      return
    }
    if (pwForm.next.length < 8) {
      setPwError('La nuova password deve essere di almeno 8 caratteri')
      return
    }
    startTransition(async () => {
      const result = await changePassword(pwForm.current, pwForm.next)
      if (result?.error) {
        setPwError(result.error)
      } else {
        toast.success('Password aggiornata!')
        setPwForm({ current: '', next: '', confirm: '' })
      }
    })
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Impostazioni</h1>
        <p className="text-sm text-[#666666] mt-1">Gestisci il tuo profilo e le credenziali di accesso</p>
      </div>

      {/* Profile section */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <User className="h-5 w-5 text-[#1A1A1A]" />
          <h2 className="text-base font-semibold text-[#1A1A1A]">Profilo</h2>
        </div>

        {/* Avatar + role */}
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-xl bg-[#E8332A] text-white">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-[#1A1A1A]">{profile.full_name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Shield className="h-3.5 w-3.5 text-[#666666]" />
              <span className="text-xs text-[#666666] capitalize">{profile.role}</span>
            </div>
            <p className="text-xs text-[#666666] mt-0.5">
              Membro dal {new Date(profile.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="full-name">Nome completo</Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                setProfileDirty(e.target.value !== profile.full_name)
              }}
              placeholder="Il tuo nome"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="bg-[#F5F5F5] text-[#666666] cursor-not-allowed"
            />
            <p className="text-xs text-[#666666]">L&apos;email non può essere modificata</p>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={isPending || !profileDirty || !fullName.trim()}
            >
              {isPending ? 'Salvataggio...' : 'Salva modifiche'}
            </Button>
          </div>
        </form>
      </div>

      {/* Password section */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <Lock className="h-5 w-5 text-[#1A1A1A]" />
          <h2 className="text-base font-semibold text-[#1A1A1A]">Cambia password</h2>
        </div>

        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current-pw">Password attuale *</Label>
            <Input
              id="current-pw"
              type="password"
              placeholder="••••••••"
              value={pwForm.current}
              onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
              required
            />
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label htmlFor="new-pw">Nuova password *</Label>
            <Input
              id="new-pw"
              type="password"
              placeholder="Minimo 8 caratteri"
              value={pwForm.next}
              onChange={(e) => {
                setPwForm((f) => ({ ...f, next: e.target.value }))
                setPwError(null)
              }}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-pw">Conferma nuova password *</Label>
            <Input
              id="confirm-pw"
              type="password"
              placeholder="Ripeti la nuova password"
              value={pwForm.confirm}
              onChange={(e) => {
                setPwForm((f) => ({ ...f, confirm: e.target.value }))
                setPwError(null)
              }}
              required
            />
          </div>

          {pwError && (
            <p className="text-sm text-[#E8332A]">{pwError}</p>
          )}

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={isPending || !pwForm.current || !pwForm.next || !pwForm.confirm}
            >
              {isPending ? 'Aggiornamento...' : 'Aggiorna password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
