# SYSTEM PROMPT — Turnuva Tahmin Uygulaması ("Bracket Predictor")

Bu dosya, bu projede çalışan AI kodlama ajanının değişmez referans dokümanıdır. Her oturuma bu dosyayı okuyarak başla. PROGRESS.md ile birlikte kullanılır: bu dosya "NE ve NEDEN", PROGRESS.md "NEREDEYİZ ve SIRADA NE VAR" sorularını cevaplar.

Agent stateless çalışır: her oturumda hafızan sıfırlanır. Bu yüzden hiçbir kararı "hatırlamana" güvenme — bu dosyada ve PROGRESS.md'de yazmayan hiçbir şey gerçek değildir. Belirsiz bir noktaya geldiğinde varsayımda bulunmak yerine PROGRESS.md'ye "AÇIK SORU" olarak not düş ve en mantıklı varsayımla devam et.

---

## 1. Proje Vizyonu

Kullanıcıların bir futbol turnuvası (şu an: 2026 FIFA Dünya Kupası, Son 32 aşamasından itibaren) için eleme turlarını baştan sona tahmin edebildiği, bu tahminleri tek bir link ile X.com ve Instagram'da kolayca paylaşabildiği bir web uygulaması.

Referans tasarım: https://www.akiloyunu.com/turnuva-tahmini (ekran görüntüsü ayrıca verilmiştir). Klasik simetrik bracket görünümü: solda ve sağda Son 32 → Son 16 → Çeyrek Final → Yarı Final, ortada Final + 3.lük maçı, kazanan kupa ikonu.

### Bu projeyi sıradan bir "bracket maker" uygulamasından ayıran temel özellik

Bu **statik bir tahmin formu değil, gerçek turnuvayla senkronize çalışan bir simülasyon motorudur.**

Gerçek hayatta bir maç oynanıp sonuçlandığında (örn. Güney Afrika - Kanada maçını Kanada kazandı), sistem:
1. O eşleşmeyi otomatik olarak gerçek sonuca göre kilitler (kullanıcı artık o maç için tahmin değiştiremez).
2. Kullanıcının daha önce o slotta "kaybeden" takımı (Güney Afrika) seçmiş olabileceği TÜM üst tur tahminlerini geçersiz kılar — çünkü Güney Afrika'nın çeyrek finale çıkması artık imkansızdır.
3. Geçersiz kılınan üst tur slotlarını "tahmin bekleniyor" durumuna döndürür, kullanıcıya yalnızca hâlâ matematiksel olarak mümkün olan seçenekleri sunar.
4. Kullanıcı kalan turlar için tahminini tamamlayıp güncel halini yeniden paylaşabilir.

Bu, projenin kalbidir. Aşağıdaki "Bracket Motoru" bölümü bunu detaylandırır.

---

## 2. Teknoloji Yığını (Zorunlu Kararlar)

Bunlar tartışmaya açık değildir, agent başka bir kütüphane/yaklaşım önermeden bunları kullanır:

- **Framework:** Next.js 14+ (App Router), TypeScript (strict mode).
- **Stil:** Tailwind CSS. Ek olarak `shadcn/ui` bileşenleri kullanılabilir (buton, dialog, tooltip gibi temel öğeler için), ama bracket'in kendisi özel tasarım gerektirdiği için custom component olacak.
- **Animasyon:** Framer Motion (kazanan seçildiğinde, slot kilitlenince, sonuç güncellenince geçiş animasyonları için).
- **State yönetimi:** Sunucu yok, veritabanı yok, login yok. Tüm kullanıcı tahmini istemci tarafında üretilir ve URL query param'ına sıkıştırılarak yazılır (bkz. Bölüm 5).
- **Hosting:** Vercel. Sunucusuz (serverless/static) bir mimari; herhangi bir backend servisi, API route'u sadece OG image üretimi ve (varsa) turnuva verisi senkronizasyon scripti için kullanılır, kalıcı veri tutmaz.
- **Paket yöneticisi:** pnpm (yoksa npm kabul edilir, ama tutarlı kalınmalı).
- **Test:** Bracket motoru (Bölüm 4) saf fonksiyonlardan oluştuğu için Vitest ile unit test yazılmalı. UI testi şart değil ama motor mantığı test edilmeden "tamamlandı" sayılmaz.

---

## 3. Turnuva Verisi Kaynağı

Resmi, ücretsiz ve canlı bir FIFA API'si yoktur. Araştırma sonucu seçilen kaynak:

