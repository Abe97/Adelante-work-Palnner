'use client'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { TaskPriority, TaskStatus } from '@/lib/database.types'
import type { TaskWithAssignee } from './task-card'

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  low:    { label: 'Bassa',   className: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Media',   className: 'bg-blue-100 text-blue-700' },
  high:   { label: 'Alta',    className: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgente', className: 'bg-red-100 text-[#E8332A]' },
}

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  todo:        { label: 'Da fare',      className: 'bg-gray-100 text-gray-600' },
  in_progress: { label: 'In corso',     className: 'bg-blue-100 text-blue-700' },
  in_review:   { label: 'In revisione', className: 'bg-yellow-100 text-yellow-700' },
  done:        { label: 'Completato',   className: 'bg-green-100 text-green-700' },
}

interface TaskListViewProps {
  tasks: TaskWithAssignee[]
  onTaskClick: (task: TaskWithAssignee) => void
}

export function TaskListView({ tasks, onTaskClick }: TaskListViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
        <p className="text-sm text-[#666666]">Nessuna task nel progetto</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_120px_90px_90px_80px_80px_60px] gap-3 px-4 py-2.5 bg-[#F5F5F5] text-xs font-semibold text-[#666666] border-b border-gray-100">
        <span>Titolo</span>
        <span>Assegnata a</span>
        <span>Priorità</span>
        <span>Stato</span>
        <span>Scadenza</span>
        <span>Ore stimate</span>
        <span>Delta</span>
      </div>

      {/* Rows */}
      {tasks.map((task) => {
        const priority = priorityConfig[task.priority]
        const status = statusConfig[task.status]
        const initials = task.assignee?.full_name
          ? task.assignee.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
          : '?'

        const isOverdue =
          task.due_date && task.status !== 'done'
            ? new Date(task.due_date) < new Date()
            : false

        const dueDateStr = task.due_date
          ? new Date(task.due_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' })
          : '—'

        const delta = task.estimated_hours > 0
          ? task.logged_hours - task.estimated_hours
          : null

        return (
          <div
            key={task.id}
            onClick={() => onTaskClick(task)}
            className="grid grid-cols-[1fr_120px_90px_90px_80px_80px_60px] gap-3 px-4 py-3 border-b border-gray-50 hover:bg-[#F5F5F5] cursor-pointer transition-colors last:border-b-0"
          >
            {/* Title */}
            <span className="text-sm text-[#1A1A1A] font-medium truncate">{task.title}</span>

            {/* Assignee */}
            <div className="flex items-center gap-1.5">
              {task.assignee ? (
                <>
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={task.assignee.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[9px] bg-[#E8332A] text-white">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-[#666666] truncate">
                    {task.assignee.full_name.split(' ')[0]}
                  </span>
                </>
              ) : (
                <span className="text-xs text-[#666666]">—</span>
              )}
            </div>

            {/* Priority */}
            <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded self-center w-fit', priority.className)}>
              {priority.label}
            </span>

            {/* Status */}
            <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded self-center w-fit', status.className)}>
              {status.label}
            </span>

            {/* Due date */}
            <span className={cn('text-xs self-center', isOverdue ? 'text-[#E8332A] font-medium' : 'text-[#666666]')}>
              {dueDateStr}
            </span>

            {/* Estimated */}
            <span className="text-xs text-[#666666] self-center">
              {task.estimated_hours > 0 ? `${task.estimated_hours}h` : '—'}
            </span>

            {/* Delta */}
            <span className={cn('text-xs font-medium self-center', delta === null ? 'text-[#666666]' : delta > 0 ? 'text-[#E8332A]' : 'text-green-600')}>
              {delta === null ? '—' : delta > 0 ? `+${delta}h` : `${delta}h`}
            </span>
          </div>
        )
      })}
    </div>
  )
}
