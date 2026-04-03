import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import Link from 'next/link'
import EventCard from '@/components/EventCard'
import Navbar from '@/components/Navbar'

async function getUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

async function getEvents(userId: string) {
  const { createServiceClient } = await import('@/lib/supabase/server')
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('events')
    .select('*, rsvps(count)')
    .eq('host_id', userId)
    .order('event_date', { ascending: true })
  return data ?? []
}

export default async function DashboardPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const events = await getEvents(user.id)

  return (
    <div className="min-h-screen bg-[#0d0d14]">
      <Navbar user={user} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Your Events</h1>
            <p className="text-white/40 text-sm mt-1">{user.email}</p>
          </div>
          <Link
            href="/dashboard/create"
            className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            + Create Event
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-white font-semibold text-lg mb-2">No events yet</h2>
            <p className="text-white/40 text-sm mb-6">Create your first event and start gathering!</p>
            <Link
              href="/dashboard/create"
              className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Create an Event
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
