import LZString from 'lz-string';
import { RealMatch } from '../bracket/types';

/**
 * Encodes the user picks into a compressed URL-safe string.
 * Filters out picks that are empty or already matches the real-world results (which are locked).
 *
 * @param userPicks The user picks map (matchId -> teamId)
 * @param realData The real tournament match data
 */
export function encodeUserPicks(
  userPicks: Record<string, string>,
  realData: RealMatch[]
): string {
  const optimizedPicks: Record<string, string> = {};

  for (const [matchId, teamId] of Object.entries(userPicks)) {
    // Filter out empty picks
    if (!teamId) continue;

    // Find the corresponding real match
    const realMatch = realData.find((m) => m.id === matchId);
    if (realMatch) {
      // If the match is already played and has a real winner,
      // we don't need to encode this pick in the URL because the resolver
      // will automatically lock and overwrite it with the real winner anyway.
      if (realMatch.winner !== null) {
        continue;
      }
    }

    optimizedPicks[matchId] = teamId;
  }

  // If there are no picks, return empty string
  if (Object.keys(optimizedPicks).length === 0) {
    return '';
  }

  const jsonStr = JSON.stringify(optimizedPicks);
  return LZString.compressToEncodedURIComponent(jsonStr);
}
