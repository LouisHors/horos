import { db } from "@ai-agent/core/src/db";
import { groups, groupMembers, messages } from "@ai-agent/core/src/db/schema";
import { eq, and } from "drizzle-orm";

interface CreateGroupOptions {
  name?: string;
  type: "p2p" | "group";
  workspaceId: string;
  initialMembers?: string[]; // Agent IDs
}

interface SendMessageOptions {
  groupId: string;
  senderId: string;
  content: string;
  contentType?: "text" | "tool_call" | "tool_result";
  metadata?: any;
}

export class GroupService {
  /**
   * 创建 Group
   */
  async createGroup(options: CreateGroupOptions): Promise<string> {
    // 1. 创建 Group
    const [group] = await db
      .insert(groups)
      .values({
        workspaceId: options.workspaceId,
        name: options.name,
        type: options.type,
      })
      .returning();

    // 2. 添加初始成员
    if (options.initialMembers && options.initialMembers.length > 0) {
      await db.insert(groupMembers).values(
        options.initialMembers.map((agentId, index) => ({
          groupId: group.id,
          agentId,
          role: index === 0 ? "owner" : "member",
        }))
      );
    }

    console.log(`[GroupService] Created group ${group.id} with ${options.initialMembers?.length || 0} members`);

    return group.id;
  }

  /**
   * 添加成员到 Group
   */
  async addMember(groupId: string, agentId: string, role: "owner" | "member" = "member"): Promise<void> {
    await db.insert(groupMembers).values({
      groupId,
      agentId,
      role,
    });

    console.log(`[GroupService] Added agent ${agentId} to group ${groupId}`);
  }

  /**
   * 从 Group 移除成员
   */
  async removeMember(groupId: string, agentId: string): Promise<void> {
    await db
      .delete(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.agentId, agentId)
        )
      );

    console.log(`[GroupService] Removed agent ${agentId} from group ${groupId}`);
  }

  /**
   * 发送消息到 Group
   */
  async sendMessage(options: SendMessageOptions): Promise<string> {
    const [message] = await db
      .insert(messages)
      .values({
        workspaceId: await this.getWorkspaceId(options.groupId),
        groupId: options.groupId,
        senderId: options.senderId,
        contentType: options.contentType || "text",
        content: options.content,
        metadata: options.metadata,
      })
      .returning();

    console.log(`[GroupService] Message ${message.id} sent to group ${options.groupId}`);

    // 触发唤醒信号给组内其他成员
    await this.wakeUpGroupMembers(options.groupId, options.senderId);

    return message.id;
  }

  /**
   * 获取 Group 的所有成员
   */
  async getMembers(groupId: string): Promise<string[]> {
    const members = await db.query.groupMembers.findMany({
      where: eq(groupMembers.groupId, groupId),
    });

    return members.map((m) => m.agentId);
  }

  /**
   * 获取 Group 的消息历史
   */
  async getMessageHistory(
    groupId: string,
    limit: number = 100,
    before?: string
  ): Promise<any[]> {
    let query = db.query.messages.findMany({
      where: eq(messages.groupId, groupId),
      orderBy: (messages, { desc }) => desc(messages.sendTime),
      limit,
    });

    const result = await query;
    return result.reverse(); // 按时间正序返回
  }

  /**
   * 删除 Group
   */
  async deleteGroup(groupId: string): Promise<void> {
    // 删除所有消息
    await db.delete(messages).where(eq(messages.groupId, groupId));

    // 删除所有成员
    await db.delete(groupMembers).where(eq(groupMembers.groupId, groupId));

    // 删除 Group
    await db.delete(groups).where(eq(groups.id, groupId));

    console.log(`[GroupService] Deleted group ${groupId}`);
  }

  /**
   * 获取 Group 的 workspace ID
   */
  private async getWorkspaceId(groupId: string): Promise<string> {
    const group = await db.query.groups.findFirst({
      where: eq(groups.id, groupId),
    });

    if (!group) {
      throw new Error(`Group not found: ${groupId}`);
    }

    return group.workspaceId;
  }

  /**
   * 唤醒 Group 中的其他成员
   */
  private async wakeUpGroupMembers(groupId: string, senderId: string): Promise<void> {
    const members = await this.getMembers(groupId);
    
    for (const agentId of members) {
      if (agentId !== senderId) {
        // 通过 Redis 发布唤醒信号
        const { redis } = await import("@ai-agent/core/src/db");
        await redis.publish(`agent:wake:${agentId}`, JSON.stringify({
          type: "new_message",
          groupId,
          senderId,
        }));
      }
    }
  }
}
