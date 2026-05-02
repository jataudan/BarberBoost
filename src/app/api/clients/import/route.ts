import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe/plans'
import type { PlanId } from '@/lib/stripe/plans'

const MAX_ROWS = 500

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  values.push(current.trim())
  return values
}

interface CSVRow {
  name:  string
  email: string
  phone: string
  notes: string
}

function parseCSV(text: string): CSVRow[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []

  const rawHeaders = parseCSVLine(lines[0])
  const headers    = rawHeaders.map((h) => h.toLowerCase().replace(/['"]/g, '').trim())

  const idx = {
    name:  headers.findIndex((h) => h === 'name' || h === 'full name' || h === 'client name'),
    email: headers.findIndex((h) => h === 'email' || h === 'email address'),
    phone: headers.findIndex((h) => h === 'phone' || h === 'mobile' || h === 'phone number' || h === 'mobile number'),
    notes: headers.findIndex((h) => h === 'notes' || h === 'note'),
  }

  if (idx.name === -1) return []

  return lines.slice(1).map((line) => {
    const vals = parseCSVLine(line)
    return {
      name:  idx.name  >= 0 ? (vals[idx.name]  ?? '').trim() : '',
      email: idx.email >= 0 ? (vals[idx.email] ?? '').trim().toLowerCase() : '',
      phone: idx.phone >= 0 ? (vals[idx.phone] ?? '').trim() : '',
      notes: idx.notes >= 0 ? (vals[idx.notes] ?? '').trim() : '',
    }
  })
}

// ── POST — import clients from CSV ────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file     = formData.get('file') as File | null
  const shopId   = formData.get('shop_id') as string | null

  if (!file || !shopId) {
    return NextResponse.json({ error: 'file and shop_id are required' }, { status: 400 })
  }

  // Ownership check
  const { data: shop } = await supabase
    .from('shops')
    .select('id')
    .eq('id', shopId)
    .eq('owner_id', user.id)
    .single()
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Plan limit
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('owner_id', user.id)
    .in('status', ['active', 'trialing'])
    .single()
  const plan      = ((sub?.plan as PlanId | null) ?? 'free') satisfies PlanId
  const maxClients = PLANS[plan].limits.clients

  // Parse CSV
  const text = await file.text()
  const rows = parseCSV(text)

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No valid rows found. Make sure your CSV has a "name" column header.' }, { status: 400 })
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Maximum ${MAX_ROWS} rows per import. Split your file and try again.` }, { status: 400 })
  }

  // Current client count
  const { count: existingCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('shop_id', shopId)

  const currentCount = existingCount ?? 0

  // Fetch existing emails to detect duplicates
  const { data: existingClients } = await supabase
    .from('clients')
    .select('email')
    .eq('shop_id', shopId)
    .not('email', 'is', null)

  const existingEmails = new Set(
    (existingClients ?? []).map((c) => (c.email as string).toLowerCase())
  )

  // Process rows
  const toInsert: {
    shop_id: string
    name: string
    email: string | null
    phone: string | null
    notes: string | null
    tags: string[]
    total_visits: number
    total_spent: number
    marketing_consent: boolean
  }[] = []

  const skippedRows: { row: number; reason: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // 1-indexed, +1 for header

    if (!row.name) {
      skippedRows.push({ row: rowNum, reason: 'Missing name' })
      continue
    }

    if (row.email && existingEmails.has(row.email)) {
      skippedRows.push({ row: rowNum, reason: `Email ${row.email} already exists` })
      continue
    }

    if (maxClients !== -1 && currentCount + toInsert.length >= maxClients) {
      skippedRows.push({ row: rowNum, reason: `Client limit reached (${maxClients} on ${PLANS[plan].name} plan)` })
      continue
    }

    toInsert.push({
      shop_id:           shopId,
      name:              row.name,
      email:             row.email || null,
      phone:             row.phone || null,
      notes:             row.notes || null,
      tags:              ['New'],
      total_visits:      0,
      total_spent:       0,
      marketing_consent: false,
    })

    if (row.email) existingEmails.add(row.email)
  }

  // Batch insert
  let inserted = 0
  let insertErrors = 0

  if (toInsert.length > 0) {
    const BATCH = 50
    for (let i = 0; i < toInsert.length; i += BATCH) {
      const { error } = await supabase.from('clients').insert(toInsert.slice(i, i + BATCH))
      if (error) {
        console.error('[clients/import] batch insert error:', error.message)
        insertErrors += Math.min(BATCH, toInsert.length - i)
      } else {
        inserted += Math.min(BATCH, toInsert.length - i)
      }
    }
  }

  return NextResponse.json({
    imported: inserted,
    skipped:  skippedRows.length,
    errors:   insertErrors,
    skippedRows: skippedRows.slice(0, 20),
  })
}
