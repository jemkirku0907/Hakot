import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://basucash.vercel.app"),
  title: { default: "BasuCash", template: "%s | BasuCash" },
  description: "Check recyclable value, find nearby junkshops, and track the cash they pay you.",
  applicationName: "BasuCash",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "BasuCash" },
  openGraph: {
    title: "BasuCash — From basura to real value",
    description: "Estimate recyclable value, find nearby junkshops, and build a personal cash and impact record.",
    images: ["/og-basucash-v2.png"],
  },
  twitter: { card: "summary_large_image", images: ["/og-basucash-v2.png"] },
};

export const viewport: Viewport = {
  themeColor: "#17aa82",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
