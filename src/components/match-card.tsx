'use client';

import React from 'react';
import { Lock, Check, AlertCircle } from 'lucide-react';
import { TeamRef } from '../lib/bracket/types';
import { Flag } from './flag';

export type MatchCardProps = {
  matchId: string;
  homeTeam: TeamRef | null;
  awayTeam: TeamRef | null;
  userPick: TeamRef | null;
  selectableTeams: TeamRef[];
  isLocked: boolean;
  isPlayed: boolean;
  rawUserPickId?: string | null; // The raw pick from URL state before resolution
  onPick?: (teamId: string) => void;
};

export const MatchCard: React.FC<MatchCardProps> = ({
  matchId,
  homeTeam,
  awayTeam,
  userPick,
  selectableTeams,
  isLocked,
  isPlayed,
  rawUserPickId,
  onPick,
}) => {
  const isSelectable = selectableTeams.length === 2 && !isLocked;
  
  // A pick is invalidated if the user made a prediction (rawUserPickId) 
  // but it's no longer valid/selectable (userPick is null)
  const isInvalidated = !!rawUserPickId && !userPick && selectableTeams.length === 2;

  const handleTeamClick = (team: TeamRef) => {
    if (isSelectable && onPick) {
      onPick(team.id);
    }
  };

  return (
    <div
      className={`relative w-[180px] rounded-xl transition-all duration-300 border backdrop-blur-md p-2
        ${
          // 1. Pending / Waiting state
          selectableTeams.length < 2
            ? 'border-slate-800/40 bg-slate-950/20 opacity-40 pointer-events-none'
            : // 2. Invalidated state (needs attention)
            isInvalidated
            ? 'border-rose-500/50 bg-rose-950/10 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-pulse'
            : // 3. Locked / Played state
            isLocked
            ? 'border-slate-800 bg-slate-950/50 opacity-90'
            : // 4. User selection made or selectable
            userPick
            ? 'border-amber-500/50 bg-slate-900/80 shadow-[0_0_12px_rgba(245,158,11,0.1)]'
            : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
        }
      `}
    >
      {/* Badges / Header */}
      <div className="flex justify-between items-center mb-1 text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
        <span>{matchId}</span>
        <div className="flex items-center gap-1">
          {isLocked && <Lock className="w-3 h-3 text-slate-400" />}
          {isInvalidated && (
            <span className="flex items-center gap-0.5 text-rose-400 animate-bounce">
              <AlertCircle className="w-3 h-3" />
              <span>GÜNCELLE</span>
            </span>
          )}
        </div>
      </div>

      {/* Team rows */}
      <div className="space-y-1.5">
        {/* Home Team Row */}
        {renderTeamRow(
          homeTeam,
          userPick,
          isSelectable,
          isLocked,
          isPlayed,
          () => homeTeam && handleTeamClick(homeTeam)
        )}

        {/* Divider */}
        <div className="h-[1px] bg-slate-800/60 my-1" />

        {/* Away Team Row */}
        {renderTeamRow(
          awayTeam,
          userPick,
          isSelectable,
          isLocked,
          isPlayed,
          () => awayTeam && handleTeamClick(awayTeam)
        )}
      </div>

      {/* Tooltip / Explanation for invalidated picks */}
      {isInvalidated && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-12 bg-slate-950 text-rose-300 text-[10px] p-2 rounded-lg border border-rose-500/30 whitespace-nowrap shadow-xl z-10 pointer-events-none">
          Eşleşme değişti, tahminini güncelle!
        </div>
      )}
    </div>
  );
};

function renderTeamRow(
  team: TeamRef | null,
  userPick: TeamRef | null,
  isSelectable: boolean,
  isLocked: boolean,
  isPlayed: boolean,
  onClick: () => void
) {
  if (!team) {
    return (
      <div className="flex items-center gap-2 h-6 text-[11px] text-slate-600 font-medium italic">
        <div className="w-4 h-3 bg-slate-800/20 rounded-sm border border-slate-800/40 flex-shrink-0" />
        <span>Bekleniyor</span>
      </div>
    );
  }

  const isChosen = userPick?.id === team.id;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isSelectable}
      className={`w-full flex items-center justify-between h-6 px-1 rounded-lg transition-all text-left text-[11px] font-semibold
        ${
          isSelectable
            ? 'hover:bg-slate-800/60 cursor-pointer active:scale-95'
            : 'cursor-default'
        }
        ${isChosen ? 'text-amber-400 bg-amber-500/5' : 'text-slate-300'}
      `}
    >
      <div className="flex items-center gap-1.5 truncate">
        <Flag code={team.flagCode} className="w-4 h-3 flex-shrink-0" />
        <span className="truncate">{team.name}</span>
      </div>

      <div className="flex items-center flex-shrink-0 pl-1">
        {isChosen && (
          <Check
            className={`w-4 h-4 ${
              isLocked ? 'text-slate-400' : 'text-amber-500'
            }`}
          />
        )}
      </div>
    </button>
  );
}
