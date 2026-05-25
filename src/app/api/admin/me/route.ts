import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const ok = await isAdmin()
  return NextResponse.json({ ok })
}
