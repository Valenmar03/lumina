export default function DashboardSideSkeleton() {
  return (
    <div className="space-y-4">
      {/* Servicios populares */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm animate-pulse">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="h-4 w-32 bg-slate-200 rounded" />
        </div>

        <div className="p-5 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-3 w-32 bg-slate-200 rounded" />
              <div className="h-5 w-12 bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Equipo activo */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm animate-pulse">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="h-4 w-28 bg-slate-200 rounded" />
        </div>

        <div className="p-5 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-200" />
                <div className="h-3 w-28 bg-slate-200 rounded" />
              </div>

              <div className="h-3 w-10 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}