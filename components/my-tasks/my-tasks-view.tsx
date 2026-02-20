'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Clock, Circle, AlertCircle } from 'lucide-react'
import { TaskPanel } from '@/components/task-panel'
import { cn } from '@/lib/utils'
import type { Profile, Project, Task, TaskPriority, TaskStatus, TimeLog } from '@/lib/database.types'

type TaskWithProject = Task & {
  project: Pick<Project, 'id' | 'name'> | null
  assignee: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null
}

type TimeLogWithUser = TimeLog & {
  user: Pick<Profile, 'full_name' | 'avatar_url'> | null
}

interface MyTasksViewProps {
  tasks: (Task & { project: Pick<Project, 'id' | 'name'> | null })[]
  timeLogs: TimeLogWithUser[]
  userId: string
}

const priorityConfig: Record<TaskPriority, { label: string; className: string; icon: React.ReactNode }> = {
  low:    { label: 'Bassa',   className: 'bg-gray-100 text-gray-600',       icon: <Circle className="h-3 w-3" /> },
  medium: { label: 'Media',   className: 'bg-blue-100 text-blue-700',       icon: <Circle className="h-3 w-3 fill-blue-400" /> },
  high:   { label: 'Alta',    className: 'bg-orange-100 text-orange-700',   icon: <AlertCircle className="h-3 w-3" /> },
  urgent: { label: 'Urgente', className: 'bg-red-100 text-[#E8332A]',       icon: <AlertCircle className="h-3 w-3 fill-red-400" /> },
}

const statusGroups: { status: TaskStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { status: 'in_progress', label: 'In corso',     icon: <Clock className="h-4 w-4" />,         color: 'text-blue-600' },
  { status: 'todo',        label: 'Da fare',      icon: <Circle className="h-4 w-4" />,         color: 'text-gray-500' },
  { status: 'in_review',   label: 'In revisione', icon: <AlertCircle className="h-4 w-4" />,    color: 'text-yellow-600' },
  { status: 'done',        label: 'Completate',   icon: <CheckCircle2 className="h-4 w-4" />,   color: 'text-green-600' },
]

type FilterPriority = TaskPriority | 'all'
type FilterProject  = string // project id or 'all'

