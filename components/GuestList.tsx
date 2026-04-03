import { formatGuestName } from '@/lib/utils'

interface RSVP {
  id: string
  first_name: string
  last_name: string
  status: 'going' | 'maybe' | 'not_going'
}

interface GuestListProps {
  rsvps: RSVP[]
}

export default function GuestList({ rsvps }: GuestListProps) {
  const going = rsvps.filter((r) => r.status === 'going')
  const maybe = rsvps.filter((r) => r.status === 'maybe')

  const guests = [...going, ...maybe]

  if (guests.length === 0) {
    return (
      <p className="text-white/40 text-sm text-center py-4">
        No RSVPs yet — be the first!
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {going.map((r) => (
        <span
          key={r.id}
          className="inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-300 text-sm px-3 py-1.5 rounded-full"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
          {formatGuestName(r.first_name, r.last_name)}
        </span>
      ))}
      {maybe.map((r) => (
        <span
          key={r.id}
          className="inline-flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm px-3 py-1.5 rounded-full"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" />
          {formatGuestName(r.first_name, r.last_name)}
        </span>
      ))}
    </div>
  )
}
