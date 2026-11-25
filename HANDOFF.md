# Передача проекта (handoff), 8.11.2026, дополнено 9.11, 22.11, 24.11 и 25.11.2026

Записка для модели или человека, который продолжит работу. Проект — шахматные шортсы для TikTok, сделанные кодом.
Здесь: что прочитать, как поставить окружение, как собрать ролик, что уже сделано и на чём легко ошибиться.
Правила работы живут в [CLAUDE.md](CLAUDE.md). Файл назван по Claude Code, но обязателен для любой модели.

## 0. Состояние на 25.11.2026 — читать первым

Здесь всё, что висит, и как продолжить в новом контейнере. Подробности:
- [memory/sponsors.md](memory/sponsors.md) — Chessigma, Hungry Studio, PolyBuzz, Chessnut;
- [business/youtube_copies.md](business/youtube_copies.md);
- [memory/journal.md](memory/journal.md).

### Сначала: 25.11 — Элиот не принял `fivepoints`; новый ролик 1 — `nobrilliant` («Brilliant moves don't exist»)

- **Письмо Элиота, 25.11, 07:31 UTC** (ветка `1a1cd1a82e2a9623`, письмо `1a2119e6078a2e8a`, копия Мехди): «The video is
  well made, but I think we had a misunderstanding about the topics». Каждый из четырёх роликов должен быть **о функции,
  которую рекламирует**. Про бриллианты — наш первый питч (9.11) «Brilliant moves don't exist». Брендинг — одно из двух:
  короткая интеграция в начале или знак Chessigma в кадре («the Sigma icon on the brilliant move, or the Chessigma logo
  on the board»). Запись приложения — переснять со входом в аккаунт. Остальные три темы: дебюты, Game Review, принципы
  («These are only examples»). Полностью — [memory/sponsors.md](memory/sponsors.md).
- **Автор:** «чекни письмо эллиота и сделай че он хочет». Сделан черновик `episodes/nobrilliant` (61,8 с).
- **Сюжет** — один сквозной предмет, круглый стикер «!!»:
  1. хук: Магнус держит его как медаль — «Brilliant moves don't exist» — стикер исчезает из руки;
  2. эдит-байт: Stockfish (рыба в аквариуме с табло) «can beat any human. But it has never seen a brilliant move»;
  3. Нью-Йорк, 30.11.2016, его день рождения, тай-брейк за титул, **50.Qh6+**; слова Кавалека на карточке;
  4. у движка это `+M2`: «Just a number»;
  5. рука снимает «!!» с ферзя: «The double exclamation mark is a sticker. A review site adds it later, by its own
     rules» — экран разбора, стопка из трёх книг правил (Chess.com, Lichess, Chessigma);
  6. правило Chess.com его словами («a good piece sacrifice», «more generous … for newer players»), дождь стикеров
     новичку;
  7. одна и та же жертва слона (учебная 9.Bxh7+): тебе — стикер, Магнусу — пустое место, «JUST A MOVE»;
  8. Lichess: такого стикера нет, штамп «DOESN'T EXIST»;
  9. тест Chessigma: стена из ста «!!», «One free tool found only 23»;
  10. реклама (48–58 с): диаграмма их бенчмарка с логотипом — 93; телефон с разбором — «No limit, no signup»; ход в
      приложении получает флажок SIGMA — «There, they're called... Sigma»; их карточка, «Link in bio»;
  11. вопрос «So, how many brilliant moves do you have?» и петля на первый кадр.
- **Где знак спонсора до рекламы:** корешок книги правил Chessigma (28–29 с). В кадрах с Магнусом его нет (правило 78).
  Реклама стоит в конце по правилу 61; Элиоту это объяснено в черновике ответа ниже.
- **Проверено записью автора (25.11, со входом): Chessigma ставит 50.Qh6+ оценку Sigma.** Запись —
  `episodes/nobrilliant/photos/rec/sigma.mp4` (8,6 с, разбор этой партии: «Kh1 is best», «Qf2 is best», «Rc8+ is
  clown», «Kh7 is miss», 50.Qh6+ — вспышка и флажок SIGMA на 5,95 с). Она стоит в двух планах рекламы (версия 2
  черновика): «No limit, no signup» и «There, they're called... Sigma». Отрезок «Rc8+ is clown» в ролик не взят.
  Старая запись без входа (`review.mp4`) осталась только в финальном плане (панель «Your brilliant moves»).
  Какой значок ставит Chess.com, не проверяли: сцена «тот же ход» — на учебной жертве слона.
- **Файлы** (в `episodes/nobrilliant/build/`, в git не попадают):
  `The64Files_Brilliant_Moves_Dont_Exist_Chessigma_v2_DRAFT.mp4` — автору (v1 — до новой записи приложения);
  `…_v2_PREVIEW.mp4` — превью для Элиота (720×1280, с надписью PREVIEW). Пересборка: `./build.sh nobrilliant` или шаги
  из [CLAUDE.md](CLAUDE.md); голос в кэше (`episodes/nobrilliant/tts_cache`), кредиты не тратятся.
- **Голос:** дубли bait 1, ny 2, ad1 3 (в дублях по умолчанию одна фраза была громче остальных на 2,7–3,5 дБ);
  `voice_check.py` — «no phrase stands out». Вёрстка — «no issues», планов короче 0,6 с нет, −16,4 LUFS.
- **Магнус нарисован с бородой** (Магнус канала), хотя в 2016-м он был без неё: хук должен читаться с первого кадра.
- **Дальше:** автор смотрит черновик → правки → превью Элиоту (заливает автор: коннектор Drive из сессии берёт до
  3 МБ) → его письменное «ок» → 4К (`--scale 2`), отпечаток (`tools/proof.py`), публикация с #ad и Branded content.
  `fivepoints` v6 остался без спонсора: выпускать ли его как обычный ролик без рекламного блока — решает автор.
- **25.11, вечер.** Автор залил на Drive черновик v1 (id `1dhFvSb-G8uj9I2IaYKfujvy0SNhRihYn`, доступ по ссылке), на
  вопрос «отправить?» ответил «всмысле переснять», после объяснения записал экран приложения со входом и прислал
  запись. Собрана **версия 2** с этой записью; оба файла v2 отправлены автору.
  - Ссылка на Drive ведёт на **v1** (старая запись приложения): для письма нужна ссылка на v2. Из сессии файл не
    приложить и не залить: коннекторы берут до 3 МБ за вызов (превью 9,1 МБ). Заливает автор.
  - Автор залил v2 на Drive: рабочий файл — id `1kG0VxBEcE8zPW0FjdfPNoOsH1j-FhnxE` (26,5 МБ, доступ по ссылке);
    предыдущая заливка `1BMAEkSlV8rjWzEt2Hd7iOmVNExQnqe8O` пустая (0 байт) — её в письмо не ставить.
  - **Письмо Элиоту отправлено 25.11 в 21:00 UTC** по слову автора («ну отправь»): письмо `1a21482deea4d490` в той же
    ветке, копия Мехди, со ссылкой на рабочий файл v2. До этого на вопрос «Отправить?» автор ответил только ссылкой, и
    отправку без его прямого слова система не пропустила. **Ждём «ок» Элиота**; после него — 4К (`--scale 2`),
    отпечаток (`tools/proof.py`), публикация с #ad и Branded content. В письме обещано выложить в течение суток
    после его «ок» и задан вопрос, какую тему делать второй (дебюты, Game Review, принципы).
- **Текст отправленного ответа Элиоту** (вместо `[link]` — ссылка на рабочий файл v2):

  > Hi Eliot,
  >
  > Understood, and thanks for the clear brief: each video is about the feature it promotes.
  >
  > Here is the new video 1, "Brilliant moves don't exist", built on the pitch you quoted: [link]
  >
  > What is in it (62 seconds):
  > - The famous sacrifice is Carlsen's 50.Qh6+ against Karjakin (New York, 2016), which GM Kavalek called "the most
  >   brilliant final move of any world chess championship in history". Stockfish calls it +M2: just a number.
  > - The "!!" is a sticker that a review site adds afterwards, by its own rules: Chess.com's own definition, and
  >   Lichess, which has no such label at all.
  > - Your benchmark: one free tool found 23 of 100, Chessigma's free review found 93. No limit, no signup.
  > - "There, they're called... Sigma": your app reviewing that very game, recorded signed in. The coach's comments
  >   and arrows, then 50.Qh6+ gets its SIGMA flag. Then your end card with the App Store and Google Play.
  >
  > Branding: the integration is at the end, because our average watch time drops when a sponsor appears early (it
  > did with Woodpecker). So we took your second option and put Chessigma on screen in the assets: your rulebook next
  > to Chess.com's and Lichess's (0:28), your benchmark chart with your logo (0:48), your app with the Sigma flag on
  > the brilliant move itself (0:51 to 0:55), your end card (0:55) and your app again (0:58). If you would like the
  > logo on the board in more shots, or one line at the start, tell me and I will add it.
  >
  > I can post within a day of your OK. For the second video this week, which topic would you like first: Openings,
  > Game Review or Principles?
  >
  > Best,
  > The 64 Files

### 24.11 — `fivepoints` версия 6 (Элиот 25.11 не принял как ролик 1; ролик без спонсора)

- **Почему.** Автор вспомнил, что Элиот просил свои темы, первая — brilliant moves: «может как-то переделать под его
  идею, но с той же идеей». Мост через игрока с рейтингом 527 он отклонил (правило 78). После черновика версии 5:
  «сделай видео в общем лучше т.к ты фейбл» — отсюда версия 6.
- **Что хочет Элиот** (письмо 18.11, его слова): «Our brilliant detection is the best on the market alongside
  Chess.com, and it is free: we find 93 of Chess.com's 100 brilliant moves, more than any other free tool». Сюжета он не
  давал. Данные: Chessigma 93, остальные бесплатные разборы — 90, 45, 41, 23.
