"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "firebase/auth";
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signOut,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { prefetchAllData, clearAllCache } from "@/lib/cache-store";

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const prefetchedRef = useRef(false);

  useEffect(() => {
    // setPersistenceを非ブロッキングで実行（認証リスナーを即座に設定）
    setPersistence(firebaseAuth, browserLocalPersistence).catch((error) => {
      console.error("Failed to set auth persistence", error);
    });

    // 認証状態リスナーを即座に設定
    const unsubscribe = onAuthStateChanged(firebaseAuth, (next) => {
      setUser(next);
      setInitializing(false);

      // 認証完了時にバックグラウンドでプリフェッチ
      if (next && !prefetchedRef.current) {
        prefetchedRef.current = true;
        void prefetchAllData(() => next.getIdToken());
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    clearAllCache(); // キャッシュをクリア
    prefetchedRef.current = false;
    await signOut(firebaseAuth);
  };

  const value = useMemo(
    () => ({
      user,
      initializing,
      signOut: handleSignOut,
    }),
    [user, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside AuthProvider");
  return ctx;
}
