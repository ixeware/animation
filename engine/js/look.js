// LOOK v2: the art direction worked out from @chess.history (frame-by-frame study, Oct 2025).
// An episode opts in with useLookV2() at the top of its build(); older episodes keep the v1 look untouched.
//  - one muted palette per frame: slate board and pieces, dark backgrounds, warm skin as the brightest thing
//  - low key light: a spotlight cone or a pool on the subject, everything else falls off into darkness
//  - close framing: faces fill a third to half of the frame, big defocused pieces in the foreground
//  - character finish: peach skin, soft side shading, eye sockets, permanent blush, rounded nose tip,
//    brown irises, hair strands, wrinkles and moles where the person has them, ages of the same person
//  - text: as in the `brilliant` episode (STYLE_BIBLE rule 33): Rubik heavy, teal accent strips and badges, move labels
//    in a dark outlined box; no mono panels
// mark: the channel's handle engraved on the sides of the board (STYLE_BIBLE rule 46); an order for another channel
// sets its own handle or null with useMark()
export const LOOK = { v2: false, motion: 1, mark: '@THE64FILES' };
export function useMark(mark) { LOOK.mark = mark; }
export function useLookV2(on = true) { LOOK.v2 = on; }
// Motion 2 (STYLE_BIBLE rules 41-44, after Emil Kowalski): on-screen text enters on a strong ease-out from 94% scale,
// a little below and out of a light blur, in about 0.25 s; groups come in one after another, 50-80 ms apart; a move
// label grows out of its square. Motion 1 keeps the old 150% pops and plain fades. `?motion=1|2` in the page URL
// (render.mjs --motion) overrides the episode's choice, for side-by-side comparisons.
const MQ = new URLSearchParams(globalThis.location?.search || '').get('motion');
if (MQ) LOOK.motion = +MQ;
export function useMotionV2(on = true) { if (!MQ) LOOK.motion = on ? 2 : 1; }

// board, pieces' table and set colours
// the slate board as in the reference (STYLE_BIBLE rule 46): low-contrast grey-green squares, a frame a shade darker than
// the dark squares, a thick near-black side with rounded corners
export const SLATE = { light: '#4A5351', dark: '#3B4240', frame: '#353B3A', side: '#1A1E1F', th: 0.45, rc: 0.35 };
export const SKIN2 = { base: '#E9CDB7', shade: '#D9B49D', deep: '#B4896F', blush: '#E8968A', hi: '#F7E4D5' };
