import { z } from "zod";

export const dailyRecordSchema = z.object({
  date: z.string(),
  weightKg: z.number().nullable().optional(),
  sleepStart: z.string().nullable().optional(),
  sleepEnd: z.string().nullable().optional(),
  sleepHours: z.number().nullable().optional(),
  avgSleepHr: z.number().nullable().optional(),
  hrv: z.number().nullable().optional(),
  wakeCondition: z.number().nullable().optional(),
  moodMorning: z.number().nullable().optional(),
  moodEvening: z.number().nullable().optional(),
  sleepiness: z.number().nullable().optional(),
  hydrationMl: z.number().nullable().optional(),
  calories: z.number().nullable().optional(),
  steps: z.number().nullable().optional(),
  mealsNote: z.string().optional(),
  meals: z
    .array(
      z.object({
        id: z.string().optional(),
        time: z.string().optional(),
        note: z.string().optional(),
        photoUrl: z.string().nullable().optional(),
      })
    )
    .optional(),
  emotionNote: z.string().optional(),
  highlight: z.string().optional(),
  challenge: z.string().optional(),
  journal: z.string().optional(),
  photoUrls: z.array(z.string()).default([]),
  healthCheck: z.boolean().default(false),
  workCheck: z.boolean().default(false),
  familyCheck: z.boolean().default(false),
  tradeOffs: z.array(z.string()).default([]),
  missNext: z
    .array(
      z.object({
        miss: z.string().optional(),
        next: z.string().optional(),
      })
    )
    .default([]),
  tomorrowAction: z.string().default(""),
  verdict: z.enum(["optimal", "good", "compromise"]).nullable().optional(),
});

export type DailyRecordInput = z.infer<typeof dailyRecordSchema>;
