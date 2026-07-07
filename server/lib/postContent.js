function fmtMoney(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n}`
}

export function generatePostText({ kpi, products = [], regions = [] }) {
  const topProduct = [...products].sort((a, b) => b.revenue - a.revenue)[0]
  const topRegion = [...regions].sort((a, b) => b.value - a.value)[0]

  const lines = [
    '📊 Daily Sales Snapshot',
    '',
    `💰 Revenue: ${fmtMoney(kpi.revenue)}`,
    `🛒 Orders: ${kpi.orders.toLocaleString()}`,
    `📈 Conversion: ${kpi.conversion}%`,
  ]
  if (topProduct) lines.push(`🏆 Top product: ${topProduct.name} (${fmtMoney(topProduct.revenue)})`)
  if (topRegion) lines.push(`🌍 Leading region: ${topRegion.name} (${topRegion.value}%)`)
  lines.push('', '#Sales #Analytics #SalesIQ')

  return lines.join('\n')
}
