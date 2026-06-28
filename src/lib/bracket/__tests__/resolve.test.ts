import { describe, expect, test } from 'vitest';
import { resolveBracket } from '../resolve';
import { RealMatch, TeamRef } from '../types';
import tournamentDataRaw from '../../../../data/tournament-data.json';

const baseRealData = tournamentDataRaw as RealMatch[];

// Helper to deep clone the base real data
const cloneRealData = (): RealMatch[] => JSON.parse(JSON.stringify(baseRealData));

describe('resolveBracket (Bracket Motoru)', () => {
  test('1. Hiçbir tahmin ve gerçek sonuç yokken (Boş durum)', () => {
    const realData = cloneRealData();
    const userPicks = {};

    const resolved = resolveBracket(realData, userPicks);

    // Son 32 maçları kontrolü (R32-1...16)
    const r32Matches = resolved.filter((m) => m.matchId.startsWith('R32-'));
    expect(r32Matches.length).toBe(16);
    r32Matches.forEach((match) => {
      expect(match.homeTeam).not.toBeNull();
      expect(match.awayTeam).not.toBeNull();
      expect(match.selectableTeams.length).toBe(2);
      expect(match.userPick).toBeNull();
      expect(match.isLocked).toBe(false);
    });

    // Üst tur maçları kontrolü (R16, QF, SF, F, 3RD)
    const upperMatches = resolved.filter((m) => !m.matchId.startsWith('R32-'));
    upperMatches.forEach((match) => {
      expect(match.homeTeam).toBeNull();
      expect(match.awayTeam).toBeNull();
      expect(match.selectableTeams.length).toBe(0);
      expect(match.userPick).toBeNull();
      expect(match.isLocked).toBe(false);
    });
  });

  test('2. Son 32 gerçek sonuçlarla oynandığında üst turların dolması', () => {
    const realData = cloneRealData();
    const userPicks = {};

    // Son 32 maçlarına sahte gerçek sonuçlar ekleyelim (Hep ev sahibi kazansın)
    realData.forEach((match) => {
      if (match.round === 'R32') {
        match.winner = match.homeTeam;
        match.playedAt = new Date().toISOString();
      }
    });

    const resolved = resolveBracket(realData, userPicks);

    // R32 kilitlenmeli ve userPick gerçek kazanan olmalı
    const r32Matches = resolved.filter((m) => m.matchId.startsWith('R32-'));
    r32Matches.forEach((match) => {
      expect(match.isLocked).toBe(true);
      expect(match.userPick?.id).toBe(match.homeTeam?.id);
    });

    // Son 16 (R16) takımları otomatik çözümlenmiş olmalı
    const r16Matches = resolved.filter((m) => m.matchId.startsWith('R16-'));
    expect(r16Matches.length).toBe(8);
    r16Matches.forEach((match) => {
      expect(match.homeTeam).not.toBeNull();
      expect(match.awayTeam).not.toBeNull();
      expect(match.selectableTeams.length).toBe(2);
      expect(match.userPick).toBeNull(); // Kullanıcı tahmini yok
    });

    // Çeyrek final (QF) ve üstü hala boş olmalı (Çünkü Son 16 oynanmadı ve tahmin yapılmadı)
    const qfMatches = resolved.filter((m) => m.matchId.startsWith('QF-'));
    qfMatches.forEach((match) => {
      expect(match.homeTeam).toBeNull();
      expect(match.awayTeam).toBeNull();
    });
  });

  test('3. Gerçek sonuç yokken kullanıcının tüm tahminleri doldurması', () => {
    const realData = cloneRealData();
    const userPicks: Record<string, string> = {};

    // R32-1: Güney Afrika (RSA) vs Kanada (CAN) -> Kullanıcı CAN seçsin
    const r32_1 = realData.find((m) => m.id === 'R32-1')!;
    userPicks['R32-1'] = 'CAN';

    // R32-3: Hollanda (NED) vs Fas (MAR) -> Kullanıcı MAR seçsin
    const r32_3 = realData.find((m) => m.id === 'R32-3')!;
    userPicks['R32-3'] = 'MAR';

    // R16-2: Winner of R32-1 (CAN) vs Winner of R32-3 (MAR) -> Kullanıcı CAN seçsin
    userPicks['R16-2'] = 'CAN';

    const resolved = resolveBracket(realData, userPicks);

    const resolved_r32_1 = resolved.find((m) => m.matchId === 'R32-1')!;
    expect(resolved_r32_1.userPick?.id).toBe('CAN');

    const resolved_r32_3 = resolved.find((m) => m.matchId === 'R32-3')!;
    expect(resolved_r32_3.userPick?.id).toBe('MAR');

    const resolved_r16_2 = resolved.find((m) => m.matchId === 'R16-2')!;
    expect(resolved_r16_2.homeTeam?.id).toBe('CAN'); // R32-1'den gelen varsayımsal tahmin
    expect(resolved_r16_2.awayTeam?.id).toBe('MAR'); // R32-3'ten gelen varsayımsal tahmin
    expect(resolved_r16_2.userPick?.id).toBe('CAN'); // R16-2 tahmini
    expect(resolved_r16_2.isLocked).toBe(false);
  });

  test('4. Geçersiz kılma (invalidation) senaryosu: Güney Afrika vs Kanada', () => {
    const realData = cloneRealData();
    const userPicks: Record<string, string> = {};

    // 1. R32-1 (RSA vs CAN) için kullanıcı RSA (Güney Afrika) seçsin
    userPicks['R32-1'] = 'RSA';
    // 2. R32-3 (NED vs MAR) için kullanıcı MAR seçsin
    userPicks['R32-3'] = 'MAR';
    // 3. R16-2 (RSA vs MAR olmasını bekliyor) için kullanıcı RSA seçsin
    userPicks['R16-2'] = 'RSA';
    // 4. QF-1 (W89 vs W90(R16-2)) için de kullanıcı RSA seçsin
    userPicks['QF-1'] = 'RSA';

    // ŞİMDİ GERÇEK DÜNYA SONUCU GELİYOR: Kanada (CAN) R32-1 maçını kazanıyor!
    const r32_1 = realData.find((m) => m.id === 'R32-1')!;
    r32_1.winner = { id: 'CAN', name: 'Kanada', flagCode: 'ca' };
    r32_1.playedAt = new Date().toISOString();

    const resolved = resolveBracket(realData, userPicks);

    // R32-1 kilitli olmalı ve gerçek kazanan CAN olmalı
    const resolved_r32_1 = resolved.find((m) => m.matchId === 'R32-1')!;
    expect(resolved_r32_1.isLocked).toBe(true);
    expect(resolved_r32_1.userPick?.id).toBe('CAN'); // Kullanıcı RSA seçmişti ama gerçek sonuç CAN ile ezildi

    // R16-2 maçı: homeTeam artık RSA değil gerçek kazanan CAN olmalı!
    const resolved_r16_2 = resolved.find((m) => m.matchId === 'R16-2')!;
    expect(resolved_r16_2.homeTeam?.id).toBe('CAN');
    expect(resolved_r16_2.awayTeam?.id).toBe('MAR'); // Bu değişmedi
    expect(resolved_r16_2.selectableTeams.map((t) => t.id)).toContain('CAN');
    expect(resolved_r16_2.selectableTeams.map((t) => t.id)).toContain('MAR');

    // R16-2 için kullanıcının RSA tahmini geçersiz olmalı (Çünkü RSA elendi, CAN çıktı)
    // Dolayısıyla userPick NULL olmalıdır!
    expect(resolved_r16_2.userPick).toBeNull();

    // Üst tur olan QF-1'deki RSA tahmini de otomatik zincirleme geçersiz kalıp null olmalı
    const resolved_qf_1 = resolved.find((m) => m.matchId === 'QF-1')!;
    expect(resolved_qf_1.userPick).toBeNull();
  });

  test('5. Turnuva tamamen bittiğinde şampiyonun kilitlenmesi', () => {
    const realData = cloneRealData();
    const userPicks: Record<string, string> = {};

    // Tüm maçları oynanmış yapalım ve ev sahipleri kazansın
    realData.forEach((match) => {
      match.winner = match.homeTeam || { id: 'DUMMY', name: 'Dummy', flagCode: 'dm' };
      match.playedAt = new Date().toISOString();
    });

    // Kullanıcı deplasman takımlarını seçmiş olsun (Farklı tahminler)
    realData.forEach((match) => {
      userPicks[match.id] = match.awayTeam?.id || 'DUMMY_AWAY';
    });

    const resolved = resolveBracket(realData, userPicks);

    // Her şey kilitli olmalı ve tahminler gerçek kazananlarla ezilmiş olmalı
    resolved.forEach((match) => {
      expect(match.isLocked).toBe(true);
      const originalMatch = realData.find((m) => m.id === match.matchId)!;
      expect(match.userPick?.id).toBe(originalMatch.winner?.id);
    });

    // Şampiyon maçı (F-1) kontrolü
    const finalMatch = resolved.find((m) => m.matchId === 'F-1')!;
    const originalFinal = realData.find((m) => m.id === 'F-1')!;
    expect(finalMatch.isLocked).toBe(true);
    expect(finalMatch.userPick).not.toBeNull();
    expect(finalMatch.userPick?.id).toBe(originalFinal.winner?.id);
  });
});
