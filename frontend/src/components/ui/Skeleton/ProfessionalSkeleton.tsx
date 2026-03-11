export default function ProfessionalSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 animate-pulse">
      <div className="flex items-start gap-3.5">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-xl bg-slate-200 shrink-0" />

        <div className="flex-1">
          {/* Name */}
          <div className="h-4 w-32 bg-slate-200 rounded mb-2" />

          {/* Subtitle */}
          <div className="h-3 w-24 bg-slate-200 rounded" />
        </div>
      </div>

      {/* Divider */}
      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
        <div className="h-3 w-36 bg-slate-200 rounded" />
        <div className="h-3 w-44 bg-slate-200 rounded" />
      </div>

      {/* Footer */}
      <div className="mt-4 flex justify-between items-center">
        <div className="h-3 w-20 bg-slate-200 rounded" />
        <div className="h-3 w-16 bg-slate-200 rounded" />
      </div>
    </div>
  );
}