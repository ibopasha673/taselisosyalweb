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
import { MASA_DIZILIMI, type MasaTanimi } from '@/lib/masalar'

type RezervasyonKaydi = {
  id: string
  masa_kisaltmasi: string
  masa_adi: string
  masanin_rezerve_olasiligi: number[]
  durum: boolean
  created_time: string
}

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

// --- Kroki çizim sabitleri: build ölçeği (SCALE=1.12) krokiyle birebir aynı kalsın diye
// buradaki tüm rakamlar orijinal Python üretecinden birebir aktarıldı. ---
const KARE_BOYUT = 30 * 1.12
const KARE_H = KARE_BOYUT / 2
const KARE_SANDALYE = 7.5 * 1.12
const KARE_ARALIK = 3.5 * 1.12
const IKILI_SANDALYE = 6.5 * 1.12
const IKILI_ARALIK = 3.5 * 1.12
const IKILI_OFSET = 9 * 1.12
const ALTILI_W = 30 * 1.12
const ALTILI_H = 54 * 1.12
const ALTILI_SANDALYE = 7.5 * 1.12
const ALTILI_ARALIK = 3.5 * 1.12
const YUVARLAK_R = 16 * 1.12
const YUVARLAK_SANDALYE = 7 * 1.12
const YUVARLAK_ARALIK = 3 * 1.12
const RX_KUCUK = 2 * 1.12
const RX_MASA = 5 * 1.12
const RX_ALTILI = 6 * 1.12

type MasaGorselProps = {
  tanim: MasaTanimi
  kayit: RezervasyonKaydi | undefined
  onClick: () => void
}

// Sandalye rengi: boşsa sıcak ahşap tonu, doluysa soluk/gri.
function sandalyeSinif(dolu: boolean) {
  return dolu ? 'fill-stone-300' : 'fill-[#7a4f30] opacity-85'
}
function masaTopSinif(dolu: boolean) {
  return dolu ? 'fill-stone-200 stroke-stone-400' : 'fill-[#f2d9b6] stroke-[#b45309]'
}
function etiketSinif(dolu: boolean) {
  return dolu ? 'fill-stone-500' : 'fill-[#2c1810]'
}

