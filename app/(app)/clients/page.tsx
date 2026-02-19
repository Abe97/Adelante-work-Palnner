import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientsView } from '@/components/clients/clients-view'
import type { Client } from '@/lib/database.types'

export default async function ClientsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const profile = profileRaw as { role: string } | null

  const { data: clients } = await supabase
    .from('clients')
    .select(`
      *,
      projects(id, status)
    `)
    .order('name', { ascending: true })

  type RawClient = Client & { projects: { id: string; status: string }[] }

  const enriched = ((clients ?? []) as unknown as RawClient[]).map((c) => ({
    ...c,
    activeProjects: (c.projects ?? []).filter((p) => p.status === 'active').length,
  }))

  return (
    <ClientsView
      clients={enriched}
      isAdmin={profile?.role === 'admin'}
    />
  )
}
