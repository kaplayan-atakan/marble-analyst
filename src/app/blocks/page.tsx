'use client';

import { useSettings, useBlocks } from '@/hooks/useSupabase';
import { Sidebar, Header } from '@/components/layout';
import { BlockList } from '@/components/blocks';
import { ProtectedRoute } from '@/components/auth';
import Link from 'next/link';

export default function BlocksPage() {
  const { settings, loading: settingsLoading } = useSettings();
  const { blocks, loading: blocksLoading, deleteBlock } = useBlocks(settings);

  const loading = settingsLoading || blocksLoading;

  const handleDelete = async (id: string) => {
    if (confirm('Bu bloğu silmek istediğinize emin misiniz?')) {
      await deleteBlock(id);
    }
  };

  return (
    <ProtectedRoute>
    <div className="flex min-h-screen bg-marble-50">
      <Sidebar />
      
      <main className="flex-1">
        <Header 
          title="Bloklar" 
          subtitle={`Toplam ${blocks.length} blok`}
          actions={
            <Link
              href="/blocks/new"
              className="px-4 py-2 bg-marble-800 text-white rounded-lg hover:bg-marble-700 transition-colors"
            >
              + Yeni Blok
            </Link>
          }
        />
        
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-marble-500">Yükleniyor...</div>
            </div>
          ) : (
            <BlockList 
              blocks={blocks} 
              onDelete={handleDelete}
              currency={settings.currency}
            />
          )}
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}
