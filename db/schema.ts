import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const notifications = sqliteTable(
  'order_notifications',
  {
    id: text('id').primaryKey(),
    payloadHash: text('payload_hash').notNull(),
    customerName: text('customer_name').notNull(),
    contact: text('contact').notNull(),
    plan: text('plan').notNull(),
    months: integer('months').notNull(),
    amountSen: integer('amount_sen').notNull(),
    ipHash: text('ip_hash').notNull(),
    createdAt: integer('created_at').notNull(),
    state: text('state').notNull(),
    telegramMessageId: integer('telegram_message_id'),
  },
  (table) => [index('notice_ip_created').on(table.ipHash, table.createdAt)],
);
