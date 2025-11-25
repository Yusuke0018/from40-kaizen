"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Sun, History } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/today",
    label: "Today",
    icon: Sun,
  },
  {
    href: "/history",
    label: "History",
    icon: History,
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
      <aside className="hidden w-64 flex-shrink-0 flex-col justify-between border-r border-mint-200 bg-white px-6 py-8 md:flex">
        <div>
          <div className="inline-flex flex-col items-start rounded-2xl bg-slate-950 px-4 py-3 shadow-md">
            <span className="text-[0.65rem] font-semibold tracking-[0.3em] text-slate-400">
              HABIT TRACKER
            </span>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-white">
              習慣形成
            </h1>
          </div>
          <p className="mt-5 text-sm font-medium text-slate-600">
            毎日チェックして90日で殿堂入り。シンプルに習慣を形成しましょう。
          </p>
        </div>
        <DesktopNav pathname={pathname} />
      </aside>

      {/* メインエリア */}
      <div className="flex flex-1 flex-col">
        {/* モバイルヘッダー */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-900 bg-slate-950 px-5 py-3 md:hidden">
          <div className="space-y-0.5">
            <p className="text-[0.6rem] font-semibold tracking-[0.3em] text-slate-400">
              {date} ({weekday})
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-white">
              Habit Tracker
            </h2>
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
      <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-white p-2 shadow-xl shadow-mint-900/10 ring-1 ring-mint-100">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl px-5 py-3 transition-all",
                active
                  ? "bg-mint-50 text-mint-700"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              )}
            >
              <item.icon
                className={cn(
                  "mb-0.5 h-6 w-6",
                  active && "fill-mint-100 stroke-mint-700"
                )}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className="text-[0.65rem] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function DesktopNav({ pathname }: { pathname: string }) {
  return (
    <nav className="mt-6 flex flex-col gap-1 text-sm">
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-[0.85rem] font-semibold transition-colors",
              active
                ? "bg-mint-50 text-mint-800 ring-1 ring-mint-200"
                : "text-slate-500 hover:bg-mint-50 hover:text-slate-900"
            )}
          >
            <item.icon
              className={cn(
                "h-4 w-4",
                active ? "text-mint-700" : "text-slate-400"
              )}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
