'use client'

import { formatDate, formatTime } from '@/lib/utils'

const mockBookings = [
  {
    id: '1',
    client_name: 'Marcus Williams',
    service: 'Haircut + Beard',
    start_time: new Date().toISOString(),
    status: 'confirmed',
    barber: 'Jay',
  },
  {
    id: '2',
    client_name: 'Darius Freeman',
    service: 'Skin Fade',
    start_time: new Date().toISOString(),
    status: 'pending',
    barber: 'Sam',
  },
]

const statusColors: Record<string, string> = {
  confirmed: 'bg-green-500/10 text-green-400',
  pending: 'bg-yellow-500/10 text-yellow-400',
  completed: 'bg-zinc-500/10 text-zinc-400',
  cancelled: 'bg-red-500/10 text-red-400',
}

export function BookingTable() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left px-4 py-3 text-zinc-400 font-medium">Client</th>
            <th className="text-left px-4 py-3 text-zinc-400 font-medium">Service</th>
            <th className="text-left px-4 py-3 text-zinc-400 font-medium">Date</th>
            <th className="text-left px-4 py-3 text-zinc-400 font-medium">Time</th>
            <th className="text-left px-4 py-3 text-zinc-400 font-medium">Barber</th>
            <th className="text-left px-4 py-3 text-zinc-400 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {mockBookings.map((booking) => (
            <tr key={booking.id} className="hover:bg-zinc-800/50 transition-colors">
              <td className="px-4 py-3 font-medium text-white">{booking.client_name}</td>
              <td className="px-4 py-3 text-zinc-300">{booking.service}</td>
              <td className="px-4 py-3 text-zinc-400">{formatDate(booking.start_time)}</td>
              <td className="px-4 py-3 text-zinc-400">{formatTime(booking.start_time)}</td>
              <td className="px-4 py-3 text-zinc-300">{booking.barber}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColors[booking.status]}`}>
                  {booking.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
