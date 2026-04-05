import { CinematicSkeleton } from "@/components/ui/loading-skeleton";

export default function EmbedLoading() {
  return (
    <div className="py-8 md:py-12">
      <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-8">
        {/* Header skeleton */}
        <div>
          <CinematicSkeleton className="h-9 w-56 mb-2 rounded-lg" />
          <CinematicSkeleton variant="text" className="w-80 rounded-full" />
        </div>

        {/* Tabs skeleton */}
        <div className="bg-[#F2F0EB] rounded-full p-1 h-auto inline-flex gap-1 mb-6">
          {["HTML / JS", "React", "Next.js"].map((label) => (
            <div
              key={label}
              className="rounded-full px-5 py-2"
            >
              <CinematicSkeleton variant="text" className="w-16 rounded-full" />
            </div>
          ))}
        </div>

        {/* Code block card skeleton */}
        <div className="rounded-3xl bg-white shadow-[0_4px_6px_-1px_rgba(45,58,49,0.05)] p-6 md:p-8 space-y-6">
          {/* Description text */}
          <CinematicSkeleton variant="text" className="w-3/4 rounded-full" />

          {/* Code block */}
          <div className="rounded-2xl bg-[#2D3A31] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <CinematicSkeleton variant="text" className="w-12 rounded-full !bg-white/10" />
              <CinematicSkeleton className="w-20 h-7 rounded-full !bg-white/10" />
            </div>
            <div className="px-5 py-5 space-y-2.5">
              <CinematicSkeleton variant="text" className="w-5/6 rounded-full !bg-white/10" />
              <CinematicSkeleton variant="text" className="w-3/4 rounded-full !bg-white/10" />
              <CinematicSkeleton variant="text" className="w-4/5 rounded-full !bg-white/10" />
              <CinematicSkeleton variant="text" className="w-2/3 rounded-full !bg-white/10" />
            </div>
          </div>

          {/* Steps section */}
          <div className="space-y-3">
            <CinematicSkeleton variant="text" className="w-14 rounded-full" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CinematicSkeleton className="w-5 h-5 rounded-full flex-shrink-0" />
                  <CinematicSkeleton variant="text" className="w-full rounded-full" style={{ maxWidth: `${75 - i * 8}%` }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
