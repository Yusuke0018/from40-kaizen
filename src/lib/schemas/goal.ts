import { z } from "zod";

export const goalSchema = z.object({
  text: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(), // 殿堂入り時に自動設定
  expireAt: z.string().optional(),
  createdAt: z.string().optional(),
  hallOfFameAt: z.string().optional().nullable(), // 殿堂入り日（終了日）
});

export type GoalInput = z.infer<typeof goalSchema>;
