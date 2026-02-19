import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProjectsView } from '@/components/projects/projects-view'
import type { Project, Client, Profile } from '@/lib/database.types'

export default async function ProjectsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const profile = profileRaw as { role: string } | null

  const [{ data: projects }, { data: clients }] = await Promise.all([
    supabase
      .from('projects')
      .select(`
        *,
        client:clients(name),
        tasks(id, status),
        project_members(
          user_id,
          profiles:user_id(id, full_name, avatar_url)
        )
      `)
      .order('created_at', { ascending: false }),

    supabase
      .from('clients')
      .select('id, name')
      .eq('is_archived', false)
      .order('name', { ascending: true }),
  ])

  type RawProject = Project & {
    client: Pick<Client, 'name'> | null
    tasks: { id: string; status: string }[]
    project_members: { user_id: string; profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> }[]
  }

  const enriched = ((projects ?? []) as unknown as RawProject[]).map((p) => ({
    ...p,
    members: (p.project_members ?? [])
      .map((pm) => pm.profiles)
      .filter(Boolean) as Pick<Profile, 'id' | 'full_name' | 'avatar_url'>[],
    totalTasks: (p.tasks ?? []).length,
    doneTasks: (p.tasks ?? []).filter((t) => t.status === 'done').length,
  }))

  return (
    <ProjectsView
      projects={enriched}
      clients={(clients ?? []) as { id: string; name: string }[]}
      isAdmin={profile?.role === 'admin'}
    />
  )
}
