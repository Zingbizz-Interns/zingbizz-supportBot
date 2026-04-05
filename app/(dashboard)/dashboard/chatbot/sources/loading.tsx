import { CinematicSkeleton } from "@/components/ui/loading-skeleton";

export default function SourcesLoading() {
  return (
    <div className="py-8 md:py-12">
      <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-8">
        {/* Header with button */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CinematicSkeleton className="h-9 w-32 mb-2 rounded-lg" />
            <CinematicSkeleton variant="text" className="w-80 rounded-full" />
          </div>
          <CinematicSkeleton className="h-11 w-32 rounded-full" />
        </div>

        {/* Table skeleton */}
        <div className="rounded-3xl bg-white shadow-[0_4px_6px_-1px_rgba(45,58,49,0.05)] overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[56px_1fr_120px_90px_120px_64px] gap-4 px-6 py-4 bg-[#F9F8F4] border-b border-[#E6E2DA]">
            <div className="flex items-center justify-center">
              <CinematicSkeleton className="w-4 h-4 rounded" />
            </div>
            <CinematicSkeleton variant="text" className="w-16 rounded-full" />
            <CinematicSkeleton variant="text" className="w-14 rounded-full" />
            <CinematicSkeleton variant="text" className="w-16 rounded-full" />
            <CinematicSkeleton variant="text" className="w-14 rounded-full" />
            <span />
          </div>

          {/* Table rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col md:grid md:grid-cols-[56px_1fr_120px_90px_120px_64px] gap-3 md:gap-4 items-start md:items-center px-6 py-5 border-b border-[#E6E2DA] last:border-b-0"
            >
              <div className="flex items-center justify-center w-full md:w-auto">
                <CinematicSkeleton className="w-4 h-4 rounded" />
              </div>
              <div className="space-y-1 min-w-0 w-full">
                <CinematicSkeleton variant="text" className="rounded-full" style={{ width: `${60 + (i % 3) * 12}%` }} />
                <CinematicSkeleton variant="text" className="w-40 rounded-full !h-3" />
              </div>
              <CinematicSkeleton className="w-16 h-6 rounded-full" />
              <CinematicSkeleton variant="text" className="w-8 rounded-full" />
              <CinematicSkeleton variant="text" className="w-16 rounded-full" />
              <div className="flex justify-center w-full md:w-auto">
                <CinematicSkeleton className="w-9 h-9 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
