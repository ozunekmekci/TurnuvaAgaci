import { RealMatch, TeamRef, ResolvedSlot } from './types';

// Helper function to resolve the team coming from a parent match (source)
function getTeamFromSource(
  sourceMatch: ResolvedSlot,
  type: 'WINNER' | 'LOSER'
): TeamRef | null {
  // 1. If the source match is already played in the real world, use the real result
  if (sourceMatch.isPlayed && sourceMatch.winner) {
    if (type === 'WINNER') {
      return sourceMatch.winner;
    } else {
      // LOSER of real match
      if (!sourceMatch.homeTeam || !sourceMatch.awayTeam) return null;
      return sourceMatch.winner.id === sourceMatch.homeTeam.id
        ? sourceMatch.awayTeam
        : sourceMatch.homeTeam;
    }
  }

  // 2. If the source match is not played yet but user has made a valid pick, use the user's pick
  if (sourceMatch.userPick) {
    if (type === 'WINNER') {
      return sourceMatch.userPick;
    } else {
      // LOSER of user prediction
      if (!sourceMatch.homeTeam || !sourceMatch.awayTeam) return null;
      return sourceMatch.userPick.id === sourceMatch.homeTeam.id
        ? sourceMatch.awayTeam
        : sourceMatch.homeTeam;
    }
  }

  return null;
}

/**
 * Resolves the state of the tournament bracket by combining real world results
 * and user picks. Traverses the bracket from bottom (Round of 32) to top (Final).
 *
 * @param realData The real-world match data (from sync script)
 * @param userPicks The user's picks (map of matchId -> teamId)
 */
export function resolveBracket(
  realData: RealMatch[],
  userPicks: Record<string, string>
): ResolvedSlot[] {
  // Sort order of rounds to ensure dependencies are processed first
  const roundOrder: Record<string, number> = {
    R32: 1,
    R16: 2,
    QF: 3,
    SF: 4,
    '3RD': 5,
    F: 5,
  };

  // Sort matches based on dependency depth (R32 first, then R16, QF, SF, and finally 3RD & F)
  const sortedRealMatches = [...realData].sort((a, b) => {
    const roundDiff = roundOrder[a.round] - roundOrder[b.round];
    if (roundDiff !== 0) return roundDiff;
    return a.slot - b.slot;
  });

  const resolvedSlotsMap = new Map<string, ResolvedSlot>();

  for (const match of sortedRealMatches) {
    let homeTeam: TeamRef | null = match.homeTeam;
    let awayTeam: TeamRef | null = match.awayTeam;

    // Resolve homeTeam from source if it's not set
    if (!homeTeam && match.homeSource) {
      const sourceMatch = resolvedSlotsMap.get(match.homeSource.matchId);
      if (sourceMatch) {
        homeTeam = getTeamFromSource(sourceMatch, match.homeSource.type);
      }
    }

    // Resolve awayTeam from source if it's not set
    if (!awayTeam && match.awaySource) {
      const sourceMatch = resolvedSlotsMap.get(match.awaySource.matchId);
      if (sourceMatch) {
        awayTeam = getTeamFromSource(sourceMatch, match.awaySource.type);
      }
    }

    const isPlayed = match.winner !== null;
    const isLocked = isPlayed;

    const selectableTeams: TeamRef[] = [];
    if (homeTeam && awayTeam) {
      selectableTeams.push(homeTeam, awayTeam);
    }

    let userPick: TeamRef | null = null;
    if (isPlayed) {
      // Golden Rule: Real results override user picks and lock them
      userPick = match.winner;
    } else {
      const pickedTeamId = userPicks[match.id];
      if (pickedTeamId && homeTeam && awayTeam) {
        if (pickedTeamId === homeTeam.id) {
          userPick = homeTeam;
        } else if (pickedTeamId === awayTeam.id) {
          userPick = awayTeam;
        }
      }
    }

    resolvedSlotsMap.set(match.id, {
      matchId: match.id,
      homeTeam,
      awayTeam,
      isPlayed,
      userPick,
      selectableTeams,
      isLocked,
    });
  }

  // Map original realData list to the resolved slots to preserve original order
  return realData.map((m) => resolvedSlotsMap.get(m.id)!);
}
