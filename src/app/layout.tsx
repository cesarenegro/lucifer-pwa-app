import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CIPHER | Stealth Messenger",
  description: "Secure, stealth-luxe messenger application.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CIPHER",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};


import TopAppBar from "@/components/layout/TopAppBar";
import BottomNavBar from "@/components/layout/BottomNavBar";
import { LanguageProvider } from "@/contexts/LanguageContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${manrope.variable} ${spaceGrotesk.variable} antialiased`}
    >
      <body className="h-[100dvh] w-full flex flex-col font-body bg-background text-on-surface selection:bg-primary-container selection:text-on-primary-container overflow-hidden overscroll-none">
        <LanguageProvider>
          <TopAppBar />
          <div className="flex-1 overflow-y-auto overflow-x-hidden pb-[80px] w-full">
            {children}
          </div>
          <BottomNavBar />
        </LanguageProvider>
      </body>
    </html>
  );
}
