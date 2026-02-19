import Link from 'next/link'
import { Building2, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Client } from '@/lib/database.types'

interface ClientCardProps {
  client: Client & { activeProjects: number }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function ClientCard({ client }: ClientCardProps) {
  return (
    <Link href={`/clients/${client.id}`}>
      <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group h-full">
        <CardContent className="p-5 flex flex-col gap-3 h-full">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-gray-100 text-[#666666] group-hover:bg-[#E8332A]/10 group-hover:text-[#E8332A] transition-colors shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-[#1A1A1A] truncate group-hover:text-[#E8332A] transition-colors">
                {client.name}
              </h3>
              {client.sector && (
                <Badge
                  variant="outline"
                  className="text-xs mt-1 border-gray-200 text-[#666666]"
                >
                  {client.sector}
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-[#666666]">
            <span className="font-medium">
              {client.activeProjects}{' '}
              {client.activeProjects === 1 ? 'progetto attivo' : 'progetti attivi'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(client.created_at)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
