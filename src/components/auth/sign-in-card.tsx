"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";

const actionUrl =
  process.env.NEXT_PUBLIC_APP_URL?.concat("/signin") ?? "http://localhost:3000/signin";

export function SignInCard() {
  const [email, setEmail] = useState(() =>
    typeof window === "undefined"
      ? ""
      : window.localStorage.getItem("chronicle-email") ?? ""
  );
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedEmail =
      window.localStorage.getItem("chronicle-email") ?? email;
    if (isSignInWithEmailLink(firebaseAuth, window.location.href)) {
      const emailForLink =
        savedEmail ||
        window.prompt("送信したメールアドレスを入力してください") ||
        "";
      if (!emailForLink) return;
      signInWithEmailLink(firebaseAuth, emailForLink, window.location.href)
        .then(() => {
          window.localStorage.removeItem("chronicle-email");
        })
        .catch((err) => {
          console.error(err);
          setError("リンクの確認に失敗しました。もう一度お試しください。");
        });
    }
  }, [email]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      await sendSignInLinkToEmail(firebaseAuth, email, {
        url: actionUrl,
        handleCodeInApp: true,
      });
      if (typeof window !== "undefined") {
        window.localStorage.setItem("chronicle-email", email);
      }
      setStatus("sent");
    } catch (err) {
      console.error(err);
      setError("リンク送信に失敗しました。設定を確認してください。");
      setStatus("error");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-mint-50 px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/50 bg-white/90 p-8 text-center shadow-2xl shadow-mint-100/70">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          40 CHRONICLE
        </p>
        <h1 className="pt-2 text-2xl font-semibold">メールリンクでログイン</h1>
        <p className="text-sm text-slate-500">
          登録済みのメールアドレス宛にワンタップログイン用リンクを送ります。
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            メールアドレス
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-2xl border border-mint-100 bg-white px-4 py-3 text-base text-slate-700 shadow-sm"
            />
          </label>
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-full bg-gradient-to-r from-mint-400 via-mint-500 to-sky-400 py-3 text-sm font-semibold text-white shadow-lg shadow-mint-300/70 disabled:opacity-70"
          >
            {status === "sending" ? "送信中…" : "ログインリンクを送る"}
          </button>
        </form>
        {status === "sent" && (
          <p className="pt-4 text-sm font-semibold text-mint-600">
            メールを確認し、リンクをタップしてください。
          </p>
        )}
        {error && <p className="pt-4 text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
}
