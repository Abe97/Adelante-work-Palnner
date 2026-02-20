import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MyTasksView } from '@/components/my-tasks/my-tasks-view'
import type { Profile, Project, Task, TimeLog } from '@/lib/database.types'

export default async function MyTasksPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all tasks assigned to the current user, with project info
  const { data: tasksRaw } = await supabase
    .from('tasks')
    .select('*, project:projects(id, name)')
    .eq('assigned_to', user.id)
    .order('due_date', { ascending: true, nullsFirst: false })

  type TaskWithProject = Task & {
    project: Pick<Project, 'id' | 'name'> | null
  }
  const tasks = ((tasksRaw ?? []) as unknown as TaskWithProject[])

  // Fetch time logs for those tasks
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
    <MyTasksView
      tasks={tasks}
      timeLogs={timeLogs}
      userId={user.id}
    />
  )
}
