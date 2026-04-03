import Link from 'next/link'
import { formatEventDate, formatEventTime } from '@/lib/utils'

interface Event {
  id: string
  title: string
  event_date: string
  location: string
  cover_emoji: string
  is_cancelled: boolean
  slug: string
  rsvps?: { count: number }[]
}

interface EventCardProps {
  event: Event
}

export default function EventCard({ event }: EventCardProps) {
  const rsvpCount = event.rsvps?.[0]?.count ?? 0

  return (
    <Link href={`/dashboard/events/${event.id}`}>
      <div className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all duration-200 cursor-pointer">
        {event.is_cancelled && (
          <span className="absolute top-4 right-4 text-xs font-semibold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">
            Cancelled
          </span>
        )}
        <div className="flex items-start gap-4">
          <div className="text-3xl flex-shrink-0">{event.cover_emoji}</div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-lg leading-tight truncate pr-20">
              {event.title}
            </h3>
            <p className="text-white/50 text-sm mt-1">
              {formatEventDate(event.event_date)} at {formatEventTime(event.event_date)}
            </p>
            <p className="text-white/40 text-sm truncate">{event.location}</p>
            <p className="text-violet-400 text-sm mt-2 font-medium">
              {rsvpCount} {rsvpCount === 1 ? 'RSVP' : 'RSVPs'}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}
