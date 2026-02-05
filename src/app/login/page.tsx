'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

type AuthMode = 'login' | 'signup';

export default function LoginPage() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();

  // Form state
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Redirect to home if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Login failed:', err);
      setError('Google ile giriş yapılırken hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const result = await signInWithEmail(email, password);
        if (!result.success) {
          setError(result.error || 'Giriş yapılırken bir hata oluştu.');
        }
        // If successful, useEffect will handle redirect
      } else {
        const result = await signUpWithEmail(email, password);
        if (!result.success) {
          setError(result.error || 'Kayıt olurken bir hata oluştu.');
        } else if (result.needsEmailConfirmation) {
          setSuccessMessage(
            '✅ Kayıt başarılı! Lütfen e-posta adresinize gelen onay linkine tıklayın. ' +
            'Spam klasörünüzü de kontrol etmeyi unutmayın.'
          );
          // Clear form
          setEmail('');
          setPassword('');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'signup' : 'login');
    setError(null);
    setSuccessMessage(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-marble-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-marble-800"></div>
      </div>
    );
  }

  // If already logged in, show nothing (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-marble-100 to-marble-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-marble-800 rounded-2xl mb-4">
            <span className="text-3xl">🧱</span>
          </div>
          <h1 className="text-2xl font-bold text-marble-900">Marble Analyst</h1>
          <p className="text-marble-600 mt-2">Blok Takip Sistemi</p>
        </div>

        {/* Login/Signup Card */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-marble-800">
              {mode === 'login' ? 'Hoş Geldiniz' : 'Hesap Oluşturun'}
            </h2>
            <p className="text-marble-500 text-sm mt-1">
              {mode === 'login' 
                ? 'Devam etmek için giriş yapın' 
                : 'Yeni bir hesap oluşturun'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              ❌ {error}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
              {successMessage}
            </div>
          )}

          {/* Email Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-marble-700 mb-1">
                E-posta Adresi
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                required
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-marble-300 rounded-lg focus:ring-2 focus:ring-marble-500 focus:border-marble-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-marble-700 mb-1">
                Şifre
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'En az 6 karakter' : '••••••••'}
                required
                minLength={6}
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-marble-300 rounded-lg focus:ring-2 focus:ring-marble-500 focus:border-marble-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-marble-800 text-white rounded-lg hover:bg-marble-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSubmitting 
                ? 'İşleniyor...' 
                : mode === 'login' 
                  ? 'Giriş Yap' 
                  : 'Kayıt Ol'}
            </button>
          </form>

          {/* Mode Toggle */}
          <div className="text-center">
            <button
              type="button"
              onClick={toggleMode}
              disabled={isSubmitting}
              className="text-marble-600 hover:text-marble-800 text-sm font-medium disabled:opacity-50"
            >
              {mode === 'login' 
                ? 'Hesabınız yok mu? Kayıt olun' 
                : 'Zaten hesabınız var mı? Giriş yapın'}
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-marble-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-marble-500">veya</span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-marble-300 rounded-lg hover:bg-marble-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-marble-700 font-medium">Google ile Devam Et</span>
          </button>

          {/* Info */}
          <div className="text-center text-xs text-marble-400 pt-4 border-t border-marble-100">
            <p>
              Giriş yaparak, verilerinizin güvenli bir şekilde
              <br />
              saklanacağını kabul etmiş olursunuz.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-center text-xs text-marble-400">
        © 2026 Marble Analyst • Tüm hakları saklıdır
      </div>
    </div>
  );
}
