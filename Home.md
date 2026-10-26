# Шахматные шортсы

Главная страница хранилища Obsidian. Хранилище — сам репозиторий: заметка, поправленная здесь и отправленная в GitHub,
попадает к Claude в следующей сессии. Ссылки обычные Markdown, поэтому работают и в Obsidian, и на GitHub.

## Главное

- [Входящие](Inbox.md) — новые пожелания и заметки для Claude.
- [STYLE_BIBLE](STYLE_BIBLE.md) — правила стиля 1–47 (раздел 6) и эффекты ходов (§8).
- [Эталон: Rausis v2](reference/rausis_v2.md) — раскадровка лучшего ролика: хук, переходы, камера (правило 45).
- [IDEAS](IDEAS.md) — идеи следующих роликов с проверенными фактами, что показали комментарии.
- [CLAUDE](CLAUDE.md) — как собирается ролик, по шагам.
- [README](README.md) — устройство проекта и строка сборки каждого ролика.
- [Шаблон эпизода](templates/episode_template.md)

## Ролики, от новых к старым

| Папка | О чём | Факты и фото |
|---|---|---|
| `dubov` | Дубов — «новый Таль»: охота на короля через всю доску (Батуми 2019), мат Магнусу, секундант Магнуса, а потом танец коней на чемпионате мира по блицу, ноль обоим и повтор через 11 дней | [SOURCES](episodes/dubov/SOURCES.md) |
| `talbrill` | Таль — человек, который «придумал» бриллиантовые ходы, а движок называет их ошибками (Ботвинник 1960, Ларсен 1965) | [SOURCES](episodes/talbrill/SOURCES.md) |
| `tablebang` | Магнус бьёт по столу после проигрыша Гукешу, и тихий реванш Гукеша в Загребе | [SOURCES](episodes/tablebang/SOURCES.md) |
| `hikaru` | Хикару бросает короля чемпиона мира Гукеша в толпу, и тихий ответ Гукеша | [SOURCES](episodes/hikaru/SOURCES.md) |
| `rausis` | гроссмейстер, который жульничал из туалета (Раусис, 2019) | [SOURCES](episodes/rausis/SOURCES.md) |
| `najdorf` | Найдорф: 45 досок вслепую, чтобы семья узнала, что он жив | [SOURCES](episodes/najdorf/SOURCES.md) |
| `youngest` | самые молодые гроссмейстеры | [SOURCES](episodes/youngest/SOURCES.md) |
| `magnus` | насколько силён Магнус | [SOURCES](episodes/magnus/SOURCES.md) |
| `mk2004` | тест эффектов ходов: Карлсен в 13 лет — Каспаров | [SOURCES](episodes/mk2004/SOURCES.md) |
| `iq` | топ-5 IQ шахматистов | [SOURCES](episodes/iq/SOURCES.md) |
| `gates` | Билл Гейтс против Магнуса | [SOURCES](episodes/gates/SOURCES.md) |
| `jeans` | Магнус и джинсы | [SOURCES](episodes/jeans/SOURCES.md) |
| `records2` | рекорды, которые звучат как фейк | [SOURCES](episodes/records2/SOURCES.md) |
| `records` | топ-5 рекордов Гиннесса | — |
| `baby` | что если Магнус учил бы малыша с пелёнок | — |
| `solve` | можно ли решить шахматы | — |
| `levy` | GothamChess против всего мира | — |
| `brilliant` | у кого больше всего бриллиантовых ходов | — |
| `witty` | Witty Alien: от коз до победы над Карлсеном | — |
| `lewis` | фигура с острова Льюис за £5 | — |
| `tal` | Таль сбегает из больницы на блиц | — |
| `turk` | Механический Турок | — |
| `fischer` | паранойя Бобби Фишера | — |

## Канал

- Статистика роликов: `python3 tools/tiktok.py stats the64files`
- Все комментарии: `python3 tools/tiktok.py comments the64files <папка>`
