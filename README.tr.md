# social-media-automations

Yerel **Claude Code** ile sosyal medya içeriği yazan ve **FFmpeg** ile platforma hazır video ve görsel üreten açık kaynak CLI.

Bir niş, bir brief ya da sadece araştırılacak bir konu verirsiniz. Claude Code hook'u, ekran metnini, zamanlı altyazıları, açıklamayı ve hashtag'leri yazar. Ardından seçtiğiniz platforma göre boyutlanmış dikey bir video (ya da sabit bir kart) render edilir ve metin güvenli alan içinde tutulur, böylece platform arayüzünün altında kalmaz.

[English README](README.md)

## Neden var

Çoğu "AI içerik" aracı bir API anahtarı ve ücretli plan ister. Bu istemiyor. Zaten kurulu olan `claude` komutunu çağırır, yani mevcut Claude Code oturumunuzu kullanır. API anahtarı yok, SDK yok, ekstra hesap yok.

- Yerel Claude Code ile içerik üretimi, üç mod: viral keşif, verilen brief, ya da bir konuyu webde araştırma.
- FFmpeg render: TikTok, Reels ve Shorts için 9:16 video, ayrıca LinkedIn, X, Instagram ve Facebook gönderileri için sabit kartlar.
- Birden çok seçilebilir şablon, hepsi güvenli alana duyarlı, platforma özel tema renkleriyle.
- Metin Node tarafında çizilip FFmpeg `overlay` filtresiyle bindirilir, bu yüzden libfreetype ya da libass olmayan minimal FFmpeg derlemelerinde bile çalışır. Serbest bir font (DejaVu Sans) pakete dahildir.
- JSON ya da YAML config, toplu (batch) üretim, Türkçe ve İngilizce desteği.
- Yazım kuralı gömülü: em-dash yok, sade insan dili.

## Gereksinimler

- Node.js 20.6 ya da yeni sürüm.
- PATH üzerinde FFmpeg ve FFprobe ([indirme](https://ffmpeg.org/download.html)). Minimal derleme yeterli, metin render libfreetype ya da libass gerektirmez.
- AI kısmı için: [Claude Code](https://docs.claude.com/en/docs/claude-code) CLI (`claude`) kurulu ve oturum açık. Her şey `--no-ai` ile bunlar olmadan da çalışır.

## Kurulum

```bash
git clone https://github.com/berkcangumusisik/social-media-automations.git
cd social-media-automations
npm install
npm link        # isteğe bağlı, global "social-auto" komutunu verir
```

`npm link` olmadan `node bin/social-auto.js <komut>` olarak çalıştırabilirsiniz.

## Hızlı başlangıç

```bash
# 1. Örnekler medya olmadan çalışsın diye demo dosyaları üret.
social-auto init-demo

# 2. AI olmadan render (claude olmadan çalışır).
social-auto generate --platform youtube-shorts --template clean-caption --config examples/shorts.json --no-ai

# 3. Claude Code viral bir fikir yazsın, sonra render et.
social-auto generate --platform tiktok --template bold-center --config examples/tiktok.json

# 4. Bir konu ver, Claude araştırsın.
social-auto generate --platform instagram-reels --template hook-subtitle --config examples/research.json

# 5. Sadece fikir üret, render yok.
social-auto ideate --platform tiktok --niche "fitness" --count 5 --lang tr
```

## İçerik modları

Mod, config'teki `ai` bloğundan seçilir.

| Mod | Ne zaman | Claude ne yapar |
| --- | --- | --- |
| viral | `brief` ve `topic` yok | Niş için trend, yüksek etkileşimli bir fikir seçip yazar. |
| brief | `brief` verili | Tam brief'inize göre yazar. |
| research | `topic` ve `research: true` | Konuyu webde araştırır (WebSearch, WebFetch), güncel ve trend odaklı içerik yazar. |

`ai` bloğu yoksa ya da `--no-ai` verirseniz, araç config'teki `title` ve `subtitles` alanlarını doğrudan kullanır. `claude` gerekmez.

## Config

Config bir JSON ya da YAML dosyasıdır. Dosya yolları config dosyasına göre çözülür.

```json
{
  "ai": {
    "niche": "yazılım ve developer mizahı",
    "brief": "cuma günü prod'a deploy etme korkusu",
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

- `input.video` arka plandır. Vermezseniz `input.background` rengi (ya da platform teması) FFmpeg'in lavfi kaynağıyla kullanılır.
- AI açıkken metni Claude doldurur. Açıklama ve hashtag'ler video yanında `*.caption.txt` olarak yazılır.
- AI olmadan `title` ve `subtitles`'ı (`{ text, start, end }` dizisi ya da düz metinler) kendiniz verin.
- Özel `font` (bir `.ttf` ya da `.otf` yolu) isteğe bağlıdır. Vermezseniz pakete dahil DejaVu Sans kullanılır.

## Şablonlar

Güncel liste için `social-auto list-templates`.

| Şablon | Tür | Nasıl görünür |
| --- | --- | --- |
| hook-subtitle | video | Üstte marka renkli pill üzerinde hook, altta zamanlı altyazı pill'leri. |
| clean-caption | video | Altta yumuşak koyu pill üzerinde minimal altyazı. |
| bold-center | video | Ortada büyük vurgulu satır, üstte aksan çubuğu, kapak tarzı. |
| word-pop | video | Ortada marka renkli pill üzerinde vurucu altyazılar, karaoke hissi. |
| image-card | görsel | Gönderi platformları için aksan çubuklu, sola hizalı başlıklı editöryel kart. |

Her platformun bir teması var (vurgu rengi ve varsayılan kart arka planı), böylece çıktı platforma göre uyarlanır: TikTok pembe, Instagram magenta, YouTube kırmızı, LinkedIn mavi, X mavi, Facebook mavi. Pill ve aksan çubukları bu rengi otomatik kullanır.

## Platformlar

Güncel liste için `social-auto list-platforms`. Video: `tiktok`, `instagram-reels`, `youtube-shorts`. Görsel: `instagram-post`, `linkedin-post`, `x-post`, `facebook-post`. Her preset önerilen boyutu, kare hızını, bir güvenli alanı ve bir temayı taşır.

## Komutlar

```bash
social-auto generate --platform <id> --template <ad> --config <dosya> [-o çıktı] [--lang tr|en] [--dry-run] [--no-ai] [--verbose]
social-auto generate --batch examples/batch.json
social-auto ideate --platform <id> [--niche "..."] [--topic "..." --research] [--count 5] [--lang tr|en]
social-auto list-templates
social-auto list-platforms
social-auto init-demo
```

`--dry-run` FFmpeg komutunu çalıştırmadan yazdırır. `--no-ai` Claude'u atlar ve config metnini kullanır.

## Katkı

Yeni platform ve şablon eklemek kolay olacak şekilde tasarlandı: bir dosya artı bir registry satırı. Sözleşme için bkz. [CONTRIBUTING.tr.md](CONTRIBUTING.tr.md) ([English](CONTRIBUTING.md)), fikirler ve "good first issue" için [ROADMAP.md](ROADMAP.md).

Tekrarlamakta fayda var: hiçbir yerde em-dash yok, sade insan dili. Bu kural koda, dökümana ve içerik prompt'larına geçerli.

- [Davranış Kuralları](CODE_OF_CONDUCT.md)
- [Güvenlik Politikası](SECURITY.md)
- [Changelog](CHANGELOG.md)

## Lisans

[MIT](LICENSE). Pakete dahil font lisansı için bkz. [assets/fonts/NOTICE.md](assets/fonts/NOTICE.md).
