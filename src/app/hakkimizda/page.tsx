import Image from 'next/image'
import Link from 'next/link'
import { Search, Menu as MenuIcon, Phone, Info, Home, Coffee, UtensilsCrossed, Heart, ArrowRight } from 'lucide-react'

export default function HakkimizdaPage() {
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
              <Link href="/hakkimizda" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-700/40 text-amber-100 transition-colors">
                <Info className="w-4 h-4 text-amber-400" /> HAKKIMIZDA
              </Link>
              <Link href="/#iletisim" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-amber-900/40 text-stone-300 hover:text-amber-100 transition-colors">
                <Phone className="w-4 h-4 text-amber-500" /> İLETİŞİM
              </Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative h-[300px] md:h-[420px] w-full overflow-hidden bg-[#2c1810]">
          <Image
            src="/hakkimizda/masa-lezzetler.webp"
            alt="Taşeli Sosyal Tesisleri'nde sofra"
            fill
            className="object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c0f0a] via-[#2c1810]/70 to-[#2c1810]/30" />
          <div className="relative z-10 h-full max-w-4xl mx-auto px-4 flex flex-col items-center justify-center text-center gap-4">
            <span className="text-[11px] tracking-[0.3em] font-semibold text-amber-500 uppercase">Hikayemiz</span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-amber-100 tracking-tight">Hakkımızda</h1>
            <p className="text-amber-100/90 text-sm md:text-base max-w-2xl leading-relaxed">
              Toroslar&apos;ın eteklerinde, Sarıveliler&apos;in kalbinde; misafirlerimizi bir ev sofrasının
              sıcaklığıyla ağırlıyoruz.
            </p>
          </div>
        </section>

        {/* Bizim Hikayemiz */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-amber-800"></div>
                <h2 className="text-xl font-bold text-stone-800">Bizim Hikayemiz</h2>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed mb-4">
                Taşeli Sosyal Tesisleri, 20 Aralık 2024 tarihinde Sarıveliler Belediye Başkanlığı tarafından,
                ilçemize gelen misafirleri en güzel şekilde ağırlamak ve Sarıveliler&apos;in gelişimine katkı
                sağlamak amacıyla hizmete açıldı.
              </p>
              <p className="text-sm text-stone-600 leading-relaxed">
                Bugün kahvaltıdan akşam yemeğine, sıcak çorbalardan ev yapımı tatlılara kadar geniş bir lezzet
                yelpazesiyle; hem Sarıveliler halkına hem de ilçemizi ziyarete gelen tüm misafirlerimize
                kapılarımızı açık tutuyoruz.
              </p>
            </div>
            <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-md border border-stone-200 bg-stone-100">
              <Image
                src="/hakkimizda/disaridan-gunduz.webp"
                alt="Taşeli Sosyal Tesisleri dış cephe"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* Neler Sunuyoruz */}
        <section className="bg-white border-y border-stone-200">
          <div className="max-w-5xl mx-auto px-4 py-16">
            <div className="flex items-center gap-2 mb-10 justify-center">
              <div className="w-3 h-3 rounded-full bg-amber-800"></div>
              <h2 className="text-xl font-bold text-stone-800">Neler Sunuyoruz</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center px-4">
                <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                  <Coffee className="w-6 h-6 text-amber-700" />
                </div>
                <h3 className="font-bold text-stone-800 mb-2">Zengin Kahvaltı</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Serpme kahvaltıdan tek kişilik menülere, günün her saatinde taze ve doyurucu kahvaltı
                  seçenekleri.
                </p>
              </div>
              <div className="text-center px-4">
                <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                  <UtensilsCrossed className="w-6 h-6 text-amber-700" />
                </div>
                <h3 className="font-bold text-stone-800 mb-2">Ev Sofrası Lezzetleri</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Çorbalardan ana yemeklere, makarnalardan burgerlere; her damak zevkine uygun geniş bir menü.
                </p>
              </div>
              <div className="text-center px-4">
                <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-amber-700" />
                </div>
                <h3 className="font-bold text-stone-800 mb-2">Sıcak Bir Ağırlama</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Sarıveliler&apos;in misafirperverliğini yansıtan, samimi ve huzurlu bir ortamda hizmet.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bizden Kareler */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <div className="w-3 h-3 rounded-full bg-amber-800"></div>
            <h2 className="text-xl font-bold text-stone-800">Bizden Kareler</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="relative h-44 md:h-56 rounded-xl overflow-hidden border border-stone-200 shadow-sm group">
              <Image
                src="/hakkimizda/disaridan-gunduz.webp"
                alt="Taşeli Sosyal Tesisleri - dış cephe, gündüz"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="relative h-44 md:h-56 rounded-xl overflow-hidden border border-stone-200 shadow-sm group">
              <Image
                src="/hakkimizda/disaridan-gece.jpg"
                alt="Taşeli Sosyal Tesisleri - dış cephe, gece"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="relative h-44 md:h-56 rounded-xl overflow-hidden border border-stone-200 shadow-sm group">
              <Image
                src="/hakkimizda/ic-mekan.jpg"
                alt="Taşeli Sosyal Tesisleri - iç mekan"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="relative h-44 md:h-56 rounded-xl overflow-hidden border border-stone-200 shadow-sm group">
              <Image
                src="/hakkimizda/masa-lezzetler.webp"
                alt="Taşeli Sosyal Tesisleri - lezzetlerimiz"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </section>

        {/* Kapanış CTA */}
        <section className="bg-[#2c1810]">
          <div className="max-w-3xl mx-auto px-4 py-16 text-center">
            <h2 className="text-2xl font-bold text-amber-100 mb-3">Sizi Ağırlamaktan Mutluluk Duyarız</h2>
            <p className="text-sm text-stone-300 mb-8 leading-relaxed">
              Taşeli Sosyal Tesisleri&apos;nde hazırladığımız lezzetlere göz atın, sıradaki ziyaretinizde sizi
              de sofralarımızda ağırlamaktan mutluluk duyarız.
            </p>
            <Link
              href="/#urun-listesi"
              className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-xl text-sm tracking-wide transition-all shadow-lg"
            >
              Menümüzü İnceleyin <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>

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
