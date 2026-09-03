import Image from 'next/image'
import Link from 'next/link'
import { Search, Menu as MenuIcon, Phone, Info, Home, CalendarCheck, ShieldCheck } from 'lucide-react'

export const metadata = {
  title: 'KVKK Aydınlatma Metni ve Gizlilik Politikası | Taşeli Sosyal Tesisleri',
  description:
    'Taşeli Sosyal Tesisleri rezervasyon sisteminde işlenen kişisel verileriniz, hangi amaçla kullanıldığı, ne kadar süre saklandığı ve KVKK kapsamındaki haklarınız.',
}

const BOLUMLER = [
  {
    no: '01',
    baslik: 'Veri Sorumlusu',
    icerik: (
      <>
        <p>
          6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca kişisel verileriniz; veri
          sorumlusu sıfatıyla <strong>Taşeli Sosyal Tesisleri</strong> (&quot;Tesis&quot;, &quot;biz&quot;)
          tarafından, işbu aydınlatma metninde açıklanan amaç ve kapsamda işlenmektedir.
        </p>
        <p className="mt-3 rounded-lg border border-[#e3cda1] bg-[#f5ead8]/70 px-3.5 py-2.5 text-[13px] text-[#6b4226]">
          Tesisin tam ticari unvanı, açık adresi ve vergi/MERSİS numarası bu bölüme eklenerek metin
          tamamlanmalıdır — güncel bilgiler için işletme yetkilisine danışın.
        </p>
        <p className="mt-3">
          Bize aşağıdaki kanallardan ulaşabilirsiniz: WhatsApp{' '}
          <a href="https://wa.me/905392247570" className="font-semibold text-amber-800 underline">
            0539 224 75 70
          </a>
          , Instagram{' '}
          <a
            href="https://instagram.com/taselisosyaltesisi"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-amber-800 underline"
          >
            @taselisosyaltesisi
          </a>{' '}
          veya Facebook üzerinden Taşeli Sosyal Tesisleri sayfamız.
        </p>
      </>
    ),
  },
  {
    no: '02',
    baslik: 'Hangi Kişisel Verileriniz İşleniyor',
    icerik: (
      <>
        <p>Online masa rezervasyonu formunu doldurduğunuzda aşağıdaki kişisel verileriniz tarafımızca işlenir:</p>
        <ul className="mt-3 space-y-2 text-[#4a3520]">
          <li>
            <strong className="text-[#3b2216]">Kimlik bilgisi:</strong> Ad, soyad
          </li>
          <li>
            <strong className="text-[#3b2216]">İletişim bilgisi:</strong> Telefon numarası
          </li>
          <li>
            <strong className="text-[#3b2216]">Rezervasyon detayları:</strong> seçtiğiniz masa, rezervasyon tarihi
            ve saati, kişi sayısı
          </li>
          <li>
            <strong className="text-[#3b2216]">İşlem kaydı:</strong> talebin oluşturulma zamanı ve bu aydınlatma
            metnini onayladığınız tarih/saat
          </li>
        </ul>
        <p className="mt-3">
          Sitemiz üzerinden herhangi bir ödeme veya kart bilgisi alınmaz; rezervasyon tamamen ücretsiz bir talep
          sistemidir.
        </p>
      </>
    ),
  },
  {
    no: '03',
    baslik: 'Verileriniz Nerede ve Hangi Amaçla Kullanılıyor',
    icerik: (
      <ul className="space-y-2 text-[#4a3520]">
        <li>Rezervasyon talebinizin oluşturulması ve tesis yönetimi tarafından değerlendirilip onaylanması</li>
        <li>Rezervasyonunuzla ilgili WhatsApp üzerinden sizinle iletişime geçilmesi (onay, hatırlatma, değişiklik)</li>
        <li>Masa/kapasite planlamasının yapılması ve hizmet kalitesinin sürdürülmesi</li>
        <li>Yasal yükümlülüklerin yerine getirilmesi ve olası uyuşmazlıklarda ispat aracı olarak kullanılması</li>
        <li className="font-semibold text-[#3b2216]">
          Verileriniz hiçbir şekilde reklam, pazarlama ya da üçüncü taraflara satış amacıyla kullanılmaz.
        </li>
      </ul>
    ),
  },
  {
    no: '04',
    baslik: 'İşlemenin Hukuki Sebebi',
    icerik: (
      <p>
        KVKK madde 5 kapsamında kişisel verileriniz; rezervasyon formundaki onay kutusunu işaretlemeniz yoluyla
        verdiğiniz <strong className="text-[#3b2216]">açık rızanız</strong> ile, ayrıca talep ettiğiniz{' '}
        <strong className="text-[#3b2216]">rezervasyon hizmetinin kurulması ve ifasıyla doğrudan doğruya
        ilgili olması</strong> hukuki sebebine dayanılarak işlenmektedir.
      </p>
    ),
  },
  {
    no: '05',
    baslik: 'Verileriniz Ne Kadar Süre Saklanıyor',
    icerik: (
      <>
        <p>
          Rezervasyon verileriniz, rezervasyon tarihinizden itibaren <strong className="text-[#3b2216]">en fazla
          1 (bir) yıl</strong> süreyle bulut veritabanımızda (Supabase) saklanır. Bu sürenin sonunda verileriniz
          silinir ya da geri döndürülemez şekilde anonim hale getirilir.
        </p>
        <p className="mt-3">
          Aramızda bir uyuşmazlık bulunması veya kanunen daha uzun süre saklama zorunluluğu doğması hâlinde bu
          süre, zorunlu olduğu ölçüde uzayabilir.
        </p>
      </>
    ),
  },
  {
    no: '06',
    baslik: 'Verileriniz Kimlerle Paylaşılıyor',
    icerik: (
      <ul className="space-y-2 text-[#4a3520]">
        <li>Rezervasyon işlemlerini yürüten, yalnızca yetkilendirilmiş yönetici hesabıyla erişebilen tesis personeli</li>
        <li>Verilerin barındırıldığı bulut altyapı sağlayıcısı (Supabase) — veri işleyen sıfatıyla, teknik altyapı hizmeti kapsamında</li>
        <li>
          &quot;WhatsApp&apos;tan Bilgilendir&quot; butonuna bastığınızda kendi tercihinizle ilettiğiniz mesaj
          içeriği için WhatsApp (Meta Platforms Inc.)
        </li>
        <li>Yasal olarak yetkili kamu kurum ve kuruluşları, yalnızca kanunen zorunlu hâllerde</li>
      </ul>
    ),
  },
  {
    no: '07',
    baslik: 'Veri Güvenliği',
    icerik: (
      <ul className="space-y-2 text-[#4a3520]">
        <li>Rezervasyon verileri, satır bazlı erişim politikaları (RLS) ile korunan bir veritabanında saklanır</li>
        <li>Verilerinizi yalnızca kimlik doğrulamasından geçmiş, yetkilendirilmiş yönetici hesabı görüntüleyip düzenleyebilir</li>
        <li>Site trafiği uçtan uca HTTPS ile şifrelenir</li>
      </ul>
    ),
  },
  {
    no: '08',
    baslik: 'KVKK Kapsamındaki Haklarınız',
    icerik: (
      <>
        <p>KVKK&apos;nın 11. maddesi uyarınca bize başvurarak:</p>
        <ul className="mt-3 space-y-1.5 text-[#4a3520]">
          <li>kişisel verinizin işlenip işlenmediğini öğrenme,</li>
          <li>işlenmişse buna ilişkin bilgi talep etme,</li>
          <li>işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
          <li>yurt içinde/yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
          <li>eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
          <li>KVKK madde 7&apos;deki şartlar oluştuğunda silinmesini veya yok edilmesini isteme,</li>
          <li>yapılan düzeltme/silme işlemlerinin verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme,</li>
          <li>münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhinize bir sonuç çıkmasına itiraz etme,</li>
          <li>kanuna aykırı işlenme nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
        </ul>
        <p className="mt-3">
          haklarına sahipsiniz. Bu haklarınızı kullanmak için WhatsApp (0539 224 75 70) üzerinden bize
          ulaşabilirsiniz; talebiniz en kısa sürede ve en geç 30 gün içinde sonuçlandırılır.
        </p>
      </>
    ),
  },
  {
    no: '09',
    baslik: 'Çerezler',
    icerik: (
      <p>
        Sitemiz şu an üçüncü taraf reklam veya izleme çerezi kullanmamaktadır. Rezervasyon formunda girdiğiniz
        bilgiler yalnızca veritabanımıza iletilir; tarayıcınızda kalıcı bir izleme çerezi oluşturulmaz.
      </p>
    ),
  },
  {
    no: '10',
    baslik: 'Değişiklikler',
    icerik: (
      <p>
        Bu metin, yasal gereklilikler ya da hizmetlerimizdeki değişiklikler doğrultusunda güncellenebilir. Güncel
        sürüm her zaman bu sayfada yayınlanır.
      </p>
    ),
  },
]

