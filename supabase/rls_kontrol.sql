-- ============================================================================
-- Tanılama: "rezervasyon" ve "mevcut_rezervasyonlar" tablolarında hangi RLS
-- (Row Level Security) politikaları GERÇEKTEN var, kontrol et.
-- ============================================================================
-- Admin panelinde masa dolu/boş yapma veya rezervasyon aktif etme/silme
-- "kaydettim" diyor ama veritabanına işlenmiyorsa, en olası sebep şu: UPDATE
-- (ya da DELETE) izni veren RLS politikası hiç oluşturulmamış ya da yanlış
-- oluşturulmuş — bu durumda Supabase hata FIRLATMAZ, sessizce 0 satır
-- günceller. Bu SQL'i SQL Editor'de çalıştır, çıkan sonucu bana gönder.
-- ============================================================================

select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where tablename in ('rezervasyon', 'mevcut_rezervasyonlar')
order by tablename, cmd;

-- Beklenen sonuç (özet):
--   rezervasyon            | select | {anon,authenticated}  | rezervasyon_public_select
--   rezervasyon            | update | {authenticated}       | Yönetici rezervasyonu günceller
--   mevcut_rezervasyonlar  | insert | {anon,authenticated}  | Herkes rezervasyon talebi oluşturabilir
--   mevcut_rezervasyonlar  | select | {authenticated}       | Yönetici talepleri görür
--   mevcut_rezervasyonlar  | update | {authenticated}       | Yönetici talepleri günceller
--   mevcut_rezervasyonlar  | delete | {authenticated}       | Yönetici talepleri siler
--
-- "rezervasyon" için "update" satırı hiç görünmüyorsa: supabase/rezervasyon_detay_kolonlari.sql
-- dosyasını (en alttaki UPDATE politikası kısmını) SQL Editor'de tekrar çalıştır.
-- "mevcut_rezervasyonlar" için satırlar hiç görünmüyorsa: supabase/mevcut_rezervasyonlar.sql
-- dosyasını hiç çalıştırmamışsın demektir, onu çalıştır.
