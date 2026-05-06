import {
  bigint,
  boolean,
  check,
  date,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * `user_id` references `auth.users(id)` in Supabase. The foreign key + ON DELETE CASCADE
 * are applied via a raw SQL companion migration (see db/policies.sql) since the auth
 * schema is owned by Supabase.
 */

export const clients = pgTable(
  'clients',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid('user_id').notNull(),
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    /** CSS hex e.g. #6366f1; distinguishes clients on time-entry views. */
    accentColor: text('accent_color'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex('clients_user_name_unique').on(table.userId, table.name)]
);

export const projects = pgTable(
  'projects',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid('user_id').notNull(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    unitRate: integer('unit_rate').notNull(),
    unit: text('unit').notNull().default('hours'),
    currency: text('currency').notNull().default('EUR'),
    billingModel: text('billing_model'),
    useOrders: boolean('use_orders').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    clientId: bigint('client_id', { mode: 'number' })
      .notNull()
      .references(() => clients.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('projects_user_client_code_unique').on(table.userId, table.clientId, table.code),
  ]
);

export const orders = pgTable(
  'orders',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid('user_id').notNull(),
    code: text('code').notNull(),
    title: text('title').notNull(),
    projectId: bigint('project_id', { mode: 'number' })
      .notNull()
      .references(() => projects.id, { onDelete: 'restrict' }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('orders_user_project_code_unique').on(table.userId, table.projectId, table.code),
  ]
);

export const timeEntries = pgTable('time_entries', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  userId: uuid('user_id').notNull(),
  workDate: date('date').notNull(),
  clientId: bigint('client_id', { mode: 'number' })
    .notNull()
    .references(() => clients.id, { onDelete: 'restrict' }),
  projectId: bigint('project_id', { mode: 'number' })
    .notNull()
    .references(() => projects.id, { onDelete: 'restrict' }),
  orderId: bigint('order_id', { mode: 'number' }).references(() => orders.id, {
    onDelete: 'restrict',
  }),
  description: text('description'),
  hours: integer('hours').notNull(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const settings = pgTable(
  'settings',
  {
    userId: uuid('user_id').primaryKey(),
    nextInvoiceNumber: text('next_invoice_number').notNull(),
    preferredTimeEntriesView: text('preferred_time_entries_view').notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      'settings_preferred_view_check',
      sql`${table.preferredTimeEntriesView} in ('month', 'week')`
    ),
  ]
);

export type NewTimeEntry = typeof timeEntries.$inferInsert;
export type TimeEntry = typeof timeEntries.$inferSelect;

export type NewClient = typeof clients.$inferInsert;
export type Client = typeof clients.$inferSelect;

export type NewProject = typeof projects.$inferInsert;
export type Project = typeof projects.$inferSelect;

export type NewOrder = typeof orders.$inferInsert;
export type Order = typeof orders.$inferSelect;

export type NewSettings = typeof settings.$inferInsert;
export type Settings = typeof settings.$inferSelect;
