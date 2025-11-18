import type { ReactNode } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";

export default function MobileLayout({ children }: { children: ReactNode }) {
  return <MobileShell>{children}</MobileShell>;
}
