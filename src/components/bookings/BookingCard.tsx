import { formatDate, formatTime } from '@/lib/utils'
import { Calendar, Clock, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookingCardProps {
  clientName: string
  service: string
  startTime: string
  barber?: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
}

const statusColors = {
  confirmed: 'border-l-green-500',
  pending: 'border-l-yellow-500',
  completed: 'border-l-zinc-500',
  cancelled: 'border-l-red-500',
}

export function BookingCard({ clientName, service, startTime, barber, status }: BookingCardProps) {
  return (
    <div className={cn('bg-zinc-900 border border-zinc-800 border-l-4 rounded-xl p-4 space-y-2', statusColors[status])}>
      <div className="flex items-center justify-between">
        <p className="font-semibold text-white">{clientName}</p>
        <span className="text-xs text-zinc-400 capitalize">{status}</span>
      </div>
      <p className="text-sm text-zinc-300">{service}</p>
      <div className="flex items-center gap-4 text-xs text-zinc-400">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" /> {formatDate(startTime)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {formatTime(startTime)}
        </span>
        {barber && (
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" /> {barber}
          </span>
        )}
      </div>
    </div>
  )
}
