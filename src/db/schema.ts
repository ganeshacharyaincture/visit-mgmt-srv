import { sql } from 'drizzle-orm';
import { pgTable, serial, text, boolean, timestamp, integer, bigint, check, unique, index, jsonb } from 'drizzle-orm/pg-core';

export const todos = pgTable('todos', {
  id: serial('id').primaryKey(),
  task: text('task').notNull(),
  completed: boolean('completed').default(false),
});

export const hospitals = pgTable('hospitals', {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  timezone: text('time_zone').notNull().default('UTC'),
  createdAt: timestamp('created_at').notNull()
});

export const location_units = pgTable('location_units', {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  hospitalId: bigint("hospital_id", { mode: "number" }).references(() => hospitals.id, { onDelete: "cascade" }).notNull(),
  parent_id: bigint("parent_id", { mode: "number" }).references(() => location_units.id, { onDelete: "cascade" }),
  unit_type: text('unit_type').notNull(),
  name: text('name').notNull(),
  code: text('code'),
  is_active: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  check('unit_type_check', sql`${table.unit_type} IN ('building', 'floor', 'ward', 'room', 'bed')`),
  unique().on(table.hospitalId, table.parent_id, table.unit_type, table.name),
  index('idx_location_units_hospital').on(table.hospitalId),
  index('idx_location_units_parent').on(table.parent_id),
  index('idx_location_units_type').on(table.unit_type)
]);


export const visit_rule_sets = pgTable('visit_rule_sets', {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  location_unit_id: bigint("location_unit_id", { mode: "number" }).references(() => location_units.id, { onDelete: "cascade" }).notNull(),
  status: text('status').notNull().default('draft'),
  effectiveStart: timestamp('effective_start').notNull(),
  effectiveEnd: timestamp('effective_end'),
  priority: integer('priority').notNull().default(0),
  rules: jsonb('rules').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  superseeded_by_id: bigint("superseeded_by_id", { mode: "number" }).references(() => visit_rule_sets.id),
  superseededAt: timestamp('superseeded_at'),
}, (table) => [
  check('status_check', sql`${table.status} IN ('draft', 'active', 'superseded', 'cancelled')`),
  check('effective_end_after_start', sql`${table.effectiveEnd} IS NULL OR ${table.effectiveEnd} > ${table.effectiveStart}`),
  index('idx_visit_rule_sets_scope').on(table.location_unit_id),
  index('idx_visit_rule_sets_status').on(table.status),
  index('idx_visit_rule_sets_effective').on(table.effectiveStart, table.effectiveEnd)
]);

export const visit_rule_exceptions = pgTable('visit_rule_exceptions', {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  location_unit_id: bigint("location_unit_id", { mode: "number" }).references(() => location_units.id, { onDelete: "cascade" }).notNull(),
  status: text('status').notNull().default('active'),
  starts_at: timestamp('starts_at').notNull(),
  ends_at: timestamp('ends_at').notNull(),
  exception_type: text('exception_type').notNull(),
  rules: jsonb('rules'),
  reason: text('reason'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  superseeded_by_id: bigint("superseeded_by_id", { mode: "number" }).references(() => visit_rule_exceptions.id),
  superseededAt: timestamp('superseeded_at'),
}, (table) => [
  check('status_check', sql`${table.status} IN ('active', 'cancelled', 'superseeded')`),
  check('exception_type_check', sql`${table.exception_type} IN ('blackout', 'extra_open')`),
  check('ends_after_starts', sql`${table.ends_at} > ${table.starts_at}`),
  index("idx_visit_rule_exceptions_scope").on(table.location_unit_id),
  index('idx_visit_rule_exceptions_time').on(table.starts_at, table.ends_at)
]);

export const visit_slots = pgTable('visit_slots', {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  bed_id: bigint("bed_id", { mode: "number" }).references(() => location_units.id, { onDelete: "cascade" }).notNull(),
  starts_at: timestamp('starts_at').notNull(),
  ends_at: timestamp('ends_at').notNull(),
  status: text('status').notNull().default('open'),
  capacity: integer('capacity').notNull().default(1),
  source: jsonb('source'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  check('status_check', sql`${table.status} IN ('open', 'blocked')`),
  check('ends_after_starts', sql`${table.ends_at} > ${table.starts_at}`),
  unique().on(table.bed_id, table.starts_at, table.ends_at),
  index("idx_visit_slots_bed_time").on(table.bed_id, table.starts_at),
  index('idx_visit_slots_time').on(table.starts_at)
]);

export const visitors = pgTable('visitors', {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  full_name: text('full_name').notNull(),
  phone: text('phone'),
  email: text('email'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const visit_appointments = pgTable('visit_appointments', {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  visit_slot_id: bigint("visit_slot_id", { mode: "number" }).references(() => visit_slots.id, { onDelete: "restrict" }).notNull(),
  visitor_id: bigint("visitor_id", { mode: "number" }).references(() => visitors.id, { onDelete: "restrict" }).notNull(),
  status: text('status').notNull().default('booked'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  cancelledAt: timestamp('cancelled_at'),
  notes: text('notes'),
}, (table) => [
  check('status_check', sql`${table.status} IN ('requested', 'booked', 'cancelled', 'denied', 'no_show', 'completed')`),
  unique().on(table.visit_slot_id, table.status),
  index('uniq_visit_appointments_active_per_slot').on(table.visit_slot_id).where(sql`${table.status} IN ('requested', 'booked')`)
]);