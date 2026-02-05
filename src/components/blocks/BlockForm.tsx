'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Block, BlockStatus, Settings } from '@/types/block';
import { computeBlockDerived } from '@/utils/costEngine';
import { formatCurrency, formatNumber } from '@/utils/formatters';

// =============================================================================
// Types
// =============================================================================

export interface BlockFormData {
  meta: Block['meta'];
  process: Block['process'];
  dimensions: Block['dimensions'];
  production: Block['production'];
  costs: Block['costs'];
}

export interface BlockFormProps {
  initialData?: Block;
  settings: Settings;
  onSubmit: (data: BlockFormData) => Promise<void>;
  mode: 'create' | 'edit';
}

export interface ValidationError {
  field: string;
  message: string;
}

// =============================================================================
// Empty Block Template
// =============================================================================

export const emptyBlockData: BlockFormData = {
  meta: {
    source: '',
    arrival_date: new Date().toISOString().split('T')[0],
    supplier: '',
    stone_name: '',
    subcontractor_code: null,
    note: null,
    status: 'stokta' as BlockStatus,
    exit_date: null,
  },
  process: {
    operation: null,
    operation_date: null,
  },
  dimensions: {
    width_cm: 0,
    length_cm: 0,
    height_cm: 0,
  },
  production: {
    katrak: { thickness_cm: 0, width_cm: 0, length_cm: 0, qty: 0 },
    silim: { thickness_cm: 0, width_cm: 0, length_cm: 0, qty: 0 },
    scrap_m2: 0,
    planned_m2: 0,
  },
  costs: {
    block_price_per_m3: 0,
    block_price_per_ton: 0,
    freight_per_m3: 0,
    freight_per_ton: 0,
    material_per_m3: 0,
    material_per_ton: 0,
    cutting_per_ton: 0,
    bridge_cost: 0,
    surface_per_m2: { raw: 0, polished: 0, honed: 0, mesh: 0, brushed: 0, filled: 0 },
    packaging: { bundle: 0, crate: 0, pallet: 0 },
    product: null,
  },
};

// =============================================================================
// Validation Functions
// =============================================================================

function validateForm(data: BlockFormData, grossM2: number | null): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required fields
  if (!data.meta.stone_name?.trim()) {
    errors.push({ field: 'stone_name', message: 'Taş adı zorunludur' });
  }
  if (!data.meta.arrival_date) {
    errors.push({ field: 'arrival_date', message: 'Geliş tarihi zorunludur' });
  }

  // Negative value checks
  const numericFields: { path: string; label: string; value: number }[] = [
    { path: 'dimensions.width_cm', label: 'En', value: data.dimensions.width_cm },
    { path: 'dimensions.length_cm', label: 'Boy', value: data.dimensions.length_cm },
    { path: 'dimensions.height_cm', label: 'Yükseklik', value: data.dimensions.height_cm },
    { path: 'production.scrap_m2', label: 'Fire m²', value: data.production.scrap_m2 },
    { path: 'costs.block_price_per_m3', label: 'Blok fiyat/m³', value: data.costs.block_price_per_m3 },
    { path: 'costs.block_price_per_ton', label: 'Blok fiyat/ton', value: data.costs.block_price_per_ton },
    { path: 'costs.freight_per_m3', label: 'Nakliye/m³', value: data.costs.freight_per_m3 },
    { path: 'costs.freight_per_ton', label: 'Nakliye/ton', value: data.costs.freight_per_ton },
    { path: 'costs.cutting_per_ton', label: 'Kesim/ton', value: data.costs.cutting_per_ton },
    { path: 'costs.bridge_cost', label: 'Köprü kesim', value: data.costs.bridge_cost },
  ];

  for (const field of numericFields) {
    if (field.value < 0) {
      errors.push({ field: field.path, message: `${field.label} negatif olamaz` });
    }
  }

  // ⚠️ CRITICAL RULE: scrap_m2 <= gross_m2
  if (grossM2 !== null && data.production.scrap_m2 > grossM2) {
    errors.push({
      field: 'scrap_m2',
      message: `Fire m² (${data.production.scrap_m2.toFixed(2)}) brüt m²'den (${grossM2.toFixed(2)}) büyük olamaz`,
    });
  }

  // Date validation: exit_date >= arrival_date
  if (data.meta.exit_date && data.meta.arrival_date) {
    const arrival = new Date(data.meta.arrival_date);
    const exit = new Date(data.meta.exit_date);
    if (exit < arrival) {
      errors.push({ field: 'exit_date', message: 'Çıkış tarihi geliş tarihinden önce olamaz' });
    }
  }

  return errors;
}

