# Witty Alien vs Magnus Carlsen: round two — источники

Ролик для The 64 Files (своего канала), продолжение `witty`. Идея автора, 12.11.2026: «может сделать про то как витти
снова поиграл с магнусом но проиграл»; «рекламу надо только под конец» (в этом ролике рекламы нет); «добавь визуальные
элементы референсом что витти это годжо, а магнус сукуна, и в конце витти все таки проиграл» (правила 61, 62).

## Партии

| Партия | Дата (UTC) | Контроль | Итог | Источник |
|---|---|---|---|---|
| Witty_Alien — MagnusCarlsen | 7.11.2026, 19:37–19:47 | блиц 5+0, без рейтинга | 0–1, белые сдались на 54-м ходу | [chess.com/game/live/186739331724](https://www.chess.com/game/live/186739331724), PGN — `engine/data/witty_magnus_2026-11-07.pgn` (из API `api.chess.com/pub/player/magnuscarlsen/games/2026/11`), JSON — `witty_magnus_2026-11-07.json` |
| MagnusCarlsen — Witty_Alien | 30.09.2026 | блиц 5+0, рейтинговая | 0–1 (Магнус сдался) | [chess.com/game/live/184609437048](https://www.chess.com/game/live/184609437048); ролик `witty` |

Рейтинги Chess.com в партии 7.11: Witty_Alien 2538, MagnusCarlsen 3375. Дебют по PGN: B15, Каро-Канн:
1.e4 c6 2.d4 d5 3.Nd2 dxe4 4.Nxe4 Nf6 5.Ng5 h6 **6.Nxf7 Kxf7** — позиция Alien Gambit (в первом ролике он дан через
3.Nc3, позиция после 4.Nxe4 та же). ChessBase India назвала партию «Magnus Carlsen takes on the Alien Gambit: the
Witty Alien rematch» (страница из сессии не открылась — сайт закрыт сетью окружения; заголовок и пересказ — из поиска).

### Все их партии на Chess.com (архивы MagnusCarlsen, январь 2022 — ноябрь 2026, проверено 12.11.2026)
| Дата | Контроль | Итог |
|---|---|---|
| 28.12.2024 | пуля 1+0 | Магнус выиграл |
| 13.12.2025 | пуля 1+0 | Магнус выиграл |
| 13.12.2025 | пуля 1+0 | Магнус выиграл |
| 30.09.2026 | блиц 5+0 | Witty выиграл |
| 7.11.2026 | блиц 5+0 | Магнус выиграл |
Итого 4:1 в пользу Магнуса — «On Chess.com, it's now four to one. For Magnus.» Совпадает с ChessBase India («4-1»).

### Оценки Stockfish 16 (глубина 18 по всей партии, ключевые места — 26)
| После хода | Оценка (за белых) | Что в ролике |
|---|---|---|
| 6...Kxf7 | −2,0 | «The engine says Witty is losing.» Магнус взял коня королём — «With his king.» |
| 16...Kg8 / 17.Bf5 | −1,0 | |
| **17...Bg6** (ход Магнуса) | **+0,9** | «But Magnus slips. The bar flips. Witty is better.» |
| 20...Qd7 | лучший ход **21.Re6 +1,3** (21...Nxe6 22.dxe6 Qxe6 23.Qxa8+); 21.Rad1 +0,3 | «Move twenty-one. The engine's move: rook e6.» |
| **21.Re2** (сыграно) | −0,2 | «He plays rook e2.» |
| 23.Re6 (сыграно) | −0,1, ответ 23...Nxd5 | «Two moves later, he finds rook e6. Too late.» |
| 28...Nxe7 | −0,1 … −0,2 | равный эндшпиль |
| 31.Nd6 → 37.Bxd4 | −1,6 → −3,7 | «And Magnus just walks his pawns.» |
| 49...d1=Q+ 50.Kxd1, 51...a1=Q | мат | «A queen. Witty takes it. Another queen.» |

### Часы (из `[%clk]`)
- После 21.Re2: Witty 1:22, Магнус 1:14 (Witty даже впереди по времени).
- После 37.Bxd4 / 37...cxd4: Witty 0:19, Магнус 0:21 — «Now it's twenty seconds each.»
- После 54.Ka4 у Witty 0:06,1, у Магнуса 0:12,5; Witty сдался — «Witty resigns with six seconds left.»

## Факты в тексте
- «He beat Magnus Carlsen» — 30.09.2026, блиц 5+0 (выше). «went wild on stream» — новости о его реакции на стриме
  ([DAZN](https://www.dazn.com/en-US/news/chess/magnus-carlsen-loses-witty-alien-chess-influencer-gambit-t3r/1qe98mmwuiadl11ekdkk1gor5e),
  [Chess.com forum](https://www.chess.com/forum/view/general/witty-alien-beats-magnus), YouTube «HE JUST BEAT MAGNUS
  CARLSEN… AND WENT CRAZY!»). Подробности (футболка, штаны) в источниках расходятся — в тексте их нет.
- «Five weeks later» — 30.09 → 7.11, 38 дней.
- «he throws a knight at Magnus. His own weapon. The Alien Gambit.» — 6.Nxf7, гамбит Witty (ролик `witty`).
- «Then he asked for round two» — фигура речи: кто кого вызвал, неизвестно (партия без рейтинга, вызовом); в тексте
  только то, что он пришёл на второй раунд.

## Отсылки — не факты (правило 62)
- «Nah. I'd win.» — мем из манги «Магическая битва» (Jujutsu Kaisen, Гэгэ Акутами): так отвечает Сатору Годжо, глава 221
  ([Know Your Meme](https://amp.knowyourmeme.com/memes/nah-id-win), [Sportskeeda](https://sportskeeda.com/anime/jujutsu-kaisen-fans-riot-viz-ruins-gojo-s-iconic-dialog-chapter-221)).
  На экране плашка «WITTY, PROBABLY:» — это шутка-мем, а не его слова.
- «Stand proud, Witty. You're strong.» — слова диктора, отсылка к фразе Сукуны поверженному Дзёго
  ([Sportskeeda](https://sportskeeda.com/anime/stand-proud-strong-sukuna-s-famous-quote-jujutsu-kaisen-explained)).
  Магнусу не приписывается.
- «WITTY WON.» перечёркнуто — отсылка к мему с панелью «GOJO WON.» (прислал автор).
- Witty в образе Годжо (белые волосы, повязка на глазах, синий свет), Магнус — Сукуны (метки на лице, красный свет).
  Только детали образа в нашем стиле; кадры манги и аниме в ролик не входят.

## Как нарисовано
- Witty и Магнус большую часть ролика — наши персонажи `witty` (из первого ролика) и `magnus`. В образе Годжо (белые
  волосы торчком, чёрная повязка, синие глаза) и Сукуны (полосы под глазами, красные глаза) — только на битах «Nah, I'd
  win», второй ферзь, сдача, «For Magnus», «Stand proud» (просьба автора: не во всех сценах).
- Доска партии — зелёная Chess.com (правило 48: онлайн-партия — её доска), ходы — настоящие ходы партии 7.11.

## Телевизор с разбором Chessigma (версия 2, по просьбе автора 12.11.2026)
- На телевизоре за доской — настоящая публичная страница разбора этой партии на Chessigma:
  https://www.chessigma.com/games/36fc7bb3-b70e-4781-bfe4-d91cf7cd7c65 (партию импортировали из Chess.com через «Import
  more games» для ника witty_alien, без входа в аккаунт; видно «Sign in for free»). Доска перевёрнута белыми вниз
  («Review settings → Flip board»), снимок после каждого полухода (108 кадров, 12.11.2026) — `photos/tv/ply_000…107.jpg`;
  на экране всегда та позиция, что на доске на столе. Скрипты съёмки — в рабочей папке сессии (`w2_capture2.cjs`).
- Оценки Chessigma на этих кадрах: 6.Nxf7 — «clown» («That knight move loses a lot», −1,05), 17...Bg6 — «bad»,
  51...a1=Q — «best» («Clean and accurate»). Совпадают с нашей оценкой Stockfish.

## Блок спонсора в конце (правило 61; предложение Chessigma, пока не согласовано)
- Текст по брифу кита Chessigma (см. `episodes/woodpecker/SOURCES.md`, «Chessigma's creator kit»): «game reviews are
  free and unlimited» (не «report»), «on the App Store and Google Play», «Link in bio»; «every move graded» Элиот
  утвердил в сценарии `woodpecker`. Финальная карточка — их файл из кита (`photos/rec/closer.mp4`, 3 с), без изменений
  (`flat: true`, без субтитров поверх). Плашка AD — на всём блоке. Ссылка в био — по брифу:
  `https://www.chessigma.com/go/app/the64files?utm_content=<ролик>`.

## Эдит-байты (фигуры речи, не факты)
- «In September, the alien beat a human. In November, the human beat the alien.» — игра слов на нике Witty Alien;
  факты под ней: 30.09.2026 Witty выиграл у Магнуса, 7.11.2026 Магнус выиграл у Witty.
- Плашка «THE KING OF CURSES» на «For Magnus» — титул Сукуны из «Магической битвы», прозвище-отсылка, не факт.
- Сцена «столкновение территорий» на «round two. Five-minute blitz.» — по картинке, которую прислал автор (Годжо и
  святилище Сукуны в «Магической битве»). Нарисована заново в нашем стиле (`domainClash`): синяя звёздная пустота и Witty
  со спины слева внизу, красное небо, чёрное святилище с Магнусом на крыше справа вверху, по диагонали — столкновение.
  Кадр аниме в ролик не входит. Плашка «DOMAIN EXPANSION» — термин из той же манги, отсылка.

## Версия 4 (13.11.2026): разрез и «not the GOAT»
Автор прислал панель манги (Годжо лежит после разреза Сукуны) и написал: «сделай в видео с витти типо он побеждает,
но потом разрез, и and... Witty lost, и он также лежит и камера отдаляется, и то что alien can beat humans, but not a goat».
- Фраза сдачи теперь «And... Witty lost.» Факт сдачи сохранён плашкой «RESIGNED · 6 SECONDS LEFT» (у Witty 0:06,1 после
  54.Ka4, `[%clk]`).
- «And...»: Witty в образе Годжо и пузырь «WITTY WON.» — это мем-обманка, не факт. В конце паузы белый разрез наискосок
  режет сам кадр, половинки разъезжаются. Разрезан кадр, а не человек: ни крови, ни разрубленного тела.
- «Witty lost.»: Witty лежит на спине в растрескавшемся кратере среди камней, глаза закрыты, кадр чёрно-белый, как
  манга; камера отъезжает. Своя отрисовка (`lying`), кадры манги в ролик не входят.
- Вместо «In September, the alien beat a human...» теперь «The alien can beat humans. But not the GOAT. Not twice.»
  «Not twice» добавлено, чтобы фраза была верной: 30.09.2026 Witty у Магнуса выиграл, повторить не смог (7.11.2026).
  GOAT («величайший всех времён») — оценка, а не факт. На «But not the GOAT» — Магнус на своей вебкамере.
- 75,3 с вместо 76,8 с.
