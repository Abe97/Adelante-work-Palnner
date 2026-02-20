'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, FolderKanban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/ui/page-header'
import { ProjectCard } from './project-card'
import { NewProjectDialog } from './new-project-dialog'
import type { Project, Client, Profile } from '@/lib/database.types'

interface ProjectWithDetails extends Project {
  client: Pick<Client, 'name'> | null
  members: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>[]
  totalTasks: number
  doneTasks: number
}

interface ClientOption {
  id: string
  name: string
}

interface ProjectsViewProps {
  projects: ProjectWithDetails[]
  clients: ClientOption[]
  isAdmin: boolean
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tutti gli status' },
  { value: 'active', label: 'In corso' },
  { value: 'on_hold', label: 'In attesa' },
  { value: 'completed', label: 'Completato' },
  { value: 'archived', label: 'Archiviato' },
]

export function ProjectsView({ projects, clients, isAdmin }: ProjectsViewProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (clientFilter !== 'all' && p.client_id !== clientFilter) return false
      return true
    })
  }, [projects, search, statusFilter, clientFilter])

  return (
    <div>
      <PageHeader
        title="Progetti"
        subtitle={`${projects.filter((p) => p.status === 'active').length} progetti in corso`}
        action={
          isAdmin ? (
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-[#E8332A] hover:bg-[#c9271f] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuovo progetto
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" />
          <Input
            placeholder="Cerca progetto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-gray-200"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44 bg-white border-gray-200">
            <SelectValue placeholder="Tutti gli status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {clients.length > 0 && (
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-white border-gray-200">
              <SelectValue placeholder="Tutti i clienti" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i clienti</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderKanban className="h-12 w-12 text-gray-200 mb-4" />
          <p className="text-sm font-medium text-[#1A1A1A] mb-1">
            {search || statusFilter !== 'all' || clientFilter !== 'all'
              ? 'Nessun progetto trovato'
              : 'Ancora nessun progetto'}
          </p>
          <p className="text-xs text-[#666666]">
            {search || statusFilter !== 'all' || clientFilter !== 'all'
              ? 'Prova a modificare i filtri di ricerca'
              : isAdmin
              ? 'Crea il tuo primo progetto per iniziare'
              : 'I progetti assegnati a te appariranno qui'}
          </p>
          {!search && statusFilter === 'all' && clientFilter === 'all' && isAdmin && (
            <Button
              onClick={() => setDialogOpen(true)}
              className="mt-4 bg-[#E8332A] hover:bg-[#c9271f] text-white"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Nuovo progetto
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <NewProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
