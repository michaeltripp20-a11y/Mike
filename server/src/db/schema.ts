import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core'

export const stores = sqliteTable('stores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
})

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['leader', 'manager'] }).notNull().default('leader'),
  storeId: integer('store_id').notNull().default(1),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const days = sqliteTable('days', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  date: text('date').notNull(),         // YYYY-MM-DD
  dailyNumber: real('daily_number'),
  status: text('status', { enum: ['open', 'paced', 'closed'] }).notNull().default('open'),
  streak: integer('streak').notNull().default(0),
  paceNote: text('pace_note'),
  overallOutcome: text('overall_outcome', { enum: ['hit', 'partial', 'miss'] }),
  scorePoints: integer('score_points'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const commitments = sqliteTable('commitments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dayId: integer('day_id').notNull(),
  text: text('text').notNull(),
  outcome: text('outcome', { enum: ['hit', 'partial', 'miss'] }),
})

export const coachingNotes = sqliteTable('coaching_notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dayId: integer('day_id').notNull(),
  managerId: integer('manager_id').notNull(),
  leaderId: integer('leader_id').notNull(),
  focusArea: text('focus_area', {
    enum: ['floor_presence', 'team_development', 'execution', 'customer_engagement', 'priority_setting'],
  }).notNull(),
  observation: text('observation').notNull(),
  agreedActions: text('agreed_actions').notNull(),
  followUpDate: text('follow_up_date'),         // YYYY-MM-DD, optional
  followUpStatus: text('follow_up_status', { enum: ['pending', 'complete'] }).default('pending'),
  followUpResolution: text('follow_up_resolution'),
  resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})
