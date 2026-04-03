import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { twilioClient, TWILIO_PHONE_NUMBER } from '@/lib/twilio'
import { formatEventTime } from '@/lib/utils'

export async function GET(request: NextRequest) {
  // Validate cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Calculate tomorrow's window in UTC
  const now = new Date()
  const tomorrowStart = new Date(now)
  tomorrowStart.setUTCDate(now.getUTCDate() + 1)
  tomorrowStart.setUTCHours(0, 0, 0, 0)

  const tomorrowEnd = new Date(tomorrowStart)
  tomorrowEnd.setUTCHours(23, 59, 59, 999)

  // Find events happening tomorrow that aren't cancelled
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .eq('is_cancelled', false)
    .gte('event_date', tomorrowStart.toISOString())
    .lte('event_date', tomorrowEnd.toISOString())

  if (eventsError) {
    console.error('Error fetching events:', eventsError)
    return NextResponse.json({ error: eventsError.message }, { status: 500 })
  }

  let totalSent = 0
  let totalFailed = 0
  const eventsProcessed = events?.length ?? 0

  for (const event of events ?? []) {
    // Get RSVPs that haven't been reminded yet
    const { data: rsvps, error: rsvpsError } = await supabase
      .from('rsvps')
      .select('*')
      .eq('event_id', event.id)
      .in('status', ['going', 'maybe'])
      .eq('reminder_sent', false)

    if (rsvpsError) {
      console.error(`Error fetching rsvps for event ${event.id}:`, rsvpsError)
      continue
    }

    const formattedTime = formatEventTime(event.event_date)

    for (const rsvp of rsvps ?? []) {
      try {
        await twilioClient.messages.create({
          body: `Hey ${rsvp.first_name}! Just a reminder that ${event.title} is tomorrow at ${formattedTime} at ${event.location}. See you there! 🎉`,
          from: TWILIO_PHONE_NUMBER,
          to: rsvp.phone,
        })

        // Mark reminder as sent
        await supabase
          .from('rsvps')
          .update({ reminder_sent: true })
          .eq('id', rsvp.id)

        console.log(`Reminder sent to ${rsvp.first_name} (${rsvp.phone}) for event "${event.title}"`)
        totalSent++
      } catch (err) {
        console.error(`Failed to send reminder to ${rsvp.phone}:`, err)
        totalFailed++
      }
    }
  }

  return NextResponse.json({
    sent: totalSent,
    failed: totalFailed,
    events_processed: eventsProcessed,
  })
}
