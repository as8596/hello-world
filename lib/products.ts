import type { Product, ProductCategory } from "./types";

/** Blind-box series — the heart of the collection. */
export const series: Product[] = [
  {
    id: "forest-folk",
    name: "Forest Folk Series",
    priceCents: 1499,
    category: "series",
    theme: "Woodland",
    icon: "leaf",
    gradient: ["#7a8a5f", "#e6dcc4"],
    isBlindBox: true,
    figureCount: 12,
    blurb:
      "Open a tiny door into the forest. Twelve woodland friends are waiting to be found — one mystery at a time.",
  },
  {
    id: "mushroom-hollow",
    name: "Mushroom Hollow Series",
    priceCents: 1499,
    category: "series",
    theme: "Toadstools",
    icon: "mushroom",
    gradient: ["#dca48e", "#e6dcc4"],
    isBlindBox: true,
    figureCount: 10,
    blurb:
      "Beneath every red-capped roof lives a little story. Collect the whole cozy village, cap by cap.",
  },
  {
    id: "lantern-festival",
    name: "Lantern Festival Series",
    priceCents: 1699,
    category: "series",
    theme: "Night Glow",
    icon: "lantern",
    gradient: ["#3b4a3a", "#a699b7"],
    isBlindBox: true,
    figureCount: 12,
    blurb:
      "When dusk settles over the hollow, the lanterns wake. A warm-lit series for quiet, glowing evenings.",
  },
  {
    id: "starlight-wanderers",
    name: "Starlight Wanderers Series",
    priceCents: 1699,
    category: "series",
    theme: "Celestial",
    icon: "shootingStar",
    gradient: ["#a699b7", "#e6dcc4"],
    isBlindBox: true,
    figureCount: 10,
    blurb:
      "Tiny dreamers chasing falling stars. Somewhere in this series hides a secret midnight wanderer.",
  },
  {
    id: "cozy-cottage",
    name: "Cozy Cottage Series",
    priceCents: 1599,
    category: "series",
    theme: "Home Life",
    icon: "jar",
    gradient: ["#3a2e24", "#e6dcc4"],
    isBlindBox: true,
    figureCount: 12,
    blurb:
      "Kettles on, blankets out. Little moments of everyday comfort, gathered into one warm collection.",
  },
  {
    id: "garden-sprites",
    name: "Garden Sprites Series",
    priceCents: 1599,
    category: "series",
    theme: "Tiny Fae",
    icon: "sprig",
    gradient: ["#7a8a5f", "#dca48e"],
    isBlindBox: true,
    figureCount: 10,
    blurb:
      "Small wings, smaller watering cans. The sprites have been tending the garden all along — meet them.",
  },
];

/** Themed merchandise & apparel. */
export const merch: Product[] = [
  {
    id: "hollow-dweller-pin",
    name: "Hollow Dweller Enamel Pin",
    priceCents: 1200,
    category: "accessory",
    theme: "Accessory",
    icon: "mushroom",
    gradient: ["#dca48e", "#a699b7"],
    blurb:
      "A little friend for your jacket, bag, or favorite tote. Soft enamel with a gentle gold outline.",
  },
  {
    id: "forest-sticker-sheet",
    name: "Forest Folk Sticker Sheet",
    priceCents: 800,
    category: "stationery",
    theme: "Stationery",
    icon: "leaf",
    gradient: ["#7a8a5f", "#e6dcc4"],
    blurb:
      "Twelve woodland friends to scatter across your journal, laptop, and letters to faraway people.",
  },
  {
    id: "lantern-tote",
    name: "Lantern Glow Tote Bag",
    priceCents: 2400,
    category: "accessory",
    theme: "Accessory",
    icon: "lantern",
    gradient: ["#3b4a3a", "#dca48e"],
    blurb:
      "Heavy cotton canvas printed with a softly glowing lantern scene. Roomy enough for a whole little haul.",
  },
  {
    id: "cozy-crewneck",
    name: "Cozy Cottage Crewneck",
    priceCents: 4800,
    category: "apparel",
    theme: "Apparel",
    icon: "jar",
    gradient: ["#3a2e24", "#e6dcc4"],
    blurb:
      "Brushed-fleece inside, storybook print outside. The kind of sweater that feels like a quiet afternoon.",
  },
  {
    id: "mushroom-mug",
    name: "Mushroom Hollow Mug",
    priceCents: 1800,
    category: "home",
    theme: "Home",
    icon: "mushroom",
    gradient: ["#dca48e", "#e6dcc4"],
    blurb:
      "Hand-glazed stoneware with a tiny toadstool village around the rim. Made for slow, warm mornings.",
  },
  {
    id: "storybook-tee",
    name: "Little Hollow Storybook Tee",
    priceCents: 3200,
    category: "apparel",
    theme: "Apparel",
    icon: "star",
    gradient: ["#a699b7", "#e6dcc4"],
    blurb:
      "Soft combed cotton with our hollow doorway crest. Wear a small world wherever the day takes you.",
  },
];

export const allProducts: Product[] = [...series, ...merch];

export const merchCategories: { value: ProductCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "apparel", label: "Apparel" },
  { value: "accessory", label: "Accessories" },
  { value: "home", label: "Home" },
  { value: "stationery", label: "Stationery" },
];

export function findProduct(id: string): Product | undefined {
  return allProducts.find((p) => p.id === id);
}
