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
};
