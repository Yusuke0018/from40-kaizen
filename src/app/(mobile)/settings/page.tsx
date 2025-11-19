"use client";

import { useState } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import {
  Bell,
  ChevronRight,
  Database,
  FlaskConical,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const reminders = [
  {
    title: "朝のルーティン",
    time: "06:30",
    desc: "起床後10分以内に記録を促す",
    active: true,
  },
  {
    title: "夜の振り返り",
    time: "21:45",
    desc: "寝る前の振り返りをリマインド",
    active: true,
  },
];

const experiments = [
  {
    name: "砂糖リセット",
    status: "Day 12 / 30",
    note: "甘いものを日中控える",
  },
  {
    name: "夜スクリーンオフ",
    status: "Week 2",
    note: "就寝30分前に画面オフ",
  },
];

export default function SettingsPage() {
  const { user, signOut } = useAuthContext();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="space-y-8 pb-10">
      <section>
        <h2 className="mb-6 text-3xl font-bold tracking-tight text-slate-900">
          Settings
        </h2>

        {/* アカウント情報カード */}
        <div className="relative mb-6 overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-lg">
          <div className="absolute -mr-10 -mt-10 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10">
              <User className="h-6 w-6 text-mint-300" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Account
              </p>
              <p className="text-sm font-medium text-white">{user?.email}</p>
            </div>
          </div>
        </div>
      </section>

      {/* リマインダー */}
      <SettingsGroup
        title="Notifications"
        icon={<Bell className="h-4 w-4" />}
      >
        {reminders.map((item, index) => (
          <div
            key={item.title}
            className={cn(
              "flex items-center justify-between p-4",
              index !== reminders.length - 1 && "border-b border-slate-100"
            )}
          >
            <div>
              <p className="text-sm font-bold text-slate-700">{item.title}</p>
              <p className="mt-0.5 text-xs text-slate-400">{item.desc}</p>
            </div>
            <div className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {item.time}
            </div>
          </div>
        ))}
      </SettingsGroup>

      {/* 実験タグ */}
      <SettingsGroup
        title="Active Experiments"
        icon={<FlaskConical className="h-4 w-4" />}
      >
        {experiments.map((experiment, index) => (
          <div
            key={experiment.name}
            className={cn(
              "flex items-center justify-between p-4",
              index !== experiments.length - 1 && "border-b border-slate-100"
            )}
          >
            <div>
              <p className="text-sm font-bold text-slate-700">
                {experiment.name}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">{experiment.note}</p>
            </div>
            <span className="rounded-md bg-mint-50 px-2 py-1 text-xs font-bold text-mint-600">
              {experiment.status}
            </span>
          </div>
        ))}
      </SettingsGroup>

      {/* 連携予定 */}
      <SettingsGroup
        title="Integrations"
        icon={<Database className="h-4 w-4" />}
      >
        <div className="flex cursor-pointer items-center justify-between p-4">
          <span className="text-sm font-bold text-slate-700">
            HealthKit Sync
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">
              Coming soon
            </span>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </div>
        </div>
      </SettingsGroup>

      <button
        onClick={() => void handleSignOut()}
        disabled={signingOut}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50/50 p-4 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100 active:scale-[0.98]"
      >
        <LogOut className="h-4 w-4" />
        {signingOut ? "サインアウト中…" : "サインアウト"}
      </button>

      <p className="pt-6 text-center text-[0.65rem] font-bold uppercase tracking-widest text-slate-300">
        40 Chronicle v0.1.0
      </p>
    </div>
  );
}

function SettingsGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span className="text-slate-400">{icon}</span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {title}
        </h3>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[var(--shadow-soft)]">
        {children}
      </div>
    </section>
  );
}
