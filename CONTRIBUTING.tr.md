# Katki

Yardiminiz icin tesekkurler. Bu proje genisletilebilir olacak sekilde kuruldu. Bir platform ya da sablon eklemek kucuk ve bagimsiz bir degisiklik olmali.

[English](CONTRIBUTING.md)

## Temel kurallar

- **Em-dash yok.** Kod, yorum, dokuman, prompt ya da ornek aciklamalarda asla em-dash (—) ya da en-dash (–) kullanmayin. Virgul, nokta, parantez ya da normal tire kullanin. Sade, insan dilinde yazin ve AI klisesinden kacinin. Bu kural `src/claude/prompts.js` icindeki icerik prompt'lari icin de gecerlidir.
- Bagimliliklari minimum tutun. Calisma zamani bagimliliklari `commander`, `yaml` ve `pureimage`. Yeni eklemeden once tartisin.
- Cevredeki stile uyun. Iki bosluk girinti, ESM modulleri, kucuk ve odakli dosyalar.
- Her davranis degisikligi icin test ekleyin ya da guncelleyin. Testler `ffmpeg` ya da `claude` cagirmamalidir.

## Kurulum

```bash
npm install
npm test
node bin/social-auto.js init-demo
node bin/social-auto.js generate -p youtube-shorts -t clean-caption -c examples/shorts.json --no-ai
```

## Proje duzeni

```
src/
  platforms/   platform preset'leri ve registry
  templates/   sablonlar ve ortak yardimcilar
  claude/      Claude Code entegrasyonu (prompt, runner, schema)
  render/      metin rasterizasyonu (pureimage) ve FFmpeg compose
  ffmpeg/      ffmpeg/ffprobe runner, demo dosyalari
  core/        generate ve batch orkestrasyonu
  config/      config yukleme ve dogrulama
  utils/       logger, hatalar, i18n
```

## Platform ekleme

1. `src/platforms/presets.js` dosyasini acin ve `PRESETS` dizisine bir nesne ekleyin:

```js
{
  id: 'my-platform',          // benzersiz, kebab-case
  label: 'My Platform',
  kind: 'video',              // 'video' ya da 'image'
  width: 1080, height: 1920,
  fps: 30,
  maxDuration: 60,            // saniye, gorseller icin 0
  container: 'mp4',           // cikti uzantisi
  vcodec: 'libx264', acodec: 'aac', vbitrate: '8M',
  safeArea: { top: 0.06, bottom: 0.2, left: 0.05, right: 0.12 }
}
```

`safeArea` degerleri, platform arayuzunden uzak tutulacak alanin kare cinsinden oranlaridir. Hepsi bu. Registry ve CLI otomatik alir.

2. Onemli bir platformsa `test/platforms.test.js` icine bir assertion ekleyin.

## Sablon ekleme

Sablon, `src/templates/` icinde varsayilan olarak bir nesne export eden bir dosyadir:

```js
export default {
  name: 'my-template',
  description: 'Gorunusu anlatan tek satir.',
  kind: 'video',                                  // 'video' ya da 'image'
  supports: ['tiktok', 'instagram-reels'],        // platform id'leri
  buildPlan(ctx) {
    // ctx: { preset, content, config, duration, outputPath, workdir }
    // overlay'leri dondur. Her overlay start ve end saniyeleri arasinda gosterilir
    // ve piksel bolgelerine yerlestirilmis bir ya da daha cok metin blogu tutar.
    return {
      kind: 'video',
      overlays: [
        {
          start: 0,
          end: ctx.duration,
          blocks: [
            {
              text: ctx.content.title,
              x: 50, y: 80, w: 980, h: 400,        // kare icindeki piksel bolgesi
              fontPx: 90,
              color: '#FFFFFF',                     // istege bagli
              align: 'center',                      // 'center' ya da 'left'
              valign: 'top',                        // 'top' | 'middle' | 'bottom'
              outline: true                         // istege bagli
            }
          ]
        }
      ]
    };
  }
};
```

Metnin guvenli alanda kalmasi icin `src/templates/_helpers.js` icindeki yardimcilari kullanin (`topBand`, `bottomBand`, `centerBand`, `fontPx`, `staticOverlay`, `cueOverlays`, `toCues`).

Sonra `src/templates/index.js` icinde kaydedin:

```js
import myTemplate from './my-template.js';
const TEMPLATES = [/* ... */, myTemplate];
```

Render katmani overlay'lerinizi PNG'ye cevirir ve FFmpeg ile birlestirir. FFmpeg argumanlarini elle yazmazsiniz.

`test/templates.test.js` icine bir durum ekleyip kapsayin.

## Icerik paketi

AI acikken Claude bir icerik paketi dondurur ve sablonlar bunu `ctx.content` uzerinden okur:

```
{ idea, hook, title, onScreenText, subtitles: [{ text, start, end }], caption, hashtags, musicMood, cta }
```

`src/claude/schema.js` icinde normalize edilir (ve kalan tireleri temizler). Sekli degistirirseniz schema'yi, `src/claude/prompts.js` prompt'unu ve testleri birlikte guncelleyin.

## Pull request

- `npm test` calistirin ve yesil oldugunu dogrulayin.
- Degisikligi odakli tutun. PR basina bir platform ya da bir sablon idealdir.
- Ne degistirdiginizi ve nedenini yazin. Render ciktilarinin ekran goruntuleri makbule gecer.

Katki yaparak isinizin [MIT Lisansi](LICENSE) ile yayinlandigini kabul edersiniz.
