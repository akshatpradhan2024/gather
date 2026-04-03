const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function generateSlug(length = 8): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return result
}

export function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatEventTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatEventDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }) + ' at ' + date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `***-***-${digits.slice(-4)}`
}

export function formatGuestName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName.charAt(0)}.`
}

export function validateUSPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  return digits.length === 10 || (digits.length === 11 && digits[0] === '1')
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits[0] === '1') {
    return `+${digits}`
  }
  if (digits.length === 10) {
    return `+1${digits}`
  }
  return phone
}
