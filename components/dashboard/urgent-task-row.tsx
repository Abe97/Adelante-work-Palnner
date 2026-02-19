import Link from 'next/link'
import { Calendar, ArrowRight } from 'lucide-react'
import { PriorityBadge } from '@/components/ui/status-badge'
import type { Task, Project } from '@/lib/database.types'

interface UrgentTaskRowProps {
  task: Task & { project: Pick<Project, 'id' | 'name'> | null }
}

function formatDueDate(date: string | null) {
  if (!date) return null
  const d = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { label: `${Math.abs(diff)}g di ritardo`, danger: true }
  if (diff === 0) return { label: 'Scade oggi', danger: true }
  if (diff === 1) return { label: 'Scade domani', danger: true }
  return { label: `${diff}g rimasti`, danger: false }
}

export function UrgentTaskRow({ task }: UrgentTaskRowProps) {
  const due = formatDueDate(task.due_date)

  return (
    <Link
      href={`/projects/${task.project?.id ?? ''}`}
      className="flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1A1A1A] truncate">{task.title}</p>
        {task.project && (
          <p className="text-xs text-[#666666] mt-0.5 truncate">{task.project.name}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <PriorityBadge priority={task.priority} />
        {due && (
          <span
            className={`flex items-center gap-1 text-xs font-medium ${
              due.danger ? 'text-red-600' : 'text-[#666666]'
            }`}
          >
            <Calendar className="h-3 w-3" />
            {due.label}
          </span>
        )}
        <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
      </div>
    </Link>
  )
}
