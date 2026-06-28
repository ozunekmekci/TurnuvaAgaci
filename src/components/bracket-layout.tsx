'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        // Measure parent width (or viewport width as safety fallback)
        const parentWidth = containerRef.current.parentElement?.clientWidth || window.innerWidth;
        // Total design width of the compact bracket:
        // (8 columns * 180px) + (1 center column * 220px) + (8 gaps * 16px) = 1788px
        const designWidth = 1788;
        
        // Calculate scale to fit the parent width exactly, allowing a small margin
        const calculatedScale = Math.min(1, Math.max(0.2, (parentWidth - 16) / designWidth));
        setScale(calculatedScale);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Also use ResizeObserver for more accurate container width tracking
    let resizeObserver: ResizeObserver | null = null;
    if (typeof window !== 'undefined' && containerRef.current?.parentElement) {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(containerRef.current.parentElement);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

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

  const bracketHeight = 700; // Designed vertical height of columns (reduced from 800)

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center overflow-hidden">
      {/* Scaled wrapper container to preserve dynamic document flow height */}
      <div 
        style={{ 
          height: bracketHeight * scale + 16, 
          width: '100%', 
          overflow: 'hidden', 
          position: 'relative' 
        }}
        className="flex items-start justify-center"
      >
        {/* The actual bracket, absolutely positioned and scaled */}
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            width: 1788,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16, // reduced from 24
            paddingTop: 8,
            position: 'absolute',
            left: '50%',
            marginLeft: -894, // Negative half of width to center perfectly
          }}
          className="flex-shrink-0"
        >
          {/* LEFT SIDE BRACKET */}
          <div className="flex flex-row gap-4 items-center flex-shrink-0">
            {/* R32 Left */}
            <div id="col-left-r32" className="flex flex-col justify-between h-[700px] py-1.5 scroll-mt-4 w-[180px] flex-shrink-0">
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
            <div id="col-left-r16" className="flex flex-col justify-around h-[700px] py-8 scroll-mt-4 w-[180px] flex-shrink-0">
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
            <div id="col-left-qf" className="flex flex-col justify-around h-[700px] py-16 scroll-mt-4 w-[180px] flex-shrink-0">
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
            <div id="col-left-sf" className="flex flex-col justify-center h-[700px] scroll-mt-4 w-[180px] flex-shrink-0">
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
          <div id="col-center" className="flex flex-col items-center justify-center w-[220px] h-[700px] gap-6 scroll-mt-4 flex-shrink-0">
            
            {/* Champion Box */}
            <div
              className={`w-[200px] flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-500
                ${
                  champion
                    ? 'border-amber-500 bg-gradient-to-b from-amber-500/20 to-slate-900/60 shadow-[0_0_25px_rgba(245,158,11,0.25)] animate-bounce'
                    : 'border-slate-800 bg-slate-900/30 opacity-70'
                }
              `}
            >
              <Trophy
                className={`w-10 h-10 mb-2 transition-transform duration-500 ${
                  champion ? 'text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'text-slate-700'
                }`}
              />
              <span className="text-[9px] font-bold tracking-widest text-slate-500 uppercase mb-1">
                ŞAMPİYON
              </span>
              {champion ? (
                <div className="flex flex-col items-center gap-1 mt-1">
                  <Flag code={champion.flagCode} className="w-7 h-5 rounded" />
                  <span className="text-sm font-extrabold text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                    {champion.name}
                  </span>
                </div>
              ) : (
                <span className="text-xs font-semibold text-slate-500 italic mt-1">
                  Kupa Bekliyor
                </span>
              )}
            </div>

            {/* Final Match */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold text-amber-500/80 tracking-widest uppercase mb-1">
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
              <span className="text-[9px] font-bold text-slate-500 tracking-widest uppercase mb-1">
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
          <div className="flex flex-row-reverse gap-4 items-center flex-shrink-0">
            {/* R32 Right */}
            <div id="col-right-r32" className="flex flex-col justify-between h-[700px] py-1.5 scroll-mt-4 w-[180px] flex-shrink-0">
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
            <div id="col-right-r16" className="flex flex-col justify-around h-[700px] py-8 scroll-mt-4 w-[180px] flex-shrink-0">
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
            <div id="col-right-qf" className="flex flex-col justify-around h-[700px] py-16 scroll-mt-4 w-[180px] flex-shrink-0">
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
            <div id="col-right-sf" className="flex flex-col justify-center h-[700px] scroll-mt-4 w-[180px] flex-shrink-0">
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
