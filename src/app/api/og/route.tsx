import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { decodeUserPicks } from '../../../lib/url-state/decode';
import { resolveBracket } from '../../../lib/bracket/resolve';
import { RealMatch, TeamRef } from '../../../lib/bracket/types';
import rawTournamentData from '../../../../data/tournament-data.json';

// Use Node.js runtime to read local font and logo files easily
export const runtime = 'nodejs';

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
    
    const finalistLeft = finalMatch?.homeTeam;
    const finalistRight = finalMatch?.awayTeam;

    // Load custom fonts from public directory
    const fontPath = path.join(process.cwd(), 'public/fonts/FWC2026-SemiExpandedBlack.ttf');
    const fontData = fs.readFileSync(fontPath);

    const fifaFontPath = path.join(process.cwd(), 'public/fonts/fifa-26.ttf');
    const fifaFontData = fs.readFileSync(fifaFontPath);

    // Load FIFA logo PNG from public directory and convert to base64 data URI
    const logoPath = path.join(process.cwd(), 'public/images/fifa-logo.png');
    const logoData = fs.readFileSync(logoPath);
    const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`;

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
            background: 'linear-gradient(to bottom, #0c0d10, #1d70e6)',
            padding: '50px 60px',
            color: '#f8fafc',
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
                  fontSize: '18px',
                  fontWeight: 900,
                  fontFamily: 'FWC2026',
                  color: '#94a3b8',
                  letterSpacing: '2px',
                }}
              >
                DÜNYA KUPASI
              </span>
              <span
                style={{
                  fontSize: '52px',
                  fontWeight: 900,
                  fontFamily: 'FIFA26',
                  color: '#f59e0b',
                  marginTop: '0px',
                  lineHeight: 1,
                }}
              >
                2026
              </span>
            </div>
            
            {/* FIFA Logo image from local base64 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoBase64}
              alt="FIFA Logo"
              style={{
                width: '68px',
                height: '84px',
                objectFit: 'contain',
              }}
            />
          </div>

          {/* Centerpiece: Symmetrical finals representation */}
          <div
            style={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-around',
              alignItems: 'center',
              marginTop: '10px',
              marginBottom: '10px',
            }}
          >
            {/* Left Finalist Column */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '260px',
                padding: '24px 20px',
                borderRadius: '24px',
                backgroundColor: '#151519',
                border: '2px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 800, fontFamily: 'FWC2026', color: '#94a3b8', marginBottom: '12px', letterSpacing: '1px' }}>
                FİNALİST (SOL)
              </span>
              {finalistLeft ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://flagcdn.com/w160/${finalistLeft.flagCode.toLowerCase()}.png`}
                    alt={finalistLeft.name}
                    width="84"
                    height="54"
                    style={{ objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)' }}
                  />
                  <span style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'FWC2026', color: '#ffffff', letterSpacing: '1px', textAlign: 'center' }}>
                    {finalistLeft.name.toUpperCase()}
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: '14px', color: '#64748b', fontStyle: 'italic', fontFamily: 'sans-serif' }}>Belirlenmedi</span>
              )}
            </div>

            {/* Central Champion Box */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '340px',
                padding: '30px 20px',
                borderRadius: '28px',
                backgroundColor: '#151519',
                border: champion ? '3px solid #f59e0b' : '2px dashed rgba(255, 255, 255, 0.1)',
                boxShadow: champion ? '0 0 35px rgba(245, 158, 11, 0.25)' : 'none',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 900,
                  fontFamily: 'FWC2026',
                  color: champion ? '#f59e0b' : '#64748b',
                  letterSpacing: '2px',
                  marginBottom: '12px',
                }}
              >
                ŞAMPİYON TAHMİNİM
              </span>
              {champion ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://flagcdn.com/w160/${champion.flagCode.toLowerCase()}.png`}
                    alt={champion.name}
                    width="100"
                    height="64"
                    style={{ objectFit: 'cover', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.4)' }}
                  />
                  <span style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'FWC2026', color: '#f59e0b', letterSpacing: '1px', textAlign: 'center' }}>
                    {champion.name.toUpperCase()}
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: '16px', color: '#475569', fontWeight: 600, fontFamily: 'sans-serif' }}>Henüz Seçilmedi</span>
              )}
            </div>

            {/* Right Finalist Column */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '260px',
                padding: '24px 20px',
                borderRadius: '24px',
                backgroundColor: '#151519',
                border: '2px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 800, fontFamily: 'FWC2026', color: '#94a3b8', marginBottom: '12px', letterSpacing: '1px' }}>
                FİNALİST (SAĞ)
              </span>
              {finalistRight ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://flagcdn.com/w160/${finalistRight.flagCode.toLowerCase()}.png`}
                    alt={finalistRight.name}
                    width="84"
                    height="54"
                    style={{ objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)' }}
                  />
                  <span style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'FWC2026', color: '#ffffff', letterSpacing: '1px', textAlign: 'center' }}>
                    {finalistRight.name.toUpperCase()}
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: '14px', color: '#64748b', fontStyle: 'italic', fontFamily: 'sans-serif' }}>Belirlenmedi</span>
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
              borderTop: '2px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '20px',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0', fontFamily: 'sans-serif', letterSpacing: '0.5px' }}>
              Sen de kendi tahminlerini oluşturmak ve paylaşmak için hemen ziyaret et!
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'FWC2026',
            data: fontData,
            weight: 900,
            style: 'normal',
          },
          {
            name: 'FIFA26',
            data: fifaFontData,
            weight: 900,
            style: 'normal',
          },
        ],
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