function MasaGorsel({ tanim, kayit, onClick }: MasaGorselProps) {
  const { cx, cy, kisaltma, tip } = tanim
  const dolu = kayit?.durum ?? false
  const kapasiteMetni =
    kayit && kayit.masanin_rezerve_olasiligi?.length
      ? `${Math.min(...kayit.masanin_rezerve_olasiligi)}-${Math.max(...kayit.masanin_rezerve_olasiligi)} kişi`
      : ''
  const baslik = `${kayit?.masa_adi ?? kisaltma} (${kisaltma})${kapasiteMetni ? ' — ' + kapasiteMetni : ''} — ${
    dolu ? 'DOLU' : 'MÜSAİT'
  }`

  // Oda tipi (LOCA): tek büyük tıklanabilir alan, sandalye çizmiyoruz.
  if (tip.tur === 'oda') {
    return (
      <g
        role="button"
        tabIndex={0}
        aria-label={baslik}
        className={dolu ? 'cursor-not-allowed' : 'cursor-pointer group'}
        onClick={dolu ? undefined : onClick}
        onKeyDown={(e: React.KeyboardEvent<SVGGElement>) => {
          if (!dolu && (e.key === 'Enter' || e.key === ' ')) onClick()
        }}
      >
        <title>{baslik}</title>
        <rect
          x={tip.x}
          y={tip.y}
          width={tip.w}
          height={tip.h}
          rx={14}
          className={
            dolu
              ? 'fill-stone-300/40 stroke-stone-400'
              : 'fill-transparent stroke-[#c99b5f] group-hover:fill-[#b45309]/10 transition-colors'
          }
          strokeWidth={2}
          strokeDasharray="6 5"
        />
        <rect
          x={cx - 34}
          y={cy + 34}
          width={68}
          height={22}
          rx={11}
          className={dolu ? 'fill-stone-300' : 'fill-[#2c1810]'}
        />
        <text
          x={cx}
          y={cy + 49}
          textAnchor="middle"
          className={`text-[11px] font-bold ${dolu ? 'fill-stone-600' : 'fill-amber-100'}`}
          style={{ fontFamily: 'ui-monospace, monospace' }}
        >
          {dolu ? 'LOCA — DOLU' : 'LOCA — SEÇ'}
        </text>
      </g>
    )
  }

  // Sandalye grupları tip'e göre üretiliyor; masa gövdesi (kare/dikdörtgen/yuvarlak) ve
  // etiket ortak. Her masa aynı tıklama davranışını paylaşıyor.
  const sandalyeler: React.ReactNode[] = []
  let govde: React.ReactNode = null

  if (tip.tur === 'kare4') {
    const h = KARE_H
    const chair = KARE_SANDALYE
    const gap = KARE_ARALIK
    const kenarlar: Array<[string, number, number, number, number]> = [
      ['N', 0, -(h + gap + chair / 2), chair * 1.3, chair],
      ['S', 0, h + gap + chair / 2, chair * 1.3, chair],
      ['W', -(h + gap + chair / 2), 0, chair, chair * 1.3],
      ['E', h + gap + chair / 2, 0, chair, chair * 1.3],
    ]
    for (const [key, dx, dy, cw, ch] of kenarlar) {
      if (tip.kisi === 3 && key === 'S') continue
      sandalyeler.push(
        <rect
          key={key}
          x={cx + dx - cw / 2}
          y={cy + dy - ch / 2}
          width={cw}
          height={ch}
          rx={RX_KUCUK}
          className={sandalyeSinif(dolu)}
        />
      )
    }
    govde = (
      <rect x={cx - h} y={cy - h} width={KARE_BOYUT} height={KARE_BOYUT} rx={RX_MASA} className={masaTopSinif(dolu)} />
    )
  } else if (tip.tur === 'iki-ew') {
    const h = KARE_H
    const chair = KARE_SANDALYE
    const gap = KARE_ARALIK
    for (const [key, dx, dy, cw, ch] of [
      ['W', -(h + gap + chair / 2), 0, chair, chair * 1.3],
      ['E', h + gap + chair / 2, 0, chair, chair * 1.3],
    ] as Array<[string, number, number, number, number]>) {
      sandalyeler.push(
        <rect
          key={key}
          x={cx + dx - cw / 2}
          y={cy + dy - ch / 2}
          width={cw}
          height={ch}
          rx={RX_KUCUK}
          className={sandalyeSinif(dolu)}
        />
      )
    }
    govde = (
      <rect x={cx - h} y={cy - h} width={KARE_BOYUT} height={KARE_BOYUT} rx={RX_MASA} className={masaTopSinif(dolu)} />
    )
  } else if (tip.tur === 'dortlu-ew') {
    const h = KARE_H
    const chair = IKILI_SANDALYE
    const gap = IKILI_ARALIK
    const off = IKILI_OFSET
    for (const yoff of [-off, off]) {
      const xW = cx - h - gap - chair / 2
      const xE = cx + h + gap + chair / 2
      sandalyeler.push(
        <rect
          key={`w${yoff}`}
          x={xW - chair * 0.65}
          y={cy + yoff - chair / 2}
          width={chair * 1.3}
          height={chair}
          rx={RX_KUCUK}
          className={sandalyeSinif(dolu)}
        />,
        <rect
          key={`e${yoff}`}
          x={xE - chair * 0.65}
          y={cy + yoff - chair / 2}
          width={chair * 1.3}
          height={chair}
          rx={RX_KUCUK}
          className={sandalyeSinif(dolu)}
        />
      )
    }
    govde = (
      <rect x={cx - h} y={cy - h} width={KARE_BOYUT} height={KARE_BOYUT} rx={RX_MASA} className={masaTopSinif(dolu)} />
    )
  } else if (tip.tur === 'dortlu-ns') {
    const h = KARE_H
    const chair = IKILI_SANDALYE
    const gap = IKILI_ARALIK
    const off = IKILI_OFSET
    for (const xoff of [-off, off]) {
      const yN = cy - h - gap - chair / 2
      const yS = cy + h + gap + chair / 2
      sandalyeler.push(
        <rect
          key={`n${xoff}`}
          x={cx + xoff - chair / 2}
          y={yN - chair * 0.65}
          width={chair}
          height={chair * 1.3}
          rx={RX_KUCUK}
          className={sandalyeSinif(dolu)}
        />,
        <rect
          key={`s${xoff}`}
          x={cx + xoff - chair / 2}
          y={yS - chair * 0.65}
          width={chair}
          height={chair * 1.3}
          rx={RX_KUCUK}
          className={sandalyeSinif(dolu)}
        />
      )
    }
    govde = (
      <rect x={cx - h} y={cy - h} width={KARE_BOYUT} height={KARE_BOYUT} rx={RX_MASA} className={masaTopSinif(dolu)} />
    )
  } else if (tip.tur === 'altili-ew') {
    const hw = ALTILI_W / 2
    const hh = ALTILI_H / 2
    const chair = ALTILI_SANDALYE
    const gap = ALTILI_ARALIK
    const offsets = [-hh * 0.62, 0, hh * 0.62]
    for (const oy of offsets) {
      const y = cy + oy
      const xW = cx - hw - gap - chair / 2
      const xE = cx + hw + gap + chair / 2
      sandalyeler.push(
        <rect
          key={`w${oy}`}
          x={xW - chair / 2}
          y={y - chair * 0.65}
          width={chair}
          height={chair * 1.3}
          rx={RX_KUCUK}
          className={sandalyeSinif(dolu)}
        />,
        <rect
          key={`e${oy}`}
          x={xE - chair / 2}
          y={y - chair * 0.65}
          width={chair}
          height={chair * 1.3}
          rx={RX_KUCUK}
          className={sandalyeSinif(dolu)}
        />
      )
    }
    govde = (
      <rect x={cx - hw} y={cy - hh} width={ALTILI_W} height={ALTILI_H} rx={RX_ALTILI} className={masaTopSinif(dolu)} />
    )
  } else if (tip.tur === 'yuvarlak-bench') {
    const r = YUVARLAK_R
    const chair = YUVARLAK_SANDALYE
    const gap = YUVARLAK_ARALIK
    const tumKenarlar: Record<string, [number, number]> = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] }
    const sandalyeKenarlari = (['N', 'E', 'W', 'S'] as const).filter((k) => k !== tip.kenar)
    for (const k of sandalyeKenarlari) {
      const [dxn, dyn] = tumKenarlar[k]
      const dx = dxn * (r + gap + chair / 2)
      const dy = dyn * (r + gap + chair / 2)
      const cw = dxn === 0 ? chair * 1.3 : chair
      const ch = dxn === 0 ? chair : chair * 1.3
      sandalyeler.push(
        <rect
          key={k}
          x={cx + dx - cw / 2}
          y={cy + dy - ch / 2}
          width={cw}
          height={ch}
          rx={RX_KUCUK}
          className={sandalyeSinif(dolu)}
        />
      )
    }
    const [bxn, byn] = tumKenarlar[tip.kenar]
    const hl = r
    const bulge = 17 * 1.12
    const inner = r + gap
    let koltukD = ''
    if (bxn === 0) {
      const innerY = cy + byn * inner
      const outerY = innerY + byn * bulge
      koltukD = `M ${cx - hl} ${innerY} L ${cx + hl} ${innerY} Q ${cx} ${outerY} ${cx - hl} ${innerY} Z`
    } else {
      const innerX = cx + bxn * inner
      const outerX = innerX + bxn * bulge
      koltukD = `M ${innerX} ${cy - hl} L ${innerX} ${cy + hl} Q ${outerX} ${cy} ${innerX} ${cy - hl} Z`
    }
    govde = (
      <>
        <path d={koltukD} className={dolu ? 'fill-stone-300 stroke-stone-400' : 'fill-[#7a4f30] stroke-[#2c1810]'} strokeWidth={2} />
        <circle cx={cx} cy={cy} r={r} className={masaTopSinif(dolu)} />
      </>
    )
  }

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={baslik}
      className={dolu ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-80 transition-opacity'}
      onClick={dolu ? undefined : onClick}
      onKeyDown={(e: React.KeyboardEvent<SVGGElement>) => {
        if (!dolu && (e.key === 'Enter' || e.key === ' ')) onClick()
      }}
    >
      <title>{baslik}</title>
      {sandalyeler}
      {govde}
      <text
        x={cx}
        y={cy + 3.5}
        textAnchor="middle"
        className={`text-[11.7px] font-bold ${etiketSinif(dolu)}`}
        style={{ fontFamily: 'ui-monospace, monospace' }}
      >
        {kisaltma}
      </text>
    </g>
  )
}

