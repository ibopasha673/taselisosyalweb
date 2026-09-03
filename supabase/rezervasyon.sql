-- Taşeli Sosyal Tesisleri — "rezervasyon" tablosu
-- Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını yapıştır → Run.
-- Tabloyu ve tüm masaları (Balkon, Salon, Loca) tek seferde oluşturur.

create extension if not exists pgcrypto;

create table if not exists public.rezervasyon (
  id uuid primary key default gen_random_uuid(),
  masa_kisaltmasi text not null unique,
  masa_adi text not null,
  -- Bu masa için rezerve edilebilecek kişi sayıları (dizi).
  -- Örn. S11 6 kişilik ama {3,4,5,6,7,8} → 3 kişiden az gruplara bu masa verilmesin,
  -- biraz üstüne de esneyebilsin. Diğer masalarda varsayılan olarak 1'den kapasitesine kadar.
  -- İstersen Supabase Studio'da tablo görünümünden herhangi bir satırın bu alanını
  -- doğrudan düzenleyebilirsin (dizi, örn: {2,3,4}).
  masanin_rezerve_olasiligi integer[] not null default '{}',
  -- true = masa dolu/rezerve edilmiş, false = masa boş (müsait)
  durum boolean not null default false,
  created_time timestamptz not null default now()
);

comment on table public.rezervasyon is 'Restoran masalarının rezervasyon durumu ve kapasite bilgisi.';
comment on column public.rezervasyon.masa_kisaltmasi is 'Krokideki kısaltma: S1, S2, B3, L1, LOCA ...';
comment on column public.rezervasyon.masanin_rezerve_olasiligi is 'Bu masa için kabul edilebilir kişi sayıları listesi.';
comment on column public.rezervasyon.durum is 'true = dolu (rezerve), false = boş (müsait).';

-- Herkes (anonim ziyaretçiler dahil) masa durumunu ve kapasitesini görebilsin ki
-- rezervasyon sayfası hangi masanın boş olduğunu gösterebilsin.
alter table public.rezervasyon enable row level security;

drop policy if exists "rezervasyon_public_select" on public.rezervasyon;
create policy "rezervasyon_public_select"
  on public.rezervasyon
  for select
  to anon, authenticated
  using (true);

-- NOT: Bilerek INSERT/UPDATE/DELETE policy'si eklenmedi — durum alanını şimdilik
-- yalnızca Supabase panelinden (veya service role ile admin panelinden) siz
-- güncelliyorsunuz. Sitedeki "rezervasyon" akışı WhatsApp'a yönlendirir, veritabanına
-- doğrudan yazmaz.

-- 29 masayı tek seferde ekle (zaten varsa üzerine yazmadan atla).
insert into public.rezervasyon (masa_kisaltmasi, masa_adi, masanin_rezerve_olasiligi, durum)
values
  ('B1',  'Balkon Masası 1',  '{1,2,3,4}', false),
  ('B2',  'Balkon Masası 2',  '{1,2,3,4}', false),
  ('B3',  'Balkon Masası 3',  '{1,2,3,4}', false),
  ('B4',  'Balkon Masası 4',  '{1,2,3,4}', false),
  ('B5',  'Balkon Masası 5',  '{1,2,3,4}', false),
  ('B6',  'Balkon Masası 6',  '{1,2,3,4}', false),
  ('B7',  'Balkon Masası 7',  '{1,2,3,4}', false),
  ('B8',  'Balkon Masası 8',  '{1,2,3,4}', false),
  ('B9',  'Balkon Masası 9',  '{1,2,3,4}', false),
  ('B10', 'Balkon Masası 10', '{1,2,3}',   false),
  ('S1',  'Salon Masası 1',   '{1,2,3,4}', false),
  ('S2',  'Salon Masası 2',   '{1,2,3,4}', false),
  ('S3',  'Salon Masası 3',   '{1,2,3,4}', false),
  ('S4',  'Salon Masası 4',   '{1,2,3,4}', false),
  ('S6',  'Salon Masası 6',   '{1,2,3,4}', false),
  ('S7',  'Salon Masası 7',   '{1,2,3,4}', false),
  ('S8',  'Salon Masası 8',   '{1,2,3,4}', false),
  ('S9',  'Salon Masası 9',   '{1,2,3,4}', false),
  ('S11', 'Salon Masası 11',  '{3,4,5,6,7,8}', false),
  ('S12', 'Salon Masası 12',  '{1,2}',     false),
  ('S13', 'Salon Masası 13',  '{1,2}',     false),
  ('S14', 'Salon Masası 14',  '{1,2}',     false),
  ('S15', 'Salon Masası 15',  '{1,2,3,4}', false),
  ('S16', 'Salon Masası 16',  '{1,2,3,4}', false),
  ('S17', 'Salon Masası 17',  '{1,2,3,4}', false),
  ('S18', 'Salon Masası 18',  '{1,2,3,4}', false),
  ('L1',  'L1 Yuvarlak Masa', '{2,3,4}',   false),
  ('L2',  'L2 Yuvarlak Masa', '{2,3,4}',   false),
  ('LOCA','Loca',             '{4,5,6,7,8,9,10}', false)
on conflict (masa_kisaltmasi) do nothing;
