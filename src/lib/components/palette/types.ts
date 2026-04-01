import type { RGB } from '$lib/utils/palettes';

export interface ThemeTab {
  id: string;
  label: string;
}

export interface VariantItem {
  id: string;
  name: string;
  colorCount: number;
  colors: RGB[] | null;
  isCustom?: boolean;
  themeName?: string;
}
