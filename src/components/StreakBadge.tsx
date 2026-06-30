export default function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return (
    <span className="inline-flex items-center gap-1.5 text-zinc-600 text-xs font-medium px-2.5 py-1 rounded-full border border-zinc-800">
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
      No streak
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-950/80 to-orange-950/60
      border border-amber-700/40 text-amber-300 text-sm font-semibold px-3 py-1 rounded-full shadow-sm shadow-amber-900/20">
      🔥 {streak}-day streak
    </span>
  )
}
