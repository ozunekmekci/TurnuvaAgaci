import React, { Suspense } from 'react';
import { BracketContainer } from '../components/bracket-container';

export const metadata = {
  title: 'Dünya Kupası Tahmin Ağacı 2026',
  description: '2026 FIFA Dünya Kupası Son 32 aşaması eleme turlarını tahmin et, sonuçları X (Twitter) ve Instagram\'da paylaş!',
  keywords: ['dünya kupası', 'tahmin', 'turnuva ağacı', 'bracket predictor', 'fifa 2026'],
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b0d17] to-[#16192b] text-slate-100 p-4 md:p-8 flex flex-col items-center">
      {/* Title block */}
      <div className="max-w-4xl w-full text-center mt-6 mb-10 px-4">
        <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 tracking-tight drop-shadow-sm uppercase">
          Dünya Kupası Tahmin Ağacı
        </h1>
        <p className="text-sm md:text-base text-slate-400 mt-3 font-medium max-w-xl mx-auto">
          2026 FIFA Dünya Kupası Son 32 aşamasından itibaren tüm turları tahmin et, turnuva heyecanına ortak ol ve arkadaşlarınla paylaş!
        </p>
      </div>

      <Suspense fallback={
        <div className="flex flex-col items-center justify-center p-12 text-slate-400 font-semibold gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Yükleniyor...</span>
        </div>
      }>
        <BracketContainer />
      </Suspense>
    </main>
  );
}
