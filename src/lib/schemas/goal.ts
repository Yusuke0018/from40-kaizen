import { z } from "zod";

export const frequencySchema = z.enum(["daily", "weekly"]).default("daily");

export const goalSchema = z.object({
  text: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  expireAt: z.string().optional(),
  createdAt: z.string().optional(),
  hallOfFameAt: z.string().optional().nullable(),
  frequency: frequencySchema.optional(),
  weeklyTarget: z.number().min(1).max(7).optional(),
});

export type GoalInput = z.infer<typeof goalSchema>;
