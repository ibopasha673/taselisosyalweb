import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://taselisosyaltesisi.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TAŞELİ SOSYAL TESİSLERİ | SARIVELİLER",
    template: "%s | Taşeli Sosyal Tesisleri",
  },
  description: "Sarıveliler Taşeli Sosyal Tesisleri resmi web sitesi. Eşsiz lezzetler ve huzurlu bir ortam.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: SITE_URL,
    siteName: "Taşeli Sosyal Tesisleri",
    title: "TAŞELİ SOSYAL TESİSLERİ | SARIVELİLER",
    description: "Sarıveliler Taşeli Sosyal Tesisleri resmi web sitesi. Eşsiz lezzetler ve huzurlu bir ortam.",
    images: [{ url: "/logo.png" }],
  },
  twitter: {
    card: "summary",
    title: "TAŞELİ SOSYAL TESİSLERİ | SARIVELİLER",
    description: "Sarıveliler Taşeli Sosyal Tesisleri resmi web sitesi. Eşsiz lezzetler ve huzurlu bir ortam.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  // Alan adını Search Console'a DNS (TXT kaydı) yöntemiyle doğruladığın için
  // burada ayrıca bir HTML etiketi doğrulaması gerekmiyor — DNS doğrulaması
  // tek başına yeterli ve zaten alan adının tamamını (www dahil) kapsıyor.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">{children}</body>
    </html>
  );
}