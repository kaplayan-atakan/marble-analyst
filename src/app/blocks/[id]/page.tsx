'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sidebar, Header } from '@/components/layout';
import { BlockForm, BlockFormData } from '@/components/blocks';
import { ProtectedRoute } from '@/components/auth';
import { useSettings, useBlocks } from '@/hooks/useSupabase';
import type { Block } from '@/types/block';

export default function EditBlockPage() {
  const params = useParams();
  const router = useRouter();
  const blockId = params.id as string;

  const { settings, loading: settingsLoading } = useSettings();
  const { rawBlocks, loading: blocksLoading, updateBlock } = useBlocks(settings);
  const [block, setBlock] = useState<Block | null>(null);

  // Find the block from the loaded blocks
  useEffect(() => {
    if (!blocksLoading && rawBlocks.length > 0) {
      const found = rawBlocks.find(b => b.id === blockId);
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
