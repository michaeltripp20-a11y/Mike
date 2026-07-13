import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import type { Post } from '../types'
import { PLATFORMS } from '../data'
import { Card, PlatformTag, StatusBadge, fmtDateTime } from './shared'

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="flex flex-col gap-2">
      <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">{label}</span>
      <div className="text-3xl font-bold text-white">{value}</div>
      {sub && <div className="text-gray-500 text-xs">{sub}</div>}
    </Card>
  )
}

export function Dashboard({ posts }: { posts: Post[] }) {
  const scheduled = posts.filter(p => p.status === 'scheduled')
  const postedPosts = posts.filter(p => p.status === 'posted')
  const failed = posts.filter(p => p.status === 'failed')

  const totalEngagement = postedPosts.reduce(
    (sum, p) => sum + (p.engagement ? p.engagement.likes + p.engagement.comments + p.engagement.shares : 0),
    0
  )
  const avgEngagement = postedPosts.length ? Math.round(totalEngagement / postedPosts.length) : 0

  const engagementSeries = [...postedPosts]
    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
    .map(p => ({
      label: new Date(p.scheduledFor).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      engagement: (p.engagement?.likes ?? 0) + (p.engagement?.comments ?? 0) + (p.engagement?.shares ?? 0),
    }))

  const mix = PLATFORMS.map(pl => ({
    name: pl.label,
    color: pl.color,
    value: posts.filter(p => p.platform === pl.id).length,
  })).filter(m => m.value > 0)

  const upcoming = [...scheduled]
    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Scheduled" value={String(scheduled.length)} sub="Upcoming posts" />
        <StatCard label="Published" value={String(postedPosts.length)} sub="All time (demo data)" />
        <StatCard label="Avg. Engagement" value={avgEngagement.toLocaleString()} sub="Likes + comments + shares" />
        <StatCard label="Needs Attention" value={String(failed.length)} sub="Failed sends" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-white font-semibold text-lg mb-1">Engagement Over Time</h2>
          <p className="text-gray-500 text-sm mb-4">Total interactions per published post</p>
          {engagementSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={engagementSeries} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={{ stroke: '#374151' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '13px' }}
                  labelStyle={{ color: '#9ca3af' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Area type="monotone" dataKey="engagement" stroke="#10b981" strokeWidth={2} fill="url(#engGrad)" dot={{ r: 3 }} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-gray-500 text-sm py-16 text-center">No published posts yet.</div>
          )}
        </div>

        <Card>
          <h2 className="text-white font-semibold text-lg mb-1">Platform Mix</h2>
          <p className="text-gray-500 text-sm mb-4">Posts by platform</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={mix} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" isAnimationActive={false}>
                {mix.map(m => <Cell key={m.name} fill={m.color} stroke="transparent" />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '13px' }} />
              <Legend iconType="circle" iconSize={8} formatter={value => <span style={{ color: '#9ca3af', fontSize: '12px' }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h2 className="text-white font-semibold text-lg mb-4">Upcoming Posts</h2>
        {upcoming.length === 0 ? (
          <div className="text-gray-500 text-sm py-6 text-center">Nothing scheduled. Head to Composer to plan a post.</div>
        ) : (
          <div className="space-y-2">
            {upcoming.map(p => (
              <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                <PlatformTag platform={p.platform} />
                <div className="flex-1 min-w-0 text-sm text-gray-300 truncate">{p.content}</div>
                <div className="text-xs text-gray-500 shrink-0">{fmtDateTime(p.scheduledFor)}</div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
