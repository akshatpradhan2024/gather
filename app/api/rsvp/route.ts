import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { validateUSPhone, normalizePhone } from '@/lib/utils'

// POST /api/rsvp — create or update an RSVP
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { event_id, first_name, last_name, phone, status } = body

  if (!event_id || !first_name || !last_name || !phone || !status) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!['going', 'maybe', 'not_going'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  if (!validateUSPhone(phone)) {
    return NextResponse.json({ error: 'Invalid US phone number' }, { status: 400 })
  }

  const normalizedPhone = normalizePhone(phone)
  const supabase = createServiceClient()

  // Verify event exists and is not cancelled
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, is_cancelled')
    .eq('id', event_id)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  if (event.is_cancelled) {
    return NextResponse.json({ error: 'This event has been cancelled' }, { status: 400 })
  }

  const { data: rsvp, error } = await supabase
    .from('rsvps')
    .upsert(
      {
        event_id,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        phone: normalizedPhone,
        status,
      },
      {
        onConflict: 'event_id,phone',
        ignoreDuplicates: false,
      }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ rsvp }, { status: 200 })
}
