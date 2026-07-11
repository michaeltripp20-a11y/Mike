export default function ScoreBar({ score, max = 14 }: { score: number; max?: number }) {
  const pct = Math.min(100, (score / max) * 100)
  const color = pct >= 70
    ? 'from-indigo-500 to-blue-400'
    : pct >= 40
    ? 'from-amber-500 to-amber-400'
    : 'from-red-500 to-red-400'

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-500 tabular-nums w-10 text-right">
        {score}<span className="text-gray-300">/{max}</span>
      </span>
    </div>
  )
}
