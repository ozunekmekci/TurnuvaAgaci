import LZString from 'lz-string';
import rawTournamentData from '../../../data/tournament-data.json';
import { RealMatch } from '../bracket/types';
import { resolveBracket } from '../bracket/resolve';
import { MATCH_ORDER } from './encode';

const realData = rawTournamentData as RealMatch[];

/**
 * Decodes a compressed URL-safe string back into the user picks object.
 * Supports both old LZString JSON formats (backward compatibility) and new base-36 binary choices.
 *
 * @param compressed The compressed string from URL parameter 'p'
 */
export function decodeUserPicks(compressed: string | null | undefined): Record<string, string> {
  if (!compressed) {
    return {};
  }

  // 1. Try old LZString decompression first for backward compatibility
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
    if (decompressed) {
      const parsed = JSON.parse(decompressed);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, string>;
      }
    }
  } catch (e) {
    // If it's not a valid LZString, proceed to base-36 decoding
  }

  // 2. Validate and decode as new base-36 compressed integer representing binary choices
  if (!/^[0-9a-z]+$/.test(compressed)) {
    return {};
  }

  try {
    let val = parseInt(compressed, 36);
    if (isNaN(val) || val < 0) {
      return {};
    }

    const reconstructed: Record<string, string> = {};

    for (let i = 0; i < MATCH_ORDER.length; i++) {
      const matchId = MATCH_ORDER[i];
      const digit = val % 3;
      val = Math.floor(val / 3);

      if (digit === 1 || digit === 2) {
        // Resolve the bracket up to this point to find the current home & away teams
        const resolved = resolveBracket(realData, reconstructed);
        const match = resolved.find((m) => m.matchId === matchId);
        if (match) {
          if (digit === 1 && match.homeTeam) {
            reconstructed[matchId] = match.homeTeam.id;
          } else if (digit === 2 && match.awayTeam) {
            reconstructed[matchId] = match.awayTeam.id;
          }
        }
      }
    }

    return reconstructed;
  } catch (error) {
    console.error('Error decoding user picks from URL:', error);
    return {};
  }
}
