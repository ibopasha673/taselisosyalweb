'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ShieldCheck, LogOut, Plus, Trash2, Edit3, Image as ImageIcon, Home, ListOrdered, Utensils, Star, Search, CalendarCheck, Phone } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { type MasaTanimi } from '@/lib/masalar'
import { RezervasyonKrokisi, type RezervasyonKaydi } from '@/components/RezervasyonKrokisi'
import { RezervasyonTalepleri } from '@/components/RezervasyonTalepleri'

type SliderItem = {
  id: string
  baslik: string
  slogan: string
  gorsel_url: string
  slogan_durum: boolean
  baslik_durum: boolean
  ustten_kirp: boolean | null
}

type KategoriItem = {
  id: string
  sira_numarasi: number
  kategori_ismi: string
}

type UrunItem = {
  id: string
  kategori_uuid: string
  kategori_ismi: string
  urun_ismi: string
  urun_aciklamasi: string
  urun_gorseli1: string
  urun_gorseli2: string
  one_cikanlar: boolean
  fiyat: number | null
}

// Pazar günü JS'te 0 olduğu için dizi Pazar'dan başlıyor; getDay() index'iyle birebir eşleşsin diye.
const REZ_GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
function rezGunHesapla(tarih: string): string {
  if (!tarih) return ''
  const d = new Date(tarih + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return ''
  return REZ_GUNLER[d.getDay()]
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'slider' | 'kategori' | 'urun' | 'rezervasyon'>('slider')
  const [sliders, setSliders] = useState<SliderItem[]>([])
  const [kategoriler, setKategoriler] = useState<KategoriItem[]>([])
  const [urunler, setUrunler] = useState<UrunItem[]>([])
  const [rezervasyonlar, setRezervasyonlar] = useState<RezervasyonKaydi[]>([])
  const [loading, setLoading] = useState(true)
  // Yetki kontrolü tamamlanana kadar true kalır; admin içeriği bu bitmeden asla gösterilmez
  const [checkingAuth, setCheckingAuth] = useState(true)
  
  // Slider State'leri
  const [editingId, setEditingId] = useState<string | null>(null)
  const [baslik, setBaslik] = useState('')
  const [slogan, setSlogan] = useState('')
  const [baslikDurum, setBaslikDurum] = useState(true)
  const [sloganDurum, setSloganDurum] = useState(true)
  // true => görsel üstten kırpılır (object-top), false => alttan kırpılır (object-bottom), null => ortalı kırpılır (object-center)
  const [usttenKirp, setUsttenKirp] = useState<boolean | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState('')

  // Kategori State'leri
  const [editingKategoriId, setEditingKategoriId] = useState<string | null>(null)
  const [siraNumarasi, setSiraNumarasi] = useState<number>(1)
  const [kategoriIsmi, setKategoriIsmi] = useState('')

  // Ürün State'leri
  const [editingUrunId, setEditingUrunId] = useState<string | null>(null)
  const [secilenKategoriUuid, setSecilenKategoriUuid] = useState('')
  const [urunIsmi, setUrunIsmi] = useState('')
  const [urunAciklamasi, setUrunAciklamasi] = useState('')
  const [fiyat, setFiyat] = useState('')
  const [oneCikanlar, setOneCikanlar] = useState(false)
  const [file1, setFile1] = useState<File | null>(null)
  const [file2, setFile2] = useState<File | null>(null)
  const [currentGorsel1, setCurrentGorsel1] = useState('')
  const [currentGorsel2, setCurrentGorsel2] = useState('')

  // Ürün/kategori listesinde arama
  const [urunAramaQuery, setUrunAramaQuery] = useState('')

  // Rezervasyon State'leri
  const [editingRezervasyonKisaltma, setEditingRezervasyonKisaltma] = useState<string | null>(null)
  const [rezTarih, setRezTarih] = useState('')
  const [rezSaat, setRezSaat] = useState('')
  const [rezIsim, setRezIsim] = useState('')
  const [rezSoyisim, setRezSoyisim] = useState('')
  const [rezTelefon, setRezTelefon] = useState('')
  const [rezKacKisi, setRezKacKisi] = useState('')
  const [rezDurum, setRezDurum] = useState(false)
  const [rezSubmitting, setRezSubmitting] = useState(false)
  // Kroki üzerinde tıklanan masa (rezervasyon yönetimi modalını açar)
  const [secilenMasaAdmin, setSecilenMasaAdmin] = useState<MasaTanimi | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function checkAuthAndFetch() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || session.user.email !== 'yonetici@taselisosyal.com') {
        // Yetkisiz/oturumsuz erişimde içerik hiç render edilmeden doğrudan login'e yönlendir
        router.replace('/admin/login')
        return
      }
      setCheckingAuth(false)
      fetchSliders()
      fetchKategoriler()
      fetchUrunler()
      fetchRezervasyonlar()
    }
    checkAuthAndFetch()
  }, [router])

  async function fetchSliders() {
    const { data } = await supabase.from('sliders').select('*').order('created_time', { ascending: false })
    if (data) setSliders(data)
    setLoading(false)
  }

  async function fetchKategoriler() {
    const { data } = await supabase.from('kategoriler').select('*').order('sira_numarasi', { ascending: true })
    if (data) setKategoriler(data)
  }

  async function fetchRezervasyonlar() {
    const { data } = await supabase.from('rezervasyon').select('*').order('masa_kisaltmasi', { ascending: true })
    if (data) setRezervasyonlar(data)
  }

  async function fetchUrunler() {
    // Öne çıkarılan ürünler (one_cikanlar = true) her zaman listenin en üstünde,
    // aynı grup içinde ise en yeni eklenen üstte olacak şekilde sıralanır
    const { data } = await supabase
      .from('urunler')
      .select('*')
      .order('one_cikanlar', { ascending: false })
      .order('created_time', { ascending: false })
    if (data) setUrunler(data)
  }

  const slugifyFilename = (name: string) => {
    const trMap: { [key: string]: string } = {
      'ç': 'c', 'Ç': 'c',
      'ğ': 'g', 'Ğ': 'g',
      'ı': 'i', 'İ': 'i',
      'ö': 'o', 'Ö': 'o',
      'ş': 's', 'Ş': 's',
      'ü': 'u', 'Ü': 'u',
      ' ': '-'
    }
    return name
      .split('')
      .map(char => trMap[char] || char)
      .join('')
      .replace(/[^a-zA-Z0-9.-]/g, '')
  }

  const handleSliderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    let gorsel_url = currentImageUrl

    if (file) {
      if (editingId && currentImageUrl) {
        const oldPath = currentImageUrl.split('/sliders/')[1]
        if (oldPath) {
          await supabase.storage.from('sliders').remove([decodeURIComponent(oldPath)])
        }
      }

      const cleanFileName = slugifyFilename(file.name)
      const fileName = `${Date.now()}-${cleanFileName}`
      const { error: uploadError } = await supabase.storage.from('sliders').upload(fileName, file)
      
      if (uploadError) {
        alert('Görsel yüklenirken hata oluştu: ' + uploadError.message)
        setSubmitting(false)
        return
      }

      const { data: publicURLData } = supabase.storage.from('sliders').getPublicUrl(fileName)
      gorsel_url = publicURLData.publicUrl
    }

    if (!gorsel_url) {
      alert('Lütfen bir görsel seçin!')
      setSubmitting(false)
      return
    }

    if (editingId) {
      await supabase.from('sliders').update({
        baslik,
        slogan,
        gorsel_url,
        baslik_durum: baslikDurum,
        slogan_durum: sloganDurum,
        ustten_kirp: usttenKirp
      }).eq('id', editingId)
    } else {
      await supabase.from('sliders').insert([{
        baslik,
        slogan,
        gorsel_url,
        baslik_durum: baslikDurum,
        slogan_durum: sloganDurum,
        ustten_kirp: usttenKirp
      }])
    }

    setBaslik('')
    setSlogan('')
    setBaslikDurum(true)
    setSloganDurum(true)
    setUsttenKirp(null)
    setFile(null)
    setCurrentImageUrl('')
    setEditingId(null)
    setSubmitting(false)
    fetchSliders()
  }

  const handleKategoriSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!kategoriIsmi.trim()) return
    setSubmitting(true)

    if (editingKategoriId) {
      await supabase.from('kategoriler').update({
        sira_numarasi: Number(siraNumarasi),
        kategori_ismi: kategoriIsmi
      }).eq('id', editingKategoriId)

      // Kategori ismi değiştiğinde, bu kategoriye bağlı ürünlerdeki
      // (denormalize edilmiş) kategori_ismi alanını da güncelle
      await supabase.from('urunler').update({
        kategori_ismi: kategoriIsmi
      }).eq('kategori_uuid', editingKategoriId)

      fetchUrunler()
    } else {
      await supabase.from('kategoriler').insert([{
        sira_numarasi: Number(siraNumarasi),
        kategori_ismi: kategoriIsmi
      }])
    }

    setKategoriIsmi('')
    setSiraNumarasi(kategoriler.length + 1)
    setEditingKategoriId(null)
    setSubmitting(false)
    fetchKategoriler()
  }

  const handleUrunSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!secilenKategoriUuid) {
      alert('Lütfen bir kategori seçin!')
      return
    }
    setSubmitting(true)

    const katObj = kategoriler.find(k => k.id === secilenKategoriUuid)
    const kategori_ismi = katObj ? katObj.kategori_ismi : ''

    let gorsel1_url = currentGorsel1
    let gorsel2_url = currentGorsel2

    if (file1) {
      if (editingUrunId && currentGorsel1) {
        const oldPath = currentGorsel1.split('/urunler/')[1]
        if (oldPath) await supabase.storage.from('urunler').remove([decodeURIComponent(oldPath)])
      }
      const fn = `${Date.now()}-1-${slugifyFilename(file1.name)}`
      const { error: err1 } = await supabase.storage.from('urunler').upload(fn, file1)
      if (err1) { alert('Hata: ' + err1.message); setSubmitting(false); return; }
      gorsel1_url = supabase.storage.from('urunler').getPublicUrl(fn).data.publicUrl
    }

    if (file2) {
      if (editingUrunId && currentGorsel2) {
        const oldPath = currentGorsel2.split('/urunler/')[1]
        if (oldPath) await supabase.storage.from('urunler').remove([decodeURIComponent(oldPath)])
      }
      const fn2 = `${Date.now()}-2-${slugifyFilename(file2.name)}`
      const { error: err2 } = await supabase.storage.from('urunler').upload(fn2, file2)
      if (err2) { alert('Hata: ' + err2.message); setSubmitting(false); return; }
      gorsel2_url = supabase.storage.from('urunler').getPublicUrl(fn2).data.publicUrl
    }

    const fiyatValue = fiyat.trim() === '' ? null : Number(fiyat)

    if (editingUrunId) {
      await supabase.from('urunler').update({
        kategori_uuid: secilenKategoriUuid,
        kategori_ismi,
        urun_ismi: urunIsmi,
        urun_aciklamasi: urunAciklamasi,
        urun_gorseli1: gorsel1_url,
        urun_gorseli2: gorsel2_url,
        fiyat: fiyatValue,
        one_cikanlar: oneCikanlar
      }).eq('id', editingUrunId)
    } else {
      await supabase.from('urunler').insert([{
        kategori_uuid: secilenKategoriUuid,
        kategori_ismi,
        urun_ismi: urunIsmi,
        urun_aciklamasi: urunAciklamasi,
        urun_gorseli1: gorsel1_url,
        urun_gorseli2: gorsel2_url,
        fiyat: fiyatValue,
        one_cikanlar: oneCikanlar
      }])
    }

    setSecilenKategoriUuid('')
    setUrunIsmi('')
    setUrunAciklamasi('')
    setFiyat('')
    setOneCikanlar(false)
    setFile1(null)
    setFile2(null)
    setCurrentGorsel1('')
    setCurrentGorsel2('')
    setEditingUrunId(null)
    setSubmitting(false)
    fetchUrunler()
  }

  const handleEditSlider = (slider: SliderItem) => {
    setEditingId(slider.id)
    setBaslik(slider.baslik || '')
    setSlogan(slider.slogan || '')
    setBaslikDurum(slider.baslik_durum)
    setSloganDurum(slider.slogan_durum)
    setUsttenKirp(slider.ustten_kirp ?? null)
    setCurrentImageUrl(slider.gorsel_url)
    setFile(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEditKategori = (kat: KategoriItem) => {
    setEditingKategoriId(kat.id)
    setSiraNumarasi(kat.sira_numarasi)
    setKategoriIsmi(kat.kategori_ismi)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEditUrun = (urun: UrunItem) => {
    setEditingUrunId(urun.id)
    setSecilenKategoriUuid(urun.kategori_uuid)
    setUrunIsmi(urun.urun_ismi)
    setUrunAciklamasi(urun.urun_aciklamasi || '')
    setFiyat(urun.fiyat != null ? String(urun.fiyat) : '')
    setOneCikanlar(urun.one_cikanlar || false)
    setCurrentGorsel1(urun.urun_gorseli1 || '')
    setCurrentGorsel2(urun.urun_gorseli2 || '')
    setFile1(null)
    setFile2(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteSlider = async (id: string, gorsel_url: string) => {
    if (!confirm('Bu manşeti silmek istediğinize emin misiniz?')) return
    const path = gorsel_url.split('/sliders/')[1]
    if (path) {
      const { error: storageError } = await supabase.storage.from('sliders').remove([decodeURIComponent(path)])
      if (storageError) {
        alert('Görsel storage\'dan silinemedi: ' + storageError.message + '\nKayıt yine de tablodan silinecek.')
      }
    }
    await supabase.from('sliders').delete().eq('id', id)
    fetchSliders()
  }

  const handleDeleteKategori = async (id: string) => {
    if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return
    await supabase.from('kategoriler').delete().eq('id', id)
    fetchKategoriler()
  }

  const handleDeleteUrun = async (id: string, g1: string, g2: string) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return
    const storageHatalari: string[] = []
    if (g1) {
      const p1 = g1.split('/urunler/')[1]
      if (p1) {
        const { error } = await supabase.storage.from('urunler').remove([decodeURIComponent(p1)])
        if (error) storageHatalari.push(error.message)
      }
    }
    if (g2) {
      const p2 = g2.split('/urunler/')[1]
      if (p2) {
        const { error } = await supabase.storage.from('urunler').remove([decodeURIComponent(p2)])
        if (error) storageHatalari.push(error.message)
      }
    }
    if (storageHatalari.length > 0) {
      alert('Görsel(ler) storage\'dan silinemedi: ' + storageHatalari.join(', ') + '\nKayıt yine de tablodan silinecek.')
    }
    await supabase.from('urunler').delete().eq('id', id)
    fetchUrunler()
  }

  const handleToggleOneCikanlar = async (urun: UrunItem) => {
    const yeniDeger = !urun.one_cikanlar
    // Anında görsel geri bildirim için önce ekrandaki listeyi güncelle
    setUrunler((prev) => prev.map((u) => (u.id === urun.id ? { ...u, one_cikanlar: yeniDeger } : u)))

    const { error } = await supabase.from('urunler').update({ one_cikanlar: yeniDeger }).eq('id', urun.id)
    if (error) {
      alert('Öne çıkarma durumu güncellenemedi: ' + error.message)
      // Hata olursa eski haline geri al
      setUrunler((prev) => prev.map((u) => (u.id === urun.id ? { ...u, one_cikanlar: !yeniDeger } : u)))
      return
    }
    // Sunucudaki doğru sırayla (öne çıkanlar üstte) listeyi yenile
    fetchUrunler()
  }

  // WhatsApp'tan gelen rezervasyon talebini işlerken masayı hızlıca dolu/boş yap
  // (detayları düzenlemeye gerek kalmadan). Masa boşaltılırken rezervasyon detayları da temizlenir.
  const handleHizliDurumDegistir = async (rez: RezervasyonKaydi) => {
    const yeniDurum = !rez.durum
    setRezervasyonlar((prev) =>
      prev.map((r) => (r.masa_kisaltmasi === rez.masa_kisaltmasi ? { ...r, durum: yeniDurum } : r))
    )

    const guncelleme = yeniDurum
      ? { durum: true }
      : {
          durum: false,
          rezervasyon_tarihi: null,
          rezervasyon_saati: null,
          rezervasyon_tarihi_gunu: null,
          isim: null,
          soyisim: null,
          telefon_numarasi: null,
          kac_kisi: null,
        }

    // .select() ekliyoruz ki güncellemenin GERÇEKTEN bir satıra uygulandığını görebilelim.
    // Supabase/PostgREST, RLS (Row Level Security) bir satırı gizlediğinde de hata
    // DÖNDÜRMEZ — sessizce 0 satır günceller. .select() olmadan bunu fark edemeyiz ve
    // admin "kaydetti" sanır ama veritabanı hiç değişmemiş olur.
    const { data, error } = await supabase
      .from('rezervasyon')
      .update(guncelleme)
      .eq('masa_kisaltmasi', rez.masa_kisaltmasi)
      .select()
    if (error || !data || data.length === 0) {
      alert(
        error
          ? 'Masa durumu güncellenemedi: ' + error.message
          : 'Masa durumu güncellenemedi — değişiklik veritabanına yansımadı. Muhtemelen oturumun süresi dolmuş ya da Supabase\'teki yetki (RLS) politikası eksik. Çıkış yapıp tekrar giriş yapmayı dene, sorun devam ederse "rezervasyon_detay_kolonlari.sql" dosyasındaki UPDATE politikasının Supabase\'te çalıştırıldığından emin ol.'
      )
      setRezervasyonlar((prev) =>
        prev.map((r) => (r.masa_kisaltmasi === rez.masa_kisaltmasi ? { ...r, durum: rez.durum } : r))
      )
      return
    }
    fetchRezervasyonlar()
  }

  // Formu bir kayıttan (varsa) doldurup düzenleme moduna geçirir. defaultDurum, kayıt
  // hiç yoksa veya boşsa (yeni rezervasyon giriliyorsa) DOLU kutucuğunun başlangıç değeri.
  const openRezervasyonForm = (kayit: RezervasyonKaydi | undefined, kisaltma: string, defaultDurum: boolean) => {
    setEditingRezervasyonKisaltma(kisaltma)
    setRezTarih(kayit?.rezervasyon_tarihi ?? '')
    setRezSaat(kayit?.rezervasyon_saati ?? '')
    setRezIsim(kayit?.isim ?? '')
    setRezSoyisim(kayit?.soyisim ?? '')
    setRezTelefon(kayit?.telefon_numarasi ?? '')
    setRezKacKisi(kayit?.kac_kisi != null ? String(kayit.kac_kisi) : '')
    setRezDurum(kayit ? kayit.durum : defaultDurum)
  }

  const handleEditRezervasyon = (rez: RezervasyonKaydi) => {
    openRezervasyonForm(rez, rez.masa_kisaltmasi, rez.durum)
  }

  const handleCancelRezervasyonEdit = () => {
    setEditingRezervasyonKisaltma(null)
  }

  // Kroki üzerinde bir masaya tıklanınca: masa doluysa doğrudan detay görünümü açılır
  // (form kapalı kalır), boşsa doğrudan doldurma formu açılır (DOLU kutucuğu işaretli başlar).
  const handleMasaTiklaAdmin = (tanim: MasaTanimi) => {
    setSecilenMasaAdmin(tanim)
    const kayit = rezervasyonMap[tanim.kisaltma]
    if (kayit?.durum) {
      setEditingRezervasyonKisaltma(null)
    } else {
      openRezervasyonForm(kayit, tanim.kisaltma, true)
    }
  }

  const kapatAdminModal = () => {
    setSecilenMasaAdmin(null)
    setEditingRezervasyonKisaltma(null)
  }

  const handleBosaltVeKapat = async (rez: RezervasyonKaydi) => {
    await handleHizliDurumDegistir(rez)
    kapatAdminModal()
  }

  const handleRezervasyonSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRezervasyonKisaltma) return
    setRezSubmitting(true)

    const { data, error } = await supabase
      .from('rezervasyon')
      .update({
        durum: rezDurum,
        rezervasyon_tarihi: rezTarih || null,
        rezervasyon_saati: rezSaat || null,
        rezervasyon_tarihi_gunu: rezTarih ? rezGunHesapla(rezTarih) : null,
        isim: rezIsim.trim() || null,
        soyisim: rezSoyisim.trim() || null,
        telefon_numarasi: rezTelefon.trim() || null,
        kac_kisi: rezKacKisi ? Number(rezKacKisi) : null,
      })
      .eq('masa_kisaltmasi', editingRezervasyonKisaltma)
      .select()

    setRezSubmitting(false)
    if (error || !data || data.length === 0) {
      alert(
        error
          ? 'Rezervasyon bilgisi kaydedilemedi: ' + error.message
          : 'Rezervasyon bilgisi kaydedilemedi — değişiklik veritabanına yansımadı. Muhtemelen oturumun süresi dolmuş ya da Supabase\'teki yetki (RLS) politikası eksik. Çıkış yapıp tekrar giriş yapmayı dene, sorun devam ederse "rezervasyon_detay_kolonlari.sql" dosyasındaki UPDATE politikasının Supabase\'te çalıştırıldığından emin ol.'
      )
      return
    }
    setEditingRezervasyonKisaltma(null)
    fetchRezervasyonlar()
  }

  // Formdaki bilgileri hiç girmeden, tek tuşla masayı direkt dolu/kapalı işaretler
  // (örn. bilgi alınmadan yürütülen bir grup ya da bakım için masayı bloke etmek gibi).
  const handleSadeceKapat = async () => {
    if (!editingRezervasyonKisaltma) return
    setRezSubmitting(true)

    const { data, error } = await supabase
      .from('rezervasyon')
      .update({
        durum: true,
        rezervasyon_tarihi: null,
        rezervasyon_saati: null,
        rezervasyon_tarihi_gunu: null,
        isim: null,
        soyisim: null,
        telefon_numarasi: null,
        kac_kisi: null,
      })
      .eq('masa_kisaltmasi', editingRezervasyonKisaltma)
      .select()

    setRezSubmitting(false)
    if (error || !data || data.length === 0) {
      alert(
        error
          ? 'Masa kapatılamadı: ' + error.message
          : 'Masa kapatılamadı — değişiklik veritabanına yansımadı. Muhtemelen oturumun süresi dolmuş ya da Supabase\'teki yetki (RLS) politikası eksik.'
      )
      return
    }
    setEditingRezervasyonKisaltma(null)
    fetchRezervasyonlar()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  // Kroki bileşeni masa kısaltmasına göre anahtarlanmış bir kayıt haritası bekliyor
  const rezervasyonMap: Record<string, RezervasyonKaydi> = Object.fromEntries(
    rezervasyonlar.map((r) => [r.masa_kisaltmasi, r])
  )
  const secilenMasaKayit = secilenMasaAdmin ? rezervasyonMap[secilenMasaAdmin.kisaltma] : undefined

  // Ürün ismi veya kategori ismine göre arama (Türkçe karakter duyarlı)
  const normalizedUrunArama = urunAramaQuery.trim().toLocaleLowerCase('tr-TR')
  const gosterilecekUrunler = normalizedUrunArama
    ? urunler.filter(
        (u) =>
          u.urun_ismi.toLocaleLowerCase('tr-TR').includes(normalizedUrunArama) ||
          (u.kategori_ismi || '').toLocaleLowerCase('tr-TR').includes(normalizedUrunArama)
      )
    : urunler

  if (checkingAuth || loading) {
    return (
      <div className="min-h-screen bg-[#2c1810] text-amber-100 flex flex-col items-center justify-center gap-3 font-sans">
        <div className="w-10 h-10 border-4 border-amber-800 border-t-amber-300 rounded-full animate-spin"></div>
        <p className="text-sm text-stone-300 tracking-wide">
          {checkingAuth ? 'Yetki kontrol ediliyor...' : 'Yükleniyor...'}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#2c1810] text-stone-100 font-sans">
      {/* Üst Navbar */}
      <header className="bg-[#1e100a] border-b border-amber-950 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-amber-500" />
          <h1 className="font-extrabold text-xl tracking-wider text-amber-100">YÖNETİCİ PANELİ</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            href="/" 
            target="_blank"
            className="flex items-center gap-2 bg-[#3b2216] hover:bg-[#4a2e1b] px-4 py-2 rounded-xl text-xs font-semibold text-amber-200 border border-amber-900/50 transition-colors"
          >
            <Home className="w-4 h-4 text-amber-500" /> Ana Sayfa
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-950/60 hover:bg-red-900/80 px-4 py-2 rounded-xl text-xs font-semibold text-red-200 border border-red-800/50 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Çıkış Yap
          </button>
        </div>
      </header>

      {/* Sekme Butonları Çubuğu */}
      <div className="bg-[#3b2216] border-b border-amber-950 shadow-inner">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-2 overflow-x-auto py-3">
          <button 
            onClick={() => setActiveTab('slider')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all ${activeTab === 'slider' ? 'bg-amber-700 text-white shadow border border-amber-600/40' : 'text-stone-300 hover:text-white hover:bg-[#2c1810]'}`}
          >
            SLİDER YÖNETİMİ
          </button>
          <button 
            onClick={() => setActiveTab('kategori')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all ${activeTab === 'kategori' ? 'bg-amber-700 text-white shadow border border-amber-600/40' : 'text-stone-300 hover:text-white hover:bg-[#2c1810]'}`}
          >
            KATEGORİ YÖNETİMİ
          </button>
          <button
            onClick={() => setActiveTab('urun')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all ${activeTab === 'urun' ? 'bg-amber-700 text-white shadow border border-amber-600/40' : 'text-stone-300 hover:text-white hover:bg-[#2c1810]'}`}
          >
            ÜRÜN YÖNETİMİ
          </button>
          <button
            onClick={() => setActiveTab('rezervasyon')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all ${activeTab === 'rezervasyon' ? 'bg-amber-700 text-white shadow border border-amber-600/40' : 'text-stone-300 hover:text-white hover:bg-[#2c1810]'}`}
          >
            REZERVASYON YÖNETİMİ
          </button>
        </div>
      </div>

      {/* İçerik Alanı */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'slider' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Sol Kısım: Slider Formu */}
            <div className="lg:col-span-5 bg-[#3b2216] border border-amber-900/40 p-6 rounded-2xl shadow-xl">
              <div className="flex items-center gap-2 mb-6 border-b border-amber-900/40 pb-3 text-amber-200 font-bold text-sm">
                {editingId ? <Edit3 className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-amber-500" />}
                <span>{editingId ? 'Manşet Düzenle' : 'Yeni Manşet Ekle'}</span>
              </div>

              <form onSubmit={handleSliderSubmit} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-stone-300">MANŞET BAŞLIĞI</label>
                    <label className="flex items-center gap-1.5 text-[11px] font-medium text-stone-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={baslikDurum} 
                        onChange={(e) => setBaslikDurum(e.target.checked)}
                        className="w-3.5 h-3.5 accent-amber-600 rounded bg-[#1e100a] border-amber-900"
                      />
                      Göster
                    </label>
                  </div>
                  <input 
                    type="text" 
                    value={baslik} 
                    onChange={(e) => setBaslik(e.target.value)} 
                    placeholder="Başlık..."
                    className="w-full bg-[#1e100a] border border-amber-900/50 rounded-xl px-4 py-2.5 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1">GÖRSEL</label>
                  {currentImageUrl && !file && (
                    <div className="flex items-center gap-3 mb-2 bg-[#1e100a] border border-amber-900/50 rounded-xl p-2">
                      <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-stone-900 flex-shrink-0 border border-amber-900/50">
                        <Image src={currentImageUrl} alt="Mevcut görsel" fill className="object-cover" />
                      </div>
                      <p className="text-[11px] text-amber-400">Mevcut görsel korunuyor. Değiştirmek için yeni bir dosya seçin.</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3 bg-[#1e100a] border border-amber-900/50 rounded-xl px-4 py-2.5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files && setFile(e.target.files[0])}
                      className="text-xs text-stone-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-700 file:text-white hover:file:bg-amber-600 cursor-pointer"
                    />
                  </div>
                  {file && (
                    <p className="text-[11px] text-emerald-400 mt-1">Yeni görsel seçildi: {file.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">GÖRSEL KIRPMA YÖNÜ</label>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setUsttenKirp(true)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold tracking-wide border transition-all ${
                        usttenKirp === true
                          ? 'bg-amber-700 border-amber-600 text-white'
                          : 'bg-[#1e100a] border-amber-900/50 text-stone-300 hover:border-amber-700'
                      }`}
                    >
                      ÜSTTEN KIRP
                    </button>
                    <button
                      type="button"
                      onClick={() => setUsttenKirp(null)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold tracking-wide border transition-all ${
                        usttenKirp === null
                          ? 'bg-amber-700 border-amber-600 text-white'
                          : 'bg-[#1e100a] border-amber-900/50 text-stone-300 hover:border-amber-700'
                      }`}
                    >
                      ORTALI KIRP
                    </button>
                    <button
                      type="button"
                      onClick={() => setUsttenKirp(false)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold tracking-wide border transition-all ${
                        usttenKirp === false
                          ? 'bg-amber-700 border-amber-600 text-white'
                          : 'bg-[#1e100a] border-amber-900/50 text-stone-300 hover:border-amber-700'
                      }`}
                    >
                      ALTTAN KIRP
                    </button>
                  </div>
                  <div className="flex items-start gap-2 bg-amber-950/40 border border-amber-900/40 rounded-lg px-3 py-2">
                    <span className="text-amber-500 text-sm leading-none mt-0.5">ⓘ</span>
                    <p className="text-[11px] text-stone-300 leading-relaxed">
                      Görsel bu alana tam oturmayabilir; bu yüzden bir kenarından otomatik kırpılır. Görselin asıl anlatmak
                      istediği kısım (yemek, ürün, insan vb.) üstte mi kalıyor altta mı, ona bakıp o tarafı koruyan
                      seçeneği işaretleyin. Emin değilseniz &quot;Ortalı Kırp&quot;ı seçin — bu, görselin hem üstünden hem
                      altından eşit miktarda kırpar, en güvenli varsayılan seçenektir.
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-stone-300">SLOGAN</label>
                    <label className="flex items-center gap-1.5 text-[11px] font-medium text-stone-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={sloganDurum} 
                        onChange={(e) => setSloganDurum(e.target.checked)}
                        className="w-3.5 h-3.5 accent-amber-600 rounded bg-[#1e100a] border-amber-900"
                      />
                      Göster
                    </label>
                  </div>
                  <textarea 
                    value={slogan} 
                    onChange={(e) => setSlogan(e.target.value)} 
                    rows={3}
                    placeholder="Slogan..."
                    className="w-full bg-[#1e100a] border border-amber-900/50 rounded-xl px-4 py-2.5 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-sm tracking-wider transition-all shadow-lg disabled:opacity-55"
                  >
                    {submitting ? 'KAYDEDİLİYOR...' : (editingId ? 'GÜNCELLE' : 'EKLE')}
                  </button>
                  {editingId && (
                    <button 
                      type="button"
                      onClick={() => { setEditingId(null); setBaslik(''); setSlogan(''); setUsttenKirp(null); setFile(null); setCurrentImageUrl(''); }}
                      className="bg-stone-700 hover:bg-stone-600 text-stone-200 px-4 py-3 rounded-xl text-xs font-bold"
                    >
                      İPTAL
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Sağ Kısım: Slider Listesi */}
            <div className="lg:col-span-7 bg-[#3b2216] border border-amber-900/40 p-6 rounded-2xl shadow-xl">
              <div className="flex items-center gap-2 mb-6 border-b border-amber-900/40 pb-3 text-amber-200 font-bold text-sm">
                <ImageIcon className="w-5 h-5 text-amber-500" />
                <span>KAYITLI MANŞETLER ({sliders.length})</span>
              </div>

              <div className="space-y-4">
                {sliders.length === 0 ? (
                  <p className="text-xs text-stone-400 text-center py-8">Henüz kayıtlı manşet bulunmuyor.</p>
                ) : (
                  sliders.map((slider) => (
                    <div key={slider.id} className="bg-[#2c1810] border border-amber-900/40 p-4 rounded-xl flex items-center justify-between gap-4 shadow-inner">
                      <div className="relative w-24 h-14 rounded-lg overflow-hidden bg-stone-900 flex-shrink-0 border border-amber-900/50">
                        <Image src={slider.gorsel_url} alt="Slider" fill className="object-cover" />
                      </div>

                      <div className="flex-grow min-w-0">
                        <h4 className="font-bold text-amber-100 text-sm truncate">{slider.baslik || '(Başlık Yok)'}</h4>
                        <p className="text-xs text-stone-400 truncate mt-0.5">{slider.slogan || '(Slogan Yok)'}</p>
                        <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-950/50 border border-amber-900/50 rounded-full px-2 py-0.5">
                          {slider.ustten_kirp === true
                            ? 'Üstten Kırpılıyor'
                            : slider.ustten_kirp === false
                            ? 'Alttan Kırpılıyor'
                            : 'Ortalı Kırpılıyor'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button 
                          onClick={() => handleEditSlider(slider)}
                          className="p-2 bg-amber-700/40 hover:bg-amber-700 text-amber-200 rounded-lg transition-colors border border-amber-600/30"
                          title="Düzenle"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteSlider(slider.id, slider.gorsel_url)}
                          className="p-2 bg-red-950/60 hover:bg-red-900 text-red-300 rounded-lg transition-colors border border-red-800/50"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'kategori' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Sol Kısım: Kategori Ekle / Düzenle Formu */}
            <div className="lg:col-span-5 bg-[#3b2216] border border-amber-900/40 p-6 rounded-2xl shadow-xl">
              <div className="flex items-center gap-2 mb-6 border-b border-amber-900/40 pb-3 text-amber-200 font-bold text-sm">
                {editingKategoriId ? <Edit3 className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-amber-500" />}
                <span>{editingKategoriId ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}</span>
              </div>

              <form onSubmit={handleKategoriSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1">SIRA NUMARASI</label>
                  <input 
                    type="number" 
                    value={siraNumarasi} 
                    onChange={(e) => setSiraNumarasi(Number(e.target.value))} 
                    required
                    className="w-full bg-[#1e100a] border border-amber-900/50 rounded-xl px-4 py-2.5 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1">KATEGORİ İSMİ</label>
                  <input 
                    type="text" 
                    value={kategoriIsmi} 
                    onChange={(e) => setKategoriIsmi(e.target.value)} 
                    placeholder="Örn: Çorbalar"
                    required
                    className="w-full bg-[#1e100a] border border-amber-900/50 rounded-xl px-4 py-2.5 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-sm tracking-wider transition-all shadow-lg disabled:opacity-55"
                  >
                    {submitting ? 'KAYDEDİLİYOR...' : (editingKategoriId ? 'GÜNCELLE' : 'EKLE')}
                  </button>
                  {editingKategoriId && (
                    <button 
                      type="button"
                      onClick={() => { setEditingKategoriId(null); setKategoriIsmi(''); setSiraNumarasi(kategoriler.length + 1); }}
                      className="bg-stone-700 hover:bg-stone-600 text-stone-200 px-4 py-3 rounded-xl text-xs font-bold"
                    >
                      İPTAL
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Sağ Kısım: Kayıtlı Kategoriler Listesi */}
            <div className="lg:col-span-7 bg-[#3b2216] border border-amber-900/40 p-6 rounded-2xl shadow-xl">
              <div className="flex items-center gap-2 mb-6 border-b border-amber-900/40 pb-3 text-amber-200 font-bold text-sm">
                <ListOrdered className="w-5 h-5 text-amber-500" />
                <span>KAYITLI KATEGORİLER ({kategoriler.length})</span>
              </div>

              <div className="space-y-4">
                {kategoriler.length === 0 ? (
                  <p className="text-xs text-stone-400 text-center py-8">Henüz kayıtlı kategori bulunmuyor.</p>
                ) : (
                  kategoriler.map((kat) => (
                    <div key={kat.id} className="bg-[#2c1810] border border-amber-900/40 p-4 rounded-xl flex items-center justify-between gap-4 shadow-inner">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-amber-700/30 border border-amber-600/40 flex items-center justify-center font-bold text-amber-400 text-xs">
                          {kat.sira_numarasi}
                        </span>
                        <h4 className="font-bold text-amber-100 text-sm">{kat.kategori_ismi}</h4>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button 
                          onClick={() => handleEditKategori(kat)}
                          className="p-2 bg-amber-700/40 hover:bg-amber-700 text-amber-200 rounded-lg transition-colors border border-amber-600/30"
                          title="Düzenle"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteKategori(kat.id)}
                          className="p-2 bg-red-950/60 hover:bg-red-900 text-red-300 rounded-lg transition-colors border border-red-800/50"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'urun' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Sol Kısım: Ürün Ekle / Düzenle Formu */}
            <div className="lg:col-span-5 bg-[#3b2216] border border-amber-900/40 p-6 rounded-2xl shadow-xl">
              <div className="flex items-center gap-2 mb-6 border-b border-amber-900/40 pb-3 text-amber-200 font-bold text-sm">
                {editingUrunId ? <Edit3 className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-amber-500" />}
                <span>{editingUrunId ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}</span>
              </div>

              <form onSubmit={handleUrunSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1">KATEGORİ SEÇ</label>
                  <select 
                    value={secilenKategoriUuid} 
                    onChange={(e) => setSecilenKategoriUuid(e.target.value)} 
                    required
                    className="w-full bg-[#1e100a] border border-amber-900/50 rounded-xl px-4 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-600"
                  >
                    <option value="">Kategori Seçiniz...</option>
                    {kategoriler.map(kat => (
                      <option key={kat.id} value={kat.id}>{kat.kategori_ismi}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1">ÜRÜN İSMİ</label>
                  <input 
                    type="text" 
                    value={urunIsmi} 
                    onChange={(e) => setUrunIsmi(e.target.value)} 
                    placeholder="Örn: Taşeli Çorbası" 
                    required 
                    className="w-full bg-[#1e100a] border border-amber-900/50 rounded-xl px-4 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-600" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1">ÜRÜN AÇIKLAMASI</label>
                  <textarea
                    value={urunAciklamasi}
                    onChange={(e) => setUrunAciklamasi(e.target.value)}
                    rows={2}
                    placeholder="Açıklama..."
                    className="w-full bg-[#1e100a] border border-amber-900/50 rounded-xl px-4 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1">FİYAT (₺) (İsteğe Bağlı)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={fiyat}
                    onChange={(e) => setFiyat(e.target.value)}
                    placeholder="Örn: 120"
                    className="w-full bg-[#1e100a] border border-amber-900/50 rounded-xl px-4 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-600"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-stone-300 cursor-pointer bg-[#1e100a] border border-amber-900/50 rounded-xl px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={oneCikanlar}
                    onChange={(e) => setOneCikanlar(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded bg-[#1e100a] border-amber-900"
                  />
                  ÖNE ÇIKAR (Anasayfada &quot;Öne Çıkanlar&quot; şeridinde göster)
                </label>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1">ÜRÜN GÖRSELİ 1</label>
                  {currentGorsel1 && !file1 && (
                    <div className="flex items-center gap-3 mb-2 bg-[#1e100a] border border-amber-900/50 rounded-xl p-2">
                      <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-stone-900 flex-shrink-0 border border-amber-900/50">
                        <Image src={currentGorsel1} alt="Mevcut görsel 1" fill className="object-cover" />
                      </div>
                      <p className="text-[11px] text-amber-400">Mevcut görsel korunuyor. Değiştirmek için yeni bir dosya seçin.</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files && setFile1(e.target.files[0])}
                    className="w-full text-xs text-stone-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-700 file:text-white hover:file:bg-amber-600 cursor-pointer bg-[#1e100a] border border-amber-900/50 rounded-xl p-2"
                  />
                  {file1 && (
                    <p className="text-[11px] text-emerald-400 mt-1">Yeni görsel seçildi: {file1.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1">ÜRÜN GÖRSELİ 2 (İsteğe Bağlı)</label>
                  {currentGorsel2 && !file2 && (
                    <div className="flex items-center gap-3 mb-2 bg-[#1e100a] border border-amber-900/50 rounded-xl p-2">
                      <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-stone-900 flex-shrink-0 border border-amber-900/50">
                        <Image src={currentGorsel2} alt="Mevcut görsel 2" fill className="object-cover" />
                      </div>
                      <p className="text-[11px] text-amber-400">Mevcut görsel korunuyor. Değiştirmek için yeni bir dosya seçin.</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files && setFile2(e.target.files[0])}
                    className="w-full text-xs text-stone-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-700 file:text-white hover:file:bg-amber-600 cursor-pointer bg-[#1e100a] border border-amber-900/50 rounded-xl p-2"
                  />
                  {file2 && (
                    <p className="text-[11px] text-emerald-400 mt-1">Yeni görsel seçildi: {file2.name}</p>
                  )}
                </div>

                <div className="pt-2 flex gap-2">
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-sm tracking-wider transition-all shadow-lg disabled:opacity-55"
                  >
                    {submitting ? 'KAYDEDİLİYOR...' : (editingUrunId ? 'GÜNCELLE' : 'EKLE')}
                  </button>
                  {editingUrunId && (
                    <button 
                      type="button" 
                      onClick={() => { setEditingUrunId(null); setSecilenKategoriUuid(''); setUrunIsmi(''); setUrunAciklamasi(''); setFiyat(''); setOneCikanlar(false); setFile1(null); setFile2(null); }}
                      className="bg-stone-700 hover:bg-stone-600 text-stone-200 px-4 py-3 rounded-xl text-xs font-bold"
                    >
                      İPTAL
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Sağ Kısım: Kayıtlı Ürünler Listesi */}
            <div className="lg:col-span-7 bg-[#3b2216] border border-amber-900/40 p-6 rounded-2xl shadow-xl">
              <div className="flex items-center gap-2 mb-4 border-b border-amber-900/40 pb-3 text-amber-200 font-bold text-sm">
                <Utensils className="w-5 h-5 text-amber-500" />
                <span>KAYITLI ÜRÜNLER ({urunler.length})</span>
              </div>

              <div className="relative mb-4">
                <input
                  type="text"
                  value={urunAramaQuery}
                  onChange={(e) => setUrunAramaQuery(e.target.value)}
                  placeholder="Ürün veya kategori adına göre ara..."
                  className="w-full bg-[#1e100a] border border-amber-900/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-600"
                />
                <Search className="absolute left-3 top-3 w-4 h-4 text-stone-500" />
              </div>

              <div className="space-y-4">
                {urunler.length === 0 ? (
                  <p className="text-xs text-stone-400 text-center py-8">Henüz kayıtlı ürün bulunmuyor.</p>
                ) : gosterilecekUrunler.length === 0 ? (
                  <p className="text-xs text-stone-400 text-center py-8">Aramanızla eşleşen ürün bulunamadı.</p>
                ) : (
                  gosterilecekUrunler.map((urun) => (
                    <div
                      key={urun.id}
                      className={`p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner border overflow-hidden ${
                        urun.one_cikanlar
                          ? 'bg-emerald-950/30 border-emerald-600/60 ring-1 ring-emerald-600/30'
                          : 'bg-[#2c1810] border-amber-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {urun.urun_gorseli1 ? (
                          <div className="relative w-16 h-14 rounded-lg overflow-hidden bg-stone-900 flex-shrink-0 border border-amber-900/50">
                            <Image src={urun.urun_gorseli1} alt="Ürün" fill className="object-cover" />
                          </div>
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] bg-amber-800/40 text-amber-300 px-2 py-0.5 rounded-full font-semibold">{urun.kategori_ismi}</span>
                            {urun.one_cikanlar && (
                              <span className="text-[10px] bg-emerald-700 text-white px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                <Star className="w-2.5 h-2.5 fill-white" /> ÖNE ÇIKAN
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-amber-100 text-sm mt-1 break-words">
                            {urun.urun_ismi}
                            {urun.fiyat != null && (
                              <span className="text-amber-400 font-semibold"> — {urun.fiyat} ₺</span>
                            )}
                          </h4>
                          <p className="text-xs text-stone-400 truncate">{urun.urun_aciklamasi}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                        <button
                          onClick={() => handleToggleOneCikanlar(urun)}
                          className={`p-2 rounded-lg transition-colors border ${
                            urun.one_cikanlar
                              ? 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-500/50'
                              : 'bg-[#1e100a] hover:bg-[#2c1810] text-stone-400 border-amber-900/40'
                          }`}
                          title={urun.one_cikanlar ? 'Öne çıkarmayı kaldır' : 'Öne çıkar'}
                        >
                          <Star className={`w-4 h-4 ${urun.one_cikanlar ? 'fill-white' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleEditUrun(urun)}
                          className="p-2 bg-amber-700/40 hover:bg-amber-700 text-amber-200 rounded-lg transition-colors border border-amber-600/30"
                          title="Düzenle"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUrun(urun.id, urun.urun_gorseli1, urun.urun_gorseli2)}
                          className="p-2 bg-red-950/60 hover:bg-red-900 text-red-300 rounded-lg transition-colors border border-red-800/50"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'rezervasyon' && (
          <div className="space-y-6">
            <RezervasyonTalepleri />

            <div className="bg-[#3b2216] border border-amber-900/40 p-6 rounded-2xl shadow-xl">
              <div className="flex items-center gap-2 mb-4 border-b border-amber-900/40 pb-3 text-amber-200 font-bold text-sm">
                <CalendarCheck className="w-5 h-5 text-amber-500" />
                <span>MASA REZERVASYON DURUMU</span>
              </div>

              <p className="text-xs text-stone-400 mb-4 leading-relaxed">
                Aktif edilen rezervasyonlar krokide otomatik olarak dolu görünür. Mesajı okuyup krokiden masaya da
                tıklayabilirsin: boş bir masaya tıklayınca doğrudan bilgileri girip dolu işaretleyebilirsin; dolu bir
                masaya tıklayınca daha önce girilen rezervasyon bilgileri karşına çıkar. Site anında bu bilgiye göre
                güncellenir.
              </p>

              {rezervasyonlar.length === 0 && (
                <div className="mb-4 bg-amber-950/40 border border-amber-800/50 text-amber-200 text-xs rounded-lg px-4 py-3">
                  Henüz masa bulunamadı. <code className="font-mono">rezervasyon</code> tablosunun Supabase&apos;te
                  oluşturulduğundan emin ol.
                </div>
              )}

              {/* Lejant */}
              <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-stone-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-sm bg-[#f2d9b6] border border-[#b45309] inline-block" /> Boş —
                  tıkla, bilgi gir
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-sm bg-stone-200 border border-stone-400 inline-block" /> Dolu —
                  tıkla, detayı gör
                </div>
              </div>

              <div className="bg-[#fdf8ef] border border-[#c9a97e] rounded-2xl shadow-sm p-3 md:p-5">
                <RezervasyonKrokisi kayitlar={rezervasyonMap} onMasaTikla={handleMasaTiklaAdmin} tumuTiklanabilir />
              </div>
            </div>
          </div>
        )}

        {/* Rezervasyon yönetim modalı: kroki üzerinden masaya tıklayınca açılır */}
        {secilenMasaAdmin && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 py-6"
            onClick={kapatAdminModal}
          >
            <div
              className="bg-[#2c1810] border border-amber-900/40 rounded-2xl shadow-2xl max-w-sm w-full p-6 max-h-[90vh] overflow-y-auto text-stone-100"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <h3 className="text-lg font-extrabold text-amber-100 mb-1">
                {secilenMasaKayit?.masa_adi ?? secilenMasaAdmin.kisaltma}
              </h3>
              <p className="text-xs font-mono text-stone-400 mb-3">{secilenMasaAdmin.kisaltma}</p>
              {secilenMasaKayit?.masanin_rezerve_olasiligi?.length ? (
                <p className="text-xs text-stone-400 mb-4">
                  {Math.min(...secilenMasaKayit.masanin_rezerve_olasiligi)}-
                  {Math.max(...secilenMasaKayit.masanin_rezerve_olasiligi)} kişilik gruplar için uygun
                </p>
              ) : null}

              {/* DETAY GÖRÜNÜMÜ: masa dolu ve düzenleme formu açık değilse — girilmiş rezervasyon bilgilerini gösterir */}
              {secilenMasaKayit?.durum && editingRezervasyonKisaltma !== secilenMasaAdmin.kisaltma && (
                <div className="space-y-4">
                  <div className="bg-red-950/30 border border-red-700/40 rounded-xl p-4 space-y-1.5 text-sm">
                    <p className="font-bold text-red-200 text-xs tracking-wider mb-1">DOLU</p>
                    {(secilenMasaKayit.isim || secilenMasaKayit.soyisim) && (
                      <p className="text-stone-200">
                        {[secilenMasaKayit.isim, secilenMasaKayit.soyisim].filter(Boolean).join(' ')}
                        {secilenMasaKayit.kac_kisi ? ` · ${secilenMasaKayit.kac_kisi} kişi` : ''}
                      </p>
                    )}
                    {secilenMasaKayit.telefon_numarasi && (
                      <p className="flex items-center gap-1.5 text-stone-300">
                        <Phone className="w-3.5 h-3.5 text-amber-500" /> {secilenMasaKayit.telefon_numarasi}
                      </p>
                    )}
                    {secilenMasaKayit.rezervasyon_tarihi && (
                      <p className="text-stone-300">
                        {new Date(secilenMasaKayit.rezervasyon_tarihi + 'T00:00:00').toLocaleDateString('tr-TR')}
                        {secilenMasaKayit.rezervasyon_tarihi_gunu ? ` (${secilenMasaKayit.rezervasyon_tarihi_gunu})` : ''}
                        {secilenMasaKayit.rezervasyon_saati ? ` · ${secilenMasaKayit.rezervasyon_saati}` : ''}
                      </p>
                    )}
                    {!secilenMasaKayit.isim && !secilenMasaKayit.telefon_numarasi && !secilenMasaKayit.rezervasyon_tarihi && (
                      <p className="text-stone-400 text-xs">Detay girilmemiş — sadece dolu işaretlenmiş.</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditRezervasyon(secilenMasaKayit)}
                      className="flex-1 bg-amber-700 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-xs tracking-wider transition-all"
                    >
                      Düzenle
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBosaltVeKapat(secilenMasaKayit)}
                      className="flex-1 bg-red-900/60 hover:bg-red-800 text-red-200 font-bold py-2.5 rounded-xl text-xs tracking-wider transition-all border border-red-800/50"
                    >
                      Masayı Boşalt
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={kapatAdminModal}
                    className="w-full text-center text-xs text-stone-400 hover:text-stone-200 py-1 transition-colors"
                  >
                    Kapat
                  </button>
                </div>
              )}

              {/* FORM GÖRÜNÜMÜ: masa boşsa doğrudan, doluysa "Düzenle"ye basılınca açılır */}
              {(!secilenMasaKayit?.durum || editingRezervasyonKisaltma === secilenMasaAdmin.kisaltma) && (
                <form onSubmit={handleRezervasyonSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-300 mb-1">
                        Tarih
                      </label>
                      <input
                        type="date"
                        value={rezTarih}
                        onChange={(e) => setRezTarih(e.target.value)}
                        className="w-full bg-[#1e100a] border border-amber-900/50 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-300 mb-1">
                        Saat
                      </label>
                      <input
                        type="time"
                        value={rezSaat}
                        onChange={(e) => setRezSaat(e.target.value)}
                        className="w-full bg-[#1e100a] border border-amber-900/50 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-600"
                      />
                    </div>
                  </div>
                  {rezTarih && (
                    <p className="text-[11px] font-semibold text-amber-400">
                      {rezGunHesapla(rezTarih)} günü olarak kaydedilecek
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-300 mb-1">
                        Ad
                      </label>
                      <input
                        type="text"
                        value={rezIsim}
                        onChange={(e) => setRezIsim(e.target.value)}
                        className="w-full bg-[#1e100a] border border-amber-900/50 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-300 mb-1">
                        Soyad
                      </label>
                      <input
                        type="text"
                        value={rezSoyisim}
                        onChange={(e) => setRezSoyisim(e.target.value)}
                        className="w-full bg-[#1e100a] border border-amber-900/50 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-300 mb-1">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={rezTelefon}
                      onChange={(e) => setRezTelefon(e.target.value)}
                      placeholder="05xx xxx xx xx"
                      className="w-full bg-[#1e100a] border border-amber-900/50 rounded-xl px-3 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-300 mb-1">
                      Kişi Sayısı
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={rezKacKisi}
                      onChange={(e) => setRezKacKisi(e.target.value)}
                      className="w-full bg-[#1e100a] border border-amber-900/50 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-stone-300 cursor-pointer bg-[#1e100a] border border-amber-900/50 rounded-xl px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={rezDurum}
                      onChange={(e) => setRezDurum(e.target.checked)}
                      className="w-4 h-4 accent-amber-600 rounded bg-[#1e100a] border-amber-900"
                    />
                    MASA DOLU (rezervasyon aktif)
                  </label>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={rezSubmitting}
                      className="flex-1 bg-amber-700 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-xs tracking-wider transition-all shadow-lg disabled:opacity-55"
                    >
                      {rezSubmitting ? 'KAYDEDİLİYOR...' : secilenMasaKayit?.durum ? 'GÜNCELLE' : 'DOLU OLARAK KAYDET'}
                    </button>
                    <button
                      type="button"
                      onClick={secilenMasaKayit?.durum ? handleCancelRezervasyonEdit : kapatAdminModal}
                      className="bg-stone-700 hover:bg-stone-600 text-stone-200 px-4 py-2.5 rounded-xl text-xs font-bold"
                    >
                      {secilenMasaKayit?.durum ? 'Vazgeç' : 'İptal'}
                    </button>
                  </div>

                  {/* Bilgi girmeden, tek tuşla masayı kapat — sadece boş bir masa dolduruluyorken
                      gösterilir (zaten dolu bir masa düzenlenirken anlamsız). */}
                  {!secilenMasaKayit?.durum && (
                    <button
                      type="button"
                      onClick={handleSadeceKapat}
                      disabled={rezSubmitting}
                      className="w-full border border-amber-800/50 text-amber-300 hover:bg-amber-900/30 font-bold py-2.5 rounded-xl text-xs tracking-wider transition-all disabled:opacity-55"
                    >
                      Bilgi Girmeden Sadece Masayı Kapat
                    </button>
                  )}
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}