import { StatsCardSkeleton } from '@/components/dashboard/StatsCard'
import { TodayScheduleSkeleton } from '@/components/dashboard/TodaySchedule'
import { RevenueChartSkeleton } from '@/components/dashboard/RevenueChart'
import { TopServicesSkeleton } from '@/components/dashboard/TopServices'
import { BookingCalendarSkeleton } from '@/components/dashboard/BookingCalendar'

export default function DashboardLoading() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)}
      </div>
      <TodayScheduleSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3"><RevenueChartSkeleton /></div>
        <div className="lg:col-span-2"><TopServicesSkeleton /></div>
      </div>
      <BookingCalendarSkeleton />
    </div>
  )
}
