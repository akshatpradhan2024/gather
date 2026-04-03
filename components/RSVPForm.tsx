'use client'

import { useState } from 'react'
import { validateUSPhone } from '@/lib/utils'

interface RSVPFormProps {
  eventId: string
}

type RSVPStatus = 'going' | 'maybe' | 'not_going'

export default function RSVPForm({ eventId }: RSVPFormProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<RSVPStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !status) {
      setError('Please fill in all fields and select an RSVP status.')
      return
    }

    if (!validateUSPhone(phone)) {
      setError('Please enter a valid US phone number.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          first_name: firstName,
          last_name: lastName,
          phone,
          status,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="text-white font-bold text-xl mb-2">You&apos;re in!</h3>
        <p className="text-white/60">
          {status === 'going'
            ? "You're going — see you there!"
            : status === 'maybe'
            ? "You're marked as maybe — hope you can make it!"
            : "Got it — you won't be able to make it. No worries!"}
        </p>
        <button
          onClick={() => {
            setSuccess(false)
            setFirstName('')
            setLastName('')
            setPhone('')
            setStatus(null)
          }}
          className="mt-4 text-sm text-white/40 hover:text-white/70 transition-colors underline"
        >
          Update my RSVP
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">
            First Name
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Alex"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">
            Last Name
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Johnson"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-1.5">
          Phone Number
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 123-4567"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
          required
        />
        <p className="text-white/30 text-xs mt-1">Used for event reminders only.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-3">
          Are you going?
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setStatus('going')}
            className={`py-4 rounded-xl font-semibold text-sm transition-all duration-150 border-2 ${
              status === 'going'
                ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30 scale-105'
                : 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20 hover:border-green-500/50'
            }`}
          >
            Going
          </button>
          <button
            type="button"
            onClick={() => setStatus('maybe')}
            className={`py-4 rounded-xl font-semibold text-sm transition-all duration-150 border-2 ${
              status === 'maybe'
                ? 'bg-yellow-500 border-yellow-500 text-white shadow-lg shadow-yellow-500/30 scale-105'
                : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-500/50'
            }`}
          >
            Maybe
          </button>
          <button
            type="button"
            onClick={() => setStatus('not_going')}
            className={`py-4 rounded-xl font-semibold text-sm transition-all duration-150 border-2 ${
              status === 'not_going'
                ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30 scale-105'
                : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50'
            }`}
          >
            Can&apos;t Go
          </button>
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !status}
        className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold py-4 rounded-xl transition-all duration-150 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving...' : 'RSVP'}
      </button>
    </form>
  )
}
