import { z } from "zod";

export const dailyRecordSchema = z.object({
  date: z.string(),
  weightKg: z.number().nullable().optional(),
  sleepStart: z.string().nullable().optional(),
  sleepEnd: z.string().nullable().optional(),
  sleepHours: z.number().nullable().optional(),
  avgSleepHr: z.number().nullable().optional(),
  hrv: z.number().nullable().optional(),
  wakeCondition: z.string().nullable().optional(),
  moodMorning: z.number().nullable().optional(),
  moodEvening: z.number().nullable().optional(),
  sleepiness: z.number().nullable().optional(),
  hydrationMl: z.number().nullable().optional(),
  calories: z.number().nullable().optional(),
  steps: z.number().nullable().optional(),
  mealsNote: z.string().optional(),
  emotionNote: z.string().optional(),
  highlight: z.string().optional(),
  challenge: z.string().optional(),
  journal: z.string().optional(),
  photoUrls: z.array(z.string()).default([]),
});

export type DailyRecordInput = z.infer<typeof dailyRecordSchema>;
