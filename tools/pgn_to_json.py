"""Turn a PGN move list into per-ply piece lists with stable piece ids, for the board animator.

    python3 tools/pgn_to_json.py "1. e4 e5 ..." out.json

Each ply: {san, from, to, check, mate, pieces: [{id, t, c, sq}]}; ply 0 is the start position.
"""
import json
import sys

import chess


def main(movetext, out, start_fen=None):
    board = chess.Board(start_fen) if start_fen else chess.Board()
    ids, n = {}, {}
    for sq, pc in board.piece_map().items():
        key = pc.symbol()
        n[key] = n.get(key, 0) + 1
        ids[sq] = f"{key}{n[key]}"

    def snapshot():
        return [{"id": ids[sq], "t": pc.symbol().lower(), "c": "w" if pc.color else "b",
                 "sq": chess.square_name(sq)} for sq, pc in board.piece_map().items()]

    plies = [{"san": None, "pieces": snapshot()}]
    import re
    tokens = re.sub(r"\d+\.(\.\.)?", " ", movetext.replace("\n", " ")).split()
    for tok in tokens:
        if tok in ("1-0", "0-1", "1/2-1/2", "*"):
            break
        mv = board.parse_san(tok.rstrip("!?"))
        san = board.san(mv)
        fr, to = mv.from_square, mv.to_square
        moving = ids.pop(fr)
        if board.is_en_passant(mv):
            ids.pop(to + (-8 if board.turn else 8), None)
        ids.pop(to, None)
        if board.is_castling(mv):
            rf, rt = ((7, 5) if chess.square_file(to) == 6 else (0, 3))
            rank = chess.square_rank(fr)
            ids[chess.square(rt, rank)] = ids.pop(chess.square(rf, rank))
        ids[to] = moving
        board.push(mv)
        plies.append({"san": tok, "from": chess.square_name(fr), "to": chess.square_name(to),
                      "check": board.is_check(), "mate": board.is_checkmate(),
                      "pieces": snapshot()})
    json.dump(plies, open(out, "w"))
    print(f"{len(plies) - 1} plies -> {out}; final: {board.fen()}")


if __name__ == "__main__":
    main(*sys.argv[1:])
