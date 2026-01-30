import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { workflowDefinitions } from "./workflows";
import { workspaces } from "./workspaces";

export const executionInstances = pgTable(
  "execution_instances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflowDefinitions.id),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    status: text("status").notNull().default("pending"),
    inputs: jsonb("inputs"),
    outputs: jsonb("outputs"),
    nodeStates: jsonb("node_states"),
    agentInstances: jsonb("agent_instances").$type<string[]>(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: uuid("created_by").notNull(),
  },
  (table) => ({
    workflowIdx: index("exec_workflow_idx").on(table.workflowId),
    statusIdx: index("exec_status_idx").on(table.status),
  })
);

export type ExecutionInstance = typeof executionInstances.$inferSelect;
export type NewExecutionInstance = typeof executionInstances.$inferInsert;
