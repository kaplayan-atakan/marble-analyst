'use client';

import Link from 'next/link';
import type { BlockWithDerived } from '@/types/block';
import { formatCurrency, formatDate, formatM2, formatM3 } from '@/utils/formatters';

interface BlockListProps {
  blocks: BlockWithDerived[];
  onDelete?: (id: string) => void;
  currency?: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  stokta: { label: 'Stokta', color: 'bg-blue-100 text-blue-800' },
  islemde: { label: 'İşlemde', color: 'bg-yellow-100 text-yellow-800' },
  satildi: { label: 'Satıldı', color: 'bg-green-100 text-green-800' },
  iptal: { label: 'İptal', color: 'bg-red-100 text-red-800' },
};

export function BlockList({ blocks, onDelete, currency = 'USD' }: BlockListProps) {
  if (blocks.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-marble-200 p-8 text-center">
        <p className="text-marble-500">Henüz blok eklenmemiş.</p>
        <Link
          href="/blocks/new"
          className="mt-4 inline-block px-4 py-2 bg-marble-800 text-white rounded-lg hover:bg-marble-700"
        >
          İlk Bloğu Ekle
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-marble-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-marble-200">
          <thead className="bg-marble-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-marble-500 uppercase tracking-wider">
                Taş Adı
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-marble-500 uppercase tracking-wider">
                Tedarikçi
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-marble-500 uppercase tracking-wider">
                Geliş Tarihi
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-marble-500 uppercase tracking-wider">
                m³
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-marble-500 uppercase tracking-wider">
                Brüt m²
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-marble-500 uppercase tracking-wider">
                Toplam Maliyet
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-marble-500 uppercase tracking-wider">
                $/m²
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-marble-500 uppercase tracking-wider">
                Durum
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-marble-500 uppercase tracking-wider">
                İşlem
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-marble-200">
            {blocks.map((block) => {
              const status = statusLabels[block.meta.status] || statusLabels.stokta;
              return (
                <tr key={block.id} className="hover:bg-marble-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="font-medium text-marble-900">
                      {block.meta.stone_name || '-'}
                    </div>
                    <div className="text-xs text-marble-500">
                      {block.meta.source}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-marble-600">
                    {block.meta.supplier || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-marble-600">
                    {formatDate(block.meta.arrival_date)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-marble-900 text-right">
                    {formatM3(block.derived.volume_m3)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-marble-900 text-right">
                    {formatM2(block.derived.gross_m2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-marble-900 text-right font-medium">
                    {formatCurrency(block.derived.total_cost, currency)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-marble-900 text-right">
                    {formatCurrency(block.derived.usd_per_m2, currency)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                    <Link
                      href={`/blocks/edit?id=${block.id}`}
                      className="text-marble-600 hover:text-marble-900 mr-3"
                    >
                      Düzenle
                    </Link>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(block.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Sil
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
