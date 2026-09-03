// Restoranın kroki yerleşimi — konumlar elle çizilen krokiden birebir aktarıldı.
// Bu dosyayı değiştirmek görsel planı bozar; yalnızca Supabase'teki kapasite/durum
// bilgisi değişirse buraya dokunmana gerek yok, o veriler rezervasyon tablosundan gelir.

export type MasaTipi =
  | { tur: 'kare4'; kisi: 3 | 4 } // B1-B10: N/S/E/W tek tek sandalye (kisi=3 ise güney sandalyesi yok)
  | { tur: 'iki-ew' } // S12, S13, S14: tek sandalye doğuda, tek sandalye batıda (2 kişilik)
  | { tur: 'dortlu-ew' } // S1-S4: ikişer sandalye doğuda ve batıda (4 kişilik)
  | { tur: 'dortlu-ns' } // S6-S9, S15-S18: ikişer sandalye kuzeyde ve güneyde (4 kişilik)
  | { tur: 'altili-ew' } // S11: 90° döndürülmüş, üçer üçer doğu-batı (6 kişilik)
  | { tur: 'yuvarlak-bench'; kenar: 'E' | 'S' } // L1, L2: yuvarlak masa + 3 sandalye + koltuk
  | { tur: 'oda'; x: number; y: number; w: number; h: number } // LOCA: tüm oda tıklanabilir

export type MasaTanimi = {
  kisaltma: string
  cx: number
  cy: number
  tip: MasaTipi
}

// SVG viewBox: 0 0 1000 900
export const MASA_DIZILIMI: MasaTanimi[] = [
  // --- Balkon üst şerit (soldan sağa) ---
  { kisaltma: 'B6', cx: 296, cy: 120, tip: { tur: 'kare4', kisi: 4 } },
  { kisaltma: 'B5', cx: 410, cy: 120, tip: { tur: 'kare4', kisi: 4 } },
  { kisaltma: 'B4', cx: 524, cy: 120, tip: { tur: 'kare4', kisi: 4 } },
  { kisaltma: 'B3', cx: 638, cy: 120, tip: { tur: 'kare4', kisi: 4 } },
  { kisaltma: 'B2', cx: 752, cy: 120, tip: { tur: 'kare4', kisi: 4 } },
  { kisaltma: 'B1', cx: 866, cy: 120, tip: { tur: 'kare4', kisi: 4 } },
  // --- Balkon sol şerit ---
  { kisaltma: 'B10', cx: 120, cy: 168, tip: { tur: 'kare4', kisi: 3 } },
  { kisaltma: 'B7', cx: 200, cy: 168, tip: { tur: 'kare4', kisi: 4 } },
  { kisaltma: 'B9', cx: 120, cy: 272, tip: { tur: 'kare4', kisi: 4 } },
  { kisaltma: 'B8', cx: 200, cy: 272, tip: { tur: 'kare4', kisi: 4 } },
  // --- Loca (oda, tek tıklanabilir alan) ---
  { kisaltma: 'LOCA', cx: 150, cy: 405, tip: { tur: 'oda', x: 60, y: 348, w: 179, h: 115 } },
  // --- Salon: Loca önü ---
  { kisaltma: 'S3', cx: 280, cy: 245, tip: { tur: 'dortlu-ew' } },
  { kisaltma: 'S4', cx: 360, cy: 245, tip: { tur: 'dortlu-ew' } },
  { kisaltma: 'S2', cx: 283, cy: 395, tip: { tur: 'dortlu-ew' } },
  { kisaltma: 'S1', cx: 283, cy: 464, tip: { tur: 'dortlu-ew' } },
  // --- Salon: çiçekliğin kuzeyinde (altında) ---
  { kisaltma: 'S18', cx: 470, cy: 460, tip: { tur: 'dortlu-ns' } },
  { kisaltma: 'S17', cx: 540, cy: 460, tip: { tur: 'dortlu-ns' } },
  { kisaltma: 'S16', cx: 610, cy: 460, tip: { tur: 'dortlu-ns' } },
  { kisaltma: 'S15', cx: 680, cy: 460, tip: { tur: 'dortlu-ns' } },
  // --- Salon: üst sıra (2 kişilik) ---
  { kisaltma: 'S14', cx: 491, cy: 204, tip: { tur: 'iki-ew' } },
  { kisaltma: 'S13', cx: 597, cy: 204, tip: { tur: 'iki-ew' } },
  { kisaltma: 'S12', cx: 703, cy: 204, tip: { tur: 'iki-ew' } },
  // --- Salon: çiçekliğin güneyinde (üstünde) ---
  { kisaltma: 'S9', cx: 488, cy: 290, tip: { tur: 'dortlu-ns' } },
  { kisaltma: 'S8', cx: 560, cy: 290, tip: { tur: 'dortlu-ns' } },
  { kisaltma: 'S7', cx: 624, cy: 290, tip: { tur: 'dortlu-ns' } },
  { kisaltma: 'S6', cx: 688, cy: 290, tip: { tur: 'dortlu-ns' } },
  // --- Salon: sağ duvar boyunca ---
  { kisaltma: 'S11', cx: 858, cy: 245, tip: { tur: 'altili-ew' } },
  { kisaltma: 'L2', cx: 846, cy: 395, tip: { tur: 'yuvarlak-bench', kenar: 'E' } },
  { kisaltma: 'L1', cx: 846, cy: 480, tip: { tur: 'yuvarlak-bench', kenar: 'E' } },
]