**openfootball/worldcup.json** — https://github.com/openfootball/worldcup.json
- Public domain, API key gerektirmez.
- 2026 Dünya Kupası dahil tüm turnuva verisi JSON olarak mevcut.
- Üst kaynak metin dosyaları (`cup.txt`, `cup_finals.txt`) elle güncellenir, günde ~1 kez; bizim kullanım senaryomuz (anlık canlı skor değil, "maç bitti mi, kazanan kim") için yeterlidir.

### Veri akışı

1. Bu kaynaktan veri çekip bizim kendi normalize formatımıza (`tournament-data.json` — bkz. Bölüm 4) dönüştüren bir script yazılacak: `scripts/sync-tournament-data.ts`.
2. Bu script ilk aşamada **elle çalıştırılan bir komut** olacak (`pnpm sync-data`). İleride bir GitHub Action / Vercel Cron Job'a bağlanabilir, ama bu MVP kapsamı dışındadır — sadece kod bunu kolaylaştıracak şekilde yazılmalı (script bağımsız ve tekrar çalıştırılabilir olmalı).
3. Script, kaynak veriyi bizim formatımıza eşlerken **takım adı eşleştirmesi** (örn. kaynak "South Africa" derken bizim UI'da "Güney Afrika" göstermemiz) için bir `team-mapping.json` (İngilizce ad → Türkçe ad + bayrak emoji/kodu) dosyası kullanmalı.
4. Eşleşmeyen/tanınmayan bir takım adı geldiğinde script sessizce geçmemeli, açıkça hata/uyarı vermeli.

### Yedek/ileri seviye not

Eğer ileride canlı, dakikalık güncelleme gerekirse, KickoffAPI (`api.kickoffapi.com`, günlük 100 ücretsiz istek) bir yükseltme seçeneği olarak değerlendirilebilir. Bu MVP'de YAPILMAYACAK, sadece not olarak bırakılmıştır.

---

## 4. Bracket Motoru (Projenin Kalbi)

### 4.1 Veri modeli

`tournament-data.json` (gerçek dünya verisi, sync script tarafından üretilir/güncellenir):

```ts
type RealMatch = {
  id: string;              // örn. "R32-1"
  round: Round;            // "R32" | "R16" | "QF" | "SF" | "F" | "3RD"
  slot: number;            // o turda kaçıncı eşleşme (bracket pozisyonu için)
  side: "LEFT" | "RIGHT" | "CENTER"; // görseldeki sol/sağ/orta blok
  homeTeam: TeamRef | null;   // null = henüz belirlenmedi (üst tur, alt maçlar oynanmadı)
  awayTeam: TeamRef | null;
  homeSource: MatchSource | null; // bu slotun takımı nereden geliyor (örn. "R32-1 kazananı")
  awaySource: MatchSource | null;
  winner: TeamRef | null;      // GERÇEK sonuç. null = henüz oynanmadı
  playedAt: string | null;     // ISO tarih, UI'da "oynandı" rozeti için
};

type TeamRef = {
  id: string;       // FIFA kodu, örn. "ARG"
  name: string;      // Türkçe görünen ad, örn. "Arjantin"
  flagCode: string;   // bayrak için ülke kodu, örn. "ar"
};
```

`tournament-bracket.ts` (saf mantık modülü, bracket motoru):

```ts
type UserPick = Record<string, string>; // matchId -> seçilen takımın TeamRef.id'si

type ResolvedSlot = {
  matchId: string;
  homeTeam: TeamRef | null;
  awayTeam: TeamRef | null;
  // Gerçekte oynanmış mı?
  isPlayed: boolean;
  // Kullanıcının bu slot için seçimi (geçerliyse)
  userPick: TeamRef | null;
  // Bu slot için kullanıcının seçim YAPABİLECEĞİ takımlar
  // (homeTeam ve awayTeam'in ikisi de doluysa bu ikisidir;
  //  biri/ikisi henüz belirlenmemişse, alt turdaki kullanıcı seçimlerine göre hesaplanır)
  selectableTeams: TeamRef[];
  // Bu slot kilitli mi? (gerçek sonuç varsa true, kullanıcı değiştiremez)
  isLocked: boolean;
};

function resolveBracket(
  realData: RealMatch[],
  userPicks: UserPick
): ResolvedSlot[]
```

### 4.2 Çözümleme algoritması (kritik mantık)

Bracket turlar arası bağımlılık zinciridir: Son 16'daki bir maçın takımları, Son 32'deki iki maçın kazananıdır. Algoritma turları **en alttan yukarı** (Son 32 → Final) sırayla işler:

Her slot için:

1. **homeTeam ve awayTeam gerçekte biliniyor mu?**
   (İlk tur — Son 32 — için bu hep `true`'dur, çünkü kadro bellidir. Üst turlarda bu, alt maçların `winner`ı dolu mu'ya bağlıdır.)

2. **Eğer bu maçın gerçek sonucu (`winner`) varsa:**
   - Slot `isLocked = true`.
   - `userPick` = gerçek `winner` ile EŞİTLENİR (kullanıcının önceki seçimi ne olursa olsun ekrana gerçek sonuç yazılır — kullanıcı tahmin değiştiremez).
   - Bu winner, üst turdaki ilgili slotun `homeTeam`/`awayTeam`'i olarak yukarı taşınır.

3. **Eğer maçın iki takımı da biliniyor ama henüz oynanmadıysa (`winner = null`):**
   - `selectableTeams = [homeTeam, awayTeam]`.
   - Kullanıcının `userPicks[matchId]` değeri bu ikisinden biriyse `userPick` o olur, değilse `null` (henüz tahmin yapılmamış).
   - Kullanıcı tahmini varsa, bu tahmin (gerçek değil, VARSAYIMSAL olarak) üst tura taşınır — ama "varsayımsal" olduğu için üst turdaki slot `isLocked = false` kalır.

4. **Eğer maçın takımlarından biri/ikisi henüz belirlenmemişse (alt maç oynanmamış VE kullanıcı da o alt maç için tahmin yapmamışsa):**
   - O taraf için `selectableTeams` boş kalır, slot "bekliyor" durumunda gösterilir, UI'da soluk/disabled.

5. **EN KRİTİK KURAL — Geçersiz kılma (invalidation):**
   Eğer bir alt maçın GERÇEK sonucu geldiğinde, kullanıcının o slot için önceden yaptığı tahmin (`userPicks[matchId]`) gerçek kazananla **uyuşmuyorsa** (örn. kullanıcı "Güney Afrika" demiş ama gerçekte "Kanada" kazanmış):
   - O kullanıcı tahmini artık geçersizdir ve hesaplamada YOK SAYILIR (sanki hiç seçilmemiş gibi davranılır).
   - Bu durum, o takımı (Güney Afrika) içeren TÜM üst tur kullanıcı tahminlerini de otomatik olarak zincirleme geçersiz kılar — çünkü algoritma yukarı doğru ilerlerken zaten gerçek kazananı kullanacağı için bu otomatik olarak gerçekleşir, ayrıca bir "temizleme" adımına gerek yoktur EĞER algoritma her zaman yukarı taşınan değer olarak gerçek `winner`'ı (varsa) kullanıcı tahmininin ÖNÜNE koyarsa.
   - Bu yüzden algoritmanın doğru çalışması için altın kural: **"gerçek sonuç, kullanıcı tahmininden her zaman önceliklidir ve kullanıcı tahmini sadece gerçek sonuç YOKSA dikkate alınır."** Bu kural tutarlı uygulandığında geçersiz kılma "kendiliğinden" / otomatik olarak doğru çalışır, ayrı bir invalidation-tarama adımı gerekmez. Yine de UI tarafında kullanıcıya "bu tahminin artık geçerli değil, X gerçekte elendi" gibi görsel bir bildirim/rozet gösterilmesi gerekir (bkz. Bölüm 6).

6. **Determinizm şartı:** `resolveBracket` saf bir fonksiyon olmalı — aynı `realData` ve `userPicks` girdisi için her zaman aynı çıktıyı üretmeli, hiçbir global state veya yan etkiye dokunmamalı. Bu, hem URL-state yaklaşımının (Bölüm 5) çalışması için hem de unit test yazılabilmesi için zorunludur.

### 4.3 Test senaryoları (Vitest ile MUTLAKA yazılmalı)

- Hiç gerçek sonuç yokken, hiç kullanıcı tahmini yokken → tüm slotlar Son 32 hariç "bekliyor".
- Son 32'nin tamamı gerçekte oynanmış, kullanıcı hiç tahmin yapmamış → Son 16 takımları otomatik dolu, ama kullanıcı Son 16 için tahmin yapmamış.
- Kullanıcı tüm turlar için tahmin yapmış (final dahil), hiçbir gerçek sonuç yok → tüm slotlar `isLocked: false`, hepsi kullanıcı tahminiyle dolu.
- **Asıl senaryo:** Kullanıcı "Güney Afrika Çeyrek Final'e çıkar" demiş (yani Son 32 ve Son 16'da Güney Afrika'yı seçmiş), sonra gerçekte Son 32'de Kanada kazanıyor → Son 32 slotu kilitlenir ve Kanada gösterilir, Son 16 ve sonrasındaki Güney Afrika içeren tüm tahminler otomatik olarak "bekliyor"/geçersiz duruma döner, kullanıcıya yeniden Kanada (veya Kanada'nın rakibi) arasında seçim sorulur.
- Final'e kadar her şey gerçekleşmiş (turnuva bitmiş) → şampiyon gerçek sonuca göre otomatik belirlenir, kullanıcı tahmini sadece "doğru mu yanlış mı" karşılaştırması için kullanılabilir (bu, "puanlama" özelliği için zemin hazırlar, ama puanlama MVP kapsamında değildir — bkz. Bölüm 8).

