'use client'

import { useState, useRef, useCallback } from 'react'
import { X, Upload, FileText, CheckCircle, AlertCircle, Download, Loader2 } from 'lucide-react'

interface ImportResult {
  imported:    number
  skipped:     number
  errors:      number
  skippedRows: { row: number; reason: string }[]
}

interface ClientImportModalProps {
  shopId:       string
  open:         boolean
  onOpenChange: (open: boolean) => void
  onSuccess:    () => void
}

const TEMPLATE_CSV = `name,email,phone,notes\nJohn Smith,john@email.com,07700900001,Regular client\nMarcus Reid,marcus@email.com,07700900002,\nAlex Johnson,,,Prefers Jordan`

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'barberboost-clients-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function ClientImportModal({ shopId, open, onOpenChange, onSuccess }: ClientImportModalProps) {
  const [file,      setFile]      = useState<File | null>(null)
  const [dragging,  setDragging]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [result,    setResult]    = useState<ImportResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function close() {
    onOpenChange(false)
    // Reset state after animation
    setTimeout(() => { setFile(null); setError(null); setResult(null) }, 200)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) { setFile(f); setError(null); setResult(null) }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && (f.name.endsWith('.csv') || f.type === 'text/csv')) {
      setFile(f); setError(null); setResult(null)
    } else {
      setError('Please upload a .csv file.')
    }
  }, [])

  async function handleImport() {
    if (!file) return
    setLoading(true)
    setError(null)

    const form = new FormData()
    form.append('file',    file)
    form.append('shop_id', shopId)

    try {
      const res  = await fetch('/api/clients/import', { method: 'POST', body: form })
      const json = await res.json() as ImportResult & { error?: string }
      if (!res.ok) { setError(json.error ?? 'Import failed.'); return }
      setResult(json)
      if (json.imported > 0) onSuccess()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />

      <div className="relative bg-[#111111] border border-[#2a2a2a] rounded-2xl w-full max-w-lg shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1e1e1e]">
          <div>
            <h2 className="text-base font-semibold text-white">Import clients</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Upload a CSV to add clients in bulk</p>
          </div>
          <button type="button" onClick={close} className="text-zinc-500 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Template download */}
          <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-zinc-300">CSV format</p>
              <p className="text-[11px] text-zinc-600">Columns: <span className="font-mono text-zinc-500">name, email, phone, notes</span> — only name is required</p>
            </div>
            <button
              type="button"
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-xs text-[#c9a84c] hover:text-[#e2bf6a] transition-colors shrink-0 font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              Template
            </button>
          </div>

          {/* Drop zone */}
          {!result && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragging
                  ? 'border-[#c9a84c]/60 bg-[#c9a84c]/5'
                  : file
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-[#2a2a2a] hover:border-[#3a3a3a] hover:bg-white/[0.02]'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={onFileChange}
                className="hidden"
              />
              {file ? (
                <div className="space-y-2">
                  <FileText className="w-8 h-8 text-emerald-400 mx-auto" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-white">{file.name}</p>
                  <p className="text-xs text-zinc-600">{(file.size / 1024).toFixed(1)} KB — click to change</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-zinc-600 mx-auto" strokeWidth={1.5} />
                  <p className="text-sm text-zinc-400">Drop your CSV here, or <span className="text-[#c9a84c]">browse</span></p>
                  <p className="text-xs text-zinc-600">Max 500 rows per import</p>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex gap-2.5 items-start bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Imported',   value: result.imported, color: 'text-emerald-400', bg: 'bg-emerald-500/8 border-emerald-500/20' },
                  { label: 'Skipped',    value: result.skipped,  color: 'text-zinc-400',    bg: 'bg-white/[0.04] border-white/[0.06]' },
                  { label: 'Errors',     value: result.errors,   color: 'text-red-400',     bg: 'bg-red-500/8 border-red-500/20' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={`border rounded-xl p-3 text-center ${bg}`}>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {result.imported > 0 && (
                <div className="flex items-center gap-2 text-sm text-emerald-400">
                  <CheckCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                  {result.imported} client{result.imported !== 1 ? 's' : ''} added successfully.
                </div>
              )}

              {result.skippedRows.length > 0 && (
                <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-xl p-3 space-y-1.5 max-h-36 overflow-y-auto">
                  <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Skipped rows</p>
                  {result.skippedRows.map(({ row, reason }) => (
                    <p key={row} className="text-xs text-zinc-500">
                      <span className="font-mono text-zinc-600">Row {row}:</span> {reason}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#1e1e1e]">
          <button
            type="button"
            onClick={close}
            className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2"
          >
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              type="button"
              onClick={handleImport}
              disabled={!file || loading}
              className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a0a0a] font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {loading ? 'Importing…' : 'Import'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
