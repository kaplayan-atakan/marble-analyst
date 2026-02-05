'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sidebar, Header } from '@/components/layout';
import { BlockForm, BlockFormData } from '@/components/blocks';
import { ProtectedRoute } from '@/components/auth';
import { useSettings, useBlocks } from '@/hooks/useSupabase';
import type { Block } from '@/types/block';

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="flex min-h-screen bg-marble-50">
      <Sidebar />
      <main className="flex-1">
        <Header title="Blok Düzenle" subtitle="Yükleniyor..." />
        <div className="flex items-center justify-center h-64">
          <div className="text-marble-500">Yükleniyor...</div>
        </div>
      </main>
    </div>
  );
}

// Inner component that uses useSearchParams
function EditBlockContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const blockId = searchParams.get('id');

  const { settings, loading: settingsLoading } = useSettings();
  const { rawBlocks, loading: blocksLoading, updateBlock } = useBlocks(settings);
  const [block, setBlock] = useState<Block | null>(null);

  // Redirect if no ID provided
  useEffect(() => {
    if (!blockId) {
      alert('Blok ID belirtilmedi');
      router.push('/blocks');
    }
  }, [blockId, router]);

  // Find the block from the loaded blocks
  useEffect(() => {
    if (!blocksLoading && rawBlocks.length > 0 && blockId) {
      const found = rawBlocks.find((b: Block) => b.id === blockId);
      if (found) {
        setBlock(found);
      } else {
        // Block not found, redirect to list
        alert('Blok bulunamadı');
        router.push('/blocks');
      }
    }
  }, [blocksLoading, rawBlocks, blockId, router]);

  const handleSubmit = async (data: BlockFormData) => {
    if (!blockId) return;
    try {
      await updateBlock(blockId, data);
      router.push('/blocks');
    } catch (error) {
      console.error('Error updating block:', error);
      throw error;
    }
  };

  const loading = settingsLoading || blocksLoading || !block;

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-marble-50">
        <Sidebar />
        
        <main className="flex-1">
          <Header 
            title="Blok Düzenle" 
            subtitle={block ? `${block.meta.stone_name} - ${block.meta.supplier || 'Tedarikçi belirtilmemiş'}` : 'Yükleniyor...'}
          />
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-marble-500">Yükleniyor...</div>
            </div>
          ) : (
            <BlockForm
              initialData={block}
              settings={settings}
              onSubmit={handleSubmit}
              mode="edit"
            />
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

// Main export with Suspense wrapper for useSearchParams
export default function EditBlockPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EditBlockContent />
    </Suspense>
  );
}
