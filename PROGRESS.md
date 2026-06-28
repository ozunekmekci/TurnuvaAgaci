# PROGRESS — Turnuva Tahmin Uygulaması

Bu dosya projenin "nerede olduğumuz" kaydıdır. SYSTEM_PROMPT.md'nin tersine bu dosya SÜREKLİ güncellenir. Her oturum:

1. Önce bu dosyanın en altındaki "Oturum Günlüğü"nü ve "Şu An Aktif Sprint"i oku.
2. SYSTEM_PROMPT.md'yi oku (kararlar değişmez, ama unutmuş olabilirsin).
3. Çalış.
4. Bitirmeden önce bu dosyada: ilgili checklist kutucuklarını işaretle, "Şu An Aktif Sprint"i güncelle, "Oturum Günlüğü"ne yeni bir kayıt ekle, varsa "Açık Sorular"a ekleme yap.

Kural: Bir sprint'teki tüm kutucuklar işaretlenmeden bir sonraki sprint'e geçilmez. Bracket motoru testleri yeşil olmadan UI sprintine geçilmez.

---

## Şu An Aktif Sprint

**Sprint 8 — Cila: gerçek veriyle uçtan uca test, performans, deploy** (devam ediyor)

---

## Genel İlerleme Haritası

- [x] Sprint 0 — Proje iskeleti ve temel kurulum
- [x] Sprint 1 — Veri modeli ve sync script
- [x] Sprint 2 — Bracket motoru (saf mantık + testler)
- [x] Sprint 3 — URL-state katmanı
- [x] Sprint 4 — Bracket UI (statik, etkileşimsiz görünüm)
- [x] Sprint 5 — Bracket UI etkileşimi (seçim, kilitleme, geçersiz kılma animasyonu)
- [x] Sprint 6 — Paylaşım (X.com intent + OG image + native share)
- [x] Sprint 7 — Responsive/mobil düzen
- [/] Sprint 8 — Cila: gerçek veriyle uçtan uca test, performans, deploy

---

## Sprint Detayları

### Sprint 0 — Proje İskeleti

- [x] `create-next-app` ile TypeScript + Tailwind + App Router projesi oluştur.
- [x] npm kullanıldı, `package.json` script'lerini düzenle (`dev`, `build`, `test`, `sync-data`).
- [x] Vitest kurulumu (`vitest`, `@vitest/ui` opsiyonel).
- [x] Temel klasör yapısını oluştur.
- [x] `.gitignore`, temel `README.md` (proje açıklaması + nasıl çalıştırılır).
- [x] Vercel'e ilk boş deploy (placeholder sayfa) — pipeline çalıştığını doğrula.

### Sprint 1 — Veri Modeli ve Sync Script

