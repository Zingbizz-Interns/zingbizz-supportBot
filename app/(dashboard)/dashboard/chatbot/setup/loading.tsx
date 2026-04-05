import { CinematicSkeleton } from "@/components/ui/loading-skeleton";

export default function SetupLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-6">
      {/* Header */}
      <div>
        <CinematicSkeleton className="h-9 w-64 mb-2 rounded-lg" />
        <CinematicSkeleton variant="text" className="w-80 rounded-full" />
      </div>

      {/* URL Scraping card skeleton */}
      <div className="rounded-3xl bg-white shadow-[0_4px_6px_-1px_rgba(45,58,49,0.05)] p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <CinematicSkeleton className="w-9 h-9 rounded-2xl" />
          <CinematicSkeleton variant="text" className="w-28 rounded-full" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <CinematicSkeleton className="flex-1 h-12 rounded-full" />
          <CinematicSkeleton className="h-12 w-36 rounded-full shrink-0" />
        </div>
      </div>

      {/* File Upload card skeleton */}
      <div className="rounded-3xl bg-white shadow-[0_4px_6px_-1px_rgba(45,58,49,0.05)] p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <CinematicSkeleton className="w-9 h-9 rounded-2xl" />
          <CinematicSkeleton variant="text" className="w-40 rounded-full" />
        </div>
        <CinematicSkeleton variant="text" className="w-3/4 rounded-full" />
        <CinematicSkeleton className="h-10 w-32 rounded-full" />
      </div>

      {/* Train button */}
      <div className="flex justify-end">
        <CinematicSkeleton className="h-12 w-40 rounded-full" />
      </div>
    </div>
  );
}
