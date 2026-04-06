function StaffCardSkeleton() {
  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-white/[0.08] flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 bg-white/[0.06] rounded w-3/4" />
          <div className="h-2.5 bg-white/[0.04] rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-2.5 bg-white/[0.04] rounded w-full" />
        <div className="h-2.5 bg-white/[0.04] rounded w-4/5" />
      </div>
      <div className="flex gap-2 pt-1">
        <div className="h-8 flex-1 bg-white/[0.04] rounded-lg" />
        <div className="h-8 flex-1 bg-white/[0.04] rounded-lg" />
      </div>
    </div>
  )
}

export default function StaffLoading() {
  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-24 bg-white/[0.06] rounded-lg" />
          <div className="h-3 w-20 bg-white/[0.04] rounded" />
        </div>
        <div className="h-9 w-28 bg-white/[0.06] rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <StaffCardSkeleton key={i} />)}
      </div>
    </div>
  )
}
