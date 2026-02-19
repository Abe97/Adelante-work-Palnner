import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientDetailView } from '@/components/clients/client-detail-view'
import type { Project, Client, Profile } from '@/lib/database.types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const profile = profileRaw as { role: string } | null

  const { data: clientRaw } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!clientRaw) notFound()
  const client = clientRaw as unknown as Client

  // Load projects with members and tasks
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      tasks(id, status),
      project_members(
        user_id,
        profiles:user_id(id, full_name, avatar_url)
      )
    `)
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  type RawProject = Project & {
    tasks: { id: string; status: string }[]
    project_members: { user_id: string; profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> }[]
  }

  const enrichedProjects = ((projects ?? []) as unknown as RawProject[]).map((p) => ({
    ...p,
    client: { name: (client as Client).name } as Pick<Client, 'name'>,
    members: (p.project_members ?? [])
      .map((pm) => pm.profiles)
      .filter(Boolean) as Pick<Profile, 'id' | 'full_name' | 'avatar_url'>[],
    totalTasks: (p.tasks ?? []).length,
    doneTasks: (p.tasks ?? []).filter((t) => t.status === 'done').length,
  }))

  return (
    <ClientDetailView
      client={client}
      projects={enrichedProjects}
      isAdmin={profile?.role === 'admin'}
    />
  )
}
