import {
  bigserial,
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  googleSub: text("google_sub").notNull().unique(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export const activationCodes = pgTable("activation_codes", {
  id: uuid("id").primaryKey(),
  code: text("code").notNull().unique(),
  purchaserEmail: text("purchaser_email").notNull(),
  ticketQuota: integer("ticket_quota").notNull(),
  redeemedCount: integer("redeemed_count").notNull(),
  purchaseType: text("purchase_type").notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull(),
  isActive: boolean("is_active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const eventCheckins = pgTable("event_checkins", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  eventId: uuid("event_id").notNull(),
  ticketId: uuid("ticket_id").notNull(),
  teamId: uuid("team_id"),
  checkedInBy: uuid("checked_in_by").references(() => users.id, { onDelete: "set null" }),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }).notNull(),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  teamMinSize: integer("team_min_size").notNull(),
  teamMaxSize: integer("team_max_size").notNull(),
  isActive: boolean("is_active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const perkCheckins = pgTable("perk_checkins", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  perkId: uuid("perk_id").notNull(),
  ticketId: uuid("ticket_id").notNull(),
  checkedInBy: uuid("checked_in_by").references(() => users.id, { onDelete: "set null" }),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }).notNull(),
});

export const perks = pgTable("perks", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull().unique(),
  isActive: boolean("is_active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  hasChangedCertificateName: boolean("has_changed_certificate_name").notNull().default(false),
  participantType: text("participant_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const roles = pgTable("roles", {
  email: text("email").primaryKey(),
  isVolunteer: boolean("is_volunteer").notNull(),
  isAdmin: boolean("is_admin").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const teamMembers = pgTable(
  "team_members",
  {
    teamId: uuid("team_id").notNull(),
    ticketId: uuid("ticket_id").notNull(),
    addedBy: uuid("added_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.teamId, table.ticketId] })],
);

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey(),
  eventId: uuid("event_id").notNull(),
  name: text("name").notNull(),
  leaderTicketId: uuid("leader_ticket_id").notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  activationCodeId: uuid("activation_code_id").notNull(),
  participantType: text("participant_type").notNull(),
  qrToken: text("qr_token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export type UserRecord = typeof users.$inferSelect;
export type SessionRecord = typeof sessions.$inferSelect;

export type RoleRecord = typeof roles.$inferSelect;
export type ProfileRecord = typeof profiles.$inferSelect;
