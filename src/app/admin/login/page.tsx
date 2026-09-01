'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [lockoutTimer, setLockoutTimer] = useState<number>(0)

  const identifier = 'global_admin_attempt'
  const router = useRouter()

  useEffect(() => {
    async function checkLockout() {
      const { data } = await supabase
        .from('admin_rate_limits')
        .select('*')
        .eq('identifier', identifier)
        .single()

      if (data && data.locked_until) {
        const remainingTime = new Date(data.locked_until).getTime() - new Date().getTime()
        if (remainingTime > 0) {
          setLockoutTimer(Math.ceil(remainingTime / 1000))
        } else {
          await supabase.from('admin_rate_limits').delete().eq('identifier', identifier)
        }
      }
    }
    checkLockout()
  }, [])

  useEffect(() => {
    if (lockoutTimer <= 0) return
    const interval = setInterval(() => {
      setLockoutTimer((prev) => {
        if (prev <= 1) {
          supabase.from('admin_rate_limits').delete().eq('identifier', identifier).then()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [lockoutTimer])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (lockoutTimer > 0) return

    setLoading(true)
    setErrorMsg('')

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // Sadece belirli yönetici e-postasının girmesine izin ver. Bu kontrol artık
    // giriş denemesiyle birlikte, hatalı deneme sayacına dahil olacak şekilde yapılıyor.
    const isAdmin = !authError && !!authData.user && authData.user.email === 'yonetici@taselisosyal.com'

    if (!isAdmin) {
      // Şifre doğru ama yönetici e-postası değilse açılan oturumu kapat
      if (!authError && authData.user) {
        await supabase.auth.signOut()
      }

      const { data: currentData } = await supabase
        .from('admin_rate_limits')
        .select('*')
        .eq('identifier', identifier)
        .single()

      let attempts = currentData ? currentData.failed_attempts + 1 : 1

      if (attempts >= 5) {
        const lockUntil = new Date(new Date().getTime() + 3 * 60 * 1000).toISOString()
        await supabase.from('admin_rate_limits').upsert({
          identifier,
          failed_attempts: attempts,
          locked_until: lockUntil,
        })
        setLockoutTimer(180)
        setErrorMsg('Çok fazla hatalı giriş yapıldı. Güvenlik nedeniyle 3 dakika süreyle kilitlendiniz.')
      } else {
        await supabase.from('admin_rate_limits').upsert({
          identifier,
          failed_attempts: attempts,
        })
        setErrorMsg(
          authError || !authData.user
            ? `Hatalı e-posta veya şifre! Kalan hak: ${5 - attempts}`
            : 'Bu alana sadece yetkili ana yönetici girebilir.'
        )
      }
      setLoading(false)
      return
    }

    // Başarılı girişte veritabanındaki hatalı deneme / kilit kaydını tamamen sil/sıfırla
    await supabase.from('admin_rate_limits').delete().eq('identifier', identifier)

    router.push('/admin')
  }

  return (
    <div className="min-h-screen bg-[#2c1810] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-500 hover:text-amber-400 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
        </Link>

        <div className="bg-[#3b2216] border border-amber-900/40 rounded-2xl p-8 shadow-2xl text-stone-200">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-amber-700/30 rounded-full flex items-center justify-center mx-auto mb-3 border border-amber-600/40">
            <Lock className="w-6 h-6 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-amber-100">Yönetim Paneli Girişi</h1>
          <p className="text-xs text-stone-400 mt-1">Taşeli Sosyal Tesisleri Güvenli Alanı</p>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-950/60 border border-red-800 text-red-200 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {lockoutTimer > 0 ? (
          <div className="text-center py-6 bg-amber-950/40 border border-amber-800/50 rounded-xl">
            <p className="text-sm font-semibold text-amber-200 mb-1">Hesap Geçici Olarak Kilitlendi</p>
            <p className="text-2xl font-mono font-bold text-amber-500">
              {Math.floor(lockoutTimer / 60)}:{('0' + (lockoutTimer % 60)).slice(-2)}
            </p>
            <p className="text-xs text-stone-400 mt-2">Lütfen sayaç bitimini bekleyin.</p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1 uppercase tracking-wider">E-Posta Adresi</label>
              <div className="relative">
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@taselisosyal.com"
                  className="w-full bg-[#1e100a] border border-amber-900/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-600"
                />
                <Mail className="absolute left-3 top-3 w-4 h-4 text-stone-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1 uppercase tracking-wider">Şifre</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#1e100a] border border-amber-900/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-600"
                />
                <Lock className="absolute left-3 top-3 w-4 h-4 text-stone-500" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-700 hover:bg-amber-600 text-white font-medium py-2.5 rounded-xl transition-all shadow-lg text-sm mt-2 disabled:opacity-50"
            >
              {loading ? 'Giriş Yapılıyor...' : 'Güvenli Giriş Yap'}
            </button>
          </form>
        )}
        </div>
      </div>
    </div>
  )
}