'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Loader2, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { HERO_PRESETS, getPreset, presetCoverUrl } from '@/lib/hero-presets'
import type { Shop } from '@/types/database'

interface Props {
  onClose:  () => void
  onSelect: (coverUrl: string) => void
}

export function HeroStylePicker({ onClose, onSelect }: Props) {
  const [shop, setShop]               = useState<Shop | null>(null)
  const [saving, setSaving]           = useState<string | null>(null)
  const [uploading, setUploading]     = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef                       = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/shops')
      .then(r => r.json())
      .then((json: { data?: Shop }) => { if (json.data) setShop(json.data) })
  }, [])

  async function selectPreset(id: string) {
    setSaving(id)
    const url = presetCoverUrl(id)
    const res = await fetch('/api/shops', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ cover_url: url }),
    })
    setSaving(null)
    if (res.ok) { onSelect(url); onClose() }
  }

  async function handleUpload(file: File) {
    if (!shop) return
    setUploading(true)
    setUploadError(null)
    try {
      if (file.size > 5 * 1024 * 1024) { setUploadError('Image must be under 5 MB'); return }
      const supabase = createClient()
      const ext      = file.name.split('.').pop() ?? 'jpg'
      const path     = `${shop.id}/cover.${ext}`
      const { error: upErr } = await supabase.storage
        .from('shop-covers')
        .upload(path, file, { upsert: true })
      if (upErr) { setUploadError(upErr.message); return }
      const { data: { publicUrl } } = supabase.storage.from('shop-covers').getPublicUrl(path)
      const res = await fetch('/api/shops', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ cover_url: publicUrl }),
      })
      if (res.ok) { onSelect(publicUrl); onClose() }
      else setUploadError('Failed to save image')
    } finally {
      setUploading(false)
    }
  }

  const currentPreset = shop ? getPreset(shop.cover_url) : null
  const busy          = !!saving || uploading

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-2xl bg-[#111111] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-sm font-bold text-white">Choose your booking page style</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Pick a theme that represents your shop's vibe</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preset grid */}
        <div className="p-5 pb-0">
          <div className="grid grid-cols-4 gap-2.5">
            {HERO_PRESETS.map(preset => {
              const isActive = currentPreset?.id === preset.id
              const isSaving = saving === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => selectPreset(preset.id)}
                  disabled={busy}
                  className={[
                    'relative rounded-xl overflow-hidden border-2 transition-all text-left',
                    isActive
                      ? 'border-[#c9a84c] ring-1 ring-[#c9a84c]/30'
                      : 'border-transparent hover:border-white/20',
                    busy && !isSaving ? 'opacity-50 cursor-not-allowed' : '',
                  ].join(' ')}
                >
                  {/* Gradient preview */}
                  <div className="h-16 relative" style={{ background: preset.background }}>
                    <div
                      className="absolute inset-0"
                      style={{ background: `radial-gradient(ellipse at 30% 40%, ${preset.glowColor}30 0%, transparent 65%)` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {/* Accent line mock */}
                    <div className="absolute bottom-2 left-2 right-2 space-y-1">
                      <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: preset.accentColor }} />
                      <div className="h-1 w-6 rounded-full bg-white/30" />
                    </div>
                    {isActive && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#c9a84c] flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-black" />
                      </div>
                    )}
                    {isSaving && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  {/* Label */}
                  <div className="px-2 py-1.5" style={{ background: preset.background }}>
                    <p className="text-[10px] font-semibold text-white leading-tight">{preset.label}</p>
                    <p className="text-[9px] text-zinc-500 leading-tight mt-0.5">{preset.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Upload section */}
        <div className="p-5">
          <div className="flex items-center justify-between gap-4 border border-dashed border-white/[0.1] rounded-xl px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-300">Upload a photo of your shop</p>
              <p className="text-[10px] text-zinc-600 mt-0.5 leading-relaxed">
                JPG, PNG or WebP · Max 5 MB · Recommended 1200×400 px
              </p>
              {uploadError && <p className="text-xs text-red-400 mt-1">{uploadError}</p>}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="flex items-center gap-1.5 bg-white/[0.05] hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 hover:text-white text-xs font-medium rounded-xl px-3.5 py-2 transition-colors flex-shrink-0"
            >
              {uploading
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Uploading…</>
                : <><Upload className="w-3.5 h-3.5" />Choose file</>
              }
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              title="Upload cover photo"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
