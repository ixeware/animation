# Sound-effect library

Real (non-synthesized) sound effects for the v2 mixer (`script.json` → `"mix": {"engine": "v2"}`).
`manifest.json` maps a cue id (used in `scenes.js` as `cue(t, 'id', gain)`) to one or more variants; the mixer
plays the variants in turn, so repeated cues don't sound identical. Old synth ids (boom, hit, clack, whoosh…) are
aliased to these samples in `audio/mix.py` (`ALIAS`), and ids missing here fall back to the synth bank in `sfx.py`.

All files were generated with the ElevenLabs sound-effects model (text-to-SFX) from the prompts stored in the
manifest, then trimmed and peak-normalized to −1 dBFS. Note: the ElevenLabs free tier does not grant commercial
rights (attribution required); a paid plan covers commercial use.

Ids: whoosh_fast, whoosh_soft, whoosh_deep, swipe_card, boom_cine, hit_punch, stamp, gavel, thud, door_slam,
shimmer, reveal_bell, success, sparkle_pop, riser, error, dun_dun, record_scratch, paper, pen, typewriter, page_flip,
piece, piece_slide, clock_press, clock_tick, gasp, murmur, applause, laugh, cash, coins, fabric, footsteps, camera,
confetti, notify, tvoff, glass, heartbeat.
