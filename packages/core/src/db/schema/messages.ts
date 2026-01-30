import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  primaryKey,
  index,
  integer,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";

export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  name: text("name"),
  type: text("type").notNull().default("group"), // 'p2p' | 'group'
  contextTokens: integer("context_tokens").default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const groupMembers = pgTable(
  "group_members",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id),
    agentId: uuid("agent_id").notNull(),
    role: text("role").notNull().default("member"), // 'owner' | 'member'
    lastReadMessageId: uuid("last_read_message_id"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.groupId, table.agentId] }),
    groupIdx: index("group_members_group_idx").on(table.groupId),
  })
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id),
    senderId: uuid("sender_id").notNull(),
    contentType: text("content_type").notNull(), // 'text' | 'tool_call' | 'tool_result'
    content: text("content").notNull(),
    metadata: jsonb("metadata"),
    sendTime: timestamp("send_time", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    groupIdx: index("messages_group_idx").on(table.groupId),
    sendTimeIdx: index("messages_send_time_idx").on(table.sendTime),
  })
);

export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type GroupMember = typeof groupMembers.$inferSelect;
export type NewGroupMember = typeof groupMembers.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
