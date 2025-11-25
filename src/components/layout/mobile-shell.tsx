"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListChecks, Sun, History, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/today",
    label: "Today",
    icon: Sun,
    activeGradient: "from-violet-500 to-purple-600",
    activeBg: "bg-violet-50",
    activeText: "text-violet-700",
  },
  {
    href: "/history",
    label: "History",
    icon: History,
    activeGradient: "from-emerald-500 to-teal-600",
    activeBg: "bg-emerald-50",
    activeText: "text-emerald-700",
  },
  {
    href: "/settings",
    label: "Habits",
    icon: ListChecks,
    activeGradient: "from-pink-500 to-rose-600",
    activeBg: "bg-pink-50",
    activeText: "text-pink-700",
  },
];

type MobileShellProps = {
  children: React.ReactNode;
};

export function MobileShell({ children }: MobileShellProps) {
  const pathname = usePathname();
  const now = new Date();
  const date = new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
  }).format(now);
  const weekday = new Intl.DateTimeFormat("ja-JP", {
    weekday: "short",
  }).format(now);

  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-transparent text-slate-900 md:flex-row">
      {/* PCサイドバー */}
      <aside className="hidden w-64 flex-shrink-0 flex-col justify-between border-r border-slate-200 bg-white px-6 py-8 md:flex">
        <div>
          <div className="inline-flex flex-col items-start rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 px-5 py-4 shadow-xl">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span className="text-[0.65rem] font-semibold tracking-[0.2em] text-white/80">
                HABIT TRACKER
              </span>
            </div>
            <h1 className="mt-1 text-xl font-extrabold tracking-tight text-white">
              習慣形成
            </h1>
          </div>
          <p className="mt-5 text-sm font-medium text-slate-500">
            毎日チェックして90日で殿堂入り。シンプルに習慣を形成しましょう。
          </p>
        </div>
        <DesktopNav pathname={pathname} />
      </aside>

      {/* メインエリア */}
      <div className="flex flex-1 flex-col">
        {/* モバイルヘッダー */}
        <header className="sticky top-0 z-20 flex items-center justify-between bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 px-5 py-4 shadow-lg md:hidden">
          <div className="space-y-0.5">
            <p className="text-[0.6rem] font-semibold tracking-[0.2em] text-white/60">
              {date} ({weekday})
            </p>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <h2 className="text-lg font-extrabold tracking-tight text-white">
                Habit Tracker
              </h2>
            </div>
          </div>
        </header>

        <main className="relative z-10 w-full max-w-md flex-1 space-y-6 px-5 pb-32 pt-6 md:max-w-2xl md:px-10 md:pt-8 md:mx-auto">
          {children}
        </main>
      </div>

      <BottomNav pathname={pathname} />
    </div>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="pointer-events-none fixed bottom-6 left-0 right-0 z-30 flex justify-center md:hidden">
      <div className="pointer-events-auto flex items-center gap-1 rounded-3xl bg-white/95 p-2 shadow-2xl shadow-slate-900/20 ring-1 ring-slate-200 backdrop-blur-lg">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-2xl px-5 py-2.5 transition-all",
                active
                  ? item.activeBg
                  : "text-slate-400 hover:bg-slate-50"
              )}
            >
              {active && (
                <div className={cn(
                  "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-10",
                  item.activeGradient
                )} />
              )}
              <div className={cn(
                "relative flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                active
                  ? `bg-gradient-to-br ${item.activeGradient} shadow-lg`
                  : ""
              )}>
                <item.icon
                  className={cn(
                    "h-5 w-5",
                    active ? "text-white" : "text-slate-400"
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
              </div>
              <span className={cn(
                "mt-1 text-[0.6rem] font-bold",
                active ? item.activeText : "text-slate-400"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function DesktopNav({ pathname }: { pathname: string }) {
  return (
    <nav className="mt-6 flex flex-col gap-2 text-sm">
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition-all",
              active
                ? `${item.activeBg} ${item.activeText} ring-1 ring-current/20`
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
              active
                ? `bg-gradient-to-br ${item.activeGradient} shadow-md`
                : "bg-slate-100 group-hover:bg-slate-200"
            )}>
              <item.icon
                className={cn(
                  "h-5 w-5",
                  active ? "text-white" : "text-slate-500"
                )}
              />
            </div>
            <span className="text-sm">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
