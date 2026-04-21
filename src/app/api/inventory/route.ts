import { type NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { lowStockAlert } from '@/lib/email/templates'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barberboost.com'

// ── Low-stock email helper ────────────────────────────────────────────────

type LowStockItem = {
  id: string; name: string; sku: string | null; category: string | null
  quantity: number; low_stock_threshold: number
}

function sendLowStockEmail(
  ownerEmail: string,
  ownerName:  string,
  shopName:   string,
  item:       LowStockItem,
) {
  const payload = lowStockAlert({
    shopName,
    ownerName,
    items: [{
      name:      item.name,
      sku:       item.sku,
      category:  item.category,
      quantity:  item.quantity,
      threshold: item.low_stock_threshold,
    }],
    dashboardUrl: `${APP_URL}/inventory`,
  })
  const resend = new Resend(process.env.RESEND_API_KEY)
  const FROM   = process.env.RESEND_FROM_EMAIL ?? 'inventory@barberboost.com'
  resend.emails.send({ from: FROM, to: ownerEmail, subject: payload.subject, html: payload.html })
    .catch(() => {})  // non-fatal
}

// ── GET — list inventory ──────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp     = request.nextUrl.searchParams
  const shopId = sp.get('shop_id')
  const id     = sp.get('id')

  if (!shopId && !id) return NextResponse.json({ error: 'shop_id or id required' }, { status: 400 })

  if (id) {
    const { data: ownerShop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single()
    if (!ownerShop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { data, error } = await supabase.from('inventory').select('*').eq('id', id).eq('shop_id', ownerShop.id).single()
    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json({ data })
  }

  const { data: shop } = await supabase.from('shops').select('id').eq('id', shopId!).eq('owner_id', user.id).single()
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const category = sp.get('category')
  let query = supabase.from('inventory').select('*', { count: 'exact' }).eq('shop_id', shopId!)
  if (category) query = query.eq('category', category)
  query = query.order('category', { ascending: true }).order('name', { ascending: true })

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Client-side low-stock filtering; server returns all items
  return NextResponse.json({ data, meta: { total: count ?? 0 } })
}

// ── POST — create item ────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as {
    shop_id: string; name: string
    category?: string; sku?: string
    quantity?: number; low_stock_threshold?: number
    cost_price?: number | null; retail_price?: number | null
    supplier?: string; notes?: string
  }

  const { shop_id, name, category, sku, quantity, low_stock_threshold, cost_price, retail_price, supplier, notes } = body

  if (!shop_id || !name?.trim()) {
    return NextResponse.json({ error: 'shop_id and name are required' }, { status: 400 })
  }

  const { data: shop } = await supabase
    .from('shops').select('id, name').eq('id', shop_id).eq('owner_id', user.id).single()
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const qty       = quantity            ?? 0
  const threshold = low_stock_threshold ?? 5

  const { data, error } = await supabase.from('inventory').insert({
    shop_id,
    name:                name.trim(),
    category:            category     || null,
    sku:                 sku          || null,
    quantity:            qty,
    low_stock_threshold: threshold,
    cost_price:          cost_price   ?? null,
    retail_price:        retail_price ?? null,
    supplier:            supplier     || null,
    notes:               notes        || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Alert if the new item is already at or below its threshold
  if (qty <= threshold && user.email) {
    const ownerName = (user.user_metadata?.full_name as string | undefined) ?? 'there'
    sendLowStockEmail(user.email, ownerName, shop.name, {
      id: data.id, name: data.name, sku: data.sku, category: data.category,
      quantity: qty, low_stock_threshold: threshold,
    })
  }

  return NextResponse.json({ data }, { status: 201 })
}

// ── PATCH — update item or adjust stock ───────────────────────────────────
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as {
    id: string; adjust?: boolean; delta?: number; reason?: string
    [k: string]: unknown
  }
  const { id, adjust, delta, reason } = body

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Verify ownership and load current state
  const { data: existing } = await supabase
    .from('inventory')
    .select('shop_id, quantity, low_stock_threshold, name, sku, category')
    .eq('id', id)
    .single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: shop } = await supabase
    .from('shops').select('id, name').eq('id', existing.shop_id).eq('owner_id', user.id).single()
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // ── Stock adjustment ────────────────────────────────────────────────────
  if (adjust) {
    if (typeof delta !== 'number') {
      return NextResponse.json({ error: 'delta (number) required for stock adjustment' }, { status: 400 })
    }
    const newQty = Math.max(0, existing.quantity + delta)

    const { data, error } = await supabase
      .from('inventory').update({ quantity: newQty }).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Send email only when the item transitions from OK → low
    const wasOk  = existing.quantity > existing.low_stock_threshold
    const nowLow = newQty <= existing.low_stock_threshold
    if (wasOk && nowLow && user.email) {
      const ownerName = (user.user_metadata?.full_name as string | undefined) ?? 'there'
      sendLowStockEmail(user.email, ownerName, shop.name, {
        id, name: existing.name, sku: existing.sku, category: existing.category,
        quantity: newQty, low_stock_threshold: existing.low_stock_threshold,
      })
    }

    return NextResponse.json({
      data,
      adjustment: { delta, reason: reason ?? null, newQuantity: newQty },
    })
  }

  // ── Regular field update ────────────────────────────────────────────────
  const { id: _id, shop_id: _sid, created_at: _ca, adjust: _adj, delta: _d, reason: _r, ...safeUpdates } = body
  void _id; void _sid; void _ca; void _adj; void _d; void _r

  const { data, error } = await supabase
    .from('inventory').update(safeUpdates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// ── DELETE — remove item ──────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json() as { id: string }
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data: existing } = await supabase.from('inventory').select('shop_id').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: shop } = await supabase
    .from('shops').select('id').eq('id', existing.shop_id).eq('owner_id', user.id).single()
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase.from('inventory').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
