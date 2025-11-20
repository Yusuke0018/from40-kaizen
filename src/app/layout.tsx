import type { Metadata, Viewport } from "next";
import { Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://40-chronicle.vercel.app"),
  title: {
    default: "日々是悠々",
    template: "%s | 日々是悠々",
  },
  description:
    "日々の実験とコンディションを整然と記録する、モバイルファーストのライフログアプリ。",
  icons: {
    icon: "/hibikore-icon.svg",
    apple: "/hibikore-icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#e0f2f1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${manrope.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
