import { NextResponse } from 'next/server'
import { getAdminDebug } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const debug = await getAdminDebug()
  return NextResponse.json(debug)
}
