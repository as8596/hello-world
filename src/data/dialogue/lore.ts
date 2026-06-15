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
  warren_bones: [
    'A snarl of bramble and old bones, picked clean.',
    'Something denned here. Scratch-marks climb the thorn walls — and they are fresh.',
  ],
  warren_cache: [
    'A warden\'s cache, tucked behind the thorns.',
    'Whoever hid it never came back for it.',
  ],
};
