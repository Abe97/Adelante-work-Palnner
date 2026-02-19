import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ProjectStatusBadge } from '@/components/ui/status-badge'
import { AvatarStack } from '@/components/ui/avatar-stack'
import type { Project, Client, Profile } from '@/lib/database.types'

interface ProjectCardProps {
  project: Project & {
    client: Pick<Client, 'name'> | null
    members: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>[]
    totalTasks: number
    doneTasks: number
  }
}

export function ProjectCard({ project }: ProjectCardProps) {
  const pct =
    project.totalTasks > 0
      ? Math.round((project.doneTasks / project.totalTasks) * 100)
      : 0

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group h-full">
        <CardContent className="p-5 flex flex-col gap-4 h-full">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-[#1A1A1A] truncate group-hover:text-[#E8332A] transition-colors">
                {project.name}
              </h3>
              {project.client && (
                <p className="text-xs text-[#666666] mt-0.5 truncate">{project.client.name}</p>
              )}
            </div>
            <ProjectStatusBadge status={project.status} />
          </div>

          {/* Footer */}
          <div className="mt-auto space-y-3">
            {/* Progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-[#666666]">
                <span>{project.doneTasks}/{project.totalTasks} task</span>
                <span className="font-medium text-[#1A1A1A]">{pct}%</span>
              </div>
              <Progress value={pct} className="h-1.5 bg-gray-100" />
            </div>

            {/* Team */}
            {project.members.length > 0 && (
              <AvatarStack
                users={project.members.map((m) => ({
                  id: m.id,
                  name: m.full_name,
                  avatar_url: m.avatar_url,
                }))}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
