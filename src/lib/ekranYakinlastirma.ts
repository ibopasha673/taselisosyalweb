// Mobilde ziyaretçi genelde krokiyi görebilmek için parmakla yakınlaştırıyor
// (pinch-zoom) ve o haldeyken masaya/forma dokunuyor. Mobil tarayıcılarda hem
// pinch-zoom hem de bir input'a odaklanma (iOS Safari, input font boyutu
// 16px'in altındaysa otomatik yakınlaştırır) fixed pozisyonlu panelleri ve
// formu ekranın dışına taşırıp kırpabiliyor. Bunu düzeltmek için viewport meta
// etiketini anlık olarak "user-scalable=no" yapıp tarayıcıyı 1x ölçeğe
// döndürüyoruz, sonra eski haline (tekrar parmakla yakınlaştırılabilir
// şekilde) geri alıyoruz. Masaya tıklarken (RezervasyonKrokisi) ve rezervasyon
// formundaki her alana odaklanırken (rezervasyon/page.tsx) çağrılıyor.
export function ekranYakinlastirmasiniSifirla() {
  if (typeof document === 'undefined') return
  const viewport = document.querySelector('meta[name="viewport"]')
  if (!viewport) return
  const onceki = viewport.getAttribute('content') ?? 'width=device-width, initial-scale=1'
  viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
  window.setTimeout(() => {
    viewport.setAttribute('content', onceki)
  }, 350)
}
