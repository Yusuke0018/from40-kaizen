"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  CalendarDays,
  Download,
  Plus,
  Sun,
  SlidersHorizontal,
} from "lucide-react";
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
    icon: BarChart2,
  },
  {
    href: "/export",
    label: "Export",
    icon: Download,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: SlidersHorizontal,
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
              HIBI-KORE-LAB
            </span>
            <h1 className="mt-1 text-xl font-semibold tracking-[0.18em] text-white">
              日々是悠々
            </h1>
          </div>
          <p className="mt-5 text-sm font-medium text-slate-600">
            日々の記録をもとに、睡眠・気分・HRVのパターンを見つけましょう。
          </p>
        </div>
        <DesktopNav pathname={pathname} />
      </aside>

      {/* メインエリア */}
      <div className="flex flex-1 flex-col">
        {/* モバイルヘッダー */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-900 bg-slate-950 px-5 py-3 md:hidden">
          <div className="space-y-1">
            <p className="text-[0.6rem] font-semibold tracking-[0.3em] text-slate-400">
              {date} ({weekday})
            </p>
            <h2 className="text-lg font-semibold tracking-[0.18em] text-white">
              日々是悠々
            </h2>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-100 shadow-sm">
            <CalendarDays className="h-4 w-4" />
          </div>
        </header>

        <main className="relative z-10 w-full max-w-md flex-1 space-y-6 px-5 pb-32 pt-6 md:max-w-4xl lg:max-w-6xl xl:max-w-none md:px-10 md:pt-8 md:mx-auto">
          {children}
        </main>
      </div>

      <FloatingAction />
      <BottomNav pathname={pathname} />
    </div>
  );
}

function FloatingAction() {
  return (
    <Link
      href="/today#record"
      className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-mint-600 text-white shadow-lg shadow-mint-700/30 transition-all hover:scale-105 hover:bg-mint-700 active:scale-95 md:bottom-10 md:right-10"
    >
      <Plus className="h-7 w-7" strokeWidth={2.5} />
    </Link>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="pointer-events-none fixed bottom-6 left-0 right-0 z-30 flex justify-center md:hidden">
      <div className="pointer-events-auto flex items-center gap-1 rounded-2xl bg-white p-2 shadow-xl shadow-mint-900/10 ring-1 ring-mint-100">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl px-5 py-2 transition-all",
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
              <span className="text-[0.6rem] font-bold">
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
    <nav className="mt-6 flex flex-col gap-1 text-sm">
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-[0.8rem] font-semibold transition-colors",
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
