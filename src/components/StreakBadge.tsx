export default function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return <span className="text-gray-500 text-sm">No streak</span>
  return (
    <span className="inline-flex items-center gap-1 bg-amber-900/40 border border-amber-700/50 text-amber-400 text-sm font-semibold px-2.5 py-0.5 rounded-full">
      🔥 {streak}-day streak
    </span>
  )
}
