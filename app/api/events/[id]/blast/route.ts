import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { twilioClient, TWILIO_PHONE_NUMBER } from '@/lib/twilio'

async function getSessionUser() {
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

// POST /api/events/[id]/blast — send a custom SMS to all going/maybe RSVPs
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { message, statuses } = await request.json()

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Verify event belongs to this host
  const { data: event } = await supabase
    .from('events')
    .select('id, title')
    .eq('id', id)
    .eq('host_id', user.id)
    .single()

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const targetStatuses: string[] = statuses ?? ['going', 'maybe']

  const { data: rsvps } = await supabase
    .from('rsvps')
    .select('id, first_name, phone')
    .eq('event_id', id)
    .in('status', targetStatuses)

  if (!rsvps || rsvps.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0 })
  }

  let sent = 0
  let failed = 0

  for (const rsvp of rsvps) {
    try {
      const personalizedMessage = message.replace(/\{name\}/gi, rsvp.first_name)
      await twilioClient.messages.create({
        body: personalizedMessage,
        from: TWILIO_PHONE_NUMBER,
        to: rsvp.phone,
      })
      sent++
    } catch (err) {
      console.error(`Failed to send to ${rsvp.phone}:`, err)
      failed++
    }
  }

  return NextResponse.json({ sent, failed })
}
