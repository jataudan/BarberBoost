function ChartSkeleton({ height = 'h-48' }: { height?: string }) {
  return (
    <div className={`bg-[#111111] border border-white/[0.06] rounded-xl ${height} animate-pulse`} />
  )
}

function StatSkeleton() {
  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 space-y-3 animate-pulse">
      <div className="h-2.5 w-24 bg-white/[0.06] rounded" />
      <div className="h-8 w-28 bg-white/[0.08] rounded" />
      <div className="h-2 w-16 bg-white/[0.04] rounded" />
    </div>
  )
}

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4 animate-pulse">
        <div className="h-8 w-36 bg-white/[0.06] rounded-lg" />
        <div className="h-9 w-40 bg-white/[0.06] rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><ChartSkeleton height="h-64" /></div>
        <ChartSkeleton height="h-64" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartSkeleton height="h-56" />
        <ChartSkeleton height="h-56" />
      </div>
    </div>
  )
}
