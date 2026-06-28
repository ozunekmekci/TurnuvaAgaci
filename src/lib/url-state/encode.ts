import { RealMatch } from '../bracket/types';
import { resolveBracket } from '../bracket/resolve';

export const MATCH_ORDER = [
  'R32-1', 'R32-2', 'R32-3', 'R32-4', 'R32-5', 'R32-6', 'R32-7', 'R32-8',
  'R32-9', 'R32-10', 'R32-11', 'R32-12', 'R32-13', 'R32-14', 'R32-15', 'R32-16',
  'R16-1', 'R16-2', 'R16-3', 'R16-4', 'R16-5', 'R16-6', 'R16-7', 'R16-8',
  'QF-1', 'QF-2', 'QF-3', 'QF-4',
  'SF-1', 'SF-2',
  '3RD-1',
  'F-1'
];

/**
 * Encodes the user picks into a compressed URL-safe string.
 * Uses a base-36 integer representing sequential binary choices to make the URL extremely short.
 *
 * @param userPicks The user picks map (matchId -> teamId)
 * @param realData The real tournament match data
 */
export function encodeUserPicks(
  userPicks: Record<string, string>,
  realData: RealMatch[]
): string {
  // Resolve bracket to determine participants for each match stage
  const resolved = resolveBracket(realData, userPicks);
  
  let val = 0;
  let power = 1;
  let hasAnyPick = false;

  for (let i = 0; i < MATCH_ORDER.length; i++) {
    const matchId = MATCH_ORDER[i];
    const match = resolved.find((m) => m.matchId === matchId);
    
    // Find the corresponding real match
    const realMatch = realData.find((m) => m.id === matchId);
    const isPlayed = realMatch ? realMatch.winner !== null : false;

    let digit = 0; // default: '.' (no pick)
    
    // Skip encoding if the match is already played/locked in the real world
    if (!isPlayed && match && match.userPick) {
      if (match.homeTeam && match.userPick.id === match.homeTeam.id) {
        digit = 1; // home team wins
        hasAnyPick = true;
      } else if (match.awayTeam && match.userPick.id === match.awayTeam.id) {
        digit = 2; // away team wins
        hasAnyPick = true;
      }
    }
    
    val += digit * power;
    power *= 3;
  }

  if (!hasAnyPick) {
    return '';
  }

  return val.toString(36);
}