export default function GizlilikPolitikasiPage() {
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
              <Link href="/rezervasyon" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-amber-900/40 text-stone-300 hover:text-amber-100 transition-colors">
                <CalendarCheck className="w-4 h-4 text-amber-500" /> REZERVASYON
              </Link>
              <Link href="/#iletisim" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-amber-900/40 text-stone-300 hover:text-amber-100 transition-colors">
                <Phone className="w-4 h-4 text-amber-500" /> İLETİŞİM
              </Link>
            </div>
          </div>
        </header>

        {/* İçerik */}
        <section className="max-w-3xl mx-auto px-4 py-10">
          <div className="mb-8 flex items-start gap-3">
            <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-800/10 text-amber-800">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-stone-800 leading-tight">
                KVKK Aydınlatma Metni ve Gizlilik Politikası
              </h1>
              <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                Bu sayfa, web sitemiz üzerinden yaptığınız masa rezervasyonu sırasında paylaştığınız kişisel
                verilerin 6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında nasıl,
                nerede, ne kadar süre ve hangi amaçla işlendiğini açıklar.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {BOLUMLER.map((b) => (
              <div
                key={b.no}
                className="rounded-2xl border border-[#e3d3ae] bg-[#fdf8ef] p-5 md:p-6 shadow-sm"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-800 text-[11px] font-bold text-white">
                    {b.no}
                  </span>
                  <h2 className="text-base md:text-lg font-bold text-[#2c1810]">{b.baslik}</h2>
                </div>
                <div className="pl-10 text-sm leading-relaxed text-[#4a3520]">{b.icerik}</div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-[11px] italic leading-relaxed text-stone-400">
            Bu metin genel bilgilendirme amaçlıdır ve hukuki danışmanlık yerine geçmez; işletmenize tam uyum için
            bir hukuk danışmanına başvurmanızı öneririz.
          </p>
        </section>
      </div>

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
