# Bobby Fischer: «64 squares, 64 years»

Эпизод в стиле @chess.history: 87,7 с, 1080×1920, 30 к/с, английская озвучка.
Описание поста: `Bobby Fischer's paranoia #chess #story #education`

## Сценарий

> This man beat the entire Soviet Union at chess. Then he pulled the fillings out of his teeth.
> So nobody could get inside his head.
>
> New York. 1956. Bobby Fischer is thirteen. Against a master, he leaves his queen hanging.
> On purpose. Twenty-four moves later… Checkmate. They call it the Game of the Century.
>
> Reykjavik. 1972. Boris Spassky. World champion. The Soviets had held the title for twenty-four
> years. Bobby loses game one. Then he hears the cameras. He refuses to play. Down two to zero.
> Game three. A back room. No cameras. Bobby wins. Then again. And again. World champion.
>
> And then… he vanished. He never played for the title again. He was sure the Soviets were
> watching. So the fillings came out. In 1992, he spat on an order from the US government.
> He never went home again. Iceland took him in. He died in Reykjavik. The city where he became
> king. Age sixty-four. One year for every square on the board.

Структура как у оригинала: хук с поворотом → «место, год» → партия с жертвой ферзя и паузой
перед матом → итог → второй акт (Рейкьявик, полоска здоровья «босса») → мрачный поворот
(исчезновение, паранойя, изгнание) → финал-петля. Последний кадр совпадает с первым, потом
выключение ТВ.

## Факты

- Byrne — Fischer, Нью-Йорк, 17.10.1956, Fischer 13 лет; 17…Be6!! отдаёт ферзя, мат 41…Rc2#.
  Партия в `engine/data/game_of_century.json` настоящая, ход за ходом.
- 1972, Рейкьявик: 1-я партия проиграна, 2-я засчитана поражением (неявка, спор из-за камер),
  3-я сыграна в задней комнате без камер и выиграна; матч 12½–8½.
- Советские игроки держали титул с 1948 по 1972 год (24 года).
- 1975: отказался защищать титул.
- 1992: матч-реванш в Югославии вопреки санкциям, плевок на предписание Минфина США, ордер на арест.
- 2004: арест в Японии; 2005: гражданство Исландии.
- Умер 17.01.2008 в Рейкьявике в 64 года.
- Удаление пломб из страха, что через них можно передавать сигналы, описано в биографиях. Это
  самый «мягкий» по источникам факт ролика.

## Сборка

`./build.sh fischer` → `episodes/fischer/build/final.mp4` (озвучка ~1 мин, рендер ~9 мин на 4 ядрах,
сведение ~30 с).
