'use client';

import React from 'react';
import { Trophy } from 'lucide-react';
import { ResolvedSlot, TeamRef } from '../lib/bracket/types';
import { MatchCard } from './match-card';
import { Flag } from './flag';

type BracketLayoutProps = {
  resolvedMatches: ResolvedSlot[];
  rawUserPicks?: Record<string, string>; // Raw picks to detect invalidations
  onPickMatch?: (matchId: string, teamId: string) => void;
};

// Dikey sıralama eşleştirmeleri (Süper simetri için)
const LEFT_R32_IDS = ['R32-2', 'R32-5', 'R32-1', 'R32-3', 'R32-9', 'R32-10', 'R32-11', 'R32-12'];
const LEFT_R16_IDS = ['R16-1', 'R16-2', 'R16-6', 'R16-5'];
const LEFT_QF_IDS = ['QF-1', 'QF-2'];
const LEFT_SF_IDS = ['SF-1'];

const RIGHT_R32_IDS = ['R32-4', 'R32-6', 'R32-7', 'R32-8', 'R32-14', 'R32-16', 'R32-13', 'R32-15'];
const RIGHT_R16_IDS = ['R16-3', 'R16-4', 'R16-7', 'R16-8'];
const RIGHT_QF_IDS = ['QF-3', 'QF-4'];
const RIGHT_SF_IDS = ['SF-2'];

export const BracketLayout: React.FC<BracketLayoutProps> = ({
  resolvedMatches,
  rawUserPicks = {},
  onPickMatch,
}) => {
  // Helper to find match by id
  const getMatch = (id: string): ResolvedSlot => {
    const match = resolvedMatches.find((m) => m.matchId === id);
    if (!match) {
      throw new Error(`Match with id ${id} not found in resolvedMatches`);
    }
    return match;
  };

  const handlePick = (matchId: string, teamId: string) => {
    if (onPickMatch) {
      onPickMatch(matchId, teamId);
    }
  };

  // Determine champion
  const finalMatch = getMatch('F-1');
  const champion: TeamRef | null = finalMatch.userPick;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Scroll container for mobile/tablet */}
      <div className="w-full overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <div className="flex flex-row items-center justify-center gap-6 min-w-[1300px] px-8 py-4">
          
          {/* LEFT SIDE BRACKET */}
          <div className="flex flex-row gap-6 items-center">
            {/* R32 Left */}
            <div id="col-left-r32" className="flex flex-col justify-between h-[800px] py-2 scroll-mt-4">
              {LEFT_R32_IDS.map((id) => (
                <MatchCard
                  key={id}
                  {...getMatch(id)}
                  rawUserPickId={rawUserPicks[id]}
                  onPick={(teamId) => handlePick(id, teamId)}
                />
              ))}
            </div>

            {/* R16 Left */}
            <div id="col-left-r16" className="flex flex-col justify-around h-[800px] py-10 scroll-mt-4">
              {LEFT_R16_IDS.map((id) => (
                <MatchCard
                  key={id}
                  {...getMatch(id)}
                  rawUserPickId={rawUserPicks[id]}
                  onPick={(teamId) => handlePick(id, teamId)}
                />
              ))}
            </div>

            {/* QF Left */}
            <div id="col-left-qf" className="flex flex-col justify-around h-[800px] py-20 scroll-mt-4">
              {LEFT_QF_IDS.map((id) => (
                <MatchCard
                  key={id}
                  {...getMatch(id)}
                  rawUserPickId={rawUserPicks[id]}
                  onPick={(teamId) => handlePick(id, teamId)}
                />
              ))}
            </div>

            {/* SF Left */}
            <div id="col-left-sf" className="flex flex-col justify-center h-[800px] scroll-mt-4">
              {LEFT_SF_IDS.map((id) => (
                <MatchCard
                  key={id}
                  {...getMatch(id)}
                  rawUserPickId={rawUserPicks[id]}
                  onPick={(teamId) => handlePick(id, teamId)}
                />
              ))}
            </div>
          </div>

          {/* CENTERPIECE: CHAMPION + FINAL + 3RD PLACE */}
          <div id="col-center" className="flex flex-col items-center justify-center w-[260px] h-[800px] gap-8 scroll-mt-4">
            
            {/* Champion Box */}
            <div
              className={`w-[240px] flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-500
                ${
                  champion
                    ? 'border-amber-500 bg-gradient-to-b from-amber-500/20 to-slate-900/60 shadow-[0_0_25px_rgba(245,158,11,0.25)] animate-bounce'
                    : 'border-slate-800 bg-slate-900/30 opacity-70'
                }
              `}
            >
              <Trophy
                className={`w-12 h-12 mb-3 transition-transform duration-500 ${
                  champion ? 'text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'text-slate-700'
                }`}
              />
              <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1">
                ŞAMPİYON
              </span>
              {champion ? (
                <div className="flex flex-col items-center gap-1.5 mt-1">
                  <Flag code={champion.flagCode} className="w-8 h-5.5 rounded" />
                  <span className="text-base font-extrabold text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                    {champion.name}
                  </span>
                </div>
              ) : (
                <span className="text-sm font-semibold text-slate-500 italic mt-1">
                  Kupa Bekliyor
                </span>
              )}
            </div>

            {/* Final Match */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-amber-500/80 tracking-widest uppercase mb-1">
                FİNAL
              </span>
              <MatchCard
                {...finalMatch}
                rawUserPickId={rawUserPicks['F-1']}
                onPick={(teamId) => handlePick('F-1', teamId)}
              />
            </div>

            {/* 3rd Place Match */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">
                3. LÜK MAÇI
              </span>
              <MatchCard
                {...getMatch('3RD-1')}
                rawUserPickId={rawUserPicks['3RD-1']}
                onPick={(teamId) => handlePick('3RD-1', teamId)}
              />
            </div>

          </div>

          {/* RIGHT SIDE BRACKET */}
          <div className="flex flex-row-reverse gap-6 items-center">
            {/* R32 Right */}
            <div id="col-right-r32" className="flex flex-col justify-between h-[800px] py-2 scroll-mt-4">
              {RIGHT_R32_IDS.map((id) => (
                <MatchCard
                  key={id}
                  {...getMatch(id)}
                  rawUserPickId={rawUserPicks[id]}
                  onPick={(teamId) => handlePick(id, teamId)}
                />
              ))}
            </div>

            {/* R16 Right */}
            <div id="col-right-r16" className="flex flex-col justify-around h-[800px] py-10 scroll-mt-4">
              {RIGHT_R16_IDS.map((id) => (
                <MatchCard
                  key={id}
                  {...getMatch(id)}
                  rawUserPickId={rawUserPicks[id]}
                  onPick={(teamId) => handlePick(id, teamId)}
                />
              ))}
            </div>

            {/* QF Right */}
            <div id="col-right-qf" className="flex flex-col justify-around h-[800px] py-20 scroll-mt-4">
              {RIGHT_QF_IDS.map((id) => (
                <MatchCard
                  key={id}
                  {...getMatch(id)}
                  rawUserPickId={rawUserPicks[id]}
                  onPick={(teamId) => handlePick(id, teamId)}
                />
              ))}
            </div>

            {/* SF Right */}
            <div id="col-right-sf" className="flex flex-col justify-center h-[800px] scroll-mt-4">
              {RIGHT_SF_IDS.map((id) => (
                <MatchCard
                  key={id}
                  {...getMatch(id)}
                  rawUserPickId={rawUserPicks[id]}
                  onPick={(teamId) => handlePick(id, teamId)}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
