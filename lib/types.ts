export type ProductCategory =
  | "series"
  | "apparel"
  | "accessory"
  | "home"
  | "stationery";

export type IconName =
  | "leaf"
  | "mushroom"
  | "lantern"
  | "star"
  | "shootingStar"
  | "jar"
  | "envelope"
  | "paw"
  | "sprig"
  | "cart"
  | "close"
  | "plus"
  | "minus"
  | "arrow"
  | "check";

export interface Product {
  id: string;
  name: string;
  priceCents: number;
  category: ProductCategory;
  /** Short, story-flavored description shown in the quick view. */
  blurb: string;
  /** Theme label rendered on the placeholder card, e.g. "Forest Series". */
  theme: string;
  icon: IconName;
  /** Two palette colors used for the placeholder gradient. */
  gradient: [string, string];
  /** Optional real photo under /public/products — swaps out the placeholder. */
  imageSrc?: string;
  isBlindBox?: boolean;
  /** Number of figures in a series, surfaced as a small detail. */
  figureCount?: number;
}

export interface CartItem {
  product: Product;
  qty: number;
}
