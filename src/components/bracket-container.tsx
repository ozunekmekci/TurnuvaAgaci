'use client';

import React, { useMemo } from 'react';
import { RefreshCw, Share2, Sparkles, Trophy } from 'lucide-react';
import { RealMatch } from '../lib/bracket/types';
import { resolveBracket } from '../lib/bracket/resolve';
import { useUserPicks } from '../lib/url-state/useUserPicks';
import { BracketLayout } from './bracket-layout';
import rawTournamentData from '../../data/tournament-data.json';

const realData = rawTournamentData as RealMatch[];

export const BracketContainer: React.FC = () => {
  const { userPicks, updatePick, resetPicks, isUpdating } = useUserPicks(realData);

  // Memoize resolved matches to avoid recalculating on every render
  const resolvedMatches = useMemo(() => {
    return resolveBracket(realData, userPicks);
  }, [userPicks]);

  // Statistics calculation
  const totalMatchesCount = resolvedMatches.length; // Should be 32
  const completedPicksCount = useMemo(() => {
    // Count matches where user has a resolved userPick and the match is either played or selectable
    return resolvedMatches.filter((m) => m.userPick !== null).length;
  }, [resolvedMatches]);

  const completionPercentage = Math.round((completedPicksCount / totalMatchesCount) * 100);

  // Check if champion is determined
  const finalMatch = resolvedMatches.find((m) => m.matchId === 'F-1');
  const champion = finalMatch?.userPick;

  // Check if there are any invalidated picks (picks in rawUserPicks that resolved to null)
  const hasInvalidatedPicks = useMemo(() => {
    return resolvedMatches.some((m) => {
      const rawPick = userPicks[m.matchId];
      return !!rawPick && !m.userPick && m.selectableTeams.length === 2;
    });
  }, [resolvedMatches, userPicks]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top dashboard controls */}
      <div className="w-full max-w-6xl px-4 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md">
        
        {/* Progress Section */}
        <div className="flex flex-col gap-1 w-full md:w-auto">
          <div className="flex justify-between md:justify-start items-center gap-3">
            <span className="text-sm font-semibold text-slate-400">Tahmin İlerlemesi:</span>
            <span className="text-sm font-extrabold text-amber-400">
              {completedPicksCount} / {totalMatchesCount} Maç
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full md:w-64 h-2 bg-slate-950 rounded-full overflow-hidden mt-1 border border-slate-800/40">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500 rounded-full"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Invalidated Picks Notification */}
        {hasInvalidatedPicks && (
          <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-300 text-xs font-semibold animate-pulse">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>Gerçek maç sonuçları nedeniyle bazı tahminleriniz geçersiz kalmıştır. Lütfen güncelleyin.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Reset Button */}
          <button
            type="button"
            onClick={resetPicks}
            disabled={completedPicksCount === 0 || isUpdating}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:hover:border-slate-800 transition-all text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer active:scale-95 disabled:active:scale-100"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sıfırla</span>
          </button>

          {/* Share Button (Placeholder, to be detailed in Sprint 6) */}
          <button
            type="button"
            disabled={completedPicksCount < totalMatchesCount || isUpdating}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer active:scale-95 disabled:active:scale-100
              ${
                completedPicksCount === totalMatchesCount
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
              }
            `}
          >
            <Share2 className="w-4 h-4" />
            <span>Tahminleri Paylaş</span>
          </button>
        </div>

      </div>

      {/* Symmetrical Bracket Render */}
      <div className="w-full bg-slate-950/40 rounded-3xl border border-slate-800/80 p-4 shadow-2xl backdrop-blur-sm">
        <BracketLayout
          resolvedMatches={resolvedMatches}
          rawUserPicks={userPicks}
          onPickMatch={updatePick}
        />
      </div>
    </div>
  );
};
