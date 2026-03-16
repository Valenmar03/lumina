

export default function DashboardStatSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm animate-pulse"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="h-8 w-12 bg-slate-200 rounded" />
              <div className="h-3 w-20 bg-slate-200 rounded" />
            </div>

            <div className="h-10 w-10 rounded-xl bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  )
}
