'use client';

import { formatCurrency, formatNumber, formatM2, formatM3, formatPercent } from '@/utils/formatters';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
}

function KPICard({ title, value, subtitle, icon }: KPICardProps) {
  return (
    <div className="bg-white rounded-lg border border-marble-200 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-marble-500">{title}</p>
          <p className="text-2xl font-bold text-marble-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-marble-400 mt-1">{subtitle}</p>
          )}
        </div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
    </div>
  );
}

interface DashboardKPIsProps {
  kpis: {
    block_count: number;
    total_m3: number;
    total_ton: number;
    total_gross_m2: number;
    total_net_m2: number;
    total_scrap_m2: number;
    grand_total_cost: number;
    overall_scrap_pct: number | null;
    overall_net_m2_per_m3: number | null;
    avg_usd_per_m2_gross: number | null;
    avg_usd_per_ton: number | null;
    avg_lead_time_days: number | null;
    // Cost breakdown
    total_block_price: number;
    total_freight: number;
    total_material: number;
    total_cutting: number;
    total_surface: number;
    total_packaging: number;
  };
  currency?: string;
}

export function DashboardKPIs({ kpis, currency = 'USD' }: DashboardKPIsProps) {
  return (
    <div className="space-y-6">
      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Toplam Blok"
          value={kpis.block_count.toString()}
          icon="🧱"
        />
        <KPICard
          title="Toplam m³"
          value={formatM3(kpis.total_m3)}
          icon="📦"
        />
        <KPICard
          title="Toplam Ton"
          value={formatNumber(kpis.total_ton, 1) + ' ton'}
          icon="⚖️"
        />
        <KPICard
          title="Brüt m²"
          value={formatM2(kpis.total_gross_m2)}
          icon="📐"
        />
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Toplam Maliyet"
          value={formatCurrency(kpis.grand_total_cost, currency)}
          icon="💰"
        />
        <KPICard
          title="Ort. $/m² (Brüt)"
          value={formatCurrency(kpis.avg_usd_per_m2_gross, currency)}
          subtitle="Toplam maliyet / Brüt m²"
          icon="📊"
        />
        <KPICard
          title="Ort. $/ton"
          value={formatCurrency(kpis.avg_usd_per_ton, currency)}
          icon="📈"
        />
        <KPICard
          title="Fire %"
          value={formatPercent(kpis.overall_scrap_pct)}
          subtitle={`${formatM2(kpis.total_scrap_m2)} fire`}
          icon="🗑️"
        />
      </div>

      {/* Yield KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPICard
          title="Net m²"
          value={formatM2(kpis.total_net_m2)}
          subtitle="Brüt - Fire"
          icon="✅"
        />
        <KPICard
          title="Net m²/m³"
          value={formatNumber(kpis.overall_net_m2_per_m3, 2)}
          subtitle="Verimlilik oranı"
          icon="📏"
        />
        <KPICard
          title="Ort. Lead Time"
          value={kpis.avg_lead_time_days ? `${formatNumber(kpis.avg_lead_time_days, 0)} gün` : '-'}
          subtitle="Geliş → Çıkış"
          icon="⏱️"
        />
      </div>

      {/* Cost Breakdown */}
      <div className="bg-white rounded-lg border border-marble-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-marble-800 mb-4">Maliyet Dağılımı</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <CostItem label="Hammadde" value={kpis.total_block_price} currency={currency} />
          <CostItem label="Lojistik" value={kpis.total_freight} currency={currency} />
          <CostItem label="Malzeme" value={kpis.total_material} currency={currency} />
          <CostItem label="Kesim" value={kpis.total_cutting} currency={currency} />
          <CostItem label="Yüzey" value={kpis.total_surface} currency={currency} />
          <CostItem label="Paketleme" value={kpis.total_packaging} currency={currency} />
        </div>
      </div>
    </div>
  );
}

function CostItem({ label, value, currency }: { label: string; value: number; currency: string }) {
  return (
    <div className="text-center p-2 bg-marble-50 rounded">
      <p className="text-xs text-marble-500">{label}</p>
      <p className="text-sm font-semibold text-marble-800">
        {formatCurrency(value, currency)}
      </p>
    </div>
  );
}
