"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  Download,
  History,
  Plus,
  Settings,
  Sunrise,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/today",
    label: "Today",
    icon: Sunrise,
  },
  {
    href: "/history",
    label: "History",
    icon: History,
  },
  {
    href: "/export",
    label: "Export",
    icon: Download,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

type MobileShellProps = {
  children: React.ReactNode;
};

export function MobileShell({ children }: MobileShellProps) {
  const pathname = usePathname();
  const now = new Date();
  const weekday = new Intl.DateTimeFormat("ja-JP", {
    weekday: "long",
  }).format(now);
  const date = new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
  }).format(now);
  const greeting = getGreeting(now.getHours());

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl bg-mint-50 text-slate-900 md:rounded-[32px] md:border md:border-mint-100/70 md:shadow-2xl md:shadow-mint-200/60 md:backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-40 bg-gradient-to-b from-mint-200/70 via-transparent to-transparent md:h-full md:w-80 md:bg-gradient-to-b md:from-slate-950 md:via-slate-900 md:to-slate-900/90 md:rounded-l-[32px]" />
      <div className="relative z-10 flex w-full flex-col md:flex-row">
        {/* サイドレール（PC） */}
        <aside className="hidden w-80 flex-shrink-0 flex-col justify-between border-r border-white/10 bg-transparent px-8 py-8 text-slate-100 md:flex">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-mint-200">
              40 CHRONICLE
            </p>
            <h1 className="pt-3 text-2xl font-semibold leading-tight text-white">
              {greeting}
            </h1>
            <p className="pt-1 text-sm text-mint-100/80">
              {date} ({weekday})
            </p>
            <p className="pt-4 text-xs leading-relaxed text-slate-100/80">
              左のタブで入力し、右側に
              <span className="font-semibold text-mint-200">結果と履歴</span>
              が並びます。HRVや感情メモで、日々の変化を丁寧に追いかけましょう。
            </p>
          </div>
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-4 py-2 text-[0.7rem] font-semibold text-mint-200 ring-1 ring-mint-400/40">
              <CalendarCheck className="h-3.5 w-3.5" />
              実験を続けて、パターンを見つける
            </span>
            <DesktopNav pathname={pathname} />
          </div>
        </aside>

        {/* メインコンテンツ */}
        <div className="flex flex-1 flex-col">
          {/* モバイルヘッダー */}
          <header className="z-10 px-6 pb-2 pt-7 md:hidden">
            <p className="text-[0.65rem] uppercase tracking-[0.32em] text-slate-500">
              40 CHRONICLE
            </p>
            <div className="flex items-center justify-between pt-2">
              <div>
                <h1 className="text-2xl font-semibold leading-tight">
                  {greeting}
                </h1>
                <p className="text-sm text-slate-500">
                  {date} ({weekday})
                </p>
              </div>
              <span className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-mint-700 shadow-sm shadow-mint-200/70">
                <CalendarCheck className="h-4 w-4" />
                Day 12
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              まず「Today」で入力し、その結果をHistoryやExportで確認できます。
            </p>
          </header>
          <main className="relative z-10 flex-1 space-y-6 px-6 pb-40 pt-4 md:space-y-5 md:pb-8 md:pt-6">
            {children}
          </main>
        </div>
      </div>
      <FloatingRecordButton />
      <BottomNav pathname={pathname} />
    </div>
  );
}

function FloatingRecordButton() {
  return (
    <Link
      href="/today#record"
      className="fixed bottom-24 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-gradient-to-r from-mint-400 via-mint-500 to-sky-400 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-mint-500/40 transition hover:scale-[1.02]"
    >
      <Plus className="h-4 w-4" />
      今日の記録
    </Link>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed bottom-4 left-0 right-0 z-30 flex justify-center md:hidden">
      <div className="flex w-[min(420px,92%)] items-center rounded-full border border-white/60 bg-white/95 p-2 shadow-xl shadow-mint-200/50 backdrop-blur-xl">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center rounded-full px-2 py-1 text-[0.65rem] font-semibold transition",
                active
                  ? "bg-mint-100 text-slate-900"
                  : "text-slate-400 hover:text-slate-700"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5",
                  active ? "text-mint-600" : "text-slate-400"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function DesktopNav({ pathname }: { pathname: string }) {
  return (
    <nav className="hidden flex-col gap-1 text-sm md:flex">
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-full px-3 py-2 text-[0.8rem] font-semibold transition",
              active
                ? "bg-mint-400/20 text-mint-100 ring-1 ring-mint-300/60"
                : "text-slate-200/80 hover:bg-slate-900/60 hover:text-white"
            )}
          >
            <item.icon
              className={cn(
                "h-4 w-4",
                active ? "text-mint-100" : "text-slate-200/80"
              )}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function getGreeting(hours: number) {
  if (hours < 5) return "そろそろ休みましょう";
  if (hours < 12) return "おはようございます";
  if (hours < 18) return "こんにちは";
  return "今日もお疲れさま";
}
