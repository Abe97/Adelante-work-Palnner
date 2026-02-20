'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Task, Profile, TaskPriority } from '@/lib/database.types'

export type TaskWithAssignee = Task & {
  assignee: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null
}

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  low:    { label: 'Bassa',    className: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Media',    className: 'bg-blue-100 text-blue-700' },
  high:   { label: 'Alta',     className: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgente',  className: 'bg-red-100 text-[#E8332A]' },
}

interface TaskCardProps {
  task: TaskWithAssignee
  onClick: () => void
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priority = priorityConfig[task.priority]

  const isOverdue =
    task.due_date && task.status !== 'done'
      ? new Date(task.due_date) < new Date()
      : false

  const dueDateStr = task.due_date
    ? new Date(task.due_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
    : null

  const loggedPct =
    task.estimated_hours > 0
      ? Math.min(100, Math.round((task.logged_hours / task.estimated_hours) * 100))
      : 0

  const initials = task.assignee?.full_name
    ? task.assignee.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg p-3 shadow-sm border border-gray-100 cursor-pointer',
        'hover:shadow-md hover:border-gray-200 transition-all select-none',
        isDragging && 'opacity-50 shadow-lg scale-105'
      )}
    >
      {/* Priority badge */}
      <div className="flex items-center justify-between mb-2">
        <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', priority.className)}>
          {priority.label}
        </span>
        {task.assignee && (
          <Avatar className="h-5 w-5">
            <AvatarImage src={task.assignee.avatar_url ?? undefined} />
            <AvatarFallback className="text-[9px] bg-[#E8332A] text-white">{initials}</AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-[#1A1A1A] leading-snug mb-2 line-clamp-2">
        {task.title}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        {dueDateStr && (
          <span
            className={cn(
              'flex items-center gap-1 text-[10px]',
              isOverdue ? 'text-[#E8332A] font-medium' : 'text-[#666666]'
            )}
          >
            <Calendar className="h-3 w-3" />
            {dueDateStr}
          </span>
        )}
        {task.estimated_hours > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-[#666666] ml-auto">
            <Clock className="h-3 w-3" />
            {task.logged_hours}h / {task.estimated_hours}h
          </span>
        )}
      </div>

      {/* Hours progress */}
      {task.estimated_hours > 0 && (
        <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              loggedPct >= 100 ? 'bg-[#E8332A]' : 'bg-[#1A1A1A]'
            )}
            style={{ width: `${loggedPct}%` }}
          />
        </div>
      )}
    </div>
  )
}
