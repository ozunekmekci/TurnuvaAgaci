'use client';

import React from 'react';
import { RealMatch, TeamRef } from '../../lib/bracket/types';
import { resolveBracket } from '../../lib/bracket/resolve';
import { MatchCard } from '../../components/match-card';
import { BracketLayout } from '../../components/bracket-layout';
import rawTournamentData from '../../../data/tournament-data.json';

const originalData = rawTournamentData as RealMatch[];

export default function PreviewPage() {
  // 1. Mocking the 5 individual states for the side-by-side comparison
  const mockTeamA: TeamRef = { id: 'ARG', name: 'Arjantin', flagCode: 'ar' };
  const mockTeamB: TeamRef = { id: 'FRA', name: 'Fransa', flagCode: 'fr' };

  // 2. Prepare mock realData & rawUserPicks for the full layout preview
  // Let's create a scenario where:
  // - Some Son 32 matches are played
  // - User has some predictions
  // - One prediction is invalidated due to a real result
  const mockRealData: RealMatch[] = originalData.map((m) => {
    const clone = { ...m };
    
    // Let's say Canada (CAN) won against South Africa (RSA) in real life
    if (clone.id === 'R32-1') {
      clone.winner = { id: 'CAN', name: 'Kanada', flagCode: 'ca' };
      clone.playedAt = new Date().toISOString();
    }
    
    // Germany (GER) won against Paraguay (PAR) in real life
    if (clone.id === 'R32-2') {
      clone.winner = { id: 'GER', name: 'Almanya', flagCode: 'de' };
      clone.playedAt = new Date().toISOString();
    }

    // Netherlands (NED) won against Morocco (MAR) in real life
    if (clone.id === 'R32-3') {
      clone.winner = { id: 'NED', name: 'Hollanda', flagCode: 'nl' };
      clone.playedAt = new Date().toISOString();
    }

    return clone;
  });

  // User's original predictions
  const mockRawUserPicks: Record<string, string> = {
    // User predicted South Africa (RSA) to win R32-1 (But Canada won!)
    'R32-1': 'RSA',
    // User predicted Germany (GER) to win R32-2 (Correct)
    'R32-2': 'GER',
    // User predicted Morocco (MAR) to win R32-3 (Wrong, Netherlands won)
    'R32-3': 'MAR',
    // User predicted France (FRA) to win R32-5 (Not played yet, user prediction)
    'R32-5': 'FRA',
    
    // User predicted Germany to win R16-1 (Feeds from R32-2 GER vs R32-5 FRA)
    'R16-1': 'GER',
    // User predicted South Africa to win R16-2 (Feeds from R32-1 CAN vs R32-3 NED)
    // Wait, since South Africa is eliminated, this pick is invalidated!
    'R16-2': 'RSA',
    
    // QF prediction depending on South Africa, also invalidated!
    'QF-1': 'RSA',
  };

  // Run the bracket resolver
  const resolvedMatches = resolveBracket(mockRealData, mockRawUserPicks);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b0d17] to-[#16192b] text-slate-100 p-8 flex flex-col items-center">
      {/* Header */}
      <div className="max-w-4xl w-full text-center mb-10">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200 tracking-tight">
          Turnuva Ağacı UI/UX Önizleme Sayfası
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Statik bileşen tasarımlarını, glassmorphism kart yapılarını ve 5 farklı durum modunu inceleyin.
        </p>
      </div>

      {/* State showcase */}
      <div className="max-w-6xl w-full mb-12">
        <h2 className="text-lg font-bold text-slate-300 mb-4 border-b border-slate-800 pb-2">
          Kart Durumları Önizlemesi
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          
          {/* State 1: Pending */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-slate-500 font-semibold">1. BEKLİYOR (Takımlar belirsiz)</span>
            <MatchCard
              matchId="R16-1"
              homeTeam={null}
              awayTeam={null}
              userPick={null}
              selectableTeams={[]}
              isLocked={false}
              isPlayed={false}
            />
          </div>

          {/* State 2: Selectable */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-slate-500 font-semibold">2. SEÇİLEBİLİR (Tahmin yapma)</span>
            <MatchCard
              matchId="R32-4"
              homeTeam={mockTeamA}
              awayTeam={mockTeamB}
              userPick={null}
              selectableTeams={[mockTeamA, mockTeamB]}
              isLocked={false}
              isPlayed={false}
            />
          </div>

          {/* State 3: Selected */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-slate-500 font-semibold">3. SEÇİLMİŞ (Tahmin yapıldı)</span>
            <MatchCard
              matchId="R32-4"
              homeTeam={mockTeamA}
              awayTeam={mockTeamB}
              userPick={mockTeamA}
              selectableTeams={[mockTeamA, mockTeamB]}
              isLocked={false}
              isPlayed={false}
            />
          </div>

          {/* State 4: Locked */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-slate-500 font-semibold">4. KİLİTLİ / OYNANDI (Gerçek sonuç)</span>
            <MatchCard
              matchId="R32-4"
              homeTeam={mockTeamA}
              awayTeam={mockTeamB}
              userPick={mockTeamA} // Real winner matches
              selectableTeams={[mockTeamA, mockTeamB]}
              isLocked={true}
              isPlayed={true}
            />
          </div>

          {/* State 5: Invalidated */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-slate-500 font-semibold">5. GEÇERSİZ / ELENDİ (Eşleşme değişti)</span>
            <MatchCard
              matchId="R16-2"
              homeTeam={mockTeamA}
              awayTeam={mockTeamB}
              userPick={null} // Becomes null in resolver
              selectableTeams={[mockTeamA, mockTeamB]}
              isLocked={false}
              isPlayed={false}
              rawUserPickId="CPV" // Original pick was Cape Verde (which got eliminated)
            />
          </div>

        </div>
      </div>

      {/* Bracket layout showcase */}
      <div className="w-full">
        <h2 className="text-lg font-bold text-slate-300 mb-4 border-b border-slate-800 pb-2 text-center">
          Tam Simetrik Turnuva Ağacı Layout
        </h2>
        <div className="bg-slate-950/40 rounded-3xl border border-slate-800/80 p-4 shadow-2xl">
          <BracketLayout
            resolvedMatches={resolvedMatches}
            rawUserPicks={mockRawUserPicks}
          />
        </div>
      </div>
    </main>
  );
}
