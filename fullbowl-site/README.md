# FullBowl - landing page

Statik sayt (HTML, CSS, JS). Framework yoxdur, quraşdırma tələb etmir. Vercel-də birbaşa işləyir.

## Fayllar

```
index.html              hazır səhifə (Vercel bunu göstərir)
assets/css/style.css    dizayn
assets/css/fonts.css    şriftlər (Geologica, Onest, IBM Plex Mono - saytın içində saxlanılır)
assets/js/i18n.js       bütün mətnlər: AZ, EN, RU
assets/js/main.js       dil seçimi, menyu, forma
assets/img/             ekranlar, komanda fotoları, loqo, og-image.png
src/index.template.html səhifənin şablonu
src/build.js            şablondan index.html yaradır
vercel.json             keş və təhlükəsizlik başlıqları
```

## Vercel-ə yükləmək

Variant 1 - Vercel CLI:

```
npm i -g vercel
cd fullbowl-site
vercel --prod
```

Variant 2 - GitHub: qovluğu GitHub repoya yüklə, vercel.com/new səhifəsində reponu seç. Framework: **Other**, Build Command boş, Output Directory boş (kök qovluq).

Deploydan sonra ünvan `fullbowl.vercel.app`-dan fərqlidirsə, `src/build.js` faylında `SITE_URL` dəyərini dəyiş və `node src/build.js` işlət (OG şəkli və canonical link üçün).

## Forma (pilot siyahısı)

Forma [FormSubmit](https://formsubmit.co) vasitəsilə `mammadovadem842@gmail.com` ünvanına gəlir. Server lazım deyil.

1. Sayt canlı olandan sonra formu bir dəfə özün doldur.
2. Həmin e-poçta FormSubmit-dən **"Activate Form"** məktubu gələcək, düyməni bas.
3. Bundan sonra bütün müraciətlər cədvəl şəklində e-poçta gələcək (rol, ad, e-poçt, telefon, rayon, mesaj, dil).

Aktivləşdirmədən sonra FormSubmit təsadüfi bir kod verir. E-poçtu gizlətmək istəsən, `index.html`-də `window.FB_CONFIG` sətrinə `formEndpoint: "https://formsubmit.co/ajax/KOD"` əlavə et.

Ünvanı dəyişmək üçün: `src/build.js` faylında `EMAIL` dəyərini dəyiş və `node src/build.js` işlət.

## Mətnləri dəyişmək

1. `assets/js/i18n.js` faylında lazım olan sətri hər üç dildə dəyiş (az, en, ru).
2. `node src/build.js` işlət. Skript yoxlayır ki:
   - hər açar üç dildə də var;
   - heç yerdə uzun tire yoxdur.
3. Yenidən deploy et.

Dil seçimi yadda saxlanılır. Birbaşa link: `?lang=en`, `?lang=ru`.

## Lokal baxış

```
python3 -m http.server 8000
```

Sonra brauzerdə `http://localhost:8000` aç.

## Məzmun qaydaları (Strategy Guide v2.0 əsasında)

- "escrow" və "komissiyasız" sözləri işlənmir; düzgün ifadə: **ianələrdən komissiya yoxdur**.
- Bakıda küçə heyvanlarının sayı göstərilmir (rəsmi say yoxdur). 680 milyon rəqəmi Network for Animals-a istinadla verilir.
- AI-nin dəqiqliyi barədə rəqəm verilmir.
- Premium qiyməti (3 AZN) "planlaşdırılır" kimi göstərilir.
- Ödənişlər prototip mərhələsində test rejimindədir.
