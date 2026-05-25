'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Plus, Loader2, AlertCircle, Scissors, Upload, X, Edit2,
  Trash2, Eye, EyeOff, Tag, Users, Zap, Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { PlanId } from '@/lib/stripe/plans'
import type { HaircutStyle, Staff } from '@/types/database'

const INPUT = 'w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-[#c9a84c]/60 focus:ring-1 focus:ring-[#c9a84c]/20'

// ── Style card ────────────────────────────────────────────────────────────────

function StyleCard({
  style, staffList, onEdit, onDelete, onToggle,
}: {
  style: HaircutStyle
  staffList: Staff[]
  onEdit: (s: HaircutStyle) => void
  onDelete: (id: string) => void
  onToggle: (id: string, active: boolean) => void
}) {
  const assignedBarbers = staffList.filter(s => style.barber_ids.length === 0 || style.barber_ids.includes(s.id))
  const [delConfirm, setDelConfirm] = useState(false)

  return (
    <div className={cn(
      'bg-[#111111] border rounded-2xl overflow-hidden transition-all group',
      style.is_active ? 'border-white/[0.06]' : 'border-white/[0.03] opacity-60'
    )}>
      <div className="relative aspect-square bg-[#1a1a1a] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={style.image_url} alt={style.title}
          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button type="button" onClick={() => onEdit(style)} aria-label="Edit style"
            className="w-9 h-9 rounded-xl bg-[#c9a84c] text-[#0a0a0a] flex items-center justify-center hover:bg-[#e2bf6a] transition-colors">
            <Edit2 className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => onToggle(style.id, !style.is_active)}
            aria-label={style.is_active ? 'Hide style' : 'Show style'}
            className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
            {style.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          {delConfirm ? (
            <button type="button" onClick={() => { onDelete(style.id); setDelConfirm(false) }}
              aria-label="Confirm delete"
              className="w-9 h-9 rounded-xl bg-red-500 text-white flex items-center justify-center hover:bg-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" onClick={() => setDelConfirm(true)} aria-label="Delete style"
              className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/40 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        {!style.is_active && (
          <div className="absolute top-2 left-2 bg-zinc-800/90 border border-white/10 rounded-lg px-2 py-0.5">
            <span className="text-[10px] text-zinc-400 font-medium">Hidden</span>
          </div>
        )}
      </div>

      <div className="p-3 space-y-1.5">
        <p className="text-sm font-semibold text-white leading-tight line-clamp-1">{style.title}</p>
        {style.description && (
          <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">{style.description}</p>
        )}
        {style.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {style.tags.slice(0, 3).map(tag => (
              <span key={tag} className="inline-flex items-center gap-0.5 bg-[#c9a84c]/10 text-[#c9a84c] text-[9px] font-medium px-1.5 py-0.5 rounded-full">
                <Tag className="w-2 h-2" />{tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1 text-[10px] text-zinc-600">
          <Users className="w-3 h-3" />
          {style.barber_ids.length === 0
            ? 'All barbers'
            : `${assignedBarbers.length} barber${assignedBarbers.length !== 1 ? 's' : ''}`}
        </div>
      </div>
    </div>
  )
}

// ── Upload modal ──────────────────────────────────────────────────────────────

function StyleModal({
  shopId, staffList, editStyle, open, onOpenChange, onSaved,
}: {
  shopId: string
  staffList: Staff[]
  editStyle: HaircutStyle | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved: (style: HaircutStyle) => void
}) {
  const isEdit  = !!editStyle
  const fileRef = useRef<HTMLInputElement>(null)
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl,    setImageUrl]    = useState('')
  const [tags,        setTags]        = useState('')
  const [barberIds,   setBarberIds]   = useState<string[]>([])
  const [uploading,   setUploading]   = useState(false)
  const [uploadErr,   setUploadErr]   = useState<string | null>(null)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (editStyle) {
      setTitle(editStyle.title)
      setDescription(editStyle.description ?? '')
      setImageUrl(editStyle.image_url)
      setTags(editStyle.tags.join(', '))
      setBarberIds(editStyle.barber_ids)
    } else {
      setTitle(''); setDescription(''); setImageUrl(''); setTags(''); setBarberIds([])
    }
    setError(null); setUploadErr(null)
  }, [open, editStyle])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setUploadErr('Image must be under 5 MB'); return }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadErr('Only JPG, PNG or WebP images are supported'); return
    }
    setUploadErr(null); setUploading(true)
    const sb  = createClient()
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `styles/${shopId}/${Date.now()}.${ext}`
    const { error: uploadError } = await sb.storage.from('haircut-styles').upload(path, file, { upsert: true })
    setUploading(false)
    if (uploadError) { setUploadErr(`Upload failed: ${uploadError.message}`); return }
    const { data } = sb.storage.from('haircut-styles').getPublicUrl(path)
    setImageUrl(data.publicUrl)
  }

  async function handleSave() {
    if (!title.trim()) { setError('Title is required'); return }
    if (!imageUrl) { setError('Please upload an image'); return }
    setError(null); setSaving(true)
    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      image_url: imageUrl,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      barber_ids: barberIds,
    }
    const res = isEdit
      ? await fetch('/api/styles', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editStyle!.id, ...payload }) })
      : await fetch('/api/styles', { method: 'POST',  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shop_id: shopId, ...payload }) })
    const json = await res.json() as { data?: HaircutStyle; error?: string }
    setSaving(false)
    if (!res.ok) { setError(json.error ?? 'Something went wrong'); return }
    if (json.data) onSaved(json.data)
    onOpenChange(false)
  }

  function toggleBarber(id: string) {
    setBarberIds(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id])
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative w-full max-w-lg bg-[#111111] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
          <h2 className="font-[family-name:var(--font-heading)] text-lg tracking-widest text-white">
            {isEdit ? 'EDIT STYLE' : 'ADD STYLE'}
          </h2>
          <button type="button" onClick={() => onOpenChange(false)} aria-label="Close"
            className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-400">Style photo <span className="text-red-400">*</span></p>
            {imageUrl ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#1a1a1a]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setImageUrl(''); setUploadErr(null) }}
                  aria-label="Remove image"
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full aspect-video rounded-xl border-2 border-dashed border-white/[0.08] hover:border-[#c9a84c]/40 bg-[#0f0f0f] flex flex-col items-center justify-center gap-2 transition-colors disabled:opacity-50">
                {uploading ? <Loader2 className="w-6 h-6 animate-spin text-zinc-500" /> : <Upload className="w-6 h-6 text-zinc-600" />}
                <span className="text-xs text-zinc-600">{uploading ? 'Uploading…' : 'Click to upload (JPG, PNG or WebP · max 5 MB)'}</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
            {uploadErr && <p className="text-xs text-red-400">{uploadErr}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Title <span className="text-red-400">*</span></label>
            <input type="text" placeholder="e.g. Mid Fade with Taper" value={title}
              onChange={e => setTitle(e.target.value)} className={INPUT} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Description (optional)</label>
            <textarea rows={2} placeholder="Brief description of this style…" value={description}
              onChange={e => setDescription(e.target.value)} className={cn(INPUT, 'resize-none')} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Tags (comma-separated)</label>
            <input type="text" placeholder="e.g. fade, taper, classic" value={tags}
              onChange={e => setTags(e.target.value)} className={INPUT} />
          </div>

          {staffList.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-400">Assign to barbers (leave blank for all)</p>
              <div className="flex flex-wrap gap-2">
                {staffList.map(s => {
                  const selected = barberIds.includes(s.id)
                  return (
                    <button key={s.id} type="button" onClick={() => toggleBarber(s.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                        selected ? 'bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/30'
                          : 'bg-white/[0.03] text-zinc-500 border-white/[0.08] hover:text-zinc-300'
                      )}>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.colour }} />
                      {s.name}
                    </button>
                  )
                })}
              </div>
              {barberIds.length === 0 && (
                <p className="text-[10px] text-zinc-600">No barbers selected — style will be visible for all barbers</p>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-white/[0.06] flex-shrink-0">
          <button type="button" onClick={handleSave} disabled={saving || uploading}
            className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a0a0a] font-bold rounded-xl py-3 text-sm transition-colors">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />{isEdit ? 'Saving…' : 'Adding…'}</> : isEdit ? 'Save changes' : 'Add style'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main client component ─────────────────────────────────────────────────────

export function StylesClient({ shopId, plan, maxStyles }: {
  shopId: string
  plan: PlanId
  maxStyles: number
}) {
  const [styles,    setStyles]    = useState<HaircutStyle[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editStyle, setEditStyle] = useState<HaircutStyle | null>(null)

  const canAddStyles = maxStyles !== 0

  const fetchStyles = useCallback(async () => {
    if (!shopId) return
    setLoading(true)
    const res  = await fetch(`/api/styles?shop_id=${shopId}`)
    const json = await res.json() as { data?: HaircutStyle[]; error?: string }
    setLoading(false)
    if (!res.ok) { setError(json.error ?? 'Failed to load styles'); return }
    setStyles(json.data ?? [])
  }, [shopId])

  useEffect(() => {
    if (!shopId) return
    void fetchStyles()
    fetch(`/api/staff?shop_id=${shopId}`)
      .then(r => r.json())
      .then((json: { data?: Staff[] }) => setStaffList(json.data ?? []))
      .catch(() => {})
  }, [shopId, fetchStyles])

  function openCreate() { setEditStyle(null); setModalOpen(true) }
  function openEdit(style: HaircutStyle) { setEditStyle(style); setModalOpen(true) }

  function onSaved(style: HaircutStyle) {
    setStyles(prev => {
      const idx = prev.findIndex(s => s.id === style.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = style; return next }
      return [style, ...prev]
    })
  }

  async function handleDelete(id: string) {
    const res = await fetch('/api/styles', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    if (res.ok) setStyles(prev => prev.filter(s => s.id !== id))
    else { const j = await res.json() as { error?: string }; setError(j.error ?? 'Failed to delete') }
  }

  async function handleToggle(id: string, active: boolean) {
    const res = await fetch('/api/styles', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_active: active }) })
    if (res.ok) { const j = await res.json() as { data?: HaircutStyle }; if (j.data) onSaved(j.data) }
  }

  const activeCount = styles.filter(s => s.is_active).length
  const hiddenCount = styles.filter(s => !s.is_active).length

  // ── Free-plan upgrade wall ────────────────────────────────────────────────
  if (!canAddStyles) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl tracking-widest text-white leading-none">STYLES GALLERY</h1>
          <p className="text-sm text-zinc-500 mt-1">Upload haircut reference photos. Clients pick their desired style at booking.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center">
            <Lock className="w-7 h-7 text-[#c9a84c]" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-bold text-white">Styles Gallery — Starter plan and above</p>
            <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
              Upload reference photos so clients can show their barber exactly what they want.
              Available on the Starter plan and above.
            </p>
          </div>
          <Link href="/settings/billing"
            className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold rounded-xl px-6 py-3 text-sm transition-colors">
            <Zap className="w-4 h-4" />
            Upgrade to Starter
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl tracking-widest text-white leading-none">STYLES GALLERY</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Upload haircut reference photos. Clients pick their desired style at booking.
            {maxStyles !== -1 && <span className="text-zinc-600"> ({styles.length}/{maxStyles} used)</span>}
          </p>
        </div>
        <button type="button" onClick={openCreate}
          disabled={maxStyles !== -1 && styles.length >= maxStyles}
          className="flex items-center gap-1.5 bg-[#c9a84c] hover:bg-[#e2bf6a] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a0a0a] font-bold rounded-xl px-4 py-2.5 text-sm transition-colors flex-shrink-0">
          <Plus className="w-4 h-4" />
          Add Style
        </button>
      </div>

      {styles.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" />{activeCount} active</span>
          {hiddenCount > 0 && <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-zinc-600" />{hiddenCount} hidden</span>}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
        </div>
      ) : styles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center">
            <Scissors className="w-7 h-7 text-[#c9a84c]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-300">No styles yet</p>
            <p className="text-xs text-zinc-600 mt-1">Add haircut reference photos so clients can pick their desired style when booking.</p>
          </div>
          <button type="button" onClick={openCreate}
            className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold rounded-xl px-5 py-2.5 text-sm transition-colors">
            <Plus className="w-4 h-4" />
            Add your first style
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {styles.map(style => (
            <StyleCard key={style.id} style={style} staffList={staffList}
              onEdit={openEdit} onDelete={handleDelete} onToggle={handleToggle} />
          ))}
          {(maxStyles === -1 || styles.length < maxStyles) && (
            <button type="button" onClick={openCreate}
              className="aspect-square rounded-2xl border-2 border-dashed border-white/[0.08] hover:border-[#c9a84c]/40 bg-[#111111] flex flex-col items-center justify-center gap-2 text-zinc-600 hover:text-zinc-400 transition-all">
              <Plus className="w-6 h-6" />
              <span className="text-xs font-medium">Add style</span>
            </button>
          )}
        </div>
      )}

      <StyleModal shopId={shopId} staffList={staffList} editStyle={editStyle}
        open={modalOpen} onOpenChange={setModalOpen} onSaved={onSaved} />
    </div>
  )
}
