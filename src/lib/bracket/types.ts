export type TeamRef = {
  id: string;       // FIFA kodu, örn. "ARG"
  name: string;      // Türkçe görünen ad, örn. "Arjantin"
  flagCode: string;   // bayrak için ülke kodu, örn. "ar"
};

export type Round = "R32" | "R16" | "QF" | "SF" | "F" | "3RD";

export type MatchSource = {
  matchId: string;          // Hangi maçtan geldiği, örn. "R32-1"
  type: "WINNER" | "LOSER"; // Kazanan mı kaybeden mi?
};

export type RealMatch = {
  id: string;                         // örn. "R32-1"
  round: Round;                       // "R32" | "R16" | "QF" | "SF" | "F" | "3RD"
  slot: number;                       // o turda kaçıncı eşleşme (bracket pozisyonu için)
  side: "LEFT" | "RIGHT" | "CENTER";  // görseldeki sol/sağ/orta blok
  homeTeam: TeamRef | null;           // null = henüz belirlenmedi
  awayTeam: TeamRef | null;
  homeSource: MatchSource | null;     // bu slotun takımı nereden geliyor
  awaySource: MatchSource | null;
  winner: TeamRef | null;             // GERÇEK sonuç. null = henüz oynanmadı
  playedAt: string | null;            // ISO tarih/saat, UI'da "oynandı" rozeti için
};
