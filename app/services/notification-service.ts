import { governanceRepository } from "../../src/core/network/governance-repository";
import type { NotificationActivity } from "../domain/models/admin";

export const notificationService = {
  async list(): Promise<NotificationActivity[]> {
    const logs = await governanceRepository.getNotificationSendLogs();
    return logs.map((log) => ({
      id: log.id,
      triggerEvent: log.triggerEvent,
      recipient: log.recipient,
      channel: log.channel,
      status: log.status,
      sentAt: log.sentAt,
    }));
  },
};

