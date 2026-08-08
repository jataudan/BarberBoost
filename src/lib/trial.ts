/**
 * Normalises an email address for trial-abuse detection: lowercases, strips
 * a `+suffix` (widely supported across providers), and — for Gmail/Googlemail
 * addresses only, since dots are NOT ignored by other providers — strips dots
 * from the local part. No prior helper for this existed in the codebase.
 */
export function normaliseEmailForAbuseCheck(email: string): string {
  const trimmed = email.trim().toLowerCase()
  const atIndex = trimmed.lastIndexOf('@')
  if (atIndex === -1) return trimmed

  let local  = trimmed.slice(0, atIndex)
  const domain = trimmed.slice(atIndex + 1)

  const plusIndex = local.indexOf('+')
  if (plusIndex !== -1) local = local.slice(0, plusIndex)

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    local = local.replace(/\./g, '')
  }

  return `${local}@${domain}`
}
