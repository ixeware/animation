# animation

Производство коротких анимационных роликов в стиле TikTok-аккаунта **@chess.history**
(истории из истории шахмат: плоская 2D-анимация, полу-3D доска, драматичный голос).
Всё делается кодом: озвучка нейро-TTS, анимация на Canvas с покадровым рендером, музыка и звуковые
эффекты синтезируются, сведение в ffmpeg.

```bash
npm i                      # playwright (браузер берётся системный)
./build.sh fischer         # -> episodes/fischer/build/final.mp4
```

## Что где лежит

| Путь | Что внутри |
|---|---|
| `STYLE_BIBLE.md` | Полный разбор стиля: сторителлинг, палитра, персонажи, HUD доски, шрифты, монтаж, голос, музыка, SFX |
| `reference/episodes.md` | Покадровые разборы всех 4 роликов аккаунта |
| `templates/episode_template.md` | Шаблон нового эпизода |
| `episodes/<name>/script.json` | Сценарий: фразы, паузы после них, цвета ударных слов в субтитрах |
| `episodes/<name>/scenes.js` | Планы эпизода, привязанные к словам озвучки, метки SFX и музыкальные разделы |
| `engine/` | Движок: `board.js` (доска в перспективе, ходы, прицелы, глубина резкости), `pieces.js`, `characters.js` (риг персонажей и эмоции), `hud.js` (титры, счётчики, табло, штампы, полоска здоровья), `map.js` (карта из точек), `captions.js` (караоке-субтитры), `draw.js` (свет, засветы, спидлайны, ТВ-выключение), `main.js` (монтаж и переходы) |
| `render.mjs` | Рендер в headless Chromium: стоп-кадры (`--stills 1,2,3`) или видео в несколько потоков |
| `audio/tts.py` | Озвучка Kokoro (`am_michael`, понижение на 1,5 полутона ресемплингом), тайминги каждого слова |
| `audio/music.py`, `audio/sfx.py`, `audio/mix.py` | Процедурная партитура (ре минор, 120 BPM), 27 синтезированных эффектов, сведение (голос сверху, подложка на 7–8 LU ниже, мастер −16 LUFS) |
| `tools/` | Анализ TikTok-профиля (`analyze_tiktok.sh`, `analyze_audio.py`), PGN → позиции по ходам (`pgn_to_json.py`) |

## Новый эпизод

1. Скопируй `episodes/fischer` в `episodes/<name>` и перепиши `script.json` по шаблону из
   `templates/episode_template.md`.
2. `python3 audio/tts.py episodes/<name>` создаёт озвучку и `build/timings.json`.
3. Перепиши `scenes.js`: каждый план начинается на слове (`T.s(id)`, `T.w(id, 'word')`), рядом
   ставятся метки звуков `cue(t, 'boom')`. Для партии: `python3 tools/pgn_to_json.py "<PGN>" engine/data/<game>.json`.
4. Проверяй планы стоп-кадрами: `node render.mjs <name> --stills 1,5,10`.
5. `./build.sh <name>`.

Зависимости Python: `kokoro` (ставить `pip install --no-deps kokoro misaki==0.9.4` плюс `loguru
transformers num2words phonemizer-fork espeakng-loader spacy<3.9`, на Python 3.13 обычная
установка ломается на старом numpy), `numpy scipy soundfile`. Ещё нужен ffmpeg.

Видео-референсы в репозиторий не кладутся: это чужой контент, нужен только для анализа.
