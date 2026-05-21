export interface HeroPreset {
  id:          string
  label:       string
  description: string
  background:  string
  accentColor: string
  glowColor:   string
}

export const HERO_PRESETS: HeroPreset[] = [
  {
    id:          'classic-dark',
    label:       'Classic Dark',
    description: 'Timeless elegance',
    background:  'linear-gradient(160deg, #111111 0%, #1c1814 55%, #0a0a0a 100%)',
    accentColor: '#c9a84c',
    glowColor:   '#c9a84c',
  },
  {
    id:          'modern-noir',
    label:       'Modern Noir',
    description: 'Sleek & minimal',
    background:  'linear-gradient(160deg, #050505 0%, #141414 55%, #000000 100%)',
    accentColor: '#e5e5e5',
    glowColor:   '#ffffff',
  },
  {
    id:          'street-red',
    label:       'Street Red',
    description: 'Bold urban energy',
    background:  'linear-gradient(160deg, #1a0808 0%, #2a0f0f 55%, #0f0404 100%)',
    accentColor: '#ef4444',
    glowColor:   '#ef4444',
  },
  {
    id:          'luxury-gold',
    label:       'Luxury Gold',
    description: 'Premium & refined',
    background:  'linear-gradient(160deg, #1a1200 0%, #2a1e00 55%, #0f0a00 100%)',
    accentColor: '#f59e0b',
    glowColor:   '#f59e0b',
  },
  {
    id:          'midnight',
    label:       'Midnight Blue',
    description: 'Cool & confident',
    background:  'linear-gradient(160deg, #050d1a 0%, #0a1628 55%, #020810 100%)',
    accentColor: '#3b82f6',
    glowColor:   '#3b82f6',
  },
  {
    id:          'emerald',
    label:       'Forest Green',
    description: 'Fresh & grounded',
    background:  'linear-gradient(160deg, #021208 0%, #051f0e 55%, #010a05 100%)',
    accentColor: '#10b981',
    glowColor:   '#10b981',
  },
  {
    id:          'violet',
    label:       'Deep Violet',
    description: 'Creative & distinctive',
    background:  'linear-gradient(160deg, #0d0018 0%, #160028 55%, #07000f 100%)',
    accentColor: '#a855f7',
    glowColor:   '#a855f7',
  },
  {
    id:          'slate',
    label:       'Urban Slate',
    description: 'Sharp & professional',
    background:  'linear-gradient(160deg, #0c0f14 0%, #161c26 55%, #080a0d 100%)',
    accentColor: '#94a3b8',
    glowColor:   '#94a3b8',
  },
]

export const PRESET_PREFIX = 'bb-preset:'

export function getPreset(coverUrl: string | null | undefined): HeroPreset | null {
  if (!coverUrl?.startsWith(PRESET_PREFIX)) return null
  const id = coverUrl.slice(PRESET_PREFIX.length)
  return HERO_PRESETS.find(p => p.id === id) ?? null
}

export function presetCoverUrl(id: string): string {
  return `${PRESET_PREFIX}${id}`
}
