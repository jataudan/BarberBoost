function ServiceCardSkeleton() {
  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 space-y-3 animate-pulse">
      <div className="h-0.5 rounded-t-xl bg-white/[0.06] -mx-4 -mt-4 mb-3" />
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-white/[0.06] rounded w-2/3" />
          <div className="h-2.5 bg-white/[0.04] rounded w-1/2" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="h-2.5 w-16 bg-white/[0.04] rounded" />
        <div className="h-4 w-12 bg-white/[0.06] rounded" />
      </div>
      <div className="h-px bg-white/[0.04]" />
      <div className="flex items-center justify-between">
        <div className="h-3 w-16 bg-white/[0.04] rounded" />
        <div className="flex gap-1">
          <div className="w-7 h-7 bg-white/[0.04] rounded-lg" />
          <div className="w-7 h-7 bg-white/[0.04] rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export default function ServicesLoading() {
  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-36 bg-white/[0.06] rounded-lg" />
          <div className="h-3 w-24 bg-white/[0.04] rounded" />
        </div>
        <div className="h-9 w-32 bg-white/[0.06] rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <ServiceCardSkeleton key={i} />)}
      </div>
    </div>
  )
}
