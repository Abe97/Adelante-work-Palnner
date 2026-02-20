'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Profile, TaskPriority, TaskStatus } from '@/lib/database.types'
import { createTask } from '@/lib/actions/tasks'

interface NewTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  defaultStatus?: TaskStatus
  members: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>[]
  onCreated: () => void
}

export function NewTaskDialog({
  open,
  onOpenChange,
  projectId,
  defaultStatus = 'todo',
  members,
  onCreated,
}: NewTaskDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium' as TaskPriority,
    status: defaultStatus,
    due_date: '',
    estimated_hours: '',
  })

  // Sync defaultStatus when it changes
  if (form.status !== defaultStatus && !isPending) {
    setForm((f) => ({ ...f, status: defaultStatus }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return

    startTransition(async () => {
      const result = await createTask({
        title: form.title.trim(),
        description: form.description.trim() || null,
        project_id: projectId,
        assigned_to: form.assigned_to || null,
        priority: form.priority,
        status: form.status,
        due_date: form.due_date || null,
        estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : 0,
      })

      if (result?.error) {
        toast.error('Errore nella creazione della task')
      } else {
        toast.success('Task creata!')
        setForm({
          title: '',
          description: '',
          assigned_to: '',
          priority: 'medium',
          status: defaultStatus,
          due_date: '',
          estimated_hours: '',
        })
        onOpenChange(false)
        onCreated()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuova Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Titolo *</Label>
            <Input
              id="task-title"
              placeholder="Descrivi la task..."
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="task-desc">Descrizione</Label>
            <Textarea
              id="task-desc"
              placeholder="Dettagli opzionali..."
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* Assignee + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Assegnata a</Label>
              <Select
                value={form.assigned_to}
                onValueChange={(v) => setForm((f) => ({ ...f, assigned_to: v === '__none__' ? '' : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nessuno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nessuno</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Priorità</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm((f) => ({ ...f, priority: v as TaskPriority }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Bassa</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Stato</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm((f) => ({ ...f, status: v as TaskStatus }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">Da fare</SelectItem>
                <SelectItem value="in_progress">In corso</SelectItem>
                <SelectItem value="in_review">In revisione</SelectItem>
                <SelectItem value="done">Completato</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Due date + Estimated hours row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-due">Scadenza</Label>
              <Input
                id="task-due"
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-hours">Ore stimate</Label>
              <Input
                id="task-hours"
                type="number"
                min="0"
                step="0.5"
                placeholder="0"
                value={form.estimated_hours}
                onChange={(e) => setForm((f) => ({ ...f, estimated_hours: e.target.value }))}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={isPending || !form.title.trim()}>
              {isPending ? 'Creazione...' : 'Crea Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
