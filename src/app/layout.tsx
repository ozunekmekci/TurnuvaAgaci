import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const fifa26 = localFont({
  src: "../../public/fonts/fifa-26.ttf",
  variable: "--font-fifa-26",
});

const fwc2026 = localFont({
  src: "../../public/fonts/FWC2026-SemiExpandedBlack.ttf",
  variable: "--font-fwc-2026",
});

export const metadata: Metadata = {
  title: "Turnuva Tahmin Ağacı - Dünya Kupası 2026",
  description: "Kendi turnuva tahmin ağacınızı oluşturun, otomatik turları atlatın ve tahminlerinizi sosyal medyada paylaşın.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${notoSans.variable} ${fifa26.variable} ${fwc2026.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
