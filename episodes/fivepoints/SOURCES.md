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
- **20 ноября** Магнус играет второй день против Артемьева; если партия Fast Classic будет сыграна, лайв-рейтинг
  изменится (победа ≈ +2,7, ничья ≈ −2,3, поражение ≈ −7,3 при разнице ~170). Фразу «Still the only player above
  2800» сверить с итогом до рендера (`tc2/watch.py` в сессии).

## GTA
- GTA V вышла 17 сентября 2013 — Магнус уже два года был №1. GTA VI вышла **19 ноября 2026** — в день решающей партии.
  [Rockstar Newswire](https://www.rockstargames.com/newswire/article/ak3ak31a49a221/grand-theft-auto-vi-is-now-set-to-launch-november-19-2026),
  [Deadline](https://deadline.com/2026/11/gta-6-sales-launch-day-surge-videogame-1237229514/).
- Сам Магнус 13.11 выложил коллаж «Time flies when you're having fun» с логотипами GTA V и GTA VI (1,6 млн
  просмотров); в комментариях: «Magnus carlsen is the first ranking player before gta 5 was released».
- «WASTED» и «MISSION PASSED! RESPECT +» — экраны GTA, мем. Рисуем своим шрифтом и цветом (правило 62), логотипы игры
  не используем.

## Комментарии (мемы зрителей)
- Топ-комментарий под @chess «NOBODY has been this close to Magnus in YEARS» (14.11, 1,1 млн): **«When your lowest is
  their best.»** — около 20 тыс. лайков. [TikTok](https://www.tiktok.com/@chess/video/7708158933801749774). В ролике —
  плашкой «TOP COMMENT».
- «washed»: под видео Магнуса «The Internet is a really mean place» (30.10) топ-комментарий «"washed" and he is a world
  champion in chess 😭✌️». Частое: «magnus lock in».

## Chessigma (спонсор)
- Названия оценок по умолчанию: Sigma, Awesome, Best, Nice, Ok, Theoretical, Strange, Bad, Miss, Clown (код страницы
  разбора и [блог](https://www.chessigma.com/blog/how-chessigma-analysis-works)).
- Кит для авторов: можно «free unlimited game reviews», «on the App Store and Google Play»; значки сторов один раз,
  App Store первым; финальная карточка — их файл. Ссылка в био:
  `https://www.chessigma.com/go/app/the64files?utm_content=fivepoints`.
- Обе партии импортированы на chessigma.com (PGN): Карлсен — Артемьев `chessigma.com/games/ff53cbdb-47e7-4fa9-a852-51c0f42305ea`,
  Мартиросян — Карлсен `chessigma.com/games/fc0473cd-056b-4790-b6b8-44059ac7630b`. В облачном браузере сессии разбор
  новой партии не запускается (движок не стартует); уже разобранные партии показываются с оценками. Экраны снимаем
  после того, как разбор один раз прогонят на настоящем устройстве.
