'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

interface NewProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId?: string
}

const STATUSES = [
  { value: 'active', label: 'In corso' },
  { value: 'on_hold', label: 'In attesa' },
  { value: 'completed', label: 'Completato' },
]

const defaultForm = {
  name: '',
  description: '',
  status: 'active',
  start_date: '',
  end_date: '',
}

export function NewProjectDialog({ open, onOpenChange, clientId }: NewProjectDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(defaultForm)

  function reset() { setForm(defaultForm) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('projects') as any).insert({
      name: form.name.trim(),
      description: form.description.trim() || null,
      status: form.status,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      client_id: clientId ?? null,
      created_by: user?.id ?? null,
    })

    setLoading(false)
    if (error) { toast.error('Errore nella creazione del progetto'); return }

    toast.success(`Progetto "${form.name}" creato`)
    reset()
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuovo progetto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input
              placeholder="Nome progetto"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Descrizione</Label>
            <Textarea
              rows={2}
              placeholder="Descrizione del progetto..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Data inizio</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Data fine</Label>
              <Input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { onOpenChange(false); reset() }} disabled={loading}>
              Annulla
            </Button>
            <Button type="submit" disabled={loading || !form.name.trim()} className="bg-[#E8332A] hover:bg-[#c9271f] text-white">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvataggio…</> : <><Plus className="h-4 w-4 mr-2" />Crea progetto</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
