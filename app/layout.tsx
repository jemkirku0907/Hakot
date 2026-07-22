import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "HAKOT", template: "%s | HAKOT" },
  description: "Neighborhood collection logistics for recyclables and difficult waste.",
  applicationName: "HAKOT",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "HAKOT" },
};

export const viewport: Viewport = {
  themeColor: "#12372a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
