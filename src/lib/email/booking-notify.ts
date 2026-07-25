/**
 * Shared resolution of who should receive a barber-facing booking alert.
 *
 * The preferred recipient is the individual barber; the shop owner's login
 * email is added as a delivery backstop (deduped, and skipped when the barber
 * *is* the owner) so an alert is never silently lost when a barber's mailbox is
 * missing, filtered, or suppressed. Staff contact details are read with the
 * service-role client so alerts fire regardless of RLS context.
 */
import type { createServiceClient } from '@/lib/supabase/server'

type ServiceClient = Awaited<ReturnType<typeof createServiceClient>>

export interface AlertRecipient {
  email: string
  role:  'barber' | 'owner'
}

export interface BarberAlertContacts {
  recipients: AlertRecipient[]
  staffEmail: string | null
  staffPhone: string | null
}

export async function resolveBarberAlertRecipients(
  serviceSupabase: ServiceClient,
  ownerId: string,
  staffId: string,
  logPrefix = '[booking-notify]',
): Promise<BarberAlertContacts> {
  const { data: staffContact } = await serviceSupabase
    .from('staff')
    .select('email, phone')
    .eq('id', staffId)
    .single()

  const staffEmail = staffContact?.email?.trim() || null
  const staffPhone = staffContact?.phone?.trim() || null

  let ownerEmail: string | null = null
  const { data: ownerData, error: ownerErr } = await serviceSupabase.auth.admin.getUserById(ownerId)
  if (ownerErr) console.error(`${logPrefix} owner lookup error:`, ownerErr.message)
  ownerEmail = ownerData?.user?.email?.trim() || null

  const recipients: AlertRecipient[] = []
  if (staffEmail) recipients.push({ email: staffEmail, role: 'barber' })
  if (ownerEmail && ownerEmail.toLowerCase() !== staffEmail?.toLowerCase()) {
    recipients.push({ email: ownerEmail, role: 'owner' })
  }
  if (!staffEmail) {
    console.warn(`${logPrefix} staff ${staffId} has no email — booking alert goes to the shop owner only`)
  }

  return { recipients, staffEmail, staffPhone }
}
