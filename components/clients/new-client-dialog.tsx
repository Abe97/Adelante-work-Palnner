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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

const SECTORS = [
  'Costruzioni',
  'Education',
  'E-commerce',
  'Hospitality',
  'Altro',
]

interface NewClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewClientDialog({ open, onOpenChange }: NewClientDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    sector: '',
    notes: '',
  })

  function reset() {
    setForm({ name: '', sector: '', notes: '' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return

    setLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('clients') as any).insert({
      name: form.name.trim(),
      sector: form.sector || null,
      notes: form.notes.trim() || null,
      created_by: user?.id ?? null,
    })

    setLoading(false)

    if (error) {
      toast.error('Errore nella creazione del cliente')
      return
    }

    toast.success(`Cliente "${form.name}" creato con successo`)
    reset()
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuovo cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="client-name">Nome *</Label>
            <Input
              id="client-name"
              placeholder="Nome cliente"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-sector">Settore</Label>
            <Select
              value={form.sector}
              onValueChange={(v) => setForm({ ...form, sector: v })}
            >
              <SelectTrigger id="client-sector">
                <SelectValue placeholder="Seleziona settore" />
              </SelectTrigger>
              <SelectContent>
                {SECTORS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-notes">Note</Label>
            <Textarea
              id="client-notes"
              placeholder="Note aggiuntive..."
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => { onOpenChange(false); reset() }}
              disabled={loading}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={loading || !form.name.trim()}
              className="bg-[#E8332A] hover:bg-[#c9271f] text-white"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvataggio…</>
              ) : (
                <><Plus className="h-4 w-4 mr-2" />Crea cliente</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
