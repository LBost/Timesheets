import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
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
  lockedByInvoiceId: bigint('locked_by_invoice_id', { mode: 'number' }),
  lockedAt: timestamp('locked_at', { mode: 'date', withTimezone: true }),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const taxRates = pgTable(
  'tax_rates',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid('user_id').notNull(),
    code: text('code').notNull(),
    label: text('label').notNull(),
    percentage: integer('percentage').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('tax_rates_user_code_unique').on(table.userId, table.code),
    check('tax_rates_percentage_check', sql`${table.percentage} >= 0 and ${table.percentage} <= 10000`),
  ]
);

export const invoices = pgTable(
  'invoices',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid('user_id').notNull(),
    clientId: bigint('client_id', { mode: 'number' })
      .notNull()
      .references(() => clients.id, { onDelete: 'restrict' }),
    invoiceNumber: text('invoice_number').notNull(),
    status: text('status').notNull().default('concept'),
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    issueDate: date('issue_date').notNull(),
    subtotalNet: integer('subtotal_net').notNull(),
    totalTax: integer('total_tax').notNull(),
    totalGross: integer('total_gross').notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
    openedAt: timestamp('opened_at', { mode: 'date', withTimezone: true }),
    paidAt: timestamp('paid_at', { mode: 'date', withTimezone: true }),
    creditedAt: timestamp('credited_at', { mode: 'date', withTimezone: true }),
  },
  (table) => [
    uniqueIndex('invoices_user_invoice_number_unique').on(table.userId, table.invoiceNumber),
    check(
      'invoices_status_check',
      sql`${table.status} in ('concept', 'proforma', 'open', 'paid', 'credited')`
    ),
  ]
);

export const invoiceLineItems = pgTable('invoice_line_items', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  userId: uuid('user_id').notNull(),
  invoiceId: bigint('invoice_id', { mode: 'number' })
    .notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),
  timeEntryId: bigint('time_entry_id', { mode: 'number' })
    .notNull()
    .references(() => timeEntries.id, { onDelete: 'restrict' }),
  projectId: bigint('project_id', { mode: 'number' })
    .notNull()
    .references(() => projects.id, { onDelete: 'restrict' }),
  orderId: bigint('order_id', { mode: 'number' }).references(() => orders.id, {
    onDelete: 'restrict',
  }),
  description: text('description'),
  workDate: date('work_date').notNull(),
  hours: integer('hours').notNull(),
  unitRate: integer('unit_rate').notNull(),
  lineNet: integer('line_net').notNull(),
  taxRateId: bigint('tax_rate_id', { mode: 'number' })
    .notNull()
    .references(() => taxRates.id, { onDelete: 'restrict' }),
  taxCodeSnapshot: text('tax_code_snapshot').notNull(),
  taxLabelSnapshot: text('tax_label_snapshot').notNull(),
  taxPercentageSnapshot: integer('tax_percentage_snapshot').notNull(),
  taxAmount: integer('tax_amount').notNull(),
  lineGross: integer('line_gross').notNull(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const activityLogs = pgTable(
  'activity_logs',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid('user_id').notNull(),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: bigint('entity_id', { mode: 'number' }),
    summary: text('summary').notNull(),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('activity_logs_user_created_at_idx').on(table.userId, table.createdAt)]
);

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

export type NewTaxRate = typeof taxRates.$inferInsert;
export type TaxRate = typeof taxRates.$inferSelect;

export type NewInvoice = typeof invoices.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;

export type NewInvoiceLineItem = typeof invoiceLineItems.$inferInsert;
export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;

export type NewActivityLog = typeof activityLogs.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;

export type NewSettings = typeof settings.$inferInsert;
export type Settings = typeof settings.$inferSelect;
