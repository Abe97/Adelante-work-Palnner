'use client'

import { useState, useMemo } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ClientCard } from './client-card'
import { NewClientDialog } from './new-client-dialog'
import { PageHeader } from '@/components/ui/page-header'
import type { Client } from '@/lib/database.types'

const SECTORS = ['Costruzioni', 'Education', 'E-commerce', 'Hospitality', 'Altro']

interface ClientWithProjects extends Client {
  activeProjects: number
}

interface ClientsViewProps {
  clients: ClientWithProjects[]
  isAdmin: boolean
}

export function ClientsView({ clients, isAdmin }: ClientsViewProps) {
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState<string>('all')
  const [showArchived, setShowArchived] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      if (!showArchived && c.is_archived) return false
      if (showArchived && !c.is_archived) return false
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
      if (sector && sector !== 'all' && c.sector !== sector) return false
      return true
    })
  }, [clients, search, sector, showArchived])

  return (
    <div>
      <PageHeader
        title="Clienti"
        subtitle={`${clients.filter((c) => !c.is_archived).length} clienti attivi`}
        action={
          isAdmin ? (
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-[#E8332A] hover:bg-[#c9271f] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuovo cliente
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" />
          <Input
            placeholder="Cerca cliente…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-gray-200"
          />
        </div>
        <Select value={sector} onValueChange={setSector}>
          <SelectTrigger className="w-full sm:w-44 bg-white border-gray-200">
            <SelectValue placeholder="Tutti i settori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i settori</SelectItem>
            {SECTORS.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={showArchived ? 'default' : 'outline'}
          onClick={() => setShowArchived(!showArchived)}
          className={showArchived
            ? 'bg-[#1A1A1A] text-white hover:bg-[#2A2A2A]'
            : 'bg-white border-gray-200 text-[#666666]'}
        >
          {showArchived ? 'Attivi' : 'Archiviati'}
        </Button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#666666]">
            {search || sector !== 'all'
              ? 'Nessun cliente trovato con i filtri selezionati.'
              : showArchived
              ? 'Nessun cliente archiviato.'
              : 'Nessun cliente. Creane uno nuovo!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}

      <NewClientDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
