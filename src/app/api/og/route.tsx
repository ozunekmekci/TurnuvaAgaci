import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { decodeUserPicks } from '../../../lib/url-state/decode';
import { resolveBracket } from '../../../lib/bracket/resolve';
import { RealMatch, TeamRef } from '../../../lib/bracket/types';
import rawTournamentData from '../../../../data/tournament-data.json';

export const runtime = 'edge';

const realData = rawTournamentData as RealMatch[];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const p = searchParams.get('p');

    // Decode and resolve bracket
    const userPicks = decodeUserPicks(p);
    const resolvedMatches = resolveBracket(realData, userPicks);

    // Get final match and champion
    const finalMatch = resolvedMatches.find((m) => m.matchId === 'F-1');
    const champion: TeamRef | null = finalMatch?.userPick || null;

    // Get semi-finalists (winners of QF-1, QF-2, QF-3, QF-4 or teams in SF-1, SF-2)
    const sf1 = resolvedMatches.find((m) => m.matchId === 'SF-1');
    const sf2 = resolvedMatches.find((m) => m.matchId === 'SF-2');
    
    const finalistLeft = finalMatch?.homeTeam;
    const finalistRight = finalMatch?.awayTeam;

    // Standard 1200x630 open graph image response using Satori
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to bottom, #0b0d17, #16192b)',
            padding: '50px 60px',
            color: '#f8fafc',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Top Logo / App Name */}
          <div
            style={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  letterSpacing: '3px',
                  color: '#94a3b8',
                }}
              >
                FIFA DÜNYA KUPASI 2026
              </span>
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: 900,
                  color: '#ffffff',
                  marginTop: '4px',
                  letterSpacing: '1px',
                }}
              >
                TAHMİN AĞACIM
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                padding: '6px 16px',
                borderRadius: '12px',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                color: '#f59e0b',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '1px',
              }}
            >
              akiloyunu.com/turnuva-tahmini
            </div>
          </div>

          {/* Centerpiece: Symmetrical finals representation */}
          <div
            style={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-around',
              alignItems: 'center',
              marginTop: '20px',
              marginBottom: '20px',
            }}
          >
            {/* Left Finalist Column */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '240px',
                padding: '20px',
                borderRadius: '20px',
                backgroundColor: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px', letterSpacing: '1px' }}>
                FİNALİST (SOL)
              </span>
              {finalistLeft ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://flagcdn.com/${finalistLeft.flagCode.toLowerCase()}.svg`}
                    alt={finalistLeft.name}
                    width="70"
                    height="45"
                    style={{ objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#e2e8f0' }}>{finalistLeft.name}</span>
                </div>
              ) : (
                <span style={{ fontSize: '14px', color: '#64748b', fontStyle: 'italic' }}>Belirlenmedi</span>
              )}
            </div>

            {/* Central Champion Box */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '320px',
                padding: '30px 20px',
                borderRadius: '24px',
                backgroundColor: champion ? 'rgba(245, 158, 11, 0.08)' : 'rgba(30, 41, 59, 0.2)',
                border: champion ? '2px solid #f59e0b' : '1px dashed rgba(255, 255, 255, 0.1)',
                boxShadow: champion ? '0 0 30px rgba(245, 158, 11, 0.2)' : 'none',
              }}
            >
              <svg
                width="70"
                height="70"
                viewBox="0 0 24 24"
                fill="none"
                stroke={champion ? '#f59e0b' : '#475569'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginBottom: '15px' }}
              >
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
                <path d="M12 2a6 6 0 0 0-6 6v3.5c0 1.63 1.3 3 2.97 3h6.06c1.67 0 2.97-1.37 2.97-3V8a6 6 0 0 0-6-6z" />
              </svg>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: champion ? '#f59e0b' : '#64748b',
                  letterSpacing: '3px',
                  marginBottom: '6px',
                }}
              >
                ŞAMPİYON TAHMİNİM
              </span>
              {champion ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://flagcdn.com/${champion.flagCode.toLowerCase()}.svg`}
                    alt={champion.name}
                    width="90"
                    height="58"
                    style={{ objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.3)' }}
                  />
                  <span style={{ fontSize: '24px', fontWeight: 900, color: '#f59e0b' }}>{champion.name}</span>
                </div>
              ) : (
                <span style={{ fontSize: '16px', color: '#475569', fontWeight: 600 }}>Henüz Seçilmedi</span>
              )}
            </div>

            {/* Right Finalist Column */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '240px',
                padding: '20px',
                borderRadius: '20px',
                backgroundColor: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px', letterSpacing: '1px' }}>
                FİNALİST (SAĞ)
              </span>
              {finalistRight ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://flagcdn.com/${finalistRight.flagCode.toLowerCase()}.svg`}
                    alt={finalistRight.name}
                    width="70"
                    height="45"
                    style={{ objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#e2e8f0' }}>{finalistRight.name}</span>
                </div>
              ) : (
                <span style={{ fontSize: '14px', color: '#64748b', fontStyle: 'italic' }}>Belirlenmedi</span>
              )}
            </div>
          </div>

          {/* Bottom call to action */}
          <div
            style={{
              display: 'flex',
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              paddingTop: '20px',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>
              Sen de kendi tahminlerini oluşturmak için hemen ziyaret et!
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
