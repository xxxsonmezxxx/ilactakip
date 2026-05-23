import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppProvider } from "./AppContext";
import NotificationManager from "@/components/NotificationManager";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1a1308",
};

export const metadata: Metadata = {
  title: "Leoparlı İlaç Takibim",
  description: "Akıllı ilaç takip ve hatırlatma uygulaması",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "İlaç Takip",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-touch-icon-120.png" />
        <link rel="apple-touch-icon-precomposed" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="İlaç Takip" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <AppProvider>
          <NotificationManager />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