// =============================================================================
// BlockForm Component
// =============================================================================

export function BlockForm({ initialData, settings, onSubmit, mode }: BlockFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<BlockFormData>(
    initialData
      ? {
          meta: initialData.meta,
          process: initialData.process,
          dimensions: initialData.dimensions,
          production: initialData.production,
          costs: initialData.costs,
        }
      : emptyBlockData
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  // Compute derived values for live preview
  const derived = useMemo(() => {
    const mockBlock = {
      id: '',
      created_at: '',
      updated_at: '',
      ...formData,
    } as Block;
    return computeBlockDerived(mockBlock, settings);
  }, [formData, settings]);

  // Validation check
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm(formData, derived.gross_m2);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setSaving(true);
    try {
      await onSubmit(formData);
    } catch {
      alert('Kaydetme sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  // Field error helper
  const getFieldError = (field: string): string | undefined => {
    return errors.find(e => e.field === field)?.message;
  };

  const inputClass = (field?: string) => {
    const base = 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-marble-500 focus:border-marble-500';
    const hasError = field && getFieldError(field);
    return hasError ? `${base} border-red-500 bg-red-50` : `${base} border-marble-300`;
  };

  // Update helpers
  const updateMeta = (field: string, value: string | null) => {
    setFormData(prev => ({ ...prev, meta: { ...prev.meta, [field]: value } }));
  };

  const updateDimensions = (field: string, value: number) => {
    setFormData(prev => ({ ...prev, dimensions: { ...prev.dimensions, [field]: value } }));
  };

  const updateKatrak = (field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      production: { ...prev.production, katrak: { ...prev.production.katrak, [field]: value } },
    }));
  };

  const updateSilim = (field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      production: { ...prev.production, silim: { ...prev.production.silim, [field]: value } },
    }));
  };

  const updateProduction = (field: string, value: number) => {
    setFormData(prev => ({ ...prev, production: { ...prev.production, [field]: value } }));
  };

  const updateCosts = (field: string, value: number) => {
    setFormData(prev => ({ ...prev, costs: { ...prev.costs, [field]: value } }));
  };

  const updateSurface = (field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      costs: { ...prev.costs, surface_per_m2: { ...prev.costs.surface_per_m2, [field]: value } },
    }));
  };

  const updatePackaging = (field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      costs: { ...prev.costs, packaging: { ...prev.costs.packaging, [field]: value } },
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 max-w-5xl">
      {/* Error Summary */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium mb-2">⚠️ Lütfen hataları düzeltin:</h3>
          <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
            {errors.map((err, i) => (
              <li key={i}>{err.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ========== SECTION 1: Blok Kimlik ========== */}
      <section className="bg-white rounded-lg border border-marble-200 p-6">
        <h2 className="text-lg font-semibold text-marble-800 mb-4">Blok Kimlik</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Taş Adı *</label>
            <input
              type="text"
              required
              value={formData.meta.stone_name}
              onChange={e => updateMeta('stone_name', e.target.value)}
              className={inputClass('stone_name')}
            />
            {getFieldError('stone_name') && <p className="text-red-600 text-xs mt-1">{getFieldError('stone_name')}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Kaynak</label>
            <input
              type="text"
              value={formData.meta.source}
              onChange={e => updateMeta('source', e.target.value)}
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Tedarikçi</label>
            <input
              type="text"
              value={formData.meta.supplier}
              onChange={e => updateMeta('supplier', e.target.value)}
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Geliş Tarihi *</label>
            <input
              type="date"
              required
              value={formData.meta.arrival_date}
              onChange={e => updateMeta('arrival_date', e.target.value)}
              className={inputClass('arrival_date')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Çıkış Tarihi</label>
            <input
              type="date"
              value={formData.meta.exit_date || ''}
              onChange={e => updateMeta('exit_date', e.target.value || null)}
              className={inputClass('exit_date')}
            />
            {getFieldError('exit_date') && <p className="text-red-600 text-xs mt-1">{getFieldError('exit_date')}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Durum</label>
            <select
              value={formData.meta.status}
              onChange={e => updateMeta('status', e.target.value)}
              className={inputClass()}
            >
              <option value="stokta">Stokta</option>
              <option value="islemde">İşlemde</option>
              <option value="satildi">Satıldı</option>
              <option value="iptal">İptal</option>
            </select>
          </div>
          <div className="col-span-2 md:col-span-3">
            <label className="block text-sm font-medium text-marble-700 mb-1">Not</label>
            <textarea
              value={formData.meta.note || ''}
              onChange={e => updateMeta('note', e.target.value || null)}
              rows={2}
              className={inputClass()}
            />
          </div>
        </div>
      </section>

      {/* ========== SECTION 2: Blok Ölçüleri + Live Preview ========== */}
      <section className="bg-white rounded-lg border border-marble-200 p-6">
        <h2 className="text-lg font-semibold text-marble-800 mb-4">Blok Ölçüleri (cm)</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">En (cm)</label>
            <input
              type="number"
              min="0"
              value={formData.dimensions.width_cm || ''}
              onChange={e => updateDimensions('width_cm', parseFloat(e.target.value) || 0)}
              className={inputClass('dimensions.width_cm')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Boy (cm)</label>
            <input
              type="number"
              min="0"
              value={formData.dimensions.length_cm || ''}
              onChange={e => updateDimensions('length_cm', parseFloat(e.target.value) || 0)}
              className={inputClass('dimensions.length_cm')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Yükseklik (cm)</label>
            <input
              type="number"
              min="0"
              value={formData.dimensions.height_cm || ''}
              onChange={e => updateDimensions('height_cm', parseFloat(e.target.value) || 0)}
              className={inputClass('dimensions.height_cm')}
            />
          </div>
        </div>
        {/* Live Preview */}
        <div className="bg-marble-50 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-marble-500">Hacim:</span>
            <span className="ml-2 font-medium">{formatNumber(derived.volume_m3)} m³</span>
          </div>
          <div>
            <span className="text-marble-500">Ağırlık:</span>
            <span className="ml-2 font-medium">{formatNumber(derived.weight_ton)} ton</span>
          </div>
        </div>
      </section>

      {/* ========== SECTION 3: Katrak Çıkışı ========== */}
      <section className="bg-white rounded-lg border border-marble-200 p-6">
        <h2 className="text-lg font-semibold text-marble-800 mb-4">Katrak Çıkışı</h2>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Kalınlık (cm)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={formData.production.katrak.thickness_cm || ''}
              onChange={e => updateKatrak('thickness_cm', parseFloat(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">En (cm)</label>
            <input
              type="number"
              min="0"
              value={formData.production.katrak.width_cm || ''}
              onChange={e => updateKatrak('width_cm', parseFloat(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Boy (cm)</label>
            <input
              type="number"
              min="0"
              value={formData.production.katrak.length_cm || ''}
              onChange={e => updateKatrak('length_cm', parseFloat(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Adet</label>
            <input
              type="number"
              min="0"
              value={formData.production.katrak.qty || ''}
              onChange={e => updateKatrak('qty', parseInt(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
        </div>
        <div className="bg-marble-50 rounded-lg p-4 text-sm">
          <span className="text-marble-500">Katrak m²:</span>
          <span className="ml-2 font-medium">{formatNumber(derived.katrak_m2)} m²</span>
        </div>
      </section>

      {/* ========== SECTION 4: Silim Çıkışı (Brüt m²) ========== */}
      <section className="bg-white rounded-lg border border-marble-200 p-6">
        <h2 className="text-lg font-semibold text-marble-800 mb-4">Silim Çıkışı (Brüt m²)</h2>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Kalınlık (cm)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={formData.production.silim.thickness_cm || ''}
              onChange={e => updateSilim('thickness_cm', parseFloat(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">En (cm)</label>
            <input
              type="number"
              min="0"
              value={formData.production.silim.width_cm || ''}
              onChange={e => updateSilim('width_cm', parseFloat(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Boy (cm)</label>
            <input
              type="number"
              min="0"
              value={formData.production.silim.length_cm || ''}
              onChange={e => updateSilim('length_cm', parseFloat(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Adet</label>
            <input
              type="number"
              min="0"
              value={formData.production.silim.qty || ''}
              onChange={e => updateSilim('qty', parseInt(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
        </div>
        <div className="bg-marble-50 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-marble-500">Brüt m²:</span>
            <span className="ml-2 font-medium text-lg">{formatNumber(derived.gross_m2)} m²</span>
          </div>
          <div>
            <span className="text-marble-500">m²/m³:</span>
            <span className="ml-2 font-medium">{formatNumber(derived.gross_m2_per_m3)}</span>
          </div>
        </div>
      </section>

      {/* ========== SECTION 5: Fire & Net Verim ========== */}
      <section className="bg-white rounded-lg border border-marble-200 p-6">
        <h2 className="text-lg font-semibold text-marble-800 mb-4">Fire & Net Verim</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Fire m²</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.production.scrap_m2 || ''}
              onChange={e => updateProduction('scrap_m2', parseFloat(e.target.value) || 0)}
              className={inputClass('scrap_m2')}
            />
            {getFieldError('scrap_m2') && <p className="text-red-600 text-xs mt-1">{getFieldError('scrap_m2')}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Planlanan m²</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.production.planned_m2 || ''}
              onChange={e => updateProduction('planned_m2', parseFloat(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
        </div>
        <div className="bg-marble-50 rounded-lg p-4 grid grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-marble-500">Net m²:</span>
            <span className="ml-2 font-medium text-lg">{formatNumber(derived.net_m2)} m²</span>
          </div>
          <div>
            <span className="text-marble-500">Net m²/m³:</span>
            <span className="ml-2 font-medium">{formatNumber(derived.net_m2_per_m3)}</span>
          </div>
          <div>
            <span className="text-marble-500">Fire %:</span>
            <span className="ml-2 font-medium">{derived.scrap_pct !== null ? `${(derived.scrap_pct * 100).toFixed(1)}%` : '-'}</span>
          </div>
          <div>
            <span className="text-marble-500">Sapma:</span>
            <span className={`ml-2 font-medium ${(derived.variance_m2 ?? 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {derived.variance_m2 !== null ? `${derived.variance_m2 >= 0 ? '+' : ''}${formatNumber(derived.variance_m2)} m²` : '-'}
            </span>
          </div>
        </div>
      </section>

      {/* ========== SECTION 6: Maliyetler - Hammadde & Lojistik ========== */}
      <section className="bg-white rounded-lg border border-marble-200 p-6">
        <h2 className="text-lg font-semibold text-marble-800 mb-4">Maliyetler - Hammadde & Lojistik ({settings.currency})</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Blok ($/m³)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.costs.block_price_per_m3 || ''}
              onChange={e => updateCosts('block_price_per_m3', parseFloat(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Blok ($/ton)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.costs.block_price_per_ton || ''}
              onChange={e => updateCosts('block_price_per_ton', parseFloat(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Nakliye ($/m³)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.costs.freight_per_m3 || ''}
              onChange={e => updateCosts('freight_per_m3', parseFloat(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Nakliye ($/ton)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.costs.freight_per_ton || ''}
              onChange={e => updateCosts('freight_per_ton', parseFloat(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
        </div>
        <div className="bg-marble-50 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-marble-500">Hammadde Toplam:</span>
            <span className="ml-2 font-medium">{formatCurrency(derived.block_price_total, settings.currency)}</span>
          </div>
          <div>
            <span className="text-marble-500">Lojistik Toplam:</span>
            <span className="ml-2 font-medium">{formatCurrency(derived.freight_total, settings.currency)}</span>
          </div>
        </div>
      </section>

      {/* ========== SECTION 7: Maliyetler - Malzeme & Kesim ========== */}
      <section className="bg-white rounded-lg border border-marble-200 p-6">
        <h2 className="text-lg font-semibold text-marble-800 mb-4">Maliyetler - Malzeme & Kesim ({settings.currency})</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Malzeme ($/m³)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.costs.material_per_m3 || ''}
              onChange={e => updateCosts('material_per_m3', parseFloat(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Malzeme ($/ton)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.costs.material_per_ton || ''}
              onChange={e => updateCosts('material_per_ton', parseFloat(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Kesim ($/ton)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.costs.cutting_per_ton || ''}
              onChange={e => updateCosts('cutting_per_ton', parseFloat(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Köprü Kesim</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.costs.bridge_cost || ''}
              onChange={e => updateCosts('bridge_cost', parseFloat(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
        </div>
        <div className="bg-marble-50 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-marble-500">Malzeme Toplam:</span>
            <span className="ml-2 font-medium">{formatCurrency(derived.material_total, settings.currency)}</span>
          </div>
          <div>
            <span className="text-marble-500">Kesim Toplam:</span>
            <span className="ml-2 font-medium">{formatCurrency(derived.cutting_total, settings.currency)}</span>
          </div>
        </div>
      </section>

      {/* ========== SECTION 8: Yüzey İşlemleri ========== */}
      <section className="bg-white rounded-lg border border-marble-200 p-6">
        <h2 className="text-lg font-semibold text-marble-800 mb-4">Yüzey İşlemleri ($/m²)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Ham</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.costs.surface_per_m2.raw || ''}
              onChange={e => updateSurface('raw', parseFloat(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Cilalı</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.costs.surface_per_m2.polished || ''}
              onChange={e => updateSurface('polished', parseFloat(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Honlu</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.costs.surface_per_m2.honed || ''}
              onChange={e => updateSurface('honed', parseFloat(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">File</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.costs.surface_per_m2.mesh || ''}
              onChange={e => updateSurface('mesh', parseFloat(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Fırçalı</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.costs.surface_per_m2.brushed || ''}
              onChange={e => updateSurface('brushed', parseFloat(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Dolgulu</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.costs.surface_per_m2.filled || ''}
              onChange={e => updateSurface('filled', parseFloat(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
        </div>
        <div className="bg-marble-50 rounded-lg p-4 text-sm">
          <span className="text-marble-500">Yüzey Toplam:</span>
          <span className="ml-2 font-medium">{formatCurrency(derived.surface_total, settings.currency)}</span>
        </div>
      </section>

      {/* ========== SECTION 9: Paketleme ========== */}
      <section className="bg-white rounded-lg border border-marble-200 p-6">
        <h2 className="text-lg font-semibold text-marble-800 mb-4">Paketleme ({settings.currency})</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Bandıl</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.costs.packaging.bundle || ''}
              onChange={e => updatePackaging('bundle', parseFloat(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Kasa</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.costs.packaging.crate || ''}
              onChange={e => updatePackaging('crate', parseFloat(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-marble-700 mb-1">Palet</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.costs.packaging.pallet || ''}
              onChange={e => updatePackaging('pallet', parseFloat(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
        </div>
        <div className="bg-marble-50 rounded-lg p-4 text-sm">
          <span className="text-marble-500">Paketleme Toplam:</span>
          <span className="ml-2 font-medium">{formatCurrency(derived.packaging_total, settings.currency)}</span>
        </div>
      </section>

      {/* ========== SECTION 10: Grand Total & Unit Costs ========== */}
      <section className="bg-gradient-to-r from-marble-800 to-marble-700 rounded-lg p-6 text-white">
        <h2 className="text-lg font-semibold mb-4">💰 Finansal Özet</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-marble-300 text-sm">Toplam Maliyet</div>
            <div className="text-2xl font-bold mt-1">{formatCurrency(derived.total_cost, settings.currency)}</div>
          </div>
          <div className="text-center">
            <div className="text-marble-300 text-sm">$/m² (Brüt)</div>
            <div className="text-2xl font-bold mt-1">{formatCurrency(derived.usd_per_m2, settings.currency)}</div>
          </div>
          <div className="text-center">
            <div className="text-marble-300 text-sm">$/ton</div>
            <div className="text-2xl font-bold mt-1">{formatCurrency(derived.usd_per_ton, settings.currency)}</div>
          </div>
        </div>
      </section>

      {/* ========== Submit Buttons ========== */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-marble-800 text-white rounded-lg hover:bg-marble-700 disabled:opacity-50 transition-colors font-medium"
        >
          {saving ? 'Kaydediliyor...' : mode === 'create' ? '✓ Bloğu Kaydet' : '✓ Değişiklikleri Kaydet'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-marble-300 text-marble-700 rounded-lg hover:bg-marble-100 transition-colors"
        >
          İptal
        </button>
      </div>
    </form>
  );
}
