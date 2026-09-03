-- ============================================================================
-- Taşeli Sosyal Tesisleri — "rezervasyon" tablosuna rezervasyon detay kolonları
-- ============================================================================
-- Bu dosya, daha önce oluşturulmuş olan "rezervasyon" tablosunun üzerine
-- çalışır (masa_kisaltmasi, masa_adi, masanin_rezerve_olasiligi, durum,
-- created_time kolonları zaten var olmalı). Bu SQL'i Supabase Dashboard'da
-- SQL Editor'e yapıştırıp çalıştırman yeterli, dilediğin kadar tekrar
-- çalıştırabilirsin (ADD COLUMN IF NOT EXISTS kullanıldığı için hata vermez).
--
-- Yeni kolonlar bir rezervasyon TALEBİNİN detaylarını tutar. "rezervasyon"
-- tablosu masa başına tek satır olduğu için (masa_kisaltmasi üzerinde unique
-- kısıtı var), bu kolonlar her masanın GÜNCEL/SON rezervasyon talebini
-- tutar — geçmiş rezervasyonların ayrı ayrı kaydı tutulmaz. Sitedeki
-- rezervasyon akışı hâlâ WhatsApp üzerinden yürüyor (herkese açık tarafta
-- veritabanına yazma yok); bu alanları yönetim panelinden, WhatsApp'tan
-- gelen mesaja bakarak sen dolduracaksın.
-- ============================================================================

alter table public.rezervasyon
  add column if not exists rezervasyon_tarihi date,
  add column if not exists rezervasyon_saati time,
  add column if not exists rezervasyon_tarihi_gunu text,
  add column if not exists isim text,
  add column if not exists soyisim text,
  add column if not exists telefon_numarasi text,
  add column if not exists kac_kisi integer;

comment on column public.rezervasyon.rezervasyon_tarihi is 'Rezervasyonun tarihi (YYYY-MM-DD).';
comment on column public.rezervasyon.rezervasyon_saati is 'Rezervasyonun saati.';
comment on column public.rezervasyon.rezervasyon_tarihi_gunu is 'rezervasyon_tarihi''nden otomatik hesaplanan gün adı (Pazartesi...Pazar) — site tarafından otomatik dolduruluyor.';
comment on column public.rezervasyon.isim is 'Rezervasyonu yapan kişinin adı.';
comment on column public.rezervasyon.soyisim is 'Rezervasyonu yapan kişinin soyadı.';
comment on column public.rezervasyon.telefon_numarasi is 'Rezervasyonu yapan kişinin telefon numarası.';
comment on column public.rezervasyon.kac_kisi is 'Rezervasyon için istenen kişi sayısı.';

-- İsteğe bağlı ama önerilir: kaç_kişi negatif/0 olamaz.
alter table public.rezervasyon
  drop constraint if exists rezervasyon_kac_kisi_pozitif;
alter table public.rezervasyon
  add constraint rezervasyon_kac_kisi_pozitif check (kac_kisi is null or kac_kisi > 0);

-- ----------------------------------------------------------------------------
-- Yönetim paneli bu tabloyu güncelleyebilsin diye UPDATE politikası.
-- Sadece giriş yapmış (Supabase Auth ile) VE e-postası yönetici e-postan
-- olan kullanıcı güncelleyebilir — admin/login sayfasındaki kontrolle aynı
-- e-postayı kullanıyor. Site anon-key ile çalıştığı için bu politika
-- olmadan admin panelinden güncelleme yapılamaz.
-- ----------------------------------------------------------------------------
drop policy if exists "Yönetici rezervasyonu günceller" on public.rezervasyon;
create policy "Yönetici rezervasyonu günceller"
  on public.rezervasyon
  for update
  to authenticated
  using (auth.jwt() ->> 'email' = 'yonetici@taselisosyal.com')
  with check (auth.jwt() ->> 'email' = 'yonetici@taselisosyal.com');
