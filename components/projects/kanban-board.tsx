'use client'

import { useState, useOptimistic, useTransition } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { TaskCard, type TaskWithAssignee } from './task-card'
import { cn } from '@/lib/utils'
import type { TaskStatus } from '@/lib/database.types'
import { updateTaskStatus } from '@/lib/actions/tasks'

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo',        label: 'Da fare',      color: 'bg-gray-200' },
  { id: 'in_progress', label: 'In corso',     color: 'bg-blue-400' },
  { id: 'in_review',   label: 'In revisione', color: 'bg-yellow-400' },
  { id: 'done',        label: 'Completato',   color: 'bg-green-400' },
]

interface KanbanBoardProps {
  tasks: TaskWithAssignee[]
  onTaskClick: (task: TaskWithAssignee) => void
  onNewTask: (status: TaskStatus) => void
}

export function KanbanBoard({ tasks, onTaskClick, onNewTask }: KanbanBoardProps) {
  const [optimisticTasks, addOptimistic] = useOptimistic(
    tasks,
    (state, { taskId, status }: { taskId: string; status: TaskStatus }) =>
      state.map((t) => (t.id === taskId ? { ...t, status } : t))
  )
  const [, startTransition] = useTransition()
  const [activeTask, setActiveTask] = useState<TaskWithAssignee | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragStart(event: DragStartEvent) {
    const task = optimisticTasks.find((t) => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleDragOver(_event: DragOverEvent) {
    // handled on drag end
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    // over.id can be the column status string or another task id
    const overId = over.id as string
    const colIds = COLUMNS.map((c) => c.id as string)

    let newStatus: TaskStatus | null = null
    if (colIds.includes(overId)) {
      newStatus = overId as TaskStatus
    } else {
      // dragged onto another task — find that task's column
      const overTask = optimisticTasks.find((t) => t.id === overId)
      if (overTask) newStatus = overTask.status
    }

    if (!newStatus) return
    const task = optimisticTasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) return

    startTransition(async () => {
      addOptimistic({ taskId, status: newStatus! })
      const result = await updateTaskStatus(taskId, newStatus!)
      if (result?.error) toast.error('Errore aggiornamento task')
    })
  }

  const byStatus = (status: TaskStatus) =>
    optimisticTasks.filter((t) => t.status === status)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colTasks = byStatus(col.id)
          return (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={colTasks}
              onTaskClick={onTaskClick}
              onNewTask={onNewTask}
            />
          )
        })}
      </div>

      <DragOverlay>
        {activeTask && (
          <TaskCard task={activeTask} onClick={() => {}} />
        )}
      </DragOverlay>
    </DndContext>
  )
}

interface KanbanColumnProps {
  column: typeof COLUMNS[0]
  tasks: TaskWithAssignee[]
  onTaskClick: (task: TaskWithAssignee) => void
  onNewTask: (status: TaskStatus) => void
}

function KanbanColumn({ column, tasks, onTaskClick, onNewTask }: KanbanColumnProps) {
  return (
    <div
      id={column.id}
      className="flex flex-col bg-[#F5F5F5] rounded-xl w-[280px] shrink-0"
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <span className={cn('w-2 h-2 rounded-full', column.color)} />
        <span className="text-sm font-semibold text-[#1A1A1A] flex-1">{column.label}</span>
        <span className="text-xs font-medium text-[#666666] bg-white rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>

      {/* Droppable area */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 px-2 pb-2 min-h-[120px]">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </div>
      </SortableContext>

      {/* Add task button */}
      <button
        onClick={() => onNewTask(column.id)}
        className="flex items-center gap-1 text-xs text-[#666666] hover:text-[#1A1A1A] px-3 py-2 hover:bg-white/60 rounded-b-xl transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Aggiungi task
      </button>
    </div>
  )
}
