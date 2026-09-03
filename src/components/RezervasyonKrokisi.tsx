// Rezervasyon krokisi — hem /rezervasyon (herkese açık) hem /admin (yönetim) sayfası
// bu bileşeni kullanıyor, ikisinde de aynı masa çizimi/konumları görünsün diye.
// Krokiyi değiştirmek görsel planı bozar; masa konumları src/lib/masalar.ts'den geliyor.
'use client'

import { MASA_DIZILIMI, type MasaTanimi } from '@/lib/masalar'

export type RezervasyonKaydi = {
  id: string
  masa_kisaltmasi: string
  masa_adi: string
  masanin_rezerve_olasiligi: number[] | null
  durum: boolean
  created_time: string
  rezervasyon_tarihi?: string | null
  rezervasyon_saati?: string | null
  rezervasyon_tarihi_gunu?: string | null
  isim?: string | null
  soyisim?: string | null
  telefon_numarasi?: string | null
  kac_kisi?: number | null
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
  // true: dolu masa da tıklanabilir olsun (yönetim paneli — detay görmek için).
  // false (varsayılan): dolu masa tıklanamaz (herkese açık site — sadece boş masaya rezervasyon yapılabilir).
  tumuTiklanabilir?: boolean
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

function MasaGorsel({ tanim, kayit, onClick, tumuTiklanabilir }: MasaGorselProps) {
  const { cx, cy, kisaltma, tip } = tanim
  const dolu = kayit?.durum ?? false
  const tiklanabilir = tumuTiklanabilir || !dolu
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
        className={tiklanabilir ? 'cursor-pointer group' : 'cursor-not-allowed'}
        onClick={tiklanabilir ? onClick : undefined}
        onKeyDown={(e: React.KeyboardEvent<SVGGElement>) => {
          if (tiklanabilir && (e.key === 'Enter' || e.key === ' ')) onClick()
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
      className={tiklanabilir ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-not-allowed'}
      onClick={tiklanabilir ? onClick : undefined}
      onKeyDown={(e: React.KeyboardEvent<SVGGElement>) => {
        if (tiklanabilir && (e.key === 'Enter' || e.key === ' ')) onClick()
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

type RezervasyonKrokisiProps = {
  kayitlar: Record<string, RezervasyonKaydi>
  onMasaTikla: (tanim: MasaTanimi) => void
  // true: yönetim paneli — dolu masalar da tıklanıp detay/düzenleme açılabilsin.
  tumuTiklanabilir?: boolean
}

export function RezervasyonKrokisi({ kayitlar, onMasaTikla, tumuTiklanabilir = false }: RezervasyonKrokisiProps) {
  return (
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
          onClick={() => onMasaTikla(tanim)}
          tumuTiklanabilir={tumuTiklanabilir}
        />
      ))}
    </svg>
  )
}
