"use client";

import { ReactNode } from "react";
import { AuthProvider } from "./auth-provider";

type Props = {
  children: ReactNode;
};

export function AppProviders({ children }: Props) {
  return <AuthProvider>{children}</AuthProvider>;
}
