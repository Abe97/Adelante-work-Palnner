import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsView } from '@/components/settings/settings-view'
import type { Profile } from '@/lib/database.types'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, avatar_url, created_at')
    .eq('id', user.id)
    .single()

  const profile = (profileRaw as unknown as Profile | null) ?? {
    id: user.id,
    full_name: user.email?.split('@')[0] ?? 'Utente',
    email: user.email ?? '',
    role: 'member' as const,
    avatar_url: null,
    created_at: new Date().toISOString(),
  }

  return <SettingsView profile={profile} />
}
