'use client';

import { useSettings, useBlocks, useDashboardKPIs } from '@/hooks/useSupabase';
import { Sidebar, Header } from '@/components/layout';
import { DashboardKPIs } from '@/components/dashboard';
import { BlockList } from '@/components/blocks';
import { ProtectedRoute } from '@/components/auth';
import Link from 'next/link';

export default function DashboardPage() {
  const { settings, loading: settingsLoading } = useSettings();
  const { blocks, loading: blocksLoading, deleteBlock } = useBlocks(settings);
  const kpis = useDashboardKPIs(blocks);

  const loading = settingsLoading || blocksLoading;

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-marble-50">
        <Sidebar />
        
        <main className="flex-1">
          <Header 
            title="Dashboard" 
            subtitle="Blok takip ve maliyet analizi"
            actions={
              <Link
                href="/blocks/new"
                className="px-4 py-2 bg-marble-800 text-white rounded-lg hover:bg-marble-700 transition-colors"
              >
                + Yeni Blok
              </Link>
            }
          />
          
          <div className="p-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-marble-500">Yükleniyor...</div>
              </div>
            ) : (
              <>
                <DashboardKPIs kpis={kpis} currency={settings.currency} />
                
                <div className="mt-8">
                  <h2 className="text-lg font-semibold text-marble-800 mb-4">
                    Son Bloklar
                  </h2>
                  <BlockList 
                    blocks={blocks.slice(0, 10)} 
                    onDelete={deleteBlock}
                    currency={settings.currency}
                  />
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
