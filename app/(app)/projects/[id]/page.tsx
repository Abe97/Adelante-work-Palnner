import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProjectDetailView } from '@/components/projects/project-detail-view'
import type { Project, Client, Profile, Task, TimeLog } from '@/lib/database.types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: PageProps) {
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

  // Fetch project with client
  const { data: projectRaw } = await supabase
    .from('projects')
    .select('*, client:clients(id, name)')
    .eq('id', id)
    .single()

  if (!projectRaw) notFound()

  type RawProject = Project & { client: Pick<Client, 'id' | 'name'> | null }
  const project = projectRaw as unknown as RawProject

  // Fetch project members with profiles
  const { data: membersRaw } = await supabase
    .from('project_members')
    .select('profiles:user_id(id, full_name, avatar_url)')
    .eq('project_id', id)

  type MemberRow = { profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> }
  const members = ((membersRaw ?? []) as unknown as MemberRow[])
    .map((m) => m.profiles)
    .filter(Boolean) as Pick<Profile, 'id' | 'full_name' | 'avatar_url'>[]

  // Fetch tasks with assignees
  const { data: tasksRaw } = await supabase
    .from('tasks')
    .select('*, assignee:profiles!assigned_to(id, full_name, avatar_url)')
    .eq('project_id', id)
    .order('created_at', { ascending: true })

  type RawTask = Task & {
    assignee: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null
  }
  const tasks = ((tasksRaw ?? []) as unknown as RawTask[])

  // Fetch time logs for all tasks in this project with user info
  const taskIds = tasks.map((t) => t.id)

  let timeLogs: (TimeLog & { user: Pick<Profile, 'full_name' | 'avatar_url'> | null })[] = []

  if (taskIds.length > 0) {
    const { data: logsRaw } = await supabase
      .from('time_logs')
      .select('*, user:profiles!user_id(full_name, avatar_url)')
      .in('task_id', taskIds)
      .order('logged_date', { ascending: false })

    type RawLog = TimeLog & {
      user: Pick<Profile, 'full_name' | 'avatar_url'> | null
    }
    timeLogs = ((logsRaw ?? []) as unknown as RawLog[])
  }

  return (
    <ProjectDetailView
      project={project}
      tasks={tasks}
      members={members}
      timeLogs={timeLogs}
      isAdmin={profile?.role === 'admin'}
    />
  )
}
