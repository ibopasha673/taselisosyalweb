-- ============================================================================
-- Taşeli Sosyal Tesisleri — "mevcut_rezervasyonlar" tablosu
-- ============================================================================
-- Bu, müşterilerin /rezervasyon sayfasından gönderdiği HER rezervasyon talebinin
-- kaydını tutan yeni bir tablo. "rezervasyon" tablosundan (masa başına tek satır,
-- masanın GÜNCEL durumunu tutar) farklı: bu tablo bir KUYRUK/GEÇMİŞ —
-- her talep kendi satırını alır, durum=false iken "bekliyor", yönetici
-- onaylayınca (aktif edince) durum=true olur.
--
-- Akış: müşteri masayı seçip formu doldurur → satır durum=false ile eklenir →
-- yönetim panelinde "Bekleyen Talepler" listesine düşer → yönetici "Aktif Et"
-- derse durum=true olur + "rezervasyon" tablosundaki ilgili masa satırı da
-- otomatik güncellenir (masa dolu görünür, kroki'deki detay bilgisi de dolar) +
-- müşterinin WhatsApp'ına onay mesajı gönderilir. Yönetici "Sil" derse (bir
-- sebep seçerek) satır silinir ve müşteriye açıklamalı bir WhatsApp mesajı
-- gönderilir; aktif bir rezervasyon silinirse masa da otomatik boşaltılır.
--
-- Bu dosyayı Supabase Dashboard → SQL Editor'e yapıştırıp çalıştırman yeterli.
-- "rezervasyon" tablosunun (ve onun rezervasyon_detay_kolonlari.sql ile eklenen
-- kolonlarının) zaten oluşturulmuş olması gerekiyor, çünkü masa_uuid o tabloya
-- referans veriyor.
-- ============================================================================

create table if not exists public.mevcut_rezervasyonlar (
  id uuid primary key default gen_random_uuid(),
  masa_uuid uuid references public.rezervasyon(id) on delete set null,
  masa_ismi text not null,
  masa_kisaltmasi text not null,
  isim text,
  soyisim text,
  telefon_numarasi text not null,
  kac_kisi integer,
  rezervasyon_tarihi date not null,
  rezervasyon_saati time not null,
  rezervasyon_tarihi_gunu text,
  durum boolean not null default false,
  created_time timestamptz not null default now()
);

comment on table public.mevcut_rezervasyonlar is 'Müşterilerin gönderdiği her rezervasyon talebi — durum=false: bekliyor, durum=true: yönetici tarafından onaylandı (aktif).';
comment on column public.mevcut_rezervasyonlar.masa_uuid is 'rezervasyon tablosundaki ilgili masa satırının id''si.';
comment on column public.mevcut_rezervasyonlar.durum is 'false = talep bekliyor (henüz onaylanmadı), true = yönetici onayladı (aktif rezervasyon).';
comment on column public.mevcut_rezervasyonlar.created_time is 'Talebin gönderildiği (verildiği) tarih ve saat.';

create index if not exists mevcut_rezervasyonlar_durum_idx on public.mevcut_rezervasyonlar (durum);
create index if not exists mevcut_rezervasyonlar_masa_uuid_idx on public.mevcut_rezervasyonlar (masa_uuid);

alter table public.mevcut_rezervasyonlar
  drop constraint if exists mevcut_rezervasyonlar_kac_kisi_pozitif;
alter table public.mevcut_rezervasyonlar
  add constraint mevcut_rezervasyonlar_kac_kisi_pozitif check (kac_kisi is null or kac_kisi > 0);

-- ----------------------------------------------------------------------------
-- RLS: herkes (anonim ziyaretçi dahil) yeni bir talep OLUŞTURABİLİR
-- (rezervasyon formunu gönderince), ama sadece durum=false ile — yani
-- kimse doğrudan "onaylanmış" bir rezervasyon oluşturamaz, kendini
-- aktive edemez. Talepleri GÖRMEK, GÜNCELLEMEK (aktif etmek) ve SİLMEK
-- sadece yöneticiye açık — bu tabloda telefon/isim gibi kişisel bilgi
-- olduğu için herkese açık okuma yok (kroki hâlâ "rezervasyon" tablosundan
-- okuyor, o değişmedi).
-- ----------------------------------------------------------------------------
alter table public.mevcut_rezervasyonlar enable row level security;

drop policy if exists "Herkes rezervasyon talebi oluşturabilir" on public.mevcut_rezervasyonlar;
create policy "Herkes rezervasyon talebi oluşturabilir"
  on public.mevcut_rezervasyonlar
  for insert
  to anon, authenticated
  with check (durum = false);

drop policy if exists "Yönetici talepleri görür" on public.mevcut_rezervasyonlar;
create policy "Yönetici talepleri görür"
  on public.mevcut_rezervasyonlar
  for select
  to authenticated
  using (auth.jwt() ->> 'email' = 'yonetici@taselisosyal.com');

drop policy if exists "Yönetici talepleri günceller" on public.mevcut_rezervasyonlar;
create policy "Yönetici talepleri günceller"
  on public.mevcut_rezervasyonlar
  for update
  to authenticated
  using (auth.jwt() ->> 'email' = 'yonetici@taselisosyal.com')
  with check (auth.jwt() ->> 'email' = 'yonetici@taselisosyal.com');

drop policy if exists "Yönetici talepleri siler" on public.mevcut_rezervasyonlar;
create policy "Yönetici talepleri siler"
  on public.mevcut_rezervasyonlar
  for delete
  to authenticated
  using (auth.jwt() ->> 'email' = 'yonetici@taselisosyal.com');
