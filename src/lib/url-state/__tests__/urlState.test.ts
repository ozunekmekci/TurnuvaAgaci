import { describe, expect, test } from 'vitest';
import { encodeUserPicks } from '../encode';
import { decodeUserPicks } from '../decode';
import { RealMatch } from '../../bracket/types';

// Mock real tournament data
const mockRealData: RealMatch[] = [
  {
    id: 'R32-1',
    round: 'R32',
    slot: 1,
    side: 'LEFT',
    homeTeam: { id: 'RSA', name: 'Güney Afrika', flagCode: 'za' },
    awayTeam: { id: 'CAN', name: 'Kanada', flagCode: 'ca' },
    homeSource: null,
    awaySource: null,
    winner: null, // Not played
    playedAt: null,
  },
  {
    id: 'R32-2',
    round: 'R32',
    slot: 2,
    side: 'LEFT',
    homeTeam: { id: 'GER', name: 'Almanya', flagCode: 'de' },
    awayTeam: { id: 'PAR', name: 'Paraguay', flagCode: 'py' },
    homeSource: null,
    awaySource: null,
    winner: { id: 'GER', name: 'Almanya', flagCode: 'de' }, // Played!
    playedAt: '2026-06-29T16:30:00Z',
  },
];

describe('URL-State Sıkıştırma ve Çözümleme', () => {
  test('1. Temel round-trip testi', () => {
    const userPicks = {
      'R32-1': 'CAN',
    };

    const encoded = encodeUserPicks(userPicks, mockRealData);
    expect(encoded).not.toBe('');

    const decoded = decodeUserPicks(encoded);
    expect(decoded).toEqual({
      'R32-1': 'CAN',
    });
  });

  test('2. Boş tahminlerin URL\'den temizlenmesi', () => {
    const userPicks = {
      'R32-1': '',
      'R32-2': '',
    };

    const encoded = encodeUserPicks(userPicks, mockRealData);
    expect(encoded).toBe('');

    const decoded = decodeUserPicks(encoded);
    expect(decoded).toEqual({});
  });

  test('3. Gerçekleşmiş/Kilitlenmiş maç tahminlerinin URL\'den temizlenmesi', () => {
    const userPicks = {
      'R32-1': 'CAN', // Not played - should keep
      'R32-2': 'GER', // Played - should remove
    };

    const encoded = encodeUserPicks(userPicks, mockRealData);
    const decoded = decodeUserPicks(encoded);

    // R32-2 elenmeli, çünkü zaten oynandı ve kazanan GER olarak tescillendi
    expect(decoded).toEqual({
      'R32-1': 'CAN',
    });
  });

  test('4. Geçersiz/Bozuk sıkıştırılmış stringlerin hata vermeden çözülmesi', () => {
    const decodedEmpty = decodeUserPicks('');
    expect(decodedEmpty).toEqual({});

    const decodedNull = decodeUserPicks(null);
    expect(decodedNull).toEqual({});

    const decodedInvalid = decodeUserPicks('geçersiz-sıkıştırılmış-veri-123!!!');
    expect(decodedInvalid).toEqual({});
  });
});