- [x] SYSTEM_PROMPT.md Bölüm 4.1'deki `RealMatch` ve `TeamRef` tiplerini `src/lib/bracket/types.ts`'te tanımla.
- [x] 2026 Dünya Kupası Son 32 kadrosunu ve eşleşme ağacını (hangi Son 32 maçı hangi Son 16 slotuna besliyor, vs.) `tournament-data.json`'a elle/script ile doldur — bu, openfootball/worldcup.json'dan çekilecek.
- [x] `team-mapping.json'ı doldur: her takım için İngilizce kaynak adı → Türkçe görünen ad + bayrak kodu.
- [x] `scripts/sync-tournament-data.ts` yaz: openfootball/worldcup.json kaynağını çekip kendi formatımıza dönüştürsün, `tournament-data.json`'ı güncellesin. Eşleşmeyen takım adında HATA fırlatsın (sessiz geçmesin).
- [x] Script'i elle çalıştırıp çıktıyı doğrula (`npm run sync-data`).
- [x] **Doğrulama testi:** Script'i şu an gerçek Son 32 verisiyle çalıştır, görseldeki/gerçek 2026 WC Son 32 eşleşmeleriyle bire bir örtüştüğünü gözle kontrol et.

### Sprint 2 — Bracket Motoru

- [x] `resolveBracket(realData, userPicks)` fonksiyonunu SYSTEM_PROMPT.md Bölüm 4.2'deki algoritmaya göre `src/lib/bracket/resolve.ts`'te yaz.
- [x] Altın kural olarak "gerçek sonuç > kullanıcı tahmini" önceliğinin kod genelinde tek bir noktadan (yardımcı fonksiyon) uygulandığından emin ol — bu mantığı iki yerde tekrar yazma.
- [x] SYSTEM_PROMPT.md Bölüm 4.3'teki TÜM test senaryolarını Vitest ile yaz:
  - [x] Boş durum testi
  - [x] Son 32 oynanmış, üst tur boş testi
  - [x] Tüm turlar kullanıcı tahminiyle dolu, gerçek sonuç yok testi
  - [x] **Ana senaryo:** Güney Afrika/Kanada zincirleme geçersiz kılma testi
  - [x] Turnuva bitmiş, şampiyon otomatik belirleniyor testi
- [x] `npm run test` tamamen yeşil olmadan bu sprint kapanmaz.

### Sprint 3 — URL-State Katmanı

- [x] `lz-string` kütüphanesini ekle.
- [x] `src/lib/url-state/encode.ts` ve `decode.ts`: `userPicks` ↔ `?p=...` dönüşümü.
- [x] Encode öncesi "gerçek sonuçla aynı olan veya boş slotları temizleme" optimizasyonunu uygula (SYSTEM_PROMPT.md Bölüm 5).
- [x] Bir React hook (`useUserPicks`) yaz: URL'i okur, state'i tutar, her değişiklikte `router.replace` ile URL'i günceller.
- [x] Test: bir `userPicks` objesini encode edip decode ettiğinde aynı objeyi geri verdiğini doğrulayan round-trip testi.

### Sprint 4 — Bracket UI (Statik Görünüm)

- [x] `frontend-design` skill'ini incele, marka/renk/tipografi yönünü belirle (SYSTEM_PROMPT.md Bölüm 6 son madde).
- [x] `MatchCard` bileşeni: 5 görsel duruma göre (bekliyor/seçilebilir/seçilmiş/kilitli/geçersiz kılınmış) render.
- [x] `BracketColumn`, `BracketSide` (sol/sağ blok), `FinalCenterpiece` (final + 3.lük + şampiyon kutusu) bileşeni.
- [x] Sahte (mock) veriyle TÜM görsel durumları ekranda gösterecek bir test sayfası/Storybook benzeri görünüm oluştur — gerçek motor bağlanmadan önce tasarım onayı için.
- [x] Bu sprintte HENÜZ tıklama/etkileşim yok, sadece statik render.

### Sprint 5 — Bracket UI Etkileşimi

- [x] `resolveBracket` motorunu UI'ya bağla (gerçek `tournament-data.json` + `useUserPicks` state'i).
- [x] Maça tıklayınca seçim yapma akışı.
- [x] Kilitli slotlara tıklama engellensin, görsel olarak net "kilitli" hissi versin.
- [x] Geçersiz kılınan tahminler için highlight/pulse animasyonu (Framer Motion) + kısa açıklama tooltip'i.
- [x] Şampiyon kutusunun motor çıkışına göre dinamik güncellenmesi.

### Sprint 6 — Paylaşım (X.com intent + OG image + native share)

- [x] X.com intent linki: güncel URL-state linkini ve özet metni (`"Tahminim: Şampiyon Arjantin! Sen de tahmin et:"` gibi) intent URL'ine göm.
- [x] `@vercel/og` ile bir API route (`/app/api/og/route.tsx`): URL-state'i parametre alıp bracket özetinin PNG görselini üretsin.
- [x] Instagram paylaşımı: mobilde `navigator.share` (Web Share API) ile native paylaşım sheet'i; masaüstünde görseli indirme butonu.
- [x] Paylaşım görselinin tasarımı: şampiyon + öne çıkan tahminler, marka/logo, link/QR (opsiyonel).

### Sprint 7 — Responsive/Mobil

- [x] Bracket'in mobilde yatay scroll davranışı.
- [x] "Şu an hangi turdasın" mini breadcrumb/harita bileşeni.
- [x] Dokunma hedeflerinin (tap targets) mobilde yeterince büyük olduğunu doğrula.
- [x] Paylaşım akışının mobilde gerçek cihazda (veya tarayıcı dev tools mobil emülasyonunda) test edilmesi.

### Sprint 8 — Cila ve Yayın

- [ ] Gerçek `tournament-data.json` ile (sync script'in gerçek çıktısıyla) uçtan uca manuel test: birkaç maçı "oynanmış" gibi işaretleyip geçersiz kılma zincirinin doğru çalıştığını gözle doğrula.
- [ ] Lighthouse/performans kontrolü (özellikle OG image route'unun gecikmesi).
- [ ] SEO/meta etiketleri, favicon, başlık.
- [ ] Üretim Vercel deploy'u, custom domain (varsa) bağlama.
- [ ] SYSTEM_PROMPT.md Bölüm 7'deki "v2 fikirleri" listesini bu dosyanın en altına ayrı bir bölüm olarak taşı (gelecek referans için).

---

## Açık Sorular

> Agent bir karar veremediğinde veya kullanıcıdan netleştirme gerektiğinde buraya ekler. Kullanıcı cevapladığında madde silinir ve gerekirse SYSTEM_PROMPT.md'ye kalıcı karar olarak işlenir.

- (henüz yok)

---

## Oturum Günlüğü

> En yeni kayıt en üstte. Format: `### [Tarih] — [Kısa başlık]` + ne yapıldı, ne kaldı, dikkat edilmesi gereken nokta.

### [Henüz başlanmadı]

Proje başlatılmadı. İlk oturumda Sprint 0'dan başla.
