'use client';

import { useState } from 'react';
import { Sidebar, Header } from '@/components/layout';
import { ProtectedRoute } from '@/components/auth';
import { useSettings } from '@/hooks/useSupabase';
import type { Settings } from '@/types/block';

export default function SettingsPage() {
  const { settings, loading, updateSettings } = useSettings();
  const [formData, setFormData] = useState<Partial<Settings>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Initialize form when settings load
  const currentValues = {
    density_ton_per_m3: formData.density_ton_per_m3 ?? settings.density_ton_per_m3,
    target_net_m2_per_m3: formData.target_net_m2_per_m3 ?? settings.target_net_m2_per_m3,
    currency: formData.currency ?? settings.currency,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    
    try {
      await updateSettings(currentValues);
      setSuccess(true);
      setFormData({});
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Ayarlar kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-marble-300 rounded-lg focus:ring-2 focus:ring-marble-500 focus:border-marble-500';

  return (
    <ProtectedRoute>
    <div className="flex min-h-screen bg-marble-50">
      <Sidebar />
      
      <main className="flex-1">
        <Header 
          title="Ayarlar" 
          subtitle="Sistem parametrelerini düzenleyin"
        />
        
        <div className="p-6 max-w-2xl">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-marble-500">Yükleniyor...</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Success Message */}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4">
                  ✅ Ayarlar başarıyla kaydedildi!
                </div>
              )}

              {/* General Settings */}
              <section className="bg-white rounded-lg border border-marble-200 p-6">
                <h2 className="text-lg font-semibold text-marble-800 mb-4">Genel Ayarlar</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-marble-700 mb-1">
                      Para Birimi
                    </label>
                    <select
                      value={currentValues.currency}
                      onChange={e => setFormData(prev => ({ ...prev, currency: e.target.value as 'USD' | 'EUR' | 'TRY' }))}
                      className={inputClass}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="TRY">TRY (₺)</option>
                    </select>
                    <p className="text-xs text-marble-500 mt-1">
                      Tüm maliyet hesaplamalarında kullanılacak para birimi
                    </p>
                  </div>
                </div>
              </section>

              {/* Calculation Parameters */}
              <section className="bg-white rounded-lg border border-marble-200 p-6">
                <h2 className="text-lg font-semibold text-marble-800 mb-4">Hesaplama Parametreleri</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-marble-700 mb-1">
                      Yoğunluk (ton/m³)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentValues.density_ton_per_m3 || ''}
                      onChange={e => setFormData(prev => ({ 
                        ...prev, 
                        density_ton_per_m3: parseFloat(e.target.value) || 0 
                      }))}
                      className={inputClass}
                    />
                    <p className="text-xs text-marble-500 mt-1">
                      Mermer/taş yoğunluğu. Ağırlık hesabında kullanılır: Ton = m³ × Yoğunluk
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-marble-700 mb-1">
                      Hedef Net m²/m³ (Opsiyonel)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentValues.target_net_m2_per_m3 ?? ''}
                      onChange={e => setFormData(prev => ({ 
                        ...prev, 
                        target_net_m2_per_m3: e.target.value ? parseFloat(e.target.value) : null 
                      }))}
                      className={inputClass}
                      placeholder="Örn: 18.5"
                    />
                    <p className="text-xs text-marble-500 mt-1">
                      Verim hedefi. Bu değer girilirse, blok bazında sapma analizi yapılabilir.
                    </p>
                  </div>
                </div>
              </section>

              {/* Info Box */}
              <section className="bg-marble-100 rounded-lg border border-marble-200 p-6">
                <h3 className="text-sm font-semibold text-marble-800 mb-2">📊 Mevcut Değerler</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-marble-500">Para Birimi:</span>
                    <span className="ml-2 font-medium">{settings.currency}</span>
                  </div>
                  <div>
                    <span className="text-marble-500">Yoğunluk:</span>
                    <span className="ml-2 font-medium">{settings.density_ton_per_m3} ton/m³</span>
                  </div>
                  <div>
                    <span className="text-marble-500">Hedef Net m²/m³:</span>
                    <span className="ml-2 font-medium">
                      {settings.target_net_m2_per_m3 !== null ? settings.target_net_m2_per_m3 : 'Tanımlı değil'}
                    </span>
                  </div>
                </div>
              </section>

              {/* Submit */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-marble-800 text-white rounded-lg hover:bg-marble-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {saving ? 'Kaydediliyor...' : '✓ Ayarları Kaydet'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}
