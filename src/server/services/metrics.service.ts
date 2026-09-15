import { metricsRepo } from "@/server/repositories/metrics.repo";
import type { DataScope, Prisma } from "@prisma/client";

type MetricPayload = {
  eventName: string;
  userId?: string | null;
  scope?: DataScope | null;
  payload?: Prisma.InputJsonValue;
};

export const metricsService = {
  async track(input: MetricPayload) {
    await metricsRepo.create(input);
  },

  /**
   * 静默写入指标事件
   *
   * @description 供业务主流程内嵌埋点使用，写入失败仅记录日志、不抛异常，避免统计故障阻断业务
   * @param input - 指标事件载荷（事件名、关联用户、数据域与业务载荷）
   * @returns 无返回值
   * @example
   * await metricsService.trackSafely({ eventName: "user_registered", userId: user.id });
   */
  async trackSafely(input: MetricPayload) {
    try {
      await metricsRepo.create(input);
    } catch (error) {
      console.error("[metrics] 指标事件写入失败:", error);
    }
  },
};
