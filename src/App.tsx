import { useState, useEffect, useRef } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  generateInitialKPI, generateInitialRevenueHistory, generateInitialTransactions,
  generateInitialProductStats, generateInitialRegionStats,
  generateTransaction, newRevenuePoint,
  type KPI, type Transaction, type RevenuePoint, type ProductStat, type RegionStat,
  randomBetween,
} from './data'
import PostAutomation from './PostAutomation'

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n}`
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 80
  const h = 32
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((v - min) / range) * h
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

function Badge({ pct }: { pct: number }) {
  const up = pct >= 0
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${up ? 'bg-emerald-900/60 text-emerald-400' : 'bg-red-900/60 text-red-400'}`}>
      {up ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

function KPICard({
  title, value, sub, trend, color, pct,
}: {
  title: string; value: string; sub?: string; trend: number[]; color: string; pct: number
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</span>
        <Badge pct={pct} />
      </div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-3xl font-bold text-white">{value}</div>
          {sub && <div className="text-gray-500 text-xs mt-1">{sub}</div>}
        </div>
        <Sparkline data={trend} color={color} />
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: Transaction['status'] }) {
  const map: Record<string, string> = {
    completed: 'bg-emerald-900/50 text-emerald-400',
    pending: 'bg-yellow-900/50 text-yellow-400',
    refunded: 'bg-red-900/50 text-red-400',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${map[status]}`}>
      {status}
    </span>
  )
}

export default function App() {
  const [now, setNow] = useState(new Date())
  const [kpi, setKpi] = useState<KPI>(generateInitialKPI)
  const [revenue, setRevenue] = useState<RevenuePoint[]>(generateInitialRevenueHistory)
  const [transactions, setTransactions] = useState<Transaction[]>(generateInitialTransactions)
  const [products, setProducts] = useState<ProductStat[]>(generateInitialProductStats)
  const [regions] = useState<RegionStat[]>(generateInitialRegionStats)

  const kpiRef = useRef(kpi)
  kpiRef.current = kpi

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // New transaction every 3s
  useEffect(() => {
    const t = setInterval(() => {
      const tx = generateTransaction()
      setTransactions(prev => [tx, ...prev].slice(0, 10))
      // update product stats
      setProducts(prev => {
        return prev.map(p => {
          if (p.name === tx.product) {
            return { ...p, units: p.units + 1, revenue: p.revenue + tx.amount }
          }
          return p
        }).sort((a, b) => b.revenue - a.revenue)
      })
    }, 3000)
    return () => clearInterval(t)
  }, [])

  // Revenue chart + KPI every 5s
  useEffect(() => {
    const t = setInterval(() => {
      setRevenue(prev => {
        const next = newRevenuePoint(prev[prev.length - 1])
        return [...prev.slice(-29), next]
      })
      setKpi(prev => {
        const delta = randomBetween(-500, 1200)
        const newRev = prev.revenue + delta
        const newOrders = prev.orders + randomBetween(-2, 8)
        const newTrend = [...prev.revTrend.slice(-11), newRev / 4]
        const newOrdersTrend = [...prev.ordersTrend.slice(-11), newOrders / 10]
        return {
          revenue: newRev,
          orders: newOrders,
          avgOrder: Math.round(newRev / newOrders),
          conversion: Math.round((prev.conversion + (Math.random() * 0.2 - 0.1)) * 10) / 10,
          revTrend: newTrend,
          ordersTrend: newOrdersTrend,
        }
      })
    }, 5000)
    return () => clearInterval(t)
  }, [])

  const maxRevenue = Math.max(...products.map(p => p.revenue))

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 12L6 7L9 10L14 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-white">SalesIQ</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-gray-400 text-sm hidden sm:block">
              {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-gray-300 text-sm font-mono">{fmtTime(now)}</span>
            <div className="flex items-center gap-1.5 bg-emerald-900/40 border border-emerald-700/50 rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
              <span className="text-emerald-400 text-xs font-semibold">LIVE</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Revenue"
            value={fmt(kpi.revenue)}
            sub="Today"
            trend={kpi.revTrend}
            color="#10b981"
            pct={((kpi.revTrend[kpi.revTrend.length - 1] - kpi.revTrend[0]) / (kpi.revTrend[0] || 1)) * 100}
          />
          <KPICard
            title="Orders Today"
            value={kpi.orders.toLocaleString()}
            sub="All channels"
            trend={kpi.ordersTrend}
            color="#6366f1"
            pct={((kpi.ordersTrend[kpi.ordersTrend.length - 1] - kpi.ordersTrend[0]) / (kpi.ordersTrend[0] || 1)) * 100}
          />
          <KPICard
            title="Avg Order Value"
            value={fmt(kpi.avgOrder)}
            sub="Per transaction"
            trend={kpi.revTrend.map((v, i) => v / (kpi.ordersTrend[i] || 1))}
            color="#f59e0b"
            pct={2.4}
          />
          <KPICard
            title="Conversion Rate"
            value={`${kpi.conversion}%`}
            sub="Visitors → buyers"
            trend={[2.1, 2.3, 2.0, 2.4, 2.6, 2.5, 2.8, 2.7, 3.0, 2.9, kpi.conversion - 0.1, kpi.conversion]}
            color="#ec4899"
            pct={((kpi.conversion - 2.1) / 2.1) * 100}
          />
        </div>

        {/* Revenue Chart + Transactions */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white font-semibold text-lg">Revenue Over Time</h2>
                <p className="text-gray-500 text-sm">Last 30 minutes · updates every 5s</p>
              </div>
              <div className="flex gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><span className="w-3 h-1 bg-emerald-400 rounded inline-block"></span>Revenue</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenue} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  interval={4}
                  axisLine={{ stroke: '#374151' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                  width={48}
                />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '13px' }}
                  labelStyle={{ color: '#9ca3af' }}
                  itemStyle={{ color: '#10b981' }}
                  formatter={(v) => [fmt(Number(v)), 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#revGrad)"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Live Transactions */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-lg">Live Transactions</h2>
              <span className="text-xs text-gray-500">updates every 3s</span>
            </div>
            <div className="flex-1 space-y-2 overflow-hidden">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-300 shrink-0">
                    {tx.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{tx.name}</div>
                    <div className="text-xs text-gray-500 truncate">{tx.product}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-emerald-400">{fmt(tx.amount)}</div>
                    <StatusBadge status={tx.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Products + Region */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Top Products */}
          <div className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-lg">Top Products</h2>
              <span className="text-xs text-gray-500">by revenue</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left pb-3 font-medium">Product</th>
                  <th className="text-right pb-3 font-medium">Units</th>
                  <th className="text-right pb-3 font-medium">Revenue</th>
                  <th className="pb-3 w-32"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {products.map((p, i) => (
                  <tr key={p.name}>
                    <td className="py-3 flex items-center gap-2">
                      <span className="text-gray-500 text-xs w-4">{i + 1}</span>
                      <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: p.color }}></span>
                      <span className="text-white font-medium">{p.name}</span>
                    </td>
                    <td className="py-3 text-right text-gray-400">{p.units.toLocaleString()}</td>
                    <td className="py-3 text-right font-semibold" style={{ color: p.color }}>{fmt(p.revenue)}</td>
                    <td className="py-3 pl-4">
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${(p.revenue / maxRevenue) * 100}%`, background: p.color }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Region Pie */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-semibold text-lg mb-1">Sales by Region</h2>
            <p className="text-gray-500 text-sm mb-4">Revenue distribution</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={regions}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  isAnimationActive={false}
                >
                  {regions.map(r => (
                    <Cell key={r.name} fill={r.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '13px' }}
                  formatter={(v) => [`${v}%`, 'Share']}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span style={{ color: '#9ca3af', fontSize: '12px' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <PostAutomation kpi={kpi} products={products} regions={regions} />
      </main>
    </div>
  )
}
