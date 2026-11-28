# Brilliant moves don't exist (Chessigma, ноябрь 2026)

Тема — Chessigma. Элиот, 25.11.2026: «each video should be about the feature it promotes. That way the integration feels
natural, and it converts better»; для ролика про brilliant он попросил нашу первую идею (питч от 9.11): Stockfish не
видел ни одного «brilliant», он выдаёт только число; «!!» — ярлык, который сайт разбора ставит потом; один и тот же ход
на одном сайте brilliant, на другом — обычный; Chessigma находит такие ходы бесплатно (93 из 100 в их бенчмарке) и
называет их Sigma. Просьба о брендинге: «a short integration at the start of the video» **или** «some Chessigma
branding on screen, on the board or in the assets you use. For example, the Sigma icon on the brilliant move, or the
Chessigma logo on the board». Письмо — в `memory/sponsors.md`.

Факты проверены 25.11.2026 (поиск, Stockfish 16 в сессии, страницы сайтов).

## Партия
- **Карлсен — Карякин, матч на первенство мира 2016, тай-брейк, 4-я партия (рапид 25+10), Нью-Йорк, Fulton Market
  Building, 30 ноября 2016** — день рождения Магнуса, ему исполнилось 26. Тай-брейк 3:1, титул сохранён.
  [Википедия](https://en.wikipedia.org/wiki/World_Chess_Championship_2016),
  [The Week in Chess](https://theweekinchess.com/chessnews/events/world-chess-championship-2016/magnus-carlsen-retains-world-championship-title-with-a-spectacular-final-move).
- Концовка: 48...Qf2 49.Rc8+ Kh7 **50.Qh6+!!** 1-0. На 50...Kxh6 — 51.Rh8#, на 50...gxh6 — 51.Rxf7#. Карякин сдался
  сразу. PGN и JSON — `engine/data/carlsen_karjakin_2016_tb4.*` (50.Qh6+ — полуход 99).
- Позиция перед ходом: `2R5/4bppk/1p1p4/5R1P/4PQ2/5P2/r4q1P/7K w - - 5 50`. **Stockfish 16 (в сессии): 50.Qh6+ — мат
  в 2 на любой глубине**; любой другой ход проигрывает (следующий по силе −5,8, остальные получают мат). После
  49.Rc8+ уже был форсированный мат в 7 (49...Kh7 — самый короткий путь), то есть в ролике «Stockfish calls it: mate in
  two» — буквально то, что выдаёт движок: `+M2`.
- Цитата: гроссмейстер Любомир Кавалек — «the most brilliant final move of any world chess championship in history»
  ([ChessBase, перепечатка его колонки в Huffington Post, 31.01.2017](https://en.chessbase.com/post/kavalek-on-huffington-chess-champions-and-their-queens-1)).
  В озвучке короче: «A grandmaster called it the most brilliant final move in championship history»; на карточке —
  дословно, с подписью.
- В 2016-м Магнус был без бороды. В ролике — Магнус канала (кудри, борода): хук должен читаться как он с первого кадра
  (правило 57), и в одном ролике одно лицо. Карякин — стилизованный, без портретного сходства.
- Шарики «26» за его креслом — образ к словам «on his birthday» (в зале их не было; после партии зал пел ему
  «Happy Birthday» на пресс-конференции).

## «!!» — ярлык сайта
- Stockfish выдаёт оценку и вариант; значков он не ставит. Chessigma сами: «Stockfish only spits out numbers. Each
  platform turns those numbers into percentages, Elo estimates, and labels using its own secret sauce… like two coaches
  grading the same test» ([блог Chessigma, 15.05.2025](https://www.chessigma.com/blog/how-chessigma-analysis-works)).
- **Chess.com** («How are moves classified? What is a 'blunder' or 'brilliant,' etc.?», обновлено 9.02.2026): «a
  Brilliant move is when you find a good piece sacrifice»; «You should not be in a bad position after a Brilliant
  move», «You should not be completely winning even if you hadn't found the move»; «We are also more generous in
  defining a piece sacrifice for newer players compared to those who are higher-rated».
  [support.chess.com](https://support.chess.com/en/articles/8572705-how-are-moves-classified-what-is-a-blunder-or-brilliant-etc).
  В ролике: «Chess.com's rule: a good piece sacrifice. And it's more generous for new players» — и вывод «the same move
  **can** be brilliant for you, and just a move for Magnus» (возможность, не утверждение о конкретном ходе).
- **Сцена «тот же ход»** показывает не 50.Qh6+, а учебную жертву слона **9.Bxh7+** (французская защита:
  1.e4 e6 2.d4 d5 3.Nc3 Nf6 4.e5 Nfd7 5.Nf3 c5 6.dxc5 Nc6 7.Bf4 Bxc5 8.Bd3 O-O 9.Bxh7+; Stockfish 16: +1,98, лучший
  ход; `engine/data/greek_gift_french.json`). Так ролик не утверждает, какой значок Chess.com дал бы самому ходу
  Магнуса: этого мы не проверяли.
- **Lichess**: в компьютерном анализе есть только неточность (?!), ошибка (?) и зевок (??); отметки «brilliant» нет.
  Chessigma: «Lichess… there is no dedicated "brilliant" classification»
  ([блог Chessigma, 16.03.2026](https://www.chessigma.com/blog/brilliant-move-chess)). В ролике: «On Lichess, that
  sticker doesn't exist at all».
- Названия Chess.com и Lichess — простым шрифтом, без логотипов и фирменного вида.

## Спонсор
- **Бенчмарк Chessigma**: 100 настоящих «brilliant» с Chess.com прогнали через бесплатные инструменты разбора —
  Chessigma нашла 93, остальные 90, 45, 41 и 23 ([chessigma.com/benchmarks/brilliant](https://www.chessigma.com/benchmarks/brilliant)).
  В ролике: «One free tool found only 23. Chessigma's free review found 93». Другие инструменты не названы; на
  экране подпись источника — тест самого спонсора.
- Заявления из кита: «free», «No limit, no signup» (слова из нашего питча, Элиот их повторил; в блоге — «No login, no
  paywall»), «On the App Store and Google Play», их трёхсекундная карточка — как есть.
- «There, they're called... Sigma»: у Chessigma свои названия оценок (Sigma, Awesome, Best, Strange, Bad, Miss,
  Clown): «Sigma… equivalent to a brilliant move».
- **Где знак спонсора в кадре** (реклама по правилу 61 — в конце, поэтому до неё знак стоит на вещах в сцене):
  корешок третьей книги правил в стопке (28–29 с), вывеска стены теста и подпись счётчика (48–51 с), их приложение в
  телефоне (51–55 с, 58–59 с), их карточка (55–58 с). В кадрах с Магнусом знака спонсора нет (правило 78).
- **Запись приложения — новая, со входом в аккаунт** (автор, 25.11.2026, как просил Элиот): разбор именно этой партии
  в приложении Chessigma, последние ходы. Файл — `photos/rec/sigma.mp4` (8,6 с; строка состояния телефона обрезана,
  в шапке — имена двух игроков). Что показывает приложение:
  - 48.Kh1 — «is best», +3.11, «The advantage stays intact»; 48...Qf2 — «is best», M9;
  - 49.Rc8+ — «is clown», M8, «A pin was there to play. Rg1 was stronger» (в ролик этот отрезок не взят);
  - 49...Kh7 — «is miss», M2, «Real trouble now», стрелка на h6;
  - **50.Qh6+ — Sigma**: вспышка приложения и флажок «SIGMA !!» на ферзе (на 5,95 с записи), в ленте ходов «Qh6+ !!».
  То есть значок Chessigma на самом ходе Магнуса **проверен**: Sigma. В рекламном блоке — именно он: «No limit, no
  signup» идёт на комментарии тренера к 48.Kh1, «There, they're called... Sigma» — на 49...Kh7 → 50.Qh6+ с флажком.
  Навигацию внизу и карточку конца партии («Let's go! Continue your training!») кадр и плашка закрывают.
- Прежняя запись без входа (`photos/rec/review.mp4`) осталась только в финальном плане: панель «Your brilliant
  moves» в списке партий (ники других игроков размыты; взят момент 0,3 с, пока список не прокрутился).
- Какой значок ставит этому ходу Chess.com, не проверяли; ролик этого не утверждает (сцена «тот же ход» — на учебной
  жертве слона).

## Правила и приёмы
- Сквозной предмет — круглый бирюзовый стикер «!!»: в руке Магнуса (хук), на стекле аквариума, на ферзе, в руке
  «сайта», на экране разбора, дождём на стол новичка, пустое место у Магнуса и на Lichess, сто плиток на стене,
  флажок SIGMA в приложении.
- Эдит-байт (правило 57): «Stockfish can beat any human. But it has never seen a brilliant move» — пауза в музыке,
  удар, счётчик «0».
- Финал закольцован (правило 10): последний кадр — первый; вопрос числом (правила 26, 39): «how many brilliant moves
  do you have?».
- Stockfish — рыба его логотипа, как в `biggerfish` (правило 53).

## Версия 3: интеграция Chessigma по письму Элиота (26.11.2026)
- **Письмо Элиота, 26.11.2026, 19:10 UTC** (ветка про INV-2026-001, копия Мехди): «The video is great… we'd like a
  different integration». Взять ролик 0:00–0:39,5 (до «…just a move for Magnus»), дальше их B-roll
  («1 - Integration B-roll»; «2 - Example with transition and subtitles» — только пример, «Do the transition your way») и
  их текст слово в слово: «So... how many brilliant moves have you played? / Chessigma's free review can tell you. / It
  flags every brilliant move... like this one. / And it finds all of yours. Just type a username. / I tried GothamChess:
  141 brilliants in three months. / An Elo for every part of his game, / and every brilliant and tactic he played. / Find
  yours free on chessigma.com. Link in bio, and comment your number.» «Please send us the new version before posting.»
  Папка на Drive: `1flVRpY5ABUfn4iYeEBcjoPkyWFL7UXgg`; B-roll лежит в `photos/rec/broll.mp4` (24,5 с, 30 к/с).
- Всё, что говорится и видно после 0:39,5, — **их текст и их запись**; мы их не перепроверяли. Что в записи:
  - разбор партии «gothamche… vs chesssknock»: комментарии тренера, потом ход **Nxe4 с флажком SIGMA !!** (вспышка на
    6,0–6,5 с записи) — на «like this one»;
  - страница входа: поле «Chess.com username», набирается «gothamchess», кнопка «Get free report» (8,1–9,3 с);
  - его отчёт: «Their report · Last 90 days · **141 brilliants** · 1501 ta…» (9,7–11,9 с) — на «141 brilliants in three
    months» (последние 90 дней ≈ три месяца — их формулировка);
  - обзор: «687 games · Chess.com blitz · 2800–3000», оценка Elo 2605, Elo по частям игры (Openings 2759, Blunders 2933,
    Tactics 2784, Conversion 2759, Clock 2759); коллекция тактик: **Brilliant 93**, Tactics 1636, Hanging 950, Mates 72;
  - их финальная карточка: CHESSIGMA, «2M+ players», «15M+ games analyzed», звёзды, App Store и Google Play.
- В записи два числа бриллиантов: 141 в отчёте и 93 в коллекции на «every brilliant». Откуда разница, из записи не
  видно (возможно, разные выборки партий). Ролик ничего к этому не добавляет; в письме Элиоту — вопрос, оставить ли
  рамку на плитке с 93.
- **GothamChess** (реальный человек) назван в их тексте, его аккаунт и фото — в их записи. Это решение спонсора; автору
  сказано, что риск (связь реального человека с рекламой) остаётся на их тексте.
- Наше в этой части: переход (вопрос за столом и счётчик со знаком «?», телефон в руке, камера уходит в экран), подсветки
  поверх записи (рамки, подчёркивание, блик), плашки FREE и LINK IN BIO, субтитры по их тексту, метка AD, голос канала.
  Петля в конце — прежняя: последний кадр — первый, «comment your number».
