"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";

export function SignInCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    setMessage(null);
    try {
      if (mode === "signin") {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      } else {
        await createUserWithEmailAndPassword(firebaseAuth, email, password);
        setMessage("アカウントを作成しました。ログイン済みです。");
      }
    } catch (err) {
      console.error(err);
      setError("メールアドレスまたはパスワードを確認してください。");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-mint-50 px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/50 bg-white/90 p-8 text-center shadow-2xl shadow-mint-100/70">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          40 CHRONICLE
        </p>
        <h1 className="pt-2 text-2xl font-semibold">
          {mode === "signin" ? "メールとパスワードでログイン" : "アカウントを作成"}
        </h1>
        <p className="text-sm text-slate-500">
          自分専用のメールアドレスとパスワードでサインインします。
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
          <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            パスワード
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-2xl border border-mint-100 bg-white px-4 py-3 text-base text-slate-700 shadow-sm"
            />
            <span className="text-[0.7rem] text-slate-400">
              {mode === "signup"
                ? "8文字以上を推奨。1度作成すれば次回から同じ情報でログインできます。"
                : "作成済みのパスワードを入力してください。"}
            </span>
          </label>
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-full bg-gradient-to-r from-mint-400 via-mint-500 to-sky-400 py-3 text-sm font-semibold text-white shadow-lg shadow-mint-300/70 disabled:opacity-70"
          >
            {status === "loading"
              ? "処理中..."
              : mode === "signin"
              ? "ログイン"
              : "アカウント作成"}
          </button>
        </form>
        <div className="pt-4 text-sm text-slate-500">
          {mode === "signin" ? (
            <button
              className="font-semibold text-mint-600"
              onClick={() => setMode("signup")}
            >
              初めて利用する場合はこちら
            </button>
          ) : (
            <button
              className="font-semibold text-sky-600"
              onClick={() => setMode("signin")}
            >
              既に作成したアカウントでログイン
            </button>
          )}
        </div>
        {message && (
          <p className="pt-4 text-sm font-semibold text-mint-600">{message}</p>
        )}
        {error && <p className="pt-4 text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
}
