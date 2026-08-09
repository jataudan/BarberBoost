import { createAdminClient } from './supabase/admin'

/** Never send more than one lifecycle email per shop within this window. */
const MIN_HOURS_BETWEEN_LIFECYCLE_EMAILS = 48

export type SuppressionReason = 'opted_out' | 'converted' | 'too_recent'

export interface SuppressionResult {
  suppressed: boolean
  reason?:    SuppressionReason
}

/**
 * Single place all nurture-send suppression rules are enforced. Every send
 * path (cron and webhook-fired alike) must go through this before dispatch.
 */
export async function checkSuppression(shopId: string, converted: boolean): Promise<SuppressionResult> {
  if (converted) return { suppressed: true, reason: 'converted' }

  const supabase = createAdminClient()

  const { data: prefs } = await supabase
    .from('email_preferences')
    .select('lifecycle_opted_out_at')
    .eq('shop_id', shopId)
    .maybeSingle()
  if (prefs?.lifecycle_opted_out_at) return { suppressed: true, reason: 'opted_out' }

  const { data: recent } = await supabase
    .from('email_sends')
    .select('sent_at')
    .eq('shop_id', shopId)
    .not('sent_at', 'is', null)
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (recent?.sent_at) {
    const hoursSince = (Date.now() - new Date(recent.sent_at).getTime()) / (1000 * 60 * 60)
    if (hoursSince < MIN_HOURS_BETWEEN_LIFECYCLE_EMAILS) return { suppressed: true, reason: 'too_recent' }
  }

  return { suppressed: false }
}

/**
 * Idempotency gate: reserve a send slot by inserting the row first. Returns
 * false if this (shop, key) pair has already been claimed — either already
 * sent, or another run is currently attempting it.
 */
export async function claimEmailSend(shopId: string, emailKey: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('email_sends').insert({ shop_id: shopId, email_key: emailKey })
  return !error
}

export async function markEmailSent(shopId: string, emailKey: string, resendMessageId: string | null): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('email_sends')
    .update({ sent_at: new Date().toISOString(), resend_message_id: resendMessageId })
    .eq('shop_id', shopId).eq('email_key', emailKey)
}

/** Release a claimed slot after a failed send (condition not met, or the send itself errored) so a later run can retry. */
export async function releaseEmailSend(shopId: string, emailKey: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('email_sends').delete().eq('shop_id', shopId).eq('email_key', emailKey)
}

/**
 * Opaque unsubscribe link. Reuses this codebase's existing pattern for
 * unguessable-token links (see bookings.manage_token) — a random UUID in a
 * URL, no separate signing infra.
 */
export function unsubscribeUrl(shopId: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barberboost.app'
  return `${appUrl}/api/email/unsubscribe?shop=${shopId}`
}

type NurtureTemplate = { subject: string; html: string; text?: string }
export interface NurtureSendResult { sent: boolean; reason?: string }

/**
 * The full send pipeline for one (shop, emailKey) pair — suppression check,
 * idempotency claim, build, dispatch, mark/release. Shared by the hourly
 * cron (schedule-driven keys) and the webhook (trial_ending/trial_ended,
 * event-driven) so there is exactly one place this logic lives.
 */
export async function attemptNurtureSend(
  shopId: string,
  ownerEmail: string,
  emailKey: string,
  build: () => Promise<NurtureTemplate | null> | NurtureTemplate | null,
): Promise<NurtureSendResult> {
  const suppression = await checkSuppression(shopId, false)
  if (suppression.suppressed) return { sent: false, reason: suppression.reason }

  const claimed = await claimEmailSend(shopId, emailKey)
  if (!claimed) return { sent: false, reason: 'already_sent' }

  try {
    const tmpl = await build()
    if (!tmpl) {
      await releaseEmailSend(shopId, emailKey)
      return { sent: false, reason: 'condition_not_met' }
    }

    const { Resend: ResendClient } = await import('resend')
    const resend = new ResendClient(process.env.RESEND_API_KEY)
    const FROM   = process.env.RESEND_FROM_EMAIL ?? 'BarberBoost <noreply@barberboost.app>'
    const { data, error } = await resend.emails.send({ from: FROM, to: ownerEmail, ...tmpl })
    if (error) throw new Error(error.message)

    await markEmailSent(shopId, emailKey, data?.id ?? null)
    return { sent: true }
  } catch (err) {
    console.error(`[nurture] send error shop=${shopId} key=${emailKey}:`, err)
    await releaseEmailSend(shopId, emailKey)
    return { sent: false, reason: 'error' }
  }
}
