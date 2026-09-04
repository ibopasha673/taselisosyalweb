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

// Google'a "bu logo bu işletmeye ait" bilgisini sitemap değil, bu yapısal
// veri (JSON-LD) anlatır — marka aramasında/bilgi panelinde logonun doğru
// gösterilmesi buna bağlı. sameAs listesi ortam değişkenlerinden geliyor,
// dolayısıyla .env.local'daki Instagram/Facebook adresleriyle otomatik
// senkron kalır.
function isletmeYapisalVerisi() {
  const sosyalHesaplar = [process.env.NEXT_PUBLIC_INSTAGRAM_URL, process.env.NEXT_PUBLIC_FACEBOOK_URL].filter(
    Boolean
  );
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "Taşeli Sosyal Tesisleri",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    image: `${SITE_URL}/logo.png`,
    telephone: "+905392247570",
    servesCuisine: "Türk Mutfağı",
    priceRange: "₺₺",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Sarıveliler",
      addressRegion: "Karaman",
      addressCountry: "TR",
    },
    ...(sosyalHesaplar.length ? { sameAs: sosyalHesaplar } : {}),
  };
}

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
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(isletmeYapisalVerisi()) }}
        />
        {children}
      </body>
    </html>
  );
}