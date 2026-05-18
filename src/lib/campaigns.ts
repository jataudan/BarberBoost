import { createAdminClient } from '@/lib/supabase/admin'
import { campaignEmail } from '@/lib/email/templates'
import { sendWhatsApp } from '@/lib/whatsapp'
import type { Campaign, Client } from '@/types/database'

const MAX_RECIPIENTS = 500

export async function resolveSegment(shopId: string, segment: string): Promise<Client[]> {
  const supabase = createAdminClient()
  const now      = new Date()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('clients')
    .select('*')
    .eq('shop_id', shopId)
    .eq('marketing_consent', true)
    .limit(MAX_RECIPIENTS)

  if (segment === 'vip') {
    query = query.gte('total_visits', 5)
  } else if (segment === 'regular') {
    query = query.gte('total_visits', 2).lt('total_visits', 5)
  } else if (segment === 'new') {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    query = query.gte('created_at', thirtyDaysAgo)
  } else if (segment === 'at_risk') {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const fiftyNineDaysAgo = new Date(now.getTime() - 59 * 24 * 60 * 60 * 1000).toISOString()
    query = query.gte('last_visit', fiftyNineDaysAgo).lt('last_visit', thirtyDaysAgo)
  } else if (segment === 'inactive') {
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()
    query = query.or(`last_visit.lt.${sixtyDaysAgo},last_visit.is.null`)
  }
  // 'all' — marketing_consent filter is sufficient

  const { data, error } = await query
  if (error) throw new Error(`resolveSegment error: ${error.message}`)
  return (data ?? []) as Client[]
}

export interface SendResult {
  campaignId: string
  sentCount:  number
  errors:     number
}

interface ShopInfo {
  name:  string
  phone: string | null
}

export async function executeCampaignSend(campaign: Campaign, shop: ShopInfo): Promise<SendResult> {
  const supabase = createAdminClient()

  await supabase.from('campaigns').update({ status: 'sending' }).eq('id', campaign.id)

  let sentCount  = 0
  let errorCount = 0

  try {
    const clients = await resolveSegment(campaign.shop_id, campaign.target_segment)

    if (campaign.type === 'email') {
      const { Resend: ResendClient } = await import('resend')
      const resend = new ResendClient(process.env.RESEND_API_KEY)

      const BATCH = 100
      for (let i = 0; i < clients.length; i += BATCH) {
        const slice  = clients.slice(i, i + BATCH)
        const emails = slice
          .filter(c => c.email)
          .map(c => {
            const tmpl = campaignEmail({
              clientName: c.name,
              shopName:   shop.name,
              subject:    campaign.subject ?? campaign.name,
              content:    campaign.content ?? '',
              shopPhone:  shop.phone,
            })
            return {
              from: process.env.RESEND_FROM_EMAIL ?? 'BarberBoost <noreply@barberboost.app>',
              to:   c.email as string,
              ...tmpl,
            }
          })

        if (!emails.length) continue

        try {
          const { data: bd, error: be } = await resend.batch.send(emails)
          if (be) {
            console.error('[campaigns] batch email error:', be)
            errorCount += emails.length
          } else {
            sentCount += bd?.data?.length ?? emails.length
          }
        } catch (err) {
          console.error('[campaigns] batch exception:', err)
          errorCount += emails.length
        }
      }
    } else if (campaign.type === 'sms') {
      for (const client of clients) {
        if (!client.phone) continue
        const message = (campaign.content ?? '').replace(/\{name\}/g, client.name)
        try {
          await sendWhatsApp(client.phone, message)
          sentCount++
        } catch (err) {
          console.error(`[campaigns] SMS error for ${client.id}:`, err)
          errorCount++
        }
      }
    } else {
      // push not implemented
      errorCount = clients.length
    }

    await supabase.from('campaigns').update({
      status:     'sent',
      sent_count: sentCount,
      sent_at:    new Date().toISOString(),
    }).eq('id', campaign.id)

  } catch (err) {
    console.error(`[campaigns] executeCampaignSend error for ${campaign.id}:`, err)
    await supabase.from('campaigns').update({ status: 'failed' }).eq('id', campaign.id)
    throw err
  }

  return { campaignId: campaign.id, sentCount, errors: errorCount }
}
