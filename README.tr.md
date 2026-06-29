# social-media-automations

Yerel **Claude Code** ile sosyal medya icerigi yazan ve **FFmpeg** ile platforma hazir video ve gorsel ureten acik kaynak CLI.

Bir nis, bir brief ya da sadece arastirilacak bir konu verirsiniz. Claude Code hook'u, ekran metnini, zamanli altyazilari, aciklamayi ve hashtag'leri yazar. Ardindan sectiginiz platforma gore boyutlanmis dikey bir video (ya da sabit bir kart) render edilir ve metin guvenli alan icinde tutulur, boylece platform arayuzunun altinda kalmaz.

[English README](README.md)

## Neden var

Cogu "AI icerik" araci bir API anahtari ve ucretli plan ister. Bu istemiyor. Zaten kurulu olan `claude` komutunu cagirir, yani mevcut Claude Code oturumunuzu kullanir. API anahtari yok, SDK yok, ekstra hesap yok.

- Yerel Claude Code ile icerik uretimi, uc mod: viral kesif, verilen brief, ya da bir konuyu webde arastirma.
- FFmpeg render: TikTok, Reels ve Shorts icin 9:16 video, ayrica LinkedIn, X, Instagram ve Facebook gonderileri icin sabit kartlar.
- Birden cok secilebilir sablon, hepsi guvenli alana duyarli.
- Metin Node tarafinda cizilip FFmpeg `overlay` filtresiyle bindirilir, bu yuzden libfreetype ya da libass olmayan minimal FFmpeg derlemelerinde bile calisir. Serbest bir font (DejaVu Sans) pakete dahildir.
- JSON ya da YAML config, toplu (batch) uretim, Turkce ve Ingilizce destegi.
- Yazim kurali gomulu: em-dash yok, sade insan dili.

## Gereksinimler

- Node.js 20.6 ya da yeni surum.
- PATH uzerinde FFmpeg ve FFprobe ([indirme](https://ffmpeg.org/download.html)). Minimal derleme yeterli, metin render libfreetype ya da libass gerektirmez.
- AI kismi icin: [Claude Code](https://docs.claude.com/en/docs/claude-code) CLI (`claude`) kurulu ve oturum acik. Her sey `--no-ai` ile bunlar olmadan da calisir.

## Kurulum

```bash
git clone https://github.com/your-org/social-media-automations.git
cd social-media-automations
npm install
npm link        # istege bagli, global "social-auto" komutunu verir
```

`npm link` olmadan `node bin/social-auto.js <komut>` olarak calistirabilirsiniz.

## Hizli baslangic

```bash
# 1. Ornekler medya olmadan calissin diye demo dosyalari uret.
social-auto init-demo

# 2. AI olmadan render (claude olmadan calisir).
social-auto generate --platform youtube-shorts --template clean-caption --config examples/shorts.json --no-ai

# 3. Claude Code viral bir fikir yazsin, sonra render et.
social-auto generate --platform tiktok --template bold-center --config examples/tiktok.json

# 4. Bir konu ver, Claude arastirsin.
social-auto generate --platform instagram-reels --template hook-subtitle --config examples/research.json

# 5. Sadece fikir uret, render yok.
social-auto ideate --platform tiktok --niche "fitness" --count 5 --lang tr
```

## Icerik modlari

Mod, config'teki `ai` blokundan secilir.

| Mod | Ne zaman | Claude ne yapar |
| --- | --- | --- |
| viral | `brief` ve `topic` yok | Nis icin trend, yuksek etkilesimli bir fikir secip yazar. |
| brief | `brief` verili | Tam brief'inize gore yazar. |
| research | `topic` ve `research: true` | Konuyu webde arastirir (WebSearch, WebFetch), guncel ve trend odakli icerik yazar. |

`ai` blogu yoksa ya da `--no-ai` verirseniz, arac config'teki `title` ve `subtitles` alanlarini dogrudan kullanir. `claude` gerekmez.

## Config

Config bir JSON ya da YAML dosyasidir. Dosya yollari config dosyasina gore cozulur.

```json
{
  "ai": {
    "niche": "yazilim ve developer mizahi",
    "brief": "cuma gunu prod'a deploy etme korkusu",
    "topic": "2026 yapay zeka kodlama trendleri",
    "research": false,
    "language": "tr",
    "tone": "esprili, enerjik",
    "model": "claude-opus-4-8"
  },
  "duration": 10,
  "input": { "video": "assets/clip.mp4", "background": "#101418" },
  "logo": { "path": "assets/logo.png", "position": "top-right", "scale": 0.15 },
  "music": { "path": "assets/music.mp3", "volume": 0.6 },
  "font": "assets/fonts/Inter-Bold.ttf",
  "output": "out/tiktok.mp4"
}
```

Notlar:

- `input.video` arka plandir. Vermezseniz `input.background` rengi FFmpeg'in lavfi kaynagiyla kullanilir.
- AI acikken metni Claude doldurur. Aciklama ve hashtag'ler video yaninda `*.caption.txt` olarak yazilir.
- AI olmadan `title` ve `subtitles`'i (`{ text, start, end }` dizisi ya da duz metinler) kendiniz verin.
- Ozel `font` (bir `.ttf` ya da `.otf` yolu) istege baglidir. Vermezseniz pakete dahil DejaVu Sans kullanilir.

## Sablonlar

Guncel liste icin `social-auto list-templates`.

| Sablon | Tur | Nasil gorunur |
| --- | --- | --- |
| hook-subtitle | video | Ustte buyuk hook, alt-ortada zamanli altyazi. |
| clean-caption | video | Altta minimal tek altyazi. |
| bold-center | video | Ekran ortasinda buyuk vurgulu satir, kapak tarzi. |
| word-pop | video | Ortada vurucu, karaoke hissi veren altyazilar. |
| image-card | gorsel | Gonderi platformlari icin ortali baslikli sabit kart. |

## Platformlar

Guncel liste icin `social-auto list-platforms`. Video: `tiktok`, `instagram-reels`, `youtube-shorts`. Gorsel: `instagram-post`, `linkedin-post`, `x-post`, `facebook-post`. Her preset onerilen boyutu, kare hizini ve metni platform arayuzunden uzak tutan bir guvenli alani tasir.

## Komutlar

```bash
social-auto generate --platform <id> --template <ad> --config <dosya> [-o cikti] [--lang tr|en] [--dry-run] [--no-ai] [--verbose]
social-auto generate --batch examples/batch.json
social-auto ideate --platform <id> [--niche "..."] [--topic "..." --research] [--count 5] [--lang tr|en]
social-auto list-templates
social-auto list-platforms
social-auto init-demo
```

`--dry-run` FFmpeg komutunu calistirmadan yazdirir. `--no-ai` Claude'u atlar ve config metnini kullanir.

## Katki

Yeni platform ve sablon eklemek kolay olacak sekilde tasarlandi: bir dosya arti bir registry satiri. Bkz. [CONTRIBUTING.tr.md](CONTRIBUTING.tr.md) ([English](CONTRIBUTING.md)).

## Lisans

[MIT](LICENSE)
