'use client';

import { useRouter } from 'next/navigation';
import { useSettings, useBlocks } from '@/hooks/useSupabase';
import { Sidebar, Header } from '@/components/layout';
import { BlockForm, BlockFormData } from '@/components/blocks';
import { ProtectedRoute } from '@/components/auth';

export default function NewBlockPage() {
  const router = useRouter();
  const { settings, loading: settingsLoading } = useSettings();
  const { createBlock } = useBlocks(settings);

  const handleSubmit = async (data: BlockFormData) => {
    try {
      await createBlock(data);
      router.push('/blocks');
    } catch (error) {
      console.error('Error creating block:', error);
      throw error;
    }
  };

  if (settingsLoading) {
    return (
      <ProtectedRoute>
      <div className="flex min-h-screen bg-marble-50">
        <Sidebar />
        <main className="flex-1">
          <Header title="Yeni Blok Ekle" subtitle="Blok bilgilerini girin" />
          <div className="flex items-center justify-center h-64">
            <div className="text-marble-500">Yükleniyor...</div>
          </div>
        </main>
      </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
    <div className="flex min-h-screen bg-marble-50">
      <Sidebar />
      
      <main className="flex-1">
        <Header 
          title="Yeni Blok Ekle" 
          subtitle="Blok bilgilerini girin"
        />
        
        <BlockForm
          settings={settings}
          onSubmit={handleSubmit}
          mode="create"
        />
      </main>
    </div>
    </ProtectedRoute>
  );
}

