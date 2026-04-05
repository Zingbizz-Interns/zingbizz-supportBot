import { CinematicSkeleton } from "@/components/ui/loading-skeleton";

export default function InsightsLoading() {
  return (
    <div className="py-8 md:py-12">
      <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-8">
        {/* Header skeleton */}
        <div>
          <CinematicSkeleton className="h-9 w-32 mb-2 rounded-lg" />
          <CinematicSkeleton variant="text" className="w-64 rounded-full" />
        </div>

        {/* Stats cards skeleton — 3 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3xl bg-white shadow-[0_4px_6px_-1px_rgba(45,58,49,0.05)] p-6 flex items-start gap-4"
            >
              <CinematicSkeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <CinematicSkeleton variant="text" className="w-28 rounded-full" />
                <CinematicSkeleton className="h-8 w-16 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Chart skeleton */}
        <section className="space-y-4">
          <CinematicSkeleton variant="text" className="w-44 rounded-full" />
          <div className="rounded-3xl bg-white shadow-[0_4px_6px_-1px_rgba(45,58,49,0.05)] p-6">
            <div className="h-48 flex items-end justify-between gap-3 px-2">
              {Array.from({ length: 7 }).map((_, i) => {
                const heights = [60, 85, 45, 100, 70, 90, 55];
                return (
                  <div key={i} className="flex-1 flex gap-1 items-end">
                    <CinematicSkeleton
                      className="flex-1 rounded-t-sm"
                      style={{ height: `${heights[i]}%` }}
                    />
                    <CinematicSkeleton
                      className="flex-1 rounded-t-sm"
                      style={{ height: `${heights[i] * 0.65}%` }}
                    />
                  </div>
                );
              })}
            </div>
            {/* X-axis labels */}
            <div className="flex justify-between mt-3 px-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <CinematicSkeleton key={i} variant="text" className="w-10 rounded-full !h-3" />
              ))}
            </div>
          </div>
        </section>

        {/* Top Questions table skeleton */}
        <section className="space-y-4">
          <CinematicSkeleton variant="text" className="w-32 rounded-full" />
          <div className="rounded-3xl bg-white shadow-[0_4px_6px_-1px_rgba(45,58,49,0.05)] overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[1fr_80px_120px] gap-4 px-6 py-3 bg-[#F9F8F4] border-b border-[#E6E2DA]">
              <CinematicSkeleton variant="text" className="w-16 rounded-full" />
              <CinematicSkeleton variant="text" className="w-12 rounded-full" />
              <CinematicSkeleton variant="text" className="w-14 rounded-full" />
            </div>
            {/* Table rows */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_80px_120px] gap-4 items-center px-6 py-4 border-b border-[#E6E2DA] last:border-b-0"
              >
                <CinematicSkeleton variant="text" className="rounded-full" style={{ width: `${55 + (i % 4) * 10}%` }} />
                <CinematicSkeleton variant="text" className="w-8 rounded-full" />
                <CinematicSkeleton className="w-20 h-6 rounded-full" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
