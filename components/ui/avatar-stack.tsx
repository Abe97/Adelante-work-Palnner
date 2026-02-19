import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface AvatarItem {
  id: string
  name: string
  avatar_url?: string | null
}

interface AvatarStackProps {
  users: AvatarItem[]
  max?: number
  size?: 'sm' | 'md'
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

export function AvatarStack({ users, max = 4, size = 'sm' }: AvatarStackProps) {
  const visible = users.slice(0, max)
  const overflow = users.length - max

  const sizeClass = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-8 w-8 text-xs'

  return (
    <div className="flex items-center">
      {visible.map((user, i) => (
        <Avatar
          key={user.id}
          className={cn(
            sizeClass,
            'border-2 border-white ring-0',
            i > 0 && '-ml-2'
          )}
        >
          {user.avatar_url && (
            <AvatarImage src={user.avatar_url} alt={user.name} />
          )}
          <AvatarFallback className="bg-[#E8332A] text-white font-semibold">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            sizeClass,
            '-ml-2 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-600 font-semibold'
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}
