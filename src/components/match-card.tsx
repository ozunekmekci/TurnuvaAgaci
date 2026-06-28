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

// Generates realistic dates and cities for the 2026 World Cup
function getMatchDetails(matchId: string) {
  const round = matchId.split('-')[0];
  const num = parseInt(matchId.split('-')[1] || '1', 10);
  
  const cities = [
    'Houston', 'Boston', 'New York/NJ', 'Los Angeles', 'Miami', 'Toronto', 
    'San Francisco', 'Seattle', 'Kansas City', 'Vancouver', 'Philadelphia', 
    'Dallas', 'Monterrey', 'Mexico City', 'Atlanta', 'Guadalajara'
  ];

  if (round === 'R32') {
    const day = 29 + Math.floor((num - 1) / 4);
    const hour = 12 + ((num - 1) % 4) * 3;
    return {
      date: `PZT, ${day} HAZ ${hour}:00`,
      city: cities[(num - 1) % cities.length].toUpperCase()
    };
  }
  if (round === 'R16') {
    const day = 4 + Math.floor((num - 1) / 2);
    const hour = 13 + ((num - 1) % 2) * 4;
    return {
      date: `CMT, ${day} TEM ${hour}:00`,
      city: cities[(num + 3) % cities.length].toUpperCase()
    };
  }
  if (round === 'QF') {
    const day = 9 + Math.floor((num - 1) / 2);
    const hour = 15 + ((num - 1) % 2) * 4;
    return {
      date: `PER, ${day} TEM ${hour}:00`,
      city: cities[(num + 7) % cities.length].toUpperCase()
    };
  }
  if (round === 'SF') {
    return {
      date: num === 1 ? 'SAL, 14 TEM 20:00' : 'ÇAR, 15 TEM 20:00',
      city: num === 1 ? 'ATLANTA' : 'DALLAS'
    };
  }
  if (matchId === '3RD-1') {
    return {
      date: 'CMT, 18 TEM 17:00',
      city: 'MIAMI'
    };
  }
  if (matchId === 'F-1') {
    return {
      date: 'PAZ, 19 TEM 19:00',
      city: 'NEW YORK/NJ'
    };
  }
  return { date: '2026', city: 'KUZEY AMERİKA' };
}

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

  const matchDetails = getMatchDetails(matchId);

  return (
    <div
      data-match-id={matchId}
      className={`match-card-node relative w-[200px] rounded-[18px] transition-all duration-300 border p-2 backdrop-blur-md
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
            ? 'border-amber-500/40 bg-slate-950/45 shadow-[0_0_12px_rgba(245,158,11,0.06)]'
            : 'border-slate-800/60 bg-slate-950/30 hover:border-slate-700/80 hover:bg-slate-950/50'
        }
      `}
    >
      {/* Badges / Header (Date and City) */}
      <div className="flex justify-between items-center mb-1.5 px-1 text-[8.5px] font-bold text-slate-500 uppercase tracking-wide select-none">
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
      <div className="w-full flex items-center justify-between h-8 px-2 rounded-lg bg-[#131316]/50 border border-slate-900/60 opacity-60">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-[5px] bg-[#5a5b6f]/10 border border-slate-800/40 flex items-center justify-center text-slate-700 text-[10px] font-extrabold select-none">
            -
          </div>
          <span className="font-fwc2026 text-[11px] tracking-widest text-slate-600 font-bold select-none">
            TBD
          </span>
        </div>
        <div className="w-7 h-5 bg-slate-950/10 border border-slate-900/40 rounded flex-shrink-0" />
      </div>
    );
  }

  const isChosen = userPick?.id === team.id;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isSelectable}
      className={`w-full flex items-center justify-between h-8 px-2 rounded-lg transition-all text-left border
        ${
          isSelectable
            ? 'hover:scale-[1.02] cursor-pointer active:scale-[0.98]'
            : 'cursor-default'
        }
        ${
          isChosen
            ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.08)]'
            : 'bg-[#131316] border-slate-900/80 hover:border-slate-850'
        }
      `}
    >
      <div className="flex items-center gap-2 truncate">
        {/* Checkbox box */}
        <div
          className={`w-5 h-5 rounded-[5px] flex items-center justify-center text-[10px] font-extrabold select-none transition-all
            ${
              isChosen
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'bg-[#5a5b6f]/20 text-slate-300'
            }
          `}
        >
          {isChosen ? '✓' : '-'}
        </div>
        
        {/* Team name in uppercase & sporty font */}
        <span
          className={`font-fwc2026 text-[12px] tracking-widest truncate font-bold
            ${isChosen ? 'text-amber-400 font-extrabold' : 'text-slate-100'}
          `}
        >
          {team.name.toUpperCase()}
        </span>
      </div>

      {/* Flag with rounded corners */}
      <Flag
        code={team.flagCode}
        className="w-7 h-5 flex-shrink-0 rounded-[3px] shadow-sm border border-slate-950"
      />
    </button>
  );
}
