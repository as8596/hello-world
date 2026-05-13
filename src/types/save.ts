export interface SaveMeta {
  slot: 0 | 1 | 2 | 3;
  isEmpty: boolean;
  timestamp?: number;
  locationName?: string;
  chapter?: number;
  playTime?: number;
  characterLevel?: number;
}
