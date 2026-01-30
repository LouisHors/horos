import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
  integer,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";

export const agentDefinitions = pgTable(
  "agent_definitions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    name: text("name").notNull(),
    role: text("role").notNull(),
    description: text("description"),
    parentId: uuid("parent_id"),
    llmConfig: jsonb("llm_config").notNull(),
    tools: jsonb("tools").$type<string[]>().default([]),
    mcpServers: jsonb("mcp_servers"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: uuid("created_by").notNull(),
  },
  (table) => ({
    workspaceIdx: index("agent_def_workspace_idx").on(table.workspaceId),
  })
);

export const agentInstances = pgTable(
  "agent_instances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    definitionId: uuid("definition_id")
      .notNull()
      .references(() => agentDefinitions.id),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    status: text("status").notNull().default("idle"),
    llmHistory: jsonb("llm_history").$type<LLMMessage[]>().default([]),
    currentGroupId: uuid("current_group_id"),
    currentTask: text("current_task"),
    tokenUsage: integer("token_usage").default(0),
    messageCount: integer("message_count").default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    workspaceIdx: index("agent_inst_workspace_idx").on(table.workspaceId),
    statusIdx: index("agent_inst_status_idx").on(table.status),
  })
);

type LLMMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | { role: "tool"; content: string; tool_call_id: string; name: string };

export type AgentDefinition = typeof agentDefinitions.$inferSelect;
export type NewAgentDefinition = typeof agentDefinitions.$inferInsert;
export type AgentInstance = typeof agentInstances.$inferSelect;
export type NewAgentInstance = typeof agentInstances.$inferInsert;