export default function RezervasyonPage() {
  const [kayitlar, setKayitlar] = useState<Record<string, RezervasyonKaydi>>({})
  const [tabloYok, setTabloYok] = useState(false)
  const [secilenMasa, setSecilenMasa] = useState<MasaTanimi | null>(null)
  const [form, setForm] = useState<RezervasyonForm>(BOS_FORM)
  const [adim, setAdim] = useState<'form' | 'telefon-onay'>('form')
  const [hata, setHata] = useState('')
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
      `Merhaba, ${masaAdi} (${tanim.kisaltma}) için rezervasyon yapmak istiyorum.`,
      '',
      `Ad Soyad: ${form.isim} ${form.soyisim}`,
      `Telefon: ${form.telefon}`,
      `Kişi Sayısı: ${form.kacKisi}`,
      `Tarih: ${tarihGosterim}${gun ? ` (${gun})` : ''}`,
      `Saat: ${form.saat}`,
    ].join('\n')
    window.open(`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(mesaj)}`, '_blank')
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
              Aşağıdaki kroki üzerinden boş bir masaya tıkla; WhatsApp&apos;tan masa bilgisiyle birlikte bize
              ulaşacaksın, rezervasyonunu birlikte kesinleştirelim.
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
            <svg viewBox="0 0 1000 900" className="w-full h-auto" role="img" aria-label="Taşeli Sosyal Tesisleri rezervasyon krokisi">
              {/* Salon (arka planda) */}
              <polygon
                points="239.0,171.0 923.0,171.0 923.0,555.0 806.0,555.0 806.0,728.0 680.0,728.0 680.0,849.0 564.0,849.0 564.0,728.0 529.0,728.0 529.0,589.0 239.0,589.0"
                className="fill-[#faf5ea] stroke-[#8a5a3a]"
                strokeWidth={3.5}
                strokeLinejoin="round"
              />
              <polygon
                points="60.0,66.0 923.0,66.0 923.0,171.0 239.0,171.0 239.0,348.0 60.0,348.0"
                className="fill-[#eadfca] stroke-[#b79c72]"
                strokeWidth={3}
                strokeLinejoin="round"
              />
              <polygon
                points="60.0,348.0 239.0,348.0 239.0,463.0 60.0,463.0"
                className="fill-[#f0dcc2] stroke-[#c99b5f]"
                strokeWidth={3.5}
                strokeLinejoin="round"
              />
              <polygon
                points="60.0,463.0 239.0,463.0 239.0,589.0 456.0,589.0 456.0,728.0 60.0,728.0"
                className="fill-[#5c3a24] stroke-[#2c1810]"
                strokeWidth={3}
                strokeLinejoin="round"
              />
              <polygon
                points="456.0,589.0 529.0,589.0 529.0,728.0 456.0,728.0"
                className="fill-[#e3c9a3] stroke-[#9c6b3a]"
                strokeWidth={3}
                strokeLinejoin="round"
              />
              <polygon
                points="806.0,555.0 923.0,555.0 923.0,728.0 806.0,728.0"
                className="fill-[#d9e2e0] stroke-[#6f8582]"
                strokeWidth={3}
                strokeLinejoin="round"
              />
              <polygon
                points="564.0,728.0 680.0,728.0 680.0,849.0 564.0,849.0"
                className="fill-[#f6efe1] stroke-[#8a5a3a]"
                strokeWidth={3}
                strokeDasharray="5 4"
                strokeLinejoin="round"
              />

              {/* Çiçeklik */}
              <rect x={452} y={325} width={260} height={90} rx={10} className="fill-[#dbe6cf] stroke-[#5f7a52]" strokeWidth={1.6} strokeDasharray="3 4" />
              <text x={582} y={373} textAnchor="middle" fontSize={9} className="fill-[#5f7a52] font-semibold uppercase tracking-wider">
                ÇİÇEKLİK
              </text>

              {/* Bar ikonu */}
              <g>
                <rect x={90} y={560} width={118} height={70} rx={5} className="fill-[#5c3a24] stroke-[#2c1810]" strokeWidth={2} />
                <path d="M 100 574 h 98" className="stroke-[#f2d9b6]" strokeWidth={2.5} fill="none" />
                {[118, 140, 162, 184].map((x) => (
                  <circle key={x} cx={x} cy={594} r={6} className="fill-[#f2d9b6] stroke-[#7a4f30]" strokeWidth={1} />
                ))}
              </g>

              {/* Kasa ikonu */}
              <g transform="translate(492,650)">
                <rect x={-24} y={-16} width={48} height={30} rx={3} className="fill-[#7a4f30] stroke-[#2c1810]" strokeWidth={1.4} />
                <rect x={-14} y={-26} width={28} height={12} rx={2} className="fill-[#f2d9b6] stroke-[#2c1810]" strokeWidth={1.2} />
                <circle cx={10} cy={-2} r={3} className="fill-[#b45309]" />
              </g>

              {/* Giriş ikonu */}
              <g transform="translate(622,760)">
                <line x1={-40} y1={0} x2={-6} y2={0} className="stroke-[#2c1810]" strokeWidth={2.4} />
                <path d="M -6 0 A 34 34 0 0 1 -40 34" className="stroke-[#9c7a5e]" strokeWidth={1.2} strokeDasharray="2 3" fill="none" />
                <line x1={40} y1={0} x2={6} y2={0} className="stroke-[#2c1810]" strokeWidth={2.4} />
                <path d="M 6 0 A 34 34 0 0 0 40 34" className="stroke-[#9c7a5e]" strokeWidth={1.2} strokeDasharray="2 3" fill="none" />
              </g>

              {/* WC ikonu */}
              <g transform="translate(864,642)">
                <circle cx={0} cy={0} r={15} className="stroke-[#6f8582]" strokeWidth={2} fill="none" />
                <path d="M -15 13 L 15 13" className="stroke-[#6f8582]" strokeWidth={2} fill="none" />
              </g>

              {/* Oda etiketleri */}
              <text x={150} y={96} textAnchor="middle" fontSize={11} className="fill-[#2c1810] font-semibold">BALKON</text>
              <text x={150} y={412} textAnchor="middle" fontSize={15} className="fill-[#2c1810] font-semibold">LOCA</text>
              <text x={150} y={700} textAnchor="middle" fontSize={15} className="fill-amber-50 font-semibold">BAR</text>
              <text x={492} y={700} textAnchor="middle" fontSize={9} className="fill-[#2c1810] font-semibold">KASA</text>
              <text x={622} y={800} textAnchor="middle" fontSize={10} className="fill-[#2c1810] font-semibold">GİRİŞ</text>
              <text x={864} y={700} textAnchor="middle" fontSize={14} className="fill-[#2c1810] font-semibold">WC</text>
              <text x={360} y={560} textAnchor="middle" fontSize={13} className="fill-[#2c1810] font-semibold">SALON</text>
              <text x={650} y={615} textAnchor="middle" fontSize={13} className="fill-[#2c1810] font-semibold">SALON</text>

              {/* Masalar */}
              {MASA_DIZILIMI.map((tanim) => (
                <MasaGorsel
                  key={tanim.kisaltma}
                  tanim={tanim}
                  kayit={kayitlar[tanim.kisaltma]}
                  onClick={() => masaSec(tanim)}
                />
              ))}
            </svg>
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
                  Bu numara doğru mu? Rezervasyon talebiniz WhatsApp&apos;tan bu bilgilerle iletilecek.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      whatsappaGit(secilenMasa)
                      kapat()
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-3 rounded-xl text-sm tracking-wide transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" /> Evet, WhatsApp&apos;tan Gönder
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
