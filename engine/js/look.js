// LOOK v2: the art direction worked out from @chess.history (frame-by-frame study, Oct 2025).
// An episode opts in with useLookV2() at the top of its build(); older episodes keep the v1 look untouched.
//  - one muted palette per frame: slate board and pieces, dark backgrounds, warm skin as the brightest thing
//  - low key light: a spotlight cone or a pool on the subject, everything else falls off into darkness
//  - close framing: faces fill a third to half of the frame, big defocused pieces in the foreground
//  - character finish: peach skin, soft side shading, eye sockets, permanent blush, rounded nose tip,
//    brown irises, hair strands, wrinkles and moles where the person has them, ages of the same person
//  - text: as in the `brilliant` episode (STYLE_BIBLE rule 33): Rubik heavy, teal accent strips and badges, move labels
//    in a dark outlined box; no mono panels
export const LOOK = { v2: false };
export function useLookV2(on = true) { LOOK.v2 = on; }

// board, pieces' table and set colours
export const SLATE = { light: '#3B454C', dark: '#262F35', frame: '#1A2024', side: '#11161A' };
export const SKIN2 = { base: '#E9CDB7', shade: '#D9B49D', deep: '#B4896F', blush: '#E8968A', hi: '#F7E4D5' };
