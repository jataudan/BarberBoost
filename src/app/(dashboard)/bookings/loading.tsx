function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.04] animate-pulse">
      <div className="w-16 h-3 bg-white/[0.06] rounded" />
      <div className="w-24 h-3 bg-white/[0.06] rounded" />
      <div className="flex-1 h-3 bg-white/[0.06] rounded" />
      <div className="w-20 h-3 bg-white/[0.06] rounded" />
      <div className="w-12 h-3 bg-white/[0.06] rounded" />
      <div className="w-16 h-5 bg-white/[0.06] rounded-full" />
    </div>
  )
}

export default function BookingsLoading() {
  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-4 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-white/[0.06] rounded-lg" />
          <div className="h-3 w-24 bg-white/[0.04] rounded" />
        </div>
        <div className="h-9 w-32 bg-white/[0.06] rounded-xl" />
      </div>
      {/* Table skeleton */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="h-11 border-b border-white/[0.06] bg-white/[0.01] animate-pulse" />
        {Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)}
      </div>
    </div>
  )
}
