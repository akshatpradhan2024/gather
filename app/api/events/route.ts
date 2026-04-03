import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/client'
import { generateSlug } from '@/lib/utils'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getSessionUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// GET /api/events — list events for authenticated host
export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const { data: events, error } = await supabase
    .from('events')
    .select('*, rsvps(count)')
    .eq('host_id', user.id)
    .order('event_date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ events })
}

// POST /api/events — create a new event
export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { title, description, location, event_date, cover_emoji } = body

  if (!title || !location || !event_date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Generate unique slug
  let slug = generateSlug()
  let attempts = 0
  while (attempts < 5) {
    const { data: existing } = await supabase
      .from('events')
      .select('id')
      .eq('slug', slug)
      .single()
    if (!existing) break
    slug = generateSlug()
    attempts++
  }

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      host_id: user.id,
      slug,
      title,
      description: description || null,
      location,
      event_date,
      cover_emoji: cover_emoji || '🎉',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ event }, { status: 201 })
}
