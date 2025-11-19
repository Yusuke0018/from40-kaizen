import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "日々是悠々",
    short_name: "日々是悠々",
    description:
      "日々の睡眠・気分・HRV・食事をミントとパステルカラーで整然と記録するライフログアプリ。",
    start_url: "/today",
    display: "standalone",
    orientation: "portrait",
    background_color: "#e0f2f1",
    theme_color: "#e0f2f1",
    lang: "ja",
    icons: [
      {
        src: "/hibikore-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}

