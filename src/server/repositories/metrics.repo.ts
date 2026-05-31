import { prisma } from "@/server/db/prisma";
import { Prisma, type DataScope } from "@prisma/client";

type MetricInput = {
  eventName: string;
  userId?: string | null;
  scope?: DataScope | null;
  payload?: Prisma.InputJsonValue;
};

export const metricsRepo = {
  create(input: MetricInput) {
    return prisma.eventMetric.create({
      data: {
        eventName: input.eventName,
        userId: input.userId ?? null,
        scope: input.scope ?? null,
        payload: input.payload ?? Prisma.JsonNull,
      },
    });
  },
};
