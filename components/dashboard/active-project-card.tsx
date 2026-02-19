import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ProjectStatusBadge } from '@/components/ui/status-badge'
import type { Project, Client } from '@/lib/database.types'

interface ActiveProjectCardProps {
  project: Project & {
    client: Pick<Client, 'name'> | null
    totalTasks: number
    doneTasks: number
  }
}

export function ActiveProjectCard({ project }: ActiveProjectCardProps) {
  const pct =
    project.totalTasks > 0
      ? Math.round((project.doneTasks / project.totalTasks) * 100)
      : 0

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-5 flex flex-col gap-3 h-full">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-[#1A1A1A] truncate">{project.name}</p>
              {project.client && (
                <p className="text-xs text-[#666666] mt-0.5 truncate">
                  {project.client.name}
                </p>
              )}
            </div>
            <ProjectStatusBadge status={project.status} />
          </div>

          <div className="mt-auto space-y-1.5">
            <div className="flex justify-between text-xs text-[#666666]">
              <span>Completamento</span>
              <span className="font-medium text-[#1A1A1A]">{pct}%</span>
            </div>
            <Progress
              value={pct}
              className="h-1.5 bg-gray-100"
            />
            <p className="text-xs text-[#666666]">
              {project.doneTasks}/{project.totalTasks} task completate
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
