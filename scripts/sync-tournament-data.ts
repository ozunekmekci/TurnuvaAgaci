import * as fs from 'fs';
import * as path from 'path';
import { RealMatch, TeamRef, Round, MatchSource } from '../src/lib/bracket/types';

const SOURCE_URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';
const DATA_DIR = path.join(__dirname, '../data');
const SOURCE_FILE_PATH = path.join(DATA_DIR, 'worldcup-source.json');
const MAPPING_FILE_PATH = path.join(DATA_DIR, 'team-mapping.json');
const OUTPUT_FILE_PATH = path.join(DATA_DIR, 'tournament-data.json');

// Helper to map match number to round type
function getRound(num: number): Round {
  if (num >= 73 && num <= 88) return 'R32';
  if (num >= 89 && num <= 96) return 'R16';
  if (num >= 97 && num <= 100) return 'QF';
  if (num >= 101 && num <= 102) return 'SF';
  if (num === 103) return '3RD';
  if (num === 104) return 'F';
  throw new Error(`Invalid match number: ${num}`);
}

// Helper to map match number to match id
function getMatchIdByNum(num: number): string {
  const round = getRound(num);
  if (round === 'R32') return `R32-${num - 72}`;
  if (round === 'R16') return `R16-${num - 88}`;
  if (round === 'QF') return `QF-${num - 96}`;
  if (round === 'SF') return `SF-${num - 100}`;
  if (round === '3RD') return '3RD-1';
  if (round === 'F') return 'F-1';
  throw new Error(`Invalid match number: ${num}`);
}

// Helper to map match number to slot (index within round)
function getSlotByNum(num: number): number {
  const round = getRound(num);
  if (round === 'R32') return num - 72;
  if (round === 'R16') return num - 88;
  if (round === 'QF') return num - 96;
  if (round === 'SF') return num - 100;
  return 1;
}

// Helper to determine side (LEFT, RIGHT, CENTER)
function getSideByNum(num: number): 'LEFT' | 'RIGHT' | 'CENTER' {
  const leftNums = [
    73, 74, 75, 77, 81, 82, 83, 84, // R32 Left
    89, 90, 93, 94,                 // R16 Left
    97, 98,                         // QF Left
    101                             // SF Left
  ];
  if (leftNums.includes(num)) return 'LEFT';
  if (num === 103 || num === 104) return 'CENTER';
  return 'RIGHT';
}

