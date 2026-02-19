import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ProjectStatus, TaskStatus, TaskPriority } from '@/lib/database.types'

const projectStatusConfig: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  active: { label: 'In corso', className: 'bg-green-100 text-green-800 border-green-200' },
  completed: { label: 'Completato', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  on_hold: { label: 'In attesa', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  archived: { label: 'Archiviato', className: 'bg-gray-100 text-gray-600 border-gray-200' },
}

const taskStatusConfig: Record<
  TaskStatus,
  { label: string; className: string }
> = {
  todo: { label: 'Da fare', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  in_progress: { label: 'In corso', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  in_review: { label: 'In revisione', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  done: { label: 'Completato', className: 'bg-green-100 text-green-800 border-green-200' },
}

const priorityConfig: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  low: { label: 'Bassa', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  medium: { label: 'Media', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  high: { label: 'Alta', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  urgent: { label: 'Urgente', className: 'bg-red-100 text-red-700 border-red-200' },
}

export function ProjectStatusBadge({ status }: { status: string }) {
  const config = projectStatusConfig[status as ProjectStatus] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  }
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium border', config.className)}
    >
      {config.label}
    </Badge>
  )
}

export function TaskStatusBadge({ status }: { status: string }) {
  const config = taskStatusConfig[status as TaskStatus] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  }
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium border', config.className)}
    >
      {config.label}
    </Badge>
  )
}

export function PriorityBadge({ priority }: { priority: string }) {
  const config = priorityConfig[priority as TaskPriority] ?? {
    label: priority,
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  }
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium border', config.className)}
    >
      {config.label}
    </Badge>
  )
}
