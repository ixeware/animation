# Шахматные шортсы (The 64 Files, HappyChess)

Вертикальные ролики 1080×1920 для TikTok об истории шахмат, сделанные кодом: сцены рисуются на canvas
(`engine/js`, рендер через Playwright в `render.mjs`), голос ElevenLabs, процедурная музыка и библиотека звуков
(`audio/`), автоматическая проверка вёрстки. Каждый ролик — папка `episodes/<имя>/`.

## Сначала прочитать
- `STYLE_BIBLE.md` — правила стиля и все пожелания автора канала: чек-лист в разделе 6 (правила 1–38) и эффекты
  ходов в §8. Новое пожелание автора сразу записывать туда отдельным правилом.
- `README.md` — строка сборки каждого ролика и устройство проекта.
- Ближайший похожий ролик: `episodes/<имя>/scenes.js` — образец кода, `SOURCES.md` — факты и фото.

## Каналы
- The 64 Files (@the64files) — свой канал автора, английский, аудитория США, ролики длиннее 61 с.
- HappyChess — заказы. Для кого ролик, выяснить до начала работы. Константа `CHANNEL` в `scenes.js` даёт финальную
  плашку «FOLLOW <CHANNEL>».

## Как собрать ролик
1. Факты с источниками — `episodes/<ep>/SOURCES.md`; партии — PGN и JSON в `engine/data/`.
2. Текст и голос — `episodes/<ep>/script.json`: фразы, Callum на `eleven_v3`, аудиотеги в `say`, `channel`, `post`.
3. Озвучка: `python3 audio/tts.py episodes/<ep>`. Нужна переменная `ELEVENLABS_API_KEY`; ответы кэшируются в
   `build/tts_cache`, повторный запуск кредитов не тратит.
4. Сцены — `episodes/<ep>/scenes.js`, функция `build(T)` возвращает shots, cues, music, musicFx.
5. Кадры для проверки: `node render.mjs <ep> --stills 1.0,2.5` (в `build/stills`).
6. Вёрстка: `node render.mjs <ep> --qa --step 0.1`; до рендера должно быть «no issues».
7. Рендер и сведение: `node render.mjs <ep> --workers 4 && python3 audio/mix.py episodes/<ep>` (получится
   `build/final.mp4`, около −16 LUFS). Долгий рендер запускать в фоне.
8. Файл для отправки — два прохода x264:
   `ffmpeg -y -i final.mp4 -c:v libx264 -preset slow -b:v 3300k -pass 1 -passlogfile <tmp>/p -an -f mp4 /dev/null`, затем
   `ffmpeg -y -i final.mp4 -c:v libx264 -preset slow -b:v 3300k -pass 2 -passlogfile <tmp>/p -c:a aac -b:a 160k -movflags +faststart <имя>.mp4`.
9. Перед отправкой — покадровый просмотр готового файла (контакт-листы кадров) и проверка звука.

## Правила работы
- Коммитить и пушить только в ветку, которую назначила сессия. `build/` в git не попадает.
- Ключи и токены не коммитить и не просить вставить в чат; ключ ElevenLabs задаётся в настройках облачного окружения.
- Автор пишет по-русски; отвечать по-русски, коротко, с итогом и ссылкой на файл.
