export default function UpcomingAppointmentsSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
      </div>

      <div className="p-5 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-slate-200 p-4 animate-pulse"
          >
            <div className="h-9 w-16 rounded bg-slate-200" />

            <div className="space-y-2 flex-1">
              <div className="h-3 w-40 bg-slate-200 rounded" />
              <div className="h-3 w-28 bg-slate-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}