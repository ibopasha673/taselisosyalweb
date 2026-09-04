import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

// Google Search Console'a tanımlanacak kanonik alan adı — www'siz, https.
const BASE_URL = 'https://taselisosyaltesisi.com'

// Next.js bu dosyayı otomatik olarak /sitemap.xml adresinde yayınlar.
// Admin paneli (/admin, /admin/login) bilinçli olarak dışarıda bırakıldı —
// müşteri tarafına açık olmayan bir sayfa arama sonuçlarında görünmemeli
// (bkz. robots.ts, orada da ayrıca engelleniyor).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sabitSayfalar: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/rezervasyon`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/hakkimizda`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/gizlilik-politikasi`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Ürün detay sayfaları veritabanından dinamik olarak çekiliyor — yeni bir
  // ürün eklendiğinde ya da silindiğinde sitemap otomatik güncellenmiş olur,
  // elle bir liste tutmaya gerek kalmaz.
  let urunSayfalari: MetadataRoute.Sitemap = []
  try {
    const { data: urunler } = await supabase.from('urunler').select('id, created_time')
    urunSayfalari = (urunler ?? []).map((urun) => ({
      url: `${BASE_URL}/urun/${urun.id}`,
      lastModified: urun.created_time ? new Date(urun.created_time) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }))
  } catch {
    // Veritabanına erişilemezse sitemap tamamen boş dönmesin diye sabit
    // sayfalar yine de yayınlanır; ürün sayfaları o çalıştırmada eksik kalır.
  }

  return [...sabitSayfalar, ...urunSayfalari]
}
