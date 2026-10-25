# The man who invented brilliants: Mikhail Tal — sources

| Claim in the video | Status | Source |
|---|---|---|
| This man invented the brilliant move | a figure of speech for the hook, not a claim of invention: the "!!" sign and brilliancy prizes are older than Tal. Tal is the player famous for piece sacrifices ("often sacrificed material in search of activity and initiative"); Chess.com's Brilliant label (!!) is defined as "a good piece sacrifice" | [Wikipedia, Tal](https://en.wikipedia.org/wiki/Mikhail_Tal), [Chess.com support](https://support.chess.com/en/articles/8572705-how-are-moves-classified-what-is-a-blunder-or-brilliant-move) |
| But an engine says his most famous sacrifices don't work | our Stockfish 17.1 analysis of both games (numbers below): after 21...Nf4 White keeps a clear advantage (+1.3 to +1.6 with 23.a3); after 16.Nd5 Black is better (−1.4 to −1.5). "Many of his successful sacrifices were analysed for decades ... often the verdict was that Tal's opponents could have refuted the daring sacrifices" (ChessBase); "as it happened to many Tal's sacrifices, it was proven incorrect" (GM Gserper) | [ChessBase, Modern Classics](https://en.chessbase.com/post/modern-classics-02-botvinnik-tal-1960), [Chess.com, Gserper](https://www.chess.com/article/view/the-chess-boomerang) |
| Mikhail Tal. The Magician from Riga | born in Riga on 9 November 1936; nicknamed "The Magician from Riga" | [Wikipedia, Tal](https://en.wikipedia.org/wiki/Mikhail_Tal) |
| Moscow, 1960. At twenty-three, he plays Botvinnik for the world title | World Championship match, Moscow, 15 March – 7 May 1960, against the champion Mikhail Botvinnik; Tal was 23 | [Wikipedia, WCC 1960](https://en.wikipedia.org/wiki/World_Chess_Championship_1960) |
| Outside, hundreds of fans watch on a giant board | Lev Khariton's memoir, quoted on Chess.com: "hundreds of chess fans who had failed to buy an entrance ticket stayed outside the Pushkin Theater watching on a big demonstration board" | [Chess.com forum, Tal vs Botvinnik 1960](https://www.chess.com/clubs/forum/view/tal-vs-botvinnik-1960) |
| Game six. Tal throws a knight away | game 6 is "particularly famous, thanks to a speculative knight sacrifice by Tal on move 21": 21...Nf4 22.gxf4 exf4; "His positional piece sacrifice on move 21 came out of the blue, not only for his opponent ... but also for the spectators" | [Wikipedia, WCC 1960](https://en.wikipedia.org/wiki/World_Chess_Championship_1960), [ChessBase](https://en.chessbase.com/post/modern-classics-02-botvinnik-tal-1960) |
| The hall goes so wild, the game is moved to a back room | "The audience became so excited that the game was moved to a back room due to the noise" (Wikipedia, citing Bryan Smith, Chess.com, 2014). Khariton: the arbiters Stahlberg and Golombek transferred the game backstage when Botvinnik had a few minutes left on his clock | [Wikipedia, WCC 1960](https://en.wikipedia.org/wiki/World_Chess_Championship_1960), [Chess.com forum](https://www.chess.com/clubs/forum/view/tal-vs-botvinnik-1960) |
| Today, an engine finds the answer in under a second | our run: Stockfish 17.1, 4 threads, the position after 22...exf4: 23.a3 is its choice from depth 5 on, +1.32 at depth 14 after 0.09 s; at depth 32, 23.a3 +1.61 | our analysis (scripts below) |
| Botvinnik doesn't. Tal wins the game, then the whole match | Botvinnik played 23.Bd2 (Stockfish: about 0.0 instead of +1.6 after 23.a3; ChessBase calls it "Botvinnik's (inaccurate) reaction"); 0–1 after 47 moves; Tal won the match 12½–8½ (+6 −2 =13) | [ChessBase](https://en.chessbase.com/post/modern-classics-02-botvinnik-tal-1960), [Wikipedia, WCC 1960](https://en.wikipedia.org/wiki/World_Chess_Championship_1960) |
| Bled, 1965. Against Larsen. The match is tied. Last game | Candidates semifinal Tal–Larsen, Bled, 23 July – 8 August 1965, ten games; Larsen won games 1 and 5, Tal 2 and 6, the rest drawn, so after game 9 the match "was still even" (4½–4½); Tal had White in game 10 | [chessgames.com](https://www.chessgames.com/perl/chess.pl?tid=80926), [Chess.com, deciding game](https://www.chess.com/article/view/tal-larsen-candidates-1965-deciding-game) |
| And Tal gives away a knight. Again | 16.Nd5 exd5 17.exd5, "On move sixteen, Tal offered a gift of a wooden horse" | [Chess.com, deciding game](https://www.chess.com/article/view/tal-larsen-candidates-1965-deciding-game), [Chess.com, Gserper](https://www.chess.com/article/view/the-chess-boomerang) |
| The engine's verdict? Blunder | Stockfish 17.1: +0.65 to +0.71 before the move (16.Ne2 best), −1.41 to −1.48 after it (depth 20–29). Lichess judges a move by the drop in winning chances, 2/(1+e^(−0.00368208·cp))−1, and calls a drop of 0.3 or more a blunder; here the drop is 0.37–0.39 (at a short search of one million nodes it is 0.28, a mistake). Kasparov, annotating as a human, gives the move "?!" | our analysis; Lichess thresholds as quoted from its code on the [Lichess forum](https://lichess.org/forum/general-chess-discussion/what-constitutes-an-inaccuracy); [Chess.com, Gserper](https://www.chess.com/article/view/the-chess-boomerang) |
| But Larsen goes wrong one move later, and Tal wins the match | 16...exd5 17.exd5 f5: Stockfish −1.5 before (17...g6 best), +0.2 to +0.3 after (a drop of 0.32 in Lichess winning chances at depth 20–24). Tal won game 10 (1–0, 37 moves) and the match 5½–4½ | [chessgames.com](https://www.chessgames.com/perl/chess.pl?tid=80926), our analysis |
| Kasparov wrote: Tal posed problems ahead of their time | "In short, in this game, for the umpteenth time, Tal posed problems that were ahead of their time in complexity." — Garry Kasparov, My Great Predecessors, on Tal–Larsen, as quoted by GM Gserper | [Chess.com, Gserper](https://www.chess.com/article/view/the-chess-boomerang) |
| Tal himself once said: there are two kinds of sacrifices. Sound ones... and mine | the earliest version found by Edward Winter is Anthony Saidy's, Chess Life & Review, June 1973, p. 303: "There are two kinds of sacrifices – sound ones, and mine." Saidy reports that Tal "once said" it; date and language unknown. The screen credits it "as quoted, 1973" | [Edward Winter, Chess Sacrifices](https://chesshistory.com/winter/extra/sacrifices.html) |

Game data: `engine/data/botvinnik_tal_1960_g6.pgn` and `.json` (World Championship, Moscow, game 6, 0–1; the moves as in
Wikipedia's article on the match), `engine/data/tal_larsen_1965_g10.pgn` and `.json` (Candidates semifinal, Bled, game 10,
1–0). JSON plies: g6 42 = 21...Nf4, 43 = 22.gxf4, 44 = 22...exf4, 45 = 23.Bd2, 93 = 47.Rd7+; Bled 31 = 16.Nd5, 32 = 16...exd5,
33 = 17.exd5, 34 = 17...f5, 73 = 37.Qf7.

Engine numbers (Stockfish 17.1, positive favours White, our runs on 24 October 2026, 4 threads): game 6 — before 21...Nf4
+1.0 to +1.1 (the knight move does not make it worse, White was already better), after it +1.3 to +1.6; after 22...exf4,
23.a3 +1.61 at depth 32, 23.Bd2 0.00. Bled — before 16.Nd5 +0.6/+0.7, after it −1.4/−1.5; after 17.exd5 −1.5 to −1.6,
after 17...f5 +0.2/+0.3. The eval bars on screen follow these numbers.

On screen, drawn rather than documented (the facts behind each are in the table above):
- the Pushkin Theatre stage (red curtains, the demonstration board and the score board behind the players), the hall,
  the street with a poster column and the theatre front with a big board and a crowd in the snow are our drawings; the
  posters' Russian text ("Match for the world championship", "Botvinnik — Tal") is ours, in the style of the time;
- the teal "!!" disc over Tal's knights is the brilliant-move sign as a symbol of his legend. Chess.com's own review
  would not give either move its Brilliant label: one of its conditions is that you are not worse after the move;
- "UNSOUND" over 21...Nf4 is our word for the engine's verdict (White stays +1.3 to +1.6); the "??" and BLUNDER on 16.Nd5,
  "?" on 23.Bd2 and 17...f5 come from the engine numbers above;
- the game moved off the stage: sources differ on whether it went backstage or to a back room, and it happened later in
  the game, when Botvinnik had a few minutes left; the curtain coming down and the small room behind the stage are drawn;
- the engine on a laptop is our drawing of our own run: the move 23.a3, +1.3 and 0.09 s are from it;
- Botvinnik resigned game 6 after the adjournment, not at the board; the video shows the result on the theatre's big
  board and the final match score on the score board;
- the Bled hall by the lake, its banner and the score board with 4½–4½ and 5½–4½ are drawn; so is Larsen at the board;
- Kasparov's book is drawn as a plain book (no cover copied); the quote on its page is his words as quoted above;
- the two knights labelled SOUND and MINE are a picture of Tal's words.

## Photos

| File | Where | Author | Licence | Source |
|---|---|---|---|---|
| `photos/match1960.jpg` | "Mikhail Tal. The Magician from Riga" (Botvinnik and Tal, 22 March 1960) | Glavarkhiv Moskvy (Main Archive of Moscow) | CC BY 4.0, credit on screen | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Botvinnik_and_Tal_22_March_1960.jpg) |
| `photos/larsen1970.jpg` | "Against Larsen" (Leiden, 16 April 1970) | Anefo (Nationaal Archief) | CC0, credit on screen | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Bent_Larsen_in_1970.jpg) |
| `photos/kasparov1985.jpg` | "Kasparov wrote" | Bart Molendijk / Anefo (Nationaal Archief) | CC0, credit on screen | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:KRO-schaaktweekamp_tussen_Kasparov_en_Timman_Garri_Kasparov,_Bestanddeelnr_933-5132.jpg) |
| `photos/tal1988.jpg` | "Tal himself once said" | Rob C. Croes / Anefo (Nationaal Archief) | CC0, credit on screen | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Mikhail_Tal_1988.jpg) |

Depth maps (`*_depth.png`) come from `tools/depth.py`.

Line for the post description: `Photos: Glavarkhiv Moskvy (CC BY 4.0), Anefo / Nationaal Archief (CC0), via Wikimedia Commons`
