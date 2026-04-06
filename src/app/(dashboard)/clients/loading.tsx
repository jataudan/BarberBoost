function CardSkeleton() {
  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/[0.06] flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-white/[0.06] rounded w-3/4" />
          <div className="h-2.5 bg-white/[0.04] rounded w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="h-8 bg-white/[0.04] rounded-lg" />
        <div className="h-8 bg-white/[0.04] rounded-lg" />
      </div>
    </div>
  )
}

export default function ClientsLoading() {
  return (
    <div className="space-y-5 max-w-[1600px]">
      <div className="flex items-start justify-between gap-4 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-white/[0.06] rounded-lg" />
          <div className="h-3 w-20 bg-white/[0.04] rounded" />
        </div>
        <div className="h-9 w-28 bg-white/[0.06] rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  )
}
