'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ShareButton from '@/components/ShareButton'
import { maskPhone, formatEventDateTime } from '@/lib/utils'

interface Event {
  id: string
  title: string
  description: string | null
  location: string
  event_date: string
  cover_emoji: string
  is_cancelled: boolean
  slug: string
}

interface RSVP {
  id: string
  first_name: string
  last_name: string
  phone: string
  status: 'going' | 'maybe' | 'not_going'
  created_at: string
}

type FilterTab = 'all' | 'going' | 'maybe' | 'not_going'

export default function EventManagePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [rsvps, setRsvps] = useState<RSVP[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editEmoji, setEditEmoji] = useState('')
  const [editDate, setEditDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showBlastModal, setShowBlastModal] = useState(false)
  const [blastMessage, setBlastMessage] = useState('')
  const [blastStatuses, setBlastStatuses] = useState<string[]>(['going', 'maybe'])
  const [blasting, setBlasting] = useState(false)
  const [blastResult, setBlastResult] = useState<{ sent: number; failed: number } | null>(null)

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/events/${id}`)
    if (res.status === 401) {
      router.push('/login')
      return
    }
    if (res.status === 404) {
      router.push('/dashboard')
      return
    }
    const data = await res.json()
    setEvent(data.event)
    setRsvps(data.rsvps)
    setLoading(false)
  }, [id, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function startEdit() {
    if (!event) return
    setEditTitle(event.title)
    setEditLocation(event.location)
    setEditDescription(event.description ?? '')
    setEditEmoji(event.cover_emoji)
    setEditDate(new Date(event.event_date).toISOString().slice(0, 16))
    setEditMode(true)
    setSaveError('')
  }

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    const res = await fetch(`/api/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editTitle,
        location: editLocation,
        description: editDescription || null,
        cover_emoji: editEmoji || '🎉',
        event_date: new Date(editDate).toISOString(),
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setSaveError(data.error || 'Failed to save.')
      setSaving(false)
    } else {
      setEvent(data.event)
      setEditMode(false)
      setSaving(false)
    }
  }

  async function handleBlast() {
    if (!blastMessage.trim() || blastStatuses.length === 0) return
    setBlasting(true)
    setBlastResult(null)
    const res = await fetch(`/api/events/${id}/blast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: blastMessage, statuses: blastStatuses }),
    })
    const data = await res.json()
    setBlastResult(data)
    setBlasting(false)
  }

  async function handleCancel() {
    setCancelling(true)
    const res = await fetch(`/api/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_cancelled: true }),
    })
    const data = await res.json()
    if (res.ok) {
      setEvent(data.event)
    }
    setCancelling(false)
    setShowCancelModal(false)
  }

  const filteredRsvps = filter === 'all' ? rsvps : rsvps.filter((r) => r.status === filter)

  const counts = {
    going: rsvps.filter((r) => r.status === 'going').length,
    maybe: rsvps.filter((r) => r.status === 'maybe').length,
    not_going: rsvps.filter((r) => r.status === 'not_going').length,
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/events/${event?.slug}`

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center">
        <div className="text-white/40">Loading...</div>
      </div>
    )
  }

  if (!event) return null

  return (
    <div className="min-h-screen bg-[#0d0d14]">
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-black/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
          <span className="text-white font-semibold truncate max-w-[200px]">{event.title}</span>
          <div className="flex items-center gap-2">
            {!event.is_cancelled && (
              <>
                {!editMode ? (
                  <button
                    onClick={startEdit}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    Edit
                  </button>
                ) : null}
                <button
                  onClick={() => { setShowBlastModal(true); setBlastResult(null) }}
                  className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  📣 Text Blast
                </button>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Cancel Event
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Cancelled banner */}
        {event.is_cancelled && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-4 flex items-center gap-3">
            <span className="text-red-400 text-lg">⚠️</span>
            <p className="text-red-300 font-medium">This event has been cancelled.</p>
          </div>
        )}

        {/* Event details card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          {editMode ? (
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-lg mb-2">Edit Event</h2>
              <div className="grid grid-cols-5 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs text-white/50 mb-1">Emoji</label>
                  <input
                    value={editEmoji}
                    onChange={(e) => setEditEmoji(e.target.value)}
                    maxLength={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-2xl text-center focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  />
                </div>
                <div className="col-span-4">
                  <label className="block text-xs text-white/50 mb-1">Title</label>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Date &amp; Time</label>
                <input
                  type="datetime-local"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Location</label>
                <input
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none"
                />
              </div>
              {saveError && (
                <p className="text-red-400 text-sm">{saveError}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-violet-600 hover:bg-violet-500 disabled:bg-white/10 text-white font-semibold px-5 py-2 rounded-xl transition-colors text-sm"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="bg-white/10 hover:bg-white/15 text-white px-5 py-2 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              <div className="text-4xl">{event.cover_emoji}</div>
              <div className="flex-1">
                <h1 className="text-white font-bold text-xl">{event.title}</h1>
                <p className="text-white/50 text-sm mt-1">{formatEventDateTime(event.event_date)}</p>
                <p className="text-white/40 text-sm">{event.location}</p>
                {event.description && (
                  <p className="text-white/60 text-sm mt-3 leading-relaxed">{event.description}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Share link */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">Public Link</h2>
          <div className="flex items-center gap-3">
            <code className="flex-1 text-violet-300 text-sm bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-2.5 truncate">
              {publicUrl}
            </code>
            <ShareButton
              url={publicUrl}
              label="Copy"
              className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex-shrink-0"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{counts.going}</div>
            <div className="text-green-300/70 text-xs mt-1">Going</div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{counts.maybe}</div>
            <div className="text-yellow-300/70 text-xs mt-1">Maybe</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{counts.not_going}</div>
            <div className="text-red-300/70 text-xs mt-1">Can&apos;t Go</div>
          </div>
        </div>

        {/* Guest list */}
        <div>
          <div className="flex items-center gap-1 mb-4 bg-white/5 border border-white/10 rounded-xl p-1">
            {(['all', 'going', 'maybe', 'not_going'] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`flex-1 text-sm font-medium py-2 rounded-lg transition-all ${
                  filter === tab
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {tab === 'all' ? `All (${rsvps.length})` :
                 tab === 'going' ? `Going (${counts.going})` :
                 tab === 'maybe' ? `Maybe (${counts.maybe})` :
                 `Can't Go (${counts.not_going})`}
              </button>
            ))}
          </div>

          {filteredRsvps.length === 0 ? (
            <div className="text-center py-12 text-white/30 text-sm">
              No RSVPs in this category yet.
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-xs text-white/40 font-medium px-5 py-3">Name</th>
                    <th className="text-left text-xs text-white/40 font-medium px-5 py-3 hidden sm:table-cell">Phone</th>
                    <th className="text-left text-xs text-white/40 font-medium px-5 py-3">Status</th>
                    <th className="text-left text-xs text-white/40 font-medium px-5 py-3 hidden md:table-cell">RSVP&apos;d</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRsvps.map((rsvp, i) => (
                    <tr
                      key={rsvp.id}
                      className={`${i < filteredRsvps.length - 1 ? 'border-b border-white/5' : ''} hover:bg-white/5 transition-colors`}
                    >
                      <td className="px-5 py-3.5 text-white text-sm font-medium">
                        {rsvp.first_name} {rsvp.last_name}
                      </td>
                      <td className="px-5 py-3.5 text-white/40 text-sm font-mono hidden sm:table-cell">
                        {maskPhone(rsvp.phone)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
                          rsvp.status === 'going'
                            ? 'bg-green-500/20 text-green-400'
                            : rsvp.status === 'maybe'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {rsvp.status === 'going' ? 'Going' : rsvp.status === 'maybe' ? 'Maybe' : "Can't Go"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-white/30 text-xs hidden md:table-cell">
                        {new Date(rsvp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Text blast modal */}
      {showBlastModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-white font-bold text-lg mb-1">📣 Text Blast</h2>
            <p className="text-white/40 text-sm mb-5">Send a custom SMS to your guests. Use <code className="text-violet-400">{'{name}'}</code> to personalize.</p>

            <div className="mb-4">
              <label className="block text-xs text-white/50 mb-2 font-medium uppercase tracking-wider">Send to</label>
              <div className="flex gap-2">
                {[
                  { value: 'going', label: `Going (${counts.going})`, color: 'green' },
                  { value: 'maybe', label: `Maybe (${counts.maybe})`, color: 'yellow' },
                ].map(({ value, label, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setBlastStatuses(prev =>
                      prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]
                    )}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                      blastStatuses.includes(value)
                        ? color === 'green'
                          ? 'bg-green-500/20 border-green-500 text-green-300'
                          : 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                        : 'bg-white/5 border-white/10 text-white/40'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-white/50 mb-2 font-medium uppercase tracking-wider">Message</label>
              <textarea
                value={blastMessage}
                onChange={(e) => setBlastMessage(e.target.value)}
                placeholder={`Hey {name}! Quick update about ${event.title}...`}
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none text-sm"
              />
              <p className="text-white/30 text-xs mt-1">{blastMessage.length} chars · ~{Math.ceil(blastMessage.length / 160)} SMS segment{Math.ceil(blastMessage.length / 160) !== 1 ? 's' : ''}</p>
            </div>

            {blastResult && (
              <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${blastResult.failed > 0 ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-300' : 'bg-green-500/10 border border-green-500/20 text-green-300'}`}>
                ✓ Sent {blastResult.sent} messages{blastResult.failed > 0 ? `, ${blastResult.failed} failed` : ''}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleBlast}
                disabled={blasting || !blastMessage.trim() || blastStatuses.length === 0}
                className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                {blasting ? 'Sending...' : `Send to ${rsvps.filter(r => blastStatuses.includes(r.status)).length} guests`}
              </button>
              <button
                onClick={() => { setShowBlastModal(false); setBlastMessage(''); setBlastResult(null) }}
                className="flex-1 bg-white/10 hover:bg-white/15 text-white py-3 rounded-xl transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirmation modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h2 className="text-white font-bold text-lg mb-2">Cancel this event?</h2>
            <p className="text-white/50 text-sm mb-6 leading-relaxed">
              This will mark the event as cancelled. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 bg-red-500 hover:bg-red-400 disabled:bg-red-500/50 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Event'}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-white/10 hover:bg-white/15 text-white py-3 rounded-xl transition-colors text-sm"
              >
                Keep Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
