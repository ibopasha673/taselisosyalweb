import type { MetadataRoute } from 'next'

const BASE_URL = 'https://taselisosyaltesisi.com'

// Next.js bu dosyayı otomatik olarak /robots.txt adresinde yayınlar.
// Admin panelinin (giriş ekranı dahil) arama motorları tarafından
// taranıp indexlenmesini engelliyoruz — müşteri tarafı tamamen açık.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
