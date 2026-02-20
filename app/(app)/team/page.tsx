import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TeamView } from '@/components/team/team-view'
import type { Profile, Task } from '@/lib/database.types'

export default async function TeamPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Only admins can access this page
  const { data: currentProfileRaw } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const currentProfile = currentProfileRaw as { role: string } | null

  if (currentProfile?.role !== 'admin') redirect('/dashboard')

  // Fetch all profiles
  const { data: profilesRaw } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, avatar_url, created_at')
    .order('created_at', { ascending: true })

  const profiles = ((profilesRaw ?? []) as unknown as Profile[])

  // Fetch active task counts per user
  const { data: tasksRaw } = await supabase
    .from('tasks')
    .select('assigned_to')
    .in('status', ['todo', 'in_progress', 'in_review'])
    .not('assigned_to', 'is', null)

  const tasks = ((tasksRaw ?? []) as unknown as Pick<Task, 'assigned_to'>[])

  const taskCountByUser: Record<string, number> = {}
  for (const t of tasks) {
    if (t.assigned_to) {
      taskCountByUser[t.assigned_to] = (taskCountByUser[t.assigned_to] ?? 0) + 1
    }
  }

  return (
    <TeamView
      profiles={profiles}
      taskCountByUser={taskCountByUser}
      currentUserId={user.id}
    />
  )
}
