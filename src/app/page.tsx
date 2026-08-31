'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import { Search, Menu as MenuIcon, Phone, Info, Home, ChevronRight, MessageCircle } from 'lucide-react'

// lucide-react bu projede marka/logo ikonlarını (Instagram, Facebook) içermiyor,
// bu yüzden bağımsız, sade birer SVG olarak tanımlıyoruz.
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
    </svg>
  )
}

type SliderItem = {
  id: string
  baslik: string
  slogan: string
  gorsel_url: string
  slogan_durum: boolean
  baslik_durum: boolean
}

type KategoriItem = {
  id: string
  sira_numarasi: number
  kategori_ismi: string
}

type UrunItem = {
  id: string
  kategori_uuid: string
  kategori_ismi: string
  urun_ismi: string
  urun_aciklamasi: string
  urun_gorseli1: string
  urun_gorseli2: string
  one_cikanlar: boolean
  fiyat: number | null
}

export default function HomePage() {
  const [sliders, setSliders] = useState<SliderItem[]>([])
  const [kategoriler, setKategoriler] = useState<KategoriItem[]>([])
  const [urunler, setUrunler] = useState<UrunItem[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  // null => "Tümü" seçili, aksi halde seçili kategorinin id'si
  const [selectedKategoriId, setSelectedKategoriId] = useState<string | null>(null)

  // Admin panelinden "Öne Çıkar" işaretlenen ürünler
  const featuredItems = urunler.filter((u) => u.one_cikanlar)

  // Pill filtreye göre gösterilecek ürünler ("Tümü" seçiliyken hepsi)
  const filtrelenmisUrunler = selectedKategoriId
    ? urunler.filter((u) => u.kategori_uuid === selectedKategoriId)
    : urunler

  useEffect(() => {
    async function fetchData() {
      const { data: sliderData } = await supabase.from('sliders').select('*').order('created_time', { ascending: false })
      if (sliderData) setSliders(sliderData)

      const { data: kategoriData } = await supabase.from('kategoriler').select('*').order('sira_numarasi', { ascending: true })
      if (kategoriData) setKategoriler(kategoriData)

      const { data: urunData } = await supabase.from('urunler').select('*').order('created_time', { ascending: false })
      if (urunData) setUrunler(urunData)
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (sliders.length <= 1) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliders.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [sliders.length])

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-stone-800 font-sans flex flex-col justify-between">
      <div>
        {/* Üst İnce Duyuru Barı */}
        <div className="bg-[#4a2e1b] text-amber-100 text-xs md:text-sm py-2 text-center font-medium tracking-wide px-4">
          TOROSLARDAN GELEN LEZZET VE HUZUR, TAŞELİ&apos;NİN KALBİNDE SİZLERİ BEKLİYOR.
        </div>

        {/* Header / Navigasyon Alanı */}
        <header className="bg-[#2c1810] text-stone-200 shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-amber-600/60 bg-stone-100 shadow-inner">
                <Image src="/logo.png" alt="Taşeli Sosyal Tesisleri" fill className="object-cover" />
              </div>
              <div>
                <span className="block font-bold text-lg md:text-xl tracking-wider text-amber-100">TAŞELİ SOSYAL TESİSLERİ</span>
                <span className="text-xs font-semibold tracking-widest text-amber-500">SARIVELİLER</span>
              </div>
            </Link>

            <div className="relative w-full md:w-80">
              <input 
                type="text" 
                placeholder="Yemek veya ürün arayınız..." 
                className="w-full bg-[#1e100a] border border-amber-900/40 rounded-full py-2 pl-4 pr-10 text-sm text-stone-200 placeholder-stone-400 focus:outline-none focus:border-amber-600 transition-colors"
              />
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-stone-400" />
            </div>
          </div>

          <div className="bg-[#3b2216] border-t border-amber-900/30">
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-center md:justify-start gap-1 sm:gap-6 overflow-x-auto py-2 text-sm font-medium">
              <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-700/40 text-amber-100 transition-colors">
                <MenuIcon className="w-4 h-4 text-amber-400" /> ÜRÜNLERİMİZ / MENÜ
              </Link>
              <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-amber-900/40 text-stone-300 hover:text-amber-100 transition-colors">
                <Home className="w-4 h-4 text-amber-500" /> ANA SAYFA
              </Link>
              <Link href="/hakkimizda" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-amber-900/40 text-stone-300 hover:text-amber-100 transition-colors">
                <Info className="w-4 h-4 text-amber-500" /> HAKKIMIZDA
              </Link>
              <Link href="#iletisim" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-amber-900/40 text-stone-300 hover:text-amber-100 transition-colors">
                <Phone className="w-4 h-4 text-amber-500" /> İLETİŞİM
              </Link>
            </div>
          </div>
        </header>

        {/* Orta Bölüm: Sol Kategoriler + Sağ Dinamik Slider Alanı */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            {/* Sol Kısım: Dinamik Kategoriler */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
              <div className="bg-[#4a2e1b] text-amber-100 px-4 py-3 font-bold text-sm tracking-wide">
                YEMEK KATEGORİLERİ
              </div>
              <div className="divide-y divide-stone-100 text-sm">
                {kategoriler.length === 0 ? (
                  <div className="px-4 py-3 text-stone-500 text-xs">Henüz kategori eklenmedi.</div>
                ) : (
                  kategoriler.map((kat) => (
                    <Link
                      key={kat.id}
                      href="#urun-listesi"
                      onClick={() => setSelectedKategoriId(kat.id)}
                      className="flex items-center justify-between px-4 py-3 text-stone-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
                    >
                      <span className="font-medium">{kat.kategori_ismi}</span>
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Sağ Kısım: 7 Saniyede Bir Kayan Slider */}
            <div className="lg:col-span-3 relative h-[260px] md:h-[310px] rounded-2xl overflow-hidden shadow-md bg-[#2c1810] flex items-center">
              {sliders.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-stone-400 text-sm">
                  Henüz slider eklenmedi.
                </div>
              ) : (
                sliders.map((slider, index) => (
                  <div 
                    key={slider.id}
                    className={`absolute inset-0 transition-opacity duration-1000 flex items-center p-8 ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                  >
                    <div className="absolute inset-0 z-0">
                      <Image 
                        src={slider.gorsel_url} 
                        alt="Slider Görseli" 
                        fill 
                        className="object-cover filter brightness-[0.4]"
                      />
                    </div>
                    <div className="relative z-10 max-w-xl text-white">
                      {slider.baslik_durum && slider.baslik && (
                        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3 text-amber-100">
                          {slider.baslik}
                        </h2>
                      )}
                      {slider.slogan_durum && slider.slogan && (
                        <p className="text-xs md:text-sm text-stone-200 leading-relaxed">
                          {slider.slogan}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Slider Noktaları */}
              {sliders.length > 1 && (
                <div className="absolute bottom-3 right-4 z-20 flex gap-1.5">
                  {sliders.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? 'bg-amber-500 w-5' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>
        </section>

        {/* Öne Çıkanlar */}
        {featuredItems.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 pb-10">
            <div className="flex items-center gap-2 mb-6 border-b border-stone-200 pb-3">
              <div className="w-3 h-3 rounded-full bg-amber-800"></div>
              <h2 className="text-xl font-bold text-stone-800">Öne Çıkanlar</h2>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2">
              {featuredItems.map((item) => (
                <div key={item.id} className="w-40 sm:w-48 flex-shrink-0 bg-white rounded-xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
                  {item.urun_gorseli1 && (
                    <div className="relative h-28 sm:h-32 w-full bg-stone-100">
                      <Image src={item.urun_gorseli1} alt={item.urun_ismi} fill className="object-cover" />
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="font-bold text-sm text-stone-800 truncate">{item.urun_ismi}</h3>
                    {item.fiyat != null && (
                      <span className="text-sm font-bold text-amber-800">{item.fiyat} ₺</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Ürün Listeleme Alanı: Üstte Kategori Filtresi, Altında Ürünler */}
        <section id="urun-listesi" className="max-w-7xl mx-auto px-4 pb-16">
          {/* Kategori Filtre Pilleri */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-8">
            <button
              type="button"
              onClick={() => setSelectedKategoriId(null)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border ${
                selectedKategoriId === null
                  ? 'bg-amber-800 text-white border-amber-800'
                  : 'bg-white text-stone-700 border-stone-300 hover:border-amber-600'
              }`}
            >
              Tümü
            </button>
            {kategoriler.map((kat) => (
              <button
                key={kat.id}
                type="button"
                onClick={() => setSelectedKategoriId(kat.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border ${
                  selectedKategoriId === kat.id
                    ? 'bg-amber-800 text-white border-amber-800'
                    : 'bg-white text-stone-700 border-stone-300 hover:border-amber-600'
                }`}
              >
                {kat.kategori_ismi}
              </button>
            ))}
          </div>

          {/* Filtrelenmiş Ürün Kartları */}
          {filtrelenmisUrunler.length === 0 ? (
            <p className="text-sm text-stone-500 text-center py-12">Bu kategoride henüz ürün bulunmuyor.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filtrelenmisUrunler.map((urun) => (
                <div key={urun.id} className="bg-white rounded-xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                  {urun.urun_gorseli1 && (
                    <div className="relative h-48 w-full bg-stone-100">
                      <Image src={urun.urun_gorseli1} alt={urun.urun_ismi} fill className="object-cover" />
                    </div>
                  )}
                  <div className="p-4 flex-grow">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <h3 className="font-bold text-base text-stone-800">{urun.urun_ismi}</h3>
                      {urun.fiyat != null && (
                        <span className="font-bold text-amber-800 whitespace-nowrap">{urun.fiyat} ₺</span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500">{urun.urun_aciklamasi}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* İletişim */}
        <section id="iletisim" className="bg-[#2c1810] border-t border-amber-950/60">
          <div className="max-w-5xl mx-auto px-4 py-5">
            <div className="flex flex-col sm:flex-row sm:items-stretch gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:pr-3 shrink-0">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <h2 className="text-sm font-bold text-amber-100 tracking-wide uppercase">İletişim</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 bg-[#3b2216] hover:bg-[#4a2e1b] border border-amber-900/40 rounded-lg px-3 py-2 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-md bg-amber-900/40 flex items-center justify-center shrink-0 group-hover:bg-amber-800/50 transition-colors">
                    <MessageCircle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex flex-col leading-tight min-w-0">
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">WhatsApp</span>
                    <span className="text-sm font-bold text-amber-100 truncate">0539 224 75 70</span>
                  </div>
                </a>
                <a
                  href={process.env.NEXT_PUBLIC_INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 bg-[#3b2216] hover:bg-[#4a2e1b] border border-amber-900/40 rounded-lg px-3 py-2 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-md bg-amber-900/40 flex items-center justify-center shrink-0 group-hover:bg-amber-800/50 transition-colors">
                    <InstagramIcon className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex flex-col leading-tight min-w-0">
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Instagram</span>
                    <span className="text-sm font-bold text-amber-100 truncate">@taselisosyaltesisi</span>
                  </div>
                </a>
                <a
                  href={process.env.NEXT_PUBLIC_FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 bg-[#3b2216] hover:bg-[#4a2e1b] border border-amber-900/40 rounded-lg px-3 py-2 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-md bg-amber-900/40 flex items-center justify-center shrink-0 group-hover:bg-amber-800/50 transition-colors">
                    <FacebookIcon className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex flex-col leading-tight min-w-0">
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Facebook</span>
                    <span className="text-sm font-bold text-amber-100 truncate">Taşeli Sosyal Tesisleri</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="bg-[#1c0f0a] text-stone-400 py-8 border-t border-amber-950 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 Taşeli Sosyal Tesisleri - Sarıveliler. Tüm hakları saklıdır.</p>
          <Link href="/admin/login" className="text-stone-600 hover:text-stone-400 transition-colors tracking-widest text-[10px]">
            • YÖNETİM
          </Link>
        </div>
      </footer>
    </div>
  )
}