- **Порядок в версии 6** (77,5 с): история до «Still the only player above 2800» → реклама (18 с) → топ-комментарий →
  вопрос про 2800. Топ-комментарий стал развязкой после рекламы: с конца истории в углу висит закрытая плашка
  «TOP COMMENT» с замком, полоска на ней заполняется всю рекламу, после карточки спонсора она раскрывается.
- **Реклама, 0:50–1:09:**
  1. «One move almost cost Magnus his crown.» — корона падает с вершины на стол зрителя;
  2. «And one brilliant move will make you think you're him.» — в приложении ход получает флажок SIGMA !!, зритель сам
     себя коронует, под сценой комментарий «bro thinks he's Magnus»;
  3. «Chessigma's free, unlimited game reviews find 93 of Chess.com's 100 brilliant moves. More than any other free
     tool.» — тот же ход на телефоне, стена из 100 «!!» (горят 93), диаграмма пяти бесплатных разборов без чужих имён;
  4. «On the App Store and Google Play. Link in bio.» — их карточка 3 с.
- **Что ещё изменено в версии 6:**
  - кадр «The internet asked» был мутным: теперь вопрос набирается в строке поиска над освещённым лицом;
  - топ-комментарий — крупной карточкой в две строки, потом ещё раз над «LITERALLY»;
  - хук ближе к Магнусу, с первых кадров убрано моргание;
  - реплика «Chessigma calls it... Sigma» и планы с лицом в короне, панелью и отчётом убраны — реклама короче на 3 с;
  - на двух планах рекламы в комнате нет метки канала: она наезжала на корону и комментарий.
- **Проверено.** В решающей партии Магнуса бриллианта нет (Stockfish), поэтому его ходы так не называем. Голос —
  чистые дубли (`voice_check.py`). Вёрстка: no issues.
- **Экран приложения — запись автора** `photos/rec/review.mp4`: ход «Bxh3 is sigma» с флажком. Чужие ники закрыты.
  - В записи вход не выполнен: есть кнопка «Sign in for free». Элиот просил показывать разбор залогиненным, поэтому
    кадрируем без кнопки. Если автор запишет этот ход залогиненным — подставить.
  - Из облака значок Sigma не снять: `chessigma.com/tools/analysis?pgn=` оценок ходов не показывает.
- **Вернуть прежний порядок** (топ-комментарий до рекламы): в `script.json` поставить фразу `comment` перед `ad1` —
  планы сами встанут по времени; плашку убрать (`chip` в `scenes.js`).
- **Сроки.** Из почты канала обещан выход в среду, 25.11. Нужно письменное «ок» Элиота: превью ему — как только автор
  одобрит черновик (письмо в §0.3, только по слову автора). Чёрная пятница — 27.11, второй ролик — принципы (§0.0, п. 3).
- **Строку про Black Friday** брать только у Элиота: баннер на сайте 24.11 менялся.

### 0.0. Новое в почте на 24.11 и план

**Что пришло:**
- **Элиот, 23.11, 07:08 UTC.** Спрашивает сроки и просит выложить «at least 2 of your videos» на неделе Чёрной пятницы
  (сама пятница — 27.11). Пришлёт новые ассеты и B-roll с упоминанием Black Friday и вышедшим модулем Principles. Пока
  можно брать то, что есть.
- **24.11, 11:19 UTC, из почты канала ушёл ответ Элиоту** — не из сессии Claude: «I'll post the first video on Wednesday,
  November 25».
  - Превью он не видел, письменного «ок» нет.
  - Наше письмо от 18.11 обещает: «each video goes out only after your approval».
  - Копии Мехди в этом ответе нет.
- **23.11, 05:53 UTC, письмо Google: «You allowed OpenAI access to some of your Google Account data»** для
  `the64filestt@gmail.com`. Письма 24.11 Элиоту и Hungry Studio ушли с разницей в 2 минуты — похоже, оттуда. Спросить
  автора, его ли это доступ. Если нет — отозвать: Google Account → Безопасность → сторонние подключения, и сменить пароль.
- **Hungry Studio (Block Blast!).**
  - 24.11, 08:43 UTC — приглашение.
  - 11:21 UTC — из почты канала ушёл ответ с интересом.
  - 12:24 UTC — условия от Patrick: $50 за ролик сразу на TikTok, YouTube Shorts и Instagram Reels, до 10 роликов по
    10–20 с; по ролику в день 27.11–6.12 и 18–25.12; оплата через 30 дней.
  - Главное условие: «The creator needs to appear on camera».
- **YouTube.** Третье обращение (`AZ47…`) закрыто ещё 22.11: удалены все 24 копии канала The 64 Stories.
- PolyBuzz и Стелла (Chessnut) с 21.11 не писали.

**План по порядку:**
1. **`fivepoints` версия 6 — превью у Элиота с 24.11, около 23:00 UTC** (§0.3). Ждём его письменное «ок». После него:
   собрать 4K, `proof.py`, коммит и пуш, публикация (п. 2). Если попросит правки — внести и показать ему снова.
2. **После «ок»** (25.11):
   - `proof.py`, коммит и пуш;
   - публикация с Branded content и #ad, ссылка в био с `utm_content=fivepoints`;
   - Элиоту «it's live» и счёт на вторую половину INV-2026-003.
3. **Второй ролик к Чёрной пятнице — принципы**: модуль вышел, счёт INV-2026-005.
   - Идея Элиоту — 24–25.11.
   - Сборка — 25–27.11.
   - Превью ему — 27–28.11.
   - Выход — к 29.11.
   - Упоминание Black Friday — по его новым ассетам.
4. **Hungry Studio — встречное предложение отправлено 24.11 вечером** (автор: «давай 150 за видос»): анимированный
   TikTok-ролик без лица, $150 за ролик. Ждём ответ Patrick. Их условия были: $50 сразу за три площадки, автор в
   кадре, ролик в день прямо в неделю Chessigma.
5. **PolyBuzz** — одно короткое напоминание (срок 24.11 настал), по слову автора.
6. **Chessnut** — договор, подписанный братом, отправить Стелле (ждём от автора).
7. **Доступ OpenAI к почте** — подтвердить у автора. Если сам — договориться, кто пишет спонсорам: два агента в одной
   почте уже дали обещание срока без одобрения.

### 0.1. Ждёт решения автора: ролик `fivepoints` для Chessigma

- **Решено 24.11:** ролик 1 — brilliant moves на истории Магнуса, версия 6 (раздел «Сначала»). Варианты А/Б ниже —
  история решения.
- **Письмо Элиоту НЕ отправлять.** 22.11 автор сначала сказал «отправь чессигме», потом остановил: «письмо не кидай».
  Текст письма готов (ниже, §0.3). Отправлять только по новому прямому слову автора.
- До отправки автор решает, как ролик идёт в сделку на 4 ролика по $125:
  - **вариант А (советуем):** ролик 1 вместо «brilliant moves». Первая половина INV-2026-003 (57 €) оплачена 18.11,
    Элиот ждёт идею ролика 1, а тема сейчас горячая;
  - **вариант Б:** отдельный, пятый ролик за $125, новый счёт двумя половинами; brilliant moves остаётся роликом 1.
- Почему вообще спрашиваем. Автор спросил: «всмысле, он прям свои идеи предлагал?» Да: 18.11 Элиот сам назвал 4 темы:
  1. brilliant moves;
  2. дебюты (Opening Trainer);
  3. принципы — после их релиза;
  4. game review — после релиза.

  Мы обещали начать с brilliant moves и присылать идею до работы. `fivepoints` — наша идея вне списка.

### 0.2. `fivepoints` (Магнус чуть не потерял №1): что готово и как пересобрать

