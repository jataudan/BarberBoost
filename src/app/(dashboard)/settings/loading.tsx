function SettingsItemSkeleton() {
  return (
    <div className="flex items-center gap-4 bg-[#111111] border border-white/[0.06] rounded-2xl px-5 py-4 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-32 bg-white/[0.06] rounded" />
        <div className="h-2.5 w-56 bg-white/[0.04] rounded" />
      </div>
      <div className="w-4 h-4 bg-white/[0.04] rounded flex-shrink-0" />
    </div>
  )
}

export default function SettingsLoading() {
  return (
    <div className="space-y-8 max-w-2xl">
      <div className="space-y-2 animate-pulse">
        <div className="h-8 w-40 bg-white/[0.06] rounded-lg" />
        <div className="h-3 w-52 bg-white/[0.04] rounded" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <SettingsItemSkeleton key={i} />)}
      </div>
    </div>
  )
}
