'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Search,
  Menu as MenuIcon,
  Phone,
  Info,
  Home,
  MessageCircle,
  CalendarCheck,
  Users,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { type MasaTanimi } from '@/lib/masalar'
import { RezervasyonKrokisi, type RezervasyonKaydi } from '@/components/RezervasyonKrokisi'

type RezervasyonForm = {
  tarih: string
  saat: string
  isim: string
  soyisim: string
  telefon: string
  kacKisi: string
}

const BOS_FORM: RezervasyonForm = { tarih: '', saat: '', isim: '', soyisim: '', telefon: '', kacKisi: '' }

// Pazar günü JS'te 0 olduğu için dizi Pazar'dan başlıyor; getDay() index'iyle birebir eşleşsin diye.
const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

function gunHesapla(tarih: string): string {
  if (!tarih) return ''
  const d = new Date(tarih + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return ''
  return GUNLER[d.getDay()]
}


export default function RezervasyonPage() {
  const [kayitlar, setKayitlar] = useState<Record<string, RezervasyonKaydi>>({})
  const [tabloYok, setTabloYok] = useState(false)
  const [secilenMasa, setSecilenMasa] = useState<MasaTanimi | null>(null)
  const [form, setForm] = useState<RezervasyonForm>(BOS_FORM)
  const [adim, setAdim] = useState<'form' | 'telefon-onay' | 'gonderildi'>('form')
  const [hata, setHata] = useState('')
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const bugun = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    async function fetchRezervasyon() {
      const { data, error } = await supabase.from('rezervasyon').select('*')
      if (error) {
        setTabloYok(true)
        return
      }
      const map: Record<string, RezervasyonKaydi> = {}
      for (const row of data ?? []) {
        map[row.masa_kisaltmasi] = row as RezervasyonKaydi
      }
      setKayitlar(map)
    }
    fetchRezervasyon()
  }, [])

  function whatsappaGit(tanim: MasaTanimi) {
    const kayit = kayitlar[tanim.kisaltma]
    const masaAdi = kayit?.masa_adi ?? tanim.kisaltma
    const gun = gunHesapla(form.tarih)
    const tarihGosterim = form.tarih ? new Date(form.tarih + 'T00:00:00').toLocaleDateString('tr-TR') : ''
    const mesaj = [
      `Merhaba, ${masaAdi} (${tanim.kisaltma}) için rezervasyon yaptım, sizi bilgilendirmek istiyorum.`,
      '',
      `Ad Soyad: ${form.isim} ${form.soyisim}`,
      `Telefon: ${form.telefon}`,
      `Kişi Sayısı: ${form.kacKisi}`,
      `Tarih: ${tarihGosterim}${gun ? ` (${gun})` : ''}`,
      `Saat: ${form.saat}`,
    ].join('\n')
    window.open(`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(mesaj)}`, '_blank')
  }

  // Telefon onaylandıktan sonra: rezervasyonu "mevcut_rezervasyonlar" kuyruğuna
  // durum=false (bekliyor) olarak ekler. Yönetici WhatsApp'tan haberdar olduktan
  // sonra panelden "Aktif Et" diyerek onaylayacak.
  async function rezervasyonuGonder() {
    if (!secilenMasa) return
    const kayit = kayitlar[secilenMasa.kisaltma]
    if (!kayit) {
      setHata("Bu masa için rezervasyon altyapısı henüz hazır değil. Lütfen WhatsApp'tan bize ulaşın.")
      setAdim('form')
      return
    }
    setGonderiliyor(true)
    const { error } = await supabase.from('mevcut_rezervasyonlar').insert([
      {
        masa_uuid: kayit.id,
        masa_ismi: kayit.masa_adi,
        masa_kisaltmasi: secilenMasa.kisaltma,
        isim: form.isim.trim(),
        soyisim: form.soyisim.trim(),
        telefon_numarasi: form.telefon.trim(),
        kac_kisi: Number(form.kacKisi),
        rezervasyon_tarihi: form.tarih,
        rezervasyon_saati: form.saat,
        rezervasyon_tarihi_gunu: gunHesapla(form.tarih),
        durum: false,
      },
    ])
    setGonderiliyor(false)
    if (error) {
      setHata("Rezervasyon gönderilemedi, lütfen tekrar deneyin ya da WhatsApp'tan bize ulaşın.")
      setAdim('form')
      return
    }
    setAdim('gonderildi')
  }

  function masaSec(tanim: MasaTanimi) {
    setSecilenMasa(tanim)
    setForm(BOS_FORM)
    setAdim('form')
    setHata('')
  }

  function kapat() {
    setSecilenMasa(null)
    setForm(BOS_FORM)
    setAdim('form')
    setHata('')
  }

  function formuDogrulaVeIlerle() {
    if (!form.tarih || !form.saat || !form.isim.trim() || !form.soyisim.trim() || !form.telefon.trim() || !form.kacKisi) {
      setHata('Lütfen tüm alanları doldurun.')
      return
    }
    const kisi = Number(form.kacKisi)
    if (!Number.isInteger(kisi) || kisi < 1) {
      setHata('Geçerli bir kişi sayısı girin.')
      return
    }
    const olasilik = secilenKayit?.masanin_rezerve_olasiligi
    if (olasilik && olasilik.length && !olasilik.includes(kisi)) {
      setHata(
        `Bu masa ${Math.min(...olasilik)}-${Math.max(...olasilik)} kişilik gruplar için uygun. Girdiğiniz kişi sayısı bu aralığın dışında.`
      )
      return
    }
    const telefonRakam = form.telefon.replace(/\D/g, '')
    if (telefonRakam.length < 10) {
      setHata('Geçerli bir telefon numarası girin.')
      return
    }
    setHata('')
    setAdim('telefon-onay')
  }

  const secilenKayit = secilenMasa ? kayitlar[secilenMasa.kisaltma] : undefined

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
              <Link href="/rezervasyon" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-700/40 text-amber-100 transition-colors">
                <CalendarCheck className="w-4 h-4 text-amber-400" /> REZERVASYON
              </Link>
              <Link href="/#iletisim" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-amber-900/40 text-stone-300 hover:text-amber-100 transition-colors">
                <Phone className="w-4 h-4 text-amber-500" /> İLETİŞİM
              </Link>
            </div>
          </div>
        </header>

        {/* Rezervasyon İçeriği */}
        <section className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-extrabold text-stone-800 mb-2">Masa Rezervasyonu</h1>
            <p className="text-sm text-stone-600 leading-relaxed max-w-2xl">
              Aşağıdaki kroki üzerinden boş bir masaya tıkla, bilgilerini gir; rezervasyon talebin yönetime
              iletilsin. Ardından WhatsApp&apos;tan da bizi bilgilendirerek rezervasyonunu hızlandırabilirsin.
            </p>
          </div>

          {tabloYok && (
            <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg px-4 py-3">
              Masa doluluk bilgisi henüz yüklenemedi (Supabase&apos;te <code className="font-mono">rezervasyon</code>{' '}
              tablosu bulunamadı). Kroki yine de çalışır, her masaya tıklayınca WhatsApp açılır.
            </div>
          )}

          {/* Lejant */}
          <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-stone-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-sm bg-[#f2d9b6] border border-[#b45309] inline-block" /> Müsait
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-sm bg-stone-200 border border-stone-400 inline-block" /> Dolu
            </div>
          </div>

          <div className="bg-[#fdf8ef] border border-[#c9a97e] rounded-2xl shadow-sm p-3 md:p-5">
            <RezervasyonKrokisi kayitlar={kayitlar} onMasaTikla={masaSec} />
          </div>
        </section>
      </div>

      {/* Seçilen masa onay kutusu */}
      {secilenMasa && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 py-6" onClick={kapat}>
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-stone-200 max-h-[90vh] overflow-y-auto"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <h3 className="text-lg font-extrabold text-stone-800 mb-1">
              {secilenKayit?.masa_adi ?? secilenMasa.kisaltma}
            </h3>
            <p className="text-xs font-mono text-stone-500 mb-3">{secilenMasa.kisaltma}</p>
            {secilenKayit?.masanin_rezerve_olasiligi?.length ? (
              <p className="flex items-center gap-1.5 text-sm text-stone-600 mb-4">
                <Users className="w-4 h-4 text-amber-700" />
                {Math.min(...secilenKayit.masanin_rezerve_olasiligi)}-
                {Math.max(...secilenKayit.masanin_rezerve_olasiligi)} kişilik gruplar için uygun
              </p>
            ) : (
              <p className="text-sm text-stone-500 mb-4">Kişi kapasitesi için bize WhatsApp&apos;tan sorabilirsin.</p>
            )}

            {adim === 'form' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
                      Tarih
                    </label>
                    <input
                      type="date"
                      min={bugun}
                      value={form.tarih}
                      onChange={(e) => setForm((f) => ({ ...f, tarih: e.target.value }))}
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
                      Saat
                    </label>
                    <input
                      type="time"
                      value={form.saat}
                      onChange={(e) => setForm((f) => ({ ...f, saat: e.target.value }))}
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </div>
                {form.tarih && (
                  <p className="text-[11px] font-semibold text-amber-700">{gunHesapla(form.tarih)} günü için</p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
                      Ad
                    </label>
                    <input
                      type="text"
                      value={form.isim}
                      onChange={(e) => setForm((f) => ({ ...f, isim: e.target.value }))}
                      placeholder="Adınız"
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
                      Soyad
                    </label>
                    <input
                      type="text"
                      value={form.soyisim}
                      onChange={(e) => setForm((f) => ({ ...f, soyisim: e.target.value }))}
                      placeholder="Soyadınız"
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={form.telefon}
                    onChange={(e) => setForm((f) => ({ ...f, telefon: e.target.value }))}
                    placeholder="05xx xxx xx xx"
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
                    Kişi Sayısı
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.kacKisi}
                    onChange={(e) => setForm((f) => ({ ...f, kacKisi: e.target.value }))}
                    placeholder="Örn: 4"
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-600"
                  />
                </div>

                {hata && <p className="text-xs font-semibold text-red-600">{hata}</p>}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={formuDogrulaVeIlerle}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-600 text-white font-bold px-4 py-3 rounded-xl text-sm tracking-wide transition-colors"
                  >
                    Devam Et
                  </button>
                  <button
                    type="button"
                    onClick={kapat}
                    className="px-4 py-3 rounded-xl text-sm font-semibold text-stone-500 hover:bg-stone-100 transition-colors"
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            )}

            {adim === 'telefon-onay' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <p className="text-xs text-stone-500 mb-1">Girdiğiniz telefon numarası</p>
                  <p className="text-lg font-bold text-stone-800 tracking-wide">{form.telefon}</p>
                </div>
                <p className="text-xs text-stone-600 text-center leading-relaxed">
                  Bu numara doğru mu? Rezervasyon talebiniz bu bilgilerle yönetime iletilecek.
                </p>
                {hata && <p className="text-xs font-semibold text-red-600 text-center">{hata}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={rezervasyonuGonder}
                    disabled={gonderiliyor}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-3 rounded-xl text-sm tracking-wide transition-colors disabled:opacity-60"
                  >
                    {gonderiliyor ? 'Gönderiliyor...' : 'Evet, Rezervasyonu Gönder'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdim('form')}
                    className="px-4 py-3 rounded-xl text-sm font-semibold text-stone-500 hover:bg-stone-100 transition-colors"
                  >
                    Düzelt
                  </button>
                </div>
              </div>
            )}

            {adim === 'gonderildi' && secilenMasa && (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <p className="text-sm font-bold text-emerald-800 mb-1">Rezervasyonunuz gönderildi</p>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Rezervasyonunuz Taşeli Sosyal Tesisleri yönetimine gönderildi. Lütfen WhatsApp&apos;tan bizleri
                    bilgilendirin.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    whatsappaGit(secilenMasa)
                    kapat()
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-3 rounded-xl text-sm tracking-wide transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp&apos;tan Bilgilendir
                </button>
                <button
                  type="button"
                  onClick={kapat}
                  className="w-full text-center text-xs text-stone-500 hover:text-stone-700 py-1 transition-colors"
                >
                  Kapat
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