export function MyTasksView({ tasks, timeLogs, userId }: MyTasksViewProps) {
  const router = useRouter()

  // Build tasks with assignee = current user (for panel compat)
  const enrichedTasks: TaskWithProject[] = tasks.map((t) => ({
    ...t,
    assignee: { id: userId, full_name: '', avatar_url: null },
  }))

  const [selectedTask, setSelectedTask] = useState<TaskWithProject | null>(null)
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all')
  const [filterProject, setFilterProject] = useState<FilterProject>('all')

  // Unique projects for filter
  const projects = Array.from(
    new Map(
      enrichedTasks
        .filter((t) => t.project)
        .map((t) => [t.project!.id, t.project!])
    ).values()
  )

  const filtered = enrichedTasks.filter((t) => {
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false
    if (filterProject !== 'all' && t.project?.id !== filterProject) return false
    return true
  })

  const handleTaskClick = useCallback((task: TaskWithProject) => {
    setSelectedTask(task)
  }, [])

  const handlePanelClose = useCallback(() => {
    setSelectedTask(null)
  }, [])

  const handleTaskDeleted = useCallback(() => {
    setSelectedTask(null)
    router.refresh()
  }, [router])

  const taskTimeLogs = selectedTask
    ? timeLogs.filter((l) => l.task_id === selectedTask.id)
    : []

  // Stats
  const done = enrichedTasks.filter((t) => t.status === 'done').length
  const inProgress = enrichedTasks.filter((t) => t.status === 'in_progress').length
  const overdue = enrichedTasks.filter(
    (t) => t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date()
  ).length
  const totalLogged = enrichedTasks.reduce((s, t) => s + t.logged_hours, 0)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Le mie task</h1>
        <p className="text-sm text-[#666666] mt-1">Tutte le task assegnate a te</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-3 border border-gray-100">
          <p className="text-xs text-[#666666] mb-0.5">Totali</p>
          <p className="text-2xl font-bold text-[#1A1A1A]">{enrichedTasks.length}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100">
          <p className="text-xs text-[#666666] mb-0.5">In corso</p>
          <p className="text-2xl font-bold text-blue-600">{inProgress}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100">
          <p className="text-xs text-[#666666] mb-0.5">Completate</p>
          <p className="text-2xl font-bold text-green-600">{done}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100">
          <p className="text-xs text-[#666666] mb-0.5">Scadute</p>
          <p className={cn('text-2xl font-bold', overdue > 0 ? 'text-[#E8332A]' : 'text-[#1A1A1A]')}>{overdue}</p>
        </div>
      </div>

      {/* Ore totali */}
      {totalLogged > 0 && (
        <div className="bg-[#1A1A1A] text-white rounded-xl px-4 py-3 flex items-center gap-3 mb-6">
          <Clock className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">{totalLogged.toFixed(1)}h lavorate in totale</p>
            <p className="text-xs text-white/60">su tutti i progetti</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Priority filter */}
        <div className="flex items-center gap-1.5 bg-[#F5F5F5] rounded-lg p-0.5">
          {(['all', 'urgent', 'high', 'medium', 'low'] as (FilterPriority)[]).map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={cn(
                'px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
                filterPriority === p
                  ? 'bg-white text-[#1A1A1A] shadow-sm'
                  : 'text-[#666666] hover:text-[#1A1A1A]'
              )}
            >
              {p === 'all' ? 'Tutte' : priorityConfig[p as TaskPriority].label}
            </button>
          ))}
        </div>

        {/* Project filter */}
        {projects.length > 1 && (
          <div className="flex items-center gap-1.5 bg-[#F5F5F5] rounded-lg p-0.5 overflow-x-auto max-w-full">
            <button
              onClick={() => setFilterProject('all')}
              className={cn(
                'px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all',
                filterProject === 'all'
                  ? 'bg-white text-[#1A1A1A] shadow-sm'
                  : 'text-[#666666] hover:text-[#1A1A1A]'
              )}
            >
              Tutti i progetti
            </button>
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setFilterProject(p.id)}
                className={cn(
                  'px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all',
                  filterProject === p.id
                    ? 'bg-white text-[#1A1A1A] shadow-sm'
                    : 'text-[#666666] hover:text-[#1A1A1A]'
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Empty state */}
      {enrichedTasks.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 py-20 text-center">
          <CheckCircle2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-[#1A1A1A] mb-1">Nessuna task assegnata</p>
          <p className="text-xs text-[#666666]">Le task che ti vengono assegnate appariranno qui</p>
        </div>
      )}

      {/* Grouped by status */}
      <div className="space-y-6">
        {statusGroups.map((group) => {
          const groupTasks = filtered.filter((t) => t.status === group.status)
          if (groupTasks.length === 0) return null

          return (
            <div key={group.status}>
              <div className={cn('flex items-center gap-2 mb-3', group.color)}>
                {group.icon}
                <h2 className="text-sm font-semibold">{group.label}</h2>
                <span className="text-xs font-medium bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                  {groupTasks.length}
                </span>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {groupTasks.map((task, idx) => {
                  const priority = priorityConfig[task.priority]
                  const isOverdue =
                    task.due_date && task.status !== 'done'
                      ? new Date(task.due_date) < new Date()
                      : false

                  const dueDateStr = task.due_date
                    ? new Date(task.due_date).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : null

                  return (
                    <div
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#F5F5F5] transition-colors',
                        idx !== groupTasks.length - 1 && 'border-b border-gray-50'
                      )}
                    >
                      {/* Status icon */}
                      <span className={group.color}>{group.icon}</span>

                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm font-medium truncate',
                          task.status === 'done' ? 'line-through text-[#666666]' : 'text-[#1A1A1A]'
                        )}>
                          {task.title}
                        </p>
                        {task.project && (
                          <Link
                            href={`/projects/${task.project.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] text-[#666666] hover:text-[#E8332A] transition-colors"
                          >
                            {task.project.name}
                          </Link>
                        )}
                      </div>

                      {/* Priority */}
                      <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0', priority.className)}>
                        {priority.label}
                      </span>

                      {/* Due date */}
                      {dueDateStr && (
                        <span className={cn(
                          'text-xs shrink-0',
                          isOverdue ? 'text-[#E8332A] font-medium' : 'text-[#666666]'
                        )}>
                          {dueDateStr}
                        </span>
                      )}

                      {/* Hours */}
                      {task.estimated_hours > 0 && (
                        <span className="text-xs text-[#666666] shrink-0">
                          {task.logged_hours}h / {task.estimated_hours}h
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Filtered empty */}
        {filtered.length === 0 && enrichedTasks.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 py-10 text-center">
            <p className="text-sm text-[#666666]">Nessuna task con i filtri selezionati</p>
          </div>
        )}
      </div>

      {/* Task panel */}
      <TaskPanel
        task={selectedTask}
        timeLogs={taskTimeLogs}
        members={[]}
        projectId={selectedTask?.project?.id ?? ''}
        onClose={handlePanelClose}
        onDeleted={handleTaskDeleted}
      />
    </div>
  )
}
