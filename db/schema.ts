import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const clients = sqliteTable('clients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  email: text('email'),
  phone: text('phone'),
  /** CSS hex e.g. #6366f1; distinguishes clients on time-entry views. */
  accentColor: text('accent_color'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull()
});

export const projects = sqliteTable(
  'projects',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    code: text('code').notNull(),
    name: text('name').notNull(),
    unitRate: integer('unit_rate').notNull(),
    unit: text('unit').notNull().default('hours'),
    currency: text('currency').notNull().default('EUR'),
    billingModel: text('billing_model'),
    useOrders: integer('use_orders', { mode: 'boolean' }).notNull().default(false),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    clientId: integer('client_id')
      .notNull()
      .references(() => clients.id),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .$defaultFn(() => new Date())
      .notNull()
  },
  (table) => [uniqueIndex('projects_client_code_unique').on(table.clientId, table.code)]
);

export const orders = sqliteTable(
  'orders',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    code: text('code').notNull(),
    title: text('title').notNull(),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .$defaultFn(() => new Date())
      .notNull()
  },
  (table) => [uniqueIndex('orders_project_code_unique').on(table.projectId, table.code)]
);

export const timeEntries = sqliteTable('time_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workDate: text('date').notNull(),
  project: text('project').notNull(),
  projectId: integer('project_id').references(() => projects.id),
  orderId: integer('order_id').references(() => orders.id),
  description: text('description'),
  hours: integer('hours').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull()
});

export type NewTimeEntry = typeof timeEntries.$inferInsert;
export type TimeEntry = typeof timeEntries.$inferSelect;

export type NewClient = typeof clients.$inferInsert;
export type Client = typeof clients.$inferSelect;

export type NewProject = typeof projects.$inferInsert;
export type Project = typeof projects.$inferSelect;

export type NewOrder = typeof orders.$inferInsert;
export type Order = typeof orders.$inferSelect;
