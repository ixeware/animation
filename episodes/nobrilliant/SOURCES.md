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
- **Запись приложения** (`photos/rec/review.mp4`) — прежняя запись автора, сделанная **без входа в аккаунт**: в ней
  над доской карточка тренера с кнопкой «Sign in for free». В черновике кадр начинается под этой карточкой (видна
  доска и флажок SIGMA). Элиот 25.11: «yes, please record it again while signed in» — для чистовика нужна новая
  запись со входом. Список партий в записи (ники других игроков) размыт; в финальном плане взят момент 0,3 с, пока
  список не прокрутился.
- Какой значок Chessigma и Chess.com ставят самому ходу 50.Qh6+, **не проверено** (разбор новой партии без браузера
  автора не запустить). Поэтому значка Sigma на ходе Магнуса в ролике нет; если автор запишет разбор этой партии в
  приложении и там будет Sigma — можно поставить в рекламный блок именно её.

## Правила и приёмы
- Сквозной предмет — круглый бирюзовый стикер «!!»: в руке Магнуса (хук), на стекле аквариума, на ферзе, в руке
  «сайта», на экране разбора, дождём на стол новичка, пустое место у Магнуса и на Lichess, сто плиток на стене,
  флажок SIGMA в приложении.
- Эдит-байт (правило 57): «Stockfish can beat any human. But it has never seen a brilliant move» — пауза в музыке,
  удар, счётчик «0».
- Финал закольцован (правило 10): последний кадр — первый; вопрос числом (правила 26, 39): «how many brilliant moves
  do you have?».
- Stockfish — рыба его логотипа, как в `biggerfish` (правило 53).
