'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import type { AnalyticsData } from '@/lib/analytics'

interface Props {
  data:     AnalyticsData
  currency: string
  period:   string
}

function toCSV(rows: Record<string, string | number>[]): string {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const lines   = [
    headers.join(','),
    ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
  ]
  return lines.join('\n')
}

function download(filename: string, content: string, mime = 'text/csv') {
  const blob = new Blob([content], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ExportButton({ data, currency, period }: Props) {
  const [open, setOpen] = useState(false)

  function handleCSV() {
    setOpen(false)
    // Revenue chart
    const revCSV = toCSV(data.revenueChart.map(r => ({
      Date: r.date, Revenue: r.revenue, Bookings: r.bookings,
    })))
    download(`barberboost-revenue-${period}.csv`, revCSV)
  }

  function handleStaffCSV() {
    setOpen(false)
    const rows = data.staffRows.map(r => ({
      Name: r.name, Bookings: r.bookings,
      Revenue: r.revenue,
    }))
    download(`barberboost-staff-${period}.csv`, toCSV(rows))
  }

  function handleServicesCSV() {
    setOpen(false)
    const rows = data.topServices.map(s => ({
      Service: s.name, Revenue: s.revenue, Bookings: s.bookings,
    }))
    download(`barberboost-services-${period}.csv`, toCSV(rows))
  }

  function handlePDF() {
    setOpen(false)
    window.print()
  }

  return (
    <div className="relative">
      <button type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 bg-[#111111] border border-white/[0.06] hover:border-white/[0.12] rounded-xl px-4 py-2 text-sm text-zinc-300 transition-colors">
        <Download className="w-3.5 h-3.5" />
        Export
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-48 bg-[#111111] border border-[#2a2a2a] rounded-xl shadow-2xl z-30 overflow-hidden">
            <p className="px-4 py-2.5 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest border-b border-[#2a2a2a]">
              Export as
            </p>
            <button type="button" onClick={handleCSV}
              className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.04] transition-colors">
              Revenue CSV
            </button>
            <button type="button" onClick={handleStaffCSV}
              className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.04] transition-colors">
              Staff CSV
            </button>
            <button type="button" onClick={handleServicesCSV}
              className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.04] transition-colors">
              Services CSV
            </button>
            <div className="border-t border-[#2a2a2a]">
              <button type="button" onClick={handlePDF}
                className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.04] transition-colors">
                Print / PDF
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
