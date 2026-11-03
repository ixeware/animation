# GothamChess: the Grandmaster Hunter — sources

The starting point: a TikTok by Inferno Jae (@infernojae), ["Chess IS This Serious 😭🙏"](https://www.tiktok.com/@infernojae/video/7703771792346844446),
3 November 2026, 413K views (below: **the TikTok**). Its words (our transcript): "what do you mean they called this fan the
Grandmaster Hunter? That's right, apparently he's taken down one third of the highest ranked chess players in the entire
world, and he's not even a Grandmaster himself". Under it GothamChess commented "It's gonna be 50% soon" (screenshot from
the author of the channel: 7 h, 10.1K likes, 126 replies; below: **his comment**).

Everything we counted ourselves comes from the public Chess.com API, retrieved 3 November 2026 (below: **our count**):
[`player/gothamchess/stats`](https://api.chess.com/pub/player/gothamchess/stats),
[`player/gothamchess/games/archives`](https://api.chess.com/pub/player/gothamchess/games/archives) (115 monthly archives,
March 2017 – November 2026) and [`titled/GM`](https://api.chess.com/pub/titled/GM) (the accounts Chess.com marks GM).

| Claim in the video | Status | Source |
|---|---|---|
| He has beaten five hundred grandmasters. And he's not even one | our count: 503 distinct GM accounts beaten (below); his title is International Master | **our count**, [Wikipedia, Levy Rozman](https://en.wikipedia.org/wiki/Levy_Rozman) ("American chess international master"; infobox: "International Master (2018)") |
| Levy Rozman. GothamChess. The Grandmaster Hunter | the nickname from the viral video: "they called this fan the Grandmaster Hunter" | **the TikTok** |
| He claims nearly a third | "he's taken down one third of the highest ranked chess players in the entire world"; "claims" in the hunter's sense (takes as trophies); our count gives 28.8 % | **the TikTok**, **our count** |
| Then, under a viral video, he wrote: "It's gonna be fifty percent soon" | his comment under the TikTok, shown as the author's screenshot | **his comment** |
| So we counted. Thirty-four thousand games. Five hundred and three grandmasters | 34,374 games in his archive; 665 distinct GM accounts played, 503 beaten at least once = 28.8 % of the 1,747 GM accounts; 2,414 wins against GMs in all (1,257 bullet, 1,156 blitz, 1 rapid); the first, 19 March 2017 ([game](https://www.chess.com/game/live/2006029308)), the latest new one, 1 November 2026 | **our count** |
| Hikaru. Seventeen times | against Hikaru: 17 wins, 66 losses, 4 draws; the last win 22 April 2021, blitz ([game](https://www.chess.com/game/live/12847006099)) | **our count** |
| March 2026. Fabiano Caruana. Seven seconds left. Rook h6. Checkmate | FabianoCaruana (3242) – GothamChess (3000), Chess.com, 12 March 2026, 3+0, "GothamChess won by checkmate" with 63...Rh6#; Black's clock 8.0 s before the move, 6.9 s after | [game 167663411201](https://www.chess.com/game/live/167663411201) (PGN in the monthly archive `games/2026/03`) |
| That night, his rating peaks: three thousand and fourteen | `chess_blitz.best`: rating 3014, game 167663411201 — the Caruana game (3000 before it); his bullet best is 3123, rapid 2525 | **our count** (`stats`) |
| So why isn't the hunter a grandmaster? Because none of it counts | FIDE titles are for over-the-board play: they "generally require having demonstrated a prescribed level of achievement in tournaments at classical time controls under FIDE-approved conditions" | [Wikipedia, FIDE titles](https://en.wikipedia.org/wiki/FIDE_titles) |
| The title is won over the board, in classical. Three norms. A 2500 rating | "The usual way to obtain the title is to achieve three Grandmaster-level performances (called norms), along with a FIDE rating of 2500 or more"; a norm is in general "a performance rating of at least 2600 over 9 or more rounds" (the rules: norms over at least 27 games) | [Wikipedia, FIDE titles](https://en.wikipedia.org/wiki/FIDE_titles) |
| His best ever: 2421 | "achieved his peak Elo rating of 2421" in 2018; infobox: peak rating 2421 (August 2018); 2500 − 2421 = 79 | [Wikipedia, Levy Rozman](https://en.wikipedia.org/wiki/Levy_Rozman) |
| His five hundred wins? Online blitz and bullet | of his 2,414 wins against GMs, 2,413 are bullet or blitz, all of them on Chess.com | **our count** |
| In 2022, the stress made him quit | "In July 2022, following a disappointing performance at the New York Summer Invitational tournament, Rozman announced his retirement from 'competitive chess events' due to physical and mental stress" | [Wikipedia, Levy Rozman](https://en.wikipedia.org/wiki/Levy_Rozman), citing [chess24, "Chess = pain?", 14 July 2022](https://new.chess24.com/wall/news/chess-pain) |
| In 2024, he came back. For the title | "He announced his return to competitive over-the-board chess in April 2024, with the goal of becoming a grandmaster"; "From July 2022 to April 2024, Rozman stepped away from competitive chess, before resuming pursuit of his goal to become a grandmaster" | [Wikipedia, Levy Rozman](https://en.wikipedia.org/wiki/Levy_Rozman) |
| And fifty percent soon? At this year's pace... 2033 | our estimate: half of 1,747 is 874, so 371 more; new GMs beaten per year: 2017 82, 2018 76, 2019 36, 2020 105, 2021 48, 2022 30, 2023 23, 2024 25, 2025 28, 2026 50 (to 1 November, ≈ 60 a year); 371 / 60 ≈ 6.2 years → 2033 | **our count** |
| So how many grandmasters have you beaten? Comment a number | the question to the viewers | — |

How we counted: every game in the 115 monthly archives where GothamChess is one of the players; a GM is an account on
Chess.com's current GM list; "beaten" means he won at least one game against it, in any time control. It is a lower
bound and an approximation: closed accounts are missing from the list, a player might not yet have been a GM when beaten,
and one person can have two accounts. The pace is a joke estimate: the GM list grows too.

On screen, drawn rather than documented (the facts behind each are in the table above):
- the cartoon cast: Levy (the engine's lookalike), Levy in 2033 with grey hair (a joke on the pace), Fabiano Caruana (no
  free photo of him was available), Hikaru, a classical opponent and the players at the other tables;
- the trophy gallery (a black king on a shield for each GM, 503 lit of 1,747), the scoreboard and its numbers, the
  Hikaru plaque with 17 marks, the phone with the viral video (its UI is ours; the comment on it is the real screenshot),
  the webcams and the night stage of the online game, the mountain whose ridge is his rating with the 3014 flag, the
  classical tournament hall, the diploma with three seals, the rating tube to 2421, Levy's room with the bullet feed;
- the comment's header on the phone ("Comments") is ours; the comment itself is the screenshot;
- the "2033" stamp and the aged Levy are our joke on his "50% soon", not a forecast.

## The game on the board

All boards show the real game (STYLE_BIBLE rule 49).

| Board | Game | Source |
|---|---|---|
| The online stage, the clock close-up, the mate | FabianoCaruana – GothamChess, Chess.com, 12 March 2026, 3+0 (Second 3\|0 Thursday), 0–1, 63...Rh6#; the video plays the end, 55...Rxa5 (ply 110) to 63...Rh6# (ply 126), the clocks from the game's `[%clk]` tags | [game 167663411201](https://www.chess.com/game/live/167663411201), [tournament](https://www.chess.com/tournament/live/second-3-0-thursday-march-12-2026-6277145). Files: [`caruana_gothamchess_2026.pgn`](../../engine/data/caruana_gothamchess_2026.pgn), [`.json`](../../engine/data/caruana_gothamchess_2026.json) |
| The classical hall (Levy's table) | the start position of the same game (the hall is drawn: no particular classical game is meant) | — |

Levy had Black: the board is turned round so that his pieces are on the near side.

## Palette (STYLE_BIBLE rule 48)

A hunter's lodge: pine `#2D5E48` / deep pine `#0B1F17`, walnut `#5A3A22`, brass `#E2B04A`, ember `#FF8A3D`, gold
`#F5C451` on cream `#FFF3E0`; a night mountain under the moon and a daylight tournament hall; the board is Chess.com green
(`#EEEED2` / `#769656`) on a walnut slab with the `@THE64FILES` engraving.

## Photos and screenshots

| File | Where | Author | Licence | Source |
|---|---|---|---|---|
| `../levy/photos/levy_closeup.jpg` | "Levy Rozman" (Collision 2024, Toronto) | Piaras Ó Mídheach / Collision via Sportsfile | CC BY 2.0, credit on screen | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Levy_Rozman_at_Collision_2024_(cropped).jpg) |
| `photos/levy_comment.jpg` | GothamChess's comment "It's gonna be 50% soon" under the TikTok above (1080 × 360 crop) | screenshot from the author of the channel | quoted for commentary | **his comment** |

Line for the post description: `Photo: Piaras Ó Mídheach / Collision via Sportsfile (CC BY 2.0), via Wikimedia Commons`
