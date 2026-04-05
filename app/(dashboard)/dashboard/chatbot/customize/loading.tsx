import { CinematicSkeleton } from "@/components/ui/loading-skeleton";

export default function CustomizeLoading() {
  return (
    <div className="py-8 md:py-12">
      <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-8">
        {/* Header skeleton */}
        <div>
          <CinematicSkeleton className="h-9 w-44 mb-2 rounded-lg" />
          <CinematicSkeleton variant="text" className="w-80 rounded-full" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Form card skeleton */}
          <div className="rounded-3xl bg-white shadow-[0_4px_6px_-1px_rgba(45,58,49,0.05)] p-6 md:p-8 space-y-6">
            {/* Chatbot Name field */}
            <div className="space-y-2">
              <CinematicSkeleton variant="text" className="w-28 rounded-full" />
              <CinematicSkeleton className="h-12 w-full rounded-full" />
            </div>

            {/* Welcome Message field */}
            <div className="space-y-2">
              <CinematicSkeleton variant="text" className="w-36 rounded-full" />
              <CinematicSkeleton className="h-24 w-full rounded-xl" />
            </div>

            {/* Fallback Message field */}
            <div className="space-y-2">
              <CinematicSkeleton variant="text" className="w-36 rounded-full" />
              <CinematicSkeleton variant="text" className="w-56 rounded-full" />
              <CinematicSkeleton className="h-24 w-full rounded-xl" />
            </div>

            {/* Brand Color field */}
            <div className="space-y-2">
              <CinematicSkeleton variant="text" className="w-24 rounded-full" />
              <div className="flex items-center gap-4">
                <CinematicSkeleton className="w-10 h-10 rounded-full" />
                <CinematicSkeleton variant="text" className="w-20 rounded-full" />
              </div>
            </div>

            {/* Save button */}
            <CinematicSkeleton className="h-11 w-40 rounded-full" />
          </div>

          {/* Live Preview skeleton */}
          <div className="space-y-3">
            <CinematicSkeleton variant="text" className="w-24 rounded-full" />
            <div className="rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(45,58,49,0.12)] w-full max-w-sm mx-auto">
              {/* Chat header */}
              <div className="px-5 py-4 flex items-center gap-3 bg-[#DCCFC2]/30">
                <CinematicSkeleton className="w-8 h-8 rounded-full" />
                <CinematicSkeleton variant="text" className="w-24 rounded-full" />
              </div>
              {/* Chat body */}
              <div className="bg-white px-4 py-5 space-y-3 min-h-[180px]">
                <div className="flex items-start gap-2">
                  <CinematicSkeleton className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5" />
                  <div className="space-y-1.5 flex-1 max-w-[80%]">
                    <CinematicSkeleton variant="text" className="w-full rounded-full" />
                    <CinematicSkeleton variant="text" className="w-3/4 rounded-full" />
                  </div>
                </div>
              </div>
              {/* Chat input */}
              <div className="bg-white border-t border-[#F2F0EB] px-4 py-3 flex items-center gap-2">
                <CinematicSkeleton className="flex-1 h-8 rounded-full" />
                <CinematicSkeleton className="w-8 h-8 rounded-full flex-shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
