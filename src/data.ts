export const FIRST_NAMES = [
  'Emma','Liam','Olivia','Noah','Ava','Ethan','Sophia','Mason',
  'Isabella','William','Mia','James','Charlotte','Oliver','Amelia',
  'Benjamin','Harper','Elijah','Evelyn','Lucas','Abigail','Michael',
  'Emily','Alexander','Elizabeth','Daniel','Mila','Henry','Ella',
  'Jackson','Scarlett','Sebastian','Grace','Aiden','Chloe','Matthew',
]

export const LAST_NAMES = [
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller',
  'Davis','Wilson','Moore','Taylor','Anderson','Thomas','Jackson',
  'White','Harris','Martin','Thompson','Martinez','Robinson',
]

export const PRODUCTS = [
  { name: 'Pro Plan', price: 299, color: '#10b981' },
  { name: 'Enterprise Suite', price: 899, color: '#6366f1' },
  { name: 'Starter Pack', price: 49, color: '#f59e0b' },
  { name: 'Analytics Add-on', price: 149, color: '#3b82f6' },
  { name: 'API Access', price: 199, color: '#ec4899' },
  { name: 'Team Seats (5)', price: 399, color: '#8b5cf6' },
  { name: 'White Label', price: 1299, color: '#14b8a6' },
]

export const REGIONS = [
  { name: 'North America', color: '#10b981' },
  { name: 'Europe', color: '#6366f1' },
  { name: 'Asia Pacific', color: '#f59e0b' },
  { name: 'Latin America', color: '#3b82f6' },
  { name: 'Middle East', color: '#ec4899' },
]

export const STATUSES = ['completed', 'completed', 'completed', 'pending', 'refunded'] as const
export type TxStatus = typeof STATUSES[number]

export interface Transaction {
  id: string
  name: string
  product: string
  amount: number
  status: TxStatus
  time: Date
  region: string
}

export interface RevenuePoint {
  time: string
  revenue: number
  orders: number
}

export interface ProductStat {
  name: string
  units: number
  revenue: number
  color: string
}

export interface RegionStat {
  name: string
  value: number
  color: string
}

export interface KPI {
  revenue: number
  orders: number
  avgOrder: number
  conversion: number
  revTrend: number[]
  ordersTrend: number[]
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomName() {
  const fn = FIRST_NAMES[randomBetween(0, FIRST_NAMES.length - 1)]
  const ln = LAST_NAMES[randomBetween(0, LAST_NAMES.length - 1)]
  return `${fn} ${ln}`
}

function formatTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function generateTransaction(): Transaction {
  const product = PRODUCTS[randomBetween(0, PRODUCTS.length - 1)]
  const region = REGIONS[randomBetween(0, REGIONS.length - 1)]
  const variance = (Math.random() * 0.4 - 0.2)
  const amount = Math.round(product.price * (1 + variance))
  const status = STATUSES[randomBetween(0, STATUSES.length - 1)]
  return {
    id: Math.random().toString(36).slice(2),
    name: randomName(),
    product: product.name,
    amount,
    status,
    time: new Date(),
    region: region.name,
  }
}

export function generateInitialRevenueHistory(): RevenuePoint[] {
  const now = new Date()
  const points: RevenuePoint[] = []
  let base = 8000
  for (let i = 29; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 60000)
    base += randomBetween(-200, 400)
    points.push({
      time: formatTime(t),
      revenue: Math.max(1000, base),
      orders: randomBetween(3, 25),
    })
  }
  return points
}

export function newRevenuePoint(last: RevenuePoint): RevenuePoint {
  const prev = last.revenue
  const delta = randomBetween(-150, 500)
  return {
    time: formatTime(new Date()),
    revenue: Math.max(500, prev + delta),
    orders: randomBetween(3, 25),
  }
}

export function generateInitialProductStats(): ProductStat[] {
  return PRODUCTS.slice(0, 5).map(p => ({
    name: p.name,
    units: randomBetween(20, 200),
    revenue: randomBetween(5000, 80000),
    color: p.color,
  })).sort((a, b) => b.revenue - a.revenue)
}

export function generateInitialRegionStats(): RegionStat[] {
  const total = 100
  const vals = REGIONS.map((r, i) => ({ name: r.name, color: r.color, raw: randomBetween(5, 40) }))
  const sum = vals.reduce((s, v) => s + v.raw, 0)
  return vals.map(v => ({ name: v.name, color: v.color, value: Math.round((v.raw / sum) * total) }))
}

export function generateInitialKPI(): KPI {
  const revenue = randomBetween(42000, 58000)
  const orders = randomBetween(180, 320)
  return {
    revenue,
    orders,
    avgOrder: Math.round(revenue / orders),
    conversion: Math.round((Math.random() * 3 + 2) * 10) / 10,
    revTrend: Array.from({ length: 12 }, () => randomBetween(5000, 15000)),
    ordersTrend: Array.from({ length: 12 }, () => randomBetween(15, 35)),
  }
}

export function generateInitialTransactions(): Transaction[] {
  const txs: Transaction[] = []
  for (let i = 0; i < 10; i++) {
    const tx = generateTransaction()
    tx.time = new Date(Date.now() - randomBetween(10000, 300000))
    txs.push(tx)
  }
  return txs.sort((a, b) => b.time.getTime() - a.time.getTime())
}

export { formatTime, randomBetween }
