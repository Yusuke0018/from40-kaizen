import { z } from "zod";

export const goalSchema = z.object({
  text: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  expireAt: z.string().optional(),
  createdAt: z.string().optional(),
});

export type GoalInput = z.infer<typeof goalSchema>;