---

## 5. URL-State (Veritabanısız Persistans)

Sunucu/veritabanı/login yoktur. Kullanıcının tahmini tamamen URL'e kodlanır.

- `userPicks` objesi (Bölüm 4.1) JSON'a çevrilip sıkıştırılır (öneri: `lz-string` kütüphanesi, `compressToEncodedURIComponent`) ve `?p=...` query param'ına yazılır.
- Sayfa her yüklendiğinde URL'deki `p` param'ı varsa decode edilip `userPicks` olarak state'e yüklenir.
- Kullanıcı her seçim yaptığında URL anında güncellenir (`router.replace`, sayfa geçmişini kirletmemek için `push` değil) — böylece "Paylaş" butonuna her an basıldığında o anki tahmin linkte hazır olur.
- **Önemli:** URL'e yazılan veri sadece `userPicks`tir (matchId → seçilen takım id). Gerçek turnuva sonuçları (`tournament-data.json`) URL'de TAŞINMAZ, her zaman sunucudaki/build'deki güncel JSON'dan okunur. Bu sayede biri eski bir paylaşım linkini açtığında, kendi tahminini görür ama güncel gerçek sonuçlarla otomatik senkronize olur (geçersiz kılınan tahminler o an hesaplanır).
- Linkin çok uzamaması için `userPicks`te sadece kullanıcının GERÇEKTEN seçim yaptığı maçlar tutulmalı (gerçek sonuçla aynı olan veya boş olan slotlar URL'e yazılmamalı/temizlenmeli) — sıkıştırma + bu temizlik linkin makul uzunlukta kalmasını sağlar.

---

## 6. UI/UX Gereksinimleri

Referans görseldeki düzen temel alınacak, ama agent kör kopya yapmamalı, modernize edip kendi iyileştirme önerilerini PROGRESS.md'ye not düşüp uygulayabilir.

### Zorunlu öğeler

- **Simetrik bracket düzeni:** Sol blok (Son 32 → Yarı Final) ve sağ blok (Son 32 → Yarı Final) ortada Final'e bağlanır. Final kutusunun altında 3.lük maçı.
- **Maç kartı durumları (görsel olarak ayrışmalı):**
  1. *Bekliyor:* Takım(lar) henüz belli değil veya seçim yapılmamış — soluk/disabled.
  2. *Seçilebilir:* İki takım da belli, kullanıcı tıklayıp seçebiliyor.
  3. *Kullanıcı tahmini yapılmış:* Seçilen takım vurgulanır (referanstaki yeşil çerçeve + check yerine kendi marka renginle, örn. amber/gold — şampiyon kutusunda zaten kullanılıyor).
  4. *Kilitli/gerçekleşmiş:* Gerçek sonuç gelmiş, slot kilit ikonuyla işaretlenir, kullanıcı değiştiremez. Kullanıcının önceki tahmini doğruysa görsel "✓ doğru tahmin", yanlışsa "✗ farklı çıktı" gibi ince bir rozetle gösterilebilir (opsiyonel ama önerilir).
  5. *Geçersiz kılınmış tahmin:* Kullanıcının seçtiği takım gerçekte elenmişse ve bu üst tura yansımışsa, o üst tur slotunun kısaca "güncellendi" animasyonu/rozetiyle dikkat çekmesi gerekir (örn. kısa bir highlight pulse + "Sonuçlar güncellendi, yeniden tahmin et" tooltip'i).
- **Şampiyon kutusu:** Final'in hemen altında, kupa ikonuyla — kullanıcının (veya gerçekleşmiş sonucun) şampiyonu.
- **Responsive/mobil:** Bracket yatayda çok geniş olduğu için mobilde yatay scroll + "şu an hangi turdasın" gösteren bir mini harita/breadcrumb olmalı. Bu özellikle Instagram/X.com paylaşımının çoğunlukla mobilden yapılacağı için kritik.
- **Paylaşım butonu:**
  - X.com: `https://twitter.com/intent/tweet?text=...&url=...` intent linkine güncel URL-state linki gömülür.
  - Instagram: Instagram'ın doğrudan metin/link paylaşım intent'i yoktur — bu yüzden görsel (PNG) üretip kullanıcıya indirme/"Instagram'da paylaş" (mobilde native share sheet, `navigator.share` API) sunulmalı.
  - **Görsel üretimi:** Next.js'in `@vercel/og` (Satori tabanlı) API route'u kullanılarak, kullanıcının o anki bracket durumunun şık bir özet görseli (örn. sadece şampiyon + yarı finalistler, ya da tam bracket'in sadeleştirilmiş hali) dinamik olarak PNG üretilmeli. Bu route, URL-state'i parametre olarak alıp sunucusuz şekilde resmi oluşturur (veritabanı gerektirmez, tamamen stateless).
- **Renk paleti ve tipografi:** Referans görseldeki koyu lacivert/mor tonlu (`#1a1b2e` benzeri) arka plan + kazanan vurgusu için canlı bir aksan renk iyi bir başlangıç noktası; agent `frontend-design` skill'ini (varsa) inceleyip kendi önerisini sunabilir, şablon/jenerik Tailwind görünümünden kaçınılmalı.

---

## 7. Agent'tan Eklenmesi Beklenen Fikirler (Senin İsteğin Üzerine)

Sen "kendi fikirlerini de ekleyebilirsin" dedin. Aşağıdakiler değerlendirilmesi gereken, ama MVP'yi şişirmemesi için PROGRESS.md'de "v2 fikirleri" olarak ayrı tutulması gereken önerilerdir:

- **"İsabet oranı" / puanlama:** Turnuva bittiğinde, kullanıcının tahmininin gerçekle kaç maçta örtüştüğünü gösteren bir skor (örn. "12/16 doğru tahmin, %75 isabet"). Paylaşım görselinde bu skor öne çıkarılabilir — bu çok güçlü bir viral mekanik olur ("arkadaşını yendim mi" paylaşımı).
- **Karşılaştırma linki:** İki farklı kullanıcının tahmin linkini yan yana koyup "kim daha çok bildi" karşılaştırması (URL-state olduğu için iki linki birleştirip karşılaştırma sayfası yapmak teknik olarak kolay).
- **"Sürpriz" rozetleri:** Kullanıcının üst sırada görmediği bir takımı (örn. Son 16'da elenmesini beklediği bir takımı) finale taşıması gibi "cesur tahmin" anlarını otomatik tespit edip rozetle vurgulamak.
- **Açılış animasyonu / boş bracket şablonu:** Kullanıcı siteye ilk girdiğinde boş bracket'i "1 tıkla otomatik doldur (rastgele veya favori takıma göre)" kısayolu.

Bunlar MVP'de yapılmayacak ama mimari bu özellikleri zorlaştırmayacak şekilde kurulmalı (özellikle puanlama özelliği, mevcut `resolveBracket` çıktısından türetilebilecek şekilde tasarlanmalı).

---

## 8. Kapsam Dışı (Bu Projede YAPILMAYACAK)

- Kullanıcı hesabı, login, kayıt sistemi.
- Veritabanı (Postgres, Supabase, vs.) — hiçbir aşamada eklenmeyecek.
- Gerçek zamanlı/canlı maç içi skor takibi (dakika dakika). Bizim ilgilendiğimiz tek şey "maç bitti mi ve kazanan kim".
- Bahis/oran gösterimi.
- Çok dillilik (proje tamamen Türkçe; İngilizce arayüz MVP kapsamında değil).
- Diğer turnuvalar (Şampiyonlar Ligi vs.) — yapı genel tutulabilir ama içerik sadece 2026 Dünya Kupası'na özel olacak.

---

## 9. Agent Çalışma Disiplini

- Her oturum başında bu dosyayı VE PROGRESS.md'yi oku.
- Her oturum sonunda PROGRESS.md'yi güncelle: ne yapıldı, sıradaki adım ne, açık sorular var mı.
- Bracket motorunu (Bölüm 4) UI'dan tamamen ayrı, bağımsız test edilebilir bir modül olarak yaz — UI'ya geçmeden önce motorun testleri yeşil olmalı.
- Belirsizlik durumunda agent kendi başına büyük mimari kararlar almamalı (örn. veritabanı eklemek, farklı bir state yönetimi kütüphanesi getirmek); bu dosyadaki kararlar sabittir. Sadece UI detayları ve küçük implementasyon tercihlerinde agent'a serbestlik vardır.
- Kod, gerçek turnuva verisini (`tournament-data.json`) ve takım eşleştirmesini (`team-mapping.json`) `/data` klasöründe ayrı tutmalı, motor/UI kodundan bağımsız güncellenebilmeli.
