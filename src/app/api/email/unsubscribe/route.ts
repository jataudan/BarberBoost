import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function page(title: string, body: string): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#e4e4e7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="min-height:100vh;">
    <tr><td align="center" valign="middle" style="padding:40px 16px;">
      <table cellpadding="0" cellspacing="0" style="max-width:420px;width:100%;">
        <tr><td style="text-align:center;padding-bottom:20px;">
          <span style="font-size:20px;font-weight:900;letter-spacing:0.12em;color:#c9a84c;">BARBERBOOST</span>
        </td></tr>
        <tr><td style="background:#1a1a1a;border:1px solid #27272a;border-radius:12px;padding:32px;text-align:center;">
          <h1 style="margin:0 0 12px;font-size:18px;font-weight:800;color:#e4e4e7;">${title}</h1>
          <p style="margin:0;font-size:14px;color:#a1a1aa;line-height:1.6;">${body}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

/**
 * GET /api/email/unsubscribe?shop=<uuid>
 *
 * Opts a shop out of lifecycle/nurture emails only — transactional mail
 * (booking confirmations, receipts, password resets) never checks this
 * table and is unaffected. Clicked directly from an email, so this renders
 * a plain confirmation page rather than returning JSON.
 */
export async function GET(request: NextRequest) {
  const shopId = request.nextUrl.searchParams.get('shop')
  if (!shopId) {
    return page('Link not recognised', 'This unsubscribe link is missing information. Please contact support if you keep receiving emails you don’t want.')
  }

  const supabase = createAdminClient()
  const { data: shop } = await supabase.from('shops').select('id').eq('id', shopId).maybeSingle()
  if (!shop) {
    return page('Link not recognised', 'We couldn’t find an account matching this link.')
  }

  const { error } = await supabase.from('email_preferences').upsert({
    shop_id: shopId,
    lifecycle_opted_out_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'shop_id' })

  if (error) {
    console.error('[email/unsubscribe] error:', error)
    return page('Something went wrong', 'Please try again shortly, or contact support.')
  }

  return page(
    'You’re unsubscribed',
    'You won’t receive any more setup or trial emails from BarberBoost. Booking confirmations, receipts and account emails are unaffected.'
  )
}
