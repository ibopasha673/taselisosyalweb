'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import { Search, Menu as MenuIcon, Phone, Info, Home, MessageCircle, ArrowLeft, CalendarCheck } from 'lucide-react'

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

export default function UrunDetayPage() {
  const params = useParams()
  const id = params?.id as string

  const [urun, setUrun] = useState<UrunItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    async function fetchUrun() {
      setLoading(true)
      setNotFound(false)
      const { data, error } = await supabase.from('urunler').select('*').eq('id', id).single()
      if (error || !data) {
        setNotFound(true)
        setUrun(null)
      } else {
        setUrun(data)
      }
      setLoading(false)
    }
    fetchUrun()
  }, [id])

  const whatsappMesaji = urun
    ? encodeURIComponent(`Merhaba, ${urun.urun_ismi} hakkında bilgi almak istiyorum.`)
    : ''

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
              <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-amber-900/40 text-stone-300 hover:text-amber-100 transition-colors">
                <MenuIcon className="w-4 h-4 text-amber-500" /> ÜRÜNLERİMİZ / MENÜ
              </Link>
              <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-amber-900/40 text-stone-300 hover:text-amber-100 transition-colors">
                <Home className="w-4 h-4 text-amber-500" /> ANA SAYFA
              </Link>
              <Link href="/hakkimizda" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-amber-900/40 text-stone-300 hover:text-amber-100 transition-colors">
                <Info className="w-4 h-4 text-amber-500" /> HAKKIMIZDA
              </Link>
              <Link href="/rezervasyon" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-amber-900/40 text-stone-300 hover:text-amber-100 transition-colors">
                <CalendarCheck className="w-4 h-4 text-amber-500" /> REZERVASYON
              </Link>
              <Link href="/#iletisim" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-amber-900/40 text-stone-300 hover:text-amber-100 transition-colors">
                <Phone className="w-4 h-4 text-amber-500" /> İLETİŞİM
              </Link>
            </div>
          </div>
        </header>

        {/* Ürün Detay İçeriği */}
        <section className="max-w-4xl mx-auto px-4 py-8">
          <Link
            href="/#urun-listesi"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-800 hover:text-amber-600 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Menüye Dön
          </Link>

          {loading ? (
            <div className="py-24 text-center text-stone-400 text-sm">Yükleniyor...</div>
          ) : notFound || !urun ? (
            <div className="py-24 text-center">
              <p className="text-stone-500 text-sm mb-4">Bu ürün bulunamadı.</p>
              <Link href="/#urun-listesi" className="text-amber-800 font-semibold text-sm hover:text-amber-600">
                Menüye dön
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm">
              {urun.urun_gorseli1 && (
                <div className="relative h-64 md:h-96 w-full bg-stone-100">
                  <Image src={urun.urun_gorseli1} alt={urun.urun_ismi} fill className="object-cover" />
                </div>
              )}
              <div className="p-6 md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-stone-800 break-words min-w-0">{urun.urun_ismi}</h1>
                  {urun.fiyat != null && (
                    <span className="text-xl md:text-2xl font-bold text-amber-800 whitespace-nowrap">{urun.fiyat} ₺</span>
                  )}
                </div>
                {urun.kategori_ismi && (
                  <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 mb-4">
                    {urun.kategori_ismi}
                  </span>
                )}
                <p className="text-sm md:text-base text-stone-600 leading-relaxed mb-8 break-words">{urun.urun_aciklamasi}</p>

                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${whatsappMesaji}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-3 rounded-xl text-sm tracking-wide transition-colors shadow-md"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp&apos;tan Bilgi Al
                </a>
              </div>
            </div>
          )}
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
