'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Archive, ArchiveRestore, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { EditClientDialog } from './edit-client-dialog'
import { NewProjectDialog } from '@/components/projects/new-project-dialog'
import { ProjectCard } from '@/components/projects/project-card'
import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import type { Client, Project, Profile } from '@/lib/database.types'

interface ProjectWithDetails extends Project {
  client: Pick<Client, 'name'> | null
  members: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>[]
  totalTasks: number
  doneTasks: number
}

interface ClientDetailViewProps {
  client: Client
  projects: ProjectWithDetails[]
  isAdmin: boolean
}

export function ClientDetailView({ client, projects, isAdmin }: ClientDetailViewProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [archiveConfirm, setArchiveConfirm] = useState(false)
  const [archiving, setArchiving] = useState(false)

  async function handleArchive() {
    setArchiving(true)
    const supabase = createSupabaseClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('clients') as any)
      .update({ is_archived: !client.is_archived })
      .eq('id', client.id)

    setArchiving(false)
    setArchiveConfirm(false)
    if (error) { toast.error('Errore'); return }
    toast.success(client.is_archived ? 'Cliente ripristinato' : 'Cliente archiviato')
    router.refresh()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-[#1A1A1A]">{client.name}</h1>
            {client.sector && (
              <Badge variant="outline" className="border-gray-200 text-[#666666]">
                {client.sector}
              </Badge>
            )}
            {client.is_archived && (
              <Badge variant="outline" className="border-gray-200 text-gray-400">
                Archiviato
              </Badge>
            )}
          </div>
          {client.notes && (
            <p className="mt-1 text-sm text-[#666666] max-w-xl">{client.notes}</p>
          )}
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
              className="border-gray-200"
            >
              <Pencil className="h-4 w-4 mr-1.5" />
              Modifica
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setArchiveConfirm(true)}
              className="border-gray-200 text-[#666666] hover:text-[#E8332A]"
            >
              {client.is_archived ? (
                <><ArchiveRestore className="h-4 w-4 mr-1.5" />Ripristina</>
              ) : (
                <><Archive className="h-4 w-4 mr-1.5" />Archivia</>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Projects section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-[#1A1A1A]">
          Progetti ({projects.length})
        </h2>
        {isAdmin && (
          <Button
            size="sm"
            onClick={() => setNewProjectOpen(true)}
            className="bg-[#E8332A] hover:bg-[#c9271f] text-white"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nuovo progetto
          </Button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 text-[#666666] text-sm">
          Nessun progetto per questo cliente.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <EditClientDialog client={client} open={editOpen} onOpenChange={setEditOpen} />

      {/* New project dialog */}
      <NewProjectDialog
        open={newProjectOpen}
        onOpenChange={setNewProjectOpen}
        clientId={client.id}
      />

      {/* Archive confirm dialog */}
      <Dialog open={archiveConfirm} onOpenChange={setArchiveConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {client.is_archived ? 'Ripristina cliente' : 'Archivia cliente'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#666666]">
            {client.is_archived
              ? `Vuoi ripristinare "${client.name}"?`
              : `Sei sicuro di voler archiviare "${client.name}"? Sarà nascosto dalla lista principale.`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveConfirm(false)} disabled={archiving}>
              Annulla
            </Button>
            <Button
              onClick={handleArchive}
              disabled={archiving}
              className={client.is_archived
                ? 'bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white'
                : 'bg-[#E8332A] hover:bg-[#c9271f] text-white'}
            >
              {client.is_archived ? 'Ripristina' : 'Archivia'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
