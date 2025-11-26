/**
 * グローバルキャッシュストア
 * - メモリ + localStorage でデータを永続化
 * - ページリロード後も即座に表示可能
 * - 日付が変わったら自動で無効化
 */

import type { Goal } from "@/types/goal";
import type { UserLevel } from "@/lib/level-system";

// キャッシュのキー
const CACHE_KEYS = {
  GOALS: "cache_goals",
  GOALS_WITH_HISTORY: "cache_goals_history",
  USER_LEVEL: "cache_user_level",
  STATS: "cache_stats",
  CACHE_DATE: "cache_date",
} as const;

// メモリキャッシュ（高速アクセス用）
let memoryCache: Record<string, unknown> = {};

function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function isCacheValid(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const cacheDate = localStorage.getItem(CACHE_KEYS.CACHE_DATE);
    return cacheDate === todayKey();
  } catch {
    return false;
  }
}

function setCacheDate(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEYS.CACHE_DATE, todayKey());
  } catch {
    // localStorage が使えない場合は無視
  }
}

function getFromStorage<T>(key: string): T | null {
  // まずメモリキャッシュをチェック
  if (memoryCache[key] !== undefined) {
    return memoryCache[key] as T;
  }

  if (typeof window === "undefined") return null;
  if (!isCacheValid()) return null;

  try {
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data) as T;
      memoryCache[key] = parsed; // メモリにもキャッシュ
      return parsed;
    }
  } catch {
    // パースエラーは無視
  }
  return null;
}

function setToStorage<T>(key: string, value: T): void {
  memoryCache[key] = value;
  setCacheDate();

  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage が使えない場合は無視
  }
}

// ========== Goals ==========
export function getCachedGoals(): Goal[] | null {
  return getFromStorage<Goal[]>(CACHE_KEYS.GOALS);
}

export function setCachedGoals(goals: Goal[]): void {
  setToStorage(CACHE_KEYS.GOALS, goals);
}

// ========== Goals with History ==========
export function getCachedGoalsWithHistory<T>(): T[] | null {
  return getFromStorage<T[]>(CACHE_KEYS.GOALS_WITH_HISTORY);
}

export function setCachedGoalsWithHistory<T>(goals: T[]): void {
  setToStorage(CACHE_KEYS.GOALS_WITH_HISTORY, goals);
}

// ========== User Level ==========
export function getCachedUserLevel(): UserLevel | null {
  return getFromStorage<UserLevel>(CACHE_KEYS.USER_LEVEL);
}

export function setCachedUserLevel(level: UserLevel): void {
  setToStorage(CACHE_KEYS.USER_LEVEL, level);
}

// ========== Stats ==========
export function getCachedStats<T>(): T | null {
  return getFromStorage<T>(CACHE_KEYS.STATS);
}

export function setCachedStats<T>(stats: T): void {
  setToStorage(CACHE_KEYS.STATS, stats);
}

// ========== Clear ==========
export function clearAllCache(): void {
  memoryCache = {};
  if (typeof window === "undefined") return;
  try {
    Object.values(CACHE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch {
    // 無視
  }
}

// ========== Prefetch ==========
export async function prefetchAllData(getToken: () => Promise<string>): Promise<void> {
  try {
    const token = await getToken();
    const today = todayKey();

    // 全APIを並列で呼び出し
    const [goalsRes, levelRes, statsRes, historyRes] = await Promise.all([
      fetch(`/api/goals?date=${today}&includeYesterday=true`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("/api/user/level", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("/api/stats", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`/api/goals?date=${today}&history=true`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    if (goalsRes.ok) {
      const data = await goalsRes.json();
      setCachedGoals(data);
    }
    if (levelRes.ok) {
      const data = await levelRes.json();
      setCachedUserLevel(data);
    }
    if (statsRes.ok) {
      const data = await statsRes.json();
      setCachedStats(data);
    }
    if (historyRes.ok) {
      const data = await historyRes.json();
      setCachedGoalsWithHistory(data);
    }
  } catch (err) {
    console.error("Prefetch failed:", err);
  }
}
