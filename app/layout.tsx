import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hakot-community-pickup.jemkirku0907.chatgpt.site"),
  title: { default: "HAKOT", template: "%s | HAKOT" },
  description: "Snap recyclables, earn verified points, and redeem useful local rewards.",
  applicationName: "HAKOT",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "HAKOT" },
  openGraph: {
    title: "HAKOT — Recyclables into rewards",
    description: "Take a photo, get a transparent point estimate, and earn verified rewards at pickup.",
    images: ["/og.png"],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export const viewport: Viewport = {
  themeColor: "#17aa82",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
