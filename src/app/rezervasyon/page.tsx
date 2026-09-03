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
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { type MasaTanimi } from '@/lib/masalar'
import { RezervasyonKrokisi, type RezervasyonKaydi } from '@/components/RezervasyonKrokisi'
import { ekranYakinlastirmasiniSifirla } from '@/lib/ekranYakinlastirma'

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
  const [kvkkOnay, setKvkkOnay] = useState(false)
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
        // KVKK Aydınlatma Metni ve Gizlilik Politikası onay kaydı — ne zaman onayladığı
        // ile birlikte tutuluyor ki gerektiğinde ispat edilebilsin.
        kvkk_onay: kvkkOnay,
        kvkk_onay_tarihi: kvkkOnay ? new Date().toISOString() : null,
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
    setKvkkOnay(false)
  }

  function kapat() {
    setSecilenMasa(null)
    setForm(BOS_FORM)
    setAdim('form')
    setHata('')
    setKvkkOnay(false)
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
    if (!kvkkOnay) {
      setHata("Devam etmek için KVKK Aydınlatma Metni ve Gizlilik Politikası'nı onaylamanız gerekiyor.")
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

      {/* Seçilen masa onay kutusu — mobilde tüm ekranı kaplar, sm ve üzerinde ortalanmış kutu */}
      {secilenMasa && (
        <div
          className="fixed inset-0 z-50 bg-black/50 overflow-y-auto sm:flex sm:items-center sm:justify-center sm:p-6"
          onClick={kapat}
        >
          <div
            className="min-h-full w-full bg-[#fdf8ef] sm:min-h-0 sm:max-h-[90vh] sm:w-full sm:max-w-sm sm:overflow-y-auto sm:rounded-2xl sm:border sm:border-[#c9a97e] sm:shadow-2xl"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Başlık şeridi */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-[#2c1810] px-5 py-4 sm:rounded-t-2xl">
              <div>
                <h3 className="text-lg font-extrabold leading-tight text-amber-100">
                  {secilenKayit?.masa_adi ?? secilenMasa.kisaltma}
                </h3>
                <p className="mt-0.5 text-xs font-mono text-amber-200/60">{secilenMasa.kisaltma}</p>
              </div>
              <button
                type="button"
                onClick={kapat}
                aria-label="Kapat"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-amber-200/80 transition-colors hover:bg-amber-900/40 hover:text-amber-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              {secilenKayit?.masanin_rezerve_olasiligi?.length ? (
                <p className="mb-5 flex items-center gap-1.5 text-sm text-[#6b4226]">
                  <Users className="h-4 w-4 text-amber-700" />
                  {Math.min(...secilenKayit.masanin_rezerve_olasiligi)}-
                  {Math.max(...secilenKayit.masanin_rezerve_olasiligi)} kişilik gruplar için uygun
                </p>
              ) : (
                <p className="mb-5 text-sm text-[#8a6a4a]">Kişi kapasitesi için bize WhatsApp&apos;tan sorabilirsin.</p>
              )}

              {adim === 'form' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#8a6a4a]">
                        Tarih
                      </label>
                      <input
                        type="date"
                        min={bugun}
                        value={form.tarih}
                        onChange={(e) => setForm((f) => ({ ...f, tarih: e.target.value }))}
                        onFocus={ekranYakinlastirmasiniSifirla}
                        className="w-full rounded-lg border border-[#d9c3a0] bg-white px-3 py-2.5 text-base text-[#3b2216] focus:border-amber-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#8a6a4a]">
                        Saat
                      </label>
                      <input
                        type="time"
                        value={form.saat}
                        onChange={(e) => setForm((f) => ({ ...f, saat: e.target.value }))}
                        onFocus={ekranYakinlastirmasiniSifirla}
                        className="w-full rounded-lg border border-[#d9c3a0] bg-white px-3 py-2.5 text-base text-[#3b2216] focus:border-amber-600 focus:outline-none"
                      />
                    </div>
                  </div>
                  {form.tarih && (
                    <p className="-mt-2 text-[11px] font-semibold text-amber-700">{gunHesapla(form.tarih)} günü için</p>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#8a6a4a]">
                        Ad
                      </label>
                      <input
                        type="text"
                        value={form.isim}
                        onChange={(e) => setForm((f) => ({ ...f, isim: e.target.value }))}
                        onFocus={ekranYakinlastirmasiniSifirla}
                        placeholder="Adınız"
                        className="w-full rounded-lg border border-[#d9c3a0] bg-white px-3 py-2.5 text-base text-[#3b2216] placeholder-[#b79c7c] focus:border-amber-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#8a6a4a]">
                        Soyad
                      </label>
                      <input
                        type="text"
                        value={form.soyisim}
                        onChange={(e) => setForm((f) => ({ ...f, soyisim: e.target.value }))}
                        onFocus={ekranYakinlastirmasiniSifirla}
                        placeholder="Soyadınız"
                        className="w-full rounded-lg border border-[#d9c3a0] bg-white px-3 py-2.5 text-base text-[#3b2216] placeholder-[#b79c7c] focus:border-amber-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#8a6a4a]">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={form.telefon}
                      onChange={(e) => setForm((f) => ({ ...f, telefon: e.target.value }))}
                      onFocus={ekranYakinlastirmasiniSifirla}
                      placeholder="05xx xxx xx xx"
                      className="w-full rounded-lg border border-[#d9c3a0] bg-white px-3 py-2.5 text-base text-[#3b2216] placeholder-[#b79c7c] focus:border-amber-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#8a6a4a]">
                      Kişi Sayısı
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={form.kacKisi}
                      onChange={(e) => setForm((f) => ({ ...f, kacKisi: e.target.value }))}
                      onFocus={ekranYakinlastirmasiniSifirla}
                      placeholder="Örn: 4"
                      className="w-full rounded-lg border border-[#d9c3a0] bg-white px-3 py-2.5 text-base text-[#3b2216] placeholder-[#b79c7c] focus:border-amber-600 focus:outline-none"
                    />
                  </div>

                  <label className="flex items-start gap-2.5 rounded-lg border border-[#d9c3a0] bg-[#f5ead8]/60 px-3 py-2.5 text-xs leading-relaxed text-[#5c4530] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kvkkOnay}
                      onChange={(e) => setKvkkOnay(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-amber-700"
                    />
                    <span>
                      <Link
                        href="/gizlilik-politikasi"
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold text-amber-800 underline hover:text-amber-900"
                      >
                        KVKK Aydınlatma Metni ve Gizlilik Politikası
                      </Link>
                      &apos;nı okudum, kişisel verilerimin rezervasyon işlemleri kapsamında işlenmesini kabul
                      ediyorum.
                    </span>
                  </label>

                  {hata && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                      {hata}
                    </p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={formuDogrulaVeIlerle}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 py-3 text-sm font-bold tracking-wide text-white shadow-sm transition-colors hover:bg-amber-600"
                    >
                      Devam Et
                    </button>
                    <button
                      type="button"
                      onClick={kapat}
                      className="rounded-xl px-4 py-3 text-sm font-semibold text-[#8a6a4a] transition-colors hover:bg-[#f0e4cf]"
                    >
                      Vazgeç
                    </button>
                  </div>
                </div>
              )}

              {adim === 'telefon-onay' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-[#d9c3a0] bg-[#f5ead8] p-4 text-center">
                    <p className="mb-1 text-xs text-[#8a6a4a]">Girdiğiniz telefon numarası</p>
                    <p className="text-lg font-bold tracking-wide text-[#3b2216]">{form.telefon}</p>
                  </div>
                  <p className="text-center text-xs leading-relaxed text-[#6b4226]">
                    Bu numara doğru mu? Rezervasyon talebiniz bu bilgilerle yönetime iletilecek.
                  </p>
                  {hata && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-700">
                      {hata}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={rezervasyonuGonder}
                      disabled={gonderiliyor}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold tracking-wide text-white shadow-sm transition-colors hover:bg-emerald-500 disabled:opacity-60"
                    >
                      {gonderiliyor ? 'Gönderiliyor...' : 'Evet, Rezervasyonu Gönder'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdim('form')}
                      className="rounded-xl px-4 py-3 text-sm font-semibold text-[#8a6a4a] transition-colors hover:bg-[#f0e4cf]"
                    >
                      Düzelt
                    </button>
                  </div>
                </div>
              )}

              {adim === 'gonderildi' && secilenMasa && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                    <p className="mb-1 text-sm font-bold text-emerald-800">Rezervasyonunuz gönderildi</p>
                    <p className="text-xs leading-relaxed text-emerald-700">
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
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold tracking-wide text-white shadow-sm transition-colors hover:bg-emerald-500"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp&apos;tan Bilgilendir
                  </button>
                  <button
                    type="button"
                    onClick={kapat}
                    className="w-full py-1 text-center text-xs text-[#8a6a4a] transition-colors hover:text-[#3b2216]"
                  >
                    Kapat
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="bg-[#1c0f0a] text-stone-400 py-8 border-t border-amber-950 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 Taşeli Sosyal Tesisleri - Sarıveliler. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-4">
            <Link href="/gizlilik-politikasi" className="text-stone-500 hover:text-stone-300 transition-colors tracking-wide">
              KVKK Aydınlatma Metni ve Gizlilik Politikası
            </Link>
            <Link href="/admin/login" className="text-stone-600 hover:text-stone-400 transition-colors tracking-widest text-[10px]">
              • YÖNETİM
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
