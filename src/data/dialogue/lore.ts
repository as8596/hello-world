/**
 * Lore entries for examinable point-of-interest markers (cairns, signs). Keyed
 * by `loreId` on a map's `marker` object. Pure flavor — read with E, no effect.
 */
export const LORE: Record<string, string[]> = {
  glade_cairn: [
    'A mossy cairn, older than the village.',
    'Stones stacked by wardens long gone — a marker for the spring, where the valley first learned to dream.',
  ],
  glade_spring: [
    'The Mistmere: still, dark water that never freezes.',
    'They say the bell was forged with water drawn from here. Your reflection looks half-asleep.',
  ],
  glade_hero: [
    'A standing stone, a Warden\'s face worn nearly smooth by rain.',
    'One candle still burns at its foot. Set here, the moss says, to watch the still water — and watching yet.',
  ],
  belltower_hero: [
    'A shrine to the Warden who fell holding this tower when the Hush first came.',
    'The candles never gutter. The carved hands cup an empty space — bell-shaped.',
  ],
  village_forge: [
    'A little roadside shrine: an anvil, a hammer, a guttered candle under a mossy roof.',
    'The smith who kept it sleeps now with the rest. The iron has not rusted.',
  ],
  warren_bones: [
    'A snarl of bramble and old bones, picked clean.',
    'Something denned here. Scratch-marks climb the thorn walls — and they are fresh.',
  ],
  warren_cache: [
    'A Warden\'s tomb, a carved stone coffer the brambles grew to hide.',
    'Candles burn low in the dark. Whoever laid them here never came back to tend them.',
  ],
};
