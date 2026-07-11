export default function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return (
    <span className="inline-flex items-center gap-1.5 text-gray-400 text-xs font-medium px-2.5 py-1 rounded-full border border-gray-200 bg-white">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
      No streak
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200
      text-amber-700 text-sm font-semibold px-3 py-1 rounded-full">
      🔥 {streak}-day streak
    </span>
  )
}
