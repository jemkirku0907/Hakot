import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "HAKOT", template: "%s | HAKOT" },
  description: "Snap recyclables, earn verified points, and redeem useful local rewards.",
  applicationName: "HAKOT",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "HAKOT" },
  openGraph: {
    title: "HAKOT — Recyclables into rewards",
    description: "Take a photo, get a transparent point estimate, and earn verified rewards at pickup.",
    images: ["/hakot-social.png"],
  },
  twitter: { card: "summary_large_image", images: ["/hakot-social.png"] },
};

export const viewport: Viewport = {
  themeColor: "#17aa82",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
