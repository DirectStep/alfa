import localFont from "next/font/local";

export const styrene = localFont({
  src: [
    { path: "./StyreneAWeb-Thin.woff2", weight: "100", style: "normal" },
    { path: "./StyreneAWeb-Light.woff2", weight: "300", style: "normal" },
    { path: "./StyreneAWeb-Regular.woff2", weight: "400", style: "normal" },
    { path: "./StyreneAWeb-Medium.woff2", weight: "500", style: "normal" },
    { path: "./StyreneAWeb-Bold.woff2", weight: "700", style: "normal" },
    { path: "./StyreneAWeb-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-styrene",
  display: "swap",
});