- **Текущая версия — 6** (24.11): реклама про brilliant moves, 0:50–1:09; ролик 77,5 с. Что в ней — раздел «Сначала».
  Версия 5 (реклама 21 с в самом конце, 80,6 с) — в git до коммита `c3fec77`. Версию 4 (реклама «find the move
  that's costing you games», 69,3 с) автор одобрял 21.11; она в git до коммита `a37a3e5`.
- Метка канала — тихая (правило 70). Проверка вёрстки: no issues. Магнуса рядом с продуктом нет.
- Готовые файлы лежат только в `episodes/fivepoints/build/`, который не в git; в новом контейнере их нет:
  - `The64Files_Magnus_Five_Points_Chessigma_v6_DRAFT.mp4` — 1080×1920, 77,5 с, около 33 МБ; автору отправлен 24.11;
  - `The64Files_Magnus_Five_Points_Chessigma_v6_PREVIEW.mp4` — 720×1280, с пометками PREVIEW, 9,5 МБ (`-b:v 840k`), для
    Элиота; автору отправлен файлом 24.11;
  - 4K версии 6 не собран: собрать после «ок» Элиота (ниже, ~25 мин), два прохода `-b:v 12000k`;
  - файлы версий 4 и 5 (без `v6` в имени) устарели, не публиковать;
  - `shortshots.py` отмечает 16,43–16,77 с и 45,07–45,60 с — так было и в версии 4, это не брак: мат и вспышка замка.
- Голос лежит в git: `episodes/fivepoints/tts_cache/` (115 файлов, 14 МБ, вместе с дублями версии 5). Записи экрана —
  `episodes/fivepoints/photos/rec/`. Пересборка не тратит кредиты ElevenLabs и не требует ключа:
  ```
  mkdir -p episodes/fivepoints/build && cp -r episodes/fivepoints/tts_cache episodes/fivepoints/build/
  python3 audio/tts.py episodes/fivepoints          # всё из кэша
  python3 tools/frames.py episodes/fivepoints       # кадры записей экрана
  node render.mjs fivepoints --qa --step 0.1        # должно быть «no issues»
  node render.mjs fivepoints --workers 4 && python3 audio/mix.py episodes/fivepoints            # 1080×1920
  node render.mjs fivepoints --workers 4 --scale 2 && python3 audio/mix.py episodes/fivepoints  # 4K, ~25 мин
  ```
- Как сделать превью для спонсора, написано в начале `tools/preview_overlay.py`:
  - накладываем пометки и уменьшаем до 720×1280;
  - кодируем в два прохода, `-b:v 1350k` (для версии 5: 80 с — около 15 МБ), aac 128k, `+faststart`;
  - называем файл `<имя>_PREVIEW.mp4`.

  Файл для публикации — два прохода `-b:v 12000k` (CLAUDE.md, шаг 8).

### 0.3. Письмо Элиоту с превью — отправлено 24.11

- Куда: ответом в ветку «Re: Invoice INV-2026-001 reissued to ARCHE LABS LTD (The 64 Files x Chessigma)», thread
  `1a1cd1a82e2a9623`, на его письмо от 20.11 (`1a1f7c9484bbad63`).
- Копия: `mehdi@chessigma.com` — поставить самим, в последнем письме Элиота копии нет.
- Превью — ссылкой на Google Drive, и заливает его автор: из облачной сессии коннектор Drive принимает не больше
  ~3 МБ за вызов (проверено 24.11: 9,5 МБ не прошли, 14 МБ тоже). Не пытаться обойти — отдать файл автору.
- **Письмо с превью версии 6 отправлено 24.11 около 23:00 UTC** (`1a20fcad41f7622a`, ответ на письмо Элиота от 23.11,
  копия Мехди). Превью залил автор: Drive канала, id `1qnr9UunSJMWRG3jF0qPskc8A4C2u36ZL`, доступ по ссылке.
  **Ждём письменное «ок» Элиота; до него не публиковать.** Текст ниже — то, что ушло.

Версия от 24.11, вечер. Прежний черновик (ролик Магнуса вместо brilliant moves) устарел; он в git, коммит `0bfa30d`.
Письмо с превью — когда ролик готов (секунды и ссылку вписать):

```
Hi Eliot,

Here's video 1 for your approval: <LINK>

It's about brilliant moves, as you suggested, built on the story everyone in chess is talking about this week:
Magnus nearly losing his No. 1 spot. Chessigma comes in at 0:50–1:09: the crown Magnus almost lost lands on the
viewer's desk, "One brilliant move will make you think you're him", and a move gets its Sigma in your review on the
phone. Then your line, "Chessigma's free, unlimited game reviews find 93 of Chess.com's 100 brilliant moves. More
than any other free tool", with the 100 moves on a wall and the five free tools as bars (the other four are not
named), and your card with App Store / Google Play and "link in bio". Magnus never appears with the product.

The story's last beat (the top comment) and the question to viewers come right after your card: a locked "top
comment" tag stays on screen through your part, so people have a reason to watch it to the end. The PREVIEW marks
are only on this file.

One note: the app recording we have was made signed out, so we framed the review without the "Sign in for free"
button. If you'd rather see the coach's comment there, we'll re-record it signed in.

As we wrote, we'd like to post it on Wednesday, Nov 25, as soon as you OK it, with Branded content on, #ad, and
your link in bio. For the second Black Friday video we're thinking Principles, now that the module is out; we'll send
you the idea next. Please send the new assets and the exact Black Friday line you want us to use.

Thanks for checking on crypto. No problem, bank transfer works fine for this contract.

Best,
The 64 Files
```

Если превью к вечеру 24.11 не готово — короткое письмо о переносе:

```
Hi Eliot,

Quick update. We're making video 1 about brilliant moves, as you suggested, built on the story everyone in chess is
talking about this week: Magnus nearly losing his No. 1 spot. The preview will come tomorrow, and we'll post as soon
as you OK it, still within Black Friday week.

For Black Friday, please send the exact line and assets you want us to use.

Best,
The 64 Files
```

- Подпись — только «The 64 Files». Личные имена автора и родственников не писать.

### 0.4. После «ок» Элиота

1. Собрать 4K. Затем `python3 tools/proof.py <файл>.mp4` — строка в `business/proofs.md`, коммит и пуш, всё до
   публикации.
2. Опубликовать:
   - Content disclosure → Branded content и #ad в подписи;
   - подпись — `post` из `episodes/fivepoints/script.json`;
   - ссылка в био: `https://www.chessigma.com/go/app/the64files?utm_content=fivepoints`.
3. Элиоту — «it's live» со ссылкой и счёт на вторую половину: INV-2026-003 при варианте А, новый счёт при варианте Б.

### 0.5. Остальное

- **Крипта.** Ответ Элиота 20.11: «At the moment we can't pay bills with crypto. We can look to set it up after this
  contract of 4 videos if this is the only option for you but we would have to figure it out how to make it work».
  - Этот договор — банком, как раньше.
  - Риск для автора: резиденту России закон 259-ФЗ (ст. 14) запрещает принимать крипту в оплату услуг.
- **YouTube, копии канала The 64 Stories.** 22.11 YouTube закрыл все три обращения, удалены все 24 копии:
  - 4 + 10 + 9 — по нашим обращениям;
  - ещё одна, `Wmz-pghiWnE`, была удалена раньше.

  Подробности — `business/youtube_copies.md`.
- **Chessnut (Стелла).** Второго ролика не будет: им нужны ролики, снятые с настоящей доской. Деньги за `hikaru213`
  пришли.
  - Стелле нужен наш подписанный договор. Он у автора: PDF ему отправлен 20.11, в хранилище его нет, там личные данные.
  - Подписывает брат автора, потом договор уходит Стелле.
- **PolyBuzz (Bioby).** Ждём ответа на цену $600. Если до 24.11 тишина — одно короткое напоминание, по слову автора.
- **В новом аккаунте подключить заново:**
  - Gmail и Google Drive почты канала `the64filestt@gmail.com`;
  - ключ ElevenLabs в настройках облачного окружения (для `fivepoints` не нужен).
- **Правила, которые легко нарушить:**
  - письма уходят только по прямому слову автора;
  - имя для юридических писем спрашивать у автора: в счетах канала стоит имя родственника;
  - личные имена, реквизиты и пароли не писать никуда;
  - в Chessigma входить только по слову автора и никогда не нажимать «Sign out»;
  - защиту TikTok от ботов не обходить.

## 1. Коротко

- Вертикальные ролики 1080×1920, 30 к/с, 62–66 с, об истории шахмат и шахматных звёздах. Спонсорские ролики длиннее:
  `hikaru213` для Chessnut идёт 85 с.
- Каналы:
  - The 64 Files (@the64files) — свой канал автора, английский, аудитория США;
  - HappyChess — заказы.
- Как делается ролик:
  - сцены рисуются на canvas (`engine/js`) в headless Chromium через Playwright (`render.mjs`);
  - голос — ElevenLabs (Callum, `eleven_v3`);
  - музыка процедурная, звуки — своя библиотека (`audio/`);
  - сведение в ffmpeg.
- Один ролик — одна папка `episodes/<имя>/`:
  - `script.json` — текст и голос;
  - `scenes.js` — сцены;
  - `SOURCES.md` — факты с источниками;
  - `photos/`.
- Автор канала — заказчик и судья качества:
  - пишет по-русски, отвечать ему по-русски, коротко, с итогом и ссылкой на файл;
  - пожелания оставляет в [Inbox.md](Inbox.md) и в чате.
- Репозиторий: GitHub `ixeware/animation`, рабочую ветку назначает сессия (9.11 — `ccr-d8c74f3b-baggjy`). Полная
  история там. Архив, о котором речь в разделе 10, снят 8.11, `.git` в нём нет.
- Репозиторий — хранилище Obsidian:
  - главная заметка — [Home.md](Home.md) с таблицей всех роликов;
  - ссылки только обычные Markdown, не `[[...]]`.

## 2. Что прочитать, по порядку

1. [CLAUDE.md](CLAUDE.md) — порядок сборки ролика по шагам и правила работы. Главный документ.
2. [Inbox.md](Inbox.md) — новые пожелания автора. Разбирать в начале каждой сессии; сейчас раздел «Новое» пуст.
3. [STYLE_BIBLE.md](STYLE_BIBLE.md):
   - чек-лист в разделе 6 — правила 1–60, каждое из них — пожелание автора;
   - эффекты ходов — §8.
   - Новое пожелание записывать туда новым правилом.
4. [reference/rausis_v2.md](reference/rausis_v2.md) — эталонный ролик в раскадровке (правило 45). Новый ролик сверять с ним.
5. [README.md](README.md) — устройство движка, голос, звук, строка сборки каждого ролика.
6. [IDEAS.md](IDEAS.md) — идеи следующих роликов с проверенными фактами и разбор статистики канала.
7. Ближайший похожий ролик как образец кода. Самый свежий — `episodes/biggerfish/` (Фишер и Stockfish: море, озеро с
   причалом, переход сквозь поверхность воды, стоящая фигура с удочкой); до него — `episodes/hikaru213/` (спонсорский, Chessnut Move):
   - `scenes.js` — бакинский зал, гостиная с доской Chessnut, доска в голове, комната стримера с видом с
     веб-камеры, подводная сцена с вырезкой из логотипа, совмещённый наплыв между двумя мирами;
   - `SCENARIO.md` — полный сценарий с раскадровкой по фразам;
   - `SOURCES.md` — факты, наш прогон Stockfish, фото и логотипы с лицензиями.
   Ещё образцы: `episodes/gmhunter/` (настоящие партии, счётчики), `episodes/dewakipas/`, `episodes/rausis/`.

## 3. Окружение

Проверено на Linux, в облачном контейнере Claude Code:

| Что | Версия | Зачем |
|---|---|---|
| Node.js | 22 | `render.mjs` |
| Playwright | 1.56.1 (`npm i`) | рендер в Chromium. Если браузера нет: `npx playwright install chromium` |
| ffmpeg | 6.1 | склейка частей, сведение, кодирование |
| Python | 3.13 | озвучка, музыка, сведение, инструменты |
| Обязательные пакеты Python | `numpy scipy soundfile pyloudnorm requests pillow openai-whisper chess` | сведение и громкость, тайминги слов, PGN → JSON |
| Пакеты Python по мере надобности | `curl_cffi yt-dlp` (статистика TikTok), `librosa` (анализ звука), `transformers torch` (карты глубины `tools/depth.py`), `kokoro`, `chatterbox-tts` (локальные голоса, запасные) | — |

- Шрифты лежат в `engine/fonts`, системные не нужны.
- Модель whisper при первом запуске скачивается в `~/.cache/whisper`.

### Облачная сессия Claude Code (проверено 9.11.2026)

- Сессия начинается со свежего клона с GitHub: `build/` нет ни у одного ролика, кэша озвучки тоже. Пересобрать даже
  старый ролик — значит озвучить его заново.
- Окружение `animation` (личное, создано 9.11) открывает, кроме пакетных репозиториев: `www.chessnutech.com`,
  `chessnutech.com`, `cdn.shopify.com`, `api.elevenlabs.io`, `openaipublic.azureedge.net` (модель whisper),
  `api.chess.com`. Wikipedia, Wikimedia, TikTok и huggingface.co закрыты — добавлять по мере надобности.
- Ключ ElevenLabs хранится в окружении как секрет сети для `api.elevenlabs.io` (заголовок `xi-api-key`); в переменных
  его нет. Запуск: `ELEVENLABS_API_KEY=proxy-injected python3 audio/tts.py episodes/<ep>` — прокси подставит настоящий.
  Тариф и остаток: `curl -H 'xi-api-key: proxy-injected' https://api.elevenlabs.io/v1/user/subscription`.
- Playwright: в `package.json` 1.56.1, ему нужен Chromium сборки 1194, а в контейнере есть только 1243 (под 1.63).
  Вместо `npm i` связать предустановленный: `mkdir -p node_modules && ln -sfn /opt/node-tools/node_modules/playwright
  node_modules/playwright && ln -sfn /opt/node-tools/node_modules/playwright-core node_modules/playwright-core`.
- Python: `pip install scipy soundfile pyloudnorm openai-whisper` (тянет torch, около 3 ГБ). Пакет `chess` на 3.13 не
  собирается — ставить отдельно, когда нужен PGN → JSON.

## 4. Сборка ролика (подробно в CLAUDE.md)

```bash
python3 audio/tts.py episodes/<ep>                # озвучка -> build/narration.wav, timings.json (ключ ELEVENLABS_API_KEY в окружении)
node render.mjs <ep> --stills 1.0,2.5             # стоп-кадры -> episodes/<ep>/build/stills/ и sheet.jpg
node render.mjs <ep> --qa --step 0.1              # проверка вёрстки: до рендера должно быть «QA: no issues»
node render.mjs <ep> --workers 4 && python3 audio/mix.py episodes/<ep>   # -> build/final.mp4, около −16 LUFS
# файл для TikTok: два прохода x264, 3300k, AAC 160k (команды в CLAUDE.md, шаг 8)
python3 tools/sheet.py <файл>.mp4 sheet.jpg --every 1   # контакт-лист: кадр каждую секунду, смотреть глазами
python3 tools/sheet.py <файл>.mp4 sheet.jpg 9.7 10.0 27.8 --cols 4   # отдельные моменты, секунды через пробел
```

- Время рендера: ролик на 65 с (1958 кадров) в 4 потока идёт 11–12 минут, 200–340 мс на кадр. Запускать в фоне.
- 4К: `node render.mjs <ep> --workers 4 --scale 2` даёт `video.mp4` 2160×3840 (примерно вчетверо дольше). Это не
  растяжение: при `?ss=2` у каждого холста движка вдвое больше точек, а код сцен по-прежнему считает в 1080×1920
  (`engine/js/core.js`, «supersampling»: там же поправки для размытий, теней, `drawImage` и `getImageData`). Вёрстку
  (`--qa`) и черновые кадры смотреть в обычном размере, `--scale 2` — для контрольных кадров и итогового рендера.
  Сведение не меняется (`mix.py` копирует видео). Файл для TikTok — те же два прохода x264, но `-b:v 12000k`.
  Проверка режима: кадр 4К, уменьшенный вдвое, совпадает с обычным (35–41 дБ PSNR на `woodpecker`).
- Каждый поток загружает `scenes.js` один раз, при старте. Правка во время рендера в видео не попадёт: рендер
  перезапустить.
- `--from`/`--to` работают для рендера куска (`--out кусок.mp4`), а в `--qa` игнорируются.
- `./build.sh <ep>` проходит весь путь сразу, без двухпроходного кодирования.
- Движку нужны `build/narration.wav` и `build/timings.json` от `audio/tts.py`. Без них даже стоп-кадры не
  отрендерятся.

## 5. Как устроен `scenes.js`

- Экспортирует `async function build(T)`, которая возвращает `{ shots, cues, music, musicFx, duration: T.duration, ... }`:
  - `shots` — планы `{a, draw(g, lt, t), hud, trans, grade, noJump, info}`; `a` — время начала по словам озвучки;
  - `cues` — звуковые эффекты `[t, имя, громкость]` из библиотеки `audio/samples`;
  - `music` — разделы музыки по настроениям: hook, build, tension, victory, finale, end и другие;
  - `musicFx` — `mute`, `boost`, `lp` в моменты раскрытий.
- Тайминги:
  - `T.s(id)` — начало фразы;
  - `T.w(id, 'слово')` — время слова: первое совпадение без учёта регистра и пунктуации, или индекс слова.
- Камера: `rig(B, lt, [[t, K(yaw, pitch, dist, target, {fov}), ease], ...])`.
- Текст на экране (`engine/js/hud.js`):
  - `badge` — плашки, y 230 / 335 / 425;
  - `nameTitle` — имя вверху кадра;
  - `counter` — счётчики;
  - `placeStamp` — место и дата;
  - `stamp` — штамп, y около 1530.
  - Полоса субтитров — y 1212–1366: туда не ставить ни текст, ни лица.
- Персонажи:
  - `CAST` и `drawChar` (`engine/js/characters.js`);
  - `standing(...)` и `seated(...)` — фигура в 3D-сцене;
  - у живых людей — мультяшные двойники, реальное фото — `photo3d` (2.5D).
- Доска:
  - `Board`, `piecesAt(plies, k, u, SLIDE_OPTS)`;
  - эффекты ходов — `movefx.js` и `hifx.js` (§8 стайлбука);
  - партии лежат в `engine/data/*.json`, их делает `tools/pgn_to_json.py`.
- Палитра и наборы (галерея, зал, гора и т. п.) — свои у каждого ролика, в его `scenes.js` (правило 48).
  Общий код — в `engine/js`.

## 6. Главные правила автора

Полный список — в STYLE_BIBLE, раздел 6. Самые важные:

- Канал-получатель выяснить до начала работы (правило 29):
  - константа `CHANNEL` в `scenes.js` даёт финальную плашку;
  - гравировка `@THE64FILES` на доске; для HappyChess — `useMark(...)`.
- Режим защиты (правило 70, с 14.11.2026): движок сам кладёт на каждый ролик движущуюся полупрозрачную метку
  `@the64files` со строкой «IF YOU SEE THIS ON YOUTUBE, IT'S STOLEN» (`engine/js/guard.js`):
  - финальная карточка спонсора — план с `noGuard: true`; чистый мастер спонсору — рендер с `--guard off`;
  - перед публикацией — `python3 tools/proof.py <файл>`, коммит и пуш (шаг 10 в CLAUDE.md).
- Длина своего канала — 62–66 с (правила 34, 42).
- Хук с первого слова (правило 1). Первый кадр — яркая обложка (правило 28).
- Вопрос в конце — про самого зрителя, с ответом числом (правила 26, 39).
- Голос — всегда Callum, `eleven_v3`. Аудиотеги пишутся в поле `say`, чистый текст для субтитров — в `text` (правило 36).
- Ролик — 3D-мир, а не слайды (правила 43, 20):
  - каждая фраза — сцена в объёмном наборе с движением камеры;
  - переходы через предметы и экраны, как в Rausis v2.
- Партии на досках — настоящие, ход в ход (правило 49). Доска — как в правиле 46.
- У каждого ролика своя палитра (правило 48). Неона и свечения текста нет. Текст — как в `brilliant` (правило 33).
- Факты:
  - у каждого факта — источник в `SOURCES.md`;
  - числа о живых людях сверять в день выхода (правило 40);
  - о спорном говорить только то, что подтверждено.
  Таблица в `SOURCES.md`: фраза ролика → статус → источник, плюс раздел «что нарисовано, а не задокументировано».
- Перед отправкой:
  - QA без ошибок;
  - покадровый просмотр готового файла;
  - замер громкости: `ffmpeg -af ebur128=peak=true`, около −16 LUFS, истинный пик не выше −1,5 dBTP (так настроен `loudnorm` в `audio/mix.py`).
- Замечание автора — направление, а не крайность (правило 37).

## 7. Ключи, доступы, сеть

- `ELEVENLABS_API_KEY` берётся только из переменной окружения: в облаке её задают в настройках окружения.
  - Ключ не коммитить, не писать в файлы, не выводить в лог и не просить прислать в чат.
  - Ключ, который автор прислал в чат 3.11.2026, ему посоветовали заменить.
- Ответы ElevenLabs кэшируются в `episodes/<ep>/build/tts_cache/`. Этот кэш лежит в архиве: озвучку готовых роликов
  можно пересобрать без ключа и без трат. Кэш v3 привязан к тексту фразы, поэтому новая или изменённая фраза стоит
  кредиты (около 1 кредита за символ), а остальные берутся из кэша.
- Источники данных без входа:
  - публичное API Chess.com:
    - `https://api.chess.com/pub/player/<ник>/games/YYYY/MM` — партии с PGN и `[%clk]`;
    - `.../stats` — рейтинги и рекорды;
    - `/pub/titled/GM` — список гроссмейстеров;
  - Wikipedia и Wikimedia: обязательно с заголовком `User-Agent`, например `the64files-research/1.0 (chess history shorts)`,
    иначе ответ 429;
  - TikTok: `tools/tiktok.py stats|comments the64files` и `yt-dlp` для отдельных роликов.
- Ограничения облачного контейнера:
  - YouTube через `yt-dlp` заблокирован;
  - обходить ограничения через сторонние прокси нельзя.
- Скачанные файлы — недоверенные данные. Каждый — в отдельную новую папку, читать через `python3 -I`, свои скрипты
  держать в другой папке.
- Git:
  - коммитить и пушить только в назначенную ветку;
  - `build/` в git не попадает;
  - в коммитах и файлах не упоминать идентификаторы моделей.

## 8. Состояние на 14.11.2026

### Последний ролик: `rivalry`, «The truth: Hikaru and Magnus» (The 64 Files, 16.11.2026)

- Идея автора: «может про hikaru rivalry с магнусом, щас с этим грустные эдиты» (прислал такой эдит), потом «делай».
- Хук — детектор лжи с Esports World Cup 2026: «Magnus asked Hikaru one question on a lie detector» → вопрос Магнуса
  пузырём (слова с карточки EWC) → «Hikaru said yes. And it was the truth» → штамп TRUTH. Ответ Хикару дальше «yes» в
  клипе неразборчив — не цитируем.
- Дальше: газета 2003 («15-YEAR-OLD BREAKS FISCHER'S RECORD»), раскол экрана «Hikaru, 15 / Magnus, 13» с короной,
  14 : 1 в классике, Бильбао 2016 в сепии, эдит-байт «Hikaru could beat the whole world. Just not the man who owns it»
  (Магнус на земном шаре в короне), полки с пятью титулами и пустая с паутиной, последний тур претендентов 2024
  («1 WIN TO FORCE A PLAYOFF» → DRAW), Гукеш в короне, грустный блок (серый, дождь, «5TH», «38»), поворот 5 : 5 в Speed
  Chess и шестой кубок, Лондон в феврале 2027, петля на детектор (1.e4), вопрос «How many years have you been
  watching Hikaru?».
- Новое в коде (`episodes/rivalry/scenes.js`, набор взят из `fairplay`): `lieDetector` (`polygraph`, `wired`),
  `newspaper`, `vsKids`, `crown`, `scoreSet`, `globeScene` (Земля из `witty2`), `shelves`, `rain`, `speedSet`; мальчики
  `hikaru15`, `magnus14`, взрослый `gukesh18`. Сборка обеих версий: `scratchpad/scripts/build_ep.sh rivalry rivalry`.
- **Версия 2** (автор прислал скрин комментария: «добавь эту цитату с визуализацией и побольше динамики в видео на
  каждый момент», правило 73): после «He's 38» — цитата «A man will spend his whole life building a ladder to reach
  the sky. Just to find out that someone else was born with wings» (фразы `ladder`, `wings`; дубли 1 и 3): мальчик у
  подножия лестницы, наплыв из его лица в 38; взрослый строит последние перекладины (годы 2003…2026 на плашках),
  выходит за облака, свет на лице на «sky»; Магнус взлетает мимо на крыльях и зависает выше, перья падают на Хикару;
  перо падает на шахматные часы поворота (`ladderWorld`, `climber`, `wings`, `flyer`, `feathers`, `chessClock`).
  Динамика: 38 планов на 72 с (было 20 на 66), у плоских сцен своя камера (`view2`, `cam2`), удары на словах
  (`zoom: kicks(...)` — новый параметр плана в `engine/js/main.js`), кубки и числа по одному. Вырезка из газеты 1958
  с настоящим фото Фишера (United Press, 1956, public domain). Фраза про Лондон стала плашкой.
- **Версия 3** (автор: «на моменте с гукешом я бы перелистнул…», «в моменте где крылья сделай получше…», перо —
  переходом на весы; потом два фото, «сделай еще отсылки на эти фото»; правило 74): кусок с Гукешем переписан — «In
  2024, it came down to the last round. Hikaru had to beat Gukesh» (старое «would have forced a playoff» было неверно),
  ROUND 14, MUST WIN, лица с часами (`faceOff`), рукопожатие (`handshake`), корона с конфетти и плашкой про Женеву,
  потом стадион в Арлингтоне 2025 (`stadium`, `kingThrow`): «The next year, Hikaru checkmated the world champion in a
  stadium. And threw his king into the crowd». Крылья — 4 вида (надежда, взлёт от подножия мимо лет, тень, перо);
  перо через склейку садится на весы (`balance` на шахматных часах, `heroF`). Мемы: плакаты «I ♥ Magnus»
  (`signsMeme`) на «Then Magnus showed up», пьедестал блица 2019 (`podiumMeme`) на «who owns it». 79,5 с.
- **Версия 4** (автор: «качество как то упало… больше 3д сцен и деталей в энвайроменте»; правило 68): плоские
  сцены — снова 3D-декорации: `scoreTable` (табло за спиной соперника, кадры через плечо), `trophyRoom`, `deskScene`,
  `cand2` (лицом к лицу через плечо, часы на столе), `arena3` + `fans3` + `throw3` (стадион), `studio` + `balance3`
  (весы на часах в ночной студии), `signs3`, `podium3`. Лица на экранах и в рамах — `camTex`.
- Факты — [SOURCES](episodes/rivalry/SOURCES.md). Файлы: `episodes/rivalry/build/rivalry.mp4` (TikTok) и
  `rivalry_youtube.mp4` (метка без строки про YouTube).

### Предыдущий ролик: `fairplay`, «Chess.com will catch you anyway» (The 64 Files, 15.11.2026)

- Заказ автора: «почему чесс ком в любом случае словит на тебя на читерстве, используя все наши приемы». Собран по
  чек-листу [memory/retention.md](memory/retention.md); 63 с, без спонсора; первый ролик с меткой защиты (правило 70). Сейчас 65,5 с (версия 3).
- Два места действия в 3D: дневная комната со стрим-монитором (из `witty2`: `dayRoom`, `online`, веб-камеры) и
  гигантская шахматная доска под открытым небом (`arena`) для четырёх ловушек; новые предметы — капканы, толпа пешек,
  сто партий, стена веб-камер, дверь и агенты Fair Play, банка очков, глаз в окне (`eyeTex`).
- Факты — [SOURCES](episodes/fairplay/SOURCES.md). `www.chess.com` из облачной сессии не открывается: цифры за
  октябрь 2026 взяты из поисковой выдачи с цитатами страниц — перед публикацией автору сверить на самом сайте.
- Версия 2: мем-слух о Хансе после хука (RUMOR, сканер, NOTHING FOUND), правки по проверке глазами зрителя, 65,5 с;
  вторая сборка для YouTube — метка без строки про YouTube (`--guard handle`).
- Версия 3 — по замечанию «я бы перелистнул на третьем этапе» (правило 71): третья ловушка — история с «тобой» за
  доской, доска детектива со ста партиями и красными нитями, шок и наезд (`corkTex`, `youAtBoard`); через все ловушки —
  камера YOU в углу (`youCard`), в конце на неё падает штамп CLOSED.
- Версия 4 — «вот каждую сцену таким образом прокачай»: в каждом плане лицо со сменой эмоции. Новое в коде: `camCard`
  (камера-карточка в углу: Ханс в хуке, «ты» в ловушках), `hansDesk` (Ханс за столом без доски, отчёт перед ним),
  камера Ханса в `browser` (`face`) и переключение вкладок, `lineup` (опознание за стеклом: стена с ростом, таблички,
  «!», свет, шаг вперёд), `camWall({ mood: 'happy', from })` для возврата очков, `profile({ mood })`, `monRect`.
- Версия 5 — хук с вибратора и эдит-байт на фразе Ханса (правило 72): «A vibrator has been accused of beating Magnus
  Carlsen» (`pixVib` — предмет под мозаикой), «Hans said chess speaks for itself. Chess.com listened.»; Магнус с
  «1 MOVE» теперь на 6-й секунде; финал — петля на первый кадр. 65,2 с.
- Версия 7 — эдит-байт по идее автора: Готэм обманывает стримснайпера (ловушка 4, `streamTex`, позиция в `GB`), байт с
  фразой Ханса убран; 66,2 с.
- Файлы: `episodes/fairplay/build/fairplay.mp4` (1080p, TikTok) и `fairplay_youtube.mp4` (метка без строки про
  YouTube); `fairplay_4k.mp4` — устаревшая первая версия. Перед публикацией — `python3 tools/proof.py <файл>`, коммит
  и пуш (шаг 10 в CLAUDE.md).

### Предыдущий ролик: `witty2`, Witty Alien vs Magnus, round two (The 64 Files)

- **Версия 7 (14.11.2026)** — по замечанию «в середине скучно, в кадре только доска»: Марс за окном Witty
  (`MARS_WIN`), его дом на Марсе и крик-ударная волна с марсоходом (`marsHome`, `roverParts`), «камеры» обоих игроков
  с реакциями в планах партии (`faceCams`), кадр с жестами по картинке автора (`handClash`); правило 69, SOURCES
  «Версия 7». Финал собран и отдан автору 14.11.2026: `build/witty2_4k.mp4` (2160×3840, 79,6 с, −16,3 LUFS),
  `build/witty2.mp4`, превью `build/The64Files_Witty_vs_Magnus_Chessigma_PREVIEW.mp4`; версии 5 и 6 лежат рядом как
  `witty2_v5*.mp4`, `witty2_v6*.mp4`. Проверки: вёрстка на каждом кадре «no issues», вспышек нет (кроме задуманного
  разреза), громкость в норме. Элиот (Chessigma) версии 6 и 7 не видел: публиковать после его письменного «да», с
  Branded content и #ad.
- **Версия 6 (14.11.2026): 79,2 с, 19 фраз** — новая концовка по просьбе автора: Марс (`marsView`, `lying`), перелёт
  к Земле (`toEarth`), линейка «humans» в тонах мема на весь кадр (`humans`), козья ферма в 3D с пролётом камеры (`farm3`, `goatParts`, `barn`, `gate`), крик Witty со стрима
  (`witty_scream`), его комментарий пузырём после «Stand proud»; см. SOURCES, «Версия 6», и правила 67–68.
  Финал собран и отдан автору 14.11.2026: `build/witty2_4k.mp4` (2160×3840, 79,2 с, −16,3 LUFS), `build/witty2.mp4`,
  превью для Chessigma `build/The64Files_Witty_vs_Magnus_Chessigma_PREVIEW.mp4`; файлы версии 5 лежат рядом как
  `witty2_v5*.mp4`. Проверки готового файла: вёрстка на каждом кадре «no issues», вспышек нет (кроме задуманного
  разреза на 49,3 с), все слова слышны в миксе. Публиковать только после письменного «да» Chessigma, с Branded
  content и #ad; Элиот версию 6 ещё не видел.
- **Версия 5 (финал 14.11.2026): 75,6 с, 19 фраз**, Callum `eleven_v3`, `voice_fx.engine 2`. Переделка по замечаниям автора
  (голос с обрезками, «в целом лучше и без ошибок», дизайн образов, новая развязка, сцены) — что именно и почему, в
  `episodes/witty2/SOURCES.md` («Версия 5» и «Правка версии 5 после просмотра автором») и правилах 64–66. Финальные
  файлы — `build/witty2_4k.mp4`, `build/witty2.mp4` и превью для спонсора; автор их получил 14.11, его «ок» и «ок»
  Элиота на финал ещё не получены.
- Код: `episodes/witty2/scenes.js` — инструменты из `gmhunter` (3D-примитивы, `tableSet`, часы), комната `dayRoom`
  (окна в торцах, шторы, ковёр, `bookcase`, `wallPrint`), «территории» `voidSky` / `shrineSky` (считаются от направления
  камеры), монитор `monitorSet` (`splitTex` — две вебки, или кадр разбора `tvCanvas(k)`), `online()` и `domain()`,
  страница манги `lying()` с камерой `lieCam`, плашки для светлого фона `titleDay`, `scoreDay`, `evalHud`.
  `episodes/witty2/cast.js` — образы: `CAST.wit` (`hairFx`, `faceFx`, `bodyFx`; выражение `band` 0..1 — повязка,
  `glow` — свечение глаз) и `CAST.mag`. В движке (`engine/js/characters.js`) — фазы `faceFx('iris')`, `faceFx('top')`,
  крючок одежды `bodyFx`, выражение передаётся в `hairFx`.
- **ElevenLabs:** на бесплатном тарифе кредиты кончились 13.11.2026; в тот же день автор сохранил в окружении новый ключ
  (тариф Starter, 40 000 кредитов в месяц, сброс 13.12.2026). Остаток — `python3 tools/voice_check.py --quota`. Дубли
  `witty2` версии 5 записаны ещё на бесплатном тарифе и сохранены в `episodes/witty2/voice/` (как восстановить кэш — в
  его `README.md`).
- Развязка: фразы `and` («And...», пауза 1,6 с) и `resign` («Witty lost.», `tempo: 1.0`); время разреза `CUT`, звук
  `slash` из `audio/samples` (сделан `tools/sfxgen.py`).
- Блок Chessigma в конце (их карточка `photos/rec/closer.mp4`, кадры — `tools/frames.py`): **Элиот принял ролик
  13.11.2026** (бонус $100 за 1 млн просмотров за 30 дней) и попросил снять разбор из-под входа в аккаунт и без боковой
  панели — сделано в тот же день (`photos/tv`, `photos/tv/hd`; как переснять — `capture/` и SOURCES, «Телевизор с
  разбором»). Публиковать — после его «ок» на финальный файл, с Branded content и #ad (`memory/sponsors.md`).
- **Канал-копия на YouTube** перезаливает ролики автора; таблица копий, ссылки для жалоб и доказательства —
  `business/youtube_copies.md` (13.11.2026: подано 6 жалоб из 24, канал автора на YouTube заблокирован «за
  impersonation», новый — `@the64filesofficial`).
- Сборка: `python3 tools/frames.py episodes/witty2 && node render.mjs witty2 --workers 4 --scale 2 && python3 audio/mix.py
  episodes/witty2`, кодирование — два прохода x264, как в шаге 8 `CLAUDE.md`.

### Предыдущий ролик: `woodpecker`, «He has seen your position before» (пилот для Chessigma Supercoach), версия 5

- **Вышел 11.11.2026, 23:45 UTC** (версия 5, 89,8 с): https://www.tiktok.com/@the64files/video/7707064184718036232. Письмо Элиоту со счётом INV-2026-002 —
  отправлено 12.11 в 00:01 UTC, ссылка на 4К v5 (Drive) — следом в 00:10. Переоформленный INV-2026-001 на ARCHE LABS LTD отправлен 12.11. Бонус $50 — при 500 тыс. за 30 дней.
- **Версия 3 (11.11.2026, 85,8 с)** — вторая правка автора: бесплатные отчёты по партиям — главное у Chessigma (намёк в
  начале «its game reviews are free: more on that at the end» (в v3 было «reports», в v4 исправлено по брифу), объяснение в конце вместе с App Store и Google Play);
  эдит-байт должен быть метафорой («You can surprise a human. But not a library»); дятел сидит на плече лапами на
  худи (`SHOULDER`, `SBIRD`). Блоки спонсора теперь с 17,9, 44,3 и 63,2 с. Окно со значками сторов —
  `photos/chessigma_stores.jpg` (с их главной страницы; в v4 убрано, вместо него их финальная карточка). Экран самого отчёта из сессии не открылся: часть сайта
  грузится с `cdn.chessigma.dev`, которого нет в разрешённых адресах окружения, — добавить его или попросить запись у
  автора. На их страницах всплывающие окна появляются через ~8 с после загрузки; закрывать их крестиками, а не удалять
  блок `.csRoot` — это корень всей страницы.
- **Сценарий утверждён (11.11, 16:13)** с правками Элиота: всё на экране — запись их приложения на телефоне; бит 5 —
  его фраза (озвучена, ролик 89,8 с — у верхней границы 90 с); список кадров для автора — `episodes/woodpecker/RECORDING.md`.
  Оплата — счётом с банковскими реквизитами (не PayPal), 50 % сейчас. Черновик ответа — `r-2350411356565556930`.
  Ссылка в био: `https://www.chessigma.com/go/app/the64files`. Следующий шаг: записи от автора → заменить на экране
  телефона сайт и скриншот App Store записями приложения → рендер 4К.
- **Версия 4 (11.11.2026, 86,2 с)** — по киту Chessigma (Drive «chessigma-creator-kit-v1», бриф в `SOURCES.md`, раздел
  «Chessigma's creator kit»): «reports» → «reviews»; в конце их скриншот App Store `01-review` и их финальная карточка
  3 с со значками сторов (`photos/chessigma_store_review.png`, `photos/rec/closer.mp4`); ссылка в био
  `https://www.chessigma.com/go/app/the64files?utm_content=woodpecker-video`. В движке новый ключ плана `flat: true`:
  без наезда, тряски, грейда, виньетки и зерна — для материалов спонсора, которые нельзя менять.
- Память между сессиями — папка `memory/` (предпочтения автора, эдит-байты, референсы, спонсоры, журнал): читать в
  начале, дописывать после каждого пожелания.

- Заказной пилот для Chessigma на The 64 Files, 76,7 с, итоговый файл в 4К. Версию 1 («He copied a woodpecker», 10.11)
  автор вернул: «сделай его поинтереснее, т.к я бы пролистал, нужно както упомянуть магнуса … желательно с эдит
  байтом», потом: «сделай его в 4к» и «упомяни чессигме не только в конце, а то retention к концу падает … нужно еще в
  начале как то упомянуть, и в середине». Сценарий и раскадровка — `episodes/woodpecker/SCENARIO.md`, факты — `SOURCES.md`.
- Хук — Магнус Карлсен в «зале памяти» (`memoryHall`, `gameCard`, `hall`): называет партии по одной позиции, не узнал
  только позицию из «Гарри Поттера»; эдит-байт «He isn't calculating. He has seen your position before» — стена
  карточек загорается золотом. Дальше — Ханс Тикканен и метод: берёзовый лес (`wood`, `forest`), дятел в трёх позах
  (`birdBody`, `birdOnTrunk`, `birdFly`), кабинет (`study`), стена из 1 128 карточек (`cardWall`, `heroCard`).
- Chessigma — три блока на телефоне в лесу, каждый строит `phoneSeg` (программа экрана, рамки, клевки дятла):
  16,5 с — игра Board Memory, 41,2 с — тренажёр Woodpecker с таймером, 60,1 с — наборы и тренер. Экран телефона —
  `screenTex`: страница сайта (`{page}`), одна картинка (`{still}`) или кадр записи (`{rec, sec}`).
- Материалы Chessigma (правило 56): страницы сайта, снятые 11.11.2026 в окне размером с телефон с плотностью 4
  (`photos/chessigma_woodpecker.jpg`, `chessigma_memory.jpg`), раунд Board Memory с публичной страницы
  (`photos/rec/memory.mp4`: скрипт играл сам — смотрел, где пешки, и нажимал эти поля) и записи экрана, которые снял
  автор со своего аккаунта (`photos/rec/train|solve|think|answer|home|brain.mp4`). Перед рендером записи превращаются
  в кадры: `python3 tools/frames.py episodes/woodpecker` (в `build/rec`, в git не попадает).
- В записях автора скрыт ник соперника (размыт в `home.mp4`; из `train.mp4` срезаны первые кадры, где он был виден).
  Оригиналы записей в репозиторий не кладём. Новые записи смотреть покадрово на чужие имена до того, как резать клипы.
- Магнус ни в одном кадре не стоит рядом с продуктом спонсора: блоки спонсора — другой набор (лес, дятел).
- Имя Ханса не показывается до развязки «And his name? Hans Tikkanen». Внешность — наша (красная шапка, бирюзовое
  худи), не портрет.
- На доске — учебный спёртый мат 1.Qg8+ Rxg8 2.Nf7#. В `engine/data/tal_queen.json` чёрная ладья стоит на d8, и там
  есть мат в один ход 1.Qxd8#; в этом ролике ладья переставлена на f8 (в коде `PZ`). В роликах `brilliant` и `tal`
  позиция осталась прежней.
- 4К: `node render.mjs woodpecker --workers 4 --scale 2` (движок сам рисует кадр 2160×3840, см. раздел 4), сведение
  как обычно, файл для TikTok — два прохода x264 на 12000k.
- Голос — бесплатный тариф ElevenLabs; перед публикацией переозвучить на платном и отрендерить заново.
- Готовые файлы в `episodes/woodpecker/build/`: `woodpecker_4k.mp4` (чистый, 2160×3840), `woodpecker.mp4` (чистый,
  1080×1920) и `The64Files_Woodpecker_Chessigma_v3_PREVIEW.mp4` (720p с водяным знаком PREVIEW, для письма Chessigma).

### До него: `biggerfish`, «There's always a bigger fish»

- The 64 Files, около 68 с. Сначала Stockfish (рыба из логотипа, 19 титулов TCEC), потом «but there's always a bigger
  fish» — Бобби Фишер, «рыбак» по-немецки. Главная мысль: пока рыбак был жив, он ловил всех; Stockfish 1.0 вышел
  2 ноября 2008-го, через десять месяцев после его смерти. Эдит-байт — прозвище The Fisherman.
- Сценарий, задание автора и раскадровка — `episodes/biggerfish/SCENARIO.md`, факты — `SOURCES.md`.
- Внешность Фишера — вариант A с листа `reference/fischer_look_v1.jpg`, губы потоньше (решение автора). Фраза
  «I hate chess» — его слова по решению автора; первоисточника с точной записью не нашли, это записано в SOURCES.
- Что есть в коде (`scenes.js`): окно поверхности снизу с силуэтом рыбака (`surfaceUp`), подводное море (`sea`),
  озеро с причалом в четырёх настроениях (`lake`), стоящий рыбак с удочкой или с поднятой рукой (`fisher`), кадр
  наполовину под водой (`overUnder`), красная советская машина (`machine`), серая комната с фото (`greyRoom`,
  `floorSit`).
- Готовый файл: `episodes/biggerfish/build/biggerfish.mp4`.

### Предыдущий ролик: `hikaru213`, «2.13 seconds»

- Спонсорский ролик для Chessnut Move на канале The 64 Files, 84,8 с. **9.11.2026 Chessnut его берёт**: Stella
  ответила «let's go ahead and move forward with this first video» на письмо с ценой $400. Версия v4 — от 9.11.
- Сюжет: Хикару за 2,13 секунды увидел, что Магнус проигрывает (Баку, 2023, мем октября 2026). После «Magnus resigned»
  сразу идут его подвиги: вслепую против Магнуса, 3500 в блице, 34 победы подряд, «not human», «he IS the engine».
  Потом наука о памяти гроссмейстера и блок про доску.
- Что поменяли в v3 по замечаниям автора:
  - удержание после 20-й секунды: интересное перенесли в начало, наука — после (правило 53);
  - «not human» — капча на стриме проваливается; «doesn't need Stockfish» — настоящая рыба из логотипа Stockfish
    (Klein Maetschke, GPLv3, вырезана `episodes/hikaru213/photos/cut_fish.py`), её имя зачёркивают; «he IS the engine» —
    его шкала оценки до +2.53;
  - «Just like this board» — совмещённый наплыв из доски в голове в доску Chessnut.
- Что поменяли в v4: Chessnut попросил «сделать точнее», автор велел брать материалы с их сайта (правило 56):
  - доска как настоящая (модель CM100): 632 × 520 × 22 мм, клетки 55 мм, широкие боковые поля — там по два ряда стоят
    фигуры не в игре, как в их анимации; белое поле с координатами;
  - логотип — конь из шапки сайта в роли «C» и HESSNUT шрифтом сайта (Montserrat) — на обоих боковых полях и на передней
    полосе с кнопками и синими огоньками; плашка «CHESSNUT MOVE» тоже с их логотипом;
  - фигуры на основаниях (`skin: 'nut'` в `engine/js/pieces.js`); рентген показывает мотор, батарею, колёса и датчик
    в основании. В v4 основания были медные; 10.11 Chessnut поправил: медные — у деревянного набора, а у пластикового
    (белые и чёрные фигуры, как у нас) основания белые и чёрные. Так сделано в v5;
  - камеры 15 планов сдвинуты так, чтобы логотип был целиком в кадре или целиком за ним и не под субтитрами: `qaLogo`
    пишет его в QA как текст;
  - на башнях рейтингов подпись «CHESS.COM BLITZ · OCT 2026»: 9.11 разница 58 (Хикару 3433, Магнус 3375), а «a hundred
    points behind» — про день рекорда.
  - Что откуда взято — раздел «The Chessnut Move as drawn» в `SOURCES.md`.
- Готовые файлы — в `episodes/hikaru213/build/` (в git не попадают): `hikaru213.mp4` — чистовой,
  `The64Files_2.13seconds_ChessnutMove_v5_PREVIEW.mp4` — 720p с водяным знаком PREVIEW для Chessnut (v5, 10.11)
  (`tools/preview_overlay.py`).
- Перед публикацией:
  - промокод или ссылка от Chessnut (запрошены в письме 9.11) — в био и, если дадут код, на финальную плашку;
  - озвучка: ключ ElevenLabs в облачном окружении на **бесплатном** тарифе (проверено 9.11: `tier: free`, 10 000
    символов в месяц), а для рекламы нужен платный. После перехода удалить `episodes/hikaru213/build/tts_cache` и
    озвучить заново (около 1 400 символов);
  - TikTok: Branded content и #ad в подписи (подпись — в `SCENARIO.md`);
  - правило 40: в день выхода ещё раз сверить рейтинги.

### Переписка (Gmail the64filestt@gmail.com)

Письма уходят из сессии (`send_message`, обычный текст в `body`, ветка — `replyThreadId`), но только по прямому слову
автора («отправь письмо…»): черновиков в Gmail он не видит. До 13.11.2026 здесь было «только черновиками» — устарело.
Письма спонсорам подписаны «The 64 Files»; имя для юридических писем спрашивать у автора, из документов не брать.
Файл до 10 МБ можно прикрепить ссылкой на него (`sha256:<хэш>:<путь>` в `content`); видео больше 10 МБ автор кладёт
на Drive сам и присылает ссылку.

- **Chessnut.** 4.11 — предложение на `mkt@chessnutech.com` (копия `contact@`); 6.11 Stella Zhuang
  (`stella.zhuang@chessnutech.com`, Business Development Manager) спросила про анимацию, платформы и цену; 7.11 автор
  отправил «Finished video with the Chessnut Move» с превью и ценой $400 (на `mkt@` и Стелле); 9.11 Stella: «I just
  watched the preview and it looks great! Let's go ahead and move forward with this first video», какие файлы нужны.
  - 9.11 автор отправил ответ с v4 (версия точнее, по материалам их сайта; просьба о промокоде или ссылке; оплату
    предложил криптой или банковским переводом).
  - 10.11 Stella: «the video looks amazing!»; одна правка — медные основания бывают у деревянного набора, а у
    пластикового белые и чёрные (прислала референс с размерами доски) — сделано в v5; PayPal подходит, просит адрес
    PayPal или счёт. Промокод или ссылку ещё не прислала — напомнить в ответе.
  - 10.11 черновик ответа `r5280308267962109044` в её ветке: основания исправлены (v5), адрес PayPal автора; в био —
    их страница Chessnut Move, если не пришлют другую ссылку или промокод (на просьбу о коде они не ответили, код не
    обязателен); удобная дата. Превью v5 (15,9 МБ) прикрепляет автор.
  - Порядок до публикации: Stella подтверждает v5 → голос заново на платном тарифе ElevenLabs и
    повторный рендер → публикация с Branded content и #ad → ссылку на ролик Стелле. Оплату до или после публикации решает
    автор.
- **Chessigma.** Черновик `r-6311885331962669296` («Brilliant moves don't exist») на `mehdi@chessigma.com`, копия
  `eliot@chessigma.com`. 9.11 автор попросил им написать: в тексте прямые ссылки вместо переадресаций Google и «over
  6.6 million views»; факты о Chessigma сверены с их сайтом (бесплатно, без лимита и регистрации; в Brilliant
  Benchmark — 93 из 100; лучший ход у них называется Sigma). Автор отправил его 9.11.
  - 10.11 ответил Eliot Hennebo: согласны на пилотный ролик. Идея с бриллиантовыми ходами хорошая, но просят тему ближе
    к их платному продукту: дебюты, метод Woodpecker или Chess Coach — и одну строку-угол для выбранной. Просят:
    медиакит; топ-5 стран и возраст аудитории (скриншот аналитики TikTok); вводную ставку за ролик и что в неё входит
    (время на экране, упоминание в подписи, сколько ссылка в био, можно ли им использовать ролик в своей рекламе);
    срок от брифа до публикации. Пришлют аккаунт Supercoach для съёмки; если пилот удастся — долгое партнёрство с
    долей выручки по нашей ссылке или промокоду.
  - 10.11 черновик ответа `r-3770698730930618932` в их ветке: тема Woodpecker (история Тикканена: три нормы ГМ за семь
    недель в 2010-м, по издателю книги), запасной вариант Chess Coach; аудитория из аналитики; $400 за пилот, Supercoach
    на экране от 20 с и в голосе, упоминание в подписи с #ad и Branded content, ссылка в био 7 дней, Spark Ads 30 дней
    без доплаты, одна правка, около недели от брифа до публикации. Эти условия предложил Claude — автор проверяет и
    прикладывает медиакит (`business/The64Files_media_kit.pdf`). Автор отправил его с ценой $250.
  - 10.11 (13:26) Eliot: тема Woodpecker утверждена («a great pick, let's go with it»). Встречное предложение:
    **$150 и ещё $50, если ролик наберёт 500 тыс. просмотров за первые 30 дней**; право использовать ролик или нарезки в
    рекламе Meta (Facebook, Instagram) 90 дней; финальный файл без водяного знака TikTok. Остальное принято: 60–90 с,
    Supercoach на экране от 20 с и в голосе, упоминание в подписи с #ad, ссылка в био 7 дней, Spark Ad 30 дней, одна
    правка, около недели. Оплата: 50 % после утверждения сценария, 50 % после выхода. Аккаунт Supercoach готов:
    chessigma.com → Sign in → Google с почтой канала. Тренажёр: chessigma.com/puzzles/woodpecker.
  - **11.11 автор принял встречное предложение целиком** («не торгуемся, я согласен на его цену», Meta ads разрешить).
    Черновик ответа `r-6772054753752942289` в ветке Элиота: согласие по пунктам, сценарий v3, вопросы про строку о
    сторах, ссылку в био и оплату (PayPal @MoukhamadIssaev). Отправляет автор, приложив
    `The64Files_Woodpecker_Chessigma_v3_PREVIEW.mp4`. Ниже — как было до этого.
  - 11.11 автор отправил это письмо (в 11:17; по размеру — без превью). В 16:00 Элиот открыл просмотр папки Drive
    «chessigma-creator-kit-v1» без текста. Из сессии её не открыть: `drive.google.com` закрыт сетью, коннектора Drive
    нет. Нужны файлы от автора или коннектор Google Drive (claude.ai/customize/connectors, потом новая сессия).
  - Раньше: автор не отвечал на встречное предложение. Ролик `woodpecker` собран (11.11 — версия 2
    с Магнусом в хуке и тремя упоминаниями Chessigma); Eliot ждёт сначала сценарий на утверждение (текст диктора —
    `episodes/woodpecker/script.json`, раскадровка — `SCENARIO.md`), новый текст ему ещё не отправлен. 11.11 автор
    написал, что ролик для Chessigma загрузит сам.
  - 11.11 Chessnut: автор опубликовал «2.13 seconds» (https://vt.tiktok.com/ZSp51XmoS/) и добавил описание; черновик
    письма Стелле об этом — `r5135567081375406598` в её ветке (ссылка, $400 на PayPal @MoukhamadIssaev, цифры через
    несколько дней). Отправляет автор.
- **WorldOS.** 5.11 Evan (`bd@worldos.cc`) предложил платную интеграцию; 6.11 автор ответил (идея — матч Фишер — Спасский
  1972 как мир WorldOS) и спросил ставку. Ответа пока нет.
- **ChessUp** — 4.11 только автоответ поддержки. **Square Off** — письмо на `hello@squareoffnow.com` не доходит (ошибка
  их сервера), писать через другой канал.
- ElevenLabs 8.11 сообщил о входе с нового устройства (Chrome на Windows, около Самары). Если это не автор — сменить
  пароль и ключ API.

### Медиакит и статистика канала (10.11.2026)

- Медиакит для спонсоров: `business/The64Files_media_kit.pdf` и страница `business/media_kit.html` (то же самое; опубликована
  и как личная страница Claude, делиться ею — через Share). Числа — из скриншотов аналитики TikTok, которые прислал автор.
- 28 дней, 12.10–8.11: 12,1 млн просмотров, 887,9 тыс. лайков, 42,5 тыс. репостов, 10,7 тыс. комментариев, 69,8 тыс.
  заходов в профиль; вовлечённость (лайки + комментарии + репосты) / просмотры = 7,8 %. Подписчиков около 14 тыс. —
  прочитано по графику, точного числа на скриншотах нет.
- Зрители: 18–24 — 38,2 %, 25–34 — 41,7 %, 35–44 — 10,5 %, 45–54 — 5,7 %, 55+ — 3,9 %; мужчин 70 %. Страны:
  Филиппины 23,4 %, Индонезия 11,9 %, США 7,8 %, Малайзия 4,1 %, Вьетнам 2,9 %.
- Подписчики: 18–24 — 36,8 %, 25–34 — 41,4 %; мужчин 69 %. Страны: Филиппины 16,1 %, США 8,6 %, Индонезия 5,8 %,
  Малайзия 3,3 %, Великобритания и Вьетнам по 2,1 %, Германия 2,0 %, Бразилия 1,9 %, Канада и Таиланд по 1,5 %.

### Дальше

- Режим защиты готов, но в деле ещё не был: первый ролик с меткой — следующий. Автору показан демо-клип
  (`episodes/witty2/build/guard_demo.mp4`); его слова о прозрачности, размере и частоте прыжков — в правило 70 и в
  `DEF` в `engine/js/guard.js`. Имя канала в голосе и ник на предметах сцены — мои предложения, он их не утверждал.
- Ждём ответов: YouTube (три ветки), Элиот и Стелла (просьбы подать заявки на удаление копий) —
  [business/youtube_copies.md](business/youtube_copies.md). Chessnut: $400 обещаны на понедельник, 16.11.
- Если Chessnut согласится: ролик «Механический турок → Chessnut Move» (обещан в письме) и доска Chessnut Move с
  логотипом во всех роликах (идея пакета).
- Идеи — в [IDEAS.md](IDEAS.md). Перед выбором освежить статистику: `python3 tools/tiktok.py stats the64files`.
  Автор просит современные темы, которые уже работают на канале (GothamChess, Mittens, Хикару, Магнус), а не
  историю ради истории.

## 9. На чём легко ошибиться

- Записи экрана от автора: в первых и последних кадрах клипа бывает соседний экран (в `woodpecker` в начале записи
  вкладки Train был главный экран с ником соперника). Смотреть первый, средний и последний кадр каждого клипа; чужие
  ники размывать или срезать и сказать автору, что скрыто.
- Доска у нижнего края при низкой камере даёт «стену огромных клеток» и крупные фигуры, срезанные рамкой (правило 22).
  В `woodpecker` помогло: длинный объектив издалека (`fov: 3000`, дистанция вдвое больше — доска ложится тонкой
  полосой), или камера сверху с `pitch` около 0,5 и всей доской в кадре; стол при этом продлить к зрителю, чтобы не
  было видно его торца.
- Реальный человек в хуке (Магнус) и спонсор: не ставить их в один кадр и не писать текст так, будто он пользуется
  продуктом.
- После озвучки смотреть не только слова, но и конец каждой фразы в `timings.json`: в дубле `woodpecker` после первой
  фразы осталось 1,7 с тишины (щелчок в конце дубля не даёт `trim()` её срезать). Лечится ключом фразы `"tail_db": -45`
  в `script.json` (`audio/tts.py`).

- Плашка «влетает» с увеличением. В первые 0,1–0,2 с она может касаться краёв кадра — это нормально. Проверять кадр
  после влёта.
- Камера в зале может упереться в спину игрока или в стол. QA этого не ловит, только просмотр глазами. Лечится сменой
  `yaw` или `dist`.
- `texQuad` принимает canvas, не `Image`, и запоминает его средний цвет. Текстуры создавать один раз (memo по
  значению), а не в каждом кадре.
- Слова в `timings.json` иногда слипаются по времени: несколько слов на одной отметке (правило 25). Проверить после
  озвучки, иначе склейка придётся не на то слово.
- Нумерация ходов. Полуход `k` — позиция в JSON партии с индексом `k`. Ход чёрных `n...` — это полуход `2n`. Например,
  `63...Rh6#` — полуход 126. Подписи на экране сверять с PGN.
- Формулировки:
  - говорить только то, что подтверждает источник;
  - чужое утверждение не приписывать герою: в `gmhunter` «треть всех GM» сказал автор тиктока, поэтому плашка
    «THE CLAIM», а не «HIS CLAIM».
- Музыка не должна перекрывать голос: при сведении голос около −18 LUFS, музыка около −29. Перед раскрытиями музыку
  глушит `musicFx` с `mute`.
- Субтитры строятся из `text`, а озвучка — из `say`. Если в `say` есть слово, которого нет в `text` (как «So» в
  hikaru213), его не будет в субтитрах. Кэш v3 привязан к `say`: правка одного `text` бесплатна, после неё снова
  запустить `audio/tts.py`.
- Совмещённый наплыв (два мира в одном кадре): `trans: 'fade'`, у обоих планов одна и та же траектория камеры по
  абсолютному времени и `kb: 0`, иначе кадры разъедутся на 4 %.
- Вырезка из картинки по цвету (логотип, предмет): маска по оттенку, самая большая связная область, мягкий край и
  снятие цветного ореола; ориентацию проверять глазами (рыба сначала вышла вверх брюхом). Пример —
  `episodes/hikaru213/photos/cut_fish.py`.
- Объект, нарезанный полосками (плывущая рыба), собирать на отдельном холсте и рисовать с тенью один раз: тень на
  каждой полоске даёт вертикальные полосы.
- Gmail-коннектор агента: вложение до 10 МБ, весь запрос до ~3 МБ файлов. Видео к письму прикрепляет автор сам.
- Wikimedia API быстро отвечает 429: представляться в `User-Agent` и делать мало запросов.

## 10. Что в архиве и чего в нём нет

- Есть:
  - всё, что в git (вместе с этой запиской и `AGENTS.md`);
  - кэш озвучки `episodes/*/build/tts_cache/`;
  - `episodes/hikaru213/build/timings.json` и `narration.wav` — последний ролик рендерится сразу, без `tts.py`.
- Нет:
  - остальной `build/` — рендеры, части, стоп-кадры, около 8 ГБ, пересобираются командами выше;
  - `node_modules/` — ставится через `npm i`;
  - `.git` — история на GitHub.
- После распаковки:
  1. `npm i`;
  2. поставить пакеты Python (раздел 3);
  3. проверка: `node render.mjs hikaru213 --stills 41.7` — в `episodes/hikaru213/build/stills/` должен появиться кадр
     с рыбой Stockfish под водой;
  4. для других роликов сначала `python3 audio/tts.py episodes/<ep>` — озвучка и `timings.json` берутся из кэша, ключ
     не нужен. Без `build/timings.json` движок не запустится: страница получит 404 и рендер упадёт по таймауту.
     Так проверено на распакованном архиве 3.11.2026 (gmhunter), тайминги совпали с оригиналом байт в байт.
