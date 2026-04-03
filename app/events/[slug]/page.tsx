import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import RSVPForm from '@/components/RSVPForm'
import GuestList from '@/components/GuestList'
import ShareButton from '@/components/ShareButton'
import { formatEventDateTime } from '@/lib/utils'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function PublicEventPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!event) notFound()

  const { data: rsvps } = await supabase
    .from('rsvps')
    .select('id, first_name, last_name, status')
    .eq('event_id', event.id)
    .in('status', ['going', 'maybe'])
    .order('created_at', { ascending: true })

  const goingCount = rsvps?.filter((r) => r.status === 'going').length ?? 0
  const publicUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/events/${slug}`

  return (
    <div className="min-h-screen bg-[#0d0d14]">
      {/* Decorative gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <main className="relative max-w-lg mx-auto px-4 py-10 sm:py-16">
        {/* Event hero */}
        <div className="text-center mb-10">
          <div className="text-7xl mb-5 drop-shadow-lg">{event.cover_emoji}</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
            {event.title}
          </h1>

          <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-white/60 text-sm bg-white/5 border border-white/10 rounded-2xl px-5 py-4 mb-5">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatEventDateTime(event.event_date)}
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {event.location}
            </span>
          </div>

          {event.description && (
            <p className="text-white/60 leading-relaxed max-w-md mx-auto text-sm sm:text-base">
              {event.description}
            </p>
          )}
        </div>

        {event.is_cancelled ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center mb-8">
            <div className="text-3xl mb-3">😔</div>
            <h2 className="text-red-300 font-bold text-lg mb-2">This event has been cancelled</h2>
            <p className="text-red-300/60 text-sm">
              Sorry, the host has cancelled this event. Check back for future events!
            </p>
          </div>
        ) : (
          <>
            {/* Guest count + list */}
            {goingCount > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
                <p className="text-white/70 text-sm font-medium mb-3">
                  {goingCount} {goingCount === 1 ? 'person is' : 'people are'} going
                </p>
                <GuestList rsvps={rsvps ?? []} />
              </div>
            )}

            {/* RSVP form */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
              <h2 className="text-white font-bold text-lg mb-5">RSVP</h2>
              <RSVPForm eventId={event.id} />
            </div>
          </>
        )}

        {/* Share */}
        <div className="flex items-center justify-center gap-3">
          <ShareButton
            url={publicUrl}
            label="Share this event"
            className="text-white/50 hover:text-white text-sm bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl"
          />
        </div>
      </main>
    </div>
  )
}
