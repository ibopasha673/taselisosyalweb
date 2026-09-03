// Yönetim panelindeki rezervasyon talep kuyruğu: müşterilerin /rezervasyon
// sayfasından gönderdiği talepler burada "Bekliyor" olarak düşer, yönetici
// tek tuşla "Aktif Et"tiğinde hem bu satır hem "rezervasyon" tablosundaki
// masa satırı güncellenir ve müşteriye WhatsApp'tan onay mesajı açılır.
// "Reddet" ile bir sebep seçilip talep silinir (aktifse masa da boşaltılır)
// ve müşteriye açıklamalı bir WhatsApp mesajı açılır.
'use client'

import { useEffect, useState } from 'react'
import { Phone, Check, Ban, Clock, CalendarCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Talep = {
  id: string
  masa_uuid: string | null
  masa_ismi: string
  masa_kisaltmasi: string
  isim: string | null
  soyisim: string | null
  telefon_numarasi: string
  kac_kisi: number | null
  rezervasyon_tarihi: string
  rezervasyon_saati: string
  rezervasyon_tarihi_gunu: string | null
  durum: boolean
  created_time: string
}

const SEBEPLER = [
  { value: 'masa_uygun_degil', label: 'Masa o tarih/saatte uygun değil' },
  { value: 'kapasite_uygun_degil', label: 'Kişi sayısı masaya uygun değil' },
  { value: 'ulasilamadi', label: 'Telefonla ulaşılamadı / bilgiler teyit edilemedi' },
  { value: 'musteri_iptali', label: 'Müşteri iptal etti' },
  { value: 'diger', label: 'Diğer' },
] as const

function tarihGosterimi(tarih: string): string {
  const d = new Date(tarih + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return tarih
  return d.toLocaleDateString('tr-TR')
}

function saatGosterimi(saat: string): string {
  return saat?.slice(0, 5) ?? saat
}

function talepZamaniGosterimi(zaman: string): string {
  const d = new Date(zaman)
  if (Number.isNaN(d.getTime())) return zaman
  return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// wa.me formatı: ülke kodu + numara, boşluk/tire/parantez olmadan. 0 ile
// başlıyorsa Türkiye kodu (90) ile değiştiriyoruz.
function waNumarasi(telefon: string): string {
  let rakam = telefon.replace(/\D/g, '')
  if (rakam.startsWith('0')) rakam = '90' + rakam.slice(1)
  else if (!rakam.startsWith('90') && rakam.length === 10) rakam = '90' + rakam
  return rakam
}

function kalanSureMetni(tarih: string, saat: string): string {
  const hedef = new Date(`${tarih}T${saat}`)
  if (Number.isNaN(hedef.getTime())) return ''
  const farkMs = hedef.getTime() - Date.now()
  if (farkMs <= 0) return 'Zamanı geçti'
  const dakikaToplam = Math.floor(farkMs / 60000)
  const gun = Math.floor(dakikaToplam / (60 * 24))
  const saatKalan = Math.floor((dakikaToplam % (60 * 24)) / 60)
  const dakika = dakikaToplam % 60
  const parcalar: string[] = []
  if (gun > 0) parcalar.push(`${gun} gün`)
  if (gun > 0 || saatKalan > 0) parcalar.push(`${saatKalan} saat`)
  parcalar.push(`${dakika} dakika`)
  return parcalar.join(' ') + ' kaldı'
}

// Not: bu bileşen krokideki masa durumuna (aşağıdaki "rezervasyon" tablosu)
// artık dokunmuyor — aktif etmek/silmek sadece bu talep kuyruğunu değiştirir,
// masayı dolu/boş işaretlemek admin'in kendi tercihine bırakılıyor.
export function RezervasyonTalepleri() {
  const [talepler, setTalepler] = useState<Talep[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [tabloYok, setTabloYok] = useState(false)
  const [islemYapiliyor, setIslemYapiliyor] = useState<string | null>(null)
  const [silmeModuId, setSilmeModuId] = useState<string | null>(null)
  const [silmeSebebi, setSilmeSebebi] = useState<string>(SEBEPLER[0].value)
  const [silmeSebebiDiger, setSilmeSebebiDiger] = useState('')
  const [, setTick] = useState(0)

  async function fetchTalepler() {
    setYukleniyor(true)
    const { data, error } = await supabase
      .from('mevcut_rezervasyonlar')
      .select('*')
      .order('created_time', { ascending: false })
    setYukleniyor(false)
    if (error) {
      setTabloYok(true)
      return
    }
    setTabloYok(false)
    setTalepler(data ?? [])
  }

  useEffect(() => {
    fetchTalepler()
  }, [])

  // Aktif rezervasyonlardaki "kaç saat/dakika kaldı" yazısı canlı kalsın diye
  // dakikada bir yeniden render tetikliyoruz.
  useEffect(() => {
    const zamanlayici = setInterval(() => setTick((n) => n + 1), 60000)
    return () => clearInterval(zamanlayici)
  }, [])

  function silmeModunuAc(id: string) {
    setSilmeModuId(id)
    setSilmeSebebi(SEBEPLER[0].value)
    setSilmeSebebiDiger('')
  }

  async function aktifEt(talep: Talep) {
    // WhatsApp sekmesini İLK İŞ olarak (henüz hiçbir "await" geçmeden) boş açıyoruz.
    // Tarayıcılar (özellikle mobilde) bir tıklama olayının SENKRON akışının dışında
    // çağrılan window.open()'ı popup engelleyici ile sessizce durdurur — updateten
    // sonra açmaya çalışsaydık (bir "await" geçtiği için) mesaj hiç çıkmayabilirdi.
    // Sekmeyi burada rezerve edip, adres bilgisini asıl kayıt işlemi bittikten
    // sonra dolduruyoruz.
    const waPencere = window.open('', '_blank')
    setIslemYapiliyor(talep.id)

    // .select() ekliyoruz ki güncellemenin GERÇEKTEN bir satıra uygulandığını
    // görebilelim — RLS bir satırı gizlediğinde hata dönmez, sessizce 0 satır
    // günceller.
    const { data, error } = await supabase
      .from('mevcut_rezervasyonlar')
      .update({ durum: true })
      .eq('id', talep.id)
      .select()
    if (error || !data || data.length === 0) {
      waPencere?.close()
      alert(
        error
          ? 'Rezervasyon aktif edilemedi: ' + error.message
          : 'Rezervasyon aktif edilemedi — değişiklik veritabanına yansımadı. Muhtemelen oturumun süresi dolmuş ya da Supabase\'teki yetki (RLS) politikası eksik.'
      )
      setIslemYapiliyor(null)
      return
    }

    // Not: aktif etmek krokideki masayı OTOMATİK dolu işaretlemiyor — masa
    // durumu (aşağıdaki "MASA REZERVASYON DURUMU" bölümü) tamamen admin'in
    // kendi kontrolünde kalıyor, isterse dolu işaretler isterse işaretlemez.
    // Aktif rezervasyon burada sadece "AKTİF REZERVASYONLAR" listesine düşer.

    const mesaj = [
      `Merhaba ${[talep.isim, talep.soyisim].filter(Boolean).join(' ')},`,
      '',
      `${talep.masa_ismi} (${talep.masa_kisaltmasi}) için ${tarihGosterimi(talep.rezervasyon_tarihi)}${
        talep.rezervasyon_tarihi_gunu ? ` (${talep.rezervasyon_tarihi_gunu})` : ''
      } saat ${saatGosterimi(talep.rezervasyon_saati)} rezervasyonunuz onaylanmıştır.`,
      '',
      'Sizi ağırlamaktan mutluluk duyarız. - Taşeli Sosyal Tesisleri',
    ].join('\n')
    const waUrl = `https://wa.me/${waNumarasi(talep.telefon_numarasi)}?text=${encodeURIComponent(mesaj)}`
    if (waPencere) waPencere.location.href = waUrl
    else window.open(waUrl, '_blank') // önceden açma engellendiyse son bir deneme

    setIslemYapiliyor(null)
    await fetchTalepler()
  }

  async function talebiSil(talep: Talep) {
    const secilenSebep = SEBEPLER.find((s) => s.value === silmeSebebi)
    const sebepMetni = silmeSebebi === 'diger' ? silmeSebebiDiger.trim() : secilenSebep?.label ?? ''
    if (silmeSebebi === 'diger' && !sebepMetni) {
      alert('Lütfen bir sebep yazın.')
      return
    }

    // Aynı popup-engelleyici gerekçesiyle WhatsApp sekmesini senkron olarak,
    // "await"ten önce boş açıyoruz (bkz. aktifEt'teki açıklama).
    const waPencere = window.open('', '_blank')
    setIslemYapiliyor(talep.id)

    const { data, error } = await supabase.from('mevcut_rezervasyonlar').delete().eq('id', talep.id).select()
    if (error || !data || data.length === 0) {
      waPencere?.close()
      alert(
        error
          ? 'Rezervasyon silinemedi: ' + error.message
          : 'Rezervasyon silinemedi — değişiklik veritabanına yansımadı. Muhtemelen oturumun süresi dolmuş ya da Supabase\'teki yetki (RLS) politikası eksik.'
      )
      setIslemYapiliyor(null)
      return
    }

    // Not: burada da krokideki masa durumuna dokunmuyoruz — o tamamen
    // admin'in kendi kontrolünde.

    const mesaj = [
      `Merhaba ${[talep.isim, talep.soyisim].filter(Boolean).join(' ')},`,
      '',
      `${talep.masa_ismi} (${talep.masa_kisaltmasi}) için ${tarihGosterimi(talep.rezervasyon_tarihi)} saat ${saatGosterimi(
        talep.rezervasyon_saati
      )} rezervasyon talebiniz maalesef karşılanamadı.`,
      `Sebep: ${sebepMetni}`,
      '',
      'Farklı bir tarih ya da masa için tekrar deneyebilir veya bizi arayabilirsiniz. - Taşeli Sosyal Tesisleri',
    ].join('\n')
    const waUrl = `https://wa.me/${waNumarasi(talep.telefon_numarasi)}?text=${encodeURIComponent(mesaj)}`
    if (waPencere) waPencere.location.href = waUrl
    else window.open(waUrl, '_blank')

    setIslemYapiliyor(null)
    setSilmeModuId(null)
    await fetchTalepler()
  }

  const bekleyenler = talepler.filter((t) => !t.durum)
  const aktifler = talepler.filter((t) => t.durum)

  function SilmeFormu({ talep }: { talep: Talep }) {
    return (
      <div className="pt-3 mt-3 border-t border-amber-900/40 space-y-2">
        <select
          value={silmeSebebi}
          onChange={(e) => setSilmeSebebi(e.target.value)}
          className="w-full bg-[#1e100a] border border-amber-900/50 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-600"
        >
          {SEBEPLER.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {silmeSebebi === 'diger' && (
          <input
            type="text"
            value={silmeSebebiDiger}
            onChange={(e) => setSilmeSebebiDiger(e.target.value)}
            placeholder="Sebep yazın..."
            className="w-full bg-[#1e100a] border border-amber-900/50 rounded-lg px-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-600"
          />
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => talebiSil(talep)}
            disabled={islemYapiliyor === talep.id}
            className="flex-1 bg-red-900/70 hover:bg-red-800 text-red-100 font-bold py-2 rounded-lg text-[11px] tracking-wide transition-colors disabled:opacity-55"
          >
            {islemYapiliyor === talep.id ? 'Siliniyor...' : 'Sebeple Reddet ve Sil'}
          </button>
          <button
            type="button"
            onClick={() => setSilmeModuId(null)}
            className="px-3 py-2 rounded-lg text-[11px] font-semibold text-stone-400 hover:bg-[#1e100a] transition-colors"
          >
            Vazgeç
          </button>
        </div>
      </div>
    )
  }

  function TalepKarti({ talep, tipAktif }: { talep: Talep; tipAktif: boolean }) {
    return (
      <div className="p-4 rounded-xl border border-amber-900/40 bg-[#2c1810]">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono bg-amber-800/40 text-amber-300 px-2 py-0.5 rounded-full font-semibold">
              {talep.masa_kisaltmasi}
            </span>
            <span className="text-xs text-stone-400">{talep.masa_ismi}</span>
          </div>
          <span className="text-[10px] text-stone-500">{talepZamaniGosterimi(talep.created_time)}</span>
        </div>

        <p className="text-sm font-bold text-amber-100">
          {[talep.isim, talep.soyisim].filter(Boolean).join(' ') || 'İsimsiz'}
          {talep.kac_kisi ? ` · ${talep.kac_kisi} kişi` : ''}
        </p>
        <p className="text-xs text-stone-300 flex items-center gap-1.5 mt-1">
          <Phone className="w-3 h-3 text-amber-500" /> {talep.telefon_numarasi}
        </p>
        <p className="text-xs text-stone-300 mt-0.5">
          {tarihGosterimi(talep.rezervasyon_tarihi)}
          {talep.rezervasyon_tarihi_gunu ? ` (${talep.rezervasyon_tarihi_gunu})` : ''} · {saatGosterimi(talep.rezervasyon_saati)}
        </p>

        {tipAktif && (
          <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mt-1.5">
            <Clock className="w-3.5 h-3.5" /> {kalanSureMetni(talep.rezervasyon_tarihi, talep.rezervasyon_saati)}
          </p>
        )}

        {silmeModuId === talep.id ? (
          <SilmeFormu talep={talep} />
        ) : (
          <div className="flex gap-2 pt-3 mt-3 border-t border-amber-900/40">
            {!tipAktif && (
              <button
                type="button"
                onClick={() => aktifEt(talep)}
                disabled={islemYapiliyor === talep.id}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2 rounded-lg text-[11px] tracking-wide transition-colors disabled:opacity-55"
              >
                <Check className="w-3.5 h-3.5" /> {islemYapiliyor === talep.id ? 'İşleniyor...' : 'Aktif Et'}
              </button>
            )}
            <button
              type="button"
              onClick={() => silmeModunuAc(talep.id)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-red-900/60 hover:bg-red-800 text-red-200 font-bold py-2 rounded-lg text-[11px] tracking-wide transition-colors border border-red-800/50"
            >
              <Ban className="w-3.5 h-3.5" /> {tipAktif ? 'İptal Et' : 'Reddet'}
            </button>
          </div>
        )}
      </div>
    )
  }

  if (tabloYok) {
    return (
      <div className="mb-6 bg-amber-950/40 border border-amber-800/50 text-amber-200 text-xs rounded-lg px-4 py-3">
        Rezervasyon talepleri yüklenemedi (Supabase&apos;te <code className="font-mono">mevcut_rezervasyonlar</code>{' '}
        tablosu bulunamadı). <code className="font-mono">mevcut_rezervasyonlar.sql</code> dosyasını Supabase SQL
        Editor&apos;de çalıştırman gerekiyor.
      </div>
    )
  }

  return (
    <div className="space-y-6 mb-6">
      <div>
        <div className="flex items-center gap-2 mb-3 text-amber-200 font-bold text-sm">
          <Clock className="w-5 h-5 text-amber-500" />
          <span>BEKLEYEN TALEPLER ({bekleyenler.length})</span>
        </div>
        {yukleniyor ? (
          <p className="text-xs text-stone-400 py-4">Yükleniyor...</p>
        ) : bekleyenler.length === 0 ? (
          <p className="text-xs text-stone-400 py-4">Bekleyen rezervasyon talebi yok.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {bekleyenler.map((t) => (
              <TalepKarti key={t.id} talep={t} tipAktif={false} />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3 text-amber-200 font-bold text-sm">
          <CalendarCheck className="w-5 h-5 text-amber-500" />
          <span>AKTİF REZERVASYONLAR ({aktifler.length})</span>
        </div>
        {yukleniyor ? (
          <p className="text-xs text-stone-400 py-4">Yükleniyor...</p>
        ) : aktifler.length === 0 ? (
          <p className="text-xs text-stone-400 py-4">Aktif rezervasyon yok.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {aktifler.map((t) => (
              <TalepKarti key={t.id} talep={t} tipAktif />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
