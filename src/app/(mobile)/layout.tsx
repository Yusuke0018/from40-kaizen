import type { ReactNode } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { AuthGate } from "@/components/auth/auth-gate";

export default function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <MobileShell>{children}</MobileShell>
    </AuthGate>
  );
}
