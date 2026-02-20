'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Trash2, Clock, Edit2, Check, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { Profile, TaskPriority, TaskStatus, TimeLog } from '@/lib/database.types'
import type { TaskWithAssignee } from '@/components/projects/task-card'
import { updateTask, deleteTask, logTime, deleteTimeLog } from '@/lib/actions/tasks'

type TimeLogWithUser = TimeLog & {
  user: Pick<Profile, 'full_name' | 'avatar_url'> | null
}

interface TaskPanelProps {
  task: TaskWithAssignee | null
  timeLogs: TimeLogWithUser[]
  members: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>[]
  projectId: string
  onClose: () => void
  onDeleted: () => void
}

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Bassa', medium: 'Media', high: 'Alta', urgent: 'Urgente',
}

const statusLabels: Record<TaskStatus, string> = {
  todo: 'Da fare', in_progress: 'In corso', in_review: 'In revisione', done: 'Completato',
}

export function TaskPanel({ task, timeLogs, members, projectId, onClose, onDeleted }: TaskPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    assigned_to: task?.assigned_to ?? '',
    priority: task?.priority ?? 'medium' as TaskPriority,
    status: task?.status ?? 'todo' as TaskStatus,
    due_date: task?.due_date ?? '',
    estimated_hours: task?.estimated_hours?.toString() ?? '0',
  })

  // Time log form state
  const [logForm, setLogForm] = useState({
    hours: '',
    note: '',
    logged_date: new Date().toISOString().split('T')[0],
  })

  // Sync form when task changes
  if (task && !isEditing && editForm.title !== task.title) {
    setEditForm({
      title: task.title,
      description: task.description ?? '',
      assigned_to: task.assigned_to ?? '',
      priority: task.priority,
      status: task.status,
      due_date: task.due_date ?? '',
      estimated_hours: task.estimated_hours?.toString() ?? '0',
    })
  }

  if (!task) return null

  function handleSave() {
    if (!task) return
    startTransition(async () => {
      const result = await updateTask({
        taskId: task.id,
        projectId,
        title: editForm.title.trim(),
        description: editForm.description.trim() || null,
        assigned_to: editForm.assigned_to || null,
        priority: editForm.priority,
        status: editForm.status,
        due_date: editForm.due_date || null,
        estimated_hours: parseFloat(editForm.estimated_hours) || 0,
      })
      if (result?.error) {
        toast.error('Errore aggiornamento task')
      } else {
        toast.success('Task aggiornata')
        setIsEditing(false)
      }
    })
  }

  function handleDelete() {
    if (!task || !confirm('Eliminare questa task? L\'azione non è reversibile.')) return
    startTransition(async () => {
      const result = await deleteTask(task.id, projectId)
      if (result?.error) {
        toast.error('Errore eliminazione task')
      } else {
        toast.success('Task eliminata')
        onDeleted()
      }
    })
  }

  function handleLogTime(e: React.FormEvent) {
    e.preventDefault()
    if (!task || !logForm.hours) return
    const hours = parseFloat(logForm.hours)
    if (isNaN(hours) || hours <= 0) return

    startTransition(async () => {
      const result = await logTime({
        taskId: task.id,
        projectId,
        hours,
        note: logForm.note.trim() || null,
        logged_date: logForm.logged_date,
      })
      if (result?.error) {
        toast.error('Errore logging ore')
      } else {
        toast.success('Ore registrate!')
        setLogForm({ hours: '', note: '', logged_date: new Date().toISOString().split('T')[0] })
      }
    })
  }

  function handleDeleteLog(log: TimeLogWithUser) {
    startTransition(async () => {
      const result = await deleteTimeLog(log.id, task!.id, projectId, log.hours)
      if (result?.error) {
        toast.error('Errore eliminazione log')
      } else {
        toast.success('Log eliminato')
      }
    })
  }

  const loggedPct =
    task.estimated_hours > 0
      ? Math.min(100, Math.round((task.logged_hours / task.estimated_hours) * 100))
      : 0

  const assigneeName = task.assignee?.full_name ?? 'Non assegnata'
  const assigneeInitials = task.assignee?.full_name
    ? task.assignee.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <Sheet open={!!task} onOpenChange={(open) => { if (!open) { setIsEditing(false); onClose() } }}>
      <SheetContent side="right" className="w-full sm:w-[480px] sm:max-w-[480px] overflow-y-auto p-0">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <SheetTitle className="text-base font-semibold text-[#1A1A1A] leading-snug flex-1">
              {isEditing ? (
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="text-base font-semibold"
                  autoFocus
                />
              ) : (
                task.title
              )}
            </SheetTitle>
            <div className="flex items-center gap-1 shrink-0">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={handleSave} disabled={isPending} className="h-7 px-2">
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Salva
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-7 px-2">
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    className="h-7 px-2 text-[#666666]"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="h-7 px-2 text-[#666666] hover:text-[#E8332A]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="px-6 py-4 space-y-5">
          {/* Meta fields */}
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Descrizione</Label>
                <Textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Aggiungi una descrizione..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Assegnata a</Label>
                  <Select
                    value={editForm.assigned_to || '__none__'}
                    onValueChange={(v) => setEditForm((f) => ({ ...f, assigned_to: v === '__none__' ? '' : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nessuno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nessuno</SelectItem>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Priorità</Label>
                  <Select
                    value={editForm.priority}
                    onValueChange={(v) => setEditForm((f) => ({ ...f, priority: v as TaskPriority }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Bassa</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Stato</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(v) => setEditForm((f) => ({ ...f, status: v as TaskStatus }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">Da fare</SelectItem>
                      <SelectItem value="in_progress">In corso</SelectItem>
                      <SelectItem value="in_review">In revisione</SelectItem>
                      <SelectItem value="done">Completato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Scadenza</Label>
                  <Input
                    type="date"
                    value={editForm.due_date}
                    onChange={(e) => setEditForm((f) => ({ ...f, due_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Ore stimate</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={editForm.estimated_hours}
                  onChange={(e) => setEditForm((f) => ({ ...f, estimated_hours: e.target.value }))}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Read-only meta */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <p className="text-xs text-[#666666] mb-0.5">Assegnata a</p>
                  <div className="flex items-center gap-1.5">
                    {task.assignee ? (
                      <>
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={task.assignee.avatar_url ?? undefined} />
                          <AvatarFallback className="text-[9px] bg-[#E8332A] text-white">{assigneeInitials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-[#1A1A1A]">{assigneeName}</span>
                      </>
                    ) : (
                      <span className="text-[#666666]">Non assegnata</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-[#666666] mb-0.5">Priorità</p>
                  <p className="font-medium text-[#1A1A1A]">{priorityLabels[task.priority]}</p>
                </div>

                <div>
                  <p className="text-xs text-[#666666] mb-0.5">Stato</p>
                  <p className="font-medium text-[#1A1A1A]">{statusLabels[task.status]}</p>
                </div>

                <div>
                  <p className="text-xs text-[#666666] mb-0.5">Scadenza</p>
                  <p className={cn('font-medium', task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-[#E8332A]' : 'text-[#1A1A1A]')}>
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
                      : '—'}
                  </p>
                </div>
              </div>

              {task.description && (
                <div>
                  <p className="text-xs text-[#666666] mb-1">Descrizione</p>
                  <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap">{task.description}</p>
                </div>
              )}
            </>
          )}

          {/* Hours progress */}
          <div className="bg-[#F5F5F5] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Ore lavorate
              </span>
              <span className="text-xs text-[#666666]">
                {task.logged_hours}h / {task.estimated_hours > 0 ? `${task.estimated_hours}h` : '∞'}
              </span>
            </div>
            {task.estimated_hours > 0 && (
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full', loggedPct >= 100 ? 'bg-[#E8332A]' : 'bg-[#1A1A1A]')}
                  style={{ width: `${loggedPct}%` }}
                />
              </div>
            )}
          </div>

          {/* Log time form */}
          <div>
            <p className="text-xs font-semibold text-[#1A1A1A] mb-3">Registra ore</p>
            <form onSubmit={handleLogTime} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Ore *</Label>
                  <Input
                    type="number"
                    min="0.25"
                    step="0.25"
                    placeholder="1.5"
                    value={logForm.hours}
                    onChange={(e) => setLogForm((f) => ({ ...f, hours: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Data</Label>
                  <Input
                    type="date"
                    value={logForm.logged_date}
                    onChange={(e) => setLogForm((f) => ({ ...f, logged_date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nota</Label>
                <Input
                  placeholder="Descrizione breve..."
                  value={logForm.note}
                  onChange={(e) => setLogForm((f) => ({ ...f, note: e.target.value }))}
                />
              </div>
              <Button type="submit" size="sm" disabled={isPending || !logForm.hours} className="w-full">
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                Registra ore
              </Button>
            </form>
          </div>

          {/* Time log history */}
          {timeLogs.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#1A1A1A] mb-2">Storico ore ({timeLogs.length})</p>
              <div className="space-y-1.5">
                {timeLogs.map((log) => {
                  const logInitials = log.user?.full_name
                    ? log.user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                    : '?'
                  return (
                    <div
                      key={log.id}
                      className="flex items-center gap-2 bg-[#F5F5F5] rounded-lg px-3 py-2"
                    >
                      <Avatar className="h-5 w-5 shrink-0">
                        <AvatarImage src={log.user?.avatar_url ?? undefined} />
                        <AvatarFallback className="text-[9px] bg-gray-400 text-white">{logInitials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#1A1A1A] font-medium">{log.hours}h</p>
                        {log.note && <p className="text-[10px] text-[#666666] truncate">{log.note}</p>}
                      </div>
                      <span className="text-[10px] text-[#666666] shrink-0">
                        {new Date(log.logged_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                      </span>
                      <button
                        onClick={() => handleDeleteLog(log)}
                        className="text-[#666666] hover:text-[#E8332A] transition-colors shrink-0"
                        disabled={isPending}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