async function run() {
  console.log('Starting tournament data synchronization...');

  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Load team mapping
  if (!fs.existsSync(MAPPING_FILE_PATH)) {
    throw new Error(`Mapping file not found at: ${MAPPING_FILE_PATH}`);
  }
  const mappingData = JSON.parse(fs.readFileSync(MAPPING_FILE_PATH, 'utf8'));

  // Try to fetch source data, fallback to local copy if offline
  let rawDataStr = '';
  try {
    console.log(`Fetching latest tournament data from: ${SOURCE_URL}`);
    const response = await fetch(SOURCE_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    rawDataStr = await response.text();
    // Cache it locally
    fs.writeFileSync(SOURCE_FILE_PATH, rawDataStr, 'utf8');
    console.log('Saved a copy of the source data locally.');
  } catch (error) {
    console.warn('Could not fetch online data, falling back to local file. Error:', (error as Error).message);
    if (fs.existsSync(SOURCE_FILE_PATH)) {
      rawDataStr = fs.readFileSync(SOURCE_FILE_PATH, 'utf8');
    } else {
      throw new Error(`No local source copy found at: ${SOURCE_FILE_PATH}`);
    }
  }

  const rawJson = JSON.parse(rawDataStr);
  if (!rawJson.matches || !Array.isArray(rawJson.matches)) {
    throw new Error('Invalid source JSON structure: "matches" array not found.');
  }

  // Filter for knockout matches (num >= 73)
  const knockoutMatches = rawJson.matches.filter((m: any) => m.num && m.num >= 73 && m.num <= 104);
  console.log(`Found ${knockoutMatches.length} knockout matches (num 73 to 104).`);

  const matchesMap = new Map<string, RealMatch>();

  // First pass: Parse basic match details and initial teams/sources
  for (const rawMatch of knockoutMatches) {
    const num = rawMatch.num;
    const matchId = getMatchIdByNum(num);
    const round = getRound(num);
    const slot = getSlotByNum(num);
    const side = getSideByNum(num);

    let homeTeam: TeamRef | null = null;
    let awayTeam: TeamRef | null = null;
    let homeSource: MatchSource | null = null;
    let awaySource: MatchSource | null = null;

    // Parse team 1 (home)
    const team1Str = rawMatch.team1;
    if (team1Str.startsWith('W') || team1Str.startsWith('L')) {
      const srcNum = parseInt(team1Str.substring(1), 10);
      homeSource = {
        matchId: getMatchIdByNum(srcNum),
        type: team1Str.startsWith('W') ? 'WINNER' : 'LOSER',
      };
    } else {
      const mapped = mappingData[team1Str];
      if (!mapped) {
        throw new Error(`Team name "${team1Str}" is not defined in team-mapping.json`);
      }
      homeTeam = mapped;
    }

    // Parse team 2 (away)
    const team2Str = rawMatch.team2;
    if (team2Str.startsWith('W') || team2Str.startsWith('L')) {
      const srcNum = parseInt(team2Str.substring(1), 10);
      awaySource = {
        matchId: getMatchIdByNum(srcNum),
        type: team2Str.startsWith('W') ? 'WINNER' : 'LOSER',
      };
    } else {
      const mapped = mappingData[team2Str];
      if (!mapped) {
        throw new Error(`Team name "${team2Str}" is not defined in team-mapping.json`);
      }
      awayTeam = mapped;
    }

    // Parse winner and played status if score exists
    let winner: TeamRef | null = null;
    let playedAt: string | null = null;

    if (rawMatch.score) {
      playedAt = rawMatch.date ? new Date(rawMatch.date).toISOString() : new Date().toISOString();
      const score = rawMatch.score;

      // Determine winner based on score
      // Check penalty shootout score first
      if (score.p) {
        if (score.p[0] > score.p[1]) {
          winner = homeTeam;
        } else if (score.p[1] > score.p[0]) {
          winner = awayTeam;
        }
      }
      // Check extra-time score next
      else if (score.et) {
        if (score.et[0] > score.et[1]) {
          winner = homeTeam;
        } else if (score.et[1] > score.et[0]) {
          winner = awayTeam;
        }
      }
      // Check regular full-time score
      else if (score.ft) {
        if (score.ft[0] > score.ft[1]) {
          winner = homeTeam;
        } else if (score.ft[1] > score.ft[0]) {
          winner = awayTeam;
        }
      }

      if (rawMatch.score && !winner && homeTeam && awayTeam) {
        // Fallback or score was tie and no penalty result was parsed
        console.warn(`Warning: Match ${matchId} has score but winner could not be determined automatically.`);
      }
    }

    const match: RealMatch = {
      id: matchId,
      round,
      slot,
      side,
      homeTeam,
      awayTeam,
      homeSource,
      awaySource,
      winner,
      playedAt,
    };

    matchesMap.set(matchId, match);
  }

  // Second pass: Perform a dependency resolution loop to populate homeTeam/awayTeam
  // when their source matches have already been played.
  // Run it 5 times (max depth of bracket tree is 5).
  for (let iter = 0; iter < 5; iter++) {
    let resolvedAny = false;

    for (const [_, match] of matchesMap) {
      // Resolve home team if null and source is present
      if (!match.homeTeam && match.homeSource) {
        const sourceMatch = matchesMap.get(match.homeSource.matchId);
        if (sourceMatch && sourceMatch.winner) {
          if (match.homeSource.type === 'WINNER') {
            match.homeTeam = sourceMatch.winner;
            resolvedAny = true;
          } else {
            // LOSER
            const loser = sourceMatch.winner.id === sourceMatch.homeTeam?.id
              ? sourceMatch.awayTeam
              : sourceMatch.homeTeam;
            if (loser) {
              match.homeTeam = loser;
              resolvedAny = true;
            }
          }
        }
      }

      // Resolve away team if null and source is present
      if (!match.awayTeam && match.awaySource) {
        const sourceMatch = matchesMap.get(match.awaySource.matchId);
        if (sourceMatch && sourceMatch.winner) {
          if (match.awaySource.type === 'WINNER') {
            match.awayTeam = sourceMatch.winner;
            resolvedAny = true;
          } else {
            // LOSER
            const loser = sourceMatch.winner.id === sourceMatch.homeTeam?.id
              ? sourceMatch.awayTeam
              : sourceMatch.homeTeam;
            if (loser) {
              match.awayTeam = loser;
              resolvedAny = true;
            }
          }
        }
      }

      // If homeTeam and awayTeam have been resolved, and the raw match has a score,
      // re-determine the winner (since now we have real team objects instead of nulls)
      if (match.homeTeam && match.awayTeam && !match.winner) {
        const rawMatch = knockoutMatches.find((m: any) => getMatchIdByNum(m.num) === match.id);
        if (rawMatch && rawMatch.score) {
          const score = rawMatch.score;
          if (score.p) {
            match.winner = score.p[0] > score.p[1] ? match.homeTeam : match.awayTeam;
          } else if (score.et) {
            match.winner = score.et[0] > score.et[1] ? match.homeTeam : match.awayTeam;
          } else if (score.ft) {
            match.winner = score.ft[0] > score.ft[1] ? match.homeTeam : match.awayTeam;
          }
        }
      }
    }

    if (!resolvedAny) break;
  }

  // Convert map to array and sort by match number
  const matchesList = Array.from(matchesMap.values()).sort((a, b) => {
    // Sort logic to match 73 to 104 order
    const getNumFromId = (id: string) => {
      const parts = id.split('-');
      const type = parts[0];
      const index = parseInt(parts[1], 10);
      if (type === 'R32') return 72 + index;
      if (type === 'R16') return 88 + index;
      if (type === 'QF') return 96 + index;
      if (type === 'SF') return 100 + index;
      if (type === '3RD') return 103;
      if (type === 'F') return 104;
      return 999;
    };
    return getNumFromId(a.id) - getNumFromId(b.id);
  });

  // Write to output file
  fs.writeFileSync(OUTPUT_FILE_PATH, JSON.stringify(matchesList, null, 2), 'utf8');
  console.log(`Successfully generated tournament data file with ${matchesList.length} matches.`);
  console.log(`Output written to: ${OUTPUT_FILE_PATH}`);
}

run().catch((err) => {
  console.error('Error running synchronization script:', err);
  process.exit(1);
});
