import { CheckSquare, Clock, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UrgentTaskRow } from '@/components/dashboard/urgent-task-row'
import { ActiveProjectCard } from '@/components/dashboard/active-project-card'
import type { Task, Project, Client } from '@/lib/database.types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load profile
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as { full_name: string; role: string } | null
  const firstName = profile?.full_name?.split(' ')[0] ?? 'utente'

  // Date helpers
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay() + 1)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const in3Days = new Date(now)
  in3Days.setDate(now.getDate() + 3)
  in3Days.setHours(23, 59, 59, 999)

  // Parallel data fetching
  const [
    { data: assignedTasks },
    { data: dueSoonTasks },
    { data: weekTimeLogs },
    { data: urgentTasks },
    { data: activeProjects },
  ] = await Promise.all([
    // Total assigned tasks
    supabase
      .from('tasks')
      .select('id', { count: 'exact' })
      .eq('assigned_to', user.id)
      .neq('status', 'done'),

    // Tasks due this week
    supabase
      .from('tasks')
      .select('id', { count: 'exact' })
      .eq('assigned_to', user.id)
      .neq('status', 'done')
      .gte('due_date', weekStart.toISOString().split('T')[0])
      .lte('due_date', weekEnd.toISOString().split('T')[0]),

    // Hours logged this week
    supabase
      .from('time_logs')
      .select('hours')
      .eq('user_id', user.id)
      .gte('logged_date', weekStart.toISOString().split('T')[0])
      .lte('logged_date', weekEnd.toISOString().split('T')[0]),

    // Urgent tasks: priority=urgent OR due within 3 days
    supabase
      .from('tasks')
      .select('*, project:projects(id, name)')
      .eq('assigned_to', user.id)
      .neq('status', 'done')
      .or(`priority.eq.urgent,due_date.lte.${in3Days.toISOString().split('T')[0]}`)
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(5),

    // Active projects where user is member
    supabase
      .from('projects')
      .select(`
        *,
        client:clients(name),
        tasks(id, status)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const weeklyHours = ((weekTimeLogs ?? []) as { hours: number }[]).reduce(
    (sum, log) => sum + (log.hours ?? 0),
    0
  )

  type UrgentTask = Task & { project: Pick<Project, 'id' | 'name'> | null }
  type ProjectWithRelation = Project & {
    client: Pick<Client, 'name'> | null
    tasks: { id: string; status: string }[]
  }

  const urgentList = (urgentTasks ?? []) as unknown as UrgentTask[]
  const projectList = (activeProjects ?? []) as unknown as ProjectWithRelation[]

  return (
    <div>
      <PageHeader
        title={`Ciao, ${firstName} 👋`}
        subtitle="Ecco un riepilogo della tua settimana"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Task assegnate"
          value={assignedTasks?.length ?? 0}
          icon={<CheckSquare className="h-5 w-5" />}
        />
        <StatCard
          label="In scadenza questa settimana"
          value={dueSoonTasks?.length ?? 0}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <StatCard
          label="Ore loggate questa settimana"
          value={`${weeklyHours.toFixed(1)}h`}
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Urgent Tasks */}
        <div className="lg:col-span-2">
          <Card className="bg-white border-0 shadow-sm h-full">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-base font-semibold text-[#1A1A1A] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#E8332A]" />
                Task urgenti
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {urgentList.length === 0 ? (
                <p className="text-sm text-[#666666] text-center py-6">
                  Nessuna task urgente 🎉
                </p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {urgentList.map((task) => (
                    <UrgentTaskRow key={task.id} task={task} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Projects */}
        <div className="lg:col-span-3">
          <h2 className="text-base font-semibold text-[#1A1A1A] mb-3">
            I miei progetti attivi
          </h2>
          {projectList.length === 0 ? (
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="py-10 text-center">
                <p className="text-sm text-[#666666]">Nessun progetto attivo</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projectList.map((project) => {
                const tasks = project.tasks ?? []
                const doneTasks = tasks.filter((t) => t.status === 'done').length
                return (
                  <ActiveProjectCard
                    key={project.id}
                    project={{
                      ...project,
                      client: project.client,
                      totalTasks: tasks.length,
                      doneTasks,
                    }}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
