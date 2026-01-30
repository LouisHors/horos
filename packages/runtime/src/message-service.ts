import { db } from "@ai-agent/core/src/db";
import { messages, groupMembers } from "@ai-agent/core/src/db/schema";
import { eq, and, gt } from "drizzle-orm";

export class MessageService {
  /**
   * 获取 Agent 的所有未读消息
   */
  async getUnreadMessages(agentId: string): Promise<any[]> {
    // 获取 Agent 所在的所有 Group
    const memberships = await db.query.groupMembers.findMany({
      where: eq(groupMembers.agentId, agentId),
    });

    const unreadMessages = [];

    for (const membership of memberships) {
      const lastReadId =
        membership.lastReadMessageId ||
        "00000000-0000-0000-0000-000000000000";

      // 查询未读消息
      const groupMessages = await db.query.messages.findMany({
        where: and(
          eq(messages.groupId, membership.groupId),
          gt(messages.id, lastReadId)
        ),
        orderBy: (messages, { asc }) => asc(messages.sendTime),
      });

      unreadMessages.push(...groupMessages);
    }

    // 按时间排序
    return unreadMessages.sort(
      (a, b) => a.sendTime.getTime() - b.sendTime.getTime()
    );
  }

  /**
   * 标记消息为已读
   */
  async markAsRead(
    agentId: string,
    groupId: string,
    messageId: string
  ): Promise<void> {
    await db
      .update(groupMembers)
      .set({ lastReadMessageId: messageId })
      .where(
        and(eq(groupMembers.agentId, agentId), eq(groupMembers.groupId, groupId))
      );
  }
}
