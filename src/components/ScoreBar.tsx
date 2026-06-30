export default function ScoreBar({ score, max = 14 }: { score: number; max?: number }) {
  const pct = Math.min(100, (score / max) * 100)
  const color = pct >= 70
    ? 'from-emerald-500 to-emerald-400'
    : pct >= 40
    ? 'from-amber-500 to-amber-400'
    : 'from-red-600 to-red-500'

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-zinc-400 tabular-nums w-10 text-right">
        {score}<span className="text-zinc-700">/{max}</span>
      </span>
    </div>
  )
}
