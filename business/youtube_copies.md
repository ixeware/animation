# Канал-копия на YouTube: The 64 Stories

Проверено 13.11.2026 около 23:00 UTC. Канал `@the64stories` перезаливает ролики The 64 Files с TikTok без разрешения.
Здесь — что именно скопировано, ссылки на оригиналы для жалоб и доказательства авторства.

## Каналы

| Канал | Что это | Данные |
|---|---|---|
| [The 64 Stories](https://www.youtube.com/@the64stories) (`UCQxxWFxb02DCkTunX0rftJQ`) | копия | создан 19.09.2026; 6,1 тыс. подписчиков; 24 шортса, все — ролики The 64 Files; в сумме ≈5,3 млн просмотров; в описании просит писать о сотрудничестве на свою почту |
| [@the64files в TikTok](https://www.tiktok.com/@the64files) | оригинал | 16,9 тыс. подписчиков, 28 роликов, первый — 12.10.2026 |
| [The 64 Files](https://www.youtube.com/@the64filesofficial) (`UCsCp6_Ihp0wqsnkfanbck4g`) | новый канал автора | создан 11.11.2026, один шортс («Who can beat Mittens?») |
| [The 64 Files](https://www.youtube.com/@the64files) (`UCP_JjtknigGxYbFO8BDl3hw`) | чей — уточнить у автора; судя по нику, чужой | создан 13.07.2026, видео нет, в описании «Every episode is a file. Every square hides a story.» |
| The 64 Files, `@The64FilesChess` | канал автора, заблокирован | «violates our Impersonation policy»; апелляция отклонена (экран автора от 13.11.2026) |

## Блокировка канала автора (13.11.2026)

- Ответ YouTube на апелляцию: «Your channel won't be put back on YouTube at this time. We've taken a careful look at
  your channel again, and confirmed that it violates our Impersonation policy… Currently, your channel does not have
  access to YouTube's pilot programme to apply for a new channel.» Канал — «The 64 Files», ник `@The64FilesChess`.
- **Догадка, не факт.** Ник `@the64files` на YouTube занят другим каналом с тем же именем «The 64 Files» и той же
  темой, созданным 13.07.2026, — раньше канала автора (у автора ник с добавкой «Chess», значит, короткий был занят).
  Для YouTube канал автора выглядел копией этого канала: одно имя, одна тема. Тогда блокировка не обязательно связана
  с каналом-копией The 64 Stories; кто подал жалобу и была ли она, по открытым данным не видно. Когда тот канал получил
  имя и ник, тоже не видно: дата создания канала не меняется, а имя и ник меняются.
- Что из этого следует: любой новый канал с именем «The 64 Files» упрётся в то же совпадение; новый канал после
  блокировки YouTube к тому же считает обходом. Обычная апелляция использована. Остаётся обращение в поддержку
  (@TeamYouTube) с доводом по существу: «The 64 Files» — собственный бренд автора (TikTok с 12.10.2026, спонсорские
  договоры), он не выдавал себя за канал `@the64files`, у которого нет ни одного видео.

### Черновик обращения к @TeamYouTube (X, два сообщения по 280 и 220 знаков)

> @TeamYouTube My channel "The 64 Files" (@The64FilesChess) was terminated for impersonation and the appeal was denied. I am the original creator: the same videos are on my TikTok @the64files (16.9K followers) since Oct 12. I never posed as anyone else. Could you take another look?

> A different channel holds the handle @the64files and the same name, with no videos: I have nothing to do with it. And @the64stories re-uploads my videos to YouTube, 24 so far; my copyright removal requests are in review.

Отправлять автору со своего аккаунта и только если канал `@the64files` действительно не его.

## Доказательства авторства

1. **Даты.** Каждая копия из ленты залита позже оригинала: свежие ролики — через 20–32 часа после TikTok (ролик про
   Дубова — через 26 минут), старые — через 11–26 дней. Даты копий — из открытой ленты YouTube
   (`https://www.youtube.com/feeds/videos.xml?channel_id=UCQxxWFxb02DCkTunX0rftJQ`, в ней 15 последних роликов), даты
   оригиналов — со страниц TikTok.
2. **Наша плашка в их роликах.** В копиях осталась финальная плашка «FOLLOW FOR MORE — THE 64 FILES». Кадры лежат на
   сервере самого YouTube: [GothamChess VS 225.000 People](https://i.ytimg.com/vi/nRx_hI8DvDs/oar3.jpg),
   [Can chess be solved?](https://i.ytimg.com/vi/agXowu9Rv-I/oar3.jpg).
3. **Исходники.** 23 из 24 роликов собраны кодом в этом репозитории (папки `episodes/<имя>`, колонка «Папка»): сцены,
   сценарий, озвучка. Такого проекта нет ни у кого другого. У 11 роликов, сделанных с 18.10.2026, первый коммит папки
   старше и публикации в TikTok, и копии (`git log --diff-filter=A -- episodes/<имя>`); остальные папки внесены
   первым коммитом хранилища 17.10.2026. Ролика про Mittens в репозитории нет.
4. **Спонсорский ролик.** «Hikaru realized Magnus is losing» — оплаченная интеграция Chessnut; копия показывает её
   без ведома автора и спонсора.

## Все 24 копии

Время — UTC. «Жалоба»: «подана» — заявка на удаление за нарушение авторских прав в YouTube Studio (первые шесть,
статус «на рассмотрении»); «письмо 13.11» — одно уведомление на остальные 18 роликов, отправленное по просьбе автора
13.11.2026 в 23:46 UTC с адреса the64filestt@gmail.com на copyright@youtube.com (YouTube принимает уведомления в тексте
письма; в нём полное имя автора как подпись, почта для связи, пары ссылок «копия — оригинал» и два обязательных
заявления). Ответы YouTube придут на тот же адрес.

| № | Копия на YouTube | Залита | Просмотры | Оригинал в TikTok | Вышел | Папка | Жалоба |
|---|---|---|---|---|---|---|---|
| 1 | [Hikaru realized Magnus is losing](https://www.youtube.com/shorts/Wmz-pghiWnE) | 11.11 19:21 | 146 тыс. | [оригинал](https://www.tiktok.com/@the64files/video/7706690840965582132) | 10.11 23:36 | `hikaru213` | письмо 13.11 |
| 2 | [Bobby Fischer - The Fischerman](https://www.youtube.com/shorts/rUg2CLvelHg) | 09.11 18:44 | 490 тыс. | [оригинал](https://www.tiktok.com/@the64files/video/7705900508925398279) | 08.11 20:29 | `biggerfish` | подана |
| 3 | [Is Bobby Fischer the GOAT?](https://www.youtube.com/shorts/Lm9o3BTdFAA) | 07.11 19:14 | 239 тыс. | [оригинал](https://www.tiktok.com/@the64files/video/7695912005613407489) («Bobby Fischer's paranoia») | 12.10 22:29 | `fischer` | подана |
| 4 | [Who has the most Brilliant moves?](https://www.youtube.com/shorts/bCMlxBvqwXg) | 06.11 18:59 | 386 тыс. | [оригинал](https://www.tiktok.com/@the64files/video/7696399796298353928) | 14.10 06:02 | `brilliant` | подана |
| 5 | [Who can beat Mittens?](https://www.youtube.com/shorts/hCf_l85jvwo) | 05.11 19:19 | 561 тыс. | [оригинал](https://www.tiktok.com/@the64files/video/7704420423659982098) | 04.11 20:46 | — | подана |
| 6 | [GothamChess, The Grandmaster Hunter](https://www.youtube.com/shorts/Dw0bCwE_gNg) | 04.11 19:00 | 1,4 млн | [оригинал](https://www.tiktok.com/@the64files/video/7704033750190951688) | 03.11 19:45 | `gmhunter` | подана |
| 7 | [GothamChess Lost to Amateur](https://www.youtube.com/shorts/J14e_O5V-TQ) | 03.11 18:57 | 161 тыс. | [оригинал](https://www.tiktok.com/@the64files/video/7703533116886961426) | 02.11 11:23 | `dewakipas` | подана |
| 8 | [GothamChess VS 225.000 People](https://www.youtube.com/shorts/nRx_hI8DvDs) | 02.11 18:17 | 755 тыс. | [оригинал](https://www.tiktok.com/@the64files/video/7696466053831871752) | 14.10 10:19 | `levy` | письмо 13.11 |
| 9 | [Can chess be solved?](https://www.youtube.com/shorts/agXowu9Rv-I) | 01.11 18:49 | 96 тыс. | [оригинал](https://www.tiktok.com/@the64files/video/7696510194909531399) | 14.10 13:10 | `solve` | письмо 13.11 |
| 10 | [What If Magnus Carlsen Trained a Baby?](https://www.youtube.com/shorts/0K7uOZsonxw) | 31.10 20:05 | 65 тыс. | [оригинал](https://www.tiktok.com/@the64files/video/7696591519767203090) | 14.10 18:26 | `baby` | письмо 13.11 |
| 11 | [Bongcloud Opening by Magnus and Hikaru](https://www.youtube.com/shorts/A_MNOn0hvck) | 30.10 18:44 | 71 тыс. | [оригинал](https://www.tiktok.com/@the64files/video/7702196006619778312) | 29.10 20:54 | `bongcloud` | письмо 13.11 |
| 12 | [Top 5 Chess World Records](https://www.youtube.com/shorts/CPzplLt64VY) | 29.10 18:56 | 84 тыс. | [оригинал](https://www.tiktok.com/@the64files/video/7696650628671474962) | 14.10 22:15 | `records` | письмо 13.11 |
| 13 | [Why Magnus Carlsen quit the World Championship?](https://www.youtube.com/shorts/LXs5dnYe1XA) | 28.10 20:03 | 44 тыс. | [оригинал](https://www.tiktok.com/@the64files/video/7696886708524141842) | 15.10 13:31 | `jeans` | письмо 13.11 |
| 14 | [Magnus VS Bill Gates](https://www.youtube.com/shorts/ZJGgat8akQA) | 27.10 18:28 | 45 тыс. | [оригинал](https://www.tiktok.com/@the64files/video/7697080707536932104) | 16.10 02:04 | `gates` | письмо 13.11 |
| 15 | [Mikhail Tal of New Generation?](https://www.youtube.com/shorts/WLywVcbK5FY) | 26.10 18:51 | 118 тыс. | [оригинал](https://www.tiktok.com/@the64files/video/7701044504261971218) | 26.10 18:25 | `dubov` | письмо 13.11 |
| 16 | [Who invented Brilliant Moves?](https://www.youtube.com/shorts/NwbQCns0Bl4) | до 26.10 | 204 тыс. | [оригинал](https://www.tiktok.com/@the64files/video/7700600753475390727) | 25.10 13:44 | `talbrill` | письмо 13.11 |
| 17 | [Magnus slammed the table](https://www.youtube.com/shorts/-m9a1wTFDCs) | до 26.10 | 16 тыс. | [оригинал](https://www.tiktok.com/@the64files/video/7700181701028252936) | 24.10 10:37 | `tablebang` | письмо 13.11 |
| 18 | [He threw the world champion's king into the crowd](https://www.youtube.com/shorts/SPDbqBgS5EY) | до 26.10 | 41 тыс. | [оригинал](https://www.tiktok.com/@the64files/video/7699616946404330759) | 22.10 22:06 | `hikaru` | письмо 13.11 |
| 19 | [The youngest grandmaster ever](https://www.youtube.com/shorts/ac9gSRzhVAc) | до 26.10 | 40 тыс. | [оригинал](https://www.tiktok.com/@the64files/video/7697627947573906696) | 17.10 13:27 | `youngest` | письмо 13.11 |
| 20 | [Witty Alien beat Magnus Carlsen](https://www.youtube.com/shorts/4Pv_Y9emT0k) | до 26.10 | 11 тыс. | [оригинал](https://www.tiktok.com/@the64files/video/7696293136405908744) | 13.10 23:08 | `witty` | письмо 13.11 |
| 21 | [CHEATER at the World Chess Tournament](https://www.youtube.com/shorts/4yENsvwOtZ4) | до 26.10 | 14 тыс. | [оригинал](https://www.tiktok.com/@the64files/video/7698065727143644434) | 18.10 17:46 | `rausis` | письмо 13.11 |
| 22 | [He played 45 games blindfolded so his family could find him](https://www.youtube.com/shorts/Nvjpwtbhygo) | до 26.10 | 43 тыс. | [оригинал](https://www.tiktok.com/@the64files/video/7697912140631493906) | 18.10 07:50 | `najdorf` | письмо 13.11 |
| 23 | [Why MAGNUS is the GOAT?](https://www.youtube.com/shorts/UwfHxEjj27s) | до 26.10 | 245 тыс. | [оригинал](https://www.tiktok.com/@the64files/video/7697650069780057351) | 17.10 14:53 | `magnus` | письмо 13.11 |
| 24 | [Highest IQs in the chess](https://www.youtube.com/shorts/q5jH6Y-cMGo) | до 26.10 | 31 тыс. | [оригинал](https://www.tiktok.com/@the64files/video/7697225595138231568) | 16.10 11:26 | `iq` | письмо 13.11 |

У роликов 16–24 точную дату загрузки видно на странице самой копии (в ленте YouTube только 15 последних). Если какая-то
из них окажется старше оригинала в TikTok, в заявке лучше сослаться на более раннюю публикацию этого ролика.

Не скопированы (на 13.11): «Magnus names a famous game from one position» (`woodpecker`, 13.11), «It sat in a drawer
for 55 years», «The last game of Mikhail Tal», «The Mechanical Turk».

## Что дальше

- На оставшиеся 18 роликов уведомление отправлено письмом (см. выше); если YouTube попросит уточнений — ответить в той же ветке.
- По справке YouTube, три действующих страйка за авторские права — канал удаляют вместе со всеми видео; страйк
  действует 90 дней ([Copyright strike basics](https://support.google.com/youtube/answer/2814000?hl=en)).
- Если владелец копии подаст встречное уведомление, YouTube перешлёт его автору — отвечать в срок и с доказательствами
  из раздела выше.
- Заблокированный канал автора обжалуется формой из справки
  ([Channel or account terminations](https://support.google.com/youtube/answer/2802168?hl=en)); там же сказано, что
  после блокировки нельзя создавать и использовать другие каналы в обход неё, а повторные обращения замедляют ответ.
- Спонсорам (Chessnut, Chessigma) стоит назвать настоящие каналы: копия собирает предложения о сотрудничестве на свою
  почту.

## Как перепроверить

- Список копий: `yt-dlp --flat-playlist --dump-single-json https://www.youtube.com/@the64stories`.
- Жива ли копия: `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<id>&format=json` (200 — на месте).
- Кадры копии: `https://i.ytimg.com/vi/<id>/oar1.jpg`, `oar2.jpg`, `oar3.jpg`.
- Свои ролики с датами: `python3 tools/tiktok.py stats the64files`.
