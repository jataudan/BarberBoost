import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Parse .env.local manually
const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] })
)

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

const { data, error } = await supabase.storage.createBucket('shop-logos', {
  public: true,
  fileSizeLimit: 2097152,
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
})

if (error && !error.message.toLowerCase().includes('already exist')) {
  console.error('Failed to create bucket:', error.message)
  process.exit(1)
}
console.log(error ? '✓ Bucket already exists' : '✓ Bucket created: shop-logos (public=true, max 2 MB)')

const { data: buckets } = await supabase.storage.listBuckets()
console.log('All storage buckets:', buckets?.map(b => `${b.name} (public=${b.public})`).join(', '))
