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
  const rowRef = useRef<HTMLDivElement>(null);
  
  const [scale, setScale] = useState(1);
  const [paths, setPaths] = useState<string[]>([]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        // Measure parent width (or viewport width as safety fallback)
        const parentWidth = containerRef.current.parentElement?.clientWidth || window.innerWidth;
        // Total design width of the bracket:
        // (8 columns * 190px) + (1 center column * 220px) + (8 gaps * 16px) = 1868px
        const designWidth = 1868;
        
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

  // Calculate bracket connection lines dynamically
  useEffect(() => {
    const calculatePaths = () => {
      if (!rowRef.current) return;
      const rowRect = rowRef.current.getBoundingClientRect();
      
      const CONNECTIONS = [
        // Left Side
        { child: 'R16-1', parents: ['R32-2', 'R32-5'], side: 'LEFT' },
        { child: 'R16-2', parents: ['R32-1', 'R32-3'], side: 'LEFT' },
        { child: 'R16-6', parents: ['R32-9', 'R32-10'], side: 'LEFT' },
        { child: 'R16-5', parents: ['R32-11', 'R32-12'], side: 'LEFT' },
        { child: 'QF-1', parents: ['R16-1', 'R16-2'], side: 'LEFT' },
        { child: 'QF-2', parents: ['R16-6', 'R16-5'], side: 'LEFT' },
        { child: 'SF-1', parents: ['QF-1', 'QF-2'], side: 'LEFT' },
        
        // Right Side
        { child: 'R16-3', parents: ['R32-4', 'R32-6'], side: 'RIGHT' },
        { child: 'R16-4', parents: ['R32-7', 'R32-8'], side: 'RIGHT' },
        { child: 'R16-7', parents: ['R32-14', 'R32-16'], side: 'RIGHT' },
        { child: 'R16-8', parents: ['R32-13', 'R32-15'], side: 'RIGHT' },
        { child: 'QF-3', parents: ['R16-3', 'R16-4'], side: 'RIGHT' },
        { child: 'QF-4', parents: ['R16-7', 'R16-8'], side: 'RIGHT' },
        { child: 'SF-2', parents: ['QF-3', 'QF-4'], side: 'RIGHT' },

        // Center
        { child: 'F-1', parents: ['SF-1', 'SF-2'], side: 'CENTER' },
      ];

      const newPaths: string[] = [];

      CONNECTIONS.forEach((conn) => {
        const childEl = rowRef.current?.querySelector(`[data-match-id="${conn.child}"]`);
        const parent1El = rowRef.current?.querySelector(`[data-match-id="${conn.parents[0]}"]`);
        const parent2El = rowRef.current?.querySelector(`[data-match-id="${conn.parents[1]}"]`);

        if (childEl && parent1El && parent2El) {
          const childRect = childEl.getBoundingClientRect();
          const p1Rect = parent1El.getBoundingClientRect();
          const p2Rect = parent2El.getBoundingClientRect();

          const getCoords = (rect: DOMRect) => ({
            x: (rect.left - rowRect.left) / scale,
            y: (rect.top - rowRect.top) / scale,
            width: rect.width / scale,
            height: rect.height / scale,
          });

          const c = getCoords(childRect);
          const p1 = getCoords(p1Rect);
          const p2 = getCoords(p2Rect);

          if (conn.side === 'LEFT') {
            const p1X = p1.x + p1.width;
            const p1Y = p1.y + p1.height / 2;
            const p2X = p2.x + p2.width;
            const p2Y = p2.y + p2.height / 2;
            const cX = c.x;
            const cY = c.y + c.height / 2;

            // Center X between left parent output and right child input
            const midX = p1X + 8; // halfway of the 16px gap

            newPaths.push(
              `M ${p1X} ${p1Y} H ${midX} V ${p2Y} H ${p2X} M ${midX} ${cY} H ${cX}`
            );
          } else if (conn.side === 'RIGHT') {
            const p1X = p1.x;
            const p1Y = p1.y + p1.height / 2;
            const p2X = p2.x;
            const p2Y = p2.y + p2.height / 2;
            const cX = c.x + c.width;
            const cY = c.y + c.height / 2;

            const midX = p1X - 8;

            newPaths.push(
              `M ${p1X} ${p1Y} H ${midX} V ${p2Y} H ${p2X} M ${midX} ${cY} H ${cX}`
            );
          } else if (conn.side === 'CENTER') {
            const p1X = p1.x + p1.width;
            const p1Y = p1.y + p1.height / 2;
            const p2X = p2.x;
            const p2Y = p2.y + p2.height / 2;
            
            const c1X = c.x;
            const c1Y = c.y + c.height * 0.35; // Connect to home slots
            const c2X = c.x + c.width;
            const c2Y = c.y + c.height * 0.65; // Connect to away slots

            newPaths.push(
              `M ${p1X} ${p1Y} H ${c1X} M ${p2X} ${p2Y} H ${c2X}`
            );
          }
        }
      });

      setPaths(newPaths);
    };

    const timeoutId = setTimeout(calculatePaths, 150);
    window.addEventListener('resize', calculatePaths);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', calculatePaths);
    };
  }, [resolvedMatches, scale]);

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

  const bracketHeight = 760; // Increased from 700 to prevent bottom row clipping (Spain & Colombia)

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center overflow-hidden">
      {/* Scaled wrapper container to preserve dynamic document flow height */}
      <div 
        style={{ 
          height: bracketHeight * scale + 24, 
          width: '100%', 
          overflow: 'hidden', 
          position: 'relative' 
        }}
        className="flex items-start justify-center"
      >
        {/* The actual bracket, absolutely positioned and scaled */}
        <div
          ref={rowRef}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            width: 1868, // increased design width to fit 190px columns
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            paddingTop: 12,
            position: 'absolute',
            left: '50%',
            marginLeft: -934, // Negative half of 1868 to center perfectly
          }}
          className="flex-shrink-0"
        >
          {/* Dynamic SVG Bracket Lines rendered behind the match cards */}
          <svg className="absolute inset-0 pointer-events-none w-full h-full" style={{ zIndex: 0 }}>
            {paths.map((p, i) => (
              <path
                key={i}
                d={p}
                stroke="rgba(71, 85, 105, 0.45)" // Elegant Slate-600 line with transparency
                strokeWidth="1.5"
                fill="none"
              />
            ))}
          </svg>

          {/* LEFT SIDE BRACKET */}
          <div className="flex flex-row gap-4 items-center flex-shrink-0 z-10">
            {/* R32 Left */}
            <div id="col-left-r32" className="flex flex-col justify-between h-[760px] py-1.5 scroll-mt-4 w-[190px] flex-shrink-0">
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
            <div id="col-left-r16" className="flex flex-col justify-around h-[760px] py-8 scroll-mt-4 w-[190px] flex-shrink-0">
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
            <div id="col-left-qf" className="flex flex-col justify-around h-[760px] py-16 scroll-mt-4 w-[190px] flex-shrink-0">
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
            <div id="col-left-sf" className="flex flex-col justify-center h-[760px] scroll-mt-4 w-[190px] flex-shrink-0">
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
          <div id="col-center" className="flex flex-col items-center justify-center w-[220px] h-[760px] gap-6 scroll-mt-4 flex-shrink-0 z-10">
            
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
          <div className="flex flex-row-reverse gap-4 items-center flex-shrink-0 z-10">
            {/* R32 Right */}
            <div id="col-right-r32" className="flex flex-col justify-between h-[760px] py-1.5 scroll-mt-4 w-[190px] flex-shrink-0">
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
            <div id="col-right-r16" className="flex flex-col justify-around h-[760px] py-8 scroll-mt-4 w-[190px] flex-shrink-0">
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
            <div id="col-right-qf" className="flex flex-col justify-around h-[760px] py-16 scroll-mt-4 w-[190px] flex-shrink-0">
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
            <div id="col-right-sf" className="flex flex-col justify-center h-[760px] scroll-mt-4 w-[190px] flex-shrink-0">
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
