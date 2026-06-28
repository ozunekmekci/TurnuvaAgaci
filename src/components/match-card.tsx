'use client';

import React from 'react';
import { Lock, AlertCircle } from 'lucide-react';
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
  rawUserPickId?: string | null;
  onPick?: (teamId: string) => void;
};

// Official FIFA 2026 World Cup host cities and calendar dates
const matchSchedule: Record<string, { date: string; city: string }> = {
  // Round of 32
  'R32-1': { date: 'PZT, 29 HAZ 15:00', city: 'HOUSTON' },
  'R32-2': { date: 'PZT, 29 HAZ 18:00', city: 'BOSTON' },
  'R32-3': { date: 'SAL, 30 HAZ 21:00', city: 'MONTERREY' },
  'R32-4': { date: 'SAL, 30 HAZ 18:00', city: 'NEW YORK/NJ' },
  'R32-5': { date: 'ÇAR, 1 TEM 19:00', city: 'LOS ANGELES' },
  'R32-6': { date: 'ÇAR, 1 TEM 22:00', city: 'SEATTLE' },
  'R32-7': { date: 'PER, 2 TEM 17:00', city: 'ATLANTA' },
  'R32-8': { date: 'PER, 2 TEM 20:00', city: 'TORONTO' },
  'R32-9': { date: 'CUM, 3 TEM 18:00', city: 'KANSAS CITY' },
  'R32-10': { date: 'CUM, 3 TEM 21:00', city: 'DALLAS' },
  'R32-11': { date: 'CMT, 4 TEM 17:00', city: 'SAN FRANCISCO' },
  'R32-12': { date: 'CMT, 4 TEM 20:00', city: 'MIAMI' },
  'R32-13': { date: 'PAZ, 28 HAZ 18:00', city: 'LOS ANGELES' },
  'R32-14': { date: 'PAZ, 28 HAZ 21:00', city: 'GUADALAJARA' },
  'R32-15': { date: 'PZT, 29 HAZ 22:00', city: 'MEXICO CITY' },
  'R32-16': { date: 'SAL, 30 HAZ 15:00', city: 'PHILADELPHIA' },

  // Round of 16 (Matches 89 to 96)
  'R16-1': { date: 'PAZ, 5 TEM 18:00', city: 'PHILADELPHIA' },
  'R16-2': { date: 'PAZ, 5 TEM 21:00', city: 'HOUSTON' },
  'R16-3': { date: 'PZT, 6 TEM 19:00', city: 'MIAMI' },
  'R16-4': { date: 'PZT, 6 TEM 22:00', city: 'MEXICO CITY' },
  'R16-5': { date: 'SAL, 7 TEM 17:00', city: 'DALLAS' },
  'R16-6': { date: 'SAL, 7 TEM 20:00', city: 'SEATTLE' },
  'R16-7': { date: 'ÇAR, 8 TEM 18:00', city: 'ATLANTA' },
  'R16-8': { date: 'ÇAR, 8 TEM 21:00', city: 'VANCOUVER' },

  // Quarter-finals
  'QF-1': { date: 'PER, 9 TEM 18:00', city: 'BOSTON' },
  'QF-2': { date: 'CUM, 10 TEM 21:00', city: 'LOS ANGELES' },
  'QF-3': { date: 'CMT, 11 TEM 19:00', city: 'MIAMI' },
  'QF-4': { date: 'PAZ, 12 TEM 22:00', city: 'KANSAS CITY' },

  // Semi-finals
  'SF-1': { date: 'SAL, 14 TEM 20:00', city: 'DALLAS' },
  'SF-2': { date: 'ÇAR, 15 TEM 20:00', city: 'ATLANTA' },

  // 3rd Place Match
  '3RD-1': { date: 'CMT, 18 TEM 17:00', city: 'MIAMI' },

  // Final
  'F-1': { date: 'PAZ, 19 TEM 15:00', city: 'NEW YORK/NEW JERSEY' },
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

  const matchDetails = matchSchedule[matchId] || { date: '2026', city: 'KUZEY AMERİKA' };

  return (
    <div
      data-match-id={matchId}
      className={`match-card-node relative w-[200px] rounded-[22px] transition-all duration-300 border p-2.5 shadow-xl select-none
        ${
          // Special Final styling (glowing gold border)
          matchId === 'F-1'
            ? 'border-amber-400 border-[3px] bg-[#0f1013] shadow-[0_0_20px_rgba(245,158,11,0.25)]'
            : // Special 3rd Place styling (glowing bronze border)
            matchId === '3RD-1'
            ? 'border-[#A87C43] border-[2.5px] bg-[#0f1013] shadow-[0_0_15px_rgba(168,124,67,0.2)]'
            : // 1. Pending / Waiting state (solid dark, click disabled via pointer-events-none)
            selectableTeams.length < 2
            ? 'border-slate-800/80 bg-[#0f1013] pointer-events-none'
            : // 2. Invalidated state (needs attention)
            isInvalidated
            ? 'border-rose-500/60 bg-[#0f1013] shadow-[0_0_15px_rgba(244,63,94,0.2)] animate-pulse'
            : // 3. Locked / Played state
            isLocked
            ? 'border-slate-800 bg-[#0f1013]'
            : // 4. User selection made or selectable
            userPick
            ? 'border-amber-500/50 bg-[#0f1013] shadow-[0_0_12px_rgba(245,158,11,0.12)]'
            : 'border-slate-800 bg-[#0f1013] hover:border-slate-700'
        }
      `}
    >
      {/* Badges / Header (Date and City) */}
      <div className="flex justify-between items-center mb-1.5 px-1 text-[8.5px] font-bold text-slate-300 uppercase tracking-wide">
        <span>{matchDetails.date}</span>
        <div className="flex items-center gap-1">
          {isLocked && <Lock className="w-2.5 h-2.5 text-slate-400" />}
          {isInvalidated && (
            <span className="flex items-center gap-0.5 text-rose-400 animate-bounce">
              <AlertCircle className="w-2.5 h-2.5" />
              <span>GÜNCELLE</span>
            </span>
          )}
          <span>{matchDetails.city}</span>
        </div>
      </div>

      {/* Team rows */}
      <div className="flex flex-col gap-1">
        {/* Home Team Row */}
        {renderTeamRow(
          homeTeam,
          userPick,
          isSelectable,
          isLocked,
          isPlayed,
          () => homeTeam && handleTeamClick(homeTeam)
        )}

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
      <div className="w-full flex items-center justify-between h-8 px-2 rounded-xl bg-[#151519] border border-white/5">
        <div className="flex items-center gap-2">
          {/* Flag Placeholder (Left for TBD matches) */}
          <div className="w-6 h-4 bg-[#5a5b6f] border border-[#F7F7F8]/80 rounded-[5px_0px_5px_0px] flex-shrink-0" />
          {/* TBD Text (Middle) */}
          <span className="font-fwc2026 text-[12px] tracking-widest text-[#B6B7C3] font-bold">
            TBD
          </span>
        </div>
        {/* Checkbox box (Right for TBD matches) */}
        <div className="w-5 h-5 rounded-[5px] bg-[#5a5b6f] flex items-center justify-center text-[#F7F7F8] text-[9px] font-black">
          -
        </div>
      </div>
    );
  }

  const isChosen = userPick?.id === team.id;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isSelectable}
      className={`w-full flex items-center justify-between h-8 px-2 rounded-xl transition-all text-left border
        ${
          isSelectable
            ? 'hover:scale-[1.02] cursor-pointer active:scale-[0.98]'
            : 'cursor-default'
        }
        ${
          isChosen
            ? 'bg-[#151519] border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.08)]'
            : 'bg-[#151519] border-white/5 hover:border-white/10'
        }
      `}
    >
      <div className="flex items-center gap-2 truncate">
        {/* Checkbox box (Left for real teams) */}
        <div
          className={`w-5 h-5 rounded-[5px] flex items-center justify-center text-[9px] font-extrabold select-none transition-all
            ${
              isChosen
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'bg-[#5a5b6f] text-[#F7F7F8]'
            }
          `}
        >
          {isChosen ? '✓' : '-'}
        </div>
        
        {/* Team name in uppercase & sporty font */}
        <span
          className={`font-fwc2026 text-[12px] tracking-widest truncate font-bold
            ${isChosen ? 'text-amber-400 font-extrabold' : 'text-[#B6B7C3]'}
          `}
        >
          {team.name.toUpperCase()}
        </span>
      </div>

      {/* Flag with rounded corners (Right for real teams) */}
      <Flag
        code={team.flagCode}
        className="w-7 h-5 flex-shrink-0 rounded-[3px] shadow-sm border border-slate-950"
      />
    </button>
  );
}
