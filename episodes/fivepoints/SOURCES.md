# Five points: Magnus nearly lost world No. 1 (Chessigma, November 2026)

Заказ автора (20.11.2026): «сделай видео для чессигмы с идеей про то что магнус щас чуть не потерял титул, но все таки он
goat и он забрал его титул, никто не близко, как то попробуй интегрировать рекламу в нормальном контексте а не просто
чтоб ощущался как отдельный рекламный таймлайн».

Факты проверены 20.11.2026 (поиск, трансляция Lichess, Stockfish в сессии). Где замысел автора расходится с фактами:
- **«Забрал титул»** — Магнус №1 не терял, он **удержал** первое место. «Титул» в ролике — первое место рейтинга, не
  корона чемпиона мира (её у него нет с 2023 года).
- **«Никто не близко»** — Каруана подходил на 5,4 очка. В ролике: «Still the only player above 2800» (по лайв-рейтингу).
- Он удержался ещё и потому, что не вышел на две рейтинговые партии против Ассаубаевой (17 и 18 ноября): несыгранная
  партия в рейтинг не идёт; Сутовский (FIDE) назвал это «pathetic unsportsmanlike conduct». В ролике этого нет (длина);
  если в комментариях спросят — это правда.

## Событие
- Total Chess World Championship Tour Pilot, Будапешт, 10–20 ноября 2026: 24 игрока, $650 000; блиц, рапид и
  «Fast Classic» 45+30, который FIDE считает в классический рейтинг.
  [FIDE](https://www.fide.com/chess-superstars-set-for-total-chess-world-championship-tour-pilot-in-budapest/),
  [FIDE о Fast Classic](https://www.fide.com/fide-launches-pilot-project-to-test-fast-classic-for-standard-rating/),
  [ChessBase India, правила](https://chessbase.in/news/total-world-championship-pilot-2026-rules-explained).
- Группа C, 11–15 ноября: у Магнуса **10 партий Fast Classic, 9 ничьих, 1 поражение, ни одной победы**; 5-е место из 6,
  сетка за 17–20 места. PGN группы — [Lichess](https://lichess.org/broadcast/total-chess-world-championship-tour-pilot-2026-group-stage-c/round-5/frgTPEfx)
  (`api/broadcast/UPwHJSZj.pgn`), [ChessBase](https://en.chessbase.com/post/total-chess-budapest-2026-groups-5).

## Поражение Мартиросяну (13 ноября, группа C, 3-й день)
- Мартиросян — Карлсен 1-0, сицилианская Найдорфа; PGN — `engine/data/martirosyan_carlsen_2026-11-13.pgn`
  ([Lichess](https://lichess.org/broadcast/total-chess-world-championship-tour-pilot-2026-group-stage-c/round-5/frgTPEfx/42oACrDx)).
  В заголовке трансляции дата 2026.11.09 — ошибка трансляции; партия сыграна 13.11
  ([FIDE](https://www.fide.com/martirosyan-defeats-carlsen-on-day-3-in-budapest/)).
- **39...Qd5??** — по часам трансляции после хода у Магнуса 0:46 (за ход до этого 1:37): «under a minute». Stockfish
  (в сессии): до хода +2.28, после — мат в несколько ходов (40.Rh8+ Kg6 41.Qg4+ …), лучше было 39...g6.
- После партии лайв-рейтинг 2807,2 (−15,8), Каруана 2800,0 — разрыв 7,2.
  [Chess.com, day 4](https://www.chess.com/news/view/2026-total-chess-world-championship-tour-pilot-day-4),
  [ChessBase India](https://chessbase.in/news/can-caruana-overtake-magnus-carlsen-total-chess-pilot-day-3).

## Пять очков
- 14 ноября: **Карлсен 2804,0, Каруана 2798,6 — 5,4 очка**, самый маленький разрыв турнира.
  [ChessBase](https://en.chessbase.com/post/total-chess-budapest-2026-groups-4),
  [Chess.com, day 5](https://www.chess.com/news/view/2026-total-chess-world-championship-tour-pilot-day-5).
- Ближе было только в 2018-м (ноябрь 2018: 2835 и 2832, 3 очка).
  [ChessBase](https://en.chessbase.com/post/fide-ratings-2018-11).
- После группы: Карлсен 2801,2 (−21,8 за пять дней).
  [World Chess](https://worldchess.com/news/is-the-carlsen-era-over-world-no-1-crashes-out-of-total-chess).
- №1 без перерыва с июля 2011 года.
  [Chess.com](https://www.chess.com/news/view/magnus-carlsen-15-years-unbroken-world-number-one).

## Решающая партия: Карлсен — Артемьев, 19 ноября
- Матч за 17-е место, 1-й день; Магнус отдал без игры два рапида, нужна была победа в Fast Classic. **Ничья — около
  2799, впервые почти за 17 лет ниже 2800.** Победа — 2804,0 и №1.
  [Chess.com, day 9](https://www.chess.com/news/view/2026-total-chess-world-championship-tour-pilot-day-9),
  [ChessBase](https://en.chessbase.com/post/total-chess-budapest-2026-ko-3),
  [ThePrint (PTI)](https://theprint.in/sport/carlsen-forfeits-rapid-games-opts-to-play-fast-classic/3103713/).
- PGN — `engine/data/carlsen_artemiev_2026-11-19.pgn` ([Lichess](https://lichess.org/broadcast/total-chess-world-championship-tour-pilot-2026-finals/game-7-fast-classic/glKGdlBO/tQtyuwsW)).
  **29...Qc2** — у Артемьева после хода 0:37; ChessBase: «29...Na4! would have held». Stockfish в сессии: до хода +0.04,
  после +1.11, лучший ход 29...Na4. Дальше Магнус реализовал: 43...Bxg3 (+5.6), 49.Qg2, 1-0.
- **20 ноября (проверено по трансляции Lichess в 19:00 UTC):** во второй день матча Магнус снова не вышел на Fast
  Classic против Артемьева (партия записана 1-0 при одном полуходе — неявка), несыгранная партия в рейтинг не идёт:
  у Магнуса остаётся **2804,0**. Каруана сыграл вничью с Вашье-Лагравом (2707) 19 и 20 ноября: около −1,1 за партию
  при K = 10, лайв ≈ 2792 (2794,2 после 18 ноября). Накамура не играл — 2792,0. Итог: Магнус №1 и **единственный выше
  2800** по лайв-рейтингу; фраза «Still the only player above 2800» верна. Официально — в листе FIDE 1 декабря.

## Lock in (мем ролика)
- Сам Магнус 14.08.2026 подписал свой ролик **«always locked in. #EWC2026»** (около 412 тыс. просмотров) — в ролике
  это его пост (перерисован нашим интерфейсом, без логотипов), на него отвечает развязка «He locked in».
- В ноябре это главная реакция зрителей на гонку за №1: «magnus lock in please 😭» (около 5 тыс. лайков, под @chess
  «NOBODY has been this close to Magnus in YEARS»), «yo unc let's lock in ✌️» (около 15 тыс., под его роликом про
  свинку Пеппу 09.11), «magnus lock in» (1,7 тыс.), «Yo Magnus don't bottle that number 1 spot». Снимки лайков — 20.11.2026.
- «IS THE CARLSEN ERA OVER?» — заголовок World Chess после группы
  ([World Chess](https://worldchess.com/news/is-the-carlsen-era-over-world-no-1-crashes-out-of-total-chess)); в ролике —
  газета нашего вида с этим вопросом, без логотипа издания.

## «When your lowest is their best» — буквально
- Самая низкая точка Магнуса в ноябре — **2801,2** (после группы, 15.11). Лучшая точка Каруаны в ноябре — **2800,0**
  (13.11; в листе FIDE на 1 ноября у него 2783, дальше 2798,6 → 2794,2 → около 2792). Даже на дне Магнус выше лучшего
  дня соперника. В ролике числа подписаны «NOV 2026, LIVE», чтобы не спорить с пиком Каруаны 2844 (2014).
- «17 years»: Chess.com, день 9 — ничья опустила бы его ниже 2800 «for the first time in 17 years»; заголовок «Carlsen
  Stays Above 2800» ([Chess.com](https://www.chess.com/news/view/2026-total-chess-world-championship-tour-pilot-day-9)).

## Комментарии (мемы зрителей)
- Топ-комментарий под @chess «NOBODY has been this close to Magnus in YEARS» (14.11, 1,1 млн): **«When your lowest is
  their best.»** — около 20 тыс. лайков. [TikTok](https://www.tiktok.com/@chess/video/7708158933801749774). В ролике —
  карточкой «TOP COMMENT» и сразу числами (выше).
- «washed»: под видео Магнуса «The Internet is a really mean place» (30.10) топ-комментарий «"washed" and he is a world
  champion in chess 😭✌️». Частое: «magnus lock in».

## Chessigma (спонсор)
- Названия оценок по умолчанию: Sigma, Awesome, Best, Nice, Ok, Theoretical, Strange, Bad, Miss, Clown (код страницы
  разбора и [блог](https://www.chessigma.com/blog/how-chessigma-analysis-works)).
- Кит для авторов: можно «free unlimited game reviews», «on the App Store and Google Play»; значки сторов один раз,
  App Store первым; финальная карточка — их файл. Ссылка в био:
  `https://www.chessigma.com/go/app/the64files?utm_content=fivepoints`.
- **Версия 5 (24.11.2026): тема спонсора — brilliant moves.** Элиот, письмо 18.11.2026: «Our brilliant detection is the
  best on the market alongside Chess.com, and it is free: we find 93 of Chess.com's 100 brilliant moves, more than any
  other free tool». Его данные: 100 настоящих бриллиантов Chess.com прогнали через все бесплатные разборы — Chessigma
  нашёл 93, остальные 90, 45, 41 и 23. Страница теста:
  [chessigma.com/benchmarks/brilliant](https://www.chessigma.com/benchmarks/brilliant) (проверено 24.11.2026: Chess.com
  100/100 «answer key», Chessigma 93/100, дальше 90, 45, 41, 23).
  - В ролике это его слова: «its free review finds 93 of Chess.com's 100 brilliant moves. More than any other free
    tool.» Стена из 100 «!!», горят 93; на диаграмме пять бесплатных разборов, четыре других без имён.
  - Связка с историей: «One move almost cost Magnus his crown. And one brilliant move will make you think you're him.»
    Корона падает на стол зрителя, он сам себя коронует. Комментарий «bro thinks he's Magnus» — мем, не цитата
    конкретного человека; число лайков на карточке выдумано.
  - «Chessigma calls it... Sigma.» — Sigma у них и есть оценка бриллиантового хода: экран разбора пишет «Bxh3 is sigma»
    и ставит флажок SIGMA !!, а панель называется «Your brilliant moves».
  - В решающей партии Магнуса бриллианта не было: Stockfish (глубина 18) по всем ходам белых жертв не нашёл, а
    29...Na4 Артемьева — тихий ход. Ходы Магнуса бриллиантовыми не называем.
  - Экран — запись автора `photos/rec/review.mp4`: панель «Your brilliant moves» (0–2,8 с), отчёт (2,8–5,8 с), ход Bxh3
    с флажком SIGMA (с 7,9 с). Чужие ники закрыты (`recClean` в `scenes.js`).
  - В записи вход не выполнен: под комментарием тренера кнопка «Sign in for free». Элиот просил показывать разбор
    залогиненным (13.11.2026), поэтому кадрируем без кнопки. Лучше переснять этот ход залогиненным.
- **Версия 6 (24.11.2026):** реклама короче — «Chessigma's free, unlimited game reviews find 93 of Chess.com's 100
  brilliant moves. More than any other free tool.» и «On the App Store and Google Play. Link in bio.»; реплика про
  Sigma убрана. Топ-комментарий «When your lowest is their best» (он настоящий, см. выше) стоит после рекламы; до
  него в углу закрытая плашка «TOP COMMENT». Строка поиска «is the carlsen era over» в кадре «The internet asked» —
  наш рисунок по заголовку World Chess, без логотипов.
- Связка с историей (версия 3, до версии 5): «One move almost cost Magnus his crown. Want to find the move that's costing you games?» —
  дальше запись приложения автора (`photos/rec/review.mp4`) и их карточка. Магнуса и других реальных людей в кадре с
  продуктом нет: разбор его партий в Chessigma не показываем.
- Обе партии импортированы на chessigma.com (PGN): Карлсен — Артемьев `chessigma.com/games/ff53cbdb-47e7-4fa9-a852-51c0f42305ea`,
  Мартиросян — Карлсен `chessigma.com/games/fc0473cd-056b-4790-b6b8-44059ac7630b`. В облачном браузере сессии разбор
  новой партии не запускается (движок не стартует); уже разобранные партии показываются с оценками. Экраны снимаем
  после того, как разбор один раз прогонят на настоящем устройстве.
