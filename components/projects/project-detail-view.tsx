'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutGrid, List, Users, Calendar, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { KanbanBoard } from './kanban-board'
import { TaskListView } from './task-list-view'
import { NewTaskDialog } from './new-task-dialog'
import { TaskPanel } from '@/components/task-panel'
import { AvatarStack } from '@/components/ui/avatar-stack'
import { cn } from '@/lib/utils'
import type { Client, Profile, Project, TaskStatus, TimeLog } from '@/lib/database.types'
import type { TaskWithAssignee } from './task-card'

type TimeLogWithUser = TimeLog & {
  user: Pick<Profile, 'full_name' | 'avatar_url'> | null
}

interface ProjectDetailViewProps {
  project: Project & {
    client: Pick<Client, 'id' | 'name'> | null
  }
  tasks: TaskWithAssignee[]
  members: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>[]
  timeLogs: TimeLogWithUser[]
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isAdmin?: boolean
}

const statusColors: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  on_hold:   'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
  archived:  'bg-gray-100 text-gray-600',
}

const statusLabels: Record<string, string> = {
  active:    'Attivo',
  on_hold:   'In pausa',
  completed: 'Completato',
  archived:  'Archiviato',
}

export function ProjectDetailView({
  project,
  tasks,
  members,
  timeLogs,
}: ProjectDetailViewProps) {
  const router = useRouter()
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [selectedTask, setSelectedTask] = useState<TaskWithAssignee | null>(null)
  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo')

  const handleNewTask = useCallback((status: TaskStatus) => {
    setDefaultStatus(status)
    setNewTaskOpen(true)
  }, [])

  const handleTaskClick = useCallback((task: TaskWithAssignee) => {
    setSelectedTask(task)
  }, [])

  const handlePanelClose = useCallback(() => {
    setSelectedTask(null)
  }, [])

  const handleTaskDeleted = useCallback(() => {
    setSelectedTask(null)
    router.refresh()
  }, [router])

  const handleTaskCreated = useCallback(() => {
    router.refresh()
  }, [router])

  const taskTimeLogs = selectedTask
    ? timeLogs.filter((l) => l.task_id === selectedTask.id)
    : []

  // Stats
  const totalTasks = tasks.length
  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const totalLogged = tasks.reduce((s, t) => s + t.logged_hours, 0)
  const totalEstimated = tasks.reduce((s, t) => s + t.estimated_hours, 0)
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#666666] mb-4">
        <Link href="/projects" className="hover:text-[#1A1A1A] transition-colors">
          Progetti
        </Link>
        <span>/</span>
        {project.client && (
          <>
            <Link
              href={`/clients/${project.client.id}`}
              className="hover:text-[#1A1A1A] transition-colors"
            >
              {project.client.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-[#1A1A1A] font-medium">{project.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-[#1A1A1A] truncate">{project.name}</h1>
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full shrink-0', statusColors[project.status])}>
              {statusLabels[project.status]}
            </span>
          </div>
          {project.description && (
            <p className="text-sm text-[#666666] mt-1">{project.description}</p>
          )}
          {project.client && (
            <Link
              href={`/clients/${project.client.id}`}
              className="inline-flex items-center gap-1 text-xs text-[#666666] hover:text-[#E8332A] mt-1 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              {project.client.name}
            </Link>
          )}
        </div>

        <Button onClick={() => handleNewTask('todo')} size="sm">
          + Nuova Task
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-3 border border-gray-100">
          <p className="text-xs text-[#666666] mb-0.5">Task totali</p>
          <p className="text-2xl font-bold text-[#1A1A1A]">{totalTasks}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100">
          <p className="text-xs text-[#666666] mb-0.5">Completate</p>
          <div className="flex items-end gap-1">
            <p className="text-2xl font-bold text-[#1A1A1A]">{doneTasks}</p>
            <p className="text-xs text-[#666666] mb-1">({progress}%)</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100">
          <p className="text-xs text-[#666666] mb-0.5">Ore loggate</p>
          <p className="text-2xl font-bold text-[#1A1A1A]">{totalLogged.toFixed(1)}h</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100">
          <p className="text-xs text-[#666666] mb-0.5">Ore stimate</p>
          <p className="text-2xl font-bold text-[#1A1A1A]">{totalEstimated.toFixed(1)}h</p>
        </div>
      </div>

      {/* Members + Dates */}
      <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-[#666666]">
        {members.length > 0 && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <AvatarStack
              users={members.map((m) => ({ id: m.id, name: m.full_name, avatar_url: m.avatar_url }))}
              max={5}
              size="sm"
            />
            <span>{members.length} membro{members.length !== 1 ? 'i' : ''}</span>
          </div>
        )}
        {(project.start_date || project.end_date) && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {project.start_date && (
              <span>{new Date(project.start_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            )}
            {project.start_date && project.end_date && <span>→</span>}
            {project.end_date && (
              <span>{new Date(project.end_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            )}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {totalTasks > 0 && (
        <div className="mb-6">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1A1A1A] rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* View toggle */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#666666]">
          {tasks.length} task{tasks.length !== 1 ? '' : ''}
        </p>
        <div className="flex items-center bg-[#F5F5F5] rounded-lg p-0.5">
          <button
            onClick={() => setView('kanban')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              view === 'kanban'
                ? 'bg-white text-[#1A1A1A] shadow-sm'
                : 'text-[#666666] hover:text-[#1A1A1A]'
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Kanban
          </button>
          <button
            onClick={() => setView('list')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              view === 'list'
                ? 'bg-white text-[#1A1A1A] shadow-sm'
                : 'text-[#666666] hover:text-[#1A1A1A]'
            )}
          >
            <List className="h-3.5 w-3.5" />
            Lista
          </button>
        </div>
      </div>

      {/* Main content */}
      {view === 'kanban' ? (
        <KanbanBoard
          tasks={tasks}
          onTaskClick={handleTaskClick}
          onNewTask={handleNewTask}
        />
      ) : (
        <TaskListView tasks={tasks} onTaskClick={handleTaskClick} />
      )}

      {/* New task dialog */}
      <NewTaskDialog
        open={newTaskOpen}
        onOpenChange={setNewTaskOpen}
        projectId={project.id}
        defaultStatus={defaultStatus}
        members={members}
        onCreated={handleTaskCreated}
      />

      {/* Task panel */}
      <TaskPanel
        task={selectedTask}
        timeLogs={taskTimeLogs}
        members={members}
        projectId={project.id}
        onClose={handlePanelClose}
        onDeleted={handleTaskDeleted}
      />
    </div>
  )
}
