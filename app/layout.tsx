import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://basucash.vercel.app"),
  title: { default: "BasuCash", template: "%s | BasuCash" },
  description: "Snap recyclables, earn verified points, and redeem useful local rewards.",
  applicationName: "BasuCash",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "BasuCash" },
  openGraph: {
    title: "BasuCash — Recyclables into rewards",
    description: "Take a photo, get a transparent point estimate, and earn verified rewards at pickup.",
    images: ["/og-basucash.png"],
  },
  twitter: { card: "summary_large_image", images: ["/og-basucash.png"] },
};

export const viewport: Viewport = {
  themeColor: "#17aa82",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
