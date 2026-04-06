function SummaryCardSkeleton() {
  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-5 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl bg-white/[0.06]" />
        <div className="h-2 w-12 bg-white/[0.04] rounded" />
      </div>
      <div className="space-y-1.5">
        <div className="h-7 w-20 bg-white/[0.08] rounded" />
        <div className="h-2.5 w-28 bg-white/[0.04] rounded" />
      </div>
    </div>
  )
}

function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.04] animate-pulse">
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-white/[0.06] rounded w-40" />
        <div className="h-2 bg-white/[0.04] rounded w-24" />
      </div>
      <div className="h-2.5 w-16 bg-white/[0.05] rounded hidden sm:block" />
      <div className="h-5 w-20 bg-white/[0.05] rounded-full hidden md:block" />
      <div className="h-6 w-10 bg-white/[0.06] rounded-lg" />
      <div className="h-5 w-16 bg-white/[0.05] rounded-full" />
      <div className="flex gap-1.5">
        <div className="w-7 h-7 bg-white/[0.05] rounded-lg" />
        <div className="w-7 h-7 bg-white/[0.05] rounded-lg" />
        <div className="w-7 h-7 bg-white/[0.05] rounded-lg" />
      </div>
    </div>
  )
}

export default function InventoryLoading() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-white/[0.06] rounded-lg" />
          <div className="h-3 w-24 bg-white/[0.04] rounded" />
        </div>
        <div className="h-9 w-32 bg-white/[0.06] rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SummaryCardSkeleton key={i} />)}
      </div>
      <div className="bg-[#111111] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="h-12 border-b border-white/[0.06] bg-white/[0.01] animate-pulse" />
        {Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} />)}
      </div>
    </div>
  )
}
