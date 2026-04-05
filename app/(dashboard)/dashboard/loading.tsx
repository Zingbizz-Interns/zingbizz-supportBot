import { CinematicSkeleton } from "@/components/ui/loading-skeleton";

export default function DashboardLoading() {
  return (
    <div className="py-8 md:py-12">
      <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-8">
        {/* Welcome heading skeleton */}
        <div>
          <CinematicSkeleton className="h-9 w-72 mb-2 rounded-lg" />
          <CinematicSkeleton variant="text" className="w-64 rounded-full" />
        </div>

        {/* Training status card skeleton */}
        <div className="rounded-3xl bg-white shadow-[0_4px_6px_-1px_rgba(45,58,49,0.05)] p-6 relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <CinematicSkeleton variant="text" className="w-24 rounded-full" />
              <CinematicSkeleton className="h-7 w-56 rounded-lg" />
              <CinematicSkeleton variant="text" className="w-72 mt-1 rounded-full" />
            </div>
            <CinematicSkeleton className="w-20 h-7 rounded-full flex-shrink-0" />
          </div>
          <div className="mt-6 pt-4 border-t border-[#E6E2DA]/50">
            <CinematicSkeleton variant="text" className="w-32 rounded-full" />
          </div>
        </div>

        {/* Quick Actions skeleton */}
        <div>
          <CinematicSkeleton variant="text" className="w-28 mb-4 rounded-full" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-3xl bg-white shadow-[0_4px_6px_-1px_rgba(45,58,49,0.05)] p-6"
              >
                <CinematicSkeleton className="w-10 h-10 rounded-2xl mb-4" />
                <CinematicSkeleton className="h-6 w-28 rounded-lg mb-2" />
                <CinematicSkeleton variant="text" className="w-full rounded-full mb-1" />
                <CinematicSkeleton variant="text" className="w-4/5 rounded-full" />
                <div className="mt-4">
                  <CinematicSkeleton variant="text" className="w-12 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
