"use client";

import { useAuthContext } from "@/components/providers/auth-provider";
import { SignInCard } from "@/components/auth/sign-in-card";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, initializing } = useAuthContext();

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mint-50 text-slate-500">
        認証を確認しています…
      </div>
    );
  }

  if (!user) {
    return <SignInCard />;
  }

  return <>{children}</>;
}